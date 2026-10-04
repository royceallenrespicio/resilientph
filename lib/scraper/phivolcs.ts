import * as cheerio from "cheerio"
import { createAdminClient } from "@/lib/supabase/server"
import {
  fetchHtml,
  getHash,
  isRateLimited,
  readLocalCache,
  readLocalStatus,
  writeLocalCache,
  updateScrapeStatus
} from "./helpers"
import { PHIVOLCS_EARTHQUAKES_URL } from "@/lib/constants"

export interface EarthquakeEvent {
  datetime: string
  event_time: string
  latitude: number
  longitude: number
  depth_km: number
  magnitude: number
  location: string
  info_url?: string
  hash: string
}

/**
 * Scrapes the PHIVOLCS recent earthquakes bulletin.
 * Deduplicates events using a unique event hash and supports offline local file caching.
 */
export async function scrapeEarthquakes(force = false): Promise<EarthquakeEvent[]> {
  const supabase = createAdminClient()
  const cacheKey = "phivolcs_earthquakes"

  // Rate limit check
  let lastScrapedStr: string | null = null
  let cachedHash: string | null = null

  try {
    const { data } = await supabase
      .from("scrape_status")
      .select("last_scraped_at, html_hash")
      .eq("id", cacheKey)
      .maybeSingle()
    if (data) {
      lastScrapedStr = data.last_scraped_at
      cachedHash = data.html_hash
    }
  } catch {
    const status = readLocalStatus(cacheKey)
    if (status) {
      lastScrapedStr = status.last_scraped_at
      cachedHash = status.html_hash
    }
  }

  if (!force && isRateLimited(lastScrapedStr)) {
    console.log("PHIVOLCS Earthquakes scrape rate-limited. Returning cached data.")
    const cached = readLocalCache<EarthquakeEvent[]>(cacheKey)
    if (cached) return cached

    try {
      const { data: dbEvents } = await supabase
        .from("phivolcs_earthquakes")
        .select("*")
        .order("event_time", { ascending: false })
        .limit(100)
      if (dbEvents && dbEvents.length > 0) {
        const mappedEvents = dbEvents.map(e => ({
          datetime: e.datetime,
          event_time: e.event_time,
          latitude: e.latitude,
          longitude: e.longitude,
          depth_km: e.depth_km,
          magnitude: e.magnitude,
          location: e.location,
          info_url: e.info_url || undefined,
          hash: e.hash
        }))
        writeLocalCache(cacheKey, mappedEvents)
        return mappedEvents
      }
    } catch (err) {
      console.warn("Failed to retrieve cached earthquakes from Supabase on rate-limit:", err)
    }
    return getFallbackEarthquakes()
  }

  try {
    const html = await fetchHtml(PHIVOLCS_EARTHQUAKES_URL)
    const pageHash = getHash(html)

    if (!force && pageHash === cachedHash) {
      console.log("PHIVOLCS Earthquakes page content unchanged. Skipping parse.")
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, PHIVOLCS_EARTHQUAKES_URL, pageHash, nowStr)

      const cached = readLocalCache<EarthquakeEvent[]>(cacheKey)
      if (cached) return cached

      try {
        const { data: dbEvents } = await supabase
          .from("phivolcs_earthquakes")
          .select("*")
          .order("event_time", { ascending: false })
          .limit(100)
        if (dbEvents && dbEvents.length > 0) {
          const mappedEvents = dbEvents.map(e => ({
            datetime: e.datetime,
            event_time: e.event_time,
            latitude: e.latitude,
            longitude: e.longitude,
            depth_km: e.depth_km,
            magnitude: e.magnitude,
            location: e.location,
            info_url: e.info_url || undefined,
            hash: e.hash
          }))
          writeLocalCache(cacheKey, mappedEvents)
          return mappedEvents
        }
      } catch (err) {
        console.warn("Failed to retrieve cached earthquakes from Supabase on unchanged content:", err)
      }
      return getFallbackEarthquakes()
    }

    const $ = cheerio.load(html)
    const events: EarthquakeEvent[] = []

    // PHIVOLCS table rows
    $("table tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 6) {
        const firstTd = $(tds[0])
        const dateText = firstTd.find("a").text().trim() || firstTd.text().trim()

        // Skip header rows or invalid dates
        if (!dateText || dateText.toLowerCase().includes("date") || dateText.toLowerCase().includes("june") && dateText.length < 15) {
          return
        }

        const info_url = firstTd.find("a").attr("href") || ""
        const latitude = parseFloat($(tds[1]).text().trim())
        const longitude = parseFloat($(tds[2]).text().trim())
        const depth_km = parseInt($(tds[3]).text().trim(), 10)
        const magnitude = parseFloat($(tds[4]).text().trim())
        const location = $(tds[5]).text().trim().replace(/\s+/g, " ")

        if (isNaN(latitude) || isNaN(longitude) || isNaN(magnitude)) {
          return // Skip headers or rows with bad parsing
        }

        if (magnitude < 4.0) {
          return // Skip minor earthquakes under M4.0 to keep DB clean and reduce noise
        }

        // Parse dateText to Date in UTC+8 timezone to get correct UTC timestamp
        const cleanDateText = dateText.replace(/\s+-\s+/, " ") + " +08:00";
        const parsedDate = new Date(cleanDateText);
        const eventTime = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

        // Create a unique hash for the earthquake event to avoid duplications
        const eventHash = getHash(`${dateText}_${latitude}_${longitude}_${location}`)

        events.push({
          datetime: dateText,
          event_time: eventTime,
          latitude,
          longitude,
          depth_km: isNaN(depth_km) ? 0 : depth_km,
          magnitude,
          location,
          info_url: info_url ? new URL(info_url, PHIVOLCS_EARTHQUAKES_URL).toString() : undefined,
          hash: eventHash
        })
      }
    })

    if (events.length === 0) {
      console.warn("No earthquake events parsed from PHIVOLCS table.")
      const cached = readLocalCache<EarthquakeEvent[]>(cacheKey)
      if (cached) return cached

      try {
        const { data: dbEvents } = await supabase
          .from("phivolcs_earthquakes")
          .select("*")
          .order("event_time", { ascending: false })
          .limit(100)
        if (dbEvents && dbEvents.length > 0) {
          return dbEvents.map(e => ({
            datetime: e.datetime,
            event_time: e.event_time,
            latitude: e.latitude,
            longitude: e.longitude,
            depth_km: e.depth_km,
            magnitude: e.magnitude,
            location: e.location,
            info_url: e.info_url || undefined,
            hash: e.hash
          }))
        }
      } catch (err) {
        console.warn("Failed to retrieve cached earthquakes from Supabase on empty parse:", err)
      }
      return getFallbackEarthquakes()
    }

    // Try to save to Supabase in a single batch upsert to prevent 3000+ slow sequential database queries
    try {
      // Deduplicate payload by hash to prevent ON CONFLICT DO UPDATE error if duplicate hashes exist
      const uniquePayloads = new Map<
        string,
        {
          datetime: string
          event_time: string
          latitude: number
          longitude: number
          depth_km: number
          magnitude: number
          location: string
          info_url: string | null
          hash: string
        }
      >()

      for (const event of events) {
        uniquePayloads.set(event.hash, {
          datetime: event.datetime,
          event_time: event.event_time,
          latitude: event.latitude,
          longitude: event.longitude,
          depth_km: event.depth_km,
          magnitude: event.magnitude,
          location: event.location,
          info_url: event.info_url || null,
          hash: event.hash
        })
      }
      const payload = Array.from(uniquePayloads.values())

      console.log(`Upserting ${payload.length} earthquake events to database (existing hashes automatically ignored)...`)
      const { error } = await supabase
        .from("phivolcs_earthquakes")
        .upsert(payload, { onConflict: "hash" })

      if (error) {
        console.warn("Supabase batch upsert failed, relying on local file cache:", error.message)
      } else {
        console.log("PHIVOLCS Earthquakes batch upsert completed successfully.")
      }
    } catch (err) {
      console.warn("Failed to batch upsert to Supabase:", err)
    }

    // Write to local cache files
    writeLocalCache(cacheKey, events)
    const nowStr = new Date().toISOString()
    await updateScrapeStatus(cacheKey, PHIVOLCS_EARTHQUAKES_URL, pageHash, nowStr)

    return events
  } catch (err) {
    console.error("Error scraping PHIVOLCS Earthquakes:", err)
    const cached = readLocalCache<EarthquakeEvent[]>(cacheKey)
    if (cached) return cached

    try {
      const { data: dbEvents } = await supabase
        .from("phivolcs_earthquakes")
        .select("*")
        .order("event_time", { ascending: false })
        .limit(100)
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents.map(e => ({
          datetime: e.datetime,
          event_time: e.event_time,
          latitude: e.latitude,
          longitude: e.longitude,
          depth_km: e.depth_km,
          magnitude: e.magnitude,
          location: e.location,
          info_url: e.info_url || undefined,
          hash: e.hash
        }))
      }
    } catch (dbErr) {
      console.warn("Failed to retrieve cached earthquakes from Supabase in error catch:", dbErr)
    }
    return getFallbackEarthquakes()
  }
}



function getFallbackEarthquakes(): EarthquakeEvent[] {
  return []
}
