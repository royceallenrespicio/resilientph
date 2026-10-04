import { TyphoonBulletin, PagasaRegionalForecast } from "@/lib/home/types"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Parses a TyphoonBulletin record, ensuring wind_signal is an object.
 */
export function parseTyphoonRecord(item: TyphoonBulletin): TyphoonBulletin {
  const rawWindSignal = item.wind_signal as unknown
  if (rawWindSignal && typeof rawWindSignal === "string" && (rawWindSignal.startsWith("{") || rawWindSignal.startsWith("["))) {
    try {
      item.wind_signal = JSON.parse(rawWindSignal)
    } catch {
      // Ignore parse errors
    }
  }
  return item
}

/**
 * Attempts to load an active typhoon bulletin from the response.
 * If none is found, falls back to the most recent inactive bulletin.
 */
export async function processTyphoonData(
  typhoonRes: PromiseSettledResult<{ data: unknown[] | null, error: unknown }>,
  supabase: SupabaseClient
): Promise<TyphoonBulletin[] | null> {
  let typhoonData: TyphoonBulletin[] | null = null

  if (typhoonRes.status === "fulfilled" && !typhoonRes.value.error && typhoonRes.value.data) {
    const list = typhoonRes.value.data as unknown as TyphoonBulletin[]
    if (list.length > 0) {
      typhoonData = list.map(parseTyphoonRecord)
    }
  }

  // If no active bulletins, fallback to the single newest record (inactive marker)
  if (!typhoonData) {
    try {
      const { data: fallbackRecord } = await supabase
        .from("pagasa_typhoon_bulletin")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackRecord) {
        typhoonData = [parseTyphoonRecord(fallbackRecord as unknown as TyphoonBulletin)]
      }
    } catch (err) {
      console.warn("Failed to fetch fallback inactive typhoon bulletin:", err)
    }
  }

  return typhoonData
}

/**
 * Parses regional forecast records into a map keyed by region code.
 */
export function processRegionalForecasts(
  regionalRes: PromiseSettledResult<{ data: unknown[] | null, error: unknown }>
): Record<string, PagasaRegionalForecast> | null {
  const regionalData: Record<string, PagasaRegionalForecast> = {}
  
  if (regionalRes.status === "fulfilled" && !regionalRes.value.error && regionalRes.value.data) {
    const rawList = regionalRes.value.data as Record<string, unknown>[]
    for (const item of rawList) {
      if (item.region && typeof item.region === "string" && !regionalData[item.region]) {
        regionalData[item.region] = item as unknown as PagasaRegionalForecast
      }
    }
  }
  
  return Object.keys(regionalData).length > 0 ? regionalData : null
}
