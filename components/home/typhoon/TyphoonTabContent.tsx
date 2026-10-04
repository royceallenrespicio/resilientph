"use client"

import React, { useMemo } from "react"
import { motion } from "motion/react"
import { TyphoonBulletinCard } from "./TyphoonBulletinCard"
import { TyphoonAiPanel } from "./TyphoonAiPanel"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { PagasaTcInfo, TyphoonBulletin } from "@/lib/home/types"
import { formatWeatherText } from "@/lib/utils"

interface TyphoonTabContentProps {
  tcInfo?: PagasaTcInfo | null
  typhoon?: TyphoonBulletin[] | null
  onAnalyze: (prompt: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 25 }
  }
} as const

export function TyphoonTabContent({ tcInfo, typhoon, onAnalyze }: TyphoonTabContentProps) {
  const stormName = useMemo(() => {
    const activeBulletin = typhoon?.find((t) => t.active) ?? null
    if (activeBulletin?.active && activeBulletin?.title) return activeBulletin.title
    const rows = tcInfo?.rows
    if (rows && rows.length >= 2) {
      const nameRow = rows[1]?.trim()
      if (nameRow && !nameRow.includes(":")) return formatWeatherText(nameRow)
    }
    if (activeBulletin?.title) return activeBulletin.title
    return "Active Cyclone"
  }, [tcInfo, typhoon])


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full"
    >
      {/* Bulletin Detail: 7 cols on desktop, full width on mobile/tablet */}
      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-7 flex flex-col">
        <ErrorBoundary>
          <TyphoonBulletinCard tcInfo={tcInfo} typhoon={typhoon} />
        </ErrorBoundary>
      </motion.div>

      {/* AI Analysis Panel: 5 cols on desktop, full width on mobile/tablet */}
      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-5 flex flex-col">
        <ErrorBoundary>
          <TyphoonAiPanel stormName={stormName} onAnalyze={onAnalyze} />
        </ErrorBoundary>
      </motion.div>
    </motion.div>
  )
}