import * as cheerio from "cheerio"

export function parseRegionalHtml(html: string, regionId: string) {
  const $ = cheerio.load(html)
  
  const region = $("h1").first().text().trim() || regionId.toUpperCase()
  const issuedText = $(".r-header").first().text().trim()
  const issued_at = issuedText.includes("Issued At:") 
    ? issuedText.split("Issued At:")[1].trim()
    : (issuedText.includes("Issued at:") ? issuedText.split("Issued at:")[1].trim() : issuedText)

  // Day forecast
  const dayDiv = $(".regional-forecast.day")
  const day_forecast = {
    image: dayDiv.find(".regional-icon").attr("src") || "",
    description: dayDiv.find(".description").text().trim(),
    low: dayDiv.find(".low").text().trim(),
    high: dayDiv.find(".high").text().trim(),
    wind_speed: dayDiv.find(".values-container div").eq(0).find("span").eq(1).text().trim(),
    direction: dayDiv.find(".values-container div").eq(1).find("span").eq(1).text().trim(),
    coastal: dayDiv.find(".values-container div").eq(2).find("span").eq(1).text().trim()
  }

  // Night forecast
  const nightDiv = $(".regional-forecast.night")
  const night_forecast = {
    image: nightDiv.find(".regional-icon").attr("src") || "",
    description: nightDiv.find(".description").text().trim(),
    low: nightDiv.find(".low").text().trim(),
    high: nightDiv.find(".high").text().trim(),
    wind_speed: nightDiv.find(".values-container div").eq(0).find("span").eq(1).text().trim(),
    direction: nightDiv.find(".values-container div").eq(1).find("span").eq(1).text().trim(),
    coastal: nightDiv.find(".values-container div").eq(2).find("span").eq(1).text().trim()
  }

  // Extended outlook
  const extended_outlook: Array<{
    day: string
    image: string
    low: string
    high: string
    wind: string
    direction: string
    coastal: string
  }> = []
  $(".outlook-item").each((_, item) => {
    const div = $(item)
    const day = div.find("span").first().text().trim()
    const image = div.find("img").attr("src") || ""
    const low = div.find(".low").text().trim()
    const high = div.find(".high").text().trim()
    const wind = div.find(".outlook-values div").eq(0).find("span").eq(1).text().trim()
    const direction = div.find(".outlook-values div").eq(1).find("span").eq(1).text().trim()
    const coastal = div.find(".outlook-values div").eq(2).find("span").eq(1).text().trim()
    extended_outlook.push({ day, image, low, high, wind, direction, coastal })
  })

  // Warnings
  const warnings: {
    rainfalls: string[]
    thunderstorms: string[]
    special: string[]
    gmma: string[]
  } = { rainfalls: [], thunderstorms: [], special: [], gmma: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFormattedText = (el: cheerio.Cheerio<any>) => {
    const htmlContent = el.html() || ""
    const withNewlines = htmlContent.replace(/<br\s*\/?>/gi, '\n')
    const text = cheerio.load(withNewlines).text().trim()
    return text.replace(/(?:\r?\n\s*){2,}/g, '\n\n')
  }

  $("#rainfalls div").each((_, div) => {
    warnings.rainfalls.push(getFormattedText($(div)))
  })
  $("#thunderstorms div").each((_, div) => {
    warnings.thunderstorms.push(getFormattedText($(div)))
  })
  $("#special-forecasts div").each((_, div) => {
    warnings.special.push(getFormattedText($(div)))
  })
  $("#gmma-forecasts div").each((_, div) => {
    warnings.gmma.push(getFormattedText($(div)))
  })

  // Fetch all provinces under this region
  const provinceOptions: Array<{ value: string; name: string; isDefault: boolean }> = []
  $("#provinces option").each((_, opt) => {
    const val = ($(opt).val() as string) || ""
    const name = $(opt).text().trim()
    const isSelected = $(opt).attr("selected") !== undefined
    if (val) {
      provinceOptions.push({ value: val, name, isDefault: isSelected })
    }
  })

  if (provinceOptions.length > 0 && !provinceOptions.some(p => p.isDefault)) {
    provinceOptions[0].isDefault = true
  }

  return {
    region,
    issued_at,
    day_forecast,
    night_forecast,
    extended_outlook,
    warnings,
    provinceOptions
  }
}
