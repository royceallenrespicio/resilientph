"use client"

import { useCallback } from "react"
import { findContainingFeature } from "@/lib/map/spatial"
import { RegionProperties, ProvinceProperties, MunicityProperties } from "@/lib/map/types"
import { useBoundaryData } from "./use-boundary-data"
import { useBoundarySelection } from "./use-boundary-selection"
import { useBoundaryWeather } from "./use-boundary-weather"

/** Zoom thresholds for automatic boundary level switching */
const ZOOM_REGIONS_MAX = 7.0
const ZOOM_PROVINCES_MAX = 9.0

export function useAdministrativeBoundaries() {
  const selection = useBoundarySelection()
  const data = useBoundaryData()
  const weather = useBoundaryWeather()

  const updateActiveLevelAndFetch = useCallback((zoom: number, centerLng: number, centerLat: number) => {
    if (data.regionsBBoxIndex.current.length === 0) return

    const point: [number, number] = [centerLng, centerLat]

    if (zoom <= ZOOM_REGIONS_MAX) {
      selection.setActiveLevel("regions")
      if (data.renderedRegionCode.current !== null) {
        data.clearRenderedRegionCode()
        data.clearRenderedProvinceCode()
        data.setProvincesGeoJson(null)
        data.setMunicitiesGeoJson(null)
      }
    } else if (zoom <= ZOOM_PROVINCES_MAX) {
      selection.setActiveLevel("provinces")
      if (data.renderedProvinceCode.current !== null) {
        data.clearRenderedProvinceCode()
        data.setMunicitiesGeoJson(null)
      }

      const containingRegion = findContainingFeature(point, data.regionsBBoxIndex.current)
      if (containingRegion && containingRegion.properties) {
        const regionCode = containingRegion.properties.ADM1_PCODE as string
        data.fetchProvincesForRegion(regionCode)
      }
    } else {
      selection.setActiveLevel("municities")

      const containingRegion = findContainingFeature(point, data.regionsBBoxIndex.current)
      if (containingRegion && containingRegion.properties) {
        const regionCode = containingRegion.properties.ADM1_PCODE as string

        if (regionCode !== data.renderedRegionCode.current) {
          data.fetchProvincesForRegion(regionCode).then(() => {
            const provIndex = data.provincesBBoxIndex.current.get(regionCode)
            if (provIndex) {
              const containingProvince = findContainingFeature(point, provIndex)
              if (containingProvince && containingProvince.properties) {
                const provinceCode = containingProvince.properties.ADM2_PCODE as string
                data.fetchMunicitiesForProvince(provinceCode)
              }
            }
          })
        } else {
          const provIndex = data.provincesBBoxIndex.current.get(regionCode)
          if (provIndex) {
            const containingProvince = findContainingFeature(point, provIndex)
            if (containingProvince && containingProvince.properties) {
              const provinceCode = containingProvince.properties.ADM2_PCODE as string
              data.fetchMunicitiesForProvince(provinceCode)
            }
          }
        }
      }
    }
  }, [selection, data])

  const selectRegion = useCallback((region: RegionProperties) => {
    selection.setSelectedRegion(region)
    selection.setSelectedProvince(null)
    selection.setSelectedMunicity(null)
    weather.setWeatherData(null)
    if (region?.ADM1_PCODE) {
      const centroid = data.regionCentroidsMap.current.get(region.ADM1_PCODE)
      if (centroid) {
        weather.fetchLocalWeather(centroid.latitude, centroid.longitude, region.ADM1_EN)
      }
    }
  }, [selection, weather, data])

  const selectProvince = useCallback((province: ProvinceProperties) => {
    selection.setSelectedProvince(province)
    selection.setSelectedMunicity(null)
    weather.setWeatherData(null)
    if (province?.ADM2_PCODE) {
      const centroid = data.provinceCentroidsMap.current.get(province.ADM2_PCODE)
      if (centroid) {
        weather.fetchLocalWeather(centroid.latitude, centroid.longitude, province.ADM2_EN)
      }
    }
  }, [selection, weather, data])

  const selectMunicity = useCallback((municity: MunicityProperties) => {
    selection.setSelectedMunicity(municity)
    weather.setWeatherData(null)
    if (municity?.ADM3_PCODE) {
      const centroid = data.municityCentroidsMap.current.get(municity.ADM3_PCODE)
      if (centroid) {
        weather.fetchLocalWeather(centroid.latitude, centroid.longitude, municity.ADM3_EN)
      }
    }
  }, [selection, weather, data])

  const closeBoundaryPanel = useCallback(() => {
    selection.setSelectedRegion(null)
    selection.setSelectedProvince(null)
    selection.setSelectedMunicity(null)
    weather.setWeatherData(null)
  }, [selection, weather])

  return {
    activeLevel: selection.activeLevel,
    selectedRegion: selection.selectedRegion,
    selectedProvince: selection.selectedProvince,
    selectedMunicity: selection.selectedMunicity,
    regionsGeoJson: data.regionsGeoJson,
    hoveredId: selection.hoveredId,
    hoveredName: selection.hoveredName,
    loading: data.loading,
    error: data.error,
    weatherData: weather.weatherData,
    weatherLoading: weather.weatherLoading,
    weatherError: weather.weatherError,
    updateActiveLevelAndFetch,
    selectRegion,
    selectProvince,
    selectMunicity,
    setHoveredId: selection.setHoveredId,
    setHoveredName: selection.setHoveredName,
    closeBoundaryPanel,
    provincesGeoJson: data.provincesGeoJson,
    municitiesGeoJson: data.municitiesGeoJson
  }
}
