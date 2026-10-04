import React from "react"
import Link from "next/link"
import { AlertTriangle, Clock, MapPin } from "lucide-react"
import { IncidentReport } from "@/lib/supabase/reports"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface IncidentAlertsWidgetProps {
  incidents: IncidentReport[]
  loading: boolean
}

export function IncidentAlertsWidget({ incidents, loading }: IncidentAlertsWidgetProps) {
  if (loading) {
    return (
      <Card className="w-full border border-border bg-card shadow-bryl animate-pulse min-h-[300px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-2.5 w-24 bg-muted rounded mb-2" />
              <div className="h-4 w-44 bg-muted rounded" />
            </div>
            <div className="size-5 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-20 bg-muted rounded" />
                <div className="h-2.5 w-12 bg-muted rounded" />
              </div>
              <div className="h-3.5 w-36 bg-muted rounded" />
              <div className="h-2.5 w-full bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (incidents.length === 0) {
    return null // Hide if no local incidents to show
  }

  return (
    <Card className="w-full border border-border bg-card shadow-bryl rounded-2xl flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-2 select-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-micro font-sans text-muted-foreground">Community Alerts</span>
              <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-0.5">
                Nearby Incident Reports
              </CardTitle>
            </div>
            <AlertTriangle className="size-5 text-amber-400 motion-safe:animate-pulse" />
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-5">
          <div className="space-y-2.5">
            {incidents.map((incident) => {
              const categoryStr = incident.category.replace("_", " ").toUpperCase()
              const typeStr = incident.sub_type.replace(/_/g, " ")

              return (
                <Link
                  key={incident.id}
                  href={`/map?lat=${incident.latitude}&lng=${incident.longitude}&zoom=14`}
                  className="flex flex-col p-3 rounded-xl bg-card hover:bg-accent/60 transition-all border border-border cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-micro font-sans text-amber-400 font-bold">
                        {categoryStr}
                      </span>
                      {incident.severity === "critical" && (
                        <span className="text-micro font-sans px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold motion-safe:animate-pulse">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="text-micro font-sans">
                        {new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground capitalize tracking-tight group-hover:text-primary transition-colors">
                    {typeStr}
                  </h3>

                  {incident.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {incident.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mt-2 text-micro text-muted-foreground font-sans">
                    <MapPin className="size-3 text-primary" />
                    <span className="truncate">
                      View on map
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
