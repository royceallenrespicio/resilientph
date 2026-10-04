import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { OPEN_METEO_CONFIG, getWeatherDescription, searchCities } from "@/lib/weather/meteo"

// ─── Weather & Upcoming Forecast Tool (Open-Meteo) ───────────────────────────
export const weatherTool = tool(
  async ({ location = "Manila", forecast_days = 7 }) => {
    try {
      const searchTarget = location?.trim() ? location.trim() : "Manila"
      const clampedDays = Math.min(Math.max(forecast_days || 7, 1), 14)

      // Geocode location using Open-Meteo Geocoding API
      const geoResults = await searchCities(searchTarget)
      if (!geoResults || geoResults.length === 0) {
        return `Could not find any location matching "${searchTarget}". Please try with a city or province name.`
      }

      const { latitude, longitude, name, country, admin1 } = geoResults[0]
      const regionName = admin1 ? `${name}, ${admin1}` : name

      // Fetch weather and multi-day forecast from Open-Meteo
      const weatherUrl = `${OPEN_METEO_CONFIG.FORECAST_BASE_URL}?latitude=${latitude}&longitude=${longitude}&models=best_match&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,cape&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max&forecast_days=${clampedDays}&timezone=auto`

      const weatherRes = await fetch(weatherUrl)
      if (!weatherRes.ok) {
        return `Found location: ${regionName} (${country}) but failed to retrieve forecast data.`
      }

      const weatherData = await weatherRes.json()
      const current = weatherData.current || {}
      const daily = weatherData.daily || {}
      const hourly = weatherData.hourly || {}
      const currentDesc = getWeatherDescription(current.weather_code)

      // Find the hourly index that matches the current time's hour
      let currentCapeIdx = 0
      let startHourlyIdx = 0
      if (current && current.time && hourly && hourly.time) {
        const currentHourPrefix = current.time.substring(0, 13) // "YYYY-MM-DDTHH"
        const idx = hourly.time.findIndex((t: string) => t.startsWith(currentHourPrefix))
        if (idx !== -1) {
          currentCapeIdx = idx
          startHourlyIdx = idx
        }
      }
      const currentCape = hourly.cape && hourly.cape[currentCapeIdx] !== undefined ? `${hourly.cape[currentCapeIdx]} J/kg` : "N/A"

      // Format multi-day daily forecasts
      const upcomingDailyForecasts = (daily.time || []).map((dateStr: string, idx: number) => {
        const dateObj = new Date(dateStr)
        const dayOfWeek = isNaN(dateObj.getTime())
          ? ""
          : dateObj.toLocaleDateString("en-US", { weekday: "long" })
        const code = daily.weather_code?.[idx]
        const conditions = typeof code === "number" ? getWeatherDescription(code) : "Unknown"

        return {
          date: dateStr,
          day_of_week: dayOfWeek,
          conditions,
          max_temperature: daily.temperature_2m_max?.[idx] !== undefined ? `${daily.temperature_2m_max[idx]}°C` : "N/A",
          min_temperature: daily.temperature_2m_min?.[idx] !== undefined ? `${daily.temperature_2m_min[idx]}°C` : "N/A",
          max_feels_like: daily.apparent_temperature_max?.[idx] !== undefined ? `${daily.apparent_temperature_max[idx]}°C` : "N/A",
          min_feels_like: daily.apparent_temperature_min?.[idx] !== undefined ? `${daily.apparent_temperature_min[idx]}°C` : "N/A",
          precipitation_sum: daily.precipitation_sum?.[idx] !== undefined ? `${daily.precipitation_sum[idx]} mm` : "N/A",
          precipitation_probability: daily.precipitation_probability_max?.[idx] !== undefined ? `${daily.precipitation_probability_max[idx]}%` : "N/A",
          max_wind_speed: daily.wind_speed_10m_max?.[idx] !== undefined ? `${daily.wind_speed_10m_max[idx]} km/h` : "N/A",
          max_wind_gusts: daily.wind_gusts_10m_max?.[idx] !== undefined ? `${daily.wind_gusts_10m_max[idx]} km/h` : "N/A",
          max_uv_index: daily.uv_index_max?.[idx] !== undefined ? daily.uv_index_max[idx] : "N/A"
        }
      })

      // Format next 24 hours breakdown in 3-hour intervals (8 steps)
      const next24hBreakdown = []
      if (hourly.time && hourly.time.length > 0) {
        const totalSteps = 8
        for (let step = 0; step < totalSteps; step++) {
          const targetIdx = startHourlyIdx + step * 3
          if (targetIdx < hourly.time.length) {
            const timeVal = hourly.time[targetIdx]
            const tempVal = hourly.temperature_2m?.[targetIdx]
            const apparentTempVal = hourly.apparent_temperature?.[targetIdx]
            const humidityVal = hourly.relative_humidity_2m?.[targetIdx]
            const precipProbVal = hourly.precipitation_probability?.[targetIdx]
            const precipVal = hourly.precipitation?.[targetIdx]
            const wCode = hourly.weather_code?.[targetIdx]
            const windVal = hourly.wind_speed_10m?.[targetIdx]

            next24hBreakdown.push({
              time: timeVal,
              temperature: tempVal !== undefined ? `${tempVal}°C` : "N/A",
              feels_like: apparentTempVal !== undefined ? `${apparentTempVal}°C` : "N/A",
              humidity: humidityVal !== undefined ? `${humidityVal}%` : "N/A",
              precipitation_probability: precipProbVal !== undefined ? `${precipProbVal}%` : "N/A",
              precipitation: precipVal !== undefined ? `${precipVal} mm` : "N/A",
              conditions: typeof wCode === "number" ? getWeatherDescription(wCode) : "Unknown",
              wind_speed: windVal !== undefined ? `${windVal} km/h` : "N/A"
            })
          }
        }
      }

      return JSON.stringify({
        location: regionName,
        country,
        coordinates: { latitude, longitude },
        current: {
          temperature: current.temperature_2m !== undefined ? `${current.temperature_2m}°C` : "N/A",
          feels_like: current.apparent_temperature !== undefined ? `${current.apparent_temperature}°C` : "N/A",
          humidity: current.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}%` : "N/A",
          wind_speed: current.wind_speed_10m !== undefined ? `${current.wind_speed_10m} km/h` : "N/A",
          wind_direction: current.wind_direction_10m !== undefined ? `${current.wind_direction_10m}°` : "N/A",
          conditions: currentDesc,
          precipitation: current.precipitation !== undefined ? `${current.precipitation} mm` : "N/A",
          cape: currentCape
        },
        forecast_days_retrieved: clampedDays,
        upcoming_forecast: upcomingDailyForecasts,
        next_24h_breakdown: next24hBreakdown
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving weather data: ${msg}`
    }
  },
  {
    name: "get_weather",
    description: "Retrieve current weather, upcoming multi-day daily forecasts (up to 14 days), and 24-hour interval trends (temperatures, weather conditions, precipitation probability, rainfall amount, wind speed, gusts, UV index, and CAPE thunderstorm instability) for a given city, province, or region. Defaults to Manila for general inquiries.",
    schema: z.object({
      location: z.string().optional().describe("The city, town, province, or region name, e.g. Manila, Quezon City, Baguio, Cebu City, Davao City. Defaults to Manila for general inquiries."),
      forecast_days: z.number().min(1).max(14).optional().describe("Number of upcoming daily forecast days to retrieve (1 to 14, default 7).")
    })
  }
)
