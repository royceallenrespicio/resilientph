import React from "react"
import { cookies } from "next/headers"
import { PortalProviders } from "@/components/ui/portal-providers"

/**
 * Server Component layout for portal routes.
 * Delegates client-side providers to PortalProviders so that child pages
 * can export `metadata` for SEO (title, description, etc.).
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true

  return (
    <PortalProviders defaultOpen={defaultOpen}>{children}</PortalProviders>
  )
}
