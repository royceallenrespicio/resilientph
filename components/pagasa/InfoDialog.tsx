"use client"

import { Compass, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function InfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          id="pagasa-info-btn"
          variant="outline"
          size="xs"
          className="text-xs text-primary hover:text-primary-foreground hover:bg-primary/20 transition-all font-bold px-2 sm:px-2.5 py-0 h-8 rounded-xl cursor-pointer border border-primary/15"
          aria-label="View PAGASA portal integration info"
        >
          <Compass className="size-3 sm:mr-1.5" />
          <span className="hidden sm:inline">Info</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-popover text-popover-foreground rounded-4xl border border-primary/10 shadow-2xl p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground font-heading">
            <Compass className="size-5 text-primary" /> PAGASA OPERATIONS CENTER
          </DialogTitle>
          <DialogDescription asChild className="text-sm text-muted-foreground leading-relaxed pt-2">
            <div className="space-y-3.5">
              <p>
                ResilientPH integrates official <strong>DOST-PAGASA</strong> portals to deliver real-time meteorological tracking and disaster warning maps:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>
                  <strong>Doppler Radar & Clouds (Panahon Portal)</strong>: Tracks live typhoon coordinate paths, cloud movements, and local rainfall maps.
                </li>
                <li>
                  <strong>Interactive Warning Heatmap</strong>: Visualizes municipal hazard warnings, active cyclone alerts, and temperature trends across regions.
                </li>
              </ul>
              
              <p>
                On desktop viewports, you can enable <strong>Split Screen</strong> mode to monitor both feeds concurrently in a split-screen dashboard view.
              </p>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mt-4 flex gap-3">
                <AlertCircle className="size-4.5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-foreground text-xs uppercase tracking-wide">Iframe Loading Details</h5>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    If the weather maps appear blank, your browser security configuration (e.g. tracking protection, Brave Shields, or privacy extensions) may be blocking the embed. If this occurs, use the <strong>New Tab</strong> action to load the portal directly.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
