import { NextResponse } from "next/server"
import { createGeminiModel } from "@/lib/chat/model"
import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { createApiErrorResponse } from "@/lib/api/errors"
import { createClient } from "@/lib/supabase/server"
import { isAllowedOrigin } from "@/lib/api/origin"
import { MODERATION_SYSTEM_PROMPT } from "@/lib/chat/prompts/moderation"
import { createIncidentReport, IncidentCategory, IncidentSeverity } from "@/lib/supabase/reports"
import { reportRequestSchema } from "@/lib/api/schemas"

/** Rate limit: Authenticated users only, 15 requests per hour. */
const RATE_LIMIT_CONFIG = { maxRequests: 15, windowMs: 60 * 60 * 1000 }

export async function POST(request: Request) {
  try {
    // 0. CSRF check (production only; local dev origins vary)
    if (process.env.NODE_ENV === "production" && !isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 })
    }

    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in to submit community reports." },
        { status: 401 }
      )
    }

    // Validate email confirmation for reporting
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Forbidden. You must verify your email address to submit community reports." },
        { status: 403 }
      )
    }

    // 2. Enforce Rate Limiting (15 req/hour)
    const rateLimitKey = `report:auth:${user.id}`
    const { allowed, remaining, resetAt } = await checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG)

    if (!allowed) {
      const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: "You've reached your report submission rate limit. Please wait before submitting more reports." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    // 3. Parse and validate request payload
    const bodyResult = reportRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!bodyResult.success) {
      const errorMsg = bodyResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return NextResponse.json({ error: `Invalid request payload: ${errorMsg}` }, { status: 400 })
    }
    const { category, subType, description, latitude, longitude, imageUrl, isAnonymous } = bodyResult.data

    // 4. Run AI Moderation & Severity Estimation via shared factory
    const model = createGeminiModel({ temperature: 0 })

    // Construct multimodal human prompt content
    const contentArray: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `Please evaluate the following report:
Category: ${category}
Description: ${description || ""}`,
      },
    ]

    if (imageUrl) {
      contentArray.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      })
    }

    const langchainMessages: BaseMessage[] = [
      new SystemMessage(MODERATION_SYSTEM_PROMPT),
      new HumanMessage({ content: contentArray as unknown as string }),
    ]

    const result = await model.invoke(langchainMessages)
    let contentText = typeof result.content === "string" ? result.content : ""

    // Extract JSON substring
    const firstBrace = contentText.indexOf("{")
    const lastBrace = contentText.lastIndexOf("}")
    if (firstBrace !== -1 && lastBrace !== -1) {
      contentText = contentText.substring(firstBrace, lastBrace + 1)
    }

    let moderationResult: { approved: boolean; reason: string; severity?: IncidentSeverity }
    try {
      moderationResult = JSON.parse(contentText)
    } catch (e) {
      console.error("[Reports API] Failed to parse moderation JSON:", contentText, e)
      moderationResult = {
        approved: true,
        reason: "Automatically approved due to parsing fallback.",
        severity: "moderate"
      }
    }

    if (moderationResult.approved === false) {
      return NextResponse.json(
        { error: `Safety Moderation Warning: ${moderationResult.reason || "The report failed safety checks."}` },
        { status: 400 }
      )
    }

    const estimatedSeverity = moderationResult.severity || "moderate"

    // 5. Create Incident Report in database
    const reportData = {
      user_id: isAnonymous ? null : user.id,
      category: category as IncidentCategory,
      sub_type: subType as string,
      description: description || null,
      severity: estimatedSeverity as IncidentSeverity,
      latitude: Number(latitude),
      longitude: Number(longitude),
      image_url: imageUrl || null,
      status: 'active' as const
    }

    const inserted = await createIncidentReport(supabase, reportData)

    return NextResponse.json(inserted, {
      headers: {
        "X-RateLimit-Remaining": String(remaining),
      },
    })
  } catch (err) {
    return createApiErrorResponse(err, "Report Submission API")
  }
}
