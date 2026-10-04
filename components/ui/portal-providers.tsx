"use client"

import React, { ViewTransition } from "react"
import "@/lib/view-transition-guard"
import { ChatProvider, useChat } from "@/components/chat/context/ChatProvider"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatSidebar } from "@/components/chat/views/ChatSidebar"
import { ErrorBoundary } from "@/components/ui/error-boundary"

/**
 * Client-side providers and layout shell for the portal.
 * Extracted from the layout to allow the parent layout.tsx to remain a Server Component
 * so that child pages can export metadata (title, description, etc.) for SEO.
 */
export function PortalProviders({ children, defaultOpen = true }: { children: React.ReactNode, defaultOpen?: boolean }) {
  return (
    <TooltipProvider>
      <ChatProvider defaultSidebarOpen={defaultOpen}>
        <PortalLayoutContent>{children}</PortalLayoutContent>
      </ChatProvider>
    </TooltipProvider>
  )
}

function PortalLayoutContent({ children }: { children: React.ReactNode }) {
  const { desktopSidebarOpen, handleSidebarChange } = useChat()




  return (
    <SidebarProvider
      className="h-screen w-full overflow-hidden"
      open={desktopSidebarOpen}
      onOpenChange={handleSidebarChange}
    >
      <ChatSidebar />
      <SidebarInset className="flex-1 flex flex-col h-full min-w-0 relative z-10 bg-background pb-16 md:pb-0">
        <ErrorBoundary>
          <ViewTransition
            enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-in" }}
            exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-out" }}
            default="fade-in"
          >
            {children}
          </ViewTransition>
        </ErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
  )
}
