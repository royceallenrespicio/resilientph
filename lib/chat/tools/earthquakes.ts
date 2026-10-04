import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { USGS_CONFIG, PH_BBOX } from "@/lib/map/usgs"

// ─── Types ────────────────────────────────────────────────────────────────────
interface EarthquakeFeature {
  properties: {
    mag: number
    place: string
    time: number
    url: string
  }
  geometry?: {
    coordinates: number[]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Buffers a date string by shifting it by `offsetDays`.
 * This compensates for timezone differences when querying the USGS API
 * with date-only (YYYY-MM-DD) inputs.
 */
function bufferDate(dateStr: string, offsetDays: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const date = new Date(dateStr)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

// ─── Recent Earthquake Tool (USGS Earthquake API) ────────────────────────────
export const earthquakeTool = tool(
  async ({ min_magnitude = 3.0, limit = 20, starttime, endtime, orderby = "time" }) => {
    try {
      let url = `${USGS_CONFIG.EARTHQUAKE_API_BASE_URL}?format=geojson&minmagnitude=${min_magnitude}&limit=${limit}&minlatitude=${PH_BBOX.minLatitude}&maxlatitude=${PH_BBOX.maxLatitude}&minlongitude=${PH_BBOX.minLongitude}&maxlongitude=${PH_BBOX.maxLongitude}&orderby=${orderby}`

      // Buffer dates to account for PH timezone offset
      const apiStarttime = starttime ? bufferDate(starttime, -1) : undefined
      const apiEndtime = endtime ? bufferDate(endtime, 1) : undefined

      if (apiStarttime) {
        url += `&starttime=${encodeURIComponent(apiStarttime)}`
      }
      if (apiEndtime) {
        url += `&endtime=${encodeURIComponent(apiEndtime)}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        return `Failed to fetch seismic events from USGS API.`
      }

      const data = await res.json()
      if (!data.features || data.features.length === 0) {
        return `No earthquakes detected in the Philippine region with magnitude >= ${min_magnitude} for the requested parameters.`
      }

      const events = data.features.map((f: EarthquakeFeature) => {
        const props = f.properties
        const coords = f.geometry?.coordinates ?? []
        const time = new Date(props.time).toLocaleString("en-PH", { timeZone: "Asia/Manila" })

        return {
          magnitude: props.mag,
          place: props.place,
          time_philippines: time,
          url: props.url,
          coordinates: {
            longitude: coords[0],
            latitude: coords[1],
            depth_km: coords[2]
          }
        }
      })

      return JSON.stringify({
        region: "Philippine Area of Responsibility (USGS Bounding Box)",
        min_magnitude_queried: min_magnitude,
        count: events.length,
        earthquakes: events
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving seismic data: ${msg}`
    }
  },
  {
    name: "get_earthquakes",
    description: "Get earthquake/seismic events in or around the Philippine region. Supports querying historical data by specifying starttime and endtime, and ordering results by time or magnitude.",
    schema: z.object({
      min_magnitude: z.number().optional().describe("Minimum earthquake magnitude, e.g., 3.0 or 4.5. Defaults to 3.0."),
      limit: z.number().optional().describe("Number of events to retrieve. Defaults to 20."),
      starttime: z.string().optional().describe("Start date/time in YYYY-MM-DD format (ISO8601), e.g., 1990-01-01. Use this to query historical earthquakes."),
      endtime: z.string().optional().describe("End date/time in YYYY-MM-DD format (ISO8601), e.g., 1990-12-31. Use this to query historical earthquakes."),
      orderby: z.enum(["time", "time-asc", "magnitude", "magnitude-asc"]).optional().describe("Order of results: 'time' (newest first), 'time-asc' (oldest first), 'magnitude' (largest first), 'magnitude-asc' (smallest first). Defaults to 'time'.")
    })
  }
)
