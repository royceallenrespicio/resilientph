"use client"

import React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart"

interface HomeWeatherTrendsChartProps {
  hourlyTemps: number[]
  hourlyTimes: string[]
  hourlyRainProb: number[]
}

const chartConfig = {
  temp: {
    label: "Temp (°C)",
    color: "var(--color-warning)" // replaced amber-500
  },
  rain: {
    label: "Rain Prob (%)",
    color: "var(--color-info)" // replaced cyan-500
  }
} satisfies ChartConfig

export function WeatherTrendsChart({
  hourlyTemps,
  hourlyTimes,
  hourlyRainProb
}: HomeWeatherTrendsChartProps) {
  // Map raw data arrays to recharts structured list
  const data = hourlyTimes.map((time, idx) => ({
    time,
    temp: hourlyTemps[idx] ?? 0,
    rain: hourlyRainProb[idx] ?? 0
  }))

  return (
    <div className="w-full h-[240px] md:h-[280px]">
      <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground font-sans"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground font-sans"
            domain={[0, "auto"]}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend
            verticalAlign="top"
            height={36}
            content={({ payload }) => (
              <div className="flex items-center justify-end gap-4 text-xs font-sans text-muted-foreground pb-2">
                {payload?.map((entry) => {
                  const dataKeyStr = typeof entry.dataKey === "string" ? entry.dataKey : ""
                  const configKey = (dataKeyStr === "temp" || dataKeyStr === "rain") ? dataKeyStr : "temp"
                  const config = chartConfig[configKey]
                  return (
                    <div key={entry.value} className="flex items-center gap-1.5">
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span>{config?.label || entry.value}</span>
                    </div>
                  )
                })}
              </div>
            )}
          />
          <Area
            type="monotone"
            dataKey="temp"
            stroke="var(--color-warning)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTemp)"
          />
          <Area
            type="monotone"
            dataKey="rain"
            stroke="var(--color-info)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRain)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
