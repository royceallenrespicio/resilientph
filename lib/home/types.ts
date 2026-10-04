export interface TyphoonBulletin {
  active: boolean
  message?: string
  title?: string
  issued_at?: string
  validity?: string
  pdf_url?: string
  details?: string[]
  track_image?: string
  location?: string
  movement?: string
  strength?: string
  forecast_positions?: string[]
  wind_signal?: Record<string, unknown> | null
  archive?: Array<{ title: string; url: string }>
}

export interface PagasaForecastItem {
  place: string
  condition: string
  caused_by: string
  impacts?: string
}

export interface PagasaWindCoastalItem {
  place: string
  speed: string
  direction: string
  coastal: string
}

export interface PagasaTcInfo {
  raw_text?: string
  rows?: string[]
}

export interface PagasaDailyWeather {
  issued_at: string
  synopsis: string
  tc_info?: PagasaTcInfo
  forecasts?: PagasaForecastItem[]
  wind_coastal?: PagasaWindCoastalItem[]
  temp_humidity?: Record<string, unknown> | null
  astronomy_tides?: Record<string, unknown> | null
}

export interface PagasaTemperatures {
  lowest_as_of: string
  lowest: Array<{ station: string; temp: string }>
  highest_as_of: string
  highest: Array<{ station: string; temp: string }>
}

export interface PagasaWeeklyOutlook {
  issued_at: string
  valid_until: string
  outlook: Array<{ period: string; content: string }>
}

export interface PagasaProvinceForecast {
  name: string
  day_forecast: {
    image: string
    description: string
    low: string
    high: string
    wind_speed: string
    direction: string
    coastal: string
  }
  night_forecast: {
    image: string
    description: string
    low: string
    high: string
    wind_speed: string
    direction: string
    coastal: string
  }
  extended_outlook: Array<{
    day: string
    image: string
    low: string
    high: string
    wind: string
    direction: string
    coastal: string
  }>
}

export interface PagasaRegionalForecast {
  region: string
  issued_at: string
  day_forecast: {
    image: string
    description: string
    low: string
    high: string
    wind_speed: string
    direction: string
    coastal: string
  }
  night_forecast: {
    image: string
    description: string
    low: string
    high: string
    wind_speed: string
    direction: string
    coastal: string
  }
  extended_outlook: Array<{
    day: string
    image: string
    low: string
    high: string
    wind: string
    direction: string
    coastal: string
  }>
  warnings: {
    rainfalls: string[]
    thunderstorms: string[]
    special: string[]
    gmma: string[]
  }
  provinces?: Record<string, PagasaProvinceForecast>
}
