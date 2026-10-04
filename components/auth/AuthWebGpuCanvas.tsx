"use client"

import React, { useEffect, useRef, useState, useTransition } from "react"
import { startAuthWebGpu, isWebGpuSupported, type AuthWebGpuHandle, type TelemetryState } from "@/lib/vgpu/auth-canvas"
import { PH_SVG_PATH } from "@/lib/vgpu/ph-mask"

interface AuthWebGpuCanvasProps {
  className?: string
}

export function AuthWebGpuCanvas({ className }: AuthWebGpuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<AuthWebGpuHandle | null>(null)
  const [, startTransition] = useTransition()

  // Lazy check for WebGPU support
  const [supported, setSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    return isWebGpuSupported()
  })

  const [, setTelemetry] = useState<TelemetryState>({
    fps: 60,
    adapterName: "WebGPU Accelerated",
    resolution: [800, 600],
    intensity: 1.0,
    isWebGpu: true,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isWebGpuSupported()) return

    let isSubscribed = true

    void (async () => {
      const handle = await startAuthWebGpu(canvas, {
        onTelemetry: (t) => {
          if (isSubscribed) {
            setTelemetry(t)
          }
        },
      })

      if (!handle) {
        if (isSubscribed) {
          startTransition(() => {
            setSupported(false)
          })
        }
        return
      }

      handleRef.current = handle
    })()

    // High-performance DOM-based 3D Parallax (Zero React re-renders)
    let targetRx = 38
    let targetRz = -22
    let targetTx = 0
    let targetTy = 0
    let currentRx = 38
    let currentRz = -22
    let currentTx = 0
    let currentTy = 0
    let rafId: number | undefined

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = (e.clientX - cx) / cx
      const dy = (e.clientY - cy) / cy

      targetRx = 38 - dy * 6
      targetRz = -22 + dx * 6
      targetTx = dx * 8
      targetTy = dy * 8
    }

    const animateParallax = () => {
      if (!isSubscribed) return
      currentRx += (targetRx - currentRx) * 0.1
      currentRz += (targetRz - currentRz) * 0.1
      currentTx += (targetTx - currentTx) * 0.1
      currentTy += (targetTy - currentTy) * 0.1

      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${currentRx.toFixed(2)}deg) rotateZ(${currentRz.toFixed(2)}deg) translate3d(${currentTx.toFixed(1)}px, ${currentTy.toFixed(1)}px, 0px)`
      }
      rafId = requestAnimationFrame(animateParallax)
    }

    rafId = requestAnimationFrame(animateParallax)

    // Listen for custom shockwave events from auth form fields
    const handleCustomShockwave = (e: Event) => {
      const customEvent = e as CustomEvent<{ intensity?: number; x?: number; y?: number }>
      const x = customEvent.detail?.x ?? 0.5
      const y = customEvent.detail?.y ?? 0.5
      const intensity = customEvent.detail?.intensity ?? 1.0
      handleRef.current?.triggerShockwave([x, y], intensity)
    }

    window.addEventListener("mousemove", handleGlobalMouseMove, { passive: true })
    window.addEventListener("resilientph:auth-shockwave", handleCustomShockwave)

    return () => {
      isSubscribed = false
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("resilientph:auth-shockwave", handleCustomShockwave)
      handleRef.current?.dispose()
      handleRef.current = null
    }
  }, [])

  // Fallback 3D SVG Halftone if WebGPU is not supported
  if (!supported) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center select-none [perspective:1400px] ${className ?? ""}`}>
        <div
          ref={cardRef}
          style={{
            transform: "rotateX(38deg) rotateZ(-22deg)",
            transformStyle: "preserve-3d",
          }}
          className="relative w-full max-w-lg h-[500px] sm:h-[560px] lg:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-border/30 bg-card/40 backdrop-blur-md flex items-center justify-center"
        >
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <svg viewBox="60 0 280 400" className="w-full h-full text-foreground overflow-visible">
              <defs>
                <pattern
                  id="ph-bryl-dots-3d-fallback"
                  width="4.5"
                  height="4.5"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2.25" cy="2.25" r="1.1" fill="currentColor" />
                </pattern>
              </defs>
              <path
                d={PH_SVG_PATH}
                fill="url(#ph-bryl-dots-3d-fallback)"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeOpacity="0.4"
                style={{ opacity: 0.9 }}
              />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none [perspective:1400px] ${className ?? ""}`}>
      {/* 3D Isometric Viewport Container with WebGPU Halftone Canvas */}
      <div
        ref={cardRef}
        style={{
          transform: "rotateX(38deg) rotateZ(-22deg)",
          transformStyle: "preserve-3d",
        }}
        className="relative w-full max-w-lg h-[490px] sm:h-[550px] lg:h-[590px] xl:h-[630px] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-border/30 bg-card/60 backdrop-blur-md"
      >
        {/* Interactive WebGPU Canvas */}
        <canvas
          ref={canvasRef}
          id="ph-halftone-webgpu-canvas"
          className="w-full h-full block cursor-crosshair touch-none"
        />
      </div>
    </div>
  )
}
