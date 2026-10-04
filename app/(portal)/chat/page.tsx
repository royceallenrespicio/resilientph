import ChatPageClient from "@/components/chat/ChatPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Disaster Preparedness Assistant | ResilientPH",
  description: "Consult ResilientPH's AI agent for weather forecasts, active typhoon alerts, earthquake reports, emergency go bag checklist generation, and custom disaster safety planning.",
}

export default function Page() {
  return <ChatPageClient />
}
