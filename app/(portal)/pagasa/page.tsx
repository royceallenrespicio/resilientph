import PagasaPageClient from "@/components/pagasa/PagasaPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PAGASA Operations Weather & Hazards Center | ResilientPH",
  description: "Official PAGASA meteorological monitoring center. Tracks real-time active storm maps, Doppler cloud radar, satellite imagery, and regional hazard warnings in ResilientPH.",
}

export default function Page() {
  return <PagasaPageClient />
}
