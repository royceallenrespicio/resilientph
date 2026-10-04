"use client"

import { Suspense, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { useEarthquakes } from "@/hooks/map/use-map-earthquakes"
import { useCommunityReports } from "@/hooks/map/use-community-reports"
import { MapSidebar } from "@/components/map/core/MapSidebar"
import { PortalHeader } from "@/components/ui/portal-header"
import { useIsTabletOrMobile } from "@/hooks/use-breakpoints"

const EarthquakeMap = dynamic(() => import("@/components/map/core/MapPortal"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full h-full bg-background flex flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-muted-foreground/40" />
      <span className="text-xs text-muted-foreground/80 font-sans tracking-wide">Loading interactive map viewport...</span>
    </div>
  )
})

function MapContent() {
  const {
    earthquakes,
    filteredEarthquakes,
    selectedEarthquake,
    loading: earthquakeLoading,
    searchQuery,
    setSearchQuery,
    minMagnitude,
    setMinMagnitude,
    timeRange,
    setTimeRange,
    selectedSource,
    setSelectedSource,
    selectedId,
    setSelectedId
  } = useEarthquakes()

  const {
    incidents,
    refetch: refetchReports
  } = useCommunityReports()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showEarthquakes, setShowEarthquakes] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showBoundaries, setShowBoundaries] = useState(true)

  // Screen size detection using shared hook
  const isTabletOrMobile = useIsTabletOrMobile()
  const [prevIsTabletOrMobile, setPrevIsTabletOrMobile] = useState(isTabletOrMobile)

  if (isTabletOrMobile !== prevIsTabletOrMobile) {
    setPrevIsTabletOrMobile(isTabletOrMobile)
    setSidebarOpen(!isTabletOrMobile)
  }

  // Helper to change selection
  const handleSelect = (id: string | null) => {
    setSelectedId(id)
    if (id) {
      setSidebarOpen(false)
    } else {
      if (!isTabletOrMobile) {
        setSidebarOpen(true)
      }
    }
  }

  const handleToggleSidebar = (open: boolean) => {
    setSidebarOpen(open)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Flat Map Header */}
      <PortalHeader
        title="Geological Portal"
      >
      </PortalHeader>

      <div className="flex-1 w-full relative flex overflow-hidden">
        {/* Main Map Canvas */}
        <EarthquakeMap
          filteredEarthquakes={filteredEarthquakes}
          selectedEarthquake={selectedEarthquake}
          setSelectedId={handleSelect}
          incidents={incidents}
          refetchReports={refetchReports}
          showEarthquakes={showEarthquakes}
          setShowEarthquakes={setShowEarthquakes}
          showIncidents={showIncidents}
          setShowIncidents={setShowIncidents}
          showBoundaries={showBoundaries}
          setShowBoundaries={setShowBoundaries}
          minMagnitude={minMagnitude}
          setMinMagnitude={setMinMagnitude}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          isTabletOrMobile={isTabletOrMobile}
        />

        {/* Floating Geological Logs Sidebar */}
        <MapSidebar
          earthquakes={earthquakes}
          filteredEarthquakes={filteredEarthquakes}
          selectedId={selectedId}
          onSelect={(quake) => handleSelect(quake.id)}
          loading={earthquakeLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isOpen={sidebarOpen}
          setIsOpen={handleToggleSidebar}
          isTabletOrMobile={isTabletOrMobile}
        />
      </div>
    </div>
  )
}

export default function MapPageClient() {
  return (
    <div className="flex-1 flex flex-col w-full h-screen overflow-hidden bg-background">
      <Suspense fallback={
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center gap-3 bg-background">
          <Loader2 className="size-8 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/80 font-sans tracking-wide">Initializing geological portal...</span>
        </div>
      }>
        <MapContent />
      </Suspense>
    </div>
  )
}


