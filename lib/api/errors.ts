import { NextResponse } from "next/server"

/**
 * Creates a standardized JSON error response for API routes.
 * DRYs up the repeated error-handling pattern across scraper and data routes.
 */
export function createApiErrorResponse(
  err: unknown,
  context: string,
  status = 500
): NextResponse {
  console.error(`API ${context} error:`, err)
  const msg = err instanceof Error ? err.message : String(err)
  return NextResponse.json(
    { success: false, error: `${context}: ${msg}` },
    { status }
  )
}

/** Alias to createApiErrorResponse for codebase-wide consistency */
export const handleApiError = createApiErrorResponse

