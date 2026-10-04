
import { createAdminClient } from "@/lib/supabase/server"
import {
  fetchHtml,
  getHash,
  isRateLimited,
  readLocalCache,
  readLocalStatus,
  writeLocalCache,
  updateScrapeStatus
} from "../helpers"
import { DAILY_WEATHER_URL } from "@/lib/constants"
import { parseDailyWeatherHtml } from "./daily-weather-parser"

export async function scrapeDailyWeather(force = false) {
  const supabase = createAdminClient()
  const cacheKey = "pagasa_daily_weather"

  // Rate-limiting check
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
    // DB Down: Fallback to local status
    const status = readLocalStatus(cacheKey)
    if (status) {
      lastScrapedStr = status.last_scraped_at
      cachedHash = status.html_hash
    }
  }

  if (!force && isRateLimited(lastScrapedStr)) {
    console.log("PAGASA Daily Weather scrape rate-limited. Returning cached data.")
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbData } = await supabase
        .from("pagasa_daily_weather")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbData) {
        writeLocalCache(cacheKey, dbData)
        return dbData
      }
    } catch (err) {
      console.warn("Failed to retrieve cached daily weather from Supabase on rate-limit:", err)
    }
    return getFallbackDailyWeather()
  }

  try {
    const html = await fetchHtml(DAILY_WEATHER_URL)
    const hash = getHash(html)

    if (!force && hash === cachedHash) {
      console.log("PAGASA Daily Weather page content unchanged. Skipping parse.")
      // Update last scraped time only
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, DAILY_WEATHER_URL, hash, nowStr)
      
      const cached = readLocalCache(cacheKey)
      if (cached) return cached

      try {
        const { data: dbData } = await supabase
          .from("pagasa_daily_weather")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (dbData) {
          writeLocalCache(cacheKey, dbData)
          return dbData
        }
      } catch (err) {
        console.warn("Failed to retrieve cached daily weather from Supabase on unchanged content:", err)
      }
      return getFallbackDailyWeather()
    }

    const payload = parseDailyWeatherHtml(html)

    // Save to Database
    try {
      await supabase.from("pagasa_daily_weather").upsert(payload, { onConflict: "issued_at" })
    } catch (err) {
      console.warn("DB write failed for daily weather, relying on local file cache:", err)
    }

    // Save locally
    writeLocalCache(cacheKey, payload)
    const nowStr = new Date().toISOString()
    await updateScrapeStatus(cacheKey, DAILY_WEATHER_URL, hash, nowStr)

    return payload
  } catch (err) {
    console.error("Error scraping PAGASA Daily Weather:", err)
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbData } = await supabase
        .from("pagasa_daily_weather")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbData) {
        return dbData
      }
    } catch (dbErr) {
      console.warn("Failed to retrieve cached daily weather from Supabase on error catch:", dbErr)
    }
    return getFallbackDailyWeather()
  }
}

export function getFallbackDailyWeather() {
  return {
    issued_at: "04:00 AM, 20 June 2026",
    synopsis: "Easterlies affecting Central and Southern Luzon.",
    tc_info: { raw_text: "No active tropical cyclones outside PAR." },
    forecasts: [],
    wind_coastal: [],
    temp_humidity: {},
    astronomy_tides: {}
  }
}
