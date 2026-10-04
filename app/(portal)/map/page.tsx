import MapPageClient from "@/components/map/MapPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Interactive Geological Hazard & Incident Map | ResilientPH",
  description: "Track active geological incident logs, faultlines, recent earthquakes, magnitudes, and epicenter depths across the Philippines on our interactive spatial map dashboard.",
}

export default function Page() {
  return <MapPageClient />
}
