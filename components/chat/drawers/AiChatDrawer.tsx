"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, Save, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { sendChatRequest } from "@/lib/chat/api"
import { useChat } from "@/components/chat/context/ChatProvider"
import type { Message as ChatMessage } from "@/lib/chat/types"
import { createMessage } from "@/lib/chat/storage"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"
import {
  Message,
  MessageContent,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker } from "@/components/ui/marker"

export interface AiChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPrompt: string
}

export function AiChatDrawer({ open, onOpenChange, initialPrompt }: AiChatDrawerProps) {
  const router = useRouter()
  const { saveTemporaryConversation } = useChat()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [savedConvId, setSavedConvId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [dontRemindAgain, setDontRemindAgain] = useState(false)

  const handleSend = async (text: string, currentMessagesOverride?: ChatMessage[]) => {
    if (!text.trim() || loading) return

    const userMsg = createMessage("user", text)
    const baseMessages = currentMessagesOverride ?? messages
    const updatedMessages = [...baseMessages, userMsg]

    setMessages(updatedMessages)
    setInputMessage("")
    setLoading(true)

    try {
      const responseContent = await sendChatRequest(updatedMessages)
      const assistantMsg = createMessage("assistant", responseContent)
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : "Something went wrong."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Reset and trigger initial prompt when opened
  useEffect(() => {
    if (open && initialPrompt) {
      const timeoutId = setTimeout(() => {
        setMessages([])
        setSavedConvId(null)
        handleSend(initialPrompt, [])
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPrompt])



  const handleSave = async () => {
    if (!saveTemporaryConversation || messages.length === 0 || isSaving) return
    setIsSaving(true)
    try {
      const id = await saveTemporaryConversation(messages)
      if (id) {
        setSavedConvId(id)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChat = () => {
    if (savedConvId) {
      router.push(`/chat?id=${savedConvId}`)
    } else {
      router.push(`/chat?prompt=${encodeURIComponent(initialPrompt)}`)
    }
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Check if there are active messages and it's not saved
      if (messages.length > 0 && !savedConvId) {
        try {
          const skipWarning = sessionStorage.getItem("resilientph_skip_close_warning_v1")
          if (skipWarning === "true") {
            onOpenChange(false)
            return
          }
        } catch (e) {
          console.error("Session storage access error:", e)
        }
        // Show confirmation dialog instead
        setShowConfirmClose(true)
        return
      }
    }
    onOpenChange(newOpen)
  }

  const confirmClose = () => {
    if (dontRemindAgain) {
      try {
        sessionStorage.setItem("resilientph_skip_close_warning_v1", "true")
      } catch (e) {
        console.error("Session storage access error:", e)
      }
    }
    setShowConfirmClose(false)
    onOpenChange(false)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex h-[85vh] max-h-[85vh] flex-col">
          <DrawerHeader className="border-b px-4 py-4 md:px-6">
            <DrawerTitle>AI Assistant</DrawerTitle>
            <DrawerDescription>Quick analysis and assistance.</DrawerDescription>
          </DrawerHeader>

          <MessageScrollerProvider>
            <MessageScroller className="flex-1 min-h-0 w-full">
              <MessageScrollerViewport className="p-4 md:p-6">
                <MessageScrollerContent className="w-full gap-4">
                  {messages.map((msg) => {
                    const isUser = msg.role === "user"
                    return (
                      <MessageScrollerItem key={msg.id} messageId={msg.id}>
                        <Message align={isUser ? "end" : "start"}>
                          <MessageContent>
                            <Bubble variant={isUser ? "default" : "muted"} className="max-w-[85%]">
                              <BubbleContent className="text-sm leading-relaxed px-3.5 py-2.5">
                                <span className="whitespace-pre-wrap">
                                  {String(msg.content)}
                                </span>
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    )
                  })}
                  {loading && (
                    <Message align="start">
                      <MessageContent>
                        <Bubble variant="muted" className="max-w-[85%]">
                          <BubbleContent className="p-3">
                            <Marker className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </Marker>
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>


          <DrawerFooter className="border-t px-4 py-4 flex flex-col gap-3 md:px-6">
            <div className="flex gap-2">
              {!savedConvId ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleSave}
                  disabled={messages.length === 0 || loading || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3.5 w-3.5" />
                  )}
                  {isSaving ? "Saving..." : "Save Conversation"}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleOpenChat}
                >
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Open in Chat
                </Button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend(inputMessage)
              }}
              className="flex gap-2"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a follow-up question..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!inputMessage.trim() || loading}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing this drawer will discard your temporary conversation. If you want to keep it, you can save it first.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="dont-remind"
              checked={dontRemindAgain}
              onCheckedChange={(checked) => setDontRemindAgain(!!checked)}
            />
            <Label htmlFor="dont-remind">Don&apos;t remind me again</Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep chatting</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Close anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
