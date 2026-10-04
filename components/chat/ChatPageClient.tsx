"use client"

import { useEffect, useRef } from "react"
import { CloudSun, Activity, PhoneCall, ShieldAlert } from "lucide-react"
import { ChatWelcome, Suggestion } from "@/components/chat/views/ChatWelcome"
import { AnimatePresence, motion } from "motion/react"
import { ChatArea } from "@/components/chat/views/ChatArea"
import { ChatInput } from "@/components/chat/views/ChatInput"
import { useChat } from "@/components/chat/context/ChatProvider"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { PortalHeader } from "@/components/ui/portal-header"

const SUGGESTIONS: Suggestion[] = [
  {
    icon: CloudSun,
    title: "Weather & Warnings",
    desc: "Check current weather and warnings for your location",
    text: "Is there a weather forecast and any active warnings for my location?"
  },
  {
    icon: Activity,
    title: "Earthquake Reports",
    desc: "Check for recent earthquakes near your location",
    text: "Is there an earthquake right now at my location? If not, please report the latest earthquake in the Philippines from PHIVOLCS or USGS."
  },
  {
    icon: PhoneCall,
    title: "Emergency Hotlines",
    desc: "Disaster response and rescue contacts",
    text: "Provide a list of critical emergency response hotlines in the Philippines."
  },
  {
    icon: ShieldAlert,
    title: "Go Bag Checklist",
    desc: "Essential checklist for family disaster readiness",
    text: "What should be in my emergency family go bag for typhoons?"
  }
]

export default function ChatPageClient() {
  const {
    conversations,
    activeId,
    inputMessage,
    setInputMessage,
    loading,
    sendMessage,
    activeConversation,
    hasMessages,
    createNewConversation
  } = useChat()

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations, activeId, loading])

  // Guard so the URL prompt is consumed exactly once
  const promptConsumedRef = useRef(false)

  // Handle auto-sending initial prompt from URL query params (e.g., from weather analyze link)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (promptConsumedRef.current) return

    const params = new URLSearchParams(window.location.search)
    const promptParam = params.get("prompt")
    const newParam = params.get("new")

    if (promptParam && conversations.length > 0 && !loading) {
      promptConsumedRef.current = true

      // Clear search parameters to avoid re-triggering on page refresh
      const url = new URL(window.location.href)
      url.searchParams.delete("prompt")
      url.searchParams.delete("new")
      window.history.replaceState({}, "", url.pathname + url.search)

      if (newParam === "true") {
        // Auto-create new conversation and send initial prompt
        createNewConversation(promptParam)
      } else {
        // Auto-send to active conversation
        sendMessage(promptParam)
      }
    }
  }, [conversations, loading, sendMessage, createNewConversation])

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative bg-background">
      {/* Top Header */}
      <PortalHeader
        title="AI Assistant"
        id="chat-header"
        sidebarTriggerId="chat-sidebar-trigger"
        titleId="chat-page-heading"
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-h-0 relative w-full">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <ChatWelcome suggestions={SUGGESTIONS} sendMessage={sendMessage}>
              {/* Centered Chat Input */}
              <motion.div
                layoutId="chat-input-wrapper"
                className="w-full max-w-3xl z-20"
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <ChatInput
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  sendMessage={sendMessage}
                  loading={loading}
                />
              </motion.div>
            </ChatWelcome>
          ) : (
            <motion.div
              key="active-state-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <ErrorBoundary>
                <ChatArea
                  activeConversation={activeConversation}
                  loading={loading}
                  messagesEndRef={messagesEndRef}
                />
              </ErrorBoundary>

              {/* Bottom Chat Input */}
              <motion.div
                layoutId="chat-input-wrapper"
                className="w-full shrink-0 z-20"
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <ChatInput
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  sendMessage={sendMessage}
                  loading={loading}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
