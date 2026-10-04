import type { Conversation, Message } from "@/lib/chat/types"

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "resilientph_conversations_v1"

// ─── ID Generation ────────────────────────────────────────────────────────────
/** Generates a collision-resistant unique ID using the Web Crypto API. */
export function generateId(): string {
  return crypto.randomUUID()
}

/** Generates a unique message ID prefixed for readability. */
export function generateMessageId(): string {
  return `msg-${crypto.randomUUID()}`
}

// ─── Conversation Factory ─────────────────────────────────────────────────────
/** Creates a new empty conversation object with sensible defaults. */
export function createConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: generateId(),
    title: "New chat",
    messages: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── Message Factory ──────────────────────────────────────────────────────────
/** Creates a new message object with a generated ID and formatted timestamp. */
export function createMessage(
  role: Message["role"],
  content: unknown,
): Message {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

const MAX_CONVERSATIONS = 20

// ─── Persistence ──────────────────────────────────────────────────────────────
/** Reads all conversations from localStorage. Returns an empty array on failure or SSR. */
export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error("ChatStorage: failed to parse conversations from localStorage")
    return []
  }
}

/** Persists the full conversations array to localStorage. */
export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return

  try {
    // Sort by updatedAt descending (newest first) to preserve the most recent sessions
    const sorted = [...conversations].sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime()
      const timeB = new Date(b.updatedAt || 0).getTime()
      return timeB - timeA
    })

    // Prune the history to avoid exceeding localStorage quota limit
    const pruned = sorted.slice(0, MAX_CONVERSATIONS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned))
  } catch {
    console.error("ChatStorage: failed to write conversations to localStorage")
  }
}

// ─── Title Helpers ────────────────────────────────────────────────────────────
const TITLE_MAX_LENGTH = 32

/** Derives a conversation title from the first user message text. */
export function deriveTitleFromText(text: string): string {
  if (text.length <= TITLE_MAX_LENGTH) return text
  return `${text.slice(0, TITLE_MAX_LENGTH)}...`
}
