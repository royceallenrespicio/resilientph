"use client"

import React, { useMemo } from "react"
import {
  ShieldAlert,
  MapPin,
  Wind,
  Zap,
  Compass,
  Info,
  AlertTriangle,
  ExternalLink,
  FileText,
  Image as ImageIcon
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NextImage from "next/image"
import { formatWeatherText, cn } from "@/lib/utils"
import { PagasaTcInfo, TyphoonBulletin } from "@/lib/home/types"

interface TyphoonBulletinCardProps {
  tcInfo?: PagasaTcInfo | null
  typhoon?: TyphoonBulletin[] | null
}

interface ParsedTcRow {
  icon: React.ReactNode
  label: string
  value: string
  colorClass: string
}

function parseTcRows(rows: string[]): {
  bulletinHeader: string
  stormName: string
  isSuperTyphoon: boolean
  keyValues: ParsedTcRow[]
  unparsedRows: string[]
} {
  let bulletinHeader = ""
  let stormName = ""
  let isSuperTyphoon = false
  const keyValues: ParsedTcRow[] = []
  const unparsedRows: string[] = []

  rows.forEach((row, idx) => {
    const cleanRow = row.trim()
    if (!cleanRow) return

    if (idx === 0) {
      bulletinHeader = formatWeatherText(cleanRow)
    } else if (idx === 1 && !cleanRow.includes(":")) {
      stormName = formatWeatherText(cleanRow)
      if (/super typhoon/i.test(cleanRow)) isSuperTyphoon = true
    } else {
      const colonIdx = cleanRow.indexOf(":")
      if (colonIdx !== -1) {
        const rawLabel = cleanRow.slice(0, colonIdx).trim()
        const rawValue = cleanRow.slice(colonIdx + 1).trim()

        let icon: React.ReactNode = <Info className="size-4" />
        let displayLabel = formatWeatherText(rawLabel)
        const displayValue = formatWeatherText(rawValue)
        let colorClass = "text-muted-foreground"

        if (/location/i.test(rawLabel)) {
          icon = <MapPin className="size-4" />
          displayLabel = "Location"
          colorClass = "text-emerald-500"
        } else if (/winds/i.test(rawLabel)) {
          icon = <Wind className="size-4" />
          displayLabel = "Max Winds"
          colorClass = "text-amber-500"
        } else if (/gustiness/i.test(rawLabel)) {
          icon = <Zap className="size-4" />
          displayLabel = "Gustiness"
          colorClass = "text-destructive"
        } else if (/movement/i.test(rawLabel)) {
          icon = <Compass className="size-4" />
          displayLabel = "Movement"
          colorClass = "text-blue-500"
        }

        keyValues.push({ icon, label: displayLabel, value: displayValue, colorClass })
      } else {
        unparsedRows.push(formatWeatherText(cleanRow))
      }
    }
  })

  return { bulletinHeader, stormName, isSuperTyphoon, keyValues, unparsedRows }
}

function getStormCategory(name: string, isSuperTyphoon: boolean): string {
  if (isSuperTyphoon) return "Super Typhoon"
  if (/super typhoon/i.test(name)) return "Super Typhoon"
  if (/typhoon/i.test(name)) return "Typhoon"
  if (/severe tropical storm/i.test(name)) return "Severe Tropical Storm"
  if (/tropical storm/i.test(name)) return "Tropical Storm"
  if (/tropical depression/i.test(name)) return "Tropical Depression"
  return "Tropical Cyclone"
}

function getSignalLevelColor(signal: string): string {
  if (/signal\s*(no\.?\s*)?[4-9]/i.test(signal)) return "text-destructive"
  if (/signal\s*(no\.?\s*)?3/i.test(signal)) return "text-warning"
  if (/signal\s*(no\.?\s*)?2/i.test(signal)) return "text-amber-400"
  return "text-blue-400"
}

export function TyphoonBulletinCard({ tcInfo, typhoon }: TyphoonBulletinCardProps) {
  const activeBulletin = useMemo(() => {
    if (!typhoon) return null
    return typhoon.find((t) => t.active) ?? null
  }, [typhoon])

  // Try to parse rows from pagasaDaily.tc_info first
  const parsed = useMemo(() => {
    if (!tcInfo?.rows || tcInfo.rows.length === 0) return null
    return parseTcRows(tcInfo.rows)
  }, [tcInfo])

  const parsedSignals = useMemo(() => {
    const ws = activeBulletin?.wind_signal
    if (!ws) return []

    let wsObj = ws
    if (typeof ws === "string") {
      try {
        wsObj = JSON.parse(ws)
      } catch {
        return []
      }
    }

    if (typeof wsObj !== "object" || wsObj === null) return []

    const typedWs = wsObj as { active?: boolean; signals?: Array<Record<string, unknown>>; message?: string }
    
    // Case 1: parser output structure { active: true, signals: [...] }
    if (Array.isArray(typedWs.signals)) {
      return typedWs.signals.map(sig => {
        const signalNumber = sig.signal_number || 1
        const signalLabel = `Signal No. ${signalNumber}`
        const groups: Array<{ region: string; localities: string[] }> = []
        if (sig.areas && typeof sig.areas === "object") {
          Object.entries(sig.areas).forEach(([region, localities]) => {
            const list = Array.isArray(localities)
              ? localities
              : typeof localities === "string"
              ? [localities]
              : []
            if (list.length > 0) {
              groups.push({ region, localities: list })
            }
          })
        }
        return {
          signalLabel,
          signalNumber,
          colorClass: getSignalLevelColor(signalLabel),
          groups
        }
      })
    }

    // Case 2: Direct array of signals [ { signal_number: 1, areas: ... } ]
    if (Array.isArray(wsObj)) {
      return wsObj.map(sig => {
        const signalNumber = sig.signal_number || 1
        const signalLabel = `Signal No. ${signalNumber}`
        const groups: Array<{ region: string; localities: string[] }> = []
        if (sig.areas && typeof sig.areas === "object") {
          Object.entries(sig.areas).forEach(([region, localities]) => {
            const list = Array.isArray(localities) ? localities : [localities]
            if (list.length > 0) {
              groups.push({ region, localities: list })
            }
          })
        }
        return {
          signalLabel,
          signalNumber,
          colorClass: getSignalLevelColor(signalLabel),
          groups
        }
      })
    }

    // Case 3: Simple key-value mapping (original fallback)
    const entries = Object.entries(wsObj).filter(([key, val]) => {
      if (key === "active" || key === "message" || key === "signals") return false
      if (Array.isArray(val)) return val.length > 0
      if (typeof val === "string") return val.trim().length > 0
      return false
    })

    if (entries.length > 0) {
      return entries.map(([signal, areas]) => {
        const signalLabel = signal
        const signalNumber = parseInt(signal.replace(/\D/g, ""), 10) || 1
        const areaList = Array.isArray(areas)
          ? (areas as string[])
          : typeof areas === "string"
          ? [areas]
          : []
        return {
          signalLabel,
          signalNumber,
          colorClass: getSignalLevelColor(signalLabel),
          groups: [{ region: "Affected Areas", localities: areaList }]
        }
      })
    }

    return []
  }, [activeBulletin])

  const isInsideParActive = activeBulletin && activeBulletin.active === true

  // Build display data: prefer active bulletin (inside PAR) when available, fall back to parsed tc_info (outside PAR)
  const displayName = isInsideParActive
    ? activeBulletin.title || parsed?.stormName || "Active Cyclone"
    : parsed?.stormName || activeBulletin?.title || "Active Cyclone"

  const isSuperTyphoon = parsed?.isSuperTyphoon ?? /super typhoon/i.test(displayName)
  const category = getStormCategory(displayName, isSuperTyphoon)
  const bulletinHeader = isInsideParActive
    ? activeBulletin?.validity || activeBulletin?.issued_at || parsed?.bulletinHeader || ""
    : parsed?.bulletinHeader || activeBulletin?.validity || activeBulletin?.issued_at || ""

  const pdfUrl = activeBulletin?.pdf_url
  const trackImage = activeBulletin?.track_image

  // Fall back to bulletin fields if no parsed rows or when inside PAR active bulletin exists
  const fallbackKeyValues: ParsedTcRow[] = useMemo(() => {
    if (!activeBulletin) return []
    const items: ParsedTcRow[] = []
    if (activeBulletin.location) {
      items.push({ icon: <MapPin className="size-4" />, label: "Location", value: activeBulletin.location, colorClass: "text-emerald-500" })
    }
    if (activeBulletin.strength) {
      items.push({ icon: <Wind className="size-4" />, label: "Strength", value: activeBulletin.strength, colorClass: "text-amber-500" })
    }
    if (activeBulletin.movement) {
      items.push({ icon: <Compass className="size-4" />, label: "Movement", value: activeBulletin.movement, colorClass: "text-blue-500" })
    }
    return items
  }, [activeBulletin])

  const keyValues = isInsideParActive
    ? (fallbackKeyValues.length > 0 ? fallbackKeyValues : parsed?.keyValues ?? [])
    : (parsed?.keyValues && parsed.keyValues.length > 0 ? parsed.keyValues : fallbackKeyValues)
  const unparsedRows = isInsideParActive ? [] : (parsed?.unparsedRows ?? [])

  // Nothing to show
  if (!activeBulletin && !parsed) return null

  return (
    <Card className="w-full border-none ring-0 bg-background shadow-none rounded-2xl flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase font-sans">
              Active Typhoon Bulletin
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              {bulletinHeader || "PAGASA Severe Weather Bulletin"}
            </CardDescription>
          </div>
          <AlertTriangle
            className={cn("size-5 shrink-0 mt-0.5", isSuperTyphoon ? "text-destructive animate-pulse" : "text-warning")}
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-5 space-y-5 flex flex-col flex-1">
        {/* Storm Name + Category Badge */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border",
            isSuperTyphoon
              ? "bg-destructive/10 border-destructive/30"
              : "bg-warning/10 border-warning/30"
          )}
        >
          <ShieldAlert
            className={cn("size-6 shrink-0", isSuperTyphoon ? "text-destructive" : "text-warning")}
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <h3
              className={cn(
                "text-xl font-bold tracking-tight leading-tight",
                isSuperTyphoon ? "text-destructive" : "text-warning"
              )}
            >
              {displayName}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "w-fit text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5",
                isSuperTyphoon
                  ? "border-destructive/50 text-destructive"
                  : "border-warning/50 text-warning"
              )}
            >
              {category}
            </Badge>
          </div>
        </div>

        {/* Key Parameters Grid */}
        {keyValues.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-sans">
              Storm Parameters
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {keyValues.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors border border-border/10"
                >
                  <div className={cn("mt-0.5 shrink-0", item.colorClass)} aria-hidden="true">
                    {item.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground/90 leading-snug">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulletin detail rows */}
        {activeBulletin?.details && activeBulletin.details.length > 0 && keyValues.length === 0 && (
          <div className="space-y-1.5">
            {activeBulletin.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Info className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Wind Signals Breakdown */}
        {parsedSignals.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-sans">
              Wind Signal Areas
            </p>
            <div className="space-y-3">
              {parsedSignals.map((sig, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-muted/20 border border-border/10 space-y-2"
                >
                  <div className="flex items-center gap-2 pb-1 border-b border-border/5">
                    <Wind
                      className={cn("size-3.5 shrink-0", sig.colorClass)}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        sig.colorClass
                      )}
                    >
                      {sig.signalLabel}
                    </span>
                  </div>
                  
                  {sig.groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-0.5 pl-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                        {group.region}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {group.localities.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Track Image */}
        {trackImage && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-sans flex items-center gap-1.5">
              <ImageIcon className="size-3.5" aria-hidden="true" />
              Forecast Track
            </p>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/20 bg-muted/20">
              <NextImage
                src={trackImage}
                alt="PAGASA typhoon forecast track"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Unparsed Supplemental Rows */}
        {unparsedRows.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-border/40">
            {unparsedRows.map((row, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Info className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-muted-foreground leading-relaxed">{row}</p>
              </div>
            ))}
          </div>
        )}

        {/* PDF Bulletin Link */}
        {pdfUrl && (
          <div className="pt-3 border-t border-border/40 mt-auto">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto gap-2 border-border/50 hover:bg-muted/40 transition-colors cursor-pointer text-xs font-medium"
            >
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View full PAGASA typhoon bulletin PDF"
              >
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                <span>View Full Bulletin PDF</span>
                <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
