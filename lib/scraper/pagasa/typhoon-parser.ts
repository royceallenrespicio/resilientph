import * as cheerio from "cheerio"

export interface WindSignal {
  signal_number: number
  areas: Record<string, string[]>
  meteorological_conditions: string[]
  impacts: string[]
  precautionary_measures: string[]
  what_to_do: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWindSignals(tab: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  const signal_panel = tab.find(".panel:contains('Wind Signal')")
  if (signal_panel.length === 0) {
    return JSON.stringify({
      active: false,
      message: "No active Tropical Cyclone Wind Signal."
    })
  }

  const table = signal_panel.find("table")
  if (table.length === 0) {
    const text = signal_panel.find(".panel-body").text().trim().replace(/\s+/g, " ")
    return JSON.stringify({
      active: false,
      message: text || "No active Tropical Cyclone Wind Signal."
    })
  }

  const signals: WindSignal[] = []

  table.find("thead").each((i, theadEl) => {
    const thead = $(theadEl)
    const th = thead.find("th")
    if (th.length === 0) return

    let signalNumber: number | null = null
    const thClass = th.attr("class") || ""
    const classMatch = thClass.match(/signalno(\d+)/i)
    if (classMatch) {
      signalNumber = parseInt(classMatch[1], 10)
    }

    const img = th.find("img")
    if (!signalNumber && img.length > 0) {
      const src = img.attr("src") || ""
      const srcMatch = src.match(/tcws(\d+)\.png/i)
      if (srcMatch) {
        signalNumber = parseInt(srcMatch[1], 10)
      }
    }

    const thText = th.text().trim().replace(/\s+/g, " ")
    if (!signalNumber) {
      const textMatch = thText.match(/(?:Signal\s+no\.|Signal\s+number)\s*(\d+)/i)
      if (textMatch) {
        signalNumber = parseInt(textMatch[1], 10)
      }
    }

    if (!signalNumber) {
      signalNumber = i + 1
    }

    const tbody = thead.next("tbody")
    if (tbody.length === 0) return

    const signalInfo: WindSignal = {
      signal_number: signalNumber,
      areas: {},
      meteorological_conditions: [],
      impacts: [],
      precautionary_measures: [],
      what_to_do: []
    }

    tbody.find("tr").each((_, trEl) => {
      const tr = $(trEl)
      const cols = tr.find("td")
      if (cols.length < 2) return

      const label = $(cols[0]).text().trim().replace(/\s+/g, " ")
      const contentCol = $(cols[1])

      if (/affected\s+areas/i.test(label)) {
        contentCol.find("ul > li").each((_, liEl) => {
          const li = $(liEl)
          const islandGroup = li.find("strong").first().text().trim().replace(/:$/, "")
          if (islandGroup) {
            const localities: string[] = []
            li.find("ul > li").each((_, subLiEl) => {
              const subLi = $(subLiEl)
              const txt = subLi.text().trim().replace(/\s+/g, " ")
              if (txt && txt !== "-") {
                localities.push(txt)
              }
            })
            if (localities.length > 0) {
              signalInfo.areas[islandGroup] = localities
            }
          }
        })
      } else if (/meteorological/i.test(label)) {
        contentCol.find("ul > li").each((_, liEl) => {
          const txt = $(liEl).text().trim().replace(/\s+/g, " ")
          if (txt) signalInfo.meteorological_conditions.push(txt)
        })
      } else if (/impact/i.test(label)) {
        contentCol.find("ul > li").each((_, liEl) => {
          const txt = $(liEl).text().trim().replace(/\s+/g, " ")
          if (txt) signalInfo.impacts.push(txt)
        })
      } else if (/precautionary/i.test(label)) {
        contentCol.find("ul > li").each((_, liEl) => {
          const txt = $(liEl).text().trim().replace(/\s+/g, " ")
          if (txt) signalInfo.precautionary_measures.push(txt)
        })
      } else if (/what\s+to\s+do/i.test(label)) {
        contentCol.find("ul > li").each((_, liEl) => {
          const txt = $(liEl).text().trim().replace(/\s+/g, " ")
          if (txt) signalInfo.what_to_do.push(txt)
        })
      }
    })

    signals.push(signalInfo)
  })

  if (signals.length === 0) {
    return JSON.stringify({
      active: false,
      message: "No active Tropical Cyclone Wind Signal."
    })
  }

  return JSON.stringify({
    active: true,
    signals
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseTyphoonHtml(html: string): any[] {
  const $ = cheerio.load(html)
  
  // Find all panels linked in nav-tabs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const panels: cheerio.Cheerio<any>[] = []
  
  $(".nav-tabs a.swb").each((_, a) => {
    const href = $(a).attr("href")
    if (href && href.startsWith("#")) {
      const panelEl = $(href)
      if (panelEl.length > 0) {
        panels.push(panelEl)
      }
    }
  })

  // If no nav-tabs found, fallback to the single active tab panel or #tcwb-1
  if (panels.length === 0) {
    const activePanel = $(".tab-pane.active, #tcwb-1")
    if (activePanel.length > 0) {
      panels.push(activePanel)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulletins: any[] = []

  for (const panel of panels) {
    const title = panel.find("h3").first().text().trim().replace(/\s+/g, " ")
    if (
      !title ||
      title.toLowerCase().includes("no active") ||
      title.toLowerCase().includes("walang") ||
      title.toLowerCase().includes("inactive")
    ) {
      continue // Skip inactive/empty panels
    }

    const issuedAtText = panel.find("h5:contains('Issued at')").text().trim().replace(/\s+/g, " ")
    const issued_at = issuedAtText.replace(/Issued at/i, "").trim()
    const validity = panel.find("h5:contains('Valid for broadcast')").text().trim().replace(/\s+/g, " ")

    const pdf_url = panel.find("a[href$='.pdf']").first().attr("href") || ""

    const details: string[] = []
    panel.find("h5 + ul > li, .col-md-6 > ul > li").each((_, li) => {
      if ($(li).closest(".panel").length === 0) {
        const text = $(li).text().trim().replace(/\s+/g, " ")
        if (text) {
          details.push(text)
        }
      }
    })

    const track_image = panel.find("img.image-preview, img[src*='track_']").attr("src") || ""

    const eye_panel = panel.find(".panel:contains('Location of Eye/center'), .panel:contains('Location')")
    const location = eye_panel.find(".panel-body").text().trim().replace(/\s+/g, " ")

    const movement_panel = panel.find(".panel:contains('Movement')")
    const movement = movement_panel.find(".panel-body").text().trim().replace(/\s+/g, " ")

    const strength_panel = panel.find(".panel:contains('Strength')")
    const strength = strength_panel.find(".panel-body").text().trim().replace(/\s+/g, " ")

    const forecast_positions: string[] = []
    const forecast_panel = panel.find(".panel:contains('Forecast Position')")
    forecast_panel.find(".panel-body ul li").each((_, li) => {
      const posText = $(li).text().trim().replace(/\s+/g, " ")
      if (posText) forecast_positions.push(posText)
    })

    const wind_signal = parseWindSignals(panel, $)

    const archive: Array<{ title: string; url: string }> = []
    const archive_panel = panel.find(".panel:contains('Bulletin Archive')")
    archive_panel.find(".panel-body ul li a").each((_, a) => {
      archive.push({
        title: $(a).text().trim(),
        url: $(a).attr("href") || ""
      })
    })

    bulletins.push({
      active: true,
      title,
      issued_at,
      validity,
      pdf_url,
      details,
      track_image,
      location,
      movement,
      strength,
      forecast_positions,
      wind_signal,
      archive
    })
  }

  return bulletins
}
