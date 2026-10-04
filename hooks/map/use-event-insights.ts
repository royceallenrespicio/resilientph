"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { EarthquakeEvent, USGS_CONFIG } from "@/lib/map/usgs"

export interface EventDetailItem {
  label: string
  value: string
}

export interface EventDetailSection {
  icon: "globe" | "chart" | "warning"
  title: string
  items: EventDetailItem[]
}

interface AiReviewState {
  isOpen: boolean
  loading: boolean
  error: string | null
  sections: EventDetailSection[] | null
  analyzedEventId: string | null
}

export function useAiReview() {
  const [state, setState] = useState<AiReviewState>({
    isOpen: false,
    loading: false,
    error: null,
    sections: null,
    analyzedEventId: null
  })

  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  const closePanel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, analyzedEventId: null }))
  }, [])

  const resetForNewEvent = useCallback((eventId: string) => {
    setState((prev) => {
      if (prev.analyzedEventId !== eventId) {
        return { ...prev, isOpen: false, sections: null, error: null }
      }
      return prev
    })
  }, [])

  const fetchInsights = useCallback(async (quake: EarthquakeEvent) => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller

    setState({
      isOpen: true,
      loading: true,
      error: null,
      sections: null,
      analyzedEventId: quake.id
    })

    try {
      if (quake.source === 'phivolcs') {
        const sections: EventDetailSection[] = [
          {
            icon: "globe",
            title: "Event Metadata",
            items: [
              { label: "Reporting Agency", value: "PHIVOLCS (DOST)" },
              { label: "Local Event ID", value: quake.id },
              { label: "Date & Time (PST)", value: new Date(quake.time).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) },
              { label: "Record Source", value: "National Seismic Network" }
            ]
          },
          {
            icon: "chart",
            title: "Seismological Parameters",
            items: [
              { label: "Magnitude Type", value: "Local Magnitude (ML)" },
              { label: "Epicenter Location", value: quake.place },
              { label: "Depth of Focus", value: `${quake.depth.toFixed(0)} km` },
              { label: "Geographic Coordinates", value: `${quake.latitude.toFixed(4)}° N, ${quake.longitude.toFixed(4)}° E` }
            ]
          },
          {
            icon: "warning",
            title: "Impact & Warnings",
            items: [
              { label: "Tsunami Threat", value: quake.magnitude >= 6.5 ? "Review PHIVOLCS Tsunami Advisories" : "No immediate threat expected" },
              { label: "Expected Damage", value: quake.magnitude >= 5.0 ? "Potential localized structural damage" : "Generally no structural damage expected" },
              { label: "Community Intensity", value: quake.magnitude >= 4.0 ? "Usually felt strongly near epicenter" : "Felt by some individuals at rest" },
              { label: "Official Report", value: quake.url ? "View PHIVOLCS Web Bulletin" : "N/A" }
            ]
          }
        ]
        if (!controller.signal.aborted) {
          setState((prev) => ({ ...prev, loading: false, sections }))
        }
        return
      }

      const response = await fetch(`${USGS_CONFIG.EARTHQUAKE_API_BASE_URL}?eventid=${quake.id}&format=geojson`, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error("Failed to retrieve USGS event details. Server returned error.")
      }

      const data = await response.json()
      const props = data.properties || {}

      const feltText = props.felt != null ? `${props.felt} reports` : "None reported"
      const cdiText = props.cdi != null ? `${props.cdi.toFixed(1)}` : "N/A"
      const mmiText = props.mmi != null ? `${props.mmi.toFixed(1)}` : "N/A"
      const alertText = props.alert != null ? props.alert.toUpperCase() : "GREEN"
      const tsunamiText = props.tsunami === 1 ? "WARNING / ADVISORY" : "No threat detected"

      const sections: EventDetailSection[] = [
        {
          icon: "globe",
          title: "Event Metadata",
          items: [
            { label: "USGS Event ID", value: quake.id },
            { label: "Status", value: props.status ? props.status.toUpperCase() : "N/A" },
            { label: "Significance", value: props.sig != null ? `${props.sig} / 1000` : "N/A" },
            { label: "Review Level", value: props.status === "reviewed" ? "Reviewed by Seismologist" : "Automated Entry" }
          ]
        },
        {
          icon: "chart",
          title: "Seismological Parameters",
          items: [
            { label: "Magnitude Type", value: props.magType ? props.magType.toUpperCase() : "N/A" },
            { label: "Recording Stations", value: props.nst != null ? `${props.nst}` : "N/A" },
            { label: "Azimuthal Gap", value: props.gap != null ? `${props.gap}°` : "N/A" },
            { label: "RMS Residual", value: props.rms != null ? `${props.rms}s` : "N/A" },
            { label: "Min Distance", value: props.dmin != null ? `${props.dmin}°` : "N/A" }
          ]
        },
        {
          icon: "warning",
          title: "Impact & Warnings",
          items: [
            { label: "Tsunami Threat", value: tsunamiText },
            { label: "Felt Reports", value: feltText },
            { label: "Community Intensity", value: `CDI ${cdiText}` },
            { label: "Est. Max Intensity", value: `MMI ${mmiText}` },
            { label: "PAGER Alert Level", value: alertText }
          ]
        }
      ]

      if (!controller.signal.aborted) {
        setState((prev) => ({ ...prev, loading: false, sections }))
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("USGS fetch error:", err)
      const msg = err instanceof Error ? err.message : String(err)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: msg || "Failed to retrieve USGS details. Please check connections."
      }))
    }
  }, [])

  return {
    aiPanelOpen: state.isOpen,
    aiLoading: state.loading,
    aiError: state.error,
    aiSections: state.sections,
    analyzedEventId: state.analyzedEventId,
    closePanel,
    resetForNewEvent,
    fetchInsights
  }
}
