"use client"

import { motion, AnimatePresence } from "motion/react"
import { CloudSun, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RadarLoaderProps {
  isVisible: boolean
  bypassUrl: string
  statusMessage?: string
  title?: string
  description?: string
}

export function RadarLoader({
  isVisible,
  bypassUrl,
  statusMessage = "ESTABLISHING SECURE SATELLITE CONNECTION",
  title = "Loading PAGASA Weather Portal",
  description = "Fetching real-time tropical storm warnings, satellite imaging, and Doppler radar systems."
}: RadarLoaderProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="absolute inset-0 bg-background/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center select-none"
        >
          {/* Radar Grid Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          {/* Spinning Radar Compass */}
          <div className="relative size-36 mb-6 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-25" />
            <div className="absolute inset-2 rounded-full border border-primary/40 border-dashed" />
            <div className="absolute inset-4 rounded-full border border-primary/20" />
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-primary/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <CloudSun className="size-12 text-primary animate-pulse" />
          </div>

          {/* Status and instructions */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/70 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-xs tracking-widest text-success font-mono font-bold uppercase">
              {statusMessage}
            </span>
          </div>
          <h3 className="text-base font-heading font-extrabold text-foreground mb-1.5 font-sans">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed font-sans">
            {description}
          </p>
          
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs text-muted-foreground border-border/40 hover:text-foreground cursor-pointer z-40 h-8 rounded-xl"
            asChild
          >
            <a href={bypassUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3 mr-1.5" /> Open Direct Link
            </a>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
