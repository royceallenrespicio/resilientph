"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useConversations } from "@/hooks/chat/use-chat-sessions"

type ChatContextType = ReturnType<typeof useConversations> & {
  user: User | null
  checkingAuth: boolean
  handleLogout: () => Promise<void>
  desktopSidebarOpen: boolean
  setDesktopSidebarOpen: (open: boolean) => void
  handleSidebarChange: (open: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, defaultSidebarOpen = true }: { children: React.ReactNode, defaultSidebarOpen?: boolean }) {
  const supabase = useMemo(() => createClient(), [])
  const chatState = useConversations(supabase)
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(defaultSidebarOpen)

  const handleSidebarChange = (open: boolean) => {
    setDesktopSidebarOpen(open)
    // The SidebarProvider manages the cookie sync automatically.
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (e) {
        console.error("Auth check failed:", e)
      } finally {
        setCheckingAuth(false)
      }
    }
    fetchUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success("Signed out successfully.")
  }

  return (
    <ChatContext.Provider
      value={{
        ...chatState,
        user,
        checkingAuth,
        handleLogout,
        desktopSidebarOpen,
        setDesktopSidebarOpen,
        handleSidebarChange,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
