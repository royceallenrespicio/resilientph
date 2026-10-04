"use server"

import { createClient } from "@/lib/supabase/server"
import {
  scrapeDailyWeather,
  scrapeRegionalForecasts,
  scrapeTemperatures,
  scrapeWeeklyOutlook,
  scrapeAllPagasa
} from "@/lib/scraper/pagasa"
import { scrapeEarthquakes } from "@/lib/scraper/phivolcs"

export async function forceScrapeAction(type: string, target: "pagasa" | "phivolcs") {
  const supabase = await createClient()

  // 1. Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized. You must be logged in." }
  }

  // 2. Fetch user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Forbidden. Only administrators can trigger manual scrapes." }
  }

  // 3. Execute requested scrape with force=true bypass
  try {
    const force = true
    if (target === "phivolcs") {
      await scrapeEarthquakes(force)
      return { success: true, message: "PHIVOLCS earthquakes force-scraped successfully." }
    } else if (target === "pagasa") {
      switch (type) {
        case "daily":
          await scrapeDailyWeather(force)
          break
        case "regional":
          await scrapeRegionalForecasts(force)
          break
        case "temperatures":
          await scrapeTemperatures(force)
          break
        case "weekly":
          await scrapeWeeklyOutlook(force)
          break
        case "all":
        default:
          await scrapeAllPagasa(force)
          break
      }
      return { success: true, message: `PAGASA (${type}) force-scraped successfully.` }
    }
    
    return { success: false, error: "Invalid target specified." }
  } catch (err) {
    console.error(`Force scrape failed for ${target} (${type}):`, err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to execute manual scrape." }
  }
}
