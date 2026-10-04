import { SupabaseClient } from '@supabase/supabase-js'

export type IncidentCategory = 'power_outage' | 'waste' | 'flood' | 'landslide' | 'fire' | 'road_hazard' | 'gas_leak'
export type IncidentStatus = 'active' | 'monitoring' | 'resolved'
export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'critical'

export interface IncidentReport {
  id: string
  user_id?: string | null
  category: IncidentCategory
  sub_type: string
  description?: string | null
  image_url?: string | null
  latitude: number
  longitude: number
  status: IncidentStatus
  severity: IncidentSeverity
  reported_at: string
  updated_at: string
  profiles?: {
    display_name: string | null
    username: string
  } | null
}

export async function fetchIncidentReports(
  supabase: SupabaseClient, 
  category?: IncidentCategory
): Promise<IncidentReport[]> {
  let query = supabase
    .from('incident_reports')
    .select('*, profiles:user_id(display_name, username)')
    .order('reported_at', { ascending: false })
  
  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as IncidentReport[]
}

export async function createIncidentReport(
  supabase: SupabaseClient,
  report: Omit<IncidentReport, 'id' | 'reported_at' | 'updated_at'>
): Promise<IncidentReport> {
  const { data, error } = await supabase
    .from('incident_reports')
    .insert([report])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateIncidentStatus(
  supabase: SupabaseClient,
  id: string,
  status: IncidentStatus
): Promise<IncidentReport> {
  const { data, error } = await supabase
    .from('incident_reports')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteIncidentReport(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('incident_reports')
    .delete()
    .eq('id', id)

  if (error) throw error
}
