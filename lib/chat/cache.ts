import { getRedisClient } from "@/lib/upstash/redis"

interface MemoryCacheEntry {
  content: string
  expiresAt: number
}

// In-memory fallback cache
const localChatCache = new Map<string, MemoryCacheEntry>()
const PURGE_INTERVAL_MS = 60_000
let lastPurge = Date.now()

function purgeExpiredLocalCache(): void {
  const now = Date.now()
  if (now - lastPurge < PURGE_INTERVAL_MS) return
  lastPurge = now
  for (const [key, entry] of localChatCache) {
    if (now >= entry.expiresAt) {
      localChatCache.delete(key)
    }
  }
}

/**
 * Normalizes a user chat message into a canonical cache key.
 * Strips out extraneous punctuation and extra whitespace.
 */
export function normalizeChatQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, "") // Keep alphanumeric and accented/filipino chars
    .replace(/\s+/g, " ")
}

/**
 * Default cache TTL: 5 minutes (300 seconds).
 * Ensures dynamic hazard/weather data remains fresh while eliminating duplicate LLM requests.
 */
export const DEFAULT_CHAT_CACHE_TTL_SECONDS = 300

/**
 * Attempts to retrieve a cached AI response for a normalized query.
 */
export async function getCachedChatResponse(queryKey: string): Promise<string | null> {
  if (!queryKey) return null

  const redis = getRedisClient()
  if (redis) {
    try {
      const redisKey = `chat:cache:${queryKey}`
      const cached = await redis.get<string>(redisKey)
      if (cached && typeof cached === "string") {
        return cached
      }
    } catch (err) {
      console.warn("Upstash Redis chat cache lookup failed, falling back to local memory:", err)
    }
  }

  // Local Memory Cache Fallback
  purgeExpiredLocalCache()
  const entry = localChatCache.get(queryKey)
  if (entry) {
    if (Date.now() < entry.expiresAt) {
      return entry.content
    }
    localChatCache.delete(queryKey)
  }

  return null
}

/**
 * Caches an AI response for a normalized query with an expiration time.
 */
export async function setCachedChatResponse(
  queryKey: string,
  content: string,
  ttlSeconds: number = DEFAULT_CHAT_CACHE_TTL_SECONDS
): Promise<void> {
  if (!queryKey || !content) return

  const redis = getRedisClient()
  if (redis) {
    try {
      const redisKey = `chat:cache:${queryKey}`
      await redis.set(redisKey, content, { ex: ttlSeconds })
      return
    } catch (err) {
      console.warn("Upstash Redis chat cache set failed, using local memory fallback:", err)
    }
  }

  // Local Memory Fallback
  localChatCache.set(queryKey, {
    content,
    expiresAt: Date.now() + ttlSeconds * 1000
  })
}
