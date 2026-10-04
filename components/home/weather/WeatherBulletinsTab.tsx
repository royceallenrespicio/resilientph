"use client"

import React from "react"
import { MapPin, Wind, Info, Waves, Compass, ShieldAlert, Navigation } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PagasaDailyWeather } from "@/lib/home/types"
import { MarineData } from "@/lib/weather/meteo"
import { formatWeatherText } from "@/lib/utils"

interface PagasaForecastItem {
  place: string
  condition: string
  caused_by: string
  impacts?: string
}

interface PagasaWindCoastalItem {
  place: string
  speed: string
  direction: string
  coastal: string
}

interface WeatherBulletinsTabProps {
  pagasaDaily?: PagasaDailyWeather | null
  marine?: MarineData | null
  activeLocationName?: string
}

export function WeatherBulletinsTab({
  pagasaDaily,
  marine,
  activeLocationName
}: WeatherBulletinsTabProps) {
  if (!pagasaDaily) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground select-none bg-muted/5 rounded-xl border border-border/5">
        <Info className="size-8 text-muted-foreground/35 mb-2" />
        <p className="text-sm font-semibold">No official PAGASA regional forecast found.</p>
        <p className="text-xs text-muted-foreground/75 mt-1">Please try refreshing in the portal header.</p>
      </div>
    )
  }

  // Determine Wave safety category
  let waveSafety = "Slight / Safe"
  let waveSafetyColor = "text-success"
  if (marine && marine.waveHeight !== null) {
    if (marine.waveHeight >= 2.5) {
      waveSafety = "Rough / Dangerous"
      waveSafetyColor = "text-destructive"
    } else if (marine.waveHeight >= 1.25) {
      waveSafety = "Moderate"
      waveSafetyColor = "text-warning"
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        {/* Column 1: Daily Regional Forecasts */}
        {pagasaDaily.forecasts && Array.isArray(pagasaDaily.forecasts) && pagasaDaily.forecasts.length > 0 ? (
          <Card className="p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0 flex flex-col max-h-[500px]">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <span className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/10 pb-2 select-none shrink-0">
                <MapPin className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                Daily Regional Forecasts
              </span>
              <ScrollArea className="flex-1 min-h-0 pr-3 w-full">
                <div className="divide-y divide-border/10">
                  {pagasaDaily.forecasts.map((f: PagasaForecastItem, idx: number) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 font-sans space-y-1">
                      <span className="text-xs font-bold text-primary block">{formatWeatherText(f.place)}</span>
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        {formatWeatherText(f.condition)} ({formatWeatherText(f.caused_by)})
                      </p>
                      {f.impacts && (
                        <p className="text-[11px] text-muted-foreground">Impacts: {formatWeatherText(f.impacts)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        ) : (
          <div className="hidden" />
        )}

        {/* Column 2: Coastal Waters & Winds */}
        {pagasaDaily.wind_coastal && Array.isArray(pagasaDaily.wind_coastal) && pagasaDaily.wind_coastal.length > 0 ? (
          <Card className="p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0 flex flex-col max-h-[500px]">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <span className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/10 pb-2 select-none shrink-0">
                <Wind className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                Coastal Waters & Winds
              </span>
              <ScrollArea className="flex-1 min-h-0 pr-3 w-full">
                <div className="space-y-3">
                  {pagasaDaily.wind_coastal.map((wc: PagasaWindCoastalItem, idx: number) => (
                    <div key={idx} className="text-xs font-sans space-y-1 pb-2 border-b border-border/5 last:border-b-0 last:pb-0">
                      <span className="font-semibold text-foreground block">{formatWeatherText(wc.place)}</span>
                      <p className="text-muted-foreground">Winds: {formatWeatherText(wc.speed)} ({formatWeatherText(wc.direction)})</p>
                      <p className="text-info font-medium font-sans text-[11px]">Coastal: {formatWeatherText(wc.coastal)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        ) : (
          <div className="hidden" />
        )}

        {/* Column 3: Local Marine Status (Wave & Swell) */}
        <Card className="p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0 flex flex-col max-h-[500px]">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <span className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/10 pb-2 select-none shrink-0">
              <Waves className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              Local Marine Status
            </span>
            {marine && marine.waveHeight !== null ? (
              <ScrollArea className="flex-1 min-h-0 pr-3 w-full">
                <div className="space-y-4 pt-1">
                  {/* Active city name */}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-sans">
                    <Navigation className="size-3 shrink-0" />
                    <span className="truncate">COASTAL WATERS FOR {activeLocationName ? activeLocationName.toUpperCase() : "ACTIVE LOCATION"}</span>
                  </div>

                  {/* Primary Wave Height */}
                  <div className="bg-muted/30 border border-border/10 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase">Wave Height</span>
                      <p className="text-2xl font-extrabold font-sans text-foreground leading-none">
                        {marine.waveHeight.toFixed(1)}m
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase">Safety Category</span>
                      <p className={`text-xs font-bold font-sans uppercase block ${waveSafetyColor}`}>
                        {waveSafety}
                      </p>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 border border-border/10 rounded-xl p-3 text-center space-y-1">
                      <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase block">Wave Period</span>
                      <span className="text-sm font-bold font-sans text-foreground">{marine.wavePeriod !== null ? `${marine.wavePeriod.toFixed(0)}s` : "--"}</span>
                    </div>
                    <div className="bg-muted/30 border border-border/10 rounded-xl p-3 text-center space-y-1">
                      <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase block">Wave Direction</span>
                      <span className="text-sm font-bold font-sans text-foreground flex items-center justify-center gap-1">
                        <Compass className="size-3.5 text-muted-foreground shrink-0" style={{ transform: `rotate(${marine.waveDirection ?? 0}deg)` }} />
                        {marine.waveDirection !== null ? `${marine.waveDirection}°` : "--"}
                      </span>
                    </div>
                  </div>

                  {/* Swell information */}
                  {(marine.swellHeight !== null || marine.swellPeriod !== null) && (
                    <div className="bg-muted/30 border border-border/10 rounded-xl p-3 space-y-2">
                      <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase block border-b border-border/10 pb-1">Swell Outlook</span>
                      <div className="flex justify-between text-xs font-sans">
                        <span className="text-muted-foreground">Swell Height:</span>
                        <span className="text-foreground font-bold">{marine.swellHeight !== null ? `${marine.swellHeight.toFixed(1)}m` : "--"}</span>
                      </div>
                      <div className="flex justify-between text-xs font-sans">
                        <span className="text-muted-foreground">Swell Period:</span>
                        <span className="text-foreground font-bold">{marine.swellPeriod !== null ? `${marine.swellPeriod.toFixed(0)}s` : "--"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/20 rounded-xl bg-muted/5 min-h-[220px]">
                <ShieldAlert className="size-7 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-semibold text-muted-foreground font-sans">No coastal boundaries nearby</p>
                <p className="text-[10px] text-muted-foreground/75 font-sans mt-0.5 max-w-[180px]">
                  {activeLocationName ? activeLocationName : "Selected location"} is inland. Showing sea conditions is only applicable for coastal zones.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
