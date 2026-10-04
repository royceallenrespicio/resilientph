"use client"

import React from "react"
import { motion, useReducedMotion } from "motion/react"
import { PagasaDailyWeather, TyphoonBulletin } from "@/lib/home/types"
import { formatWeatherText } from "@/lib/utils"
import { AlertTriangle, CloudSun, ExternalLink, AlertCircle } from "lucide-react"

interface HomeMarqueeProps {
  typhoon: TyphoonBulletin[] | null
  pagasaDaily?: PagasaDailyWeather | null
  loading: boolean
}

export function HomeMarquee({ typhoon, pagasaDaily, loading }: HomeMarqueeProps) {
  const shouldReduceMotion = useReducedMotion()

  // 1. Loading state skeleton
  if (loading && (!typhoon || typhoon.length === 0)) {
    return (
      <div className="w-full h-9 bg-muted/20 border-y border-border/10 flex items-center px-4 animate-pulse select-none">
        <div className="size-2 rounded-full bg-muted-foreground/30 mr-3" />
        <div className="h-3 w-48 bg-muted-foreground/20 rounded" />
      </div>
    )
  }

  // Find all active bulletins
  const activeTyphoons = Array.isArray(typhoon)
    ? typhoon.filter((t) => t.active === true)
    : []

  const isActive = activeTyphoons.length > 0
  const lpaInfo = extractLpaInfo(pagasaDaily?.synopsis)

  if (isActive) {
    // Compile segments for all active typhoons
    const textSegments: string[] = []

    activeTyphoons.forEach((t, idx) => {
      const prefix = activeTyphoons.length > 1 ? `[Cyclone ${idx + 1}] ` : ""
      textSegments.push(
        `${prefix}TROPICAL CYCLONE ALERT`,
        `Active: ${t.title || "Severe Weather Bulletin"}`,
        `Eye/Center: ${t.location || "N/A"}`,
        `Winds: ${t.strength || "N/A"}`,
        `Movement: ${t.movement || "N/A"}`,
        `Validity: ${t.validity || "N/A"}`
      )
    })

    if (lpaInfo) {
      textSegments.push(`Monitored Low Pressure Area: ${lpaInfo}`)
    }

    textSegments.push("Click to view official DOST-PAGASA Bulletin PDF")

    // Use PDF URL of the first active typhoon, or default PAGASA bulletins page
    const pdfUrl = activeTyphoons[0]?.pdf_url || "https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin"

    return (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full border-y border-destructive/25 bg-destructive/10 hover:bg-destructive/15 text-destructive transition-colors select-none group focus-visible:outline-none"
        aria-label="Active Typhoon Warning Bulletin. Click to view PDF."
      >
        <div className="max-w-7xl mx-auto flex items-center h-9 overflow-hidden relative">
          {/* Static Alert Prefix Badge */}
          <div className="h-full bg-destructive/20 px-4 flex items-center gap-1.5 shrink-0 z-20 border-r border-destructive/20 text-xs md:text-sm font-extrabold uppercase font-sans tracking-wider">
            <AlertTriangle className="size-4 text-destructive motion-safe:animate-bounce shrink-0" />
            <span className="text-destructive">Typhoon Alert</span>
          </div>

          {/* Scrolling Ticker Box — static fallback when reduced motion is on */}
          <div className="flex-1 overflow-hidden relative flex items-center h-full">
            {shouldReduceMotion ? (
              <p className="text-xs md:text-sm font-semibold font-sans truncate px-4">
                {textSegments.slice(0, 3).join(" / ")}
              </p>
            ) : (
              <motion.div
                className="flex whitespace-nowrap gap-12 pr-12 text-xs md:text-sm font-semibold font-sans"
                animate={{ x: [0, "-50%"] }}
                transition={{ ease: "linear", duration: 35 + activeTyphoons.length * 5, repeat: Infinity }}
                whileHover={{ transition: { duration: 120 } }}
              >
                {/* Set 1 */}
                <div className="flex items-center gap-12 flex-nowrap">
                  {textSegments.map((segment, idx) => (
                    <span key={`s1-${idx}`} className="flex items-center gap-2">
                      {segment}
                      {idx < textSegments.length - 1 && <span className="text-destructive/50">•</span>}
                    </span>
                  ))}
                </div>
                {/* Set 2 (Duplicated for seamless looping) */}
                <div className="flex items-center gap-12 flex-nowrap" aria-hidden="true">
                  {textSegments.map((segment, idx) => (
                    <span key={`s2-${idx}`} className="flex items-center gap-2">
                      {segment}
                      {idx < textSegments.length - 1 && <span className="text-destructive/50">•</span>}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Action icon indicator */}
          <div className="h-full bg-destructive/20 px-4 flex items-center gap-1 z-20 border-l border-destructive/20 shrink-0 text-destructive group-hover:text-destructive/80 transition-colors">
            <ExternalLink className="size-3.5" />
          </div>
        </div>
      </a>
    )
  }



  // 2. LPA Warning State (Typhoon Inactive, LPA Active)
  if (lpaInfo) {
    const lpaText = `PAGASA Weather Update: A Low Pressure Area (LPA) is being monitored. Details: ${lpaInfo}`

    return (
      <div
        className="w-full border-y border-warning/20 bg-warning/10 text-warning hover:bg-warning/15 transition-colors select-none font-medium"
        role="status"
      >
        <div className="max-w-7xl mx-auto flex items-center h-9 overflow-hidden relative">
          {/* Static Alert Prefix Badge */}
          <div className="h-full bg-warning/20 px-4 flex items-center gap-1.5 shrink-0 z-20 border-r border-warning/20 text-[10px] md:text-xs font-bold uppercase font-sans tracking-wider">
            <AlertCircle className="size-3.5 text-warning motion-safe:animate-pulse shrink-0" />
            <span className="text-warning">LPA Alert</span>
          </div>

          {/* Scrolling Ticker Box — static fallback when reduced motion is on */}
          <div className="flex-1 overflow-hidden relative flex items-center h-full">
            {shouldReduceMotion ? (
              <p className="text-[11px] md:text-xs font-semibold font-sans truncate px-4">
                {lpaText}
              </p>
            ) : (
              <motion.div
                className="flex whitespace-nowrap gap-16 pr-16 text-[11px] md:text-xs font-semibold font-sans"
                animate={{ x: [0, "-50%"] }}
                transition={{ ease: "linear", duration: 35, repeat: Infinity }}
              >
                {/* Set 1 */}
                <div className="flex items-center gap-16 flex-nowrap">
                  <span>{lpaText}</span>
                  <span className="text-warning/40 font-mono">•</span>
                  <span>{lpaText}</span>
                  <span className="text-warning/40 font-mono">•</span>
                </div>
                {/* Set 2 */}
                <div className="flex items-center gap-16 flex-nowrap" aria-hidden="true">
                  <span>{lpaText}</span>
                  <span className="text-warning/40 font-mono">•</span>
                  <span>{lpaText}</span>
                  <span className="text-warning/40 font-mono">•</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. Calm Monitoring State (Typhoon & LPA Inactive)
  const calmText = "PAGASA Monitor: No active tropical cyclone inside the Philippine Area of Responsibility (PAR). Weather parameters are normal."

  return (
    <div
      className="w-full border-y border-border/10 bg-success/5 text-success/90 font-medium select-none"
      role="status"
    >
      <div className="max-w-7xl mx-auto flex items-center h-9 overflow-hidden relative">
        {/* Static Status Prefix Badge */}
        <div className="h-full bg-success/10 px-4 flex items-center gap-1.5 shrink-0 z-20 border-r border-success/10 text-[10px] md:text-xs font-bold uppercase font-sans tracking-wider">
          <CloudSun className="size-3.5 text-success shrink-0" />
          <span className="text-success">Monitoring</span>
        </div>

        {/* Scrolling Ticker Box — static fallback when reduced motion is on */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          {shouldReduceMotion ? (
            <p className="text-[11px] md:text-xs font-medium font-sans truncate px-4">
              {calmText}
            </p>
          ) : (
            <motion.div
              className="flex whitespace-nowrap gap-16 pr-16 text-[11px] md:text-xs font-medium font-sans"
              animate={{ x: [0, "-50%"] }}
              transition={{ ease: "linear", duration: 40, repeat: Infinity }}
            >
              {/* Set 1 */}
              <div className="flex items-center gap-16 flex-nowrap">
                <span>{calmText}</span>
                <span className="text-success/40 font-mono">•</span>
                <span>{calmText}</span>
                <span className="text-success/40 font-mono">•</span>
              </div>
              {/* Set 2 */}
              <div className="flex items-center gap-16 flex-nowrap" aria-hidden="true">
                <span>{calmText}</span>
                <span className="text-success/40 font-mono">•</span>
                <span>{calmText}</span>
                <span className="text-success/40 font-mono">•</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Extracts the specific sentence mentioning "Low Pressure Area" or "LPA"
 * from the daily weather synopsis text.
 */
function extractLpaInfo(synopsis: string | null | undefined): string | null {
  if (!synopsis) return null

  // Split into sentences using punctuation followed by spaces/end of string
  const sentences = synopsis.split(/[.!?](?=\s|$)/)

  // Find the sentence containing "low pressure area" or "lpa"
  const lpaSentence = sentences.find(s => /\b(low pressure area|lpa)\b/i.test(s))

  if (lpaSentence) {
    let text = lpaSentence.trim()
    // Append a period if it doesn't end with one
    if (text && !/[.!?]$/.test(text)) {
      text += "."
    }
    return formatWeatherText(text)
  }

  return null
}
