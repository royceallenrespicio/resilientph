"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-breakpoints"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Flashlight, Trash2, MapPin, Loader2, AlertCircle, AlertTriangle, Waves, MountainSnow, Flame, TriangleAlert, Wind } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { IncidentCategory } from "@/lib/supabase/reports"

interface ReportDrawerProps {
  mapCenter: { lat: number; lng: number }
  onReportSubmitted?: () => void
  // Controlled open/close states
  open: boolean
  onOpenChange: (open: boolean) => void
  // Location selection props
  pickedCoords: { latitude: number; longitude: number } | null
  onStartPickingLocation: () => void
  clearPickedCoords: () => void
  isPickingLocation: boolean
}

export function ReportDrawer({
  mapCenter,
  onReportSubmitted,
  open,
  onOpenChange,
  pickedCoords,
  onStartPickingLocation,
  clearPickedCoords,
  isPickingLocation,
}: ReportDrawerProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const onChange = (e: MediaQueryListEvent) => {
      setIsTabletOrMobile(e.matches)
    }
    mql.addEventListener("change", onChange)

    const timer = setTimeout(() => {
      setIsTabletOrMobile(mql.matches)
    }, 0)

    return () => {
      clearTimeout(timer)
      mql.removeEventListener("change", onChange)
    }
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      clearPickedCoords()
    }
  }

  const [category, setCategory] = useState<IncidentCategory>("power_outage")
  const [subType, setSubType] = useState<string>("total")
  const [description, setDescription] = useState("")
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [latitude, setLatitude] = useState(mapCenter.lat)
  const [longitude, setLongitude] = useState(mapCenter.lng)
  const [imageUrl, setImageUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to upload files.")
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error } = await supabase.storage
        .from('report-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('report-images')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      toast.success("Photo uploaded successfully!")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl("")
    toast.info("Attached photo removed.")
  }

  // Sync incoming picked coordinates from the map selector
  const [prevPickedCoords, setPrevPickedCoords] = useState<{ latitude: number; longitude: number } | null>(pickedCoords)
  if (pickedCoords !== prevPickedCoords) {
    setPrevPickedCoords(pickedCoords)
    if (pickedCoords) {
      setLatitude(Number(pickedCoords.latitude.toFixed(6)))
      setLongitude(Number(pickedCoords.longitude.toFixed(6)))
    }
  }

  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Fetch authenticated user
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error("Error fetching user:", err)
      } finally {
        setLoadingUser(false)
      }
    }
    if (open) {
      checkAuth()
    }
  }, [open, supabase])

  // Request browser GPS coords
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(6)))
        setLongitude(Number(position.coords.longitude.toFixed(6)))
        toast.success("Acquired GPS coordinates.")
      },
      (err) => {
        toast.error(`GPS Error: ${err.message}`)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("You must be logged in to submit a report.")
      return
    }
    setSubmitting(true)

    try {
      // Read anonymous setting safely
      let isAnonymous = false
      try {
        isAnonymous = localStorage.getItem("resilientph_anonymous_reporting") === "true"
      } catch {
        isAnonymous = false
      }


       // 1. Submit to new API route (handles moderation and DB insert)
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subType,
          latitude,
          longitude,
          description: description || "",
          imageUrl: imageUrl || null,
          isAnonymous,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to submit report. Please try again.")
      }

      toast.success("Incident reported successfully!")

      // Request notification permission if not already granted so they can receive updates
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission()
      }

      // 2. Local browser notification for immediate feedback (if permitted)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Report Submitted", {
          body: `Your ${category.replace('_', ' ')} report has been submitted to the community.`,
          icon: "/favicon.ico"
        })
      }

      // Reset form
      setDescription("")
      setImageUrl("")
      handleOpenChange(false)
      if (onReportSubmitted) {
        onReportSubmitted()
      }
    } catch (err) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : "Failed to submit report"
      if (errMsg.includes("Safety Moderation Warning:")) {
        setModerationError(errMsg.replace("Safety Moderation Warning:", "").trim())
      } else {
        toast.error(errMsg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isPickingLocation) {
    return null
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-6">
      {!loadingUser && !user && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
            <span>Sign in required to submit community reports.</span>
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-amber-500/30 text-amber-300 hover:bg-amber-500/20 rounded-lg shrink-0 ml-2 cursor-pointer">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      )}

      {/* Category Select */}
      <div className="space-y-1.5">
        <Label htmlFor="category-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Incident Category
        </Label>
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 pb-1">
            {[
              { id: "power_outage", label: "Power Outage", icon: Flashlight },
              { id: "waste", label: "Waste / Drain", icon: Trash2 },
              { id: "flood", label: "Flood", icon: Waves },
              { id: "landslide", label: "Landslide", icon: MountainSnow },
              { id: "fire", label: "Fire", icon: Flame },
              { id: "road_hazard", label: "Road Hazard", icon: TriangleAlert },
              { id: "gas_leak", label: "Gas Leak", icon: Wind }
            ].map((cat) => {
              const Icon = cat.icon
              return (
                <CarouselItem key={cat.id} className="pl-2 basis-[auto]">
                  <Button
                    type="button"
                    variant={category === cat.id ? "default" : "outline"}
                    className={cn(
                      "flex-col shrink-0 h-auto py-3 px-4 rounded-xl cursor-pointer font-sans font-medium text-xs transition-all",
                      category === cat.id ? "border-primary/20 shadow-sm" : "opacity-80 hover:opacity-100"
                    )}
                    onClick={() => {
                      setCategory(cat.id as IncidentCategory)
                      // Reset subtype when category changes
                      if (cat.id === "power_outage") setSubType("total")
                      else if (cat.id === "waste") setSubType("clogged_drain")
                      else if (cat.id === "flood") setSubType("street_flooding")
                      else if (cat.id === "landslide") setSubType("road_blocked")
                      else if (cat.id === "fire") setSubType("structure_fire")
                      else if (cat.id === "road_hazard") setSubType("accident")
                      else if (cat.id === "gas_leak") setSubType("lpg_leak")
                    }}
                  >
                    <Icon className={cn("size-5 mb-1.5", category === cat.id ? "text-primary-foreground" : "text-muted-foreground")} />
                    {cat.label}
                  </Button>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Subtype Choice */}
      <div className="space-y-1.5">
        <Label htmlFor="subtype-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Specific Type
        </Label>
        <Select value={subType} onValueChange={setSubType}>
          <SelectTrigger id="subtype-type" className="w-full rounded-xl border border-border/40 bg-muted/20 text-xs">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {category === "power_outage" && (
              <>
                <SelectItem value="total" className="text-xs">Total Blackout (No Power)</SelectItem>
                <SelectItem value="voltage_fluctuation" className="text-xs">Voltage Fluctuation / Brownout</SelectItem>
                <SelectItem value="fallen_lines" className="text-xs">Fallen Power Lines / Damaged Pole</SelectItem>
              </>
            )}
            {category === "waste" && (
              <>
                <SelectItem value="clogged_drain" className="text-xs">Clogged Storm Drain / Waterway</SelectItem>
                <SelectItem value="debris" className="text-xs">Fallen Tree / Structural Debris</SelectItem>
                <SelectItem value="trash_pile" className="text-xs">Uncollected Trash / Illegal Dump</SelectItem>
              </>
            )}
            {category === "flood" && (
              <>
                <SelectItem value="street_flooding" className="text-xs">Street Flooding (Impassable)</SelectItem>
                <SelectItem value="flash_flood" className="text-xs">Flash Flood</SelectItem>
                <SelectItem value="river_overflow" className="text-xs">River Overflow</SelectItem>
              </>
            )}
            {category === "landslide" && (
              <>
                <SelectItem value="road_blocked" className="text-xs">Road Blocked by Debris</SelectItem>
                <SelectItem value="active_slide" className="text-xs">Active Landslide</SelectItem>
                <SelectItem value="risk_area" className="text-xs">High Risk Area (Soil Erosion)</SelectItem>
              </>
            )}
            {category === "fire" && (
              <>
                <SelectItem value="structure_fire" className="text-xs">Structure Fire</SelectItem>
                <SelectItem value="brush_fire" className="text-xs">Brush / Forest Fire</SelectItem>
                <SelectItem value="electrical_fire" className="text-xs">Electrical / Transformer Fire</SelectItem>
              </>
            )}
            {category === "road_hazard" && (
              <>
                <SelectItem value="accident" className="text-xs">Traffic Accident</SelectItem>
                <SelectItem value="road_closed" className="text-xs">Road Closed</SelectItem>
                <SelectItem value="fallen_tree" className="text-xs">Fallen Tree / Debris on Road</SelectItem>
              </>
            )}
            {category === "gas_leak" && (
              <>
                <SelectItem value="lpg_leak" className="text-xs">Residential LPG Leak</SelectItem>
                <SelectItem value="pipeline_leak" className="text-xs">Industrial/Pipeline Leak</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>



      {/* Geolocation Section */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Incident Location</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="link"
              onClick={onStartPickingLocation}
              className="h-auto p-0 text-[10px] text-primary hover:underline font-sans font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <MapPin className="size-3" />
              Pick on Map
            </Button>

            <span className="text-border/40">•</span>
            <Button
              type="button"
              variant="link"
              onClick={handleUseGPS}
              className="h-auto p-0 text-[10px] text-primary hover:underline font-sans cursor-pointer"
            >
              Use GPS
            </Button>
          </div>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="latitude-input" className="text-[10px] text-muted-foreground uppercase font-medium">Latitude</Label>
            <Input
              id="latitude-input"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              className="h-9 text-xs rounded-xl bg-muted/20 border-border/40"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitude-input" className="text-[10px] text-muted-foreground uppercase font-medium">Longitude</Label>
            <Input
              id="longitude-input"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              className="h-9 text-xs rounded-xl bg-muted/20 border-border/40"
              required
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="report-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description / Notes
        </Label>
        <Textarea
          id="report-desc"
          placeholder={
            category === "power_outage"
              ? "Describe the scope (e.g. whole block is dark, sparks from transformer...)"
              : "Describe the hazard or blockage (e.g. thick pile of plastic bags in drain inlet, fallen branch blocking lane...)"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] text-xs rounded-xl bg-muted/20 border-border/40 resize-none"
        />
      </div>

      {/* Image Attachment (Now available for all categories) */}
      <div className="space-y-1.5 font-sans">
        <Label htmlFor="report-image-upload" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block select-none">
          Photo Attachment (Optional)
        </Label>
          
          {imageUrl ? (
            <div className="relative group overflow-hidden rounded-xl border border-border/40 max-h-[160px] bg-black/20">
              <Image
                src={imageUrl}
                alt="Report attachment preview"
                width={600}
                height={160}
                unoptimized
                className="w-full h-[160px] object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 size-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white hover:text-destructive transition-colors shadow-md cursor-pointer hover:bg-transparent"
                aria-label="Remove image"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input
                id="report-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage}
                className="hidden"
              />
              <Label
                htmlFor="report-image-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-24 px-4 border border-dashed border-border/60 hover:border-primary/50 bg-muted/20 hover:bg-muted/30 rounded-xl transition-all cursor-pointer select-none",
                  uploadingImage && "pointer-events-none opacity-60"
                )}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Uploading photo...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <AlertCircle className="size-5 text-muted-foreground/60" />
                    <span className="text-xs font-medium text-muted-foreground">Click to upload an image</span>
                    <span className="text-[10px] text-muted-foreground/40 font-sans">PNG, JPG, or WEBP</span>
                  </div>
                )}
              </Label>
            </div>
          )}
        </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl cursor-pointer py-6 font-semibold font-sans tracking-wide text-xs bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2 mt-2"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin shrink-0" />
            Submitting Report...
          </>
        ) : (
          <>
            <MapPin className="size-4 shrink-0" />
            Submit Incident Report
          </>
        )}
      </Button>
    </form>
  )

  let bodyContent = formContent

  if (loadingUser) {
    bodyContent = (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-foreground font-sans">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-medium">Checking authentication...</span>
      </div>
    )
  } else if (!user) {
    bodyContent = (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-8 px-4 font-sans select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-1 select-none">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Authentication Required</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            You must be logged in to submit community reports. This keeps our disaster data reliable and spam-free.
          </p>
        </div>
        <Button
          type="button"
          className="w-full max-w-[200px] mt-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold py-5 cursor-pointer flex items-center justify-center gap-2"
          onClick={() => {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
          }}
        >
          Sign In / Sign Up
        </Button>
      </div>
    )
  }

  const triggerButton = (
    <Button
      id="report-incident-fab"
      className={`absolute top-4 z-30 size-10 p-0 rounded-full shadow-md bg-card/90 backdrop-blur-md border border-border text-destructive hover:bg-muted transition-all duration-200 cursor-pointer flex items-center justify-center animate-in fade-in ${isTabletOrMobile ? "left-28" : "left-16"}`}
      aria-label="Report active incident"
      onClick={() => handleOpenChange(true)}
    >
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
    </Button>
  )

  const modalErrorPopup = (
    <Dialog open={moderationError !== null} onOpenChange={(open) => { if (!open) setModerationError(null); }}>
      <DialogContent className="sm:max-w-sm bg-card border border-destructive/20 text-foreground font-sans rounded-2xl p-6 select-none z-50">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="size-6 text-destructive animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Report Flagged by AI Moderation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {moderationError}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2 rounded-xl border-border/40 hover:bg-muted text-xs font-semibold py-4 cursor-pointer"
            onClick={() => setModerationError(null)}
          >
            Understand & Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
    
          <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-lg mx-auto rounded-t-3xl border-t border-border/60 bg-card/98 backdrop-blur-xl">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/25 shrink-0" />
            <div className="mx-auto w-full max-w-lg overflow-y-auto px-5 pb-6">
              <DrawerHeader className="pb-3 border-b border-border/40 select-none text-left px-0">
                <DrawerTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4.5 text-primary" />
                  <span>Community Report Center</span>
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground font-sans mt-0.5">
                  File a real-time outage or structural hazard report. Keep our local barangays safe and resilient.
                </DrawerDescription>
              </DrawerHeader>

              {bodyContent}
            </div>
          </DrawerContent>
        </Drawer>
        {modalErrorPopup}
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                {triggerButton}
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              Report Incident
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className="sm:max-w-md bg-card border border-border/40 text-foreground font-sans rounded-2xl p-0 overflow-hidden flex flex-col">
          <ScrollArea className="max-h-[85vh] w-full">
            <div className="px-6 py-6">
              <DialogHeader className="pb-4 border-b border-border/40 select-none text-left">
                <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <AlertCircle className="size-5 text-primary" />
                  <span>Community Report Center</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-sans">
                  File a real-time outage or structural hazard report. Keep our local barangays safe and resilient.
                </DialogDescription>
              </DialogHeader>

              {bodyContent}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {modalErrorPopup}
    </>
  )
}
