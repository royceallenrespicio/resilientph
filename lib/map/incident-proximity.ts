import { IncidentReport } from "@/lib/supabase/reports"

/**
 * Calculate the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @returns Distance in kilometers
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export const INCIDENT_ALERT_RADIUS_KM = 10

/**
 * Checks if an incident is within the alert radius.
 */
export function isIncidentWithinRadius(
  incident: IncidentReport,
  userLat: number,
  userLon: number
): boolean {
  const distance = getHaversineDistance(userLat, userLon, incident.latitude, incident.longitude)
  return distance <= INCIDENT_ALERT_RADIUS_KM
}

/**
 * Formats an incident for display in notifications.
 */
export function formatIncidentNotification(incident: IncidentReport): { title: string; body: string } {
  const categoryStr = incident.category.replace('_', ' ').toUpperCase()
  const subTypeStr = incident.sub_type.replace(/_/g, ' ')
  
  return {
    title: `Community Alert: ${categoryStr}`,
    body: `New ${subTypeStr} reported near your area. ${incident.description ? `"${incident.description}"` : ""}`,
  }
}
