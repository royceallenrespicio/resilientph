"use client"

import { useState, useEffect } from "react"
import { PortalHeader } from "@/components/ui/portal-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Columns, Monitor, CloudSun, MapPin } from "lucide-react"
import { useIsMobile } from "@/hooks/use-breakpoints"
import { PAGASA_PORTAL_URL, PAGASA_IHEATMAP_URL } from "@/lib/constants"
import { FeedPanel } from "./FeedPanel"

export default function PagasaPageClient() {
  const isMobile = useIsMobile()
  const [layoutMode, setLayoutMode] = useState<"focus" | "split">("focus")
  const [splitOrientation, setSplitOrientation] = useState<"horizontal" | "vertical">("horizontal")
  const [activeTab, setActiveTab] = useState<string>("radar")

  // Radar Portal States
  const [isRadarLoading, setIsRadarLoading] = useState(true)
  const [radarKey, setRadarKey] = useState(0)

  // Heatmap Portal States
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(true)
  const [heatmapKey, setHeatmapKey] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSplitOrientation("vertical")
      } else {
        setSplitOrientation("horizontal")
      }
      if (window.innerWidth < 768) {
        setLayoutMode((prev) => (prev !== "focus" ? "focus" : prev))
      }
    }

    // Defer execution to prevent synchronous cascading render warning
    const frameId = requestAnimationFrame(handleResize)
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const handleRefreshRadar = () => {
    setIsRadarLoading(true)
    setRadarKey((prev) => prev + 1)
  }

  const handleRefreshHeatmap = () => {
    setIsHeatmapLoading(true)
    setHeatmapKey((prev) => prev + 1)
  }

  return (
    <div id="pagasa-portal-page" className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden font-sans select-none">

        {/* Operations Center Portal Header */}
        <PortalHeader title="PAGASA Portal">
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Layout Switcher (Tablet & Desktop Only) */}
            {!isMobile && (
              <div className="flex items-center bg-muted/65 border border-primary/10 p-0.5 rounded-xl mr-1 shrink-0 h-9" role="group" aria-label="Layout controls">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      id="layout-focus-btn"
                      variant={layoutMode === "focus" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setLayoutMode("focus")}
                      className={`size-8 rounded-lg cursor-pointer transition-all ${layoutMode === "focus"
                        ? "bg-background/80 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                      aria-label="Switch to single portal view"
                    >
                      <Monitor className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Single Feed Focus</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      id="layout-split-btn"
                      variant={layoutMode === "split" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setLayoutMode("split")}
                      className={`size-8 rounded-lg cursor-pointer transition-all ${layoutMode === "split"
                        ? "bg-background/80 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                      aria-label="Switch to dual split screen view"
                    >
                      <Columns className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Split Screen Feed</TooltipContent>
                </Tooltip>
              </div>
            )}


          </div>
        </PortalHeader>

        {/* Dashboard Viewport */}
        <div className="flex-1 min-h-0 w-full p-2.5 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:pb-4">
          <div className="w-full h-full max-w-7xl mx-auto flex flex-col min-h-0">

            {layoutMode === "focus" ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full h-full flex flex-col min-h-0"
              >
                {/* Spacious, touch-friendly tab switches */}
                <TabsList className="bg-muted/50 border border-border/50 p-0.5 rounded-xl mx-auto mb-3 h-9 shrink-0 w-full max-w-md gap-0.5 select-none">
                  <TabsTrigger
                    value="radar"
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans data-active:bg-card data-active:text-foreground data-active:shadow-sm flex items-center justify-center gap-1.5 text-muted-foreground"
                    aria-label="View Doppler radar and clouds"
                  >
                    <CloudSun className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>Radar & Cloud Feed</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="heatmap"
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans data-active:bg-card data-active:text-foreground data-active:shadow-sm flex items-center justify-center gap-1.5 text-muted-foreground"
                    aria-label="View active hazard warnings map"
                  >
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>Warning Heatmap</span>
                  </TabsTrigger>
                </TabsList>

                {/* Radar Tab Panel */}
                <TabsContent value="radar" className="flex-1 min-h-0 w-full relative outline-none">
                  <FeedPanel
                    title="PAGASA Doppler Weather Radar"
                    src={PAGASA_PORTAL_URL}
                    iframeKey={radarKey}
                    isLoading={isRadarLoading}
                    onLoad={() => setIsRadarLoading(false)}
                    onRefresh={handleRefreshRadar}
                    loaderStatus="ACQUIRING DOPPLER RADAR FEED"
                    loaderTitle="Loading Doppler Radar Maps"
                    loaderDescription="Fetching real-time rain forecasts, satellite tracking data, and cloud patterns."
                    iframeTitle="PAGASA Doppler Weather Radar feed"
                    iframeId="pagasa-radar-iframe"
                  />
                </TabsContent>

                {/* Heatmap Tab Panel */}
                <TabsContent value="heatmap" className="flex-1 min-h-0 w-full relative outline-none">
                  <FeedPanel
                    title="PAGASA Warning Heatmap"
                    src={PAGASA_IHEATMAP_URL}
                    iframeKey={heatmapKey}
                    isLoading={isHeatmapLoading}
                    onLoad={() => setIsHeatmapLoading(false)}
                    onRefresh={handleRefreshHeatmap}
                    loaderStatus="DOWNLOADING WARNING HEATMAP DATA"
                    loaderTitle="Loading Alert Heatmaps"
                    loaderDescription="Fetching regional hazard overlays, active typhoon tracks, and municipal weather warnings."
                    iframeTitle="PAGASA Warning Heatmap feed"
                    iframeId="pagasa-heatmap-iframe"
                  />
                </TabsContent>
              </Tabs>
            ) : (
              // Split Screen Operations Dashboard Mode
              <div className="flex-1 min-h-0 w-full rounded-2xl border border-primary/10 bg-card/10 overflow-hidden shadow-2xl">
                <ResizablePanelGroup orientation={splitOrientation}>

                  {/* Left/Top Radar panel */}
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <FeedPanel
                      title="Feed 1: Panahon"
                      src={PAGASA_PORTAL_URL}
                      iframeKey={radarKey}
                      isLoading={isRadarLoading}
                      onLoad={() => setIsRadarLoading(false)}
                      onRefresh={handleRefreshRadar}
                      loaderStatus="DOWNLOADING RADAR STREAM"
                      loaderTitle="Loading Doppler Radar Maps"
                      loaderDescription="Fetching real-time rain forecasts and cloud structures."
                      iframeTitle="PAGASA Doppler Radar Split View"
                    />
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Right/Bottom Heatmap panel */}
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <FeedPanel
                      title="Feed 2: iHeatMap"
                      src={PAGASA_IHEATMAP_URL}
                      iframeKey={heatmapKey}
                      isLoading={isHeatmapLoading}
                      onLoad={() => setIsHeatmapLoading(false)}
                      onRefresh={handleRefreshHeatmap}
                      loaderStatus="DOWNLOADING HEATMAP STREAM"
                      loaderTitle="Loading Alert Heatmaps"
                      loaderDescription="Fetching regional hazard overlays and municipal warnings."
                      iframeTitle="PAGASA Warning Heatmap Split View"
                    />
                  </ResizablePanel>

                </ResizablePanelGroup>
              </div>
            )}

          </div>
      </div>
    </div>
  )
}
