import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { OPEN_METEO_CONFIG, searchCities } from "@/lib/weather/meteo"

export const airQualityTool = tool(
  async ({ location }) => {
    try {
      // Geocode location using Open-Meteo Geocoding API
      const geoResults = await searchCities(location)
      if (!geoResults || geoResults.length === 0) {
        return `Could not find any location matching "${location}". Please try with a city or province name.`
      }

      const { latitude, longitude, name, country, admin1 } = geoResults[0]
      const regionName = admin1 ? `${name}, ${admin1}` : name

      // Fetch air quality forecast from Open-Meteo Air Quality API
      const aqUrl = `${OPEN_METEO_CONFIG.AIR_QUALITY_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`
      const aqRes = await fetch(aqUrl)
      if (!aqRes.ok) {
        return `Found location: ${regionName} (${country}) but failed to retrieve air quality data.`
      }

      const aqData = await aqRes.json()
      const current = aqData.current

      if (!current) {
        return `No current air quality data available for ${regionName} (${country}).`
      }

      // Classify Air Quality Index (US AQI category scale)
      let aqiStatus = "Good"
      if (current.us_aqi > 50) aqiStatus = "Moderate"
      if (current.us_aqi > 100) aqiStatus = "Unhealthy for Sensitive Groups"
      if (current.us_aqi > 150) aqiStatus = "Unhealthy"
      if (current.us_aqi > 200) aqiStatus = "Very Unhealthy"
      if (current.us_aqi > 300) aqiStatus = "Hazardous"

      return JSON.stringify({
        location: regionName,
        country,
        coordinates: { latitude, longitude },
        current_air_quality: {
          us_aqi: current.us_aqi,
          status: aqiStatus,
          pm2_5: `${current.pm2_5} \u03bcg/m\u00b3`,
          pm10: `${current.pm10} \u03bcg/m\u00b3`,
          carbon_monoxide: `${current.carbon_monoxide} \u03bcg/m\u00b3`,
          nitrogen_dioxide: `${current.nitrogen_dioxide} \u03bcg/m\u00b3`,
          sulphur_dioxide: `${current.sulphur_dioxide} \u03bcg/m\u00b3`,
          ozone: `${current.ozone} \u03bcg/m\u00b3`
        }
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving air quality data: ${msg}`
    }
  },
  {
    name: "get_air_quality",
    description: "Retrieve current air quality index (AQI) and pollutant levels (PM2.5, PM10, CO, NO2, SO2, O3) for a given location worldwide.",
    schema: z.object({
      location: z.string().describe("The city, town, province, or region name, e.g. Quezon City, Baguio, Cebu City, Manila"),
    })
  }
)
