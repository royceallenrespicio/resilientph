"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  align?: "start" | "center" | "end"
}

const emptySubscribe = () => () => {}

function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function ThemeToggle({ className, align = "end" }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme()
  const isMounted = useIsMounted()

  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-8 rounded-full text-muted-foreground", className)}
        aria-label="Toggle theme"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8 rounded-full text-muted-foreground hover:text-foreground", className)}
          aria-label="Select theme"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-muted-foreground" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="min-w-32 font-sans">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn("gap-2 text-xs font-medium cursor-pointer", theme === "light" && "bg-accent text-accent-foreground font-bold")}
        >
          <Sun className="size-3.5 text-amber-500" />
          <span>Light</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn("gap-2 text-xs font-medium cursor-pointer", theme === "dark" && "bg-accent text-accent-foreground font-bold")}
        >
          <Moon className="size-3.5 text-sky-400" />
          <span>Dark</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn("gap-2 text-xs font-medium cursor-pointer", theme === "system" && "bg-accent text-accent-foreground font-bold")}
        >
          <Laptop className="size-3.5 text-emerald-400" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
