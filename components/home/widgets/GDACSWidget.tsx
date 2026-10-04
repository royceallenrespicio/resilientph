"use client"

import { memo } from "react"
import { AlertTriangle, ShieldAlert, ArrowUpRight, Flame, Droplets, Wind, Zap } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GDACSEvent, getGDACSEventReportUrl, isActiveGDACSEvent } from "@/lib/emergency/gdacs"

interface GDACSWidgetProps {
  data: GDACSEvent[]
  loading: boolean
}

// Icon mapper for GDACS event types
const getEventIcon = (type: string) => {
  switch (type) {
    case "EQ":
      return <Zap className="size-4 text-amber-400 shrink-0" />
    case "TC":
      return <Wind className="size-4 text-cyan-400 shrink-0" />
    case "FL":
      return <Droplets className="size-4 text-blue-400 shrink-0" />
    case "VO":
      return <Flame className="size-4 text-red-400 shrink-0" />
    case "TS":
      return <Droplets className="size-4 text-teal-400 shrink-0" />
    default:
      return <AlertTriangle className="size-4 text-amber-400 shrink-0" />
  }
}

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case "EQ": return "Earthquake"
    case "TC": return "Tropical Cyclone"
    case "FL": return "Flood"
    case "VO": return "Volcanic Activity"
    case "DR": return "Drought"
    case "TS": return "Tsunami"
    default: return type || "Natural Event"
  }
}

const getAlertLevelBadgeStyle = (level: GDACSEvent["alertLevel"]) => {
  switch (level) {
    case "Red":
      return "border-red-500/40 bg-red-500/15 text-red-400 motion-safe:animate-pulse"
    case "Orange":
      return "border-amber-500/40 bg-amber-500/15 text-amber-400"
    case "Green":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
    default:
      return "border-border bg-card text-muted-foreground"
  }
}

const GDACSEventRow = memo(({ event }: { event: GDACSEvent }) => {
  const badgeStyle = getAlertLevelBadgeStyle(event.alertLevel)
  const typeLabel = getEventTypeLabel(event.eventType)

  return (
    <a
      href={getGDACSEventReportUrl(event.eventType, event.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between p-3 rounded-xl bg-card hover:bg-accent/60 transition-all border border-border cursor-pointer shadow-xs"
    >
      <div className="space-y-1 pr-2 truncate flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getEventIcon(event.eventType)}
          <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {event.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-micro text-muted-foreground font-sans">
          <span>{typeLabel}</span>
          <span className="text-muted-foreground/40">|</span>
          <span>{event.country}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge className={badgeStyle}>
          {event.alertLevel}
        </Badge>
        <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </a>
  )
})
GDACSEventRow.displayName = "GDACSEventRow"

export function GDACSWidget({ data, loading }: GDACSWidgetProps) {
  if (loading) {
    return (
      <Card className="w-full border border-border bg-card shadow-bryl animate-pulse min-h-[300px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="size-5 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-muted rounded" />
                  <div className="h-3.5 w-36 bg-muted rounded" />
                </div>
                <div className="h-2.5 w-28 bg-muted rounded" />
              </div>
              <div className="h-5 w-14 bg-muted rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Filter to show active alerts (Red & Orange alerts from last 7 days)
  const activeAlerts = data.filter(isActiveGDACSEvent).slice(0, 5)

  return (
    <Card className="w-full border border-border bg-card shadow-bryl rounded-2xl flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              GDACS Hazard Feed
            </CardTitle>
            <ShieldAlert className="size-5 text-foreground" />
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-5">
          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground font-sans">
              <p className="text-sm font-medium">No active global hazard alerts found.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeAlerts.map((event) => (
                <GDACSEventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
