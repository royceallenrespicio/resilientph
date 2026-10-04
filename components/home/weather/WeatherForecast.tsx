"use client"

import React, { useState } from "react"
import {
  Navigation,
  RefreshCw,
  ShieldAlert,
  BrainCircuit,
  Info,
  CloudSun,
  LineChart,
  Wind,
  ScrollText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWeatherSearch } from "@/hooks/home/use-local-weather"
import { WeatherTrendsChart } from "./WeatherTrendsChart"
import { Intents } from "@/lib/chat/prompts"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { PagasaDailyWeather, PagasaTemperatures, PagasaWeeklyOutlook } from "@/lib/home/types"

// Decomposed Sub-components
import { WeatherOverviewTab } from "./WeatherOverviewTab"
import { WeatherBulletinsTab } from "./WeatherBulletinsTab"
import { WeatherAqiTab } from "./WeatherAqiTab"
import { WeatherLocationSearch } from "./WeatherLocationSearch"

interface HomeWeatherForecastProps {
  pagasaDaily?: PagasaDailyWeather | null
  pagasaTemps?: PagasaTemperatures | null
  pagasaWeekly?: PagasaWeeklyOutlook | null
  onAnalyze?: (prompt: string) => void
}

export default function WeatherForecast({
  pagasaDaily,
  pagasaTemps,
  pagasaWeekly,
  onAnalyze
}: HomeWeatherForecastProps = {}) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    weather,
    marine,
    loading,
    error,
    activeLocation,
    executeSearch,
    selectCity,
    detectLocation,
    handleRefresh
  } = useWeatherSearch()

  const [activeTab, setActiveTab] = useState<"forecast" | "regional" | "trends" | "aqi">("forecast")

  const handleTabChange = (val: string) => {
    setActiveTab(val as "forecast" | "regional" | "trends" | "aqi")
  }

  const handleAnalyzeWithAI = () => {
    if (!weather) return
    let prompt = ""
    const loc = activeLocation?.name || "my location"

    if (activeTab === "forecast") {
      prompt = Intents.getWeatherOutlook(loc)
    } else if (activeTab === "trends") {
      prompt = Intents.getWeatherTrends(loc)
    } else if (activeTab === "aqi") {
      prompt = Intents.getWeatherAQI(loc)
    } else if (activeTab === "regional") {
      prompt = Intents.getWeatherPagasa()
    }

    if (prompt && onAnalyze) {
      onAnalyze(prompt)
    }
  }

  return (
    <Card className="w-full border-none ring-0 shadow-none bg-background overflow-visible">
      {/* Standardized CardHeader to match GDACS & Earthquakes cards */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full select-none gap-4">
          <div className="flex-1 flex flex-col min-w-0 gap-1.5">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase font-sans">
              Daily Weather
            </CardTitle>
            <WeatherLocationSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              activeLocation={activeLocation}
              executeSearch={executeSearch}
              selectCity={selectCity}
            />
          </div>

          {/* Action controllers: location detector and refresh buttons on the right */}
          <TooltipProvider>
            <div className="flex items-center gap-1.5 select-none shrink-0 self-start mt-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={detectLocation}
                    className="size-8 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/40 transition-colors cursor-pointer shrink-0"
                  >
                    <Navigation className="size-3.5 text-foreground" />
                    <span className="sr-only">Detect Current Location</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-sans">
                  Detect Current Location
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="size-8 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/40 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`size-3.5 text-foreground ${loading ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh Weather Reports</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-sans">
                  Refresh Weather Reports
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-5 md:pb-6">
        {/* Loading Skeletons */}
        {loading && !weather ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-[120px] rounded-xl bg-muted/10" />
              <Skeleton className="h-[120px] rounded-xl bg-muted/10 col-span-2" />
            </div>
            <Skeleton className="h-[100px] rounded-xl bg-muted/10" />
          </div>
        ) : error && !weather ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/10">
            <ShieldAlert className="size-8 opacity-75 mb-2" />
            <p className="text-sm font-semibold">Weather Service Issue</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        ) : weather ? (
          <div className="space-y-3">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Responsive container for tab headers and AI Insights button */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                {/* Desktop Tabs */}
                <TabsList className="hidden sm:flex flex-1 min-w-0 justify-start border border-border/50 bg-muted/50 p-0.5 rounded-xl gap-0.5 select-none shrink-0 h-fit max-w-full overflow-x-auto no-scrollbar flex-nowrap">
                  <TabsTrigger
                    value="forecast"
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans data-active:bg-card data-active:text-foreground data-active:shadow-sm"
                  >
                    <CloudSun className="size-3.5 mr-1" />
                    <span>Forecast</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="regional"
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans data-active:bg-card data-active:text-foreground data-active:shadow-sm"
                  >
                    <ScrollText className="size-3.5 mr-1" />
                    <span>Regional & Coastal</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="trends"
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans data-active:bg-card data-active:text-foreground data-active:shadow-sm"
                  >
                    <LineChart className="size-3.5 mr-1" />
                    <span>24h Trends</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="aqi"
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans data-active:bg-card data-active:text-foreground data-active:shadow-sm"
                  >
                    <Wind className="size-3.5 mr-1" />
                    <span>Air Quality</span>
                  </TabsTrigger>
                </TabsList>

                {/* Mobile Dropdown */}
                <div className="sm:hidden w-full">
                  <Select value={activeTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full bg-muted/50 border border-border/50 h-9 rounded-xl text-xs font-medium focus:ring-0">
                      <SelectValue placeholder="Select View" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-h-60 bg-card/95 border border-border/50 rounded-xl backdrop-blur-md">
                      <SelectItem value="forecast" className="text-xs font-medium cursor-pointer">Forecast</SelectItem>
                      <SelectItem value="regional" className="text-xs font-medium cursor-pointer">Regional & Coastal</SelectItem>
                      <SelectItem value="trends" className="text-xs font-medium cursor-pointer">24h Trends</SelectItem>
                      <SelectItem value="aqi" className="text-xs font-medium cursor-pointer">Air Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAnalyzeWithAI}
                  className="text-xs font-sans border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary gap-1 px-3 h-9 rounded-xl cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                >
                  <BrainCircuit className="size-3.5" />
                  <span>AI Insights</span>
                </Button>
              </div>

              <div className="mt-2">

                {activeTab === "forecast" && (
                  <WeatherOverviewTab
                    weather={weather}
                    pagasaDaily={pagasaDaily}
                    pagasaTemps={pagasaTemps}
                    pagasaWeekly={pagasaWeekly}
                  />
                )}

                {activeTab === "trends" && (
                  <Card className="p-4 bg-muted/20 border border-border/10 rounded-xl shadow-sm ring-0">
                    <div className="flex items-center gap-1.5 select-none mb-3">
                      <Info className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
                        24-Hour Trends Chart
                      </span>
                    </div>
                    <WeatherTrendsChart
                      hourlyTemps={weather.hourlyTemps}
                      hourlyTimes={weather.hourlyTimes}
                      hourlyRainProb={weather.hourlyRainProb}
                    />
                  </Card>
                )}

                {activeTab === "aqi" && (
                  <div className="font-sans">
                    <WeatherAqiTab weather={weather} />
                  </div>
                )}

                {activeTab === "regional" && (
                  <WeatherBulletinsTab
                    pagasaDaily={pagasaDaily}
                    marine={marine}
                    activeLocationName={activeLocation?.name}
                  />
                )}

              </div>
            </Tabs>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
