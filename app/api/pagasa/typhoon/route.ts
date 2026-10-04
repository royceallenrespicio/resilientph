import { NextRequest, NextResponse } from "next/server"
import { scrapeTyphoonBulletin } from "@/lib/scraper/pagasa"
import { createApiErrorResponse } from "@/lib/api/errors"
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth"
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit"

const RATE_LIMIT_CONFIG = { maxRequests: 60, windowMs: 60 * 60 * 1000 } // 60 requests per hour

export async function GET(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(`typhoon:${getClientIp(request)}`, RATE_LIMIT_CONFIG)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    // Force refresh bypasses caches, so it is restricted to authenticated cron calls
    const force = searchParams.get("force") === "true" && isAuthorizedCronRequest(request)

    const data = await scrapeTyphoonBulletin(force)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data
    })
  } catch (err) {
    return createApiErrorResponse(err, "Typhoon Bulletin scraping execution failed")
  }
}
