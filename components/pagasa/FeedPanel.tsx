"use client"

import { RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadarLoader } from "./RadarLoader"

interface FeedPanelProps {
  title: string
  src: string
  iframeKey: number
  isLoading: boolean
  onLoad: () => void
  onRefresh: () => void
  loaderStatus: string
  loaderTitle: string
  loaderDescription: string
  iframeTitle: string
  iframeId?: string
}

export function FeedPanel({
  title,
  src,
  iframeKey,
  isLoading,
  onLoad,
  onRefresh,
  loaderStatus,
  loaderTitle,
  loaderDescription,
  iframeTitle,
  iframeId
}: FeedPanelProps) {
  return (
    <div className="flex flex-col w-full h-full rounded-2xl border border-primary/10 bg-card/10 overflow-hidden shadow-2xl min-h-0">
      
      {/* Feed Control Banner */}
      <div className="h-10 border-b border-primary/10 bg-muted/40 px-4 flex items-center justify-between shrink-0">
        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          {title}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all cursor-pointer"
            onClick={onRefresh}
            aria-label={`Refresh ${title}`}
          >
            <RefreshCw className="size-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all cursor-pointer"
            asChild
            aria-label={`Open ${title} in a new tab`}
          >
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* Frame Port */}
      <div className="flex-1 min-h-0 relative bg-black/20">
        <RadarLoader 
          isVisible={isLoading} 
          bypassUrl={src}
          statusMessage={loaderStatus}
          title={loaderTitle}
          description={loaderDescription}
        />
        <iframe
          key={iframeKey}
          src={src}
          onLoad={onLoad}
          className="w-full h-full border-none bg-card shadow-inner"
          title={iframeTitle}
          id={iframeId}
          allow="geolocation"
        />
      </div>
    </div>
  )
}
