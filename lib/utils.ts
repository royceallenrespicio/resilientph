import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a Unix millisecond timestamp relative to current time.
 * E.g., "Just now", "5m ago", "2h ago", "3d ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Formats PAGASA weather text (often scraped in all-uppercase) into a readable
 * sentence-case format while preserving uppercase casing for abbreviations
 * (e.g. PAR, LPA) and title casing for regions, provinces, monsoons, and months.
 */
export function formatWeatherText(text: string | null | undefined): string {
  if (!text) return ""

  // Collapse multiple whitespaces first
  const cleanSpaces = text.replace(/\s+/g, " ").trim()

  // Detect if the string is all uppercase (excluding punctuation/numbers)
  const hasLetters = /[a-zA-Z]/.test(cleanSpaces)
  const isAllUppercase = hasLetters && cleanSpaces === cleanSpaces.toUpperCase()

  // If the text is NOT all uppercase, it is already nicely formatted (mixed case).
  // We should preserve its original formatting to avoid corrupting proper nouns.
  if (!isAllUppercase) {
    return cleanSpaces
  }

  // Otherwise, it's all uppercase, so we apply our sentence casing & capitalization rules.
  let cleaned = cleanSpaces.toLowerCase()

  // 1. Capitalize the first letter of each sentence, including after a colon (:)
  cleaned = cleaned.replace(/(^\s*|[.!?:]\s+)([a-z])/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase()
  })

  // 2. Capitalize known acronyms (uppercase them completely)
  const uppercaseWords = [
    "par", "lpa", "itcz", "ncr", "pagasa", "dost", "tc", "ndrrmc", "ocd", "barmm", "soccsksargen"
  ]
  uppercaseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    cleaned = cleaned.replace(regex, word.toUpperCase())
  })

  // 3. Capitalize weather monsoons, months, days of the week, and place names
  const properNouns = [
    // Monsoons
    "southwest monsoon", "northeast monsoon", "habagat", "amihan",
    // Months (EXCLUDING "may" to handle it contextually)
    "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december",
    // Days
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    // Major Areas and Regions
    "luzon", "visayas", "mindanao", "metro manila", "manila", "quezon city",
    // Country / Area of Responsibility
    "philippine area of responsibility", "philippine", "philippines", "filipino",
    // Storm categories
    "tropical cyclone", "tropical depression", "tropical storm", "severe tropical storm", "super typhoon",
    // Regions & Peninsulas & Sub-regions
    "cagayan valley", "ilocos region", "cordillera administrative region", "negros island region", "negros island", "negros", "zamboanga peninsula", "zamboanga", "bicol region", "davao region", "caraga region", "calabarzon", "mimaropa",
    "central luzon", "southern luzon", "northern luzon", "western visayas", "central visayas", "eastern visayas", "northern mindanao", "southern mindanao", "eastern mindanao", "western mindanao",
    // Provinces / Islands / Places frequently mentioned
    "apayao", "zambales", "bataan", "occidental mindoro", "oriental mindoro", "palawan", "kalayaan", "babuyan", "batanes", 
    "ilocos norte", "ilocos sur", "la union", "pangasinan", "cagayan", "isabela", "nueva vizcaya", "quirino", 
    "aurora", "tarlac", "nueva ecija", "pampanga", "bulacan", "cavite", "laguna", "batangas", "rizal", 
    "quezon", "marinduque", "romblon", "camarines norte", "camarines sur", "catanduanes", "albay", "sorsogon", 
    "masbate", "aklan", "antique", "capiz", "guimaras", "iloilo", "negros occidental", "negros oriental", 
    "cebu", "bohol", "siquijor", "eastern samar", "northern samar", "western samar", "samar", "leyte", 
    "southern leyte", "biliran", "zamboanga del norte", "zamboanga del sur", "zamboanga sibugay", "misamis occidental", 
    "misamis oriental", "lanao del norte", "bukidnon", "camiguin", "davao de oro", "davao del norte", "davao del sur", 
    "davao occidental", "davao oriental", "cotabato", "south cotabato", "sarangani", "sultan kudarat", "basilan", 
    "sulu", "tawi-tawi", "lanao del sur", "maguindanao", "agusan del norte", "agusan del sur", "surigao del norte", 
    "surigao del sur", "dinagat islands"
  ]

  properNouns.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi")
    const capitalized = phrase
      .split(" ")
      .map((w, idx) => {
        if (idx > 0 && ["del", "de", "of", "and", "the"].includes(w)) {
          return w
        }
        return w.charAt(0).toUpperCase() + w.slice(1)
      })
      .join(" ")
    cleaned = cleaned.replace(regex, capitalized)
  })

  // 4. Ensure "Today" is capitalized when standing alone or in phrases like "today (26 June):"
  cleaned = cleaned.replace(/\btoday\b/gi, "Today")

  // 5. Capitalize the month "May" only in date/time contexts to avoid capitalizing the verb "may"
  cleaned = cleaned.replace(/\b(\d{1,2})\s+may\b/gi, "$1 May")
  cleaned = cleaned.replace(/\bmay\s+(\d{1,2}|\d{4})\b/gi, "May $1")
  cleaned = cleaned.replace(/\b(early|mid|late)-may\b/gi, (match, p1) => `${p1}-May`)
  cleaned = cleaned.replace(/\bmonth\s+of\s+may\b/gi, "month of May")

  // 6. Capitalize letters following quotes, parentheses, and hyphens within names
  cleaned = cleaned.replace(/(["'“‘(])([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
  cleaned = cleaned.replace(/(\b[A-Z][a-z]+-)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())

  // 7. Capitalize dynamic cyclone names following keywords
  cleaned = cleaned.replace(/\bnamed\s+([a-z]+)\b/gi, (match, p1) => `named ${p1.charAt(0).toUpperCase() + p1.slice(1)}`)
  cleaned = cleaned.replace(/\b(cyclone|typhoon|storm|depression|bagyo)\s+([a-z]+)\b/gi, (match, p1, p2) => `${p1} ${p2.charAt(0).toUpperCase() + p2.slice(1)}`)

  return cleaned
}

