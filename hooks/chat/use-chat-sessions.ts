import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"
import { User, SupabaseClient } from "@supabase/supabase-js"
import {
  loadConversations,
  saveConversations,
  createConversation,
  createMessage,
  deriveTitleFromText,
} from "@/lib/chat/storage"
import {
  fetchDbConversations,
  deleteDbConversation,
  insertDbMessage,
  updateDbConversation,
} from "@/lib/chat/db"
import { sendChatRequest } from "@/lib/chat/api"

import type { Message, Conversation } from "@/lib/chat/types"

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useConversations(supabase: SupabaseClient) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Refs to snapshot current state — keeps callbacks stable without adding
  // conversations/activeId/loading to dependency arrays.
  const conversationsRef = useRef(conversations)
  const activeIdRef = useRef(activeId)
  const loadingRef = useRef(loading)
  const userRef = useRef<User | null>(user)
  const isHydrated = useRef(false)
  const hydratedUserId = useRef<string | null>(null)

  // Sync refs inside an effect to satisfy React 19 lint rules
  // (refs must not be written during render).
  useEffect(() => {
    conversationsRef.current = conversations
    activeIdRef.current = activeId
    loadingRef.current = loading
    userRef.current = user
  })

  // ── Retrieve User and Subscribe to Auth Changes ─────────────────────────────
  useEffect(() => {
    // Fetch initial user session using the passed Supabase client instance
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen to login/logout events to automatically reload or clear chat
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // ── Load conversations from DB (if user exists) or LocalStorage ─────────────
  useEffect(() => {
    const currentUser = user

    if (currentUser) {
      // Skip redundant hydration runs if already hydrated for this user ID
      if (hydratedUserId.current === currentUser.id) {
        return
      }

      isHydrated.current = false
      hydratedUserId.current = currentUser.id

      // Load conversations and messages from DB
      fetchDbConversations(supabase, currentUser.id)
        .then((formatted) => {
          // Double check user hasn't changed since request went out
          if (userRef.current?.id !== currentUser.id) return

          if (formatted.length > 0) {
            setConversations(formatted)
            setActiveId(formatted[0].id)
          } else {
            // Create initial conversation in local state only (lazy DB creation)
            const initial = createConversation()
            setConversations([initial])
            setActiveId(initial.id)
          }
          isHydrated.current = true
        })
        .catch((err: unknown) => {
          if (userRef.current?.id !== currentUser.id) return
          const msg = err instanceof Error ? err.message : "Unknown error"
          console.error("Failed to load conversations from database:", msg)
          toast.error("Failed to load conversations from server.")
        })
    } else {
      // Skip redundant offline hydration
      if (hydratedUserId.current === "offline") {
        return
      }
      isHydrated.current = false
      hydratedUserId.current = "offline"

      // Offline/Anonymous fallback
      const saved = loadConversations()
      setTimeout(() => {
        // Abort local load if user logs in before timeout fires
        if (userRef.current) return
        if (saved.length > 0) {
          setConversations(saved)
          setActiveId(saved[0].id)
        } else {
          const initial = createConversation()
          setConversations([initial])
          setActiveId(initial.id)
        }
        isHydrated.current = true
      }, 0)
    }
  }, [user, supabase])

  // ── Persist offline changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isHydrated.current) return
    // Only save to localStorage if not authenticated to prevent state duplication/conflict
    if (!user) {
      saveConversations(conversations)
    }
  }, [conversations, user])

  // ── Send message to a specific conversation ID ─────────────────────────────
  const sendMessageToId = useCallback(async (targetId: string, text: string) => {
    if (!text.trim() || loadingRef.current || !targetId) return

    const currentConv = conversationsRef.current.find(
      (c) => c.id === targetId
    )
    if (!currentConv) return

    // Build user message
    const userMsg = createMessage("user", text)
    const updatedMessages = [...currentConv.messages, userMsg]
    const newTitle =
      currentConv.messages.length === 0
        ? deriveTitleFromText(text)
        : currentConv.title

    // Optimistic update
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? { ...c, title: newTitle, messages: updatedMessages, updatedAt: new Date().toISOString() }
          : c
      )
    )
    setInputMessage("")
    setLoading(true)

    // Save to DB if authenticated
    const currentUser = userRef.current
    if (currentUser) {
      try {
        // Upsert/update conversation title and updatedAt timestamp
        await updateDbConversation(supabase, targetId, newTitle, currentUser.id)

        // Insert message
        await insertDbMessage(
          supabase,
          userMsg.id,
          targetId,
          userMsg.role,
          String(userMsg.content),
          userMsg.timestamp
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.error("Failed to sync message to DB:", msg)
      }
    }

    try {
      const responseContent = await sendChatRequest(updatedMessages)
      const assistantMsg = createMessage("assistant", responseContent)

      // Append assistant reply using functional update to avoid stale closures
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetId) return c

          const messages = [...c.messages]
          if (!messages.some((m) => m.id === userMsg.id)) {
            messages.push(userMsg)
          }
          messages.push(assistantMsg)

          return { ...c, messages, updatedAt: new Date().toISOString() }
        })
      )

      // Save assistant reply to DB if authenticated
      if (currentUser) {
        try {
          await insertDbMessage(
            supabase,
            assistantMsg.id,
            targetId,
            assistantMsg.role,
            String(assistantMsg.content),
            assistantMsg.timestamp
          )
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error"
          console.error("Failed to sync assistant message to DB:", msg)
        }
      }

    } catch (err: unknown) {
      console.error(err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // ── Create new conversation ─────────────────────────────────────────────────
  const createNewConversation = useCallback(async (initialPrompt?: string) => {
    const newConv = createConversation()

    setConversations((prev) => {
      // Prevent spam: if the top conversation is already empty, just switch to it.
      if (prev.length > 0 && prev[0].messages.length === 0) {
        setActiveId(prev[0].id)
        if (initialPrompt) {
          setTimeout(() => sendMessageToId(prev[0].id, initialPrompt), 0)
        }
        return prev
      }

      setActiveId(newConv.id)
      if (initialPrompt) {
        setTimeout(() => sendMessageToId(newConv.id, initialPrompt), 0)
      }
      return [newConv, ...prev]
    })
  }, [sendMessageToId])

  // ── Delete conversation ─────────────────────────────────────────────────────
  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const currentUser = userRef.current
    if (currentUser) {
      try {
        await deleteDbConversation(supabase, id)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.error("Failed to delete conversation from DB:", msg)
        toast.error("Failed to delete conversation on server.")
        return
      }
    }

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id)

      if (filtered.length === 0) {
        // Always keep at least one conversation (lazy creation)
        const fallback = createConversation()
        setActiveId(fallback.id)
        return [fallback]
      }

      // If the deleted conversation was active, switch to the first remaining one
      setActiveId((currentActiveId) =>
        currentActiveId === id ? filtered[0].id : currentActiveId
      )
      return filtered
    })

    toast.success("Conversation deleted")
  }, [supabase])

  // ── Derived selectors ───────────────────────────────────────────────────────
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  )

  const hasMessages = useMemo(
    () => !!(activeConversation && activeConversation.messages.length > 0),
    [activeConversation]
  )

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    await sendMessageToId(activeIdRef.current, text)
  }, [sendMessageToId])

  // ── Save temporary conversation ─────────────────────────────────────────────
  const saveTemporaryConversation = useCallback(async (messages: Message[]) => {
    if (messages.length === 0) return null

    const newConv = createConversation()
    const newTitle = deriveTitleFromText(String(messages[0].content))
    const convWithMessages = { ...newConv, title: newTitle, messages, updatedAt: new Date().toISOString() }

    setConversations((prev) => [convWithMessages, ...prev])
    setActiveId(newConv.id)

    const currentUser = userRef.current
    if (currentUser) {
      try {
        await updateDbConversation(supabase, newConv.id, newTitle, currentUser.id)

        // Insert all messages
        for (const msg of messages) {
          await insertDbMessage(
            supabase,
            msg.id,
            newConv.id,
            msg.role,
            String(msg.content),
            msg.timestamp
          )
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.error("Failed to save temporary conversation to DB:", msg)
        toast.error("Failed to save conversation to server.")
      }
    }

    toast.success("Conversation saved")
    return newConv.id
  }, [supabase])

  // ── Public API ──────────────────────────────────────────────────────────────
  return {
    conversations,
    activeId,
    setActiveId,
    inputMessage,
    setInputMessage,
    loading,
    createNewConversation,
    deleteConversation,
    sendMessage,
    saveTemporaryConversation,
    activeConversation,
    hasMessages,
  }
}
