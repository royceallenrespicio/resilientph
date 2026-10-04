import { Redis } from "@upstash/redis"

/**
 * Singleton client for Upstash Redis.
 * Automatically handles lazy initialization and fallback if environment variables are missing.
 */
let redisClient: Redis | null = null

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  try {
    redisClient = new Redis({
      url,
      token,
    })
    return redisClient
  } catch (error) {
    console.error("Failed to initialize Upstash Redis client:", error)
    return null
  }
}
