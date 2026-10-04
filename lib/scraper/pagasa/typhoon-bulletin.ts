
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
import { parseTyphoonHtml } from "./typhoon-parser"
import { TYPHOON_BULLETIN_URL } from "@/lib/constants"

export async function scrapeTyphoonBulletin(force = false) {
  const supabase = createAdminClient()
  const cacheKey = "pagasa_typhoon_bulletin"

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
  } catch (err) {
    console.warn("Supabase fetch failed for typhoon status:", err)
  }

  // Fallback to local status if not retrieved from database
  if (!lastScrapedStr) {
    const status = readLocalStatus(cacheKey)
    if (status) {
      lastScrapedStr = status.last_scraped_at
      cachedHash = status.html_hash
    }
  }

  if (!force && isRateLimited(lastScrapedStr)) {
    console.log("PAGASA Typhoon Bulletin scrape rate-limited. Returning cached data.")
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: activeList } = await supabase
        .from("pagasa_typhoon_bulletin")
        .select("*")
        .eq("active", true)
      if (activeList && activeList.length > 0) {
        writeLocalCache(cacheKey, activeList)
        return activeList
      }
      const { data: latestRecord } = await supabase
        .from("pagasa_typhoon_bulletin")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestRecord) {
        writeLocalCache(cacheKey, latestRecord)
        return latestRecord
      }
    } catch (err) {
      console.warn("Failed to retrieve cached typhoon bulletin from Supabase on rate-limit:", err)
    }
    return getFallbackTyphoonBulletin()
  }

  try {
    const html = await fetchHtml(TYPHOON_BULLETIN_URL)
    const hash = getHash(html)

    if (!force && hash === cachedHash) {
      console.log("PAGASA Typhoon Bulletin page content unchanged. Skipping parse.")
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, TYPHOON_BULLETIN_URL, hash, nowStr)
      
      const cached = readLocalCache(cacheKey)
      if (cached) return cached

      try {
        const { data: activeList } = await supabase
          .from("pagasa_typhoon_bulletin")
          .select("*")
          .eq("active", true)
        if (activeList && activeList.length > 0) {
          writeLocalCache(cacheKey, activeList)
          return activeList
        }
        const { data: latestRecord } = await supabase
          .from("pagasa_typhoon_bulletin")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestRecord) {
          writeLocalCache(cacheKey, latestRecord)
          return latestRecord
        }
      } catch (err) {
        console.warn("Failed to retrieve cached typhoon bulletin from Supabase on unchanged content:", err)
      }
      return getFallbackTyphoonBulletin()
    }

    const bulletins = parseTyphoonHtml(html)

    // Database / Cache Sync Section
    if (bulletins.length > 0) {
      // 1. Process active bulletins
      for (const payload of bulletins) {
        try {
          const { data: existing } = await supabase
            .from("pagasa_typhoon_bulletin")
            .select("id, active")
            .eq("title", payload.title)
            .eq("issued_at", payload.issued_at)
            .maybeSingle()

          if (existing) {
            // Re-activate if it was marked inactive
            if (!existing.active) {
              await supabase
                .from("pagasa_typhoon_bulletin")
                .update({ active: true, updated_at: new Date().toISOString() })
                .eq("id", existing.id)
            }
          } else {
            // Save new bulletin
            await supabase.from("pagasa_typhoon_bulletin").insert(payload)
          }
        } catch (err) {
          console.warn(`DB sync failed for active typhoon ${payload.title}:`, err)
        }
      }

      // 2. Deactivate any other database records marked active
      try {
        const { data: dbActive } = await supabase
          .from("pagasa_typhoon_bulletin")
          .select("id, title, issued_at")
          .eq("active", true)

        if (dbActive) {
          for (const record of dbActive) {
            const isStillActive = bulletins.some(
              b => b.title === record.title && b.issued_at === record.issued_at
            )
            if (!isStillActive) {
              await supabase
                .from("pagasa_typhoon_bulletin")
                .update({ active: false, updated_at: new Date().toISOString() })
                .eq("id", record.id)
            }
          }
        }
      } catch (err) {
        console.warn("DB deactivation sync failed:", err)
      }

      writeLocalCache(cacheKey, bulletins)
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, TYPHOON_BULLETIN_URL, hash, nowStr)
      return bulletins
    } else {
      // No active bulletins found or parsed
      const inactivePayload = {
        active: false,
        message: "No active tropical cyclone bulletin issued."
      }

      // Deactivate all database active records
      try {
        await supabase
          .from("pagasa_typhoon_bulletin")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("active", true)
      } catch (err) {
        console.warn("Failed to deactivate active bulletins on empty scrape run:", err)
      }

      // Check if newest record is already inactive to prevent duplicate rows
      let alreadyExists = false
      try {
        const { data: latestRecord } = await supabase
          .from("pagasa_typhoon_bulletin")
          .select("active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestRecord && latestRecord.active === false) {
          alreadyExists = true
        }
      } catch (err) {
        console.warn("Could not check duplicate status for inactive typhoon bulletin:", err)
      }

      if (!alreadyExists) {
        try {
          await supabase.from("pagasa_typhoon_bulletin").insert(inactivePayload)
        } catch (err) {
          console.warn("DB write failed for inactive typhoon bulletin, relying on local cache:", err)
        }
      }

      writeLocalCache(cacheKey, inactivePayload)
      const nowStr = new Date().toISOString()
      await updateScrapeStatus(cacheKey, TYPHOON_BULLETIN_URL, hash, nowStr)
      return inactivePayload
    }
  } catch (err) {
    console.error("Error scraping PAGASA Typhoon Bulletin:", err)
    const cached = readLocalCache(cacheKey)
    if (cached) return cached

    try {
      const { data: activeList } = await supabase
        .from("pagasa_typhoon_bulletin")
        .select("*")
        .eq("active", true)
      if (activeList && activeList.length > 0) {
        return activeList
      }
      const { data: latestRecord } = await supabase
        .from("pagasa_typhoon_bulletin")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestRecord) {
        return latestRecord
      }
    } catch (dbErr) {
      console.warn("Failed to retrieve cached typhoon bulletin from Supabase on error catch:", dbErr)
    }
    return getFallbackTyphoonBulletin()
  }
}

export function getFallbackTyphoonBulletin() {
  return {
    active: false,
    message: "No active tropical cyclone bulletin issued."
  }
}

