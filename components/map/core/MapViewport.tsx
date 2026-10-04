"use client"

import dynamic from "next/dynamic"
import type { MapViewportProps } from "./LeafletMapInner"
import { Loader2 } from "lucide-react"

const DynamicLeafletMap = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-3 select-none">
      <div className="size-10 rounded-full border border-border/40 bg-card/60 flex items-center justify-center shadow-lg">
        <Loader2 className="size-5 text-primary animate-spin" />
      </div>
      <span className="text-xs font-sans tracking-wide text-muted-foreground">
        Loading Interactive Hazard Map...
      </span>
    </div>
  )
})

export function MapViewport(props: MapViewportProps) {
  return <DynamicLeafletMap {...props} />
}
