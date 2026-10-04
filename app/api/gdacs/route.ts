import { NextRequest, NextResponse } from "next/server"
import { parseGDACSResponse } from "@/lib/emergency/gdacs"
import { GDACS_API_BASE_URL } from "@/lib/constants"
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit"

const RATE_LIMIT_CONFIG = { maxRequests: 60, windowMs: 60 * 60 * 1000 } // 60 requests per hour

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, remaining, resetAt } = await checkRateLimit(`gdacs:${ip}`, RATE_LIMIT_CONFIG)

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const fromDateStr = thirtyDaysAgo.toISOString().split("T")[0]
    const searchUrl = `${GDACS_API_BASE_URL}?fromdate=${fromDateStr}&eventlist=EQ;TC;FL;VO;DR;TS`

    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(6000), // 6 second timeout for external GDACS server
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) {
      throw new Error(`GDACS API responded with status ${res.status}`)
    }

    const data = res.status === 204 ? [] : await res.json()
    const events = parseGDACSResponse(data)

    return NextResponse.json(events, {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.maxRequests.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(resetAt).getTime().toString()
      }
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.warn(`[GDACS Feed] External API unreachable (${errorMsg}). Returning empty fallback.`)

    return NextResponse.json([], {
      headers: {
        "X-Feed-Status": "offline",
        "Cache-Control": "no-store", // Do not cache the empty offline response
      }
    })
  }
}
