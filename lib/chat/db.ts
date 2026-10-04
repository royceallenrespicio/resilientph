import { SupabaseClient } from "@supabase/supabase-js"
import type { Conversation } from "@/lib/chat/types"

interface DatabaseMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface DatabaseConversation {
  id: string
  title: string
  updated_at: string
  messages: DatabaseMessage[]
}

/** Fetches conversations and their messages from Supabase for a given user. */
export async function fetchDbConversations(supabase: SupabaseClient, userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      title,
      updated_at,
      messages (
        id,
        role,
        content,
        timestamp
      )
    `)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const convs = data as unknown as DatabaseConversation[] | null
  if (!convs) return []

  return convs.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updated_at,
    messages: (c.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    })).sort((a, b) => a.id.localeCompare(b.id))
  }))
}


/** Deletes a conversation and its messages from the database. */
export async function deleteDbConversation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
  if (error) {
    throw new Error(error.message)
  }
}

/** Inserts a message record in the database. */
export async function insertDbMessage(
  supabase: SupabaseClient,
  id: string,
  conversationId: string,
  role: string,
  content: string,
  timestamp: string
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .insert({
      id,
      conversation_id: conversationId,
      role,
      content,
      timestamp
    })
  if (error) {
    throw new Error(error.message)
  }
}

/** Updates a conversation's title and updatedAt timestamp in the database. */
export async function updateDbConversation(
  supabase: SupabaseClient,
  id: string,
  title: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .upsert({
      id,
      title,
      user_id: userId,
      updated_at: new Date().toISOString()
    })
  if (error) {
    throw new Error(error.message)
  }
}
