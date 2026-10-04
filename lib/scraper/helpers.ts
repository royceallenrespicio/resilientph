import { createHash } from "crypto"
import { Agent, fetch as undiciFetch } from "undici"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * Hosts that serve an incomplete TLS certificate chain (public, read-only government data).
 * Certificate verification is skipped for these hosts only; every other request stays fully verified.
 */
const LENIENT_TLS_HOSTS = new Set(["earthquake.phivolcs.dost.gov.ph"])

const lenientTlsAgent = new Agent({ connect: { rejectUnauthorized: false } })

interface GlobalScraperCache {
  data: Record<string, unknown>
  status: Record<string, ScrapeStatus>
}

declare global {
  var _scraperCache: GlobalScraperCache | undefined
}

const globalCache: GlobalScraperCache = globalThis._scraperCache || {
  data: {},
  status: {}
}

if (!globalThis._scraperCache) {
  globalThis._scraperCache = globalCache
}

/**
 * Computes a SHA-256 hash of a string to detect if contents have changed.
 */
export function getHash(data: string): string {
  return createHash("sha256").update(data).digest("hex")
}

/**
 * Writes data to in-memory JSON cache as a database fallback.
 */
export function writeLocalCache(filename: string, data: unknown): void {
  try {
    globalCache.data[filename] = JSON.parse(JSON.stringify(data))
  } catch (err) {
    console.error(`Failed to write local cache for ${filename}:`, err)
  }
}

/**
 * Reads data from in-memory cache. Returns null if missing/corrupt.
 */
export function readLocalCache<T>(filename: string): T | null {
  try {
    const content = globalCache.data[filename]
    if (content === undefined) return null
    return content as T
  } catch (err) {
    console.error(`Failed to read local cache for ${filename}:`, err)
    return null
  }
}

interface ScrapeStatus {
  id: string
  url: string
  html_hash: string
  last_scraped_at: string
}

/**
 * Updates the scraping status in the in-memory cache.
 */
export function writeLocalStatus(id: string, url: string, hash: string, lastScrapedAt: string): void {
  try {
    globalCache.status[id] = { id, url, html_hash: hash, last_scraped_at: lastScrapedAt }
  } catch (err) {
    console.error(`Failed to write local status for ${id}:`, err)
  }
}

/**
 * Reads the scraping status of a specific scraper from the in-memory cache.
 */
export function readLocalStatus(id: string): ScrapeStatus | null {
  try {
    return globalCache.status[id] || null
  } catch {
    return null
  }
}

/**
 * Fetches HTML from a URL with browser-like headers to prevent getting blocked.
 */
export async function fetchHtml(url: string): Promise<string> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  }

  const response = LENIENT_TLS_HOSTS.has(new URL(url).hostname)
    ? await undiciFetch(url, { headers, dispatcher: lenientTlsAgent })
    : await fetch(url, { headers, cache: "no-store" })

  if (!response.ok) {
    throw new Error(`HTTP fetch error ${response.status}: ${response.statusText} for ${url}`)
  }

  return response.text()
}


/**
 * Checks if a scraper is rate-limited based on its last scraped time.
 * Default limit is 5 minutes (300,000 milliseconds).
 */
export function isRateLimited(lastScrapedAtStr: string | null | undefined, limitMs = 300000): boolean {
  if (!lastScrapedAtStr) return false
  const lastScraped = new Date(lastScrapedAtStr).getTime()
  if (isNaN(lastScraped)) return false
  const timePassed = Date.now() - lastScraped
  return timePassed < limitMs
}


/**
 * Updates scraping status inside Supabase and local file system caches
 */
export async function updateScrapeStatus(id: string, url: string, hash: string, time: string) {
  const supabase = createAdminClient()
  try {
    await supabase.from("scrape_status").upsert({
      id,
      url,
      html_hash: hash,
      last_scraped_at: time,
      updated_at: time
    })
  } catch (err) {
    console.warn(`Could not update database status for ${id}:`, err)
  }
  // Always update local status file as fallback
  writeLocalStatus(id, url, hash, time)
}

