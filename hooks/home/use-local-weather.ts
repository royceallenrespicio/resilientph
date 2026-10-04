"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { WeatherData, GeocodingResult, searchCities, fetchWeatherData, MarineData, fetchMarineData } from "@/lib/weather/meteo"

const DEFAULT_LOCATION = {
  name: "Metro Manila, PH",
  latitude: 14.5995,
  longitude: 120.9842
}

const LOCATION_STORAGE_KEY = "resilientph_preferred_weather_location_v1"
const WEATHER_CACHE_PREFIX = "resilientph_local_weather_cache_v1_"
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

export function useWeatherSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [marine, setMarine] = useState<MarineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeLocation, setActiveLocation] = useState<{ name: string; latitude: number; longitude: number } | null>(null)

  // 1. Initial Load from localStorage or default (safely inside useEffect for SSR safety)
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(LOCATION_STORAGE_KEY)
    } catch {
      // Private browsing or storage unavailable
    }

    setTimeout(() => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.name && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
            setActiveLocation(parsed)
            return
          }
        } catch (e) {
          console.error("Failed to parse saved weather location:", e)
        }
      }
      setActiveLocation(DEFAULT_LOCATION)
    }, 0)
  }, [])

  const searchControllerRef = useRef<AbortController | null>(null)

  // Cleanup geocoding abort controller on unmount
  useEffect(() => {
    return () => {
      if (searchControllerRef.current) {
        searchControllerRef.current.abort()
      }
    }
  }, [])

  // 2. Fetch weather when active location changes
  useEffect(() => {
    if (!activeLocation) return

    const cacheKey = `${WEATHER_CACHE_PREFIX}${activeLocation.latitude.toFixed(4)}_${activeLocation.longitude.toFixed(4)}`
    
    // Check cache first
    try {
      const cachedString = localStorage.getItem(cacheKey)
      if (cachedString) {
        const cached = JSON.parse(cachedString)
        if (cached && typeof cached.timestamp === "number" && cached.data) {
          const age = Date.now() - cached.timestamp
          if (age < CACHE_TTL_MS) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWeather(cached.data)
            setMarine(cached.marine ?? null)
            setLoading(false)
            setError(null)
            return // bypass loading/fetching
          }
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve local weather cache:", e)
    }

    const controller = new AbortController()
    const fetchLocWeather = async () => {
      setLoading(true)
      setError(null)
      try {
        const [weatherRes, marineRes] = await Promise.allSettled([
          fetchWeatherData(
            activeLocation.latitude,
            activeLocation.longitude,
            activeLocation.name,
            controller.signal
          ),
          fetchMarineData(
            activeLocation.latitude,
            activeLocation.longitude,
            controller.signal
          )
        ])

        if (controller.signal.aborted) return

        let wData: WeatherData | null = null
        let mData: MarineData | null = null

        if (weatherRes.status === "fulfilled") {
          wData = weatherRes.value
          setWeather(wData)
        } else {
          console.error("Weather fetch failed:", weatherRes.reason)
          throw new Error("Weather details temporarily unavailable.")
        }

        if (marineRes.status === "fulfilled") {
          mData = marineRes.value
          setMarine(mData)
        } else {
          setMarine(null)
        }

        // Cache successful response
        if (wData) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: wData,
              marine: mData
            }))
          } catch {
            // Ignore quota errors
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        console.error("Weather fetch failed:", err)
        if (!controller.signal.aborted) {
          setError("Weather details temporarily unavailable.")
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchLocWeather()

    return () => {
      controller.abort()
    }
  }, [activeLocation])

  // 3. Search helper (geocoding)
  const executeSearch = useCallback(async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([])
      return
    }

    if (searchControllerRef.current) {
      searchControllerRef.current.abort()
    }
    const controller = new AbortController()
    searchControllerRef.current = controller

    setSearching(true)
    setError(null)
    try {
      const results = await searchCities(queryText, controller.signal)
      if (!controller.signal.aborted) {
        setSearchResults(results)
        if (results.length === 0) {
          setError("No matching cities found.")
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return
      }
      console.error("Geocoding failed:", err)
      if (!controller.signal.aborted) {
        setError("Search service error. Try again.")
      }
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false)
      }
    }
  }, [])

  // 4. Action: Select a city
  const selectCity = useCallback((city: GeocodingResult) => {
    const locationName = city.admin1 ? `${city.name}, ${city.admin1}` : city.name
    const newLoc = {
      name: locationName,
      latitude: city.latitude,
      longitude: city.longitude
    }
    setActiveLocation(newLoc)
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc))
    } catch {
      // Private browsing or quota exceeded — silently ignore
    }
    setSearchResults([])
    setSearchQuery("")
  }, [])

  // 5. Action: Detect location
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      return
    }

    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLoc = {
          name: "Your Location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setActiveLocation(newLoc)
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc))
        } catch {
          // Private browsing or quota exceeded — silently ignore
        }
      },
      (err) => {
        console.error("Geolocation error:", err)
        setError("Permission denied or location lookup failed.")
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }, [])

  // 6. Action: Refresh
  const handleRefresh = useCallback(() => {
    if (!activeLocation) return
    const cacheKey = `${WEATHER_CACHE_PREFIX}${activeLocation.latitude.toFixed(4)}_${activeLocation.longitude.toFixed(4)}`
    try {
      localStorage.removeItem(cacheKey)
    } catch {
      // Ignore
    }
    setMarine(null)
    setActiveLocation((prev) => (prev ? { ...prev } : null))
  }, [activeLocation])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    weather,
    marine,
    loading,
    searching,
    error,
    activeLocation,
    executeSearch,
    selectCity,
    detectLocation,
    handleRefresh
  }
}
