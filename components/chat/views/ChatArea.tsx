import { motion, AnimatePresence } from "motion/react"
import { Sparkles, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { Conversation } from "@/lib/chat/types"
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
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker } from "@/components/ui/marker"

interface ChatAreaProps {
  activeConversation: Conversation | undefined
  loading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

const extractTextContent = (content: unknown): string => {
  if (!content) return ""
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map(block => {
        if (typeof block === "string") return block
        if (block && typeof block === "object" && "text" in block) {
          return String((block as { text?: unknown }).text || "")
        }
        return ""
      })
      .join("")
  }
  if (typeof content === "object") {
    const obj = content as Record<string, unknown>
    return String(obj.text || obj.thought || JSON.stringify(obj))
  }
  return ""
}

export function ChatArea({
  activeConversation,
  loading,
  messagesEndRef
}: ChatAreaProps) {

  if (!activeConversation || activeConversation.messages.length === 0) {
    return null
  }

  return (
    <MessageScrollerProvider>
      <MessageScroller className="flex-1 min-h-0 w-full bg-background">
        <MessageScrollerViewport className="p-4 md:px-8 lg:px-24">
          <MessageScrollerContent className="max-w-4xl mx-auto pb-2 sm:pb-8 mt-4 sm:mt-6 w-full gap-4 sm:gap-6">
            <AnimatePresence initial={false}>
              {activeConversation.messages.map((msg) => {
                const isUser = msg.role === "user"
                const textContent = extractTextContent(msg.content)

                return (
                  <MessageScrollerItem key={msg.id} messageId={msg.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      <Message align={isUser ? "end" : "start"} className="gap-4">
                        {!isUser && (
                          <MessageAvatar className="bg-transparent size-8 self-start">
                            <Avatar noBorder className="size-8 shrink-0 bg-transparent">
                              <AvatarImage src="/google-gemini-icon.svg" alt="Gemini" className="object-contain p-0.5" />
                              <AvatarFallback className="bg-gradient-to-br from-success to-info text-white shadow-lg shadow-success/20">
                                <Sparkles className="size-4" />
                              </AvatarFallback>
                            </Avatar>
                          </MessageAvatar>
                        )}

                        <MessageContent>
                          <Bubble variant={isUser ? "muted" : "ghost"}>
                            <BubbleContent className={cn(
                              isUser
                                ? "px-5 py-3.5 text-[15px] leading-relaxed rounded-3xl bg-muted/80 border border-border/40 text-foreground rounded-tr-md max-w-full"
                                : "text-[15px] leading-relaxed p-0 text-foreground"
                            )}>
                              <div className="whitespace-pre-wrap">
                                {textContent}
                              </div>
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </motion.div>
                  </MessageScrollerItem>
                )
              })}
            </AnimatePresence>

            {loading && (
              <Message align="start" className="gap-4">
                <MessageAvatar className="bg-transparent size-8 self-start">
                  <Avatar noBorder className="size-8 shrink-0 animate-pulse bg-transparent">
                    <AvatarImage src="/google-gemini-icon.svg" alt="Gemini" className="object-contain p-0.5" />
                    <AvatarFallback className="bg-gradient-to-br from-success to-info text-white shadow-lg shadow-success/20">
                      <Sparkles className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
                <MessageContent className="pt-2">
                  <Marker className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </Marker>
                </MessageContent>
              </Message>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

