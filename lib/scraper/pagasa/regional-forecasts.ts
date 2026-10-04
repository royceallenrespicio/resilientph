
import { createAdminClient } from "@/lib/supabase/server"
import {
  getHash,
  isRateLimited,
  readLocalCache,
  readLocalStatus,
  writeLocalCache,
  updateScrapeStatus
} from "../helpers"
import { REGIONS, REGIONAL_FORECAST_URL_PREFIX, REGIONAL_API_BASE_URL } from "@/lib/constants"
import { parseRegionalHtml } from "./regional-parser"

export async function scrapeRegionalForecasts(force = false) {
  const supabase = createAdminClient()
  const cacheKey = "pagasa_regional_forecasts"
  
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
    const status = readLocalStatus(cacheKey)
    if (status) {
      lastScrapedStr = status.last_scraped_at
      cachedHash = status.html_hash
    }
  }

  if (!force && isRateLimited(lastScrapedStr)) {
    console.log("PAGASA Regional forecasts scrape rate-limited. Returning cached data.")
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbForecasts } = await supabase
        .from("pagasa_regional_forecasts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15)
      if (dbForecasts && dbForecasts.length > 0) {
        const grouped: Record<string, unknown> = {}
        for (const item of dbForecasts) {
          if (item.region && !grouped[item.region]) {
            grouped[item.region] = item
          }
        }
        writeLocalCache(cacheKey, grouped)
        return grouped
      }
    } catch (err) {
      console.warn("Failed to retrieve cached regional forecasts from Supabase on rate-limit:", err)
    }
    return getFallbackRegionalForecasts()
  }

  const REGION_API_MAP: Record<string, string> = {
    ncrprsd: "NationalCapitalRegion",
    nlprsd: "NorthernLuzon",
    slprsd: "SouthernLuzon",
    visprsd: "Visayas",
    minprsd: "Mindanao"
  }

  const results: Record<string, {
    region: string
    issued_at: string
    day_forecast: {
      image: string
      description: string
      low: string
      high: string
      wind_speed: string
      direction: string
      coastal: string
    }
    night_forecast: {
      image: string
      description: string
      low: string
      high: string
      wind_speed: string
      direction: string
      coastal: string
    }
    extended_outlook: Array<{
      day: string
      image: string
      low: string
      high: string
      wind: string
      direction: string
      coastal: string
    }>
    warnings: {
      rainfalls: string[]
      thunderstorms: string[]
      special: string[]
      gmma: string[]
    }
    provinces?: Record<string, {
      name: string
      day_forecast: {
        image: string
        description: string
        low: string
        high: string
        wind_speed: string
        direction: string
        coastal: string
      }
      night_forecast: {
        image: string
        description: string
        low: string
        high: string
        wind_speed: string
        direction: string
        coastal: string
      }
      extended_outlook: Array<{
        day: string
        image: string
        low: string
        high: string
        wind: string
        direction: string
        coastal: string
      }>
    }>
  }> = {}

  for (const regionId of REGIONS) {
    try {
      const url = `${REGIONAL_FORECAST_URL_PREFIX}/${regionId}`
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        cache: "no-store"
      })
      if (!response.ok) {
        throw new Error(`HTTP fetch error ${response.status}: ${response.statusText} for ${url}`)
      }
      
      const html = await response.text()
      
      const {
        region,
        issued_at,
        day_forecast,
        night_forecast,
        extended_outlook,
        warnings,
        provinceOptions
      } = parseRegionalHtml(html, regionId)

      const rawCookies = response.headers.get("set-cookie")
      let cookieHeader = ""
      if (rawCookies) {
        cookieHeader = rawCookies.split(";")[0].trim()
      }

      const provinces: Record<string, {
        name: string
        day_forecast: typeof day_forecast
        night_forecast: typeof night_forecast
        extended_outlook: typeof extended_outlook
      }> = {}
      const regionApiName = REGION_API_MAP[regionId]

      for (const opt of provinceOptions) {
        if (opt.isDefault) {
          // Default option is identical to the main page data
          provinces[opt.value] = {
            name: opt.name,
            day_forecast,
            night_forecast,
            extended_outlook
          }
        } else {
          try {
            const apiUrl = `${REGIONAL_API_BASE_URL}/${regionApiName}/${opt.value}`
            const apiRes = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "Origin": "https://bagong.pagasa.dost.gov.ph",
                "Referer": url,
                ...(cookieHeader ? { "Cookie": cookieHeader } : {})
              },
              body: "",
              cache: "no-store"
            })
            if (apiRes.ok) {
              const resData = await apiRes.json()
              const outlookList = resData.outlook || []
              if (outlookList.length > 0) {
                const currentOutlook = outlookList[0]
                const provDayForecast = {
                  image: currentOutlook.day_icon ? `/themes/hiraia/assets/images/weather-icons/${currentOutlook.day_icon}.png` : "",
                  description: currentOutlook.day_description || "",
                  low: currentOutlook.day_low !== null && currentOutlook.day_low !== undefined ? `${currentOutlook.day_low}°` : "",
                  high: currentOutlook.day_high !== null && currentOutlook.day_high !== undefined ? `${currentOutlook.day_high}°` : "",
                  wind_speed: currentOutlook.day_wind_speed || "",
                  direction: currentOutlook.day_wind_direction || "",
                  coastal: currentOutlook.day_coastal_condition || ""
                }
                const provNightForecast = {
                  image: currentOutlook.night_icon ? `/themes/hiraia/assets/images/weather-icons/night${currentOutlook.night_icon}.png` : "",
                  description: currentOutlook.night_description || "",
                  low: currentOutlook.night_low !== null && currentOutlook.night_low !== undefined ? `${currentOutlook.night_low}°` : "",
                  high: currentOutlook.night_high !== null && currentOutlook.night_high !== undefined ? `${currentOutlook.night_high}°` : "",
                  wind_speed: currentOutlook.night_wind_speed || "",
                  direction: currentOutlook.night_wind_direction || "",
                  coastal: currentOutlook.night_coastal_condition || ""
                }

                const provExtendedOutlook: typeof extended_outlook = []
                for (let i = 1; i < outlookList.length; i++) {
                  const outItem = outlookList[i]
                  const dayName = (extended_outlook[i - 1]?.day) || `Day ${i}`
                  provExtendedOutlook.push({
                    day: dayName,
                    image: outItem.day_icon ? `/themes/hiraia/assets/images/weather-icons/${outItem.day_icon}.png` : "",
                    low: outItem.day_low !== null && outItem.day_low !== undefined ? `${outItem.day_low}°` : "",
                    high: outItem.day_high !== null && outItem.day_high !== undefined ? `${outItem.day_high}°` : "",
                    wind: outItem.day_wind_speed || "",
                    direction: outItem.day_wind_direction || "",
                    coastal: outItem.day_coastal_condition || ""
                  })
                }

                provinces[opt.value] = {
                  name: opt.name,
                  day_forecast: provDayForecast,
                  night_forecast: provNightForecast,
                  extended_outlook: provExtendedOutlook
                }
              }
            } else {
              console.warn(`Province API request failed with status ${apiRes.status} for ${opt.name} (${opt.value})`)
            }
          } catch (apiErr) {
            console.error(`Error fetching province ${opt.name} (${opt.value}):`, apiErr)
          }
        }
      }

      const payload = {
        region,
        issued_at,
        day_forecast,
        night_forecast,
        extended_outlook,
        warnings,
        provinces
      }

      // Save to database with graceful fallback if provinces column doesn't exist yet
      try {
        const { error } = await supabase
          .from("pagasa_regional_forecasts")
          .upsert({ ...payload, region: regionId }, { onConflict: "region,issued_at" })
        if (error && error.message.includes("column \"provinces\" does not exist")) {
          console.log("Column 'provinces' does not exist in database yet. Retrying upsert without it...")
          const legacyPayload = { ...payload }
          delete (legacyPayload as { provinces?: unknown }).provinces
          await supabase
            .from("pagasa_regional_forecasts")
            .upsert({ ...legacyPayload, region: regionId }, { onConflict: "region,issued_at" })
        } else if (error) {
          console.warn(`DB write failed for region ${regionId}:`, error)
        }
      } catch (err) {
        console.warn(`DB write failed for region ${regionId}:`, err)
      }

      results[regionId] = payload
    } catch (err) {
      console.error(`Error scraping region ${regionId}:`, err)
    }
  }

  // Update status and local cache
  if (Object.keys(results).length > 0) {
    const nowStr = new Date().toISOString()
    const newHash = getHash(JSON.stringify(results))

    if (!force && newHash === cachedHash) {
      console.log("PAGASA Regional forecasts content unchanged. Skipping DB writes.")
      await updateScrapeStatus(cacheKey, REGIONAL_FORECAST_URL_PREFIX, newHash, nowStr)
      
      const cached = readLocalCache(cacheKey)
      if (cached) return cached

      try {
        const { data: dbForecasts } = await supabase
          .from("pagasa_regional_forecasts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15)
        if (dbForecasts && dbForecasts.length > 0) {
          const grouped: Record<string, unknown> = {}
          for (const item of dbForecasts) {
            if (item.region && !grouped[item.region]) {
              grouped[item.region] = item
            }
          }
          writeLocalCache(cacheKey, grouped)
          return grouped
        }
      } catch (err) {
        console.warn("Failed to retrieve cached regional forecasts from Supabase on unchanged content:", err)
      }
      return getFallbackRegionalForecasts()
    }

    writeLocalCache(cacheKey, results)
    await updateScrapeStatus(cacheKey, REGIONAL_FORECAST_URL_PREFIX, newHash, nowStr)
  }

  if (Object.keys(results).length > 0) {
    return results
  }

  const cached = readLocalCache(cacheKey)
  if (cached) return cached

  try {
    const { data: dbForecasts } = await supabase
      .from("pagasa_regional_forecasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15)
    if (dbForecasts && dbForecasts.length > 0) {
      const grouped: Record<string, unknown> = {}
      for (const item of dbForecasts) {
        if (item.region && !grouped[item.region]) {
          grouped[item.region] = item
        }
      }
      writeLocalCache(cacheKey, grouped)
      return grouped
    }
  } catch (err) {
    console.warn("Failed to retrieve cached regional forecasts from Supabase on final fallback:", err)
  }

  return getFallbackRegionalForecasts()
}

export function getFallbackRegionalForecasts() {
  return {
    ncrprsd: {
      region: "National Capital Region",
      issued_at: "05:00 AM, 20 June, 2026",
      day_forecast: { description: "Partly cloudy to cloudy skies" },
      night_forecast: { description: "Partly cloudy to cloudy skies" },
      extended_outlook: [],
      warnings: { rainfalls: [], thunderstorms: [], special: [], gmma: [] }
    }
  }
}
