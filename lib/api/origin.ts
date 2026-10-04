/**
 * CSRF origin validation for state-changing API routes.
 */

import { SITE_URL } from "@/lib/constants"

/**
 * True when the request has no Origin header (non-browser/same-origin GET-like call), or when its Origin
 * matches the host the request was actually sent to, or the configured SITE_URL.
 * Comparing against the request host keeps production, preview and custom domains working without extra config.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  if (origin === SITE_URL) return true

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
