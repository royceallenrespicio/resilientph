"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-breakpoints"
import { Intents } from "@/lib/chat/prompts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IncidentReport } from "@/lib/supabase/reports"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Clock, MapPin, MessageSquare, Image as ImageIcon, User, Trash2, CheckCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn, formatRelativeTime } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { User as AuthUser } from "@supabase/supabase-js"

interface IncidentDetailsPanelProps {
  isOpen: boolean
  onClose: () => void
  incident: IncidentReport | null
  onOpenChat: (prompt: string) => void
}

export function IncidentDetailsPanel({
  isOpen,
  onClose,
  incident,
  onOpenChat,
}: IncidentDetailsPanelProps) {
  const isMobile = useIsMobile()

  // Prevent layout flashes during close animations (using render-time prop sync)
  const [prevIncident, setPrevIncident] = useState(incident)
  const [lastPropIncident, setLastPropIncident] = useState(incident)
  if (incident !== lastPropIncident) {
    setLastPropIncident(incident)
    if (incident) {
      setPrevIncident(incident)
    }
  }

  const activeIncident = incident || prevIncident
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchCurrentUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setCurrentUser(authUser)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .single()
        if (profile?.role === "admin") {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } else {
        setCurrentUser(null)
        setIsAdmin(false)
      }
    }
    if (isOpen) {
      fetchCurrentUser()
    }
  }, [supabase, isOpen])

  if (!activeIncident) return null

  const data = activeIncident

  const handleResolve = async () => {
    if (!activeIncident) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${activeIncident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to resolve incident")
      }

      toast.success("Incident marked as resolved!")
      onClose()
      window.dispatchEvent(new CustomEvent("resilientph_refresh_incidents"))
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!activeIncident) return
    const confirmDelete = window.confirm("Are you sure you want to withdraw this incident report? This will remove it permanently.")
    if (!confirmDelete) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${activeIncident.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to withdraw report")
      }

      toast.success("Incident report withdrawn successfully!")
      onClose()
      window.dispatchEvent(new CustomEvent("resilientph_refresh_incidents"))
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setActionLoading(false)
    }
  }

  // Title / Severity resolution
  let title = "Incident Report"
  const categoryLabel = data.category.replace("_", " ").toUpperCase()
  let iconColor = "text-warning"

  switch (data.category) {
    case "power_outage":
      iconColor = "text-warning"
      break
    case "waste":
      iconColor = "text-success"
      break
    case "flood":
      iconColor = "text-info"
      break
    case "landslide":
      iconColor = "text-alert"
      break
    case "fire":
      iconColor = "text-destructive"
      break
    case "road_hazard":
      iconColor = "text-warning"
      break
    case "gas_leak":
      iconColor = "text-alert"
      break
    default:
      iconColor = "text-primary"
  }

  title = data.sub_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())

  // Handle discuss click
  const handleDiscuss = () => {
    const timeStr = data.reported_at ? new Date(data.reported_at).toLocaleString() : "Unknown time"
    const prompt = Intents.getIncidentAnalysis(title, data.latitude.toFixed(6), data.longitude.toFixed(6), timeStr, data.description || "None provided.")
    onOpenChat(prompt)
  }

  const detailsContent = (
    <div className="space-y-4 py-4 font-sans text-sm">
      {/* Meta Grid - 2 Column layout on all screens for compactness */}
      <div className="grid grid-cols-2 gap-3 bg-muted/20 border border-border/40 p-3.5 rounded-xl font-sans">
        <div className="space-y-1">
          <span className="text-muted-foreground text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Clock className="size-3.5 shrink-0" />
            Reported
          </span>
          <span className="font-sans text-xs text-foreground font-semibold block">
            {data.reported_at ? formatRelativeTime(new Date(data.reported_at).getTime()) : "Just now"}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
            <MapPin className="size-3.5 shrink-0" />
            Coordinates
          </span>
          <span className="font-sans text-xs text-foreground font-semibold block truncate" title={`${data.latitude}, ${data.longitude}`}>
            {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Submitter Info */}
      <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground select-none font-sans">
        <User className="size-3.5 shrink-0 text-muted-foreground/60" />
        <span>
          {data.profiles ? (
            <>
              Filed by <span className="font-semibold text-foreground">{data.profiles.display_name || data.profiles.username}</span>
              {currentUser && currentUser.id === data.user_id && " (You)"}
            </>
          ) : (
            "Filed anonymously"
          )}
        </span>
      </div>

      {/* Description Block */}
      <div className="space-y-1.5 font-sans">
        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground block select-none">
          Incident Details / Notes
        </span>
        <div className="bg-muted/20 border-l-2 border-primary/40 rounded-r-xl p-3 text-xs leading-relaxed text-foreground/90 font-sans">
          {data.description || "No description provided by the submitter."}
        </div>
      </div>

      {/* Optional Photo Attachment */}
      {data.image_url && (
        <div className="space-y-1.5 font-sans">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
            <ImageIcon className="size-3.5" />
            Photo Attachment
          </span>
          <a
            href={data.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group relative overflow-hidden rounded-xl border border-border/10 max-h-[220px] bg-black/20 cursor-pointer"
          >
            <Image
              src={data.image_url}
              alt={title}
              width={600}
              height={220}
              unoptimized
              className="w-full h-[220px] object-cover transition-transform duration-300 group-hover:scale-102"
              onError={(e) => {
                // Handle broken links gracefully
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </a>
        </div>
      )}

      <Separator className="my-2" />

      {/* Action Button */}
      <Button
        onClick={handleDiscuss}
        className="w-full rounded-xl cursor-pointer py-5 font-semibold font-sans tracking-wide text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <MessageSquare className="size-4 shrink-0" />
        <span>Discuss Incident with AI Agent</span>
      </Button>

      {/* Owner/Admin Management Actions */}
      {((currentUser && data.user_id && currentUser.id === data.user_id) || isAdmin) && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {data.status !== "resolved" && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleResolve}
              className="rounded-xl border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 font-semibold text-xs py-5 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle className="size-3.5" />
              )}
              Resolve Incident
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={actionLoading}
            onClick={handleWithdraw}
            className={cn(
              "rounded-xl border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive-400 font-semibold text-xs py-5 cursor-pointer flex items-center justify-center gap-1.5",
              data.status === "resolved" ? "col-span-2" : ""
            )}
          >
            {actionLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Withdraw Report
          </Button>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-md mx-auto">
          <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-6">
            <DrawerHeader className="pb-3 border-b border-border/40 select-none text-left px-0 flex flex-col items-start gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/40 font-semibold uppercase tracking-wider font-sans">
                  {categoryLabel}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-lg border font-sans font-semibold uppercase tracking-wider",
                    data.status === "active" || data.status === "monitoring"
                      ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
                      : "bg-success/10 text-success border-success/20"
                  )}
                >
                  {data.status}
                </Badge>
              </div>
              <DrawerTitle className="text-lg font-bold font-heading flex items-start gap-2 text-left justify-start">
                <AlertCircle className={cn("size-5.5 shrink-0 mt-0.5", iconColor)} />
                <span className="leading-snug text-left">{title}</span>
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground font-sans text-left">
                Real-time hazard validation filed by community members.
              </DrawerDescription>
            </DrawerHeader>

            {detailsContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md bg-card border border-border/40 text-foreground font-sans rounded-2xl p-0 overflow-hidden flex flex-col">
        <ScrollArea className="max-h-[85vh] w-full">
          <div className="px-6 py-6">
            <DialogHeader className="pb-3 border-b border-border/40 select-none text-left flex flex-col items-start gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/40 font-semibold uppercase tracking-wider font-sans">
                  {categoryLabel}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-lg border font-sans font-semibold uppercase tracking-wider",
                    data.status === "active" || data.status === "monitoring"
                      ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
                      : "bg-success/10 text-success border-success/20"
                  )}
                >
                  {data.status}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold font-heading flex items-start gap-2 text-left justify-start">
                <AlertCircle className={cn("size-5.5 shrink-0 mt-0.5", iconColor)} />
                <span className="leading-snug text-left">{title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-sans text-left">
                Real-time hazard validation filed by community members.
              </DialogDescription>
            </DialogHeader>

            {detailsContent}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
