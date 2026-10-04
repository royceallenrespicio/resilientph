import LoginPageClient from "@/components/auth/LoginPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | ResilientPH",
  description: "Sign in to access your ResilientPH portal credentials, incident mapping logs, custom weather notifications, and conversational history.",
}

export default function Page() {
  return <LoginPageClient />
}
