"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Activity, Loader2, AlertCircle, ExternalLink, HelpCircle, Globe, BarChart3, ShieldAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { EventDetailSection } from "@/hooks/map/use-event-insights"
import { useIsMobile } from "@/hooks/use-breakpoints"
import { AnimatePresence, motion } from "motion/react"

interface AiReviewPanelProps {
  isOpen: boolean
  loading: boolean
  error: string | null
  sections: EventDetailSection[] | null
  earthquake: EarthquakeEvent | null
  onClose: () => void
  onRetry: (quake: EarthquakeEvent) => void
  onOpenChat: (quake: EarthquakeEvent) => void
}

const sectionIcons = {
  globe: Globe,
  chart: BarChart3,
  warning: ShieldAlert,
} as const

const getMagSeverity = (mag: number) => {
  if (mag >= 6.0) return { label: "Severe", color: "bg-destructive/15 text-destructive border-destructive/25" }
  if (mag >= 5.0) return { label: "Strong", color: "bg-alert/15 text-alert border-alert/25" }
  if (mag >= 4.0) return { label: "Moderate", color: "bg-warning/15 text-warning border-warning/25" }
  return { label: "Minor", color: "bg-primary/10 text-primary border-primary/20" }
}

export function AiReviewPanel({
  isOpen,
  loading,
  error,
  sections,
  earthquake,
  onClose,
  onRetry,
  onOpenChat
}: AiReviewPanelProps) {
  // Keep local copies of the active state values to prevent flashing EmptyState or layout shifts during dialog exit animations
  const [prevProps, setPrevProps] = useState({ isOpen, earthquake, sections, loading, error })
  const [renderedEarthquake, setRenderedEarthquake] = useState<EarthquakeEvent | null>(earthquake)
  const [renderedSections, setRenderedSections] = useState<EventDetailSection[] | null>(sections)
  const [renderedLoading, setRenderedLoading] = useState<boolean>(loading)
  const [renderedError, setRenderedError] = useState<string | null>(error)

  const isMobile = useIsMobile()

  if (
    isOpen !== prevProps.isOpen ||
    earthquake !== prevProps.earthquake ||
    sections !== prevProps.sections ||
    loading !== prevProps.loading ||
    error !== prevProps.error
  ) {
    setPrevProps({ isOpen, earthquake, sections, loading, error })
    if (isOpen) {
      setRenderedEarthquake(earthquake)
      setRenderedSections(sections)
      setRenderedLoading(loading)
      setRenderedError(error)
    }
  }

  // Panel layout contents
  const panelInnerContent = (
    <div className="px-0 md:px-5 pb-5 pt-4 space-y-4 max-w-7xl mx-auto w-full">
      {renderedLoading ? (
        <LoadingSkeleton />
      ) : renderedError ? (
        <ErrorState
          error={renderedError}
          onRetry={() => renderedEarthquake && onRetry(renderedEarthquake)}
        />
      ) : renderedSections ? (
        <DetailsContent
          sections={renderedSections}
          earthquake={renderedEarthquake}
          onOpenChat={onOpenChat}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  )

  // 1. Mobile Layout: Drawer Modal
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-md mx-auto">
          <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-6">
            <DrawerHeader className="pb-4 border-b border-border/40 select-none text-left px-0 flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <Activity className="size-4 text-info animate-pulse shrink-0" aria-hidden="true" />
                <DrawerTitle className="text-base font-semibold tracking-wider font-sans text-foreground uppercase">
                  {renderedEarthquake?.source === 'phivolcs' ? "PHIVOLCS Event Details" : "USGS Event Details"}
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-sm text-muted-foreground font-sans pl-[22px]">
                Official Seismological Records
              </DrawerDescription>
            </DrawerHeader>
            <div className="w-full">
              {panelInnerContent}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // 2. Desktop and Tablet Layout: Floating absolute card without backdrop
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-0 right-0 z-40 w-full max-h-[340px] shadow-[0_-8px_30px_rgb(0,0,0,0.2)] border-t border-border/40 bg-card/98 backdrop-blur-xl overflow-hidden flex flex-col font-sans"
        >
          {/* Panel Header */}
          <div className="px-5 py-3 border-b border-border/40 shrink-0 bg-card/80">
            <div className="flex flex-row items-center gap-3 max-w-7xl mx-auto w-full">
              <Activity className="size-4 text-info animate-pulse shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <h2 className="text-sm font-semibold tracking-wider font-sans text-foreground uppercase truncate">
                  {renderedEarthquake?.source === 'phivolcs' ? "PHIVOLCS Event Details" : "USGS Event Details"}
                </h2>
                <p className="text-xs font-sans text-muted-foreground truncate">
                  Official Seismological Records
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full shrink-0 -mr-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                onClick={onClose}
                aria-label="Close panel"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          <ScrollArea className="w-full flex-1 overflow-y-auto">
            {panelInnerContent}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* --- Internal sub-components --- */

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-1 font-sans">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="size-3.5 animate-spin text-info" />
        <span className="font-sans">Retrieving seismological records...</span>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-3 bg-muted/20 rounded-xl space-y-2 animate-pulse">
          <div className="h-3 w-1/3 bg-muted/20 rounded" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 bg-muted/15 rounded" />
            <div className="h-3 bg-muted/15 rounded" />
            <div className="h-3 bg-muted/15 rounded" />
            <div className="h-3 bg-muted/15 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 gap-3 text-destructive font-sans">
      <AlertCircle className="size-8 opacity-75" />
      <div>
        <p className="text-xs font-semibold">Failed to Retrieve Details</p>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
          {error}
        </p>
      </div>
      <Button
        size="xs"
        variant="outline"
        onClick={onRetry}
        className="mt-2 text-xs font-sans cursor-pointer"
      >
        Retry Fetch
      </Button>
    </div>
  )
}

function DetailsContent({
  sections,
  earthquake,
  onOpenChat
}: {
  sections: EventDetailSection[]
  earthquake: EarthquakeEvent | null
  onOpenChat: (quake: EarthquakeEvent) => void
}) {
  const severity = earthquake ? getMagSeverity(earthquake.magnitude) : null

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5 font-sans">
      {/* Left Pane: Context & Action */}
      <div className="w-full md:w-[260px] lg:w-[280px] shrink-0 flex flex-col gap-3">
        {/* Hero event summary */}
        {earthquake && severity && (
          <div className="flex items-start gap-3 p-3.5 bg-muted/20 border border-border/30 rounded-xl">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span className="text-2xl font-extrabold font-sans text-foreground leading-none">
                {earthquake.magnitude.toFixed(1)}
              </span>
              <Badge className={`text-xs font-sans font-semibold px-2 py-0.5 border rounded-lg ${severity.color}`}>
                {severity.label}
              </Badge>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold font-sans text-foreground leading-snug line-clamp-2">{earthquake.place}</p>
              <p className="text-xs font-sans text-muted-foreground">
                {earthquake.depth.toFixed(0)}km depth • {new Date(earthquake.time).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* Action button */}
        {earthquake && (
          <div className="flex flex-col gap-2 w-full mt-auto md:mt-0">
            <Button
              variant="outline"
              className="w-full text-xs font-sans font-semibold uppercase tracking-wider border-border/30 gap-1.5 cursor-pointer h-9 hover:bg-muted transition-colors duration-200"
              onClick={() => onOpenChat(earthquake)}
            >
              <span>Analyze event with AI</span>
              <ExternalLink className="size-3.5 text-primary" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <Separator className="my-1 md:hidden" />

      {/* Right Pane: Structured data sections */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 min-w-0">
        {sections.map((section) => {
          const IconComponent = sectionIcons[section.icon]
          return (
            <div key={section.title} className="rounded-xl border border-border/30 bg-muted/20 overflow-hidden flex flex-col min-w-0">
              {/* Section header */}
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/20 bg-muted/10">
                <div className="flex items-center gap-2">
                  <IconComponent className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </span>
                </div>
                {section.title === "Event Metadata" && earthquake?.url && (
                  <a
                    href={earthquake.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
                    title="View Official Web Bulletin"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
              {/* Key-value grid */}
              <div className="px-3.5 py-2 space-y-0.5 flex-1 min-w-0">
                {section.items.map((item, idx) => {
                  // Format long IDs nicely
                  const displayValue =
                    item.label.toLowerCase().includes("id") && item.value.length > 14
                      ? `#${item.value.slice(0, 8)}...`
                      : item.value

                  return (
                    <div
                      key={item.label}
                      className={`flex items-start justify-between py-1.5 gap-2 ${idx !== section.items.length - 1 ? "border-b border-border/5" : ""}`}
                    >
                      <span className="text-xs font-sans text-muted-foreground shrink-0 mt-[1px]">{item.label}</span>
                      <span
                        className="text-xs font-sans font-medium text-foreground text-right break-words min-w-0"
                        title={item.value}
                      >
                        {displayValue}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground gap-2 select-none">
      <HelpCircle className="size-10 opacity-30" />
      <p className="text-xs font-semibold">No event selected</p>
      <p className="text-[11px] max-w-[220px]">
        Click an earthquake marker on the map to view detailed seismic records.
      </p>
    </div>
  )
}
