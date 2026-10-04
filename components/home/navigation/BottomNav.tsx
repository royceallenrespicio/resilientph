"use client"

import { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Map, MessageSquare, CloudSun, PhoneCall } from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  transitionType: string
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: LayoutDashboard,
    transitionType: "nav-back"
  },
  {
    label: "Map",
    href: "/map",
    icon: Map,
    transitionType: "nav-forward"
  },
  {
    label: "Ask",
    href: "/chat",
    icon: MessageSquare,
    transitionType: "nav-forward"
  },
  {
    label: "Radar",
    href: "/pagasa",
    icon: CloudSun,
    transitionType: "nav-forward"
  },
  {
    label: "Call",
    href: "/emergency",
    icon: PhoneCall,
    transitionType: "nav-forward"
  }
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide BottomNav on authentication routes
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/callback")
  if (isAuthPage) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] border-t border-border bg-card/85 backdrop-blur-md px-6 flex items-center justify-around rounded-t-2xl shadow-lg" aria-label="Mobile navigation bar">
      {NAV_ITEMS.map((item, index) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        // Calculate transition type dynamically based on current route index
        const currentIndex = NAV_ITEMS.findIndex((nav) => nav.href === pathname)
        const transitionType = currentIndex !== -1 && index < currentIndex ? "nav-back" : "nav-forward"

        return (
          <Link
            key={item.href}
            id={`bottom-nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            href={item.href}
            // Tag with the transition type for directional view transitions
            transitionTypes={[transitionType]}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full py-1 transition-colors ${isActive
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
              }`}
            aria-label={`Go to ${item.label}`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
              <Icon className="size-5 shrink-0" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium tracking-wide font-sans leading-none">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
