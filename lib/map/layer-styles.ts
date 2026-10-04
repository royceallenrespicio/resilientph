import { BoundaryLevel } from "@/lib/map/types"

export const getRegionsFillPaint = (activeLevel: BoundaryLevel) => ({
  "fill-color": "#0ea5e9",
  "fill-opacity": activeLevel === "regions" ? 0.06 : 0.02
})

export const getRegionsLinePaint = (activeLevel: BoundaryLevel) => ({
  "line-color": "#0ea5e9",
  "line-width": 1.5,
  "line-opacity": activeLevel === "regions" ? 0.4 : 0.15
})

export const regionsHoverPaint = {
  "fill-color": "#0ea5e9",
  "fill-opacity": 0.22
}

export const getProvincesFillPaint = (activeLevel: BoundaryLevel) => ({
  "fill-color": "#10b981",
  "fill-opacity": activeLevel === "provinces" ? 0.08 : 0.03
})

export const getProvincesLinePaint = (activeLevel: BoundaryLevel) => ({
  "line-color": "#10b981",
  "line-width": 1.25,
  "line-opacity": activeLevel === "provinces" ? 0.45 : 0.2
})

export const provincesHoverPaint = {
  "fill-color": "#10b981",
  "fill-opacity": 0.25
}

export const municitiesFillPaint = {
  "fill-color": "#f59e0b",
  "fill-opacity": 0.1
}

export const municitiesLinePaint = {
  "line-color": "#f59e0b",
  "line-width": 1.0,
  "line-opacity": 0.45
}

export const municitiesHoverPaint = {
  "fill-color": "#f59e0b",
  "fill-opacity": 0.3
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getEarthquakesPaint = (selectedId: string | null): any => ({
  "circle-radius": [
    "interpolate", ["linear"], ["zoom"],
    4, ["interpolate", ["linear"], ["get", "magnitude"], 3, 3.5, 5, 7, 7, 11],
    8, ["interpolate", ["linear"], ["get", "magnitude"], 3, 5.5, 5, 11, 7, 19],
    12, ["interpolate", ["linear"], ["get", "magnitude"], 3, 8.5, 5, 17, 7, 29]
  ],
  "circle-color": [
    "case",
    [">=", ["get", "magnitude"], 5.0], "#ef4444",
    [">=", ["get", "magnitude"], 4.0], "#f59e0b",
    "#14b8a6"
  ],
  "circle-opacity": 0.85,
  "circle-stroke-color": "#ffffff",
  "circle-stroke-width": [
    "case",
    ["==", ["get", "id"], selectedId || ""], 2.5,
    1
  ],
  "circle-stroke-opacity": [
    "case",
    ["==", ["get", "id"], selectedId || ""], 1.0,
    0.7
  ]
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectedEarthquakeHaloPaint: any = {
  "circle-radius": [
    "interpolate", ["linear"], ["zoom"],
    4, ["interpolate", ["linear"], ["get", "magnitude"], 3, 8.5, 5, 15, 7, 21],
    8, ["interpolate", ["linear"], ["get", "magnitude"], 3, 12.5, 5, 21, 7, 31],
    12, ["interpolate", ["linear"], ["get", "magnitude"], 3, 18.5, 5, 33, 7, 49]
  ],
  "circle-color": [
    "case",
    [">=", ["get", "magnitude"], 5.0], "#ef4444",
    [">=", ["get", "magnitude"], 4.0], "#f59e0b",
    "#14b8a6"
  ],
  "circle-opacity": 0.25,
  "circle-stroke-color": [
    "case",
    [">=", ["get", "magnitude"], 5.0], "#ef4444",
    [">=", ["get", "magnitude"], 4.0], "#f59e0b",
    "#14b8a6"
  ],
  "circle-stroke-width": 1.5,
  "circle-stroke-opacity": 0.5
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const incidentsLayout: any = {
  "icon-image": ["concat", "incident-", ["get", "category"]],
  "icon-size": [
    "interpolate", ["linear"], ["zoom"],
    4, 0.8,
    10, 1.4,
    14, 2.0
  ],
  "icon-allow-overlap": true,
  "icon-ignore-placement": true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const incidentsPaint: any = {
  "icon-opacity": 1.0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const incidentsClusterPaint: any = {
  "circle-color": [
    "step",
    ["get", "point_count"],
    "#10b981", // Green for < 10
    10,
    "#f59e0b", // Orange for 10-50
    50,
    "#ef4444"  // Red for 50+
  ],
  "circle-radius": [
    "step",
    ["get", "point_count"],
    20, // 20px radius for < 10 reports
    10,
    28, // 28px for 10-50
    50,
    36  // 36px for 50+
  ],
  "circle-opacity": 0.85,
  "circle-stroke-color": [
    "step",
    ["get", "point_count"],
    "#10b981",
    10,
    "#f59e0b",
    50,
    "#ef4444"
  ],
  "circle-stroke-width": 5,
  "circle-stroke-opacity": 0.35
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const incidentsClusterCountLayout: any = {
  "text-field": "{point_count_abbreviated}",
  "text-size": 14,
  "text-allow-overlap": false,
  "text-ignore-placement": false,
  "text-optional": true,
  "symbol-spacing": 250
}

// ----------------------------------------------------------------------------
// PAR Boundary Styles
// ----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parLineLayout: any = {
  "line-join": "round",
  "line-cap": "round"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parLinePaint: any = {
  "line-color": "#0ea5e9",
  "line-width": 2.0,
  "line-dasharray": [4, 4],
  "line-opacity": 0.8
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const incidentsClusterCountPaint: any = {
  "text-color": "#ffffff"
}

/**
 * Common magnitude-based color/badge card styling using semantic theme tokens.
 */
export function getEarthquakeSeverityStyles(magnitude: number) {
  if (magnitude >= 5.0) {
    return {
      badgeBg: "bg-destructive/20 text-destructive border-destructive/30",
      alertBorder: "border border-border/10",
      label: "Dangerous"
    }
  }
  if (magnitude >= 4.0) {
    return {
      badgeBg: "bg-amber-500/20 text-amber-500 border-amber-500/30",
      alertBorder: "border border-border/10",
      label: "Moderate"
    }
  }
  return {
    badgeBg: "bg-muted text-muted-foreground border-border",
    alertBorder: "border border-border/10",
    label: "Minor"
  }
}

/**
 * Common magnitude-based map marker styles.
 */
export function getEarthquakeMarkerStyles(magnitude: number) {
  if (magnitude >= 5.0) {
    return {
      dotBg: "bg-red-500",
      pingBg: "bg-red-500",
      border: "border-red-600/50",
      text: "text-red-500"
    }
  }
  if (magnitude >= 4.0) {
    return {
      dotBg: "bg-amber-500",
      pingBg: "bg-amber-500",
      border: "border-amber-600/50",
      text: "text-amber-500"
    }
  }
  return {
    dotBg: "bg-teal-500",
    pingBg: "bg-teal-500",
    border: "border-teal-600/50",
    text: "text-teal-400"
  }
}

// ----------------------------------------------------------------------------
// Leaflet Path & Marker Vector Style Options
// ----------------------------------------------------------------------------

export const leafletParStyle = {
  color: "#0ea5e9",
  weight: 2,
  dashArray: "6, 6",
  opacity: 0.85,
  fill: false
}

export function getLeafletRegionStyle(activeLevel: BoundaryLevel, isHovered = false) {
  return {
    color: "#0ea5e9",
    weight: isHovered ? 2.5 : (activeLevel === "regions" ? 1.5 : 0.8),
    opacity: isHovered ? 0.95 : (activeLevel === "regions" ? 0.6 : 0.25),
    fillColor: "#0ea5e9",
    fillOpacity: isHovered ? 0.26 : (activeLevel === "regions" ? 0.08 : 0.02)
  }
}

export function getLeafletProvinceStyle(activeLevel: BoundaryLevel, isHovered = false) {
  return {
    color: "#10b981",
    weight: isHovered ? 2.5 : (activeLevel === "provinces" ? 1.5 : 0.8),
    opacity: isHovered ? 0.95 : (activeLevel === "provinces" ? 0.6 : 0.25),
    fillColor: "#10b981",
    fillOpacity: isHovered ? 0.28 : (activeLevel === "provinces" ? 0.09 : 0.03)
  }
}

export function getLeafletMunicityStyle(isHovered = false) {
  return {
    color: "#f59e0b",
    weight: isHovered ? 2.0 : 1.0,
    opacity: isHovered ? 0.95 : 0.5,
    fillColor: "#f59e0b",
    fillOpacity: isHovered ? 0.35 : 0.12
  }
}

export function getLeafletEarthquakeRadius(magnitude: number, zoom: number): number {
  const base = Math.max(4, magnitude * 2.8)
  const zoomFactor = Math.max(0.7, zoom / 5)
  return Math.min(32, Math.round(base * zoomFactor))
}

export function getLeafletEarthquakeColor(magnitude: number): string {
  if (magnitude >= 5.0) return "#ef4444"
  if (magnitude >= 4.0) return "#f59e0b"
  return "#14b8a6"
}

