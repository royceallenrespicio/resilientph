import L from "leaflet"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { getLeafletEarthquakeColor, getLeafletEarthquakeRadius } from "@/lib/map/layer-styles"

export interface IncidentIconConfig {
  svg: string
  color: string
  bgColor: string
  label: string
}

export const INCIDENT_CONFIGS: Record<string, IncidentIconConfig> = {
  power_outage: {
    // Lucide Zap
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
    color: "#ffffff",
    bgColor: "#f59e0b",
    label: "Power Outage"
  },
  flood: {
    // Lucide Waves
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
    color: "#ffffff",
    bgColor: "#3b82f6",
    label: "Flooding"
  },
  landslide: {
    // Mountain / Slope
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`,
    color: "#ffffff",
    bgColor: "#b45309",
    label: "Landslide"
  },
  fire: {
    // Lucide Flame
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    color: "#ffffff",
    bgColor: "#ef4444",
    label: "Fire Incident"
  },
  road_hazard: {
    // Lucide TriangleAlert
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    color: "#ffffff",
    bgColor: "#eab308",
    label: "Road Hazard"
  },
  gas_leak: {
    // Lucide Cloud
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    color: "#ffffff",
    bgColor: "#8b5cf6",
    label: "Hazardous Gas"
  },
  waste: {
    // Lucide Trash2
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    color: "#ffffff",
    bgColor: "#10b981",
    label: "Waste/Debris"
  }
}

export function createIncidentDivIcon(category: string, severity?: string): L.DivIcon {
  const config = INCIDENT_CONFIGS[category] || {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
    color: "#ffffff",
    bgColor: "#64748b",
    label: "Incident"
  }

  const isSevere = severity === "high" || severity === "critical"
  const pulseHtml = isSevere
    ? `<span class="absolute -inset-1 rounded-2xl animate-ping opacity-60 pointer-events-none" style="background-color: ${config.bgColor}"></span>`
    : ""

  const html = `
    <div class="relative flex items-center justify-center size-8 rounded-xl shadow-lg border-2 border-white/90 cursor-pointer select-none transition-transform hover:scale-110 active:scale-95" style="background-color: ${config.bgColor}; color: ${config.color}">
      ${pulseHtml}
      ${config.svg}
    </div>
  `

  return L.divIcon({
    html,
    className: "incident-custom-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  })
}

export function buildEarthquakeCircleMarker(
  quake: EarthquakeEvent,
  zoom: number,
  isSelected: boolean
): L.CircleMarker {
  const color = getLeafletEarthquakeColor(quake.magnitude)
  const radius = getLeafletEarthquakeRadius(quake.magnitude, zoom)

  const marker = L.circleMarker([quake.latitude, quake.longitude], {
    radius: isSelected ? radius + 3 : radius,
    color: isSelected ? "#ffffff" : color,
    weight: isSelected ? 3 : 1.5,
    opacity: 0.95,
    fillColor: color,
    fillOpacity: isSelected ? 0.9 : 0.75
  })

  return marker
}
