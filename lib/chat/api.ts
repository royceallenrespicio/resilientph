import type { Message } from "@/lib/chat/types"

// ─── Constants ────────────────────────────────────────────────────────────────
const CHAT_ENDPOINT = "/api/chat"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChatRequestPayload {
  messages: { role: Message["role"]; content: unknown }[]
}

export interface ChatResponseData {
  content: string
}

// ─── API Client ───────────────────────────────────────────────────────────────
/**
 * Sends a message history to the chat API and returns the assistant's response content.
 * Throws on network or server errors with a descriptive message.
 */
export async function sendChatRequest(messages: Message[]): Promise<string> {
  const payload: ChatRequestPayload = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  }

  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error ||
      "Failed to communicate with LLM agent."
    )
  }

  const data: ChatResponseData = await response.json()
  return data.content || "No response received."
}
