"use client"

import React, { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

interface PortalHeaderProps {
  title?: string
  className?: string
  id?: string
  sidebarTriggerId?: string
  titleId?: string
  children?: React.ReactNode
  centerContent?: React.ReactNode
}

export function PortalHeader({
  title = "ResilientPH",
  className,
  id,
  sidebarTriggerId = "portal-sidebar-trigger",
  titleId = "portal-header-brand-title",
  children,
  centerContent
}: PortalHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("")

  // Ticking Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      )
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header
      id={id}
      className={cn(
        "h-14 px-4 flex items-center justify-between shrink-0 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 select-none",
        className
      )}
    >
      {/* Left Side: Brand & Sidebar Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger
          className="text-muted-foreground hover:text-foreground shrink-0"
          id={sidebarTriggerId}
          aria-label="Toggle sidebar"
        />
        <h1
          className="text-base md:text-lg font-semibold tracking-tight text-foreground truncate"
          id={titleId}
        >
          {title}
        </h1>
      </div>

      {/* Center Content (Absolute centered for desktop) */}
      {centerContent && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center">
          {centerContent}
        </div>
      )}

      {/* Right Side: Page-Specific Actions Slot & Live Ticking Clock */}
      <div className="flex items-center gap-4 shrink-0">
        {children && (
          <div className="flex items-center gap-2 max-w-full">
            {children}
          </div>
        )}

        {children && <div className="h-4 w-px bg-border/40 shrink-0" />}

        {/* Clock Component & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <ThemeToggle />
          <div className="h-4 w-px bg-border/40 shrink-0" />
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-muted-foreground">
            <span className="text-foreground font-bold tabular-nums">{timeStr}</span>
            <span className="hidden md:inline text-[9px] text-muted-foreground/60 tracking-widest uppercase">
              PHT
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

