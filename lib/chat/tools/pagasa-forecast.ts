import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { readLocalCache } from "@/lib/scraper/helpers"

// Use a type-safe definition or any for simplicity since createClient is request-scoped
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function getDailyWeather(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from("pagasa_daily_weather")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (data) return data
  } catch (err) {
    console.warn("Supabase query for daily weather failed, using local cache fallback:", err)
  }
  return readLocalCache("pagasa_daily_weather")
}

async function getRegionalForecasts(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from("pagasa_regional_forecasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15) // fetch enough to cover the 5 regions
    if (error) throw error
    if (data && data.length > 0) {
      // Keep only the newest entry for each region
      const deduped: Record<string, unknown> = {}
      for (const item of data) {
        if (item.region && !deduped[item.region]) {
          deduped[item.region] = item
        }
      }
      return deduped
    }
  } catch (err) {
    console.warn("Supabase query for regional forecasts failed, using local cache fallback:", err)
  }
  return readLocalCache("pagasa_regional_forecasts")
}

async function getTemperatures(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from("pagasa_temperatures")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (data) return data
  } catch (err) {
    console.warn("Supabase query for temperatures failed, using local cache fallback:", err)
  }
  return readLocalCache("pagasa_temperatures")
}

async function getWeeklyOutlook(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from("pagasa_weekly_outlook")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (data) return data
  } catch (err) {
    console.warn("Supabase query for weekly outlook failed, using local cache fallback:", err)
  }
  return readLocalCache("pagasa_weekly_outlook")
}

async function getTyphoonBulletin(supabase: SupabaseClient) {
  try {
    const { data: activeList, error: activeError } = await supabase
      .from("pagasa_typhoon_bulletin")
      .select("*")
      .eq("active", true)

    if (activeError) throw activeError

    if (activeList && activeList.length > 0) {
      return activeList.map((item) => {
        if (item.wind_signal && (item.wind_signal.startsWith("{") || item.wind_signal.startsWith("["))) {
          try {
            item.wind_signal = JSON.parse(item.wind_signal)
          } catch {
            // Ignore parse errors
          }
        }
        return item
      })
    }

    // Fallback to latest single record
    const { data, error } = await supabase
      .from("pagasa_typhoon_bulletin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (data) {
      if (data.wind_signal && (data.wind_signal.startsWith("{") || data.wind_signal.startsWith("["))) {
        try {
          data.wind_signal = JSON.parse(data.wind_signal)
        } catch {
          // Ignore parse errors
        }
      }
      return [data]
    }
  } catch (err) {
    console.warn("Supabase query for typhoon bulletin failed, using local cache fallback:", err)
  }

  const cached = readLocalCache("pagasa_typhoon_bulletin")
  if (cached) {
    const cacheList = Array.isArray(cached) ? cached : [cached]
    return cacheList.map((item: Record<string, unknown>) => {
      const windSignal = item["wind_signal"]
      if (windSignal && typeof windSignal === "string" && (windSignal.startsWith("{") || windSignal.startsWith("["))) {
        try {
          item["wind_signal"] = JSON.parse(windSignal)
        } catch {
          // Ignore parse errors
        }
      }
      return item
    })
  }
  return null
}

export const pagasaForecastTool = tool(
  async ({ type = "all" }) => {
    try {
      const supabase = await createClient()
      let data: unknown

      switch (type) {
        case "daily":
          data = await getDailyWeather(supabase)
          break
        case "regional":
          data = await getRegionalForecasts(supabase)
          break
        case "temperatures":
          data = await getTemperatures(supabase)
          break
        case "weekly":
          data = await getWeeklyOutlook(supabase)
          break
        case "typhoon":
          data = {
            bulletin: await getTyphoonBulletin(supabase),
            daily_tc_info: (await getDailyWeather(supabase) as { tc_info?: unknown })?.tc_info
          }
          break
        case "all":
        default:
          data = {
            daily: await getDailyWeather(supabase),
            regional: await getRegionalForecasts(supabase),
            temperatures: await getTemperatures(supabase),
            weekly: await getWeeklyOutlook(supabase),
            typhoon: await getTyphoonBulletin(supabase)
          }
          break
      }

      return JSON.stringify({
        source: "PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration)",
        type,
        forecast: data
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving weather database: ${msg}`
    }
  },
  {
    name: "get_pagasa_forecast",
    description: "Get the latest weather forecasts, weather outlooks, rainfall warnings, thunderstorm advisories, and active tropical cyclone/typhoon bulletins issued by PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration) for the Philippines and specific regions.",
    schema: z.object({
      type: z.enum(["daily", "regional", "temperatures", "weekly", "typhoon", "all"])
        .optional()
        .describe("The specific type of weather forecast to fetch. 'daily' includes official synopsis and TC (Tropical Cyclone) info for cyclones outside or inside PAR. 'typhoon' is for active local severe weather typhoon bulletins inside PAR and TC info. Defaults to 'all'.")
    })
  }
)
