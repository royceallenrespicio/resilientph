import { scrapeDailyWeather } from "./daily-weather"
import { scrapeRegionalForecasts } from "./regional-forecasts"
import { scrapeTemperatures } from "./temperatures"
import { scrapeWeeklyOutlook } from "./weekly-outlook"
import { scrapeTyphoonBulletin } from "./typhoon-bulletin"

export { scrapeDailyWeather } from "./daily-weather"
export { scrapeRegionalForecasts } from "./regional-forecasts"
export { scrapeTemperatures } from "./temperatures"
export { scrapeWeeklyOutlook } from "./weekly-outlook"
export { scrapeTyphoonBulletin } from "./typhoon-bulletin"

/**
 * Master scrape logic to run all sub-scrapers in parallel where possible
 */
export async function scrapeAllPagasa(force = false) {
  // Run all independent scrapers in parallel to prevent waterfalls (Vercel React Best Practices - async-parallel)
  const [daily, regional, temperatures, weekly, typhoon] = await Promise.all([
    scrapeDailyWeather(force),
    scrapeRegionalForecasts(force),
    scrapeTemperatures(force),
    scrapeWeeklyOutlook(force),
    scrapeTyphoonBulletin(force)
  ])
  
  return {
    daily,
    regional,
    temperatures,
    weekly,
    typhoon
  }
}
