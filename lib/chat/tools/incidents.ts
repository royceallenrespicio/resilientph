import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import type { IncidentCategory, IncidentSeverity } from "@/lib/supabase/reports"

export const communityIncidentsTool = tool(
  async ({ category, limit = 10 }: { category?: string; limit?: number }) => {
    try {
      const supabase = await createClient()

      let query = supabase
        .from("incident_reports")
        .select("*")
        .order("reported_at", { ascending: false })
        .limit(limit)

      if (category && category !== "all") {
        query = query.eq("category", category)
      }

      const { data, error } = await query

      if (error) throw error

      return JSON.stringify({
        source: "ResilientPH Community Incident Registry",
        category: category || "all",
        results: data || []
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error retrieving community incidents: ${msg}`
    }
  },
  {
    name: "get_community_incidents",
    description: "Get recent community-reported incident logs in the Philippines, including power outages, waste clogs, floods, landslides, fires, road hazards, and gas leaks. Use this when users ask for active community reports.",
    schema: z.object({
      category: z.enum(["power_outage", "waste", "flood", "landslide", "fire", "road_hazard", "gas_leak", "all"]).optional().describe("Filter reports by category"),
      limit: z.number().optional().describe("Number of recent records to retrieve")
    })
  }
)

export const createCommunityReportTool = tool(
  async ({ category, subType, severity, latitude, longitude, description }: {
    category: string
    subType: string
    severity: string
    latitude: number
    longitude: number
    description: string
  }) => {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("incident_reports")
        .insert([
          {
            category: category as IncidentCategory,
            sub_type: subType,
            severity: severity as IncidentSeverity,
            latitude,
            longitude,
            description: description || null,
            status: "active"
          }
        ])
        .select()
        .single()

      if (error) throw error
      return `Successfully reported incident: ${category} (${subType}) at coordinates (${latitude}, ${longitude}). Report ID: ${data.id}`
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error creating community report: ${msg}`
    }
  },
  {
    name: "create_community_report",
    description: "Submit a new incident report to the community registry on behalf of the user.",
    schema: z.object({
      category: z.enum(["power_outage", "waste", "flood", "landslide", "fire", "road_hazard", "gas_leak"]).describe("The category of the incident"),
      subType: z.string().describe("Specific type (e.g., total, flash_flood)"),
      severity: z.enum(["low", "moderate", "high", "critical"]).describe("Estimated severity level"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
      description: z.string().describe("Description of the incident")
    })
  }
)
