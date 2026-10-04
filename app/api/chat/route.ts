import { NextResponse } from "next/server"
import { createGeminiModel } from "@/lib/chat/model"
import { BaseMessage, SystemMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages"
import { SYSTEM_PROMPT } from "@/lib/chat/prompts/system"
import { tools } from "@/lib/chat/tools"
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit"
import { createApiErrorResponse } from "@/lib/api/errors"
import { createClient } from "@/lib/supabase/server"
import { isAllowedOrigin } from "@/lib/api/origin"
import { chatRequestSchema } from "@/lib/api/schemas"
import { getCachedChatResponse, setCachedChatResponse, normalizeChatQuery } from "@/lib/chat/cache"

/** Rate limit config: anonymous users get 10 requests/hour, authenticated get 60. */
const ANON_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 }
const AUTH_RATE_LIMIT = { maxRequests: 60, windowMs: 60 * 60 * 1000 }

/** Maximum number of messages allowed in a single request to prevent abuse. */
const MAX_MESSAGE_LENGTH = 50
const MAX_PROMPT_LENGTH = 1500

/** Number of recent messages passed to the LLM (sliding window for token efficiency). */
const SLIDING_WINDOW_SIZE = 10

export async function POST(request: Request) {
  try {
    // 0. CSRF check (production only; local dev origins vary)
    if (process.env.NODE_ENV === "production" && !isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 })
    }

    // Determine authentication status
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Validate email confirmation for rate limit tier
    const isEmailConfirmed = user?.email_confirmed_at != null
    const useAuthRateLimit = user && isEmailConfirmed

    // Apply rate limiting based on auth status
    const clientIp = getClientIp(request)
    const rateLimitKey = useAuthRateLimit ? `chat:auth:${user.id}` : `chat:anon:${clientIp}`
    const rateLimitConfig = useAuthRateLimit ? AUTH_RATE_LIMIT : ANON_RATE_LIMIT

    const { allowed, remaining, resetAt } = await checkRateLimit(rateLimitKey, rateLimitConfig)

    if (!allowed) {
      const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000)
      const errorMessage = useAuthRateLimit
        ? "You've reached the hourly message limit. Please wait before sending more messages."
        : "You've reached the free message limit. Sign in and verify your email for a higher quota, or wait before trying again."

      return NextResponse.json(
        { error: errorMessage },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    const bodyResult = chatRequestSchema.safeParse(await request.json().catch(() => ({})))
    if (!bodyResult.success) {
      const errorMsg = bodyResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return NextResponse.json({ error: `Invalid request payload: ${errorMsg}` }, { status: 400 })
    }
    const { messages } = bodyResult.data

    if (messages.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message history too long. Maximum ${MAX_MESSAGE_LENGTH} messages per request.` },
        { status: 400 }
      )
    }

    // Validate latest message length
    const latestMessage = messages[messages.length - 1]?.content || ""
    if (latestMessage.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${MAX_PROMPT_LENGTH} characters per request.` },
        { status: 400 }
      )
    }

    // Check response cache for standalone / single-turn queries
    const normalizedKey = normalizeChatQuery(latestMessage)
    const isSingleTurn = messages.length === 1
    if (isSingleTurn && normalizedKey) {
      const cachedContent = await getCachedChatResponse(normalizedKey)
      if (cachedContent) {
        return NextResponse.json(
          {
            content: cachedContent,
            role: "assistant"
          },
          {
            headers: {
              "X-Cache": "HIT",
              "X-RateLimit-Remaining": String(remaining),
            },
          }
        )
      }
    }

    // Initialize the Gemini model via shared factory with token ceiling
    const model = createGeminiModel({ temperature: 0.5, maxOutputTokens: 1000 })
    const modelWithTools = model.bindTools(tools)

    const currentDateTime = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      dateStyle: "full",
      timeStyle: "long"
    })
    const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\nCurrent local time in the Philippines: ${currentDateTime}. Use this reference time when handling relative queries like "today", "yesterday", "earlier", or "this week".`

    // Apply sliding window (take last 10 messages to maximize token efficiency)
    const windowedMessages = messages.slice(-SLIDING_WINDOW_SIZE)

    // Convert client message format to LangChain message formats
    const langchainMessages: BaseMessage[] = [
      new SystemMessage(dynamicSystemPrompt),
      ...windowedMessages.map((m: { role: string; content: string }) => {
        if (m.role === "system") return new SystemMessage(m.content)
        if (m.role === "user") return new HumanMessage(m.content)
        return new AIMessage({ content: m.content })
      })
    ]

    // 1. Call the model
    let response = await modelWithTools.invoke(langchainMessages)

    // 2. Handle tool execution loops dynamically if requested by the model (up to 5 iterations)
    let iterations = 0
    const maxIterations = 5

    while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
      iterations++
      langchainMessages.push(response)

      const toolMessages: ToolMessage[] = []
      for (const call of response.tool_calls) {
        const matchedTool = tools.find(t => t.name === call.name)
        if (matchedTool) {
          const output = await (matchedTool as { invoke: (args: Record<string, unknown>) => Promise<unknown> }).invoke(call.args as Record<string, unknown>)
          toolMessages.push(new ToolMessage({
            content: typeof output === "string" ? output : JSON.stringify(output),
            tool_call_id: call.id || "",
            name: call.name,
          }))
        }
      }

      langchainMessages.push(...toolMessages)

      // Call the model again with tool responses
      response = await modelWithTools.invoke(langchainMessages)
    }

    const assistantContent = typeof response.content === "string"
      ? response.content
      : "Hindi ko nagawang kumuha ng tugon. Pakisubukan muli."

    // Cache the response for standalone/single-turn queries (5-minute TTL)
    if (isSingleTurn && normalizedKey && assistantContent) {
      await setCachedChatResponse(normalizedKey, assistantContent)
    }

    return NextResponse.json(
      {
        content: assistantContent,
        role: "assistant"
      },
      {
        headers: {
          "X-Cache": "MISS",
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    )

  } catch (err) {
    return createApiErrorResponse(err, "Chat API")
  }
}
