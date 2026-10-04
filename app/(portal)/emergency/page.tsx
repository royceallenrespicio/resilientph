import EmergencyPageClient from "@/components/emergency/EmergencyPageClient"
import type { Metadata } from "next"

export const dynamic = "force-static"
export const revalidate = 86400 // 24 hours

export const metadata: Metadata = {
  title: "Emergency Contacts & Critical Hotlines | ResilientPH",
  description: "Quick access directory to emergency services, disaster alert agencies, national hotlines, and medical assistance in the Philippines.",
}

export default function Page() {
  return <EmergencyPageClient />
}
