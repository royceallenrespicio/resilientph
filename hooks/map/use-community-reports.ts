"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchIncidentReports, IncidentReport } from "@/lib/supabase/reports"

export function useCommunityReports() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchIncidentReports(supabase)
      setIncidents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load community reports")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReports()
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchReports])

  useEffect(() => {
    const handleRefresh = () => {
      fetchReports()
    }
    window.addEventListener("resilientph_refresh_incidents", handleRefresh)
    return () => {
      window.removeEventListener("resilientph_refresh_incidents", handleRefresh)
    }
  }, [fetchReports])

  return {
    incidents,
    loading,
    error,
    refetch: fetchReports
  }
}
