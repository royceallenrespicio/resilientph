"use client"

import { memo } from "react"
import { Search, MapPin, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EarthquakeEvent } from "@/lib/map/usgs"
import { getEarthquakeSeverityStyles } from "@/lib/map/layer-styles"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"

interface MapSidebarProps {
  earthquakes: EarthquakeEvent[]
  filteredEarthquakes: EarthquakeEvent[]
  selectedId: string | null
  onSelect: (quake: EarthquakeEvent) => void
  loading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isTabletOrMobile: boolean
}


interface MapSidebarRowProps {
  quake: EarthquakeEvent
  isSelected: boolean
  onClick: () => void
}

const MapSidebarRow = memo(({ quake, isSelected, onClick }: MapSidebarRowProps) => {
  const styles = getEarthquakeSeverityStyles(quake.magnitude)
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center justify-between p-3.5 rounded-xl transition-all border cursor-pointer duration-200",
        isSelected
          ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20"
          : "bg-card border-border/70 hover:bg-muted/50 hover:border-foreground/20 shadow-xs"
      )}
    >
      <div className="space-y-1.5 flex-1 min-w-0 pr-3">
        <p className="text-sm font-semibold text-foreground leading-snug truncate">
          {quake.place}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-sans">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelativeTime(quake.time)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {quake.depth.toFixed(0)}km depth
          </span>
          <span>•</span>
          <span className="text-[10px] uppercase font-sans px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
            {quake.source?.toUpperCase() || "USGS"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-bold border",
          quake.magnitude >= 6.0
            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
            : quake.magnitude >= 5.0
            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
            : quake.magnitude >= 4.0
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        )}>
          <span className={cn(
            "size-1.5 rounded-full animate-pulse",
            quake.magnitude >= 6.0 ? "bg-red-500" : quake.magnitude >= 5.0 ? "bg-orange-500" : quake.magnitude >= 4.0 ? "bg-amber-500" : "bg-emerald-500"
          )} />
          <span>M{quake.magnitude.toFixed(1)}</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-sans tracking-wider">
          {styles.label}
        </span>
      </div>
    </button>
  )
})
MapSidebarRow.displayName = "MapSidebarRow"

export function MapSidebar({
  earthquakes,
  filteredEarthquakes,
  selectedId,
  onSelect,
  loading,
  searchQuery,
  setSearchQuery,
  isOpen,
  setIsOpen,
  isTabletOrMobile
}: MapSidebarProps) {
  const handleToggle = () => setIsOpen(!isOpen)

  // Extract inner list contents
  const listContent = (
    <div className="flex flex-col h-full min-h-0 bg-transparent">
      {/* Search bar */}
      <div className="p-4 border-b border-border/40 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 text-sm h-9 rounded-xl border-border/40 bg-background focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Results Info Bar */}
      <div className="px-4 py-2 bg-muted/40 border-b border-border/40 text-xs font-sans text-muted-foreground flex justify-between shrink-0 select-none">
        <span>Found: {filteredEarthquakes.length} events</span>
        <span>Filtered from {earthquakes.length}</span>
      </div>

      {/* Scrollable list */}
      <ScrollArea className="flex-1 w-full min-h-0 overflow-y-auto max-h-[55vh] lg:max-h-none">
        <div className="px-4 py-4 space-y-3 w-full">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-muted border border-border/40 rounded-xl animate-pulse">
                <div className="h-4 w-3/4 bg-muted/40 rounded" />
                <div className="h-3 w-1/2 bg-muted/40 rounded" />
              </div>
            ))
          ) : filteredEarthquakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center select-none font-sans">
              <AlertTriangle className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">No events match criteria</p>
              <p className="text-xs text-muted-foreground/75 mt-1">Try adjusting the filters or search query.</p>
            </div>
          ) : (
            <>
              {filteredEarthquakes.slice(0, 100).map((quake) => (
                <MapSidebarRow
                  key={quake.id}
                  quake={quake}
                  isSelected={selectedId === quake.id}
                  onClick={() => onSelect(quake)}
                />
              ))}
              {filteredEarthquakes.length > 100 && (
                <p className="text-center text-[10px] text-muted-foreground/70 font-sans py-2 tracking-wide select-none">
                  Showing latest 100 events. Refine filters to see more.
                </p>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  if (isTabletOrMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="text-foreground max-h-[85vh] font-sans max-w-lg mx-auto rounded-t-3xl border-t border-border/60 bg-card/98 backdrop-blur-xl">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/25 shrink-0" />
          <div className="mx-auto w-full max-w-lg overflow-hidden pb-6 font-sans">
            <DrawerHeader className="pb-3 border-b border-border/40 select-none text-left px-5 font-sans">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-base font-semibold flex items-center gap-2 font-sans">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Geological Logs</span>
                </DrawerTitle>
                <span className="text-xs font-sans text-muted-foreground">
                  {filteredEarthquakes.length} events
                </span>
              </div>
              <DrawerDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Consolidated USGS & PHIVOLCS Feed
              </DrawerDescription>
            </DrawerHeader>
            {listContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Original sliding/collapsible desktop sidebar
  return (
    <div
      className={cn(
        "absolute top-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 left-4 md:left-auto right-4 z-30 w-auto md:w-96 transition-transform duration-300 pointer-events-none font-sans",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
    >
      {/* Collapse/Expand Toggle Button attached to the left of the Card */}
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 -left-9 pointer-events-auto z-30 select-none",
        isOpen ? "hidden md:block" : "block"
      )}>
        <Button
          onClick={handleToggle}
          variant="outline"
          size="icon"
          className="size-7 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-md cursor-pointer hover:bg-muted text-foreground transition-all duration-200"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      {/* Sidebar Panel */}
      <Card
        className="w-full h-full flex flex-col p-0 gap-0 pointer-events-auto overflow-hidden shadow-lg border border-border bg-card/95 backdrop-blur-xl rounded-2xl font-sans"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 shrink-0 select-none font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground font-sans">
                  Geological Logs
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Consolidated USGS & PHIVOLCS Feed
                </p>
              </div>
            </div>
            <span className="text-xs font-sans text-muted-foreground">
              {filteredEarthquakes.length} events
            </span>
          </div>
        </div>

        {listContent}
      </Card>
    </div>
  )
}
