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
import { WEEKLY_OUTLOOK_URL } from "@/lib/constants"

export async function scrapeWeeklyOutlook(force = false) {
  const supabase = createAdminClient()
  const cacheKey = "pagasa_weekly_outlook"
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
    console.log("PAGASA Weekly outlook scrape rate-limited. Returning cached data.")
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbData } = await supabase
        .from("pagasa_weekly_outlook")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbData) {
        writeLocalCache(cacheKey, dbData)
        return dbData
      }
    } catch (err) {
      console.warn("Failed to retrieve cached weekly outlook from Supabase on rate-limit:", err)
    }
    return getFallbackWeeklyOutlook()
  }

  try {
    const html = await fetchHtml(WEEKLY_OUTLOOK_URL)
    const hash = getHash(html)

    if (!force && hash === cachedHash) {
      console.log("PAGASA Weekly outlook page unchanged. Skipping parse.")
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, WEEKLY_OUTLOOK_URL, hash, nowStr)
      
      const cached = readLocalCache(cacheKey)
      if (cached) return cached

      try {
        const { data: dbData } = await supabase
          .from("pagasa_weekly_outlook")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (dbData) {
          writeLocalCache(cacheKey, dbData)
          return dbData
        }
      } catch (err) {
        console.warn("Failed to retrieve cached weekly outlook from Supabase on unchanged content:", err)
      }
      return getFallbackWeeklyOutlook()
    }

    const $ = cheerio.load(html)

    const validityDiv = $(".validity").first()
    const issuedText = validityDiv.find("b").eq(0).text().trim() || validityDiv.text().trim()
    const validText = validityDiv.find("b").eq(1).text().trim()

    const issued_at = issuedText.replace(/Issued at:/gi, "").trim()
    const valid_until = validText.replace(/Valid until:/gi, "").trim()

    const outlook: Array<{ period: string; content: string }> = []
    $(".article-content table tbody tr, .article-content tbody tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 2) {
        const period = $(tds[0]).text().trim().replace(/\s+/g, " ")
        const content = $(tds[1]).text().trim().replace(/\s+/g, " ")
        if (period || content) {
          outlook.push({ period, content })
        }
      }
    })

    const payload = {
      issued_at,
      valid_until,
      outlook
    }

    try {
      await supabase.from("pagasa_weekly_outlook").upsert(payload, { onConflict: "issued_at, valid_until" })
    } catch (err) {
      console.warn("DB write failed for weekly outlook, relying on local file cache:", err)
    }

    writeLocalCache(cacheKey, payload)
    const nowStr = new Date().toISOString()
    await updateScrapeStatus(cacheKey, WEEKLY_OUTLOOK_URL, hash, nowStr)

    return payload
  } catch (err) {
    console.error("Error scraping PAGASA weekly outlook:", err)
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: dbData } = await supabase
        .from("pagasa_weekly_outlook")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbData) {
        return dbData
      }
    } catch (dbErr) {
      console.warn("Failed to retrieve cached weekly outlook from Supabase on error catch:", dbErr)
    }
    return getFallbackWeeklyOutlook()
  }
}

export function getFallbackWeeklyOutlook() {
  return {
    issued_at: "12:00 PM, 19 June 2026",
    valid_until: "12:00 PM, 26 June 2026",
    outlook: []
  }
}
