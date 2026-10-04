export interface Message {
  id: string
  role: "user" | "assistant"
  content: unknown
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  updatedAt: string
}
