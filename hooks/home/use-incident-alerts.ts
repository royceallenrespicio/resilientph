import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { IncidentReport } from "@/lib/supabase/reports"
import { isIncidentWithinRadius, formatIncidentNotification } from "@/lib/map/incident-proximity"
import { toast } from "sonner"

// Read the same location key as the weather widget
const LOCATION_STORAGE_KEY = "resilientph_preferred_weather_location_v1"

export function useIncidentAlerts() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)

  // Track location state
  const [userLat] = useState<number | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.latitude === "number") {
          return parsed.latitude
        }
      }
    } catch {
      // ignore
    }
    return null
  })
  const [userLon] = useState<number | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.longitude === "number") {
          return parsed.longitude
        }
      }
    } catch {
      // ignore
    }
    return null
  })

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    // Load initial active incidents
    const fetchIncidents = async () => {
      try {
        const { data, error } = await supabase
          .from("incident_reports")
          .select("*")
          .in("status", ["active", "monitoring"])
          .order("reported_at", { ascending: false })
          .limit(20)

        if (error) throw error

        if (isMounted) {
          // Filter by radius if location is available
          let activeIncidents = (data || []) as IncidentReport[]
          if (userLat != null && userLon != null) {
            activeIncidents = activeIncidents.filter((inc) =>
              isIncidentWithinRadius(inc, userLat, userLon)
            )
          }
          setIncidents(activeIncidents)
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const errObj = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : {}
        const errStr = `${errObj.message || ""} ${errObj.details || ""} ${String(err || "")}`
        const isNetworkErr = errStr.includes("Failed to fetch") || errStr.includes("AbortError") || errObj.name === "AbortError"
        if (isNetworkErr) {
          console.warn("Incident reports feed currently offline or unreachable.")
        } else {
          console.warn("Failed to fetch initial incidents:", err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchIncidents()

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public:incident_reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incident_reports" },
        (payload) => {
          const newIncident = payload.new as IncidentReport
          
          if (!isMounted) return

          // If we have location, check if it's within radius
          if (userLat != null && userLon != null) {
            if (isIncidentWithinRadius(newIncident, userLat, userLon)) {
              setIncidents((prev) => [newIncident, ...prev].slice(0, 20))
              
              // Trigger Notification
              const { title, body } = formatIncidentNotification(newIncident)
              toast.warning(title, { description: body, duration: 8000 })

              // Determine if push notifications are enabled by checking localStorage preference
              const notificationsEnabled = localStorage.getItem("resilientph_incident_notifications") !== "false"

              if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
                new Notification(title, { body, icon: "/favicon.ico" })
              }
            }
          } else {
            // No location known, just add to list
            setIncidents((prev) => [newIncident, ...prev].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [userLat, userLon])

  return { incidents, loading }
}
