import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { OPEN_METEO_CONFIG, getWeatherDescription, searchCities } from "@/lib/weather/meteo"

export const historicalWeatherTool = tool(
  async ({ location, start_date, end_date }) => {
    try {
      // 1. Geocode location using Open-Meteo Geocoding API
      const geoResults = await searchCities(location)
      if (!geoResults || geoResults.length === 0) {
        return `Could not find any location matching "${location}". Please try with a city or province name.`
      }

      const { latitude, longitude, name, country, admin1 } = geoResults[0]
      const regionName = admin1 ? `${name}, ${admin1}` : name

      // 2. Fetch historical observed weather from Open-Meteo Archive API
      const archiveUrl = `${OPEN_METEO_CONFIG.HISTORICAL_WEATHER_BASE_URL}?latitude=${latitude}&longitude=${longitude}&start_date=${start_date}&end_date=${end_date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max,weather_code&timezone=auto`
      const archiveRes = await fetch(archiveUrl)
      if (!archiveRes.ok) {
        return `Found location: ${regionName} (${country}) but failed to retrieve historical weather observations for the specified period (${start_date} to ${end_date}).`
      }

      const archiveData = await archiveRes.json()
      const daily = archiveData.daily

      if (!daily || !daily.time || daily.time.length === 0) {
        return `No historical weather observations available for ${regionName} (${country}) between ${start_date} and ${end_date}.`
      }

      // Format daily historical weather observations
      const dailyObservations = daily.time.map((timeStr: string, idx: number) => {
        const code = daily.weather_code[idx]
        const conditions = typeof code === "number" ? getWeatherDescription(code) : "Unknown"
        return {
          date: timeStr,
          max_temperature: daily.temperature_2m_max[idx] !== undefined ? `${daily.temperature_2m_max[idx]}°C` : "N/A",
          min_temperature: daily.temperature_2m_min[idx] !== undefined ? `${daily.temperature_2m_min[idx]}°C` : "N/A",
          precipitation: daily.precipitation_sum[idx] !== undefined ? `${daily.precipitation_sum[idx]} mm` : "N/A",
          rain: daily.rain_sum[idx] !== undefined ? `${daily.rain_sum[idx]} mm` : "N/A",
          max_wind_speed: daily.wind_speed_10m_max[idx] !== undefined ? `${daily.wind_speed_10m_max[idx]} km/h` : "N/A",
          conditions
        }
      })

      return JSON.stringify({
        location: regionName,
        country,
        coordinates: { latitude, longitude },
        start_date,
        end_date,
        historical_daily_observations: dailyObservations
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving historical weather observations: ${msg}`
    }
  },
  {
    name: "get_historical_weather",
    description: "Retrieve historical observed weather data (maximum/minimum temperatures, daily precipitation sums, rain, maximum wind speeds, and weather conditions) for a specific city or region between two past dates.",
    schema: z.object({
      location: z.string().describe("The city, town, province, or region name, e.g. Tacloban, Manila, Cebu City, Baguio"),
      start_date: z.string().describe("The start date in YYYY-MM-DD format (must be in the past), e.g. 2013-11-05"),
      end_date: z.string().describe("The end date in YYYY-MM-DD format (must be in the past), e.g. 2013-11-10")
    })
  }
)
