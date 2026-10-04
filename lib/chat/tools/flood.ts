import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { OPEN_METEO_CONFIG, searchCities } from "@/lib/weather/meteo"

export const floodTool = tool(
  async ({ location }) => {
    try {
      // Geocode location using Open-Meteo Geocoding API
      const geoResults = await searchCities(location)
      if (!geoResults || geoResults.length === 0) {
        return `Could not find any location matching "${location}". Please try with a city or province name.`
      }

      const { latitude, longitude, name, country, admin1 } = geoResults[0]
      const regionName = admin1 ? `${name}, ${admin1}` : name

      // Fetch flood forecast from Open-Meteo Flood API
      const floodUrl = `${OPEN_METEO_CONFIG.FLOOD_BASE_URL}?latitude=${latitude}&longitude=${longitude}&daily=river_discharge&timezone=auto`
      const floodRes = await fetch(floodUrl)
      if (!floodRes.ok) {
        return `Found location: ${regionName} (${country}) but failed to retrieve flood data.`
      }

      const floodData = await floodRes.json()
      const daily = floodData.daily

      if (!daily || !daily.river_discharge || daily.river_discharge.length === 0) {
        return `No river discharge or flood forecast data available for ${regionName} (${country}).`
      }

      // Return 10 days of river discharge forecast (compact and clean)
      const forecastDays = daily.time.slice(0, 10).map((timeStr: string, idx: number) => ({
        date: timeStr,
        river_discharge: `${daily.river_discharge[idx]} m³/s`
      }))

      return JSON.stringify({
        location: regionName,
        country,
        coordinates: { latitude, longitude },
        river_discharge_forecast_10_days: forecastDays
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving flood data: ${msg}`
    }
  },
  {
    name: "get_flood_forecast",
    description: "Retrieve river discharge forecasts and flood risk indicators (river discharge in cubic meters per second) for a given city or location in the Philippines or worldwide.",
    schema: z.object({
      location: z.string().describe("The city, town, province, or region name, e.g. Pampanga, Cagayan Valley, Manila, Bulacan"),
    })
  }
)
