"use client"

import { useState } from "react"
import { BoundaryLevel, RegionProperties, ProvinceProperties, MunicityProperties } from "@/lib/map/types"

export function useBoundarySelection() {
  const [activeLevel, setActiveLevel] = useState<BoundaryLevel>("regions")
  const [selectedRegion, setSelectedRegion] = useState<RegionProperties | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<ProvinceProperties | null>(null)
  const [selectedMunicity, setSelectedMunicity] = useState<MunicityProperties | null>(null)
  
  const [hoveredId, setHoveredId] = useState<string | number | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  return {
    activeLevel,
    setActiveLevel,
    selectedRegion,
    setSelectedRegion,
    selectedProvince,
    setSelectedProvince,
    selectedMunicity,
    setSelectedMunicity,
    hoveredId,
    setHoveredId,
    hoveredName,
    setHoveredName
  }
}
