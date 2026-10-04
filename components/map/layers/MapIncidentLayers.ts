import L from "leaflet"
import { IncidentReport } from "@/lib/supabase/reports"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { buildEarthquakeCircleMarker, createIncidentDivIcon } from "@/lib/map/leaflet-icons"
import { formatDistanceToNow } from "date-fns"

export interface SyncIncidentLayersOptions {
  earthquakesLayerGroup: L.LayerGroup
  incidentsLayerGroup: L.LayerGroup
  showEarthquakes: boolean
  showIncidents: boolean
  filteredEarthquakes: EarthquakeEvent[]
  incidents: IncidentReport[]
  selectedEarthquakeId: string | null
  zoom: number
  onSelectEarthquake: (id: string | null) => void
  onSelectIncident: (incident: IncidentReport | null) => void
}

export function syncIncidentAndEarthquakeLayers({
  earthquakesLayerGroup,
  incidentsLayerGroup,
  showEarthquakes,
  showIncidents,
  filteredEarthquakes,
  incidents,
  selectedEarthquakeId,
  zoom,
  onSelectEarthquake,
  onSelectIncident
}: SyncIncidentLayersOptions) {
  // 1. EARTHQUAKES LAYER
  earthquakesLayerGroup.clearLayers()
  if (showEarthquakes) {
    filteredEarthquakes.forEach((quake) => {
      const isSelected = quake.id === selectedEarthquakeId
      const marker = buildEarthquakeCircleMarker(quake, zoom, isSelected)

      const timeAgo = (() => {
        try {
          return formatDistanceToNow(new Date(quake.time), { addSuffix: true })
        } catch {
          return "Recently"
        }
      })()

      const severityBadge = quake.magnitude >= 5.0
        ? { bg: "#ef4444", text: "#ffffff", label: "Strong" }
        : quake.magnitude >= 4.0
        ? { bg: "#f59e0b", text: "#000000", label: "Moderate" }
        : { bg: "#14b8a6", text: "#ffffff", label: "Minor" }

      const popupHtml = `
        <div class="p-1 space-y-1.5 font-sans min-w-[200px]">
          <div class="flex items-center justify-between gap-2 border-b border-border/20 pb-1.5">
            <span class="px-2 py-0.5 text-xs font-bold font-sans rounded-full" style="background-color: ${severityBadge.bg}; color: ${severityBadge.text}">
              M ${quake.magnitude.toFixed(1)}
            </span>
            <span class="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-wider">${quake.source || "USGS"}</span>
          </div>
          <p class="text-xs font-semibold text-foreground leading-snug line-clamp-2 font-sans">${quake.place}</p>
          <div class="text-[11px] text-muted-foreground flex items-center justify-between font-sans pt-1">
            <span>Depth: ${quake.depth} km</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: "earthquake-leaflet-popup"
      })

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e)
        onSelectEarthquake(quake.id)
      })

      earthquakesLayerGroup.addLayer(marker)
    })
  }

  // 2. COMMUNITY INCIDENTS LAYER
  incidentsLayerGroup.clearLayers()
  if (showIncidents) {
    const activeIncidents = incidents.filter((i) => i.status !== "resolved")
    activeIncidents.forEach((incident) => {
      const lat = Number(incident.latitude)
      const lng = Number(incident.longitude)
      if (isNaN(lat) || isNaN(lng)) return

      const icon = createIncidentDivIcon(incident.category, incident.severity)
      const marker = L.marker([lat, lng], { icon })

      const timeAgo = (() => {
        try {
          return formatDistanceToNow(new Date(incident.reported_at), { addSuffix: true })
        } catch {
          return "Recently"
        }
      })()

      const categoryLabel = incident.category
        ? incident.category.replace(/_/g, " ").toUpperCase()
        : "INCIDENT"

      const popupHtml = `
        <div class="p-1.5 space-y-2 font-sans min-w-[220px]">
          <div class="flex items-center justify-between gap-2 border-b border-border/20 pb-1.5">
            <span class="text-xs font-bold text-foreground tracking-wide font-sans uppercase">${categoryLabel}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-sans uppercase ${
              incident.severity === "critical"
                ? "bg-red-500/20 text-red-400 font-bold"
                : incident.severity === "high"
                ? "bg-amber-500/20 text-amber-400 font-semibold"
                : "bg-muted text-muted-foreground font-medium"
            }">${incident.severity || "normal"}</span>
          </div>
          ${incident.description ? `<p class="text-xs text-foreground/90 line-clamp-3 font-sans">${incident.description}</p>` : ""}
          <div class="text-[10px] text-muted-foreground flex items-center justify-between font-sans pt-1">
            <span>Reported ${timeAgo}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: "incident-leaflet-popup"
      })

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e)
        onSelectIncident(incident)
      })

      incidentsLayerGroup.addLayer(marker)
    })
  }
}
