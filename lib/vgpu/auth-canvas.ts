/**
 * ResilientPH WebGPU Controller for Philippine Halftone Map
 * Built with vgpu
 */

import { clock, effect, frameLoop, init, surface, sampler } from "vgpu"
import type { FrameLoopHandle, Surface, Gpu } from "vgpu"
import { PH_HALFTONE_WGSL } from "./ph-shader"
import { createPhilippineMaskCanvas } from "./ph-mask"

export interface TelemetryState {
  fps: number
  adapterName: string
  resolution: [number, number]
  intensity: number
  isWebGpu: boolean
}

export interface AuthWebGpuHandle {
  setIntensity: (intensity: number) => void
  triggerShockwave: (normalizedPos?: [number, number], intensity?: number) => void
  dispose: () => void
}

/** Check if WebGPU is supported in the current browser runtime */
export function isWebGpuSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator && !!navigator.gpu
}

/**
 * Initializes and starts the interactive WebGPU Philippine Halftone Dot Matrix render loop.
 */
export async function startAuthWebGpu(
  canvas: HTMLCanvasElement,
  options?: {
    onTelemetry?: (state: TelemetryState) => void
    initialIntensity?: number
  }
): Promise<AuthWebGpuHandle | null> {
  if (!isWebGpuSupported()) {
    return null
  }

  let disposed = false
  let loop: FrameLoopHandle | undefined
  let gpu: Gpu | undefined
  let canvasSurface: Surface | undefined
  let rawTexture: unknown = undefined

  let currentIntensity = options?.initialIntensity ?? 1.0

  // Mouse tracking state (smoothed)
  let targetMouseX = 0.5
  let targetMouseY = 0.5
  let currentMouseX = 0.5
  let currentMouseY = 0.5
  let prevMouseX = 0.5
  let prevMouseY = 0.5
  let mouseSpeed = 0.0

  // Click shockwave state
  let clickPosX = 0.5
  let clickPosY = 0.5
  let clickTimestamp = 0
  let pulseIntensity = 1.0

  // FPS and Telemetry tracking
  let frameCount = 0
  let lastFpsUpdateTime = performance.now()
  let currentFps = 60
  let adapterName = "WebGPU Accelerated"

  // Pointer event handlers
  const handlePointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    targetMouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    targetMouseY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  }

  const handlePointerDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    triggerShockwaveInternal([x, y], 1.4)
  }

  const triggerShockwaveInternal = (pos?: [number, number], intensity = 1.0) => {
    if (pos) {
      clickPosX = pos[0]
      clickPosY = pos[1]
    } else {
      clickPosX = currentMouseX
      clickPosY = currentMouseY
    }
    clickTimestamp = performance.now()
    pulseIntensity = intensity
  }

  canvas.addEventListener("pointermove", handlePointerMove, { passive: true })
  canvas.addEventListener("pointerdown", handlePointerDown, { passive: true })

  try {
    gpu = await init()
    if (disposed) {
      gpu.dispose()
      return null
    }

    try {
      if (gpu.gpu && "adapterInfo" in gpu.gpu) {
        const info = (gpu.gpu as unknown as { adapterInfo?: { description?: string; vendor?: string } }).adapterInfo
        if (info?.description) {
          adapterName = info.description
        } else if (info?.vendor) {
          adapterName = `${info.vendor} GPU`
        }
      }
    } catch {
      // Fallback default adapter name
    }

    // Ensure positive initial canvas dimensions
    if (!canvas.width || canvas.width === 0) {
      canvas.width = canvas.clientWidth || 800
    }
    if (!canvas.height || canvas.height === 0) {
      canvas.height = canvas.clientHeight || 600
    }

    canvasSurface = surface(gpu, canvas, {
      dpr: [1, 2],
      autoResize: true,
    })

    // Create and upload Philippine mask texture (1024x1024)
    const maskCanvas = createPhilippineMaskCanvas(1024, 1024)
    const maskBitmap = await createImageBitmap(maskCanvas)

    // WebGPU Texture usage flags: TEXTURE_BINDING (0x04) | COPY_DST (0x02) | RENDER_ATTACHMENT (0x10)
    const usageFlags = 0x04 | 0x02 | 0x10

    const nativeGpu = gpu.gpu
    const nativeTexture = nativeGpu.createTexture({
      size: [1024, 1024, 1],
      format: "rgba8unorm",
      usage: usageFlags,
    })
    rawTexture = nativeTexture

    // copyExternalImageToTexture with [1024, 1024, 1] GPUExtent3D tuple
    nativeGpu.queue.copyExternalImageToTexture(
      { source: maskBitmap },
      { texture: nativeTexture },
      [1024, 1024, 1]
    )

    const phSampler = sampler(gpu, {
      minFilter: "linear",
      magFilter: "linear",
    })

    const phEffect = effect(gpu, PH_HALFTONE_WGSL, {
      label: "resilientph-philippine-halftone",
      set: {
        params: {
          time: 0,
          resolution: canvasSurface.size,
          mouse: [currentMouseX, currentMouseY],
          mouse_speed: 0,
          click_time: 999.0,
          click_pos: [clickPosX, clickPosY],
          pulse_intensity: pulseIntensity,
          intensity: currentIntensity,
        },
        mask_texture: nativeTexture,
        mask_sampler: phSampler,
      },
    })

    canvasSurface.onResize(({ width, height }) => {
      if (disposed) return
      phEffect.set({
        params: {
          resolution: [width, height],
        },
      })
    })

    const gpuClock = clock(gpu)

    loop = frameLoop(gpu, (frame) => {
      if (disposed || !canvasSurface || canvasSurface.disposed) {
        return
      }

      const now = performance.now()
      frameCount++

      // Smooth mouse tracking
      currentMouseX += (targetMouseX - currentMouseX) * 0.15
      currentMouseY += (targetMouseY - currentMouseY) * 0.15

      const dx = currentMouseX - prevMouseX
      const dy = currentMouseY - prevMouseY
      mouseSpeed = Math.min(1.0, Math.sqrt(dx * dx + dy * dy) * 20.0)
      prevMouseX = currentMouseX
      prevMouseY = currentMouseY

      const clickElapsedSec = clickTimestamp > 0 ? (now - clickTimestamp) / 1000 : 999.0

      try {
        phEffect.set({
          params: {
            time: gpuClock.time,
            mouse: [currentMouseX, currentMouseY],
            mouse_speed: mouseSpeed,
            click_time: clickElapsedSec,
            click_pos: [clickPosX, clickPosY],
            pulse_intensity: pulseIntensity,
            intensity: currentIntensity,
            resolution: canvasSurface.size,
          },
        })

        frame.pass(canvasSurface, phEffect)
      } catch (e) {
        // Non-fatal frame pass catch (e.g. transient context resize)
        console.debug("[ResilientPH] WebGPU frame skipped:", e)
      }

      if (now - lastFpsUpdateTime >= 500) {
        const deltaSec = (now - lastFpsUpdateTime) / 1000
        currentFps = Math.round(frameCount / deltaSec)
        frameCount = 0
        lastFpsUpdateTime = now

        options?.onTelemetry?.({
          fps: currentFps,
          adapterName,
          resolution: canvasSurface ? [canvasSurface.size[0], canvasSurface.size[1]] : [canvas.width, canvas.height],
          intensity: currentIntensity,
          isWebGpu: true,
        })
      }
    })

    return {
      setIntensity: (intensity: number) => {
        currentIntensity = intensity
      },
      triggerShockwave: (pos?: [number, number], intensity = 1.0) => {
        triggerShockwaveInternal(pos, intensity)
      },
      dispose: () => {
        if (disposed) return
        disposed = true
        canvas.removeEventListener("pointermove", handlePointerMove)
        canvas.removeEventListener("pointerdown", handlePointerDown)
        loop?.stop()
        canvasSurface?.dispose()
        if (rawTexture && typeof (rawTexture as { destroy?: () => void }).destroy === "function") {
          (rawTexture as { destroy: () => void }).destroy()
        }
        gpu?.dispose()
      },
    }
  } catch (err) {
    console.warn("[ResilientPH] WebGPU Philippine Halftone init failed:", err)
    canvas.removeEventListener("pointermove", handlePointerMove)
    canvas.removeEventListener("pointerdown", handlePointerDown)
    loop?.stop()
    canvasSurface?.dispose()
    if (rawTexture && typeof (rawTexture as { destroy?: () => void }).destroy === "function") {
      (rawTexture as { destroy: () => void }).destroy()
    }
    gpu?.dispose()
    return null
  }
}
