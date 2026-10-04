"use client"

import React, { useState } from "react"
import { Droplets, Wind, CloudRain, Thermometer, Calendar, Compass, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getWeatherConfig } from "@/lib/weather/weather-icons"
import { formatWeatherText, cn } from "@/lib/utils"
import { PagasaDailyWeather, PagasaTemperatures, PagasaWeeklyOutlook } from "@/lib/home/types"

interface DailyForecastItem {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  rainProb: number
}

interface PagasaWeeklyOutlookItem {
  period: string
  content: string
}

// Helper to format days like "Monday" to "Monday, Jul 13" based on current date
function formatOutlookDate(dayName: string): string {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const targetIndex = daysOfWeek.findIndex(d => d.toLowerCase() === dayName.trim().toLowerCase())
  if (targetIndex === -1) return dayName // fallback if it's not a day name

  const today = new Date()
  const todayIndex = today.getDay()

  // Calculate days ahead
  let daysAhead = targetIndex - todayIndex
  if (daysAhead <= 0) {
    daysAhead += 7
  }

  // If it's the exact same day, assume it's today's outlook
  if (daysAhead === 7) {
    daysAhead = 0
  }

  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysAhead)

  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(targetDate)
}

interface WeatherOverviewTabProps {
  weather: {
    temp: number
    feelsLike: number
    weatherCode: number
    humidity: number
    windSpeed: number
    precipitation: number
    aqi: number
    dailyForecast: DailyForecastItem[]
  }
  pagasaDaily?: PagasaDailyWeather | null
  pagasaTemps?: PagasaTemperatures | null
  pagasaWeekly?: PagasaWeeklyOutlook | null
}

export function WeatherOverviewTab({
  weather,
  pagasaDaily,
  pagasaTemps,
  pagasaWeekly
}: WeatherOverviewTabProps) {
  const [subView, setSubView] = useState<"local" | "national">("local")

  const currentConf = getWeatherConfig(weather.weatherCode)
  const CurrentIcon = currentConf.icon

  // Local Weather Elements
  const localWeatherContent = (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch px-1">
        {/* Temp summary */}
        <Card className="lg:col-span-4 p-4 bg-muted/20 border border-border/10 rounded-xl flex flex-row items-center justify-between gap-3 shadow-sm ring-0">
          <div className="space-y-1.5">
            <p className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase">CURRENT TEMP</p>
            <p className="text-3xl font-extrabold font-sans text-foreground leading-none tracking-tight">
              {weather.temp.toFixed(1)}°C
            </p>
            <p className="text-xs text-muted-foreground font-sans">
              Feels like <span>{weather.feelsLike.toFixed(0)}°C</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0 text-right select-none">
            <CurrentIcon className={`size-10 ${currentConf.color} shrink-0`} />
            <span className="text-xs font-sans font-semibold text-foreground truncate max-w-[100px]">
              {currentConf.text}
            </span>
          </div>
        </Card>

        {/* Parameters panel */}
        <Card className="lg:col-span-8 p-4 bg-muted/20 border border-border/10 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-muted-foreground shadow-sm content-center items-start ring-0">
          <div className="space-y-1 flex flex-col items-center text-center">
            <span className="flex items-center gap-1"><Droplets className="size-3.5 text-info shrink-0" />Humidity</span>
            <span className="text-foreground text-sm font-bold block tabular-nums">{weather.humidity}%</span>
          </div>
          <div className="space-y-1 flex flex-col items-center text-center">
            <span className="flex items-center gap-1"><Wind className="size-3.5 text-muted-foreground shrink-0" />Wind Speed</span>
            <span className="text-foreground text-sm font-bold block truncate tabular-nums">{weather.windSpeed.toFixed(0)} km/h</span>
          </div>
          <div className="space-y-1 flex flex-col items-center text-center">
            <span className="flex items-center gap-1"><CloudRain className="size-3.5 text-info shrink-0" />Precipitation</span>
            <span className="text-foreground text-sm font-bold block tabular-nums">{weather.precipitation.toFixed(1)} mm</span>
          </div>
          <div className="space-y-1 flex flex-col items-center text-center">
            <span className="flex items-center gap-1"><Thermometer className="size-3.5 text-warning shrink-0" />US AQI</span>
            <span className="text-foreground text-sm font-bold block tabular-nums">{weather.aqi}</span>
          </div>
        </Card>
      </div>      {/* 7-Day outlook section */}
      <div className="space-y-3 px-1 pt-1">
        <div className="flex items-center gap-1.5 select-none">
          <Calendar className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
            Local 7-Day Outlook
          </span>
        </div>

        {/* Desktop Outlook List */}
        <div className="hidden lg:grid grid-cols-7 gap-3">
          {weather.dailyForecast.map((day) => {
            const conf = getWeatherConfig(day.weatherCode)
            const IconComp = conf.icon
            const formatted = formatOutlookDate(day.date)
            const commaIndex = formatted.indexOf(",")
            const dayName = commaIndex !== -1 ? formatted.slice(0, commaIndex) : formatted
            const dateStr = commaIndex !== -1 ? formatted.slice(commaIndex + 1).trim() : ""
            return (
              <Card
                key={day.date}
                className="bg-muted/20 border border-border/10 px-3 py-3 rounded-xl flex flex-col justify-between items-center text-center gap-2 hover:bg-muted/40 transition-colors shadow-xs ring-0"
              >
                <div className="flex flex-col items-center select-none">
                  <span className="text-sm text-foreground font-sans font-semibold leading-tight">{dayName}</span>
                  {dateStr && <span className="text-[10px] text-muted-foreground font-sans leading-tight mt-0.5">{dateStr}</span>}
                </div>
                <div className="flex flex-col items-center gap-1 my-0.5 justify-center">
                  <IconComp className={`size-6 ${conf.color} shrink-0`} />
                  <span className="text-xs text-muted-foreground font-sans truncate max-w-[80px]" title={conf.text}>
                    {conf.text}
                  </span>
                </div>
                <div className="text-center flex flex-col items-center gap-1">
                  <span className="text-sm text-foreground font-bold font-sans tabular-nums">
                    {day.tempMax.toFixed(0)}° / {day.tempMin.toFixed(0)}°
                  </span>
                  {day.rainProb > 0 && (
                    <span className="text-info font-bold text-xs font-sans block tabular-nums">
                      {day.rainProb}% rain
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Mobile/Tablet Outlook Carousel */}
        <div className="block lg:hidden w-full">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-3">
              {weather.dailyForecast.map((day) => {
                const conf = getWeatherConfig(day.weatherCode)
                const IconComp = conf.icon
                const formatted = formatOutlookDate(day.date)
                const commaIndex = formatted.indexOf(",")
                const dayName = commaIndex !== -1 ? formatted.slice(0, commaIndex) : formatted
                const dateStr = commaIndex !== -1 ? formatted.slice(commaIndex + 1).trim() : ""
                return (
                  <CarouselItem key={day.date} className="pl-3 basis-1/2 sm:basis-1/3">
                    <Card className="bg-muted/20 border border-border/10 px-3 py-3.5 rounded-xl flex flex-col justify-between items-center text-center gap-2.5 hover:bg-muted/40 transition-colors shadow-xs ring-0 h-full">
                      <div className="flex flex-col items-center select-none">
                        <span className="text-sm text-foreground font-sans font-semibold leading-tight">{dayName}</span>
                        {dateStr && <span className="text-[10px] text-muted-foreground font-sans leading-tight mt-0.5">{dateStr}</span>}
                      </div>
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <IconComp className={`size-6 ${conf.color} shrink-0`} />
                        <span className="text-xs text-muted-foreground font-sans truncate max-w-[100px]" title={conf.text}>
                          {conf.text}
                        </span>
                      </div>
                      <div className="text-center flex flex-col items-center gap-1">
                        <span className="text-sm text-foreground font-bold font-sans tabular-nums">
                          {day.tempMax.toFixed(0)}° / {day.tempMin.toFixed(0)}°
                        </span>
                        {day.rainProb > 0 && (
                          <span className="text-info font-bold text-xs font-sans block tabular-nums">
                            {day.rainProb}% rain
                          </span>
                        )}
                      </div>
                    </Card>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <div className="flex justify-center gap-1.5 mt-3">
              <CarouselPrevious className="static translate-y-0 translate-x-0 size-8 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/40" />
              <CarouselNext className="static translate-y-0 translate-x-0 size-8 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/40" />
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  )

  // National Weather Elements (PAGASA)
  const nationalWeatherContent = (
    <div className="space-y-4 animate-in fade-in duration-200">
      {!pagasaDaily ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground select-none bg-muted/5 rounded-xl border border-border/5">
          <Info className="size-8 text-muted-foreground/35 mb-2" />
          <p className="text-sm font-semibold">No official PAGASA forecast synopsis found.</p>
          <p className="text-xs text-muted-foreground/75 mt-1">Please try refreshing in the portal header.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-1">
          {/* Official Synopsis */}
          <Card className="p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0 w-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/10 pb-2 select-none">
                <span className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                  <Compass className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                  OFFICIAL SYNOPSIS
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-sans">
                    Issued: {pagasaDaily.issued_at}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed text-justify whitespace-pre-line">
                {formatWeatherText(pagasaDaily.synopsis)}
              </p>
            </div>
          </Card>

          {/* Extremes & 7-Day Outlook */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {pagasaTemps && pagasaTemps.lowest && pagasaTemps.highest && (
              <Card className="p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0 lg:col-span-4 flex flex-col">
                <div className="space-y-3">
                  <span className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/10 pb-2 select-none">
                    <Thermometer className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                    Extremes (As of {pagasaTemps.highest_as_of})
                  </span>
                  <Accordion type="single" collapsible className="w-full space-y-2 border-none">
                    {pagasaTemps.highest && pagasaTemps.highest.length > 0 && (
                      <AccordionItem value="highest" className="border border-border/10 rounded-xl bg-muted/30 px-3">
                        <AccordionTrigger className="hover:no-underline py-3 data-[state=open]:pb-2">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-sans font-bold text-destructive tracking-wider uppercase">Highest Temp</span>
                            <div className="flex items-center gap-2 text-xs font-sans text-left">
                              <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-[160px]">{pagasaTemps.highest[0].station}</span>
                              <span className="font-bold text-destructive shrink-0">{pagasaTemps.highest[0].temp}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0 pb-3">
                          <ScrollArea className="h-[200px] pr-3 mt-2">
                            <div className="divide-y divide-border/10">
                              {pagasaTemps.highest.map((item, i) => (
                                <div key={`high-${i}`} className="flex justify-between items-center text-xs py-2 bg-transparent font-sans">
                                  <span className="font-medium truncate mr-2 text-foreground/90">{i + 1}. {item.station}</span>
                                  <span className="font-bold text-destructive shrink-0">{item.temp}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {pagasaTemps.lowest && pagasaTemps.lowest.length > 0 && (
                      <AccordionItem value="lowest" className="border border-border/10 rounded-xl bg-muted/30 px-3">
                        <AccordionTrigger className="hover:no-underline py-3 data-[state=open]:pb-2">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-sans font-bold text-info tracking-wider uppercase">Lowest Temp</span>
                            <div className="flex items-center gap-2 text-xs font-sans text-left">
                              <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-[160px]">{pagasaTemps.lowest[0].station}</span>
                              <span className="font-bold text-info shrink-0">{pagasaTemps.lowest[0].temp}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0 pb-3">
                          <ScrollArea className="h-[200px] pr-3 mt-2">
                            <div className="divide-y divide-border/10">
                              {pagasaTemps.lowest.map((item, i) => (
                                <div key={`low-${i}`} className="flex justify-between items-center text-xs py-2 bg-transparent">
                                  <span className="font-medium truncate mr-2 text-foreground/90">{i + 1}. {item.station}</span>
                                  <span className="font-bold text-info shrink-0">{item.temp}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              </Card>
            )}

            {pagasaWeekly && Array.isArray(pagasaWeekly.outlook) && (
              <Card className={`p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0 flex flex-col ${pagasaTemps && pagasaTemps.lowest && pagasaTemps.highest ? "lg:col-span-8" : "lg:col-span-12"}`}>
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <span className="text-xs font-sans font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/10 pb-2 select-none shrink-0">
                    <Calendar className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                    National 7-Day Outlook
                  </span>
                  <div className="flex-1 w-full min-h-0 flex flex-col pt-1">
                    <Carousel opts={{ align: "start" }} className="w-full h-full flex flex-col min-h-0">
                      <CarouselContent className="-ml-3 flex-1 min-h-0 h-full">
                        {pagasaWeekly.outlook.filter((o: PagasaWeeklyOutlookItem) => o.period).map((o: PagasaWeeklyOutlookItem, idx: number) => (
                          <CarouselItem key={idx} className="pl-3 basis-full md:basis-1/2 xl:basis-1/3 h-full flex flex-col min-h-0">
                            <div className="bg-transparent border-none p-1 h-full flex flex-col gap-2.5 min-h-0">
                              <span className="font-semibold text-foreground bg-muted/50 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider w-fit shrink-0">
                                {o.period}
                              </span>
                              <ScrollArea className="flex-1 min-h-0 pr-3 w-full">
                                <p className="text-xs text-foreground/85 font-sans leading-relaxed text-justify pb-2">
                                  {formatWeatherText(o.content)}
                                </p>
                              </ScrollArea>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <div className="flex justify-center gap-1.5 mt-3 shrink-0">
                        <CarouselPrevious className="static translate-y-0 translate-x-0 size-8 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/40" />
                        <CarouselNext className="static translate-y-0 translate-x-0 size-8 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/40" />
                      </div>
                    </Carousel>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Segmented Control for Mobile/Tablet */}
      <div className="lg:hidden flex border border-border/50 bg-muted/30 p-1 rounded-xl gap-1 mb-2">
        <button
          onClick={() => setSubView("local")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
            subView === "local" ? "bg-card text-foreground shadow-xs border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
          )}
        >
          Local Weather
        </button>
        <button
          onClick={() => setSubView("national")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
            subView === "national" ? "bg-card text-foreground shadow-xs border border-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
          )}
        >
          National Advisory
        </button>
      </div>

      {/* Desktop always shows both; Mobile/Tablet relies on subView */}
      <div className={cn("flex flex-col space-y-6", subView === "local" ? "flex" : "hidden lg:flex")}>
        {localWeatherContent}
      </div>

      {/* Divider on Desktop */}
      <div className="hidden lg:block h-px w-full bg-border/20 mx-auto" />

      <div className={cn("flex flex-col space-y-6", subView === "national" ? "flex" : "hidden lg:flex")}>
        {nationalWeatherContent}
      </div>
    </div>
  )
}
