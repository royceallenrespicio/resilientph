"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { useDashboardData } from "@/hooks/home/use-hazard-feeds"
import { PortalHeader } from "@/components/ui/portal-header"
import { QuakeWidget } from "@/components/home/widgets/QuakeWidget"
import { GDACSWidget } from "@/components/home/widgets/GDACSWidget"
import { IncidentAlertsWidget } from "@/components/home/widgets/IncidentAlertsWidget"
import WeatherForecast from "@/components/home/weather/WeatherForecast"
import { RegionalForecast } from "@/components/home/widgets/RegionalForecast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RefreshCw, CloudSun, Map, ShieldAlert, AlertTriangle } from "lucide-react"
import { HomeMarquee } from "@/components/home/navigation/HomeMarquee"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { AiChatDrawer } from "@/components/chat/drawers/AiChatDrawer"
import { useIncidentAlerts } from "@/hooks/home/use-incident-alerts"
import { isActiveGDACSEvent } from "@/lib/emergency/gdacs"
import { cn } from "@/lib/utils"
import { useIsTabletOrMobile } from "@/hooks/use-breakpoints"
import { HomeSkeletonGrid } from "@/components/home/widgets/HomeSkeletonGrid"
import { TyphoonDialog } from "@/components/home/typhoon/TyphoonDialog"

// Variants for staggered entrance animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 25
    }
  }
} as const

export default function HomePageClient() {
  const {
    earthquakes,
    phivolcsQuakes,
    typhoon,
    pagasaDaily,
    pagasaTemps,
    pagasaWeekly,
    pagasaRegional,
    gdacsEvents,
    loading,
    handleRefresh
  } = useDashboardData()

  const { incidents: communityIncidents, loading: loadingIncidents } = useIncidentAlerts()

  const activeGdacsEvents = gdacsEvents.filter(isActiveGDACSEvent)
  const hasActiveGdacs = activeGdacsEvents.length > 0
  const showGdacs = hasActiveGdacs || loading

  const significantQuakes = [...earthquakes, ...phivolcsQuakes].filter(q => {
    return q.magnitude >= 4.5
  })

  const activeBulletin = React.useMemo(() => {
    return typhoon?.find((t) => t.active) ?? null
  }, [typhoon])

  const hasActiveInsidePar = !!typhoon?.some((t) => t.active)

  const isTcActive = hasActiveInsidePar

  const totalAlertsCount = communityIncidents.length + activeGdacsEvents.length + significantQuakes.length + (isTcActive ? 1 : 0)


  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPrompt, setDrawerPrompt] = useState("")
  const isTabletOrMobile = useIsTabletOrMobile()
  const [activeTab, setActiveTab] = useState<string>("daily")
  const [bulletinOpen, setBulletinOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const stormName = React.useMemo(() => {
    if (hasActiveInsidePar && activeBulletin?.title) {
      return activeBulletin.title
    }
    return null
  }, [hasActiveInsidePar, activeBulletin])

  const handleAnalyze = (prompt: string) => {
    if (isTabletOrMobile) {
      setDrawerPrompt(prompt)
      setDrawerOpen(true)
    } else {
      router.push(`/chat?prompt=${encodeURIComponent(prompt)}`)
    }
  }

  const weatherWidget = (
    <ErrorBoundary>
      <WeatherForecast
        pagasaDaily={pagasaDaily}
        pagasaTemps={pagasaTemps}
        pagasaWeekly={pagasaWeekly}
        onAnalyze={handleAnalyze}
      />
    </ErrorBoundary>
  )

  const regionalWidget = (
    <ErrorBoundary>
      <RegionalForecast
        pagasaRegional={pagasaRegional}
        loading={loading}
        onAnalyze={handleAnalyze}
      />
    </ErrorBoundary>
  )

  const alertsWidget = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
      <div className="col-span-12">
        <ErrorBoundary>
          <IncidentAlertsWidget incidents={communityIncidents} loading={loadingIncidents} />
        </ErrorBoundary>
      </div>
      <div className={cn("col-span-12 flex flex-col", showGdacs ? "lg:col-span-7" : "lg:col-span-12")}>
        <ErrorBoundary>
          <QuakeWidget data={earthquakes} phivolcsData={phivolcsQuakes} loading={loading} />
        </ErrorBoundary>
      </div>
      {showGdacs && (
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <ErrorBoundary>
            <GDACSWidget data={gdacsEvents} loading={loading} />
          </ErrorBoundary>
        </div>
      )}
    </div>
  )

  const desktopTabsList = (
    <TabsList className="hidden lg:flex w-auto min-w-[340px] border border-border bg-card p-1 rounded-full gap-1 select-none h-9 shadow-bryl">
      <TabsTrigger value="daily" className="flex-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-sans font-medium whitespace-nowrap data-active:bg-foreground data-active:text-background">
        <CloudSun className="size-3.5 mr-1.5 shrink-0" />
        <span>Daily</span>
      </TabsTrigger>
      <TabsTrigger value="regional" className="flex-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-sans font-medium whitespace-nowrap data-active:bg-foreground data-active:text-background">
        <Map className="size-3.5 mr-1.5 shrink-0" />
        <span>Regional</span>
      </TabsTrigger>
      <TabsTrigger value="alerts" className="relative flex-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-sans font-medium whitespace-nowrap data-active:bg-foreground data-active:text-background">
        <ShieldAlert className="size-3.5 mr-1.5 shrink-0" />
        <span>Alerts</span>
        {totalAlertsCount > 0 && (
          <div className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-black px-1 text-[9px] font-bold motion-safe:animate-pulse shadow-xs shadow-amber-500/50">
            {totalAlertsCount}
          </div>
        )}
      </TabsTrigger>
    </TabsList>
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-y-auto bg-background text-foreground selection:bg-primary/25 font-sans">
      {/* Top sticky header showing ticking clock and refresh action */}
      <PortalHeader
        title="Readiness Portal"
        centerContent={desktopTabsList}
      >
        <Button
          id="refresh-dashboard-btn"
          onClick={handleRefresh}
          disabled={loading}
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all rounded-full cursor-pointer shrink-0 size-6"
          title="Refresh Feeds"
          aria-label="Refresh feeds"
        >
          <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </Button>
      </PortalHeader>

      {/* Ticker banner tracking active alerts */}
      <HomeMarquee typhoon={typhoon} pagasaDaily={pagasaDaily} loading={loading} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6" id="main-content">
        {/* Active Typhoon Warning Banner */}
        {isTcActive && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5 transition-all duration-300 backdrop-blur-md">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
                  <AlertTriangle className="size-5 motion-safe:animate-pulse" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-micro font-sans text-amber-400/80">PAGASA Advisory</span>
                    <span className="text-micro font-sans bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold shadow-xs">
                      PAR Weather Signal
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Tropical Cyclone Advisory {stormName ? `(${stormName})` : ""}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Active tropical cyclone detected inside the Philippine Area of Responsibility (PAR). Monitor official PAGASA bulletins.
                  </p>
                </div>
              </div>

              <TyphoonDialog
                bulletinOpen={bulletinOpen}
                setBulletinOpen={setBulletinOpen}
                tcInfo={pagasaDaily?.tc_info}
                typhoon={typhoon}
                onAnalyze={handleAnalyze}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading && gdacsEvents.length === 0 && earthquakes.length === 0 ? (
            <HomeSkeletonGrid />
          ) : (
            <motion.div
              key="loaded-widgets"
              className="flex flex-col w-full"
              variants={shouldReduceMotion ? undefined : containerVariants}
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
            >
              {/* Unified Tabs Layout */}
              <div className="flex flex-col w-full">
                <TabsList className="flex lg:hidden w-full mb-6 justify-start border border-border bg-card p-1 rounded-full gap-1 select-none h-9 overflow-x-auto no-scrollbar flex-nowrap shadow-bryl">
                  <TabsTrigger value="daily" className="flex-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-sans font-medium whitespace-nowrap data-active:bg-foreground data-active:text-background">
                    <CloudSun className="size-3.5 mr-1.5 shrink-0" />
                    <span>Daily</span>
                  </TabsTrigger>
                  <TabsTrigger value="regional" className="flex-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-sans font-medium whitespace-nowrap data-active:bg-foreground data-active:text-background">
                    <Map className="size-3.5 mr-1.5 shrink-0" />
                    <span>Regional</span>
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="relative flex-1 px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-sans font-medium whitespace-nowrap data-active:bg-foreground data-active:text-background">
                    <ShieldAlert className="size-3.5 mr-1.5 shrink-0" />
                    <span>Alerts</span>
                    {totalAlertsCount > 0 && (
                      <div className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground text-background px-1 text-[9px] font-bold">
                        {totalAlertsCount}
                      </div>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="m-0 space-y-0 focus-visible:outline-none focus-visible:ring-0">
                  <motion.div variants={shouldReduceMotion ? undefined : itemVariants} className="flex flex-col">
                    {weatherWidget}
                  </motion.div>
                </TabsContent>

                <TabsContent value="regional" className="m-0 space-y-0 focus-visible:outline-none focus-visible:ring-0">
                  <motion.div variants={shouldReduceMotion ? undefined : itemVariants} className="flex flex-col">
                    {regionalWidget}
                  </motion.div>
                </TabsContent>

                <TabsContent value="alerts" className="m-0 space-y-0 focus-visible:outline-none focus-visible:ring-0">
                  <motion.div variants={shouldReduceMotion ? undefined : itemVariants} className="flex flex-col">
                    {alertsWidget}
                  </motion.div>
                </TabsContent>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AiChatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialPrompt={drawerPrompt}
      />
    </Tabs>
  )
}
