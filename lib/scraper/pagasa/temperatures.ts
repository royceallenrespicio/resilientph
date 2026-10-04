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
} from "../helpers"
import { TEMPERATURES_URL } from "@/lib/constants"

export async function scrapeTemperatures(force = false) {
  const supabase = createAdminClient()
  const cacheKey = "pagasa_temperatures"
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
    console.log("PAGASA Temperatures scrape rate-limited. Returning cached data.")
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbData } = await supabase
        .from("pagasa_temperatures")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbData) {
        writeLocalCache(cacheKey, dbData)
        return dbData
      }
    } catch (err) {
      console.warn("Failed to retrieve cached temperatures from Supabase on rate-limit:", err)
    }
    return getFallbackTemperatures()
  }

  try {
    const html = await fetchHtml(TEMPERATURES_URL)
    const hash = getHash(html)

    if (!force && hash === cachedHash) {
      console.log("PAGASA Temperatures page unchanged. Skipping parse.")
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, TEMPERATURES_URL, hash, nowStr)
      
      const cached = readLocalCache(cacheKey)
      if (cached) return cached

      try {
        const { data: dbData } = await supabase
          .from("pagasa_temperatures")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (dbData) {
          writeLocalCache(cacheKey, dbData)
          return dbData
        }
      } catch (err) {
        console.warn("Failed to retrieve cached temperatures from Supabase on unchanged content:", err)
      }
      return getFallbackTemperatures()
    }

    const $ = cheerio.load(html)

    // Lowest
    const lowest: Array<{ station: string; temp: string }> = []
    const lowestHeading = $("h4:contains('Lowest'), h4:contains('Pinakamababa')")
    const lowestTable = lowestHeading.closest(".panel").find("table")
    lowestTable.find("tbody tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 2) {
        lowest.push({
          station: $(tds[0]).text().trim(),
          temp: $(tds[1]).text().trim()
        })
      }
    })
    const lowest_as_of = lowestHeading.text().trim().replace(/Top 10 Lowest Temperature as of/gi, "").trim()

    // Highest
    const highest: Array<{ station: string; temp: string }> = []
    const highestHeading = $("h4:contains('Highest'), h4:contains('Pinakamataas')")
    const highestTable = highestHeading.closest(".panel").find("table")
    highestTable.find("tbody tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 2) {
        highest.push({
          station: $(tds[0]).text().trim(),
          temp: $(tds[1]).text().trim()
        })
      }
    })
    const highest_as_of = highestHeading.text().trim().replace(/Top 10 Highest Temperature as of/gi, "").trim()

    const payload = {
      lowest_as_of,
      lowest,
      highest_as_of,
      highest
    }

    // Check if newest record already has these Lowest/Highest as of dates
    try {
      await supabase.from("pagasa_temperatures").upsert(payload, { onConflict: "lowest_as_of, highest_as_of" })
    } catch (err) {
      console.warn("DB write failed for temperatures, relying on local file cache:", err)
    }

    writeLocalCache(cacheKey, payload)
    const nowStr = new Date().toISOString()
    await updateScrapeStatus(cacheKey, TEMPERATURES_URL, hash, nowStr)

    return payload
  } catch (err) {
    console.error("Error scraping PAGASA temperatures:", err)
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbData } = await supabase
        .from("pagasa_temperatures")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbData) {
        return dbData
      }
    } catch (dbErr) {
      console.warn("Failed to retrieve cached temperatures from Supabase on error catch:", dbErr)
    }
    return getFallbackTemperatures()
  }
}

export function getFallbackTemperatures() {
  return {
    lowest_as_of: "June 12, 2026",
    lowest: [{ station: "Baguio City", temp: "18.6°C" }],
    highest_as_of: "June 19, 2026",
    highest: [{ station: "Tuguegarao City, Cagayan", temp: "37.9°C" }]
  }
}
