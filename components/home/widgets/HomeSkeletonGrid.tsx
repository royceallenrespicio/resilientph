import React from "react"
import { motion } from "motion/react"

export function HomeSkeletonGrid() {
  return (
    <motion.div
      key="loading-skeletons"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Weather Forecast Skeleton */}
      <div className="lg:col-span-12 flex flex-col">
        <div className="w-full min-h-[220px] border-none bg-background shadow-none rounded-2xl animate-pulse" />
      </div>
      {/* Regional Weather Bulletins Skeleton */}
      <div className="lg:col-span-12 flex flex-col">
        <div className="w-full min-h-[350px] border-none bg-background shadow-none rounded-2xl animate-pulse" />
      </div>
      {/* Skeletons: GDACS (6) & Quake (6) */}
      <div className="lg:col-span-6 flex flex-col">
        <div className="w-full min-h-[400px] border-none bg-background shadow-none rounded-2xl animate-pulse" />
      </div>
      <div className="lg:col-span-6 flex flex-col">
        <div className="w-full min-h-[400px] border-none bg-background shadow-none rounded-2xl animate-pulse" />
      </div>
    </motion.div>
  )
}
