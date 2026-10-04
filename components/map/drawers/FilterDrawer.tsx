"use client"

import React, { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { SlidersHorizontal, Settings } from "lucide-react"



interface FilterDrawerProps {
  showEarthquakes: boolean
  setShowEarthquakes: (s: boolean) => void
  showIncidents: boolean
  setShowIncidents: (s: boolean) => void
  showBoundaries: boolean
  setShowBoundaries: (s: boolean) => void
  minMagnitude: number
  setMinMagnitude: (m: number) => void
  timeRange: number
  setTimeRange: (t: number) => void
  selectedSource: "all" | "phivolcs" | "usgs"
  setSelectedSource: (s: "all" | "phivolcs" | "usgs") => void
}

export function FilterDrawer({
  showEarthquakes,
  setShowEarthquakes,
  showIncidents,
  setShowIncidents,
  showBoundaries,
  setShowBoundaries,
  minMagnitude,
  setMinMagnitude,
  timeRange,
  setTimeRange,
  selectedSource,
  setSelectedSource,
}: FilterDrawerProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const isFiltered = minMagnitude !== 4.0 || timeRange !== 1 || selectedSource !== "all"

  const handleClearFilters = () => {
    setMinMagnitude(4.0)
    setTimeRange(1)
    setSelectedSource("all")
  }

  const triggerButton = (
    <Button
      size="icon"
      className="relative size-10 rounded-full shadow-md bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-muted transition-all duration-200 cursor-pointer flex items-center justify-center animate-in fade-in"
      aria-label="Map Filters and Layers"
    >
      <SlidersHorizontal className="size-4 text-foreground" />
      {isFiltered && (
        <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-background" />
      )}
    </Button>
  )

  const filterContent = (
    <div className="flex flex-col gap-5 pt-4 pb-0">
      {/* Map Layers */}
      <div className="space-y-2.5 pb-4 border-b border-border/10">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-sans">
          Visible Map Layers
        </Label>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <label className="flex items-center gap-3 cursor-pointer text-foreground/95 hover:text-foreground select-none font-medium">
            <Checkbox
              checked={showEarthquakes}
              onCheckedChange={(checked) => setShowEarthquakes(checked as boolean)}
            />
            <span className="font-sans">
              Seismic Logs (Earthquakes)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-foreground/95 hover:text-foreground select-none font-medium">
            <Checkbox
              checked={showIncidents}
              onCheckedChange={(checked) => setShowIncidents(checked as boolean)}
            />
            <span className="font-sans">
              Community Incidents
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-foreground/95 hover:text-foreground select-none font-medium">
            <Checkbox
              checked={showBoundaries}
              onCheckedChange={(checked) => setShowBoundaries(checked as boolean)}
            />
            <span className="font-sans">
              Locality Boundaries (Regions/Provinces)
            </span>
          </label>
        </div>
      </div>

      {/* Source */}
      <div className="space-y-2 pb-4 border-b border-border/10">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-sans">
          Data Feed Source
        </Label>
        <div className="flex items-center gap-2">
          {(["all", "phivolcs", "usgs"] as const).map((src) => (
            <Button
              key={src}
              variant={selectedSource === src ? "default" : "outline"}
              className="flex-1 rounded-xl h-9 text-xs font-sans font-medium cursor-pointer"
              onClick={() => setSelectedSource(src)}
            >
              {src === "all" ? "All" : src.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Min Magnitude */}
      <div className="space-y-2 pb-4 border-b border-border/10">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-sans">
          Minimum Magnitude: M{minMagnitude.toFixed(1)}
        </Label>
        <Slider
          value={[minMagnitude]}
          onValueChange={(vals) => setMinMagnitude(vals[0])}
          min={4.0}
          max={8.0}
          step={0.1}
          className="w-full py-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-sans px-1">
          <div className="flex flex-col items-center">
            <span>Felt</span>
            <span>M4.0</span>
          </div>
          <div className="flex flex-col items-center">
            <span>Damaging</span>
            <span>M5.5-6.0</span>
          </div>
          <div className="flex flex-col items-center">
            <span>Major</span>
            <span>M7.0+</span>
          </div>
        </div>
      </div>

      {/* Time Range */}
      <div className="space-y-2 pb-4 border-b border-border/10">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-sans">
          Timeframe: {timeRange === 1 ? "Today" : `${timeRange} Days`}
        </Label>
        <Slider
          value={[timeRange]}
          onValueChange={(vals) => setTimeRange(vals[0])}
          min={1}
          max={30}
          step={1}
          className="w-full py-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-sans px-1">
          <span>1 Day</span>
          <span>30 Days</span>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>

        <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-lg mx-auto rounded-t-3xl border-t border-border/60 bg-card/98 backdrop-blur-xl">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/25 shrink-0" />
          <div className="mx-auto w-full max-w-lg overflow-y-auto px-5 pb-6 font-sans">
            <DrawerHeader className="flex flex-col gap-1 space-y-0 pb-3 border-b border-border/40 select-none text-left px-0 font-sans">
              <div className="flex items-start justify-between">
                <DrawerTitle className="text-base font-semibold flex items-center gap-2 font-sans">
                  <Settings className="size-4.5 text-foreground" />
                  <span>Map Layers & Filters</span>
                </DrawerTitle>
                {isFiltered && (
                  <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="h-7 px-2 text-[10px] uppercase font-sans font-bold tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg"
                  >
                    Reset All
                  </Button>
                )}
              </div>
              <DrawerDescription className="text-xs text-muted-foreground font-sans">
                Adjust geological log magnitudes, outages, and debris visibility layers
              </DrawerDescription>
            </DrawerHeader>

            {filterContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              {triggerButton}
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            Map Filters & Layers
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-md bg-card border border-border/40 text-foreground font-sans rounded-2xl p-0 overflow-hidden flex flex-col">
        <ScrollArea className="max-h-[85vh] w-full">
          <div className="px-6 py-6">
            <DialogHeader className="flex flex-col gap-1 space-y-0 pb-4 border-b border-border/10 select-none text-left">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <Settings className="size-5 text-primary" />
                  <span>Map Layer & Filters</span>
                </DialogTitle>
                {isFiltered && (
                  <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="h-8 px-2 text-[10px] uppercase font-bold tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer mr-8"
                  >
                    Reset All
                  </Button>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground font-sans">
                Adjust geological log magnitudes, outages, and debris visibility layers.
              </DialogDescription>
            </DialogHeader>

            {filterContent}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
