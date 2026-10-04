/**
 * Cron authentication helper.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env var is set.
 */

/** True when the request carries a valid CRON_SECRET bearer token. Always false if no secret is configured. */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}
