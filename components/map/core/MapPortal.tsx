"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { useAiReview } from "@/hooks/map/use-event-insights"
import { useAdministrativeBoundaries } from "@/hooks/map/use-map-boundaries"
import { MapViewport } from "@/components/map/core/MapViewport"
import { AiReviewPanel } from "@/components/map/details/MapDetails"
import { BoundaryDetailsPanel } from "@/components/map/details/MapBoundaryDetails"
import { IncidentReport } from "@/lib/supabase/reports"
import { ReportDrawer } from "@/components/map/drawers/ReportDrawer"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { FilterDrawer } from "@/components/map/drawers/FilterDrawer"
import { AiChatDrawer } from "@/components/chat/drawers/AiChatDrawer"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"
import { IncidentDetailsPanel } from "@/components/map/details/IncidentDetails"
import { Intents } from "@/lib/chat/prompts"

interface EarthquakeMapProps {
  filteredEarthquakes: EarthquakeEvent[]
  selectedEarthquake: EarthquakeEvent | null
  setSelectedId: (id: string | null) => void
  incidents: IncidentReport[]
  refetchReports: () => void
  showEarthquakes: boolean
  setShowEarthquakes: (s: boolean) => void
  showIncidents: boolean
  setShowIncidents: (s: boolean) => void
  showBoundaries: boolean
  setShowBoundaries: (s: boolean) => void
  minMagnitude: number
  setMinMagnitude: (m: number) => void
  timeRange: number
  setTimeRange: (t: number) => void
  selectedSource: "all" | "phivolcs" | "usgs"
  setSelectedSource: (s: "all" | "phivolcs" | "usgs") => void
  sidebarOpen: boolean
  onToggleSidebar: (open: boolean) => void
  isTabletOrMobile: boolean
}

export default function EarthquakeMap({
  filteredEarthquakes,
  selectedEarthquake,
  setSelectedId,
  incidents,
  refetchReports,
  showEarthquakes,
  setShowEarthquakes,
  showIncidents,
  setShowIncidents,
  showBoundaries,
  setShowBoundaries,
  minMagnitude,
  setMinMagnitude,
  timeRange,
  setTimeRange,
  selectedSource,
  setSelectedSource,
  sidebarOpen,
  onToggleSidebar,
  isTabletOrMobile
}: EarthquakeMapProps) {
  const router = useRouter()

  // Map Center Tracker State
  const [mapCenter, setMapCenter] = useState({ lat: 12.8797, lng: 121.7740 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPrompt, setDrawerPrompt] = useState("")

  // User Reported Incidents detailed selection panel state
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)

  // Controlled Report Drawer open states and interactive location picker states
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false)
  const [isPickingLocation, setIsPickingLocation] = useState(false)
  const [pickedCoords, setPickedCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  // 1. Earthquake / Seismological details state
  const {
    aiPanelOpen,
    aiLoading,
    aiError,
    aiSections,
    analyzedEventId,
    closePanel,
    fetchInsights
  } = useAiReview()

  // 2. Administrative Boundaries details state (unified, zoom-driven)
  const {
    activeLevel,
    selectedRegion,
    selectedProvince,
    selectedMunicity,
    regionsGeoJson,
    hoveredId,
    hoveredName,
    loading: boundaryLoading,
    error: boundaryError,
    weatherData,
    weatherLoading,
    weatherError,
    updateActiveLevelAndFetch,
    selectRegion,
    selectProvince,
    selectMunicity,
    setHoveredId,
    setHoveredName,
    closeBoundaryPanel,
    provincesGeoJson,
    municitiesGeoJson
  } = useAdministrativeBoundaries()

  // Automatically trigger earthquake insights when selectedEarthquake changes
  useEffect(() => {
    if (selectedEarthquake) {
      if (selectedEarthquake.id !== analyzedEventId) {
        fetchInsights(selectedEarthquake)
      }
    } else {
      closePanel()
    }
  }, [selectedEarthquake, analyzedEventId, fetchInsights, closePanel])

  const handleOpenChat = useCallback((prompt: string) => {
    if (isTabletOrMobile) {
      setDrawerPrompt(prompt)
      setDrawerOpen(true)
    } else {
      router.push(`/chat?prompt=${encodeURIComponent(prompt)}&new=true`)
    }
  }, [isTabletOrMobile, router])

  const navigateToChat = useCallback((quake: EarthquakeEvent) => {
    const formattedTime = new Date(quake.time).toLocaleString()
    const coords = `${quake.latitude.toFixed(4)}, ${quake.longitude.toFixed(4)}`
    const source = quake.source === "phivolcs" ? "PHIVOLCS" : "USGS"
    const prompt = Intents.getEarthquakeAnalysis(quake.place, quake.magnitude.toFixed(1), quake.depth.toFixed(0), formattedTime, coords, source)
    handleOpenChat(prompt)
  }, [handleOpenChat])

  // Custom chat redirect for administrative boundaries selection
  const handleOpenBoundaryChat = useCallback((locationName: string, parentContext: string) => {
    const prompt = Intents.getRegionalProfiling(locationName, parentContext)
    handleOpenChat(prompt)
  }, [handleOpenChat])

  // Custom chat redirect for user-reported community incidents
  const handleOpenIncidentChat = useCallback((prompt: string) => {
    handleOpenChat(prompt)
  }, [handleOpenChat])

  // Drill viewport and update center coordinates
  const handleViewportMove = useCallback((zoom: number, lng: number, lat: number) => {
    updateActiveLevelAndFetch(zoom, lng, lat)
    setMapCenter({ lat, lng })
  }, [updateActiveLevelAndFetch])

  // Determine if the administrative details panel should open
  const isBoundaryPanelOpen = !!(selectedRegion || selectedProvince || selectedMunicity)

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden border border-primary/10 shadow-2xl">
      {/* Unified map viewport with incident markers AND administrative overlays */}
      <ErrorBoundary>
        <MapViewport
          filteredEarthquakes={filteredEarthquakes}
          selectedEarthquake={selectedEarthquake}
          setSelectedId={setSelectedId}
          incidents={incidents}
          showEarthquakes={showEarthquakes}
          showIncidents={showIncidents}
          showBoundaries={showBoundaries}
          activeLevel={activeLevel}
          regionsGeoJson={regionsGeoJson}
          provincesGeoJson={provincesGeoJson}
          municitiesGeoJson={municitiesGeoJson}
          onSelectRegion={selectRegion}
          onSelectProvince={selectProvince}
          onSelectMunicity={selectMunicity}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          hoveredName={hoveredName}
          setHoveredName={setHoveredName}
          onViewportMove={handleViewportMove}
          onSelectIncident={setSelectedIncident}
          isPickingLocation={isPickingLocation}
          onLocationPicked={(coords) => {
            setPickedCoords(coords)
            setIsPickingLocation(false)
            setReportDrawerOpen(true)
          }}
        />
      </ErrorBoundary>

      {/* Floating Controls at Top-Left */}
      {!isPickingLocation && (
        <div className="absolute top-4 left-4 z-30 pointer-events-auto flex items-center gap-2">
          <FilterDrawer
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
          />

          {/* Geological Logs toggle button (visible only on mobile/tablet) */}
          {isTabletOrMobile && (
            <Button
              onClick={() => onToggleSidebar(!sidebarOpen)}
              variant="outline"
              size="icon"
              className="size-10 rounded-full shadow-md bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-muted transition-all duration-200 cursor-pointer flex items-center justify-center animate-in fade-in"
              title="View Geological Logs"
              aria-label="View Geological Logs"
            >
              <Activity className="size-4 text-emerald-500 animate-pulse" />
            </Button>
          )}
        </div>
      )}

      {/* Floating Report Incident FAB and Drawer */}
      <ReportDrawer
        mapCenter={mapCenter}
        onReportSubmitted={refetchReports}
        open={reportDrawerOpen}
        onOpenChange={setReportDrawerOpen}
        pickedCoords={pickedCoords}
        onStartPickingLocation={() => {
          setIsPickingLocation(true)
          setReportDrawerOpen(false)
        }}
        clearPickedCoords={() => setPickedCoords(null)}
        isPickingLocation={isPickingLocation}
      />

      {/* AI Geological Review overlay panel (earthquake details) */}
      <AiReviewPanel
        isOpen={aiPanelOpen}
        loading={aiLoading}
        error={aiError}
        sections={aiSections}
        earthquake={selectedEarthquake}
        onClose={() => {
          closePanel()
          setSelectedId(null)
        }}
        onRetry={fetchInsights}
        onOpenChat={navigateToChat}
      />

      {/* Administrative Boundaries details panel (Weather & Info overlay) */}
      <BoundaryDetailsPanel
        isOpen={isBoundaryPanelOpen}
        loading={boundaryLoading}
        error={boundaryError}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        region={selectedRegion}
        province={selectedProvince}
        municity={selectedMunicity}
        onClose={closeBoundaryPanel}
        onOpenChat={handleOpenBoundaryChat}
      />

      {/* Community Incident Details Dialog/Drawer panel */}
      <IncidentDetailsPanel
        isOpen={selectedIncident !== null}
        onClose={() => setSelectedIncident(null)}
        incident={selectedIncident}
        onOpenChat={handleOpenIncidentChat}
      />
      {/* Guide banner for interactive location selection mode */}
      {isPickingLocation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border border-destructive/20 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto w-[90vw] sm:w-[420px]">
          <div className="flex items-center gap-3">
            <div className="size-2.5 rounded-full bg-destructive animate-ping shrink-0" />
            <span className="text-xs font-medium text-foreground leading-snug">
              Click anywhere on the map to set the incident location
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsPickingLocation(false)
              setReportDrawerOpen(true)
            }}
            className="text-xs shrink-0 rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      )}

      <AiChatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialPrompt={drawerPrompt}
      />
    </div>
  )
}

