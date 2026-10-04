
export interface DailyForecast {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  rainProb: number
}

export interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  precipitation: number
  weatherCode: number
  windSpeed: number
  windDirection: number
  hourlyTemps: number[]
  hourlyTimes: string[]
  hourlyRainProb: number[]
  hourlyHumidity: number[]
  hourlyWindSpeed: number[]
  dailyForecast: DailyForecast[]
  locationName: string
  // Air Quality & Pollutants
  aqi: number
  pm2_5: number
  pm10: number
  co: number
  no2: number
  so2: number
  o3: number
}

export interface MarineData {
  waveHeight: number | null
  wavePeriod: number | null
  waveDirection: number | null
  swellHeight: number | null
  swellPeriod: number | null
}

export interface CityData {
  name: string
  temp: number
  weatherCode: number
  aqi: number
  pm2_5: number
  pm10: number
  co: number
  no2: number
  so2: number
  o3: number
  latitude: number
  longitude: number
}

export const OPEN_METEO_CONFIG = {
  FORECAST_BASE_URL: "https://api.open-meteo.com/v1/forecast",
  HISTORICAL_FORECAST_BASE_URL: "https://historical-forecast-api.open-meteo.com/v1/forecast",
  HISTORICAL_WEATHER_BASE_URL: "https://archive-api.open-meteo.com/v1/archive",
  FLOOD_BASE_URL: "https://flood-api.open-meteo.com/v1/flood",
  MARINE_BASE_URL: "https://marine-api.open-meteo.com/v1/marine",
  AIR_QUALITY_BASE_URL: "https://air-quality-api.open-meteo.com/v1/air-quality",
  SEASONAL_BASE_URL: "https://seasonal-api.open-meteo.com/v1/seasonal",
  GEOCODING_BASE_URL: "https://geocoding-api.open-meteo.com/v1/search"
}

// Default cities in the Philippines
export const DEFAULT_PH_CITIES = [
  { name: "Manila", latitude: 14.5995, longitude: 120.9842 },
  { name: "Cebu City", latitude: 10.3157, longitude: 123.8854 },
  { name: "Davao City", latitude: 7.1907, longitude: 125.4553 },
  { name: "Baguio City", latitude: 16.4023, longitude: 120.5960 },
  { name: "Cagayan de Oro", latitude: 8.4542, longitude: 124.6319 }
]

// Fallback Mock Weather (Manila default)
export const MOCK_WEATHER: WeatherData = {
  temp: 29.5,
  feelsLike: 34.2,
  humidity: 82,
  precipitation: 0.2,
  weatherCode: 3, // Overcast
  windSpeed: 12.5,
  windDirection: 240, // SW
  hourlyTemps: [28, 27.5, 27, 28, 29.5, 31, 31.5, 30.8, 29.0],
  hourlyTimes: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00"],
  hourlyRainProb: [10, 20, 15, 30, 40, 50, 45, 30, 25],
  hourlyHumidity: [80, 82, 85, 80, 75, 70, 78, 81, 80],
  hourlyWindSpeed: [10, 11, 12, 14, 15, 13, 11, 10, 9],
  dailyForecast: [
    { date: "Monday", weatherCode: 95, tempMax: 30.0, tempMin: 24.0, rainProb: 95 },
    { date: "Tuesday", weatherCode: 2, tempMax: 33.0, tempMin: 26.0, rainProb: 20 },
    { date: "Wednesday", weatherCode: 0, tempMax: 34.5, tempMin: 26.5, rainProb: 10 },
    { date: "Thursday", weatherCode: 1, tempMax: 32.0, tempMin: 25.5, rainProb: 30 },
    { date: "Friday", weatherCode: 3, tempMax: 31.5, tempMin: 25.0, rainProb: 45 },
    { date: "Saturday", weatherCode: 3, tempMax: 32.5, tempMin: 25.0, rainProb: 40 },
    { date: "Sunday", weatherCode: 61, tempMax: 31.0, tempMin: 24.5, rainProb: 80 }
  ],
  locationName: "Metro Manila, PH",
  aqi: 42,
  pm2_5: 9.8,
  pm10: 15.2,
  co: 220,
  no2: 8.5,
  so2: 1.2,
  o3: 32.1
}

/**
 * Parses the weather and air quality API responses into a WeatherData structure.
 */
export function parseWeatherResponse(
  wData: unknown,
  aqData: unknown,
  locationName: string
): WeatherData {
  const wObj = wData && typeof wData === "object" ? (wData as Record<string, unknown>) : {}
  const aqObj = aqData && typeof aqData === "object" ? (aqData as Record<string, unknown>) : {}
  
  const current = (wObj.current && typeof wObj.current === "object" ? (wObj.current as Record<string, unknown>) : {})
  const hourly = (wObj.hourly && typeof wObj.hourly === "object" ? (wObj.hourly as Record<string, unknown>) : {})
  const daily = (wObj.daily && typeof wObj.daily === "object" ? (wObj.daily as Record<string, unknown>) : {})

  const hourlyTemps: number[] = []
  const hourlyTimes: string[] = []
  const hourlyRainProb: number[] = []
  const hourlyHumidity: number[] = []
  const hourlyWindSpeed: number[] = []
  
  const hourlyTime = Array.isArray(hourly.time) ? hourly.time : []
  const hourlyTemp2m = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : []
  const hourlyPrecipProb = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability : []
  const hourlyRelHumidity = Array.isArray(hourly.relative_humidity_2m) ? hourly.relative_humidity_2m : []
  const hourlyWindSpeed10m = Array.isArray(hourly.wind_speed_10m) ? hourly.wind_speed_10m : []

  if (hourlyTime.length > 0) {
    for (let i = 0; i <= 24; i += 3) {
      if (hourlyTemp2m[i] !== undefined) {
        hourlyTemps.push(Number(hourlyTemp2m[i]))
        hourlyRainProb.push(Number(hourlyPrecipProb[i] ?? 0))
        hourlyHumidity.push(Number(hourlyRelHumidity[i] ?? 0))
        hourlyWindSpeed.push(Number(hourlyWindSpeed10m[i] ?? 0))
        
        const date = new Date(String(hourlyTime[i]))
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        hourlyTimes.push(`${hours}:${minutes}`)
      }
    }
  }

  const dailyForecast: DailyForecast[] = []
  const dailyTime = Array.isArray(daily.time) ? daily.time : []
  const dailyWeatherCode = Array.isArray(daily.weather_code) ? daily.weather_code : []
  const dailyTempMax = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : []
  const dailyTempMin = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : []
  const dailyPrecipProbMax = Array.isArray(daily.precipitation_probability_max) ? daily.precipitation_probability_max : []

  if (dailyTime.length > 0) {
    const daysToParse = Math.min(dailyTime.length, 7)
    for (let i = 0; i < daysToParse; i++) {
      if (dailyTime[i] !== undefined) {
        const date = new Date(String(dailyTime[i]))
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
        dailyForecast.push({
          date: dayName,
          weatherCode: Number(dailyWeatherCode[i] ?? 3),
          tempMax: Number(dailyTempMax[i] ?? 30),
          tempMin: Number(dailyTempMin[i] ?? 24),
          rainProb: Number(dailyPrecipProbMax[i] ?? 0)
        })
      }
    }
  }

  // Retrieve Air Quality values
  const aqCurrent = (aqObj.current && typeof aqObj.current === "object" ? (aqObj.current as Record<string, unknown>) : {})
  const aqiVal = Number(aqCurrent.us_aqi ?? MOCK_WEATHER.aqi)
  const pm2_5Val = Number(aqCurrent.pm2_5 ?? MOCK_WEATHER.pm2_5)
  const pm10Val = Number(aqCurrent.pm10 ?? MOCK_WEATHER.pm10)
  const coVal = Number(aqCurrent.carbon_monoxide ?? MOCK_WEATHER.co)
  const no2Val = Number(aqCurrent.nitrogen_dioxide ?? MOCK_WEATHER.no2)
  const so2Val = Number(aqCurrent.sulphur_dioxide ?? MOCK_WEATHER.so2)
  const o3Val = Number(aqCurrent.ozone ?? MOCK_WEATHER.o3)

  return {
    temp: Number(current.temperature_2m ?? MOCK_WEATHER.temp),
    feelsLike: Number(current.apparent_temperature ?? MOCK_WEATHER.feelsLike),
    humidity: Number(current.relative_humidity_2m ?? MOCK_WEATHER.humidity),
    precipitation: Number(current.precipitation ?? MOCK_WEATHER.precipitation),
    weatherCode: Number(current.weather_code ?? MOCK_WEATHER.weatherCode),
    windSpeed: Number(current.wind_speed_10m ?? MOCK_WEATHER.windSpeed),
    windDirection: Number(current.wind_direction_10m ?? MOCK_WEATHER.windDirection),
    hourlyTemps,
    hourlyTimes: hourlyTimes.length ? hourlyTimes : MOCK_WEATHER.hourlyTimes,
    hourlyRainProb: hourlyRainProb.length ? hourlyRainProb : MOCK_WEATHER.hourlyRainProb,
    hourlyHumidity: hourlyHumidity.length ? hourlyHumidity : MOCK_WEATHER.hourlyHumidity,
    hourlyWindSpeed: hourlyWindSpeed.length ? hourlyWindSpeed : MOCK_WEATHER.hourlyWindSpeed,
    dailyForecast: dailyForecast.length ? dailyForecast : MOCK_WEATHER.dailyForecast,
    locationName,
    aqi: aqiVal,
    pm2_5: pm2_5Val,
    pm10: pm10Val,
    co: coVal,
    no2: no2Val,
    so2: so2Val,
    o3: o3Val
  }
}


export interface GeocodingResult {
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

/**
 * Searches cities using the Open-Meteo Geocoding API.
 */
export async function searchCities(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  if (!query.trim()) return []
  const geoUrl = `${OPEN_METEO_CONFIG.GEOCODING_BASE_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  
  const searchSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000)
  try {
    const response = await fetch(geoUrl, { signal: searchSignal })
    if (!response.ok) throw new Error("Geocoding search failed.")
    let data = await response.json()
    
    // Fallback: If no results and query contains a comma, search again using just the first part (e.g. "Las Piñas" from "Las Piñas, NCR")
    if ((!data.results || data.results.length === 0) && query.includes(",")) {
      const primaryQuery = query.split(",")[0].trim()
      if (primaryQuery) {
        const fallbackUrl = `${OPEN_METEO_CONFIG.GEOCODING_BASE_URL}?name=${encodeURIComponent(primaryQuery)}&count=5&language=en&format=json`
        const fallbackResponse = await fetch(fallbackUrl, { signal: searchSignal })
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if (fallbackData.results && fallbackData.results.length > 0) {
            data = fallbackData
          }
        }
      }
    }

    return (data.results || []).map((r: { name: string; latitude: number; longitude: number; admin1?: string; country?: string }) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      admin1: r.admin1,
      country: r.country
    }))
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return []
    }
    console.warn("Geocoding search failed:", err)
    return []
  }
}

/**
 * Retrieves weather and air quality for specific coordinates.
 */
export async function fetchWeatherData(
  lat: number,
  lon: number,
  locationName: string,
  signal?: AbortSignal
): Promise<WeatherData> {
  const weatherUrl = `${OPEN_METEO_CONFIG.FORECAST_BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FManila`
  const aqUrl = `${OPEN_METEO_CONFIG.AIR_QUALITY_BASE_URL}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`

  const weatherSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000)
  const aqSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000)

  const [wRes, aqRes] = await Promise.all([
    fetch(weatherUrl, { signal: weatherSignal }),
    fetch(aqUrl, { signal: aqSignal })
  ])

  if (!wRes.ok) throw new Error("Failed to retrieve weather reports.")
  const wData = await wRes.json()
  const aqData = aqRes.ok ? await aqRes.json() : null

  return parseWeatherResponse(wData, aqData, locationName)
}

/**
 * Retrieves marine weather (waves and swell) for specific coordinates.
 * Returns null if the coordinates are landlocked (which returns a 400 Bad Request from Open-Meteo).
 */
export async function fetchMarineData(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<MarineData | null> {
  const marineUrl = `${OPEN_METEO_CONFIG.MARINE_BASE_URL}?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period&timezone=Asia%2FManila`
  
  const marineSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000)
  
  try {
    const res = await fetch(marineUrl, { signal: marineSignal })
    if (!res.ok) {
      // 400 status usually represents landlocked location or coordinates outside range
      return null
    }
    const data = await res.json()
    const current = data.current && typeof data.current === "object" ? data.current : {}
    return {
      waveHeight: current.wave_height !== undefined ? Number(current.wave_height) : null,
      wavePeriod: current.wave_period !== undefined ? Number(current.wave_period) : null,
      waveDirection: current.wave_direction !== undefined ? Number(current.wave_direction) : null,
      swellHeight: current.swell_wave_height !== undefined ? Number(current.swell_wave_height) : null,
      swellPeriod: current.swell_wave_period !== undefined ? Number(current.swell_wave_period) : null
    }
  } catch (err) {
    console.warn("Failed to retrieve marine conditions (possibly landlocked):", err)
    return null
  }
}

// ─── Weather Code Descriptions ────────────────────────────────────────────────
export const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  56: "Light freezing drizzle", 57: "Dense freezing drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Light freezing rain", 67: "Heavy freezing rain",
  71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
}

export function getWeatherDescription(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] || "Unspecified weather conditions"
}