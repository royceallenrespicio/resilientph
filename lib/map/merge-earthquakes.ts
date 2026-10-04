import { EarthquakeEvent } from "@/lib/map/usgs"

/**
 * Merges and deduplicates earthquake events from multiple sources.
 * Gives priority to PHIVOLCS records over USGS for local accuracy.
 *
 * Deduplication criteria:
 * - Coordinates are within ±0.1° latitude/longitude
 * - Timestamps are within ±3 minutes (180,000 ms)
 */
export function mergeEarthquakes(usgs: EarthquakeEvent[], phivolcs: EarthquakeEvent[]): EarthquakeEvent[] {
  const merged: EarthquakeEvent[] = [...phivolcs]

  for (const usgsEvent of usgs) {
    // Check if there is an overlapping PHIVOLCS event
    const isDuplicate = phivolcs.some((pEvent) => {
      const timeDiff = Math.abs(usgsEvent.time - pEvent.time)
      const latDiff = Math.abs(usgsEvent.latitude - pEvent.latitude)
      const lngDiff = Math.abs(usgsEvent.longitude - pEvent.longitude)

      // ±3 minutes = 180,000 ms
      const isTimeOverlap = timeDiff <= 180_000
      // ±0.1 degrees
      const isSpatialOverlap = latDiff <= 0.1 && lngDiff <= 0.1

      return isTimeOverlap && isSpatialOverlap
    })

    if (!isDuplicate) {
      merged.push(usgsEvent)
    }
  }

  // Sort chronologically (newest first)
  return merged.sort((a, b) => b.time - a.time)
}
