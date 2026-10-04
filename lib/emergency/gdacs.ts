export interface GDACSEvent {
  id: string
  name: string
  eventType: string // EQ (Earthquake), TC (Cyclone), FL (Flood), VO (Volcano), DR (Drought), TS (Tsunami)
  alertLevel: "Green" | "Orange" | "Red" | "Unknown"
  country: string
  fromDate: string
  toDate: string
  latitude: number
  longitude: number
  description: string
  alertScore: number
}

import { GDACS_REPORT_URL_PREFIX } from "@/lib/constants"

/**
 * Generates the external URL for a detailed GDACS hazard report.
 */
export function getGDACSEventReportUrl(eventType: string, eventId: string): string {
  return `${GDACS_REPORT_URL_PREFIX}?eventtype=${eventType}&eventid=${eventId}`
}


/**
 * Parses a GDACS API GeoJSON response into a clean list of GDACSEvents.
 */
export function parseGDACSResponse(data: unknown): GDACSEvent[] {
  const events: GDACSEvent[] = []
  
  const features = (data && typeof data === "object" && "features" in data) 
    ? ((data as { features: unknown }).features as unknown[])
    : (Array.isArray(data) ? data : [])

  if (!Array.isArray(features)) return []

  for (const feature of features) {
    try {
      if (!feature || typeof feature !== "object") continue

      const hasProperties = "properties" in feature && feature.properties && typeof feature.properties === "object"
      const props = hasProperties
        ? (feature.properties as Record<string, unknown>)
        : (feature as Record<string, unknown>)
        
      const hasGeometry = "geometry" in feature && feature.geometry && typeof feature.geometry === "object"
      const geom = hasGeometry
        ? (feature.geometry as Record<string, unknown>)
        : {}
        
      const coords = ("coordinates" in geom && Array.isArray(geom.coordinates))
        ? geom.coordinates
        : [0, 0]

      // Extract coordinates: GeoJSON is [lng, lat]
      const longitude = Number(coords[0] ?? 0)
      const latitude = Number(coords[1] ?? 0)

      // Filter: Only include events within the Philippines bounding box or referencing the Philippines
      const isWithinPHCoords = 
        latitude >= 4.5 && latitude <= 21.5 && 
        longitude >= 116.0 && longitude <= 127.0
      
      const countryStr = String(props.country || "").toLowerCase()
      const nameStr = String(props.eventname || props.name || "").toLowerCase()
      const descStr = String(props.description || "").toLowerCase()

      const mentionsPH = 
        countryStr.includes("philippines") || 
        countryStr.includes("phil") ||
        nameStr.includes("philippines") || 
        nameStr.includes("typhoon") || // Typhoons in our region
        descStr.includes("philippines")

      if (!isWithinPHCoords && !mentionsPH) {
        continue
      }

      // Normalize alert level
      let alertLevel: GDACSEvent["alertLevel"] = "Unknown"
      const rawAlert = String(props.alertlevel || props.episodealertlevel || "").toLowerCase()
      if (rawAlert.includes("red")) alertLevel = "Red"
      else if (rawAlert.includes("orange")) alertLevel = "Orange"
      else if (rawAlert.includes("green")) alertLevel = "Green"

      // Format event type description
      const typeCode = String(props.eventtype || "").toUpperCase()

      events.push({
        id: String(props.eventid || props.id || Math.random().toString()),
        name: String(props.eventname || props.name || "Natural Disaster"),
        eventType: typeCode,
        alertLevel,
        country: String(props.country || "Philippines"),
        fromDate: String(props.fromdate || props.date || ""),
        toDate: String(props.todate || props.date || ""),
        latitude,
        longitude,
        description: String(props.description || props.eventname || ""),
        alertScore: Number(props.alertscore || props.episodealertscore || 0),
      })
    } catch (err) {
      console.warn("Failed to parse individual GDACS event:", err)
    }
  }

  // Sort events so that higher alert scores & levels come first
  return events.sort((a, b) => {
    const alertWeight = { Red: 3, Orange: 2, Green: 1, Unknown: 0 }
    if (alertWeight[b.alertLevel] !== alertWeight[a.alertLevel]) {
      return alertWeight[b.alertLevel] - alertWeight[a.alertLevel]
    }
    return b.alertScore - a.alertScore
  })
}

/**
 * Determines if a GDACS event is currently an active warning.
 * Active warnings must be Red or Orange, and must have started or ended within the last 7 days.
 */
export function isActiveGDACSEvent(event: GDACSEvent): boolean {
  if (event.alertLevel !== "Red" && event.alertLevel !== "Orange") {
    return false
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const fromDate = event.fromDate ? new Date(event.fromDate) : new Date(0)
  const toDate = event.toDate ? new Date(event.toDate) : new Date(0)
  
  return toDate >= sevenDaysAgo || fromDate >= sevenDaysAgo || toDate >= now
}
