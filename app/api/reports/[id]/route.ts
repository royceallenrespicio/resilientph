import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createApiErrorResponse } from "@/lib/api/errors"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch report to verify ownership
    const { data: report, error: fetchErr } = await supabase
      .from("incident_reports")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchErr || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Fetch profile to verify if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.role === "admin"
    const isOwner = report.user_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this report" }, { status: 403 })
    }

    // Perform deletion
    const { error: deleteErr } = await supabase
      .from("incident_reports")
      .delete()
      .eq("id", id)

    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true, message: "Report withdrawn successfully" })
  } catch (err) {
    return createApiErrorResponse(err, "Delete Report API")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Read request body
    const { status } = await request.json()
    if (!status || !["active", "monitoring", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Fetch report to verify ownership
    const { data: report, error: fetchErr } = await supabase
      .from("incident_reports")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchErr || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Fetch profile to verify if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.role === "admin"
    const isOwner = report.user_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You are not authorized to update this report" }, { status: 403 })
    }

    // Perform update
    const { data: updated, error: updateErr } = await supabase
      .from("incident_reports")
      .update({ status })
      .eq("id", id)
      .select("*, profiles:user_id(display_name, username)")
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json(updated)
  } catch (err) {
    return createApiErrorResponse(err, "Update Report API")
  }
}
