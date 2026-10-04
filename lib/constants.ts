/**
 * Global site and mapping configurations for ResilientPH.
 */

// Centralized Site URL configuration (explicit URL > Vercel production domain > Vercel deployment URL > placeholder)
const VERCEL_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || (VERCEL_HOST ? `https://${VERCEL_HOST}` : "https://resilientph.local")

// Centralized Map API Key configuration
export const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || ""

// Centralized CARTO Voyager raster tile configuration
export const CARTO_VOYAGER_URL = CARTO_API_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`
  : "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'


// PAR (Philippine Area of Responsibility) configuration
// [minLng, minLat, maxLng, maxLat]
export const PAR_BOUNDS: [number, number, number, number] = [105.0, -2.0, 145.0, 32.0]

export const PAR_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.0, 25.0],
            [135.0, 25.0],
            [135.0, 5.0],
            [115.0, 5.0],
            [115.0, 15.0],
            [120.0, 21.0],
            [120.0, 25.0]
          ]
        ]
      },
      properties: {
        name: "Philippine Area of Responsibility"
      }
    }
  ]
}

// External PAGASA weather radar portal URL
export const PAGASA_PORTAL_URL = "https://www.panahon.gov.ph/"

// External PAGASA interactive hazard heatmap warning portal URL
export const PAGASA_IHEATMAP_URL = "https://iheatmap.pagasa.dost.gov.ph/"

// Philippine geographic boundary overlay GeoJSON resources
export const PH_REGIONS_GEOJSON_URL =
  "/geojson/regions.json"

export const PH_PROVINCES_GEOJSON_URL_PREFIX =
  "https://cdn.jsdelivr.net/gh/faeldon/philippines-json-maps@master/2019/geojson/provinces/lowres/provinces-region-"

export const PH_MUNICITIES_GEOJSON_URL_PREFIX =
  "https://cdn.jsdelivr.net/gh/faeldon/philippines-json-maps@master/2019/geojson/municties/lowres/municities-province-"

// PAGASA Scraper URLs
export const DAILY_WEATHER_URL = "https://bagong.pagasa.dost.gov.ph/weather"
export const REGIONAL_FORECAST_URL_PREFIX = "https://bagong.pagasa.dost.gov.ph/regional-forecast"
export const TEMPERATURES_URL = "https://bagong.pagasa.dost.gov.ph/weather/low-high-temperature"
export const WEEKLY_OUTLOOK_URL = "https://bagong.pagasa.dost.gov.ph/weather/weather-outlook-weekly"
export const REGIONAL_API_BASE_URL = "https://bagong.pagasa.dost.gov.ph/api/regional"
export const TYPHOON_BULLETIN_URL = "https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin"
export const REGIONS = ["ncrprsd", "nlprsd", "slprsd", "visprsd", "minprsd"]

// PHIVOLCS Earthquake URLs
export const PHIVOLCS_EARTHQUAKES_URL = "https://earthquake.phivolcs.dost.gov.ph/"

// GDACS API URLs
export const GDACS_API_BASE_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"
export const GDACS_REPORT_URL_PREFIX = "https://www.gdacs.org/report.aspx"
