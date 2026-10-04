"use client"

import React, { useState } from "react"
import { Info, MapPin, AlertTriangle, BrainCircuit } from "lucide-react"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PagasaRegionalForecast } from "@/lib/home/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-breakpoints"
import { RegionalForecastOutlook } from "./RegionalForecastOutlook"
import { Intents } from "@/lib/chat/prompts"

interface HomeRegionalForecastProps {
  pagasaRegional?: Record<string, PagasaRegionalForecast> | null
  loading?: boolean
  onAnalyze?: (prompt: string) => void
}

const REGION_LIST = [
  { id: "ncrprsd", name: "NCR", fullName: "Metro Manila (NCR)" },
  { id: "nlprsd", name: "N. Luzon", fullName: "Northern Luzon" },
  { id: "slprsd", name: "S. Luzon", fullName: "Southern Luzon" },
  { id: "visprsd", name: "Visayas", fullName: "Visayas" },
  { id: "minprsd", name: "Mindanao", fullName: "Mindanao" }
] as const

function ExpandableAlert({ type, text, textColorClass, badgeColorClass }: { type: string, text: string, textColorClass: string, badgeColorClass: string }) {
  const [expanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()
  const [dialogOpen, setDialogOpen] = useState(false)
  // Check if text is likely long enough to need truncation (heuristic)
  const isLong = text.length > 150

  return (
    <div className={`flex items-start gap-1.5 ${textColorClass}`}>
      <span className={`font-bold shrink-0 ${badgeColorClass}`}>[{type}]</span>
      <div className="flex-1 min-w-0">
        <div className={`leading-relaxed ${!expanded && isLong ? "line-clamp-2" : "whitespace-pre-wrap"}`}>
          {text}
        </div>
        {isLong && (
          isMobile ? (
            <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="text-[10px] font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity mt-1 cursor-pointer"
                >
                  Read more
                </button>
              </DrawerTrigger>
              <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-md mx-auto">
                <DrawerHeader className="pb-3 border-b border-border/10 select-none text-left px-5 flex flex-col items-start gap-1">
                  <DrawerTitle className={`text-sm font-semibold tracking-wider font-sans uppercase flex items-center gap-1.5 ${badgeColorClass}`}>
                    <span className="font-bold">[{type}]</span>
                    <span className="text-foreground">Regional Alert</span>
                  </DrawerTitle>
                </DrawerHeader>
                <div className="text-sm leading-relaxed whitespace-pre-wrap mt-2 overflow-y-auto px-5 pb-5">
                  {text}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity mt-1 cursor-pointer"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )
        )}
      </div>
    </div>
  )
}

export function RegionalForecast({ pagasaRegional, loading, onAnalyze }: HomeRegionalForecastProps) {
  const [activeRegionTab, setActiveRegionTab] = useState<string>("ncrprsd")
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("")

  const handleAnalyzeWithAI = (
    regionName: string,
    provinceName: string | null
  ) => {
    let loc = regionName
    if (provinceName) {
      loc = `${provinceName} (${regionName})`
    }

    const prompt = Intents.getRegionalHazards(loc)

    if (onAnalyze) {
      onAnalyze(prompt)
    }
  }

  const handleTabChange = (val: string) => {
    setActiveRegionTab(val)
  }

  // 1. Loading state skeleton using shadcn Skeleton primitive
  if (loading) {
    return (
      <Card className="w-full border-none ring-0 shadow-none bg-background min-h-[350px]">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <Skeleton className="h-9 w-80 rounded-xl" />
          <Skeleton className="h-6 w-full mt-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-none ring-0 shadow-none bg-background flex flex-col justify-between">
      <div>
        {/* Header section with region title */}
        <CardHeader className="pb-2 select-none">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold tracking-wider text-muted-foreground uppercase font-sans flex items-center gap-2">
                Regional Weather
              </CardTitle>
              {pagasaRegional && pagasaRegional[activeRegionTab] && (
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 font-sans mt-0.5">
                  Issued: {pagasaRegional[activeRegionTab].issued_at}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-5">
          <div className="space-y-4">
            {/* Sub-tabs horizontal selector using shadcn Tabs list */}
            <Tabs value={activeRegionTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                {/* Desktop Tabs */}
                <TabsList className="hidden sm:flex flex-1 min-w-0 justify-start border border-border/50 bg-muted/50 p-0.5 rounded-xl gap-0.5 select-none shrink-0 h-fit max-w-full overflow-x-auto no-scrollbar flex-nowrap">
                  {REGION_LIST.map((reg) => (
                    <TabsTrigger
                      key={reg.id}
                      value={reg.id}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans"
                    >
                      {reg.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Mobile Dropdown */}
                <div className="sm:hidden w-full">
                  <Select value={activeRegionTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full bg-muted/50 border border-border/50 h-9 rounded-xl text-xs font-medium focus:ring-0">
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-h-60 bg-card/95 border border-border/50 rounded-xl backdrop-blur-md">
                      {REGION_LIST.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id} className="text-xs font-medium cursor-pointer">
                          {reg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const regData = pagasaRegional?.[activeRegionTab]
                    if (!regData) return
                    const provincesData = regData.provinces || {}
                    const provinceKeys = Object.keys(provincesData)
                    const hasProvinces = provinceKeys.length > 0
                    const activeProvinceCode = provinceKeys.includes(selectedProvinceCode)
                      ? selectedProvinceCode
                      : (provinceKeys[0] || "")

                    const provinceName = hasProvinces && activeProvinceCode ? provincesData[activeProvinceCode].name || null : null


                    handleAnalyzeWithAI(
                      REGION_LIST.find(r => r.id === activeRegionTab)?.fullName || regData.region || activeRegionTab.toUpperCase(),
                      provinceName
                    )
                  }}
                  className="text-xs font-sans border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary gap-1 px-3 h-8 rounded-xl cursor-pointer shrink-0 w-auto justify-center"
                >
                  <BrainCircuit className="size-3.5" />
                  <span>AI Insights</span>
                </Button>
              </div>
            </Tabs>

            {/* Selected Region Content */}
            {pagasaRegional && pagasaRegional[activeRegionTab] ? (
              (() => {
                const regData = pagasaRegional[activeRegionTab]
                const provincesData = regData.provinces || {}
                const provinceKeys = Object.keys(provincesData)
                const hasProvinces = provinceKeys.length > 0

                // If selected province is not in the active region, use the first key as default
                const activeProvinceCode = provinceKeys.includes(selectedProvinceCode)
                  ? selectedProvinceCode
                  : (provinceKeys[0] || "")

                // Dynamically resolve forecast variables (default region vs. selected province)
                const activeForecast = hasProvinces && activeProvinceCode && provincesData[activeProvinceCode]
                  ? provincesData[activeProvinceCode]
                  : regData

                const getImageUrl = (src?: string) => {
                  if (!src) return ""
                  if (src.startsWith("http")) return src
                  return `https://bagong.pagasa.dost.gov.ph${src.startsWith("/") ? "" : "/"}${src}`
                }

                const dayForecast = activeForecast.day_forecast
                const nightForecast = activeForecast.night_forecast
                const extended = activeForecast.extended_outlook || []
                const warnings = regData.warnings || { rainfalls: [], thunderstorms: [], special: [], gmma: [] }

                // Deduplicate warnings
                const uniqueRainfalls = Array.from(new Set(warnings.rainfalls || [])).filter((w: string) => w.trim().length > 0)
                const uniqueThunderstorms = Array.from(new Set(warnings.thunderstorms || [])).filter((w: string) => w.trim().length > 0)

                const hasAlerts = uniqueRainfalls.length > 0 || uniqueThunderstorms.length > 0

                return (
                  <div className="space-y-4">
                    {/* Region and Province Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20 px-3.5 py-2.5 rounded-xl border border-border/10">
                      <div className="text-xs font-bold text-foreground font-sans flex items-center gap-1.5 select-none min-w-0">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">Region: {REGION_LIST.find(r => r.id === activeRegionTab)?.fullName || regData.region || activeRegionTab.toUpperCase()}</span>
                      </div>

                      {hasProvinces && (
                        <div className="flex items-center gap-2 select-none w-full sm:w-auto">
                          <span className="text-[11px] text-muted-foreground font-sans font-medium whitespace-nowrap">Province:</span>
                          <Select
                            value={activeProvinceCode}
                            onValueChange={setSelectedProvinceCode}
                          >
                            <SelectTrigger
                              aria-label="Select Province"
                              size="sm"
                              className="flex-1 min-w-0 max-w-[240px] sm:w-[200px] bg-muted/40 border border-border/50 rounded-xl text-xs h-8 font-sans font-medium text-foreground cursor-pointer"
                            >
                              <SelectValue placeholder="Select Province" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-h-60 bg-card/95 border border-border/50 rounded-xl backdrop-blur-md">
                              {Object.entries(provincesData).map(([code, prov]) => (
                                <SelectItem key={code} value={code} className="text-xs font-sans">
                                  {prov.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Day & Night side-by-side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Daytime Forecast */}
                      <Card className="bg-muted/20 border border-border/10 px-3.5 py-3.5 rounded-xl flex flex-col justify-between shadow-xs ring-0">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-warning font-sans uppercase tracking-wider block">Daytime Forecast</span>
                          <div className="flex items-start gap-3">
                            {dayForecast.image && (
                              <Image
                                src={getImageUrl(dayForecast.image)}
                                alt="Day weather condition icon"
                                width={40}
                                height={40}
                                unoptimized
                                className="size-10 object-contain shrink-0"
                              />
                            )}
                            <p className="text-xs text-foreground/90 font-sans leading-relaxed">
                              {dayForecast.description || "No description available"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/5 space-y-1.5 text-[11px] font-sans">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Temperature:</span>
                            <span className="font-semibold text-foreground font-sans tabular-nums">{dayForecast.low || "N/A"} - {dayForecast.high || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Winds:</span>
                            <span className="font-semibold text-foreground text-right truncate pl-2" title={`${dayForecast.wind_speed} | ${dayForecast.direction}`}>
                              {dayForecast.wind_speed || "N/A"} ({dayForecast.direction || "N/A"})
                            </span>
                          </div>
                          {dayForecast.coastal && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Coastal waves:</span>
                              <span className="text-info font-medium text-right truncate pl-2" title={dayForecast.coastal}>{dayForecast.coastal}</span>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Nighttime Forecast */}
                      <Card className="bg-muted/20 border border-border/10 px-3.5 py-3.5 rounded-xl flex flex-col justify-between shadow-xs ring-0">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-info font-sans uppercase tracking-wider block">Nighttime Forecast</span>
                          <div className="flex items-start gap-3">
                            {nightForecast.image && (
                              <Image
                                src={getImageUrl(nightForecast.image)}
                                alt="Night weather condition icon"
                                width={40}
                                height={40}
                                unoptimized
                                className="size-10 object-contain shrink-0"
                              />
                            )}
                            <p className="text-xs text-foreground/90 font-sans leading-relaxed">
                              {nightForecast.description || "No description available"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/5 space-y-1.5 text-[11px] font-sans">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Temperature:</span>
                            <span className="font-semibold text-foreground font-sans tabular-nums">{nightForecast.low || "N/A"} - {nightForecast.high || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Winds:</span>
                            <span className="font-semibold text-foreground text-right truncate pl-2" title={`${nightForecast.wind_speed} | ${nightForecast.direction}`}>
                              {nightForecast.wind_speed || "N/A"} ({nightForecast.direction || "N/A"})
                            </span>
                          </div>
                          {nightForecast.coastal && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Coastal waves:</span>
                              <span className="text-info font-medium text-right truncate pl-2" title={nightForecast.coastal}>{nightForecast.coastal}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    {/* Warnings list */}
                    {hasAlerts && (
                      <div className="space-y-2 bg-destructive/5 border border-destructive/10 rounded-xl p-3 text-xs font-sans">
                        <span className="text-[10px] font-sans font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5 select-none">
                          <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                          <span>Active Regional Alerts</span>
                        </span>
                        <div className="space-y-1.5">
                          {uniqueRainfalls.map((w: string, idx: number) => (
                            <ExpandableAlert key={`rf-${idx}`} type="Rainfall" text={w} textColorClass="text-destructive/90" badgeColorClass="text-destructive" />
                          ))}
                          {uniqueThunderstorms.map((w: string, idx: number) => (
                            <ExpandableAlert key={`ts-${idx}`} type="Thunderstorm" text={w} textColorClass="text-warning/90" badgeColorClass="text-warning" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5-Day Regional Outlook */}
                    <RegionalForecastOutlook extended={extended} getImageUrl={getImageUrl} />
                  </div>
                )
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground select-none bg-muted/5 rounded-xl border border-border/5">
                <Info className="size-6 text-muted-foreground/30 mb-1.5" />
                <p className="text-xs font-semibold">No detailed regional forecast available.</p>
                <p className="text-[10px] text-muted-foreground/75 mt-0.5">Please refresh the dashboard feeds.</p>
              </div>
            )}

          </div>
        </CardContent>
      </div>
    </Card>
  )
}
