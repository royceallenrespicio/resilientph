"use client"

import Link from "next/link"
import { Activity } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { formatRelativeTime } from "@/lib/utils"
import type { EarthquakeEvent as PhivolcsQuakeEvent } from "@/lib/scraper/phivolcs"

interface QuakeWidgetProps {
  data: EarthquakeEvent[]
  phivolcsData: PhivolcsQuakeEvent[]
  loading: boolean
}

type UnifiedQuake = {
  id: string
  place: string
  latitude: number
  longitude: number
  timeMs: number
  depthKm: number
  magnitude: number
  source: "PHIVOLCS" | "USGS"
}

import { mergeEarthquakes } from "@/lib/map/merge-earthquakes"

export function QuakeWidget({ data, phivolcsData, loading }: QuakeWidgetProps) {
  if (loading) {
    return (
      <Card className="w-full border border-border bg-card shadow-bryl animate-pulse min-h-[350px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="size-5 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                <div className="h-3.5 w-48 bg-muted rounded" />
                <div className="h-2.5 w-36 bg-muted rounded" />
              </div>
              <div className="h-5 w-14 bg-muted rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const usgsMapped = data || []
  const phivolcsMapped = (phivolcsData || []).map(q => ({
    id: q.hash,
    place: q.location,
    latitude: q.latitude,
    longitude: q.longitude,
    time: new Date(q.event_time).getTime(),
    depth: q.depth_km,
    magnitude: q.magnitude,
    url: q.info_url || "",
    source: "phivolcs" as const
  }))

  const mergedQuakes = mergeEarthquakes(usgsMapped, phivolcsMapped)

  const allQuakes: UnifiedQuake[] = mergedQuakes.map(q => ({
    id: q.id,
    place: q.place,
    latitude: q.latitude,
    longitude: q.longitude,
    timeMs: q.time,
    depthKm: q.depth,
    magnitude: q.magnitude,
    source: q.source === "phivolcs" ? "PHIVOLCS" : "USGS",
  }))

  // Show top 5 unified earthquakes
  const recentQuakes = allQuakes.slice(0, 5)

  return (
    <Card className="w-full border border-border bg-card shadow-bryl rounded-2xl flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-2 select-none">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Seismic Activity Feed
            </CardTitle>
            <Activity className="size-5 text-foreground" />
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-5">
          {recentQuakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground select-none">
              <Activity className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No recent earthquakes logged</p>
              <p className="text-micro text-muted-foreground mt-1">PHIVOLCS and USGS monitoring active</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentQuakes.map((quake) => {
                const getMagStyle = (mag: number) => {
                  if (mag >= 5.0) return "border-red-500/40 bg-red-500/15 text-red-400 font-bold"
                  if (mag >= 4.0) return "border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold"
                  return "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-medium"
                }

                return (
                  <Link
                    key={quake.id}
                    href={`/map?lat=${quake.latitude}&lng=${quake.longitude}&zoom=10`}
                    className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-accent/60 transition-all border border-border cursor-pointer group shadow-xs"
                  >
                    <div className="space-y-1 pr-3 truncate flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={quake.place}>
                        {quake.place}
                      </p>
                      <div className="flex items-center gap-2 text-micro text-muted-foreground font-sans">
                        <span>{formatRelativeTime(quake.timeMs)}</span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>Depth {quake.depthKm.toFixed(0)}km / {quake.source}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={getMagStyle(quake.magnitude)}>
                        M {quake.magnitude.toFixed(1)}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
