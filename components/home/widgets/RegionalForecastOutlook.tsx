"use client"

import React from "react"
import Image from "next/image"
import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel"

export interface PagasaRegionalExtendedOutlookItem {
  day: string
  image: string
  low: string
  high: string
  wind: string
  direction: string
  coastal: string
}

interface RegionalForecastOutlookProps {
  extended: PagasaRegionalExtendedOutlookItem[]
  getImageUrl: (src?: string) => string
}

export function RegionalForecastOutlook({ extended, getImageUrl }: RegionalForecastOutlookProps) {
  if (extended.length === 0) return null

  return (
    <div className="space-y-3 pt-1 font-sans">
      <div className="flex items-center gap-1.5 select-none">
        <Calendar className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
          5-Day Regional Outlook
        </span>
      </div>

      {/* Desktop Outlook List (5 columns) */}
      <div className="hidden lg:grid grid-cols-5 gap-3">
        {extended.map((day, idx) => (
          <Card
            key={idx}
            className="bg-muted/20 border border-border/10 px-3 py-3 rounded-xl flex flex-col justify-between items-center text-center gap-2.5 hover:bg-muted/40 transition-colors shadow-xs ring-0"
          >
            <span className="text-sm text-foreground font-semibold">{day.day}</span>
            <div className="flex flex-col items-center gap-1 my-0.5 justify-center">
              {day.image && (
                <Image
                  src={getImageUrl(day.image)}
                  alt={`Outlook icon day ${idx + 1}`}
                  width={40}
                  height={40}
                  unoptimized
                  className="size-10 object-contain shrink-0"
                />
              )}
            </div>
            <div className="text-center flex flex-col items-center gap-1">
              <span className="text-sm text-foreground font-bold font-sans tabular-nums">
                {day.low} / {day.high}
              </span>
              {day.wind && (
                <span className="text-[10px] text-muted-foreground font-sans line-clamp-2" title={`${day.wind} | ${day.direction}`}>
                  Wind: {day.wind}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Mobile/Tablet Outlook Carousel */}
      <div className="block lg:hidden w-full">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-3">
            {extended.map((day, idx) => (
              <CarouselItem key={idx} className="pl-3 basis-1/2 sm:basis-1/3">
                <Card className="bg-muted/20 border border-border/10 px-3 py-3.5 rounded-xl flex flex-col justify-between items-center text-center gap-2.5 hover:bg-muted/40 transition-colors shadow-xs ring-0 h-full">
                  <span className="text-sm text-foreground font-semibold">{day.day}</span>
                  <div className="flex flex-col gap-1 items-center justify-center">
                    {day.image && (
                      <Image
                        src={getImageUrl(day.image)}
                        alt={`Outlook icon day ${idx + 1}`}
                        width={40}
                        height={40}
                        unoptimized
                        className="size-10 object-contain shrink-0"
                      />
                    )}
                  </div>
                  <div className="text-center flex flex-col items-center gap-1 pt-1">
                    <span className="text-sm text-foreground font-bold font-sans tabular-nums">
                      {day.low} / {day.high}
                    </span>
                    {day.wind && (
                      <span className="text-[10px] text-muted-foreground font-sans line-clamp-2" title={`${day.wind} | ${day.direction}`}>
                        Wind: {day.wind}
                      </span>
                    )}
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-1.5 mt-3">
            <CarouselPrevious className="static translate-y-0 translate-x-0 size-8 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/40" />
            <CarouselNext className="static translate-y-0 translate-x-0 size-8 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/40" />
          </div>
        </Carousel>
      </div>
    </div>
  )
}
