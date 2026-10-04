import ProfilePageClient from "@/components/profile/ProfilePageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile & Account Settings | ResilientPH",
  description: "Manage your ResilientPH profile display identity, username, account email details, and security passwords.",
}

export default function Page() {
  return <ProfilePageClient />
}
