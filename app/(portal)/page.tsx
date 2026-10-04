import HomePageClient from "@/components/home/HomePageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Philippine Disaster Preparedness & Weather Portal | ResilientPH",
  description: "Real-time weather tracking, geological hazard monitoring (earthquakes), active global disaster alerts, and AI-assisted emergency planning for the Philippines.",
}

export default function Page() {
  return <HomePageClient />
}
