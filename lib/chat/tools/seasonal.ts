import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { OPEN_METEO_CONFIG, searchCities } from "@/lib/weather/meteo"

export const seasonalTool = tool(
  async ({ location }) => {
    try {
      // Geocode location using Open-Meteo Geocoding API
      const geoResults = await searchCities(location)
      if (!geoResults || geoResults.length === 0) {
        return `Could not find any location matching "${location}". Please try with a city or province name.`
      }

      const { latitude, longitude, name, country, admin1 } = geoResults[0]
      const regionName = admin1 ? `${name}, ${admin1}` : name

      // Fetch seasonal forecast from Open-Meteo Seasonal API
      const seasonalUrl = `${OPEN_METEO_CONFIG.SEASONAL_BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation&timezone=auto`
      const seasonalRes = await fetch(seasonalUrl)
      if (!seasonalRes.ok) {
        return `Found location: ${regionName} (${country}) but failed to retrieve seasonal forecast data.`
      }

      const seasonalData = await seasonalRes.json()
      const hourly = seasonalData.hourly

      if (!hourly || !hourly.time || hourly.time.length === 0) {
        return `No seasonal forecast data available for ${regionName} (${country}).`
      }

      // Group and aggregate 6-hourly data by month to prevent overloading the LLM
      const monthlyData: Record<string, { temps: number[]; precips: number[] }> = {}

      for (let i = 0; i < hourly.time.length; i++) {
        const dateStr = hourly.time[i] // e.g. "2026-06-01T00:00"
        const monthKey = dateStr.substring(0, 7) // "2026-06"

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { temps: [], precips: [] }
        }

        const temp = hourly.temperature_2m[i]
        const precip = hourly.precipitation[i]

        if (typeof temp === "number") {
          monthlyData[monthKey].temps.push(temp)
        }
        if (typeof precip === "number") {
          monthlyData[monthKey].precips.push(precip)
        }
      }

      const monthlyForecast = Object.entries(monthlyData).map(([month, data]) => {
        const avgTemp = data.temps.length > 0
          ? (data.temps.reduce((sum, val) => sum + val, 0) / data.temps.length).toFixed(1)
          : "N/A"
        const totalPrecip = data.precips.length > 0
          ? data.precips.reduce((sum, val) => sum + val, 0).toFixed(1)
          : "N/A"

        return {
          month,
          projected_average_temperature: avgTemp !== "N/A" ? `${avgTemp}°C` : "N/A",
          projected_total_precipitation: totalPrecip !== "N/A" ? `${totalPrecip} mm` : "N/A"
        }
      })

      return JSON.stringify({
        location: regionName,
        country,
        coordinates: { latitude, longitude },
        seasonal_monthly_forecast: monthlyForecast
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving seasonal forecast data: ${msg}`
    }
  },
  {
    name: "get_seasonal_forecast",
    description: "Retrieve long-range seasonal climate trend forecasts (up to 6-7 months ahead) for a given location, showing monthly temperature averages and precipitation totals.",
    schema: z.object({
      location: z.string().describe("The city, town, province, or region name, e.g. Manila, Cebu City, Davao City"),
    })
  }
)
