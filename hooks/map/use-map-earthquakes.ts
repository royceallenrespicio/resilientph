"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { EarthquakeEvent, parseUSGSResponse, buildUSGSQueryUrl } from "@/lib/map/usgs"
import { createClient } from "@/lib/supabase/client"
import { mergeEarthquakes } from "@/lib/map/merge-earthquakes"

export function useEarthquakes() {
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("")
  const [minMagnitude, setMinMagnitude] = useState<number>(4.0)
  const [timeRange, setTimeRange] = useState<number>(1) // days
  const [selectedSource, setSelectedSource] = useState<"all" | "phivolcs" | "usgs">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  // Fetch earthquakes from both USGS API and local Supabase DB
  const fetchEarthquakes = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const startTimestamp = Date.now() - timeRange * 24 * 60 * 60 * 1000
      const startTime = new Date(startTimestamp)
        .toISOString()
        .split("T")[0]
      const startTimeStr = new Date(startTimestamp).toISOString()

      // USGS API Endpoint for PH bounding box
      const url = buildUSGSQueryUrl({ startTime })

      const [usgsRes, phivolcsRes] = await Promise.all([
        fetch(url, { signal: controller.signal }).catch((err) => {
          if (err instanceof Error && err.name === "AbortError") return null
          console.error("USGS fetch failed:", err)
          return null
        }),
        supabase
          .from("phivolcs_earthquakes")
          .select("*")
          .gte("magnitude", 4.0)
          .gte("event_time", startTimeStr)
          .order("event_time", { ascending: false })
      ])

      if (controller.signal.aborted) return

      let parsedUSGS: EarthquakeEvent[] = []
      if (usgsRes && usgsRes.ok) {
        const data = await usgsRes.json()
        parsedUSGS = parseUSGSResponse(data)
      } else if (usgsRes) {
        console.error(`USGS API responded with error status: ${usgsRes.status}`)
      }

      let parsedPhivolcs: EarthquakeEvent[] = []
      if (phivolcsRes.error) {
        console.warn("PHIVOLCS database offline or table unavailable:", phivolcsRes.error.message)
      } else if (phivolcsRes.data) {
        parsedPhivolcs = phivolcsRes.data.map((quake) => ({
          id: quake.id,
          magnitude: Number(quake.magnitude),
          place: quake.location,
          time: new Date(quake.event_time || quake.datetime).getTime(),
          depth: Number(quake.depth_km),
          url: quake.info_url || "",
          latitude: Number(quake.latitude),
          longitude: Number(quake.longitude),
          source: 'phivolcs' as const
        }))
      }

      if (controller.signal.aborted) return

      // Merge and sort chronologically (newest first)
      const combined = mergeEarthquakes(parsedUSGS, parsedPhivolcs)

      setEarthquakes(combined)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Error fetching earthquakes for map:", err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || "Failed to load geological logs.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [timeRange, supabase])

  // Refetch when timeRange changes (using setTimeout to avoid synchronous setState inside effect warning)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEarthquakes()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchEarthquakes])

  // Filtered list memo
  const filteredEarthquakes = useMemo(() => {
    return earthquakes.filter((quake) => {
      const matchesSearch = quake.place.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMagnitude = quake.magnitude >= minMagnitude
      const matchesSource = selectedSource === "all" || quake.source === selectedSource
      return matchesSearch && matchesMagnitude && matchesSource
    })
  }, [earthquakes, searchQuery, minMagnitude, selectedSource])

  // Active selected earthquake details
  const selectedEarthquake = useMemo(() => {
    return earthquakes.find((q) => q.id === selectedId) || null
  }, [earthquakes, selectedId])

  return {
    earthquakes,
    filteredEarthquakes,
    selectedEarthquake,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    minMagnitude,
    setMinMagnitude,
    timeRange,
    setTimeRange,
    selectedSource,
    setSelectedSource,
    selectedId,
    setSelectedId,
    refetch: fetchEarthquakes
  }
}
