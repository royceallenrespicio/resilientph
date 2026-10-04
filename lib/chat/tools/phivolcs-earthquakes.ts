import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { readLocalCache } from "@/lib/scraper/helpers"
import { EarthquakeEvent } from "@/lib/scraper/phivolcs"

export const phivolcsEarthquakesTool = tool(
  async ({ min_magnitude = 4.0, limit = 20, starttime, endtime, location, orderby = "time" }) => {
    try {
      const supabase = await createClient()
      let data: EarthquakeEvent[] | null = null
      let dbSuccess = false

      // Capped safe limit
      const safeLimit = Math.min(limit, 100)

      // Timezone aware date boundaries (Philippine Time PHT / UTC+8)
      const getPhtStartOfDayIso = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00+08:00` : dateStr
      const getPhtEndOfDayIso = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T23:59:59.999+08:00` : dateStr

      const phtStarttime = starttime ? getPhtStartOfDayIso(starttime) : undefined
      const phtEndtime = endtime ? getPhtEndOfDayIso(endtime) : undefined

      // Validate chronological order
      if (phtStarttime && phtEndtime && new Date(phtStarttime) > new Date(phtEndtime)) {
        return `Error: Invalid date range. starttime (${starttime}) cannot be after endtime (${endtime}).`
      }

      try {
        let query = supabase.from("phivolcs_earthquakes").select("*")

        if (min_magnitude !== undefined) {
          query = query.gte("magnitude", min_magnitude)
        }
        if (phtStarttime) {
          query = query.gte("event_time", phtStarttime)
        }
        if (phtEndtime) {
          query = query.lte("event_time", phtEndtime)
        }
        if (location) {
          query = query.ilike("location", `%${location}%`)
        }

        if (orderby === "magnitude") {
          query = query
            .order("magnitude", { ascending: false })
            .order("event_time", { ascending: false })
        } else {
          query = query.order("event_time", { ascending: false })
        }

        const { data: dbData, error } = await query
          .limit(safeLimit)

        if (error) throw error
        if (dbData) {
          data = dbData as unknown as EarthquakeEvent[]
          dbSuccess = true
        }
      } catch (err) {
        console.warn("Supabase query for phivolcs earthquakes failed, using local cache fallback:", err)
      }

      if (!dbSuccess) {
        let cachedData = readLocalCache<EarthquakeEvent[]>("phivolcs_earthquakes")
        if (cachedData) {
          if (min_magnitude !== undefined) cachedData = cachedData.filter(e => e.magnitude >= min_magnitude)
          if (phtStarttime) {
            const st = new Date(phtStarttime).getTime()
            cachedData = cachedData.filter(e => new Date(e.event_time).getTime() >= st)
          }
          if (phtEndtime) {
            const et = new Date(phtEndtime).getTime()
            cachedData = cachedData.filter(e => new Date(e.event_time).getTime() <= et)
          }
          if (location) {
            const locLower = location.toLowerCase()
            cachedData = cachedData.filter(e => e.location.toLowerCase().includes(locLower))
          }

          if (orderby === "magnitude") {
            cachedData.sort((a, b) => {
              if (b.magnitude !== a.magnitude) return b.magnitude - a.magnitude
              return new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
            })
          } else {
            cachedData.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
          }

          data = cachedData.slice(0, safeLimit)
        }
      }

      return JSON.stringify({
        source: "PHIVOLCS (Philippine Institute of Volcanology and Seismology)",
        count: data ? data.length : 0,
        earthquakes: data || []
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving phivolcs earthquakes database: ${msg}`
    }
  },
  {
    name: "get_phivolcs_earthquakes",
    description: "Get local earthquake and seismic activity logs in the Philippines from PHIVOLCS. Note: Only records local earthquakes of magnitude 4.0 and above. For smaller events, use get_earthquakes (USGS). Supports filtering by minimum magnitude, start/end dates, location keywords, and limit. Use this when queries ask about recent local earthquakes, epicenters, or tremor occurrences in specific Philippine provinces.",
    schema: z.object({
      min_magnitude: z.number().optional().describe("Minimum magnitude, e.g., 4.0 or 5.0. Defaults to 4.0."),
      limit: z.number().optional().describe("Maximum number of events to return. Defaults to 20. Max capped at 100."),
      starttime: z.string().optional().describe("Start date/time (ISO8601 YYYY-MM-DD), e.g., 2026-06-20. Use for historical analysis."),
      endtime: z.string().optional().describe("End date/time (ISO8601 YYYY-MM-DD), e.g., 2026-06-25. Use for historical analysis."),
      location: z.string().optional().describe("Location name or province keyword to filter, e.g., 'Batanes' or 'Surigao'."),
      orderby: z.enum(["time", "magnitude"]).optional().describe("Sort order: 'time' (newest first) or 'magnitude' (strongest first). Defaults to 'time'.")
    })
  }
)
