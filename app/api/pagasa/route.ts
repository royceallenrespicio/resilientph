import { NextRequest, NextResponse } from "next/server"
import { createApiErrorResponse } from "@/lib/api/errors"
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit"
import {
  scrapeDailyWeather,
  scrapeRegionalForecasts,
  scrapeTemperatures,
  scrapeWeeklyOutlook,
  scrapeAllPagasa
} from "@/lib/scraper/pagasa"

const RATE_LIMIT_CONFIG = { maxRequests: 60, windowMs: 60 * 60 * 1000 } // 60 requests per hour

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, remaining, resetAt } = await checkRateLimit(`pagasa:${ip}`, RATE_LIMIT_CONFIG)

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_CONFIG.maxRequests.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(resetAt).getTime().toString()
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    
    // Always use cache (force=false) for public API endpoint
    const force = false

    let data: unknown

    switch (type) {
      case "daily":
        data = await scrapeDailyWeather(force)
        break
      case "regional":
        data = await scrapeRegionalForecasts(force)
        break
      case "temperatures":
        data = await scrapeTemperatures(force)
        break
      case "weekly":
        data = await scrapeWeeklyOutlook(force)
        break
      case "all":
      default:
        data = await scrapeAllPagasa(force)
        break
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      type,
      data
    }, {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.maxRequests.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(resetAt).getTime().toString()
      }
    })
  } catch (err) {
    return createApiErrorResponse(err, "Scraping execution failed")
  }
}
