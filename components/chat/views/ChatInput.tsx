import { useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ChatInputProps {
  inputMessage: string
  setInputMessage: (text: string) => void
  sendMessage: (text: string) => void
  loading: boolean
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  sendMessage,
  loading
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [inputMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  return (
    <footer className="w-full bg-background shrink-0 px-4 pb-6 pt-2">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 bg-card border border-border/80 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 rounded-[2rem] p-2 pl-5 pr-2 shadow-sm min-h-[56px] transition-all duration-200"
          id="chat-message-form"
        >
          {/* Main Input Field */}
          <div className="flex-1 relative flex items-center">
            <Label htmlFor="chat-message-input" className="sr-only">
              Ask about evacuation plans, weather reports, or family go bags…
            </Label>
            <Textarea
              id="chat-message-input"
              name="message"
              ref={textareaRef}
              placeholder="Ask about evacuation plans, weather reports, or family go bags…"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full bg-transparent border-none focus-visible:ring-0 resize-none text-[15px] leading-5 max-h-32 min-h-[40px] py-2.5 px-1 text-foreground placeholder:text-muted-foreground/70 overflow-hidden block shadow-none"
              disabled={loading}
              rows={1}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (inputMessage.trim() && !loading) {
                    handleSubmit(e);
                  }
                }
              }}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              id="chat-submit-btn"
              type="submit"
              size="icon"
              disabled={loading || !inputMessage.trim()}
              aria-label="Send message"
              className={`h-[40px] w-[40px] rounded-full transition-colors flex items-center justify-center shrink-0 ${inputMessage.trim() && !loading
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
                : "bg-transparent text-muted-foreground/30 hover:bg-transparent cursor-not-allowed"
                }`}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </footer>
  )
}
