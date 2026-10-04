export interface EarthquakeEvent {
  id: string
  magnitude: number
  place: string
  time: number
  depth: number
  url: string
  latitude: number
  longitude: number
  source?: 'usgs' | 'phivolcs'
}

export interface USGSFeature {
  id: string
  properties: {
    mag: number
    place: string
    time: number
    url: string
  }
  geometry: {
    coordinates: number[]
  }
}

export const USGS_CONFIG = {
  EARTHQUAKE_API_BASE_URL: "https://earthquake.usgs.gov/fdsnws/event/1/query"
}

/** Philippine bounding box for earthquake queries */
export const PH_BBOX = {
  minLatitude: 4.5,
  maxLatitude: 21.5,
  minLongitude: 116.0,
  maxLongitude: 127.0,
}

/**
 * Builds a USGS earthquake query URL with the PH bounding box.
 * Centralizes the URL construction so it isn't duplicated across hooks.
 */
export function buildUSGSQueryUrl(options: {
  startTime: string
  minMagnitude?: number
}): string {
  const { startTime, minMagnitude = 3.0 } = options
  return (
    `${USGS_CONFIG.EARTHQUAKE_API_BASE_URL}?format=geojson` +
    `&starttime=${startTime}` +
    `&minmagnitude=${minMagnitude}` +
    `&minlatitude=${PH_BBOX.minLatitude}` +
    `&maxlatitude=${PH_BBOX.maxLatitude}` +
    `&minlongitude=${PH_BBOX.minLongitude}` +
    `&maxlongitude=${PH_BBOX.maxLongitude}`
  )
}

/**
 * Parses a USGS GeoJSON query response into standardized EarthquakeEvent objects.
 * Supports optional limit slicing (defaults to undefined, which parses all).
 */
export function parseUSGSResponse(data: unknown, limit?: number): EarthquakeEvent[] {
  const dataObj = data as { features?: USGSFeature[] }
  if (!dataObj || !dataObj.features || !Array.isArray(dataObj.features)) return []
  
  const features = limit !== undefined ? dataObj.features.slice(0, limit) : dataObj.features
  
  return features.map((f) => ({
    id: f.id,
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    depth: f.geometry.coordinates[2],
    url: f.properties.url,
    latitude: f.geometry.coordinates[1],
    longitude: f.geometry.coordinates[0],
    source: 'usgs' as const
  }))
}


