import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { OPEN_METEO_CONFIG, searchCities } from "@/lib/weather/meteo"

export const marineTool = tool(
  async ({ location }) => {
    try {
      // Geocode location using Open-Meteo Geocoding API
      const geoResults = await searchCities(location)
      if (!geoResults || geoResults.length === 0) {
        return `Could not find any location matching "${location}". Please try with a city, province, or island name.`
      }

      const { latitude, longitude, name, country, admin1 } = geoResults[0]
      const regionName = admin1 ? `${name}, ${admin1}` : name

      // Fetch marine forecast from Open-Meteo Marine API
      const marineUrl = `${OPEN_METEO_CONFIG.MARINE_BASE_URL}?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=auto`
      const marineRes = await fetch(marineUrl)
      if (!marineRes.ok) {
        return `Found location: ${regionName} (${country}) but failed to retrieve marine data. Note that marine data is only available for coastal and ocean locations.`
      }

      const marineData = await marineRes.json()
      const daily = marineData.daily

      if (!daily || !daily.wave_height_max || daily.wave_height_max.length === 0) {
        return `No marine or wave forecast data available for ${regionName} (${country}). This location might be inland.`
      }

      // Return 7 days of wave forecast (compact and clean)
      const forecastDays = daily.time.slice(0, 7).map((timeStr: string, idx: number) => ({
        date: timeStr,
        max_wave_height: typeof daily.wave_height_max[idx] === "number" ? `${daily.wave_height_max[idx]} m` : "N/A",
        dominant_wave_direction: typeof daily.wave_direction_dominant[idx] === "number" ? `${daily.wave_direction_dominant[idx]}°` : "N/A",
        max_wave_period: typeof daily.wave_period_max[idx] === "number" ? `${daily.wave_period_max[idx]} s` : "N/A"
      }))

      return JSON.stringify({
        location: regionName,
        country,
        coordinates: { latitude, longitude },
        marine_forecast_7_days: forecastDays
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving marine data: ${msg}`
    }
  },
  {
    name: "get_marine_forecast",
    description: "Retrieve ocean and marine forecast data for a coastal, island, or marine location worldwide, including wave heights, dominant wave directions, and wave periods.",
    schema: z.object({
      location: z.string().describe("The coastal city, island, or province name, e.g. Siargao, Boracay, Surigao, Legazpi, Manila Bay"),
    })
  }
)
