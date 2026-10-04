import { NextRequest, NextResponse } from "next/server"
import { scrapeEarthquakes } from "@/lib/scraper/phivolcs"
import { createApiErrorResponse } from "@/lib/api/errors"
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit"

const RATE_LIMIT_CONFIG = { maxRequests: 60, windowMs: 60 * 60 * 1000 } // 60 requests per hour

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, remaining, resetAt } = await checkRateLimit(`phivolcs:${ip}`, RATE_LIMIT_CONFIG)

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

    // Always use cache (force=false) for public API endpoint
    const force = false

    const data = await scrapeEarthquakes(force)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: data.length,
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