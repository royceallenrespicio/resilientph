"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { WeatherData, fetchWeatherData } from "@/lib/weather/meteo"

export function useBoundaryWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const weatherControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      weatherControllerRef.current?.abort()
    }
  }, [])

  const fetchLocalWeather = useCallback(async (lat: number, lon: number, locationName: string) => {
    if (weatherControllerRef.current) {
      weatherControllerRef.current.abort()
    }
    const controller = new AbortController()
    weatherControllerRef.current = controller

    setWeatherLoading(true)
    setWeatherError(null)
    try {
      const parsed = await fetchWeatherData(lat, lon, locationName, controller.signal)
      setWeatherData(parsed)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Local weather fetch error:", err)
      setWeatherError("Weather logs unavailable.")
      setWeatherData(null)
    } finally {
      if (!controller.signal.aborted) {
        setWeatherLoading(false)
      }
    }
  }, [])

  return {
    weatherData,
    setWeatherData,
    weatherLoading,
    weatherError,
    fetchLocalWeather
  }
}
