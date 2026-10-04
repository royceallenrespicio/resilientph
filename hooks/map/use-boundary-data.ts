"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { buildBBoxIndex, BBoxIndex, buildCentroidsMap } from "@/lib/map/spatial"
import {
  PH_REGIONS_GEOJSON_URL,
  PH_PROVINCES_GEOJSON_URL_PREFIX,
  PH_MUNICITIES_GEOJSON_URL_PREFIX
} from "@/lib/constants"
import { GeoJsonFeatureCollection } from "@/lib/map/types"

export function useBoundaryData() {
  const [regionsGeoJson, setRegionsGeoJson] = useState<GeoJsonFeatureCollection | null>(null)
  const [provincesGeoJson, setProvincesGeoJson] = useState<GeoJsonFeatureCollection | null>(null)
  const [municitiesGeoJson, setMunicitiesGeoJson] = useState<GeoJsonFeatureCollection | null>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const regionsBBoxIndex = useRef<BBoxIndex>([])
  const provincesBBoxIndex = useRef<Map<string, BBoxIndex>>(new Map())

  const regionCentroidsMap = useRef<Map<string, { latitude: number; longitude: number }>>(new Map())
  const provinceCentroidsMap = useRef<Map<string, { latitude: number; longitude: number }>>(new Map())
  const municityCentroidsMap = useRef<Map<string, { latitude: number; longitude: number }>>(new Map())

  const provincesCache = useRef<Map<string, GeoJsonFeatureCollection>>(new Map())
  const municitiesCache = useRef<Map<string, GeoJsonFeatureCollection>>(new Map())

  const renderedRegionCode = useRef<string | null>(null)
  const renderedProvinceCode = useRef<string | null>(null)

  const regionsControllerRef = useRef<AbortController | null>(null)
  const provincesControllerRef = useRef<AbortController | null>(null)
  const municitiesControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      regionsControllerRef.current?.abort()
      provincesControllerRef.current?.abort()
      municitiesControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (regionsGeoJson) return

    const controller = new AbortController()
    regionsControllerRef.current = controller

    const fetchRegions = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = PH_REGIONS_GEOJSON_URL
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error("Failed to load Philippine regional boundaries.")
        }
        const data = await response.json()
        const bboxIdx = buildBBoxIndex(data)
        regionsBBoxIndex.current = bboxIdx
        regionCentroidsMap.current = buildCentroidsMap(bboxIdx, "ADM1_PCODE")
        setRegionsGeoJson(data)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Regions fetch error:", err)
        const message = err instanceof Error ? err.message : String(err)
        setError(message || "Failed to load regional boundaries.")
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchRegions()
    return () => controller.abort()
  }, [regionsGeoJson])

  const fetchProvincesForRegion = useCallback(async (regionCode: string) => {
    if (regionCode === renderedRegionCode.current) return

    const cached = provincesCache.current.get(regionCode)
    if (cached) {
      renderedRegionCode.current = regionCode
      setProvincesGeoJson(cached)
      return
    }

    if (provincesControllerRef.current) {
      provincesControllerRef.current.abort()
    }
    const controller = new AbortController()
    provincesControllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const code = regionCode.toLowerCase()
      const url = `${PH_PROVINCES_GEOJSON_URL_PREFIX}${code}.0.001.json`
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error("Failed to load provinces for selected region.")
      }
      const data = await response.json()
      provincesCache.current.set(regionCode, data)
      const bboxIdx = buildBBoxIndex(data)
      provincesBBoxIndex.current.set(regionCode, bboxIdx)
      provinceCentroidsMap.current = buildCentroidsMap(bboxIdx, "ADM2_PCODE")
      renderedRegionCode.current = regionCode
      setProvincesGeoJson(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Provinces fetch error:", err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message || "Failed to load regional provinces.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  const fetchMunicitiesForProvince = useCallback(async (provinceCode: string) => {
    if (provinceCode === renderedProvinceCode.current) return

    const cached = municitiesCache.current.get(provinceCode)
    if (cached) {
      renderedProvinceCode.current = provinceCode
      setMunicitiesGeoJson(cached)
      const bboxIdx = buildBBoxIndex(cached)
      municityCentroidsMap.current = buildCentroidsMap(bboxIdx, "ADM3_PCODE")
      return
    }

    if (municitiesControllerRef.current) {
      municitiesControllerRef.current.abort()
    }
    const controller = new AbortController()
    municitiesControllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const code = provinceCode.toLowerCase()
      const url = `${PH_MUNICITIES_GEOJSON_URL_PREFIX}${code}.0.001.json`
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error("Failed to load cities/municipalities for selected province.")
      }
      const data = await response.json()
      municitiesCache.current.set(provinceCode, data)
      const bboxIdx = buildBBoxIndex(data)
      municityCentroidsMap.current = buildCentroidsMap(bboxIdx, "ADM3_PCODE")
      renderedProvinceCode.current = provinceCode
      setMunicitiesGeoJson(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Municities fetch error:", err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message || "Failed to load local city boundaries.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  const clearRenderedRegionCode = useCallback(() => {
    renderedRegionCode.current = null
  }, [])

  const clearRenderedProvinceCode = useCallback(() => {
    renderedProvinceCode.current = null
  }, [])

  return {
    regionsGeoJson,
    provincesGeoJson,
    municitiesGeoJson,
    setProvincesGeoJson,
    setMunicitiesGeoJson,
    loading,
    error,
    regionsBBoxIndex,
    provincesBBoxIndex,
    regionCentroidsMap,
    provinceCentroidsMap,
    municityCentroidsMap,
    renderedRegionCode,
    renderedProvinceCode,
    fetchProvincesForRegion,
    fetchMunicitiesForProvince,
    clearRenderedRegionCode,
    clearRenderedProvinceCode
  }
}
