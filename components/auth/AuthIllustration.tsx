"use client"

import React from "react"
import { AuthWebGpuCanvas } from "./AuthWebGpuCanvas"

export function AuthIllustration() {
  return (
    <div className="relative w-full h-full flex flex-col justify-center select-none">
      {/* 3D Interactive WebGPU Canvas Frame */}
      <div className="relative w-full h-[530px] xl:h-[610px] flex items-center justify-center">
        <AuthWebGpuCanvas className="w-full h-full" />
      </div>
    </div>
  )
}
