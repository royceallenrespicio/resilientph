import SignupPageClient from "@/components/auth/SignupPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account | ResilientPH",
  description: "Register for a ResilientPH account to track active storms, map Philippine earthquake incidents, configure local weather profiles, and access AI disaster management logs.",
}

export default function Page() {
  return <SignupPageClient />
}
