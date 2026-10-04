"use client"

import { motion } from "motion/react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface Suggestion {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  text: string
}

interface ChatWelcomeProps {
  suggestions: Suggestion[]
  sendMessage: (text: string) => void
  children?: React.ReactNode
}

export function ChatWelcome({ suggestions, sendMessage, children }: ChatWelcomeProps) {
  return (
    <motion.div
      key="empty-state-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex-1 w-full overflow-y-auto px-4 py-6 md:py-12 flex flex-col items-center"
    >
      {/* Decorative Grid Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-30 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="chat-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#chat-grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center my-auto">
        <div className="flex w-full min-w-0 flex-col items-center justify-center gap-4 text-center text-balance mb-6 md:mb-8 max-w-2xl bg-transparent flex-none">
          <div className="flex flex-col items-center gap-3 max-w-xl">
            <div className="mb-2 relative flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-transparent">
              <Avatar size="lg" noBorder className="shadow-sm bg-transparent">
                <AvatarImage src="/google-gemini-icon.svg" alt="Gemini" className="object-contain p-1" />
                <AvatarFallback className="bg-gradient-to-br from-success to-info text-white">
                  <Sparkles className="size-5" />
                </AvatarFallback>
              </Avatar>
            </div>

            <h2 className="font-pixel text-2xl md:text-3xl font-medium tracking-tight text-foreground">
              Hello, I&apos;m your AI Assistant
            </h2>

            <p className="text-[15px] leading-relaxed text-muted-foreground mt-1 max-w-md mx-auto [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary">
              I can help you monitor weather data, check recent earthquakes, and prepare disaster readiness plans. How can I assist you today?
            </p>
          </div>
        </div>

        {/* Centered Chat Input */}
        {children}

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl mt-4 md:mt-6">
          {suggestions.map((s, idx) => (
            <Button
              key={idx}
              variant="outline"
              onClick={() => sendMessage(s.text)}
              className="h-auto p-4 rounded-2xl bg-card border border-border/40 hover:border-border hover:bg-accent text-left flex flex-col items-start justify-start transition-all duration-300 hover:-translate-y-0.5 cursor-pointer shadow-sm whitespace-normal"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="size-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-foreground">{s.title}</p>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{s.desc}</p>
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
