import { NextResponse } from "next/server"
import { createGeminiModel } from "@/lib/chat/model"
import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { createApiErrorResponse } from "@/lib/api/errors"
import { createClient } from "@/lib/supabase/server"
import { MODERATION_SYSTEM_PROMPT } from "@/lib/chat/prompts/moderation"
import { isAllowedOrigin } from "@/lib/api/origin"
import { moderateRequestSchema } from "@/lib/api/schemas"

/** Rate limit: Authenticated users only, 15 requests per hour. */
const RATE_LIMIT_CONFIG = { maxRequests: 15, windowMs: 60 * 60 * 1000 }

const MAX_DESCRIPTION_LENGTH = 1000

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

    // Validate email confirmation for moderation features
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Forbidden. You must verify your email address to submit community reports." },
        { status: 403 }
      )
    }

    // 2. Enforce Rate Limiting (15 req/hour)
    const rateLimitKey = `moderate:auth:${user.id}`
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
    const bodyResult = moderateRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!bodyResult.success) {
      const errorMsg = bodyResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return NextResponse.json({ error: `Invalid request payload: ${errorMsg}` }, { status: 400 })
    }
    const { category, description, imageUrl } = bodyResult.data

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description too long. Maximum ${MAX_DESCRIPTION_LENGTH} characters allowed.` },
        { status: 400 }
      )
    }

    // 4. Initialize Gemini Model via shared factory
    const model = createGeminiModel({ temperature: 0 })

    // Construct multimodal human prompt content
    const contentArray: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `Please evaluate the following report:
Category: ${category}
Description: ${description}`,
      },
    ]

    // If an image URL is supplied, attach it for multimodal verification
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

    // 5. Invoke Gemini
    const result = await model.invoke(langchainMessages)
    let contentText = typeof result.content === "string" ? result.content : ""

    // Extract JSON substring to prevent markdown formatting parsing issues
    const firstBrace = contentText.indexOf("{")
    const lastBrace = contentText.lastIndexOf("}")
    if (firstBrace !== -1 && lastBrace !== -1) {
      contentText = contentText.substring(firstBrace, lastBrace + 1)
    }

    let moderationResult: { approved: boolean; reason: string; severity?: "low" | "moderate" | "high" | "critical" }
    try {
      moderationResult = JSON.parse(contentText)
    } catch (e) {
      console.error("[Moderation API] Failed to parse moderation JSON:", contentText, e)
      moderationResult = {
        approved: true,
        reason: "Automatically approved due to parsing fallback.",
        severity: "moderate",
      }
    }

    return NextResponse.json(
      {
        ...moderationResult,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    )
  } catch (err) {
    return createApiErrorResponse(err, "Report Moderation API")
  }
}
