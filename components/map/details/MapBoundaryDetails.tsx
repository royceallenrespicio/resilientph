"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-breakpoints"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Loader2, AlertCircle, ExternalLink, Globe, MapPin, Droplets, Calendar, CloudRain, Thermometer, Wind, ShieldAlert, X
} from "lucide-react"
import { WeatherData } from "@/lib/weather/meteo"
import { getWeatherConfig } from "@/lib/weather/weather-icons"
import { RegionProperties, ProvinceProperties, MunicityProperties } from "@/lib/map/types"
import { AnimatePresence, motion } from "motion/react"

interface BoundaryDetailsPanelProps {
  isOpen: boolean
  loading: boolean
  error: string | null
  weatherData: WeatherData | null
  weatherLoading: boolean
  weatherError: string | null
  region: RegionProperties | null
  province: ProvinceProperties | null
  municity: MunicityProperties | null
  onClose: () => void
  onOpenChat: (locationName: string, parentContext: string) => void
}

const getAqiSeverity = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", color: "bg-success/15 text-success border-success/25" }
  if (aqi <= 100) return { label: "Moderate", color: "bg-warning/15 text-warning border-warning/25" }
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "bg-alert/15 text-alert border-alert/25" }
  return { label: "Unhealthy", color: "bg-destructive/15 text-destructive border-destructive/25" }
}

export function BoundaryDetailsPanel({
  isOpen,
  loading,
  error,
  weatherData,
  weatherLoading,
  weatherError,
  region,
  province,
  municity,
  onClose,
  onOpenChat
}: BoundaryDetailsPanelProps) {
  // Keep local copies of the active state values to prevent flashing EmptyState or layout shifts during dialog exit animations
  const [prevProps, setPrevProps] = useState({
    isOpen, region, province, municity, weatherData, loading, error, weatherLoading, weatherError
  })
  const [renderedRegion, setRenderedRegion] = useState<RegionProperties | null>(region)
  const [renderedProvince, setRenderedProvince] = useState<ProvinceProperties | null>(province)
  const [renderedMunicity, setRenderedMunicity] = useState<MunicityProperties | null>(municity)
  const [renderedWeatherData, setRenderedWeatherData] = useState<WeatherData | null>(weatherData)
  const [renderedLoading, setRenderedLoading] = useState<boolean>(loading)
  const [renderedError, setRenderedError] = useState<string | null>(error)
  const [renderedWeatherLoading, setRenderedWeatherLoading] = useState<boolean>(weatherLoading)
  const [renderedWeatherError, setRenderedWeatherError] = useState<string | null>(weatherError)

  if (
    isOpen !== prevProps.isOpen ||
    region !== prevProps.region ||
    province !== prevProps.province ||
    municity !== prevProps.municity ||
    weatherData !== prevProps.weatherData ||
    loading !== prevProps.loading ||
    error !== prevProps.error ||
    weatherLoading !== prevProps.weatherLoading ||
    weatherError !== prevProps.weatherError
  ) {
    setPrevProps({
      isOpen, region, province, municity, weatherData, loading, error, weatherLoading, weatherError
    })
    if (isOpen) {
      setRenderedRegion(region)
      setRenderedProvince(province)
      setRenderedMunicity(municity)
      setRenderedWeatherData(weatherData)
      setRenderedLoading(loading)
      setRenderedError(error)
      setRenderedWeatherLoading(weatherLoading)
      setRenderedWeatherError(weatherError)
    }
  }

  // Determine name and metadata
  const isMunicity = !!renderedMunicity
  const isProvince = !renderedMunicity && !!renderedProvince
  const isRegion = !renderedMunicity && !renderedProvince && !!renderedRegion

  let locationName = "Select Location"
  let levelLabel = "N/A"
  let pcode = "N/A"
  let parentContext = ""

  if (isMunicity && renderedMunicity) {
    locationName = renderedMunicity.ADM3_EN
    levelLabel = "City / Municipality"
    pcode = renderedMunicity.ADM3_PCODE
    parentContext = `${renderedMunicity.ADM2_EN}, ${renderedMunicity.ADM1_EN}`
  } else if (isProvince && renderedProvince) {
    locationName = renderedProvince.ADM2_EN
    levelLabel = "Province"
    pcode = renderedProvince.ADM2_PCODE
    parentContext = renderedProvince.ADM1_EN
  } else if (isRegion && renderedRegion) {
    locationName = renderedRegion.ADM1_EN
    levelLabel = "Region"
    pcode = renderedRegion.ADM1_PCODE
    parentContext = renderedRegion.ADM1ALT1EN ? `${renderedRegion.ADM1ALT1EN} (PH)` : "Philippines"
  }

  const handleOpenChat = () => {
    onOpenChat(locationName, parentContext)
  }

  const isMobile = useIsMobile()

  const panelContent = (
    <div className="px-0 md:px-5 pb-5 pt-4 space-y-4 font-sans max-w-7xl mx-auto w-full">
      {renderedLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs py-8 justify-center select-none">
          <Loader2 className="size-4 animate-spin text-info" />
          <span className="font-sans">Updating spatial metadata...</span>
        </div>
      ) : renderedError ? (
        <div className="flex flex-col items-center justify-center text-center py-8 gap-2 text-destructive select-none">
          <AlertCircle className="size-8 opacity-75" />
          <div>
            <p className="text-xs font-semibold">Failed to load boundary data</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[250px]">{renderedError}</p>
          </div>
        </div>
      ) : renderedRegion || renderedProvince || renderedMunicity ? (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left Pane: Context & Action */}
          <div className="w-full md:w-[280px] lg:w-[320px] shrink-0 flex flex-col gap-3">
            {/* Location Card */}
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {locationName}
                  </h3>
                  {parentContext && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-semibold">
                      <Globe className="size-3.5 text-muted-foreground/60 shrink-0" />
                      {parentContext}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs font-sans shrink-0 px-2 py-0.5 border-primary/25 bg-primary/5 font-semibold">
                  {levelLabel.toUpperCase()}
                </Badge>
              </div>
              <Separator className="border-border/5 my-1" />
              <div className="flex justify-between items-center text-xs font-sans text-muted-foreground">
                <span>PSGC IDENTIFIER</span>
                <span className="text-foreground font-bold">{pcode}</span>
              </div>
            </div>

            {/* Action button */}
            <div className="flex flex-col gap-2 w-full mt-auto md:mt-0">
              <Button
                variant="outline"
                className="w-full text-xs font-sans font-semibold uppercase tracking-wider border-border/30 gap-1.5 cursor-pointer h-9 hover:bg-muted"
                onClick={handleOpenChat}
              >
                <span>Analyze locality with AI</span>
                <ExternalLink className="size-3.5 text-primary" />
              </Button>
            </div>
          </div>

          <Separator className="my-1 md:hidden" />

          {/* Right Pane: Weather structured data */}
          <div className="flex-1 min-w-0">
            {renderedWeatherLoading ? (
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-3 animate-pulse">
              <div className="flex items-center gap-2 text-muted-foreground text-xs justify-center py-2 select-none">
                <Loader2 className="size-3.5 animate-spin text-info" />
                <span className="font-sans">Querying Open-Meteo logs...</span>
              </div>
            </div>
          ) : renderedWeatherError ? (
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl text-center text-xs text-muted-foreground select-none">
              {renderedWeatherError}
            </div>
          ) : renderedWeatherData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 font-sans">
              {/* Current Weather Grid */}
              <div className="flex flex-col gap-3">
                {/* Temp & Icon Card */}
                <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-sans text-muted-foreground font-bold uppercase tracking-wider select-none">TEMP</p>
                    <p className="text-3xl font-extrabold font-sans text-foreground tracking-tight leading-none tabular-nums">
                      {renderedWeatherData.temp.toFixed(1)}°C
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-sans select-none">
                      Feels like <span className="tabular-nums">{renderedWeatherData.feelsLike.toFixed(0)}°C</span>
                    </p>
                  </div>
                  {(() => {
                    const conf = getWeatherConfig(renderedWeatherData.weatherCode)
                    const IconComp = conf.icon
                    return (
                      <div className="flex flex-col items-center gap-1.5 shrink-0 text-right select-none">
                        <IconComp className={`size-8 ${conf.color} shrink-0`} />
                        <span className="text-xs font-sans font-bold tracking-tight text-foreground truncate max-w-[90px]">
                          {conf.text}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Climate parameters */}
                <div className="p-3 bg-muted/20 border border-border/40 rounded-xl grid grid-cols-2 gap-3 text-xs font-sans text-muted-foreground">
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="flex items-center justify-center gap-1"><Droplets className="size-3.5 text-info shrink-0" />Hum</span>
                    <span className="text-foreground font-bold block tabular-nums text-sm">{renderedWeatherData.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="flex items-center justify-center gap-1"><Wind className="size-3.5 text-muted-foreground shrink-0" />Wind</span>
                    <span className="text-foreground font-bold block truncate tabular-nums text-sm">{renderedWeatherData.windSpeed.toFixed(0)} km/h</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="flex items-center justify-center gap-1"><CloudRain className="size-3.5 text-info shrink-0" />Rain</span>
                    <span className="text-foreground font-bold block tabular-nums text-sm">{renderedWeatherData.precipitation.toFixed(1)} mm</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="flex items-center justify-center gap-1"><Thermometer className="size-3.5 text-warning shrink-0" />Index</span>
                    <span className="text-foreground font-bold block tabular-nums text-sm">AQI {renderedWeatherData.aqi}</span>
                  </div>
                </div>
              </div>

              {/* Air Quality Details */}
              <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground select-none">
                    Air Quality & Pollutants
                  </span>
                  <Badge className={`text-xs font-sans px-2 py-0.5 border ${getAqiSeverity(renderedWeatherData.aqi).color} font-semibold`}>
                    {getAqiSeverity(renderedWeatherData.aqi).label}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs font-sans text-muted-foreground border-t border-border/5 pt-3">
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="select-none text-[11px] uppercase tracking-wider">PM2.5</span>
                    <span className="text-foreground font-bold block tabular-nums text-sm">{renderedWeatherData.pm2_5.toFixed(1)} µg/m³</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="select-none text-[11px] uppercase tracking-wider">PM10</span>
                    <span className="text-foreground font-bold block tabular-nums text-sm">{renderedWeatherData.pm10.toFixed(1)} µg/m³</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="select-none text-[11px] uppercase tracking-wider">Ozone (O₃)</span>
                    <span className="text-foreground font-bold block tabular-nums text-sm">{renderedWeatherData.o3.toFixed(1)} µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Forecast Table */}
              <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-3 font-sans">
                <div className="flex items-center gap-1.5 select-none">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
                    3-Day Forecast
                  </span>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/5">
                  {renderedWeatherData.dailyForecast.slice(1, 4).map((day) => {
                    const conf = getWeatherConfig(day.weatherCode)
                    const IconComp = conf.icon
                    return (
                      <div key={day.date} className="flex items-center justify-between text-xs font-sans py-1">
                        <span className="text-muted-foreground w-20 shrink-0 select-none font-medium">{day.date}</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0 pl-1 select-none">
                          <IconComp className={`size-4 ${conf.color} shrink-0`} />
                          <span className="text-xs text-muted-foreground/80 truncate">{conf.text}</span>
                        </div>
                        <div className="text-right flex items-center gap-2 shrink-0">
                          <span className="text-foreground font-semibold tabular-nums text-sm whitespace-nowrap">
                            {day.tempMax.toFixed(0)}° / {day.tempMin.toFixed(0)}°
                          </span>
                          {day.rainProb > 0 && (
                            <span className="text-info font-semibold text-xs w-8 shrink-0 tabular-nums text-right">
                              {day.rainProb}%
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground gap-2 select-none font-sans">
          <ShieldAlert className="size-10 opacity-30" />
          <p className="text-xs font-semibold">No area selected</p>
          <p className="text-[11px] max-w-[220px]">
            Click on an administrative polygon (region, province, or city) to view localized georeferencing and weather forecasts.
          </p>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-md mx-auto">
          <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-6">
            <DrawerHeader className="pb-4 border-b border-border/40 select-none text-left px-0 flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4 text-info animate-bounce shrink-0" />
                <DrawerTitle className="text-base font-semibold tracking-wider font-sans text-foreground uppercase">
                  Locality Details
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-sm text-muted-foreground font-sans pl-[22px]">
                Subnational Spatial Profile
              </DrawerDescription>
            </DrawerHeader>

            {panelContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // 2. Desktop Layout: Floating absolute card without backdrop
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-0 right-0 z-40 w-full h-[320px] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-t border-border/40 bg-card overflow-hidden flex flex-col font-sans"
        >
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-border/40 shrink-0 bg-card">
            <div className="flex flex-row items-center gap-3 max-w-7xl mx-auto w-full">
              <MapPin className="size-4 text-info animate-bounce shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-0 flex-1 min-w-0">
                <h2 className="text-sm font-semibold tracking-wider font-sans text-foreground uppercase truncate">
                  Locality Details
                </h2>
                <p className="text-xs font-sans text-muted-foreground truncate">
                  Subnational Spatial Profile
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full shrink-0 -mr-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={onClose}
                aria-label="Close panel"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          <ScrollArea className="w-full flex-1">
            {panelContent}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
