"use client"

import React from "react"
import { Wind, ShieldCheck, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WeatherAqiTabProps {
  weather: {
    aqi: number
    pm2_5: number
    pm10: number
    o3: number
    co: number
    no2: number
    so2: number
  }
}

interface AqiTier {
  label: string
  color: string
  barColor: string
  textColor: string
  advice: string
  min: number
  max: number
}

const AQI_TIERS: AqiTier[] = [
  {
    label: "Good",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-400",
    advice: "Air quality is satisfactory and poses little or no risk.",
    min: 0,
    max: 50,
  },
  {
    label: "Moderate",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    barColor: "bg-amber-500",
    textColor: "text-amber-400",
    advice: "Air quality is acceptable. Very sensitive individuals should monitor outdoor exertion.",
    min: 51,
    max: 100,
  },
  {
    label: "Unhealthy for Sensitive Groups",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    barColor: "bg-orange-500",
    textColor: "text-orange-400",
    advice: "Members of sensitive groups (asthma, elderly) may experience health effects.",
    min: 101,
    max: 150,
  },
  {
    label: "Unhealthy",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    barColor: "bg-red-500",
    textColor: "text-red-400",
    advice: "Everyone may begin to experience health effects; limit prolonged outdoor activity.",
    min: 151,
    max: 200,
  },
  {
    label: "Very Unhealthy",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    barColor: "bg-purple-500",
    textColor: "text-purple-400",
    advice: "Health alert: The risk of health effects is increased for all individuals.",
    min: 201,
    max: 300,
  },
  {
    label: "Hazardous",
    color: "bg-rose-950/40 text-rose-300 border-rose-500/40",
    barColor: "bg-rose-700",
    textColor: "text-rose-400",
    advice: "Health warning of emergency conditions. Entire population is more likely to be affected.",
    min: 301,
    max: 500,
  },
]

function getAqiTier(aqi: number): AqiTier {
  if (aqi <= 50) return AQI_TIERS[0]
  if (aqi <= 100) return AQI_TIERS[1]
  if (aqi <= 150) return AQI_TIERS[2]
  if (aqi <= 200) return AQI_TIERS[3]
  if (aqi <= 300) return AQI_TIERS[4]
  return AQI_TIERS[5]
}

interface PollutantConfig {
  code: string
  name: string
  value: number
  unit: string
  decimals: number
  safeThreshold: number
  modThreshold: number
}

function getPollutantStatus(val: number, safe: number, mod: number) {
  if (val <= safe) return { label: "Good", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
  if (val <= mod) return { label: "Moderate", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
  return { label: "Elevated", color: "text-red-400 bg-red-500/10 border-red-500/20" }
}

export function WeatherAqiTab({ weather }: WeatherAqiTabProps) {
  const tier = getAqiTier(weather.aqi)
  const aqiPercentage = Math.min(Math.max((weather.aqi / 300) * 100, 2), 98)

  const pollutants: PollutantConfig[] = [
    {
      code: "PM2.5",
      name: "Fine Particulate Matter",
      value: weather.pm2_5,
      unit: "µg/m³",
      decimals: 1,
      safeThreshold: 12.0,
      modThreshold: 35.4,
    },
    {
      code: "PM10",
      name: "Coarse Dust Particles",
      value: weather.pm10,
      unit: "µg/m³",
      decimals: 1,
      safeThreshold: 54.0,
      modThreshold: 154.0,
    },
    {
      code: "O₃",
      name: "Ground-Level Ozone",
      value: weather.o3,
      unit: "µg/m³",
      decimals: 1,
      safeThreshold: 100.0,
      modThreshold: 160.0,
    },
    {
      code: "CO",
      name: "Carbon Monoxide",
      value: weather.co,
      unit: "µg/m³",
      decimals: 0,
      safeThreshold: 4400,
      modThreshold: 9400,
    },
    {
      code: "NO₂",
      name: "Nitrogen Dioxide",
      value: weather.no2,
      unit: "µg/m³",
      decimals: 1,
      safeThreshold: 100.0,
      modThreshold: 200.0,
    },
    {
      code: "SO₂",
      name: "Sulfur Dioxide",
      value: weather.so2,
      unit: "µg/m³",
      decimals: 1,
      safeThreshold: 75.0,
      modThreshold: 185.0,
    },
  ]

  return (
    <div className="space-y-4 px-1 pt-1 font-sans animate-in fade-in duration-200">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-border/10 pb-2 select-none">
        <div className="flex items-center gap-2">
          <Wind className="size-4 text-muted-foreground" />
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
            Air Quality Index
          </span>
        </div>
        <Badge className={`text-xs font-sans font-semibold px-2.5 py-0.5 border rounded-lg ${tier.color}`}>
          {tier.label.toUpperCase()}
        </Badge>
      </div>

      {/* Main AQI Score & Gauge Card */}
      <Card className="p-4 bg-muted/20 border border-border/15 rounded-2xl space-y-4 shadow-xs ring-0 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">
              Current Index Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-sans text-foreground tabular-nums leading-none">
                {weather.aqi}
              </span>
              <span className="text-xs font-sans font-medium text-muted-foreground">
                US AQI
              </span>
              <span className={`text-sm font-sans font-semibold ml-2 ${tier.textColor}`}>
                • {tier.label}
              </span>
            </div>
          </div>

          <div className="flex items-start sm:items-center gap-2 bg-background/50 border border-border/20 px-3 py-2 rounded-xl text-xs font-sans max-w-sm">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-muted-foreground leading-snug font-sans">
              {tier.advice}
            </p>
          </div>
        </div>

        {/* Visual Multi-tier AQI Bar */}
        <div className="space-y-1.5 select-none pt-1">
          <div className="relative h-2.5 w-full rounded-full overflow-hidden flex bg-muted/40">
            <div className="h-full flex-1 bg-emerald-500" title="Good (0-50)" />
            <div className="h-full flex-1 bg-amber-500" title="Moderate (51-100)" />
            <div className="h-full flex-1 bg-orange-500" title="Unhealthy for Sensitive Groups (101-150)" />
            <div className="h-full flex-1 bg-red-500" title="Unhealthy (151-200)" />
            <div className="h-full flex-1 bg-purple-500" title="Very Unhealthy (201-300)" />
            <div className="h-full flex-1 bg-rose-700" title="Hazardous (301-500)" />
          </div>

          {/* Current Marker Pin */}
          <div className="relative w-full h-3">
            <div
              className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
              style={{ left: `${aqiPercentage}%` }}
            >
              <div className="size-2.5 rounded-full bg-foreground border-2 border-background shadow-xs ring-1 ring-border/50" />
            </div>
          </div>

          {/* Tier Label Indicators */}
          <div className="flex justify-between text-[10px] font-sans text-muted-foreground/75 px-0.5">
            <span>0 Good</span>
            <span className="hidden sm:inline">50</span>
            <span>100 Mod</span>
            <span className="hidden sm:inline">150</span>
            <span>200 Unhealthy</span>
            <span>300+</span>
          </div>
        </div>
      </Card>

      {/* Pollutants Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-sans">
        {pollutants.map((pollutant) => {
          const status = getPollutantStatus(pollutant.value, pollutant.safeThreshold, pollutant.modThreshold)
          return (
            <Card
              key={pollutant.code}
              className="p-3.5 bg-muted/20 hover:bg-muted/30 border border-border/15 rounded-xl space-y-2 shadow-xs ring-0 transition-colors font-sans"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-sans font-bold text-foreground">
                  {pollutant.code}
                </span>
                <span className={`text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded-md border ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-sans text-muted-foreground leading-tight truncate" title={pollutant.name}>
                  {pollutant.name}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base sm:text-lg font-sans font-bold text-foreground tabular-nums">
                    {pollutant.value.toFixed(pollutant.decimals)}
                  </span>
                  <span className="text-[10px] font-sans text-muted-foreground">
                    {pollutant.unit}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Index Framework Card */}
      <Card className="p-3 bg-muted/15 border border-border/10 rounded-xl flex items-center justify-between gap-3 shadow-xs ring-0 font-sans">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-muted-foreground/75 shrink-0" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-sans font-semibold text-foreground block">
              EPA US Air Quality Index (0–500 Framework)
            </span>
            <span className="text-[10px] font-sans text-muted-foreground block">
              Calculated via atmospheric pollutant models (CAMS/Open-Meteo) calibrated for ambient Philippine monitoring stations.
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

