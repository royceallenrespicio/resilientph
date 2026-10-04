"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  EarthquakeEvent,
  parseUSGSResponse,
  buildUSGSQueryUrl
} from "@/lib/map/usgs"
import { GDACSEvent } from "@/lib/emergency/gdacs"
import { createClient } from "@/lib/supabase/client"
import type { EarthquakeEvent as PhivolcsQuakeEvent } from "@/lib/scraper/phivolcs"

import {
  TyphoonBulletin,
  PagasaDailyWeather,
  PagasaTemperatures,
  PagasaWeeklyOutlook,
  PagasaRegionalForecast,
} from "@/lib/home/types"
import { processTyphoonData, processRegionalForecasts } from "@/lib/home/dashboard"


export function useDashboardData() {
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([])
  const [phivolcsQuakes, setPhivolcsQuakes] = useState<PhivolcsQuakeEvent[]>([])
  const [typhoon, setTyphoon] = useState<TyphoonBulletin[] | null>(null)
  const [pagasaDaily, setPagasaDaily] = useState<PagasaDailyWeather | null>(null)
  const [pagasaTemps, setPagasaTemps] = useState<PagasaTemperatures | null>(null)
  const [pagasaWeekly, setPagasaWeekly] = useState<PagasaWeeklyOutlook | null>(null)
  const [pagasaRegional, setPagasaRegional] = useState<Record<string, PagasaRegionalForecast> | null>(null)
  const [gdacsEvents, setGdacsEvents] = useState<GDACSEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const controllerRef = useRef<AbortController | null>(null)

  // Fetch geological earthquakes and GDACS alerts in parallel
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const todayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const todayDate = todayIso.split('T')[0]
      const quakeUrl = buildUSGSQueryUrl({ startTime: todayDate, minMagnitude: 4.0 })

      let quakeSignal = signal
      if (signal) {
        try {
          quakeSignal = AbortSignal.any([signal, AbortSignal.timeout(8000)])
        } catch {
          // fallback for older environments
        }
      }

      const [
        quakeRes,
        gdacsRes,
        phivolcsRes,
        typhoonRes,
        dailyRes,
        tempsRes,
        weeklyRes,
        regionalRes
      ] = await Promise.allSettled([
        fetch(quakeUrl, { signal: quakeSignal || AbortSignal.timeout(8000) }),
        fetch("/api/gdacs", { signal }),
        supabase
          .from("phivolcs_earthquakes")
          .select("*")
          .gte("magnitude", 4.0)
          .gte("event_time", todayIso)
          .order("event_time", { ascending: false })
          .limit(10),
        supabase
          .from("pagasa_typhoon_bulletin")
          .select("*")
          .eq("active", true),
        supabase
          .from("pagasa_daily_weather")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pagasa_temperatures")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pagasa_weekly_outlook")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pagasa_regional_forecasts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15)
      ])

      if (signal?.aborted) return

      // 1. Process Earthquakes (USGS)
      let quakeList: EarthquakeEvent[] = []
      if (quakeRes.status === "fulfilled" && quakeRes.value.ok) {
        const qData = await quakeRes.value.json()
        quakeList = parseUSGSResponse(qData)
      }

      // 2. Process GDACS Alerts
      let gdacsList: GDACSEvent[] = []
      if (gdacsRes.status === "fulfilled" && gdacsRes.value.ok) {
        gdacsList = await gdacsRes.value.json()
      }

      // 3. Process PHIVOLCS Earthquakes
      let phivolcsList: PhivolcsQuakeEvent[] = []
      if (phivolcsRes.status === "fulfilled" && !phivolcsRes.value.error && phivolcsRes.value.data) {
        phivolcsList = phivolcsRes.value.data as unknown as PhivolcsQuakeEvent[]
      }

      // 4. Process Typhoon Bulletin
      const typhoonData = await processTyphoonData(typhoonRes, supabase)

      // 5. Process Daily Weather
      let dailyData: PagasaDailyWeather | null = null
      if (dailyRes.status === "fulfilled" && !dailyRes.value.error && dailyRes.value.data) {
        dailyData = dailyRes.value.data as unknown as PagasaDailyWeather
      }

      // 6. Process PAGASA Temperatures
      let tempsData: PagasaTemperatures | null = null
      if (tempsRes.status === "fulfilled" && !tempsRes.value.error && tempsRes.value.data) {
        tempsData = tempsRes.value.data as unknown as PagasaTemperatures
      }

      // 7. Process PAGASA Weekly Outlook
      let weeklyData: PagasaWeeklyOutlook | null = null
      if (weeklyRes.status === "fulfilled" && !weeklyRes.value.error && weeklyRes.value.data) {
        weeklyData = weeklyRes.value.data as unknown as PagasaWeeklyOutlook
      }
      
      // 8. Process PAGASA Regional Forecasts
      const regionalData = processRegionalForecasts(regionalRes)

      if (signal?.aborted) return

      setEarthquakes(quakeList)
      setGdacsEvents(gdacsList)
      setPhivolcsQuakes(phivolcsList)
      setTyphoon(typhoonData)
      setPagasaDaily(dailyData)
      setPagasaTemps(tempsData)
      setPagasaWeekly(weeklyData)
      setPagasaRegional(regionalData)
    } catch (err: unknown) {
      const isAborted = signal?.aborted || (err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted")))
      if (isAborted) return
      console.error("Failed to compile dashboard data:", err)
      setError("Failed to fetch fresh parameters.")
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [supabase])

  // Trigger fetch on mount and handle cleanup
  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller
    const timeout = setTimeout(() => {
      fetchData(controller.signal)
    }, 0)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [fetchData])

  const handleRefresh = () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller
    fetchData(controller.signal)
  }

  return {
    earthquakes,
    phivolcsQuakes,
    typhoon,
    pagasaDaily,
    pagasaTemps,
    pagasaWeekly,
    pagasaRegional,
    gdacsEvents,
    loading,
    error,
    handleRefresh
  }
}
