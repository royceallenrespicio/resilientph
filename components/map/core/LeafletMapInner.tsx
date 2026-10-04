"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import L from "leaflet"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { CARTO_VOYAGER_URL, CARTO_ATTRIBUTION } from "@/lib/constants"
import { BoundaryLevel, RegionProperties, ProvinceProperties, MunicityProperties } from "@/lib/map/types"
import { IncidentReport } from "@/lib/supabase/reports"
import { syncParLayer, syncBoundaryLayers } from "../layers/MapBoundaryLayers"
import { syncIncidentAndEarthquakeLayers } from "../layers/MapIncidentLayers"
import { MapPin, Navigation } from "lucide-react"

export interface MapViewportProps {
  filteredEarthquakes: EarthquakeEvent[]
  selectedEarthquake: EarthquakeEvent | null
  setSelectedId: (id: string | null) => void
  incidents: IncidentReport[]
  showEarthquakes: boolean
  showIncidents: boolean
  showBoundaries: boolean
  activeLevel: BoundaryLevel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  regionsGeoJson: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provincesGeoJson: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  municitiesGeoJson: any
  onSelectRegion: (region: RegionProperties) => void
  onSelectProvince: (province: ProvinceProperties) => void
  onSelectMunicity: (municity: MunicityProperties) => void
  hoveredId: string | number | null
  setHoveredId: (id: string | number | null) => void
  hoveredName: string | null
  setHoveredName: (name: string | null) => void
  onViewportMove: (zoom: number, centerLng: number, centerLat: number) => void
  onSelectIncident: (incident: IncidentReport | null) => void
  isPickingLocation: boolean
  onLocationPicked: (coords: { latitude: number; longitude: number }) => void
}

const PH_CENTER: [number, number] = [12.8797, 121.7740]
const PH_INITIAL_ZOOM = 5.5

export default function LeafletMapInner({
  filteredEarthquakes,
  selectedEarthquake,
  setSelectedId,
  incidents,
  showEarthquakes,
  showIncidents,
  showBoundaries,
  activeLevel,
  regionsGeoJson,
  provincesGeoJson,
  municitiesGeoJson,
  onSelectRegion,
  onSelectProvince,
  onSelectMunicity,
  hoveredId,
  setHoveredId,
  hoveredName,
  setHoveredName,
  onViewportMove,
  onSelectIncident,
  isPickingLocation,
  onLocationPicked
}: MapViewportProps) {
  const searchParams = useSearchParams()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  // Leaflet Layer Groups
  const parLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const boundaryLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const earthquakesLayerGroupRef = useRef<L.LayerGroup | null>(null)
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null)

  // Floating coordinates on hover
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null)

  // 1. Initialize Map Instance and Base CARTO Voyager Layer
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: PH_CENTER,
      zoom: PH_INITIAL_ZOOM,
      minZoom: 4.5,
      maxZoom: 18,
      maxBounds: [
        [-2.0, 105.0],
        [32.0, 145.0]
      ],
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: true
    })

    // Dedicated CARTO Voyager Raster Tiles with key
    L.tileLayer(CARTO_VOYAGER_URL, {
      attribution: CARTO_ATTRIBUTION,
      maxZoom: 19,
      minZoom: 4
    }).addTo(map)

    // Add zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map)

    // Create Layer Groups
    const parGroup = L.layerGroup().addTo(map)
    const boundaryGroup = L.layerGroup().addTo(map)
    const earthquakesGroup = L.layerGroup().addTo(map)
    const incidentsGroup = L.layerGroup().addTo(map)

    parLayerGroupRef.current = parGroup
    boundaryLayerGroupRef.current = boundaryGroup
    earthquakesLayerGroupRef.current = earthquakesGroup
    incidentsLayerGroupRef.current = incidentsGroup
    mapInstanceRef.current = map

    // Initial PAR layer sync
    syncParLayer(parGroup)

    // Map Event Handlers
    map.on("mousemove", (e) => {
      setHoveredCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
    })

    map.on("mouseout", () => {
      setHoveredCoords(null)
    })

    let moveTimeout: ReturnType<typeof setTimeout>
    map.on("moveend", () => {
      clearTimeout(moveTimeout)
      moveTimeout = setTimeout(() => {
        const center = map.getCenter()
        onViewportMove(map.getZoom(), center.lng, center.lat)
      }, 200)
    })

    // Invalidate size after layout mounts
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current)
    }

    return () => {
      clearTimeout(moveTimeout)
      resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Handle Location Picking Click Event
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPickingLocation) {
        onLocationPicked({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        })
      } else {
        onSelectIncident(null)
      }
    }

    map.on("click", handleMapClick)
    return () => {
      map.off("click", handleMapClick)
    }
  }, [isPickingLocation, onLocationPicked, onSelectIncident])

  // 3. Reactive Administrative Boundary Overlays
  useEffect(() => {
    const map = mapInstanceRef.current
    const boundaryGroup = boundaryLayerGroupRef.current
    const parGroup = parLayerGroupRef.current
    if (!map || !boundaryGroup || !parGroup) return

    syncBoundaryLayers({
      map,
      layerGroup: boundaryGroup,
      parLayerGroup: parGroup,
      activeLevel,
      showBoundaries,
      regionsGeoJson,
      provincesGeoJson,
      municitiesGeoJson,
      hoveredId,
      setHoveredId,
      setHoveredName,
      onSelectRegion,
      onSelectProvince,
      onSelectMunicity
    })
  }, [
    activeLevel,
    showBoundaries,
    regionsGeoJson,
    provincesGeoJson,
    municitiesGeoJson,
    hoveredId,
    setHoveredId,
    setHoveredName,
    onSelectRegion,
    onSelectProvince,
    onSelectMunicity
  ])

  // 4. Reactive Earthquakes & Incident Markers
  useEffect(() => {
    const map = mapInstanceRef.current
    const earthquakesGroup = earthquakesLayerGroupRef.current
    const incidentsGroup = incidentsLayerGroupRef.current
    if (!map || !earthquakesGroup || !incidentsGroup) return

    syncIncidentAndEarthquakeLayers({
      earthquakesLayerGroup: earthquakesGroup,
      incidentsLayerGroup: incidentsGroup,
      showEarthquakes,
      showIncidents,
      filteredEarthquakes,
      incidents,
      selectedEarthquakeId: selectedEarthquake?.id || null,
      zoom: map.getZoom(),
      onSelectEarthquake: setSelectedId,
      onSelectIncident
    })
  }, [
    filteredEarthquakes,
    incidents,
    showEarthquakes,
    showIncidents,
    selectedEarthquake,
    setSelectedId,
    onSelectIncident
  ])

  // 5. Fly to Selected Earthquake
  useEffect(() => {
    const map = mapInstanceRef.current
    if (selectedEarthquake && map) {
      map.flyTo(
        [selectedEarthquake.latitude, selectedEarthquake.longitude],
        Math.max(8, map.getZoom()),
        { duration: 1.2 }
      )
    }
  }, [selectedEarthquake])

  // 6. Fly to Search Parameters (e.g. from regional navigation)
  useEffect(() => {
    const latParam = searchParams.get("lat")
    const lngParam = searchParams.get("lng")
    const zoomParam = searchParams.get("zoom")

    if (latParam && lngParam && mapInstanceRef.current) {
      const lat = parseFloat(latParam)
      const lng = parseFloat(lngParam)
      const zoom = zoomParam ? parseFloat(zoomParam) : 10
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.5 })
    }
  }, [searchParams])

  return (
    <div className="w-full h-full relative overflow-hidden isolate z-0">
      {/* Leaflet DOM container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full isolate z-0 ${isPickingLocation ? "!cursor-crosshair" : "cursor-grab"}`}
      />

      {/* Location Picking Overlay Instruction Bar */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border border-amber-500/40 text-foreground px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 pointer-events-none">
          <MapPin className="size-4 text-amber-500 animate-bounce" />
          <span className="text-xs font-semibold font-sans">
            Click anywhere on the map to set incident location
          </span>
        </div>
      )}

      {/* Floating Hover Indicator Tooltip (Region/Province) */}
      {hoveredName && hoveredCoords && !isPickingLocation && (
        <div className="absolute bottom-6 left-6 z-30 bg-card/90 backdrop-blur-md border border-border/40 px-3 py-1.5 rounded-xl shadow-lg pointer-events-none flex items-center gap-2">
          <Navigation className="size-3 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-foreground font-sans">{hoveredName}</span>
          <span className="text-[10px] font-sans font-medium text-muted-foreground">
            {hoveredCoords.lat.toFixed(2)}°N, {hoveredCoords.lng.toFixed(2)}°E
          </span>
        </div>
      )}
    </div>
  )
}
