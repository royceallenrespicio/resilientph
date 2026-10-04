import * as cheerio from "cheerio"

export function parseDailyWeatherHtml(html: string) {
  const $ = cheerio.load(html)

  // Parsed Fields
  const issuedAtText = $(".issue").first().text().trim() || $(".validity").first().text().trim()
  const issued_at = issuedAtText.replace(/Issued at:|Issued At:/gi, "").trim()

  const synopsis = $(".panel:contains('Synopsis') .panel-body, .panel-heading:contains('Synopsis') + .panel-body").text().trim() ||
    $(".panel-body").first().text().trim()

  // TC info
  const tc_info: { raw_text: string; rows: string[] } = { raw_text: "", rows: [] }
  const tcTitle = $("h3:contains('TC Information'), h3:contains('Tropical Cyclone')")
  if (tcTitle.length > 0) {
    let nextElem = tcTitle.next()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tcTables: any[] = []
    while (nextElem.length > 0 && nextElem[0].name !== "h3") {
      if (nextElem[0].name === "table") {
        tcTables.push(nextElem[0])
      } else {
        // Check for nested tables inside panels/divs
        nextElem.find("table").each((_, tbl) => {
          tcTables.push(tbl)
        })
      }
      nextElem = nextElem.next()
    }

    if (tcTables.length > 0) {
      const rawTexts: string[] = []
      tcTables.forEach((table) => {
        const $table = $(table)
        const tableText = $table.text().trim().replace(/\s+/g, " ")
        if (tableText) {
          rawTexts.push(tableText)
        }
        $table.find("tr").each((_, tr) => {
          const rowText = $(tr).text().trim().replace(/\s+/g, " ")
          if (rowText) {
            tc_info.rows.push(rowText)
          }
        })
      })
      tc_info.raw_text = rawTexts.join(" | ")
    } else {
      // Fallback: If no tables were found, grab any text paragraphs/divs in the section
      let textContent = ""
      let nextElemText = tcTitle.next()
      while (nextElemText.length > 0 && nextElemText[0].name !== "h3") {
        // Skip script/style tags if any
        if (nextElemText[0].name !== "script" && nextElemText[0].name !== "style") {
          textContent += " " + nextElemText.text().trim().replace(/\s+/g, " ")
        }
        nextElemText = nextElemText.next()
      }
      const cleanedText = textContent.trim()
      if (cleanedText) {
        tc_info.raw_text = cleanedText
        tc_info.rows = [cleanedText]
      }
    }
  }

  // Forecasts
  const forecasts: Array<{ place: string; condition: string; caused_by: string; impacts: string }> = []
  const forecastTable = $("h3:contains('Forecast Weather Conditions')").nextAll("table").first()
  if (forecastTable.length > 0) {
    forecastTable.find("tbody tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 4) {
        forecasts.push({
          place: $(tds[0]).text().trim(),
          condition: $(tds[1]).text().trim(),
          caused_by: $(tds[2]).text().trim(),
          impacts: $(tds[3]).text().trim()
        })
      }
    })
  }

  // Wind and Coastal
  const wind_coastal: Array<{ place: string; speed: string; direction: string; coastal: string }> = []
  const windTable = $("h3:contains('Forecast Wind')").nextAll("table").first()
  if (windTable.length > 0) {
    windTable.find("tbody tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 4) {
        wind_coastal.push({
          place: $(tds[0]).text().trim(),
          speed: $(tds[1]).text().trim(),
          direction: $(tds[2]).text().trim(),
          coastal: $(tds[3]).text().trim()
        })
      }
    })
  }

  // Temp & Humidity extremes
  const temp_humidity: {
    temp_max?: string
    temp_max_time?: string
    temp_min?: string
    temp_min_time?: string
    humidity_max?: string
    humidity_max_time?: string
    humidity_min?: string
    humidity_min_time?: string
  } = {}
  const tempTable = $("h3:contains('Temperature and Relative Humidity')").nextAll("table").first()
  if (tempTable.length > 0) {
    tempTable.find("tbody tr").each((_, tr) => {
      const tds = $(tr).find("td")
      if (tds.length >= 5) {
        const type = $(tds[0]).text().trim()
        if (type.includes("Temperature")) {
          temp_humidity.temp_max = $(tds[1]).text().trim()
          temp_humidity.temp_max_time = $(tds[2]).text().trim()
          temp_humidity.temp_min = $(tds[3]).text().trim()
          temp_humidity.temp_min_time = $(tds[4]).text().trim()
        } else if (type.includes("Humidity")) {
          temp_humidity.humidity_max = $(tds[1]).text().trim()
          temp_humidity.humidity_max_time = $(tds[2]).text().trim()
          temp_humidity.humidity_min = $(tds[3]).text().trim()
          temp_humidity.humidity_min_time = $(tds[4]).text().trim()
        }
      }
    })
  }

  // Astronomy / Tides
  const astronomy_tides: { raw: string[] } = { raw: [] }
  const tidesTable = $("h3:contains('Tides and Astronomical Information')").nextAll("table").first()
  if (tidesTable.length > 0) {
    tidesTable.find("tbody tr").each((_, tr) => {
      astronomy_tides.raw.push($(tr).text().trim().replace(/\s+/g, " "))
    })
  }

  return {
    issued_at,
    synopsis,
    tc_info,
    forecasts,
    wind_coastal,
    temp_humidity,
    astronomy_tides
  }
}
