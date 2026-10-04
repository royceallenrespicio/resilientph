/**
 * Scans GeoJSON geometries (Polygon/MultiPolygon) to extract the bounding box.
 * Returns the bounds in [[minLng, minLat], [maxLng, maxLat]] format.
 */
export function getGeometryBounds(geometry: unknown): [[number, number], [number, number]] | null {
  if (!geometry || typeof geometry !== "object") return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geom = (geometry as any).type === "Feature" ? (geometry as any).geometry : geometry;
  if (!geom || !("coordinates" in geom)) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traverse = (item: any) => {
    if (typeof item[0] === "number" && typeof item[1] === "number") {
      const [lng, lat] = item;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(item)) {
      for (const child of item) {
        traverse(child);
      }
    }
  };

  traverse(geom.coordinates);

  if (minLng === Infinity || minLat === Infinity) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

/**
 * Computes the center coordinates of a bounding box.
 */
export function getBoundsCentroid(bounds: [[number, number], [number, number]]): { latitude: number; longitude: number } {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2
  };
}

/**
 * Ray-casting point-in-polygon test.
 * Returns true if [lng, lat] falls inside a single polygon ring.
 */
function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Determines if a [lng, lat] point falls inside a GeoJSON Feature's
 * Polygon or MultiPolygon geometry using ray-casting.
 */
export function isPointInFeature(point: [number, number], feature: GeoJSON.Feature): boolean {
  const geom = feature?.geometry;
  if (!geom || !("coordinates" in geom)) return false;

  if (geom.type === "Polygon") {
    const coords = geom.coordinates as GeoJSON.Position[][];
    // Test outer ring (index 0); holes are ignored for admin boundary containment
    return pointInRing(point, coords[0]);
  }

  if (geom.type === "MultiPolygon") {
    const coords = geom.coordinates as GeoJSON.Position[][][];
    for (const polygon of coords) {
      if (pointInRing(point, polygon[0])) return true;
    }
    return false;
  }

  return false;
}

/**
 * Pre-computed bounding box entry for a single GeoJSON feature.
 * Enables fast spatial rejection before expensive ray-casting.
 */
export interface BBoxEntry {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
  feature: GeoJSON.Feature
}

export type BBoxIndex = BBoxEntry[]

/**
 * Builds a bounding-box spatial index from a GeoJSON FeatureCollection.
 * Call once after loading data, then reuse for fast point queries.
 */
export function buildBBoxIndex(collection: GeoJSON.FeatureCollection): BBoxIndex {
  const index: BBoxIndex = []
  for (const feature of collection.features) {
    const bounds = getGeometryBounds(feature)
    if (bounds) {
      const [[minLng, minLat], [maxLng, maxLat]] = bounds
      index.push({ minLng, maxLng, minLat, maxLat, feature })
    }
  }
  return index
}

/**
 * Finds the first feature in the spatial index that contains the given point.
 * Uses bbox pre-filtering to skip most features, then ray-casts only candidates.
 */
export function findContainingFeature(point: [number, number], index: BBoxIndex): GeoJSON.Feature | null {
  const [lng, lat] = point
  for (const entry of index) {
    // Fast AABB rejection — skip features whose bbox doesn't contain the point
    if (lng < entry.minLng || lng > entry.maxLng || lat < entry.minLat || lat > entry.maxLat) {
      continue
    }
    // Candidate passed bbox check — run the full ray-casting test
    if (isPointInFeature(point, entry.feature)) {
      return entry.feature
    }
  }
  return null
}

/**
 * Build a PCODE→centroid lookup map from a bbox index for O(1) centroid access.
 */
export function buildCentroidsMap(
  index: BBoxIndex,
  pcodeKey: string
): Map<string, { latitude: number; longitude: number }> {
  const map = new Map<string, { latitude: number; longitude: number }>()
  for (const entry of index) {
    const pcode = entry.feature?.properties?.[pcodeKey] as string | undefined
    if (pcode) {
      map.set(pcode, getBoundsCentroid([[entry.minLng, entry.minLat], [entry.maxLng, entry.maxLat]]))
    }
  }
  return map
}

