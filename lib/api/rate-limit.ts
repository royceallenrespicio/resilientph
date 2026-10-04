/**
 * Hybrid rate limiter for API routes.
 * Uses Upstash Redis if configured (for serverless), falls back to an in-memory Map for local development.
 */

import { getRedisClient } from "@/lib/upstash/redis"

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store fallback
const localStore = new Map<string, RateLimitEntry>()

const PURGE_INTERVAL_MS = 60_000
let lastPurge = Date.now()

function purgeExpired(): void {
  const now = Date.now()
  if (now - lastPurge < PURGE_INTERVAL_MS) return
  lastPurge = now
  for (const [key, entry] of localStore) {
    if (now >= entry.resetAt) localStore.delete(key)
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number
  /** Time window in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

const redis = getRedisClient()

/**
 * Checks and increments the rate limit counter for a given key.
 * Returns whether the request is allowed and how many requests remain.
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (redis) {
    try {
      const now = Date.now()
      const redisKey = `ratelimit:${key}`
      const windowSeconds = Math.ceil(config.windowMs / 1000)
      
      // We can use an atomic INCR operation and EXPIRE in redis
      const tx = redis.multi()
      tx.incr(redisKey)
      tx.ttl(redisKey)
      const results = await tx.exec()
      
      const count = results[0] as number
      const ttl = results[1] as number // -1 if no expiry, -2 if key doesn't exist
      
      let resetAt = now + config.windowMs
      
      if (count === 1 || ttl < 0) {
        // First request or expiration not set
        await redis.expire(redisKey, windowSeconds)
      } else {
        resetAt = now + (ttl * 1000)
      }
      
      if (count > config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt }
      }
      
      return { allowed: true, remaining: config.maxRequests - count, resetAt }
    } catch (error) {
      console.warn("Redis rate limiting failed, falling back to local memory.", error)
      // Fall through to localStore
    }
  }

  // Local Memory Fallback
  purgeExpired()

  const now = Date.now()
  const existing = localStore.get(key)

  if (!existing || now >= existing.resetAt) {
    localStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  if (existing.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { allowed: true, remaining: config.maxRequests - existing.count, resetAt: existing.resetAt }
}

/**
 * Extracts a client identifier from request headers for rate limiting.
 * Prefers X-Vercel-Forwarded-For to prevent client header spoofing on Vercel.
 */
export function getClientIp(request: Request): string {
  // Vercel specific proxy header which cannot be spoofed by client
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for")
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim()

  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()

  return request.headers.get("x-real-ip") || "anonymous"
}
