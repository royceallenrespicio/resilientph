import L from "leaflet"
import { BoundaryLevel, RegionProperties, ProvinceProperties, MunicityProperties } from "@/lib/map/types"
import {
  getLeafletRegionStyle,
  getLeafletProvinceStyle,
  getLeafletMunicityStyle,
  leafletParStyle
} from "@/lib/map/layer-styles"
import { PAR_GEOJSON } from "@/lib/constants"

export interface SyncBoundaryLayersOptions {
  map: L.Map
  layerGroup: L.LayerGroup
  parLayerGroup: L.LayerGroup
  activeLevel: BoundaryLevel
  showBoundaries: boolean
  regionsGeoJson: GeoJSON.FeatureCollection | null
  provincesGeoJson: GeoJSON.FeatureCollection | null
  municitiesGeoJson: GeoJSON.FeatureCollection | null
  hoveredId: string | number | null
  setHoveredId: (id: string | number | null) => void
  setHoveredName: (name: string | null) => void
  onSelectRegion: (region: RegionProperties) => void
  onSelectProvince: (province: ProvinceProperties) => void
  onSelectMunicity: (municity: MunicityProperties) => void
}

export function syncParLayer(parLayerGroup: L.LayerGroup) {
  parLayerGroup.clearLayers()
  const parLayer = L.geoJSON(PAR_GEOJSON as GeoJSON.FeatureCollection, {
    style: () => leafletParStyle,
    interactive: false
  })
  parLayerGroup.addLayer(parLayer)
}

export function syncBoundaryLayers({
  layerGroup,
  activeLevel,
  showBoundaries,
  regionsGeoJson,
  provincesGeoJson,
  municitiesGeoJson,
  setHoveredId,
  setHoveredName,
  onSelectRegion,
  onSelectProvince,
  onSelectMunicity
}: SyncBoundaryLayersOptions) {
  layerGroup.clearLayers()

  if (!showBoundaries) return

  // 1. REGIONS LAYER
  if (regionsGeoJson) {
    const regionsLayer = L.geoJSON(regionsGeoJson, {
      style: () => {
        return getLeafletRegionStyle(activeLevel, false)
      },
      onEachFeature: (feature, layer) => {
        const props = (feature.properties || {}) as RegionProperties
        const name = props.ADM1_EN || props.ADM1_PCODE || "Region"
        const id = props.ADM1_PCODE || feature.id || name

        layer.on({
          mouseover: (e) => {
            const target = e.target as L.Path
            target.setStyle(getLeafletRegionStyle(activeLevel, true))
            if (activeLevel === "regions") {
              setHoveredId(id)
              setHoveredName(name)
            }
          },
          mouseout: (e) => {
            const target = e.target as L.Path
            target.setStyle(getLeafletRegionStyle(activeLevel, false))
            if (activeLevel === "regions") {
              setHoveredId(null)
              setHoveredName(null)
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            onSelectRegion(props)
          }
        })
      }
    })
    layerGroup.addLayer(regionsLayer)
  }

  // 2. PROVINCES LAYER
  if (provincesGeoJson && (activeLevel === "provinces" || activeLevel === "municities")) {
    const provincesLayer = L.geoJSON(provincesGeoJson, {
      style: () => getLeafletProvinceStyle(activeLevel, false),
      onEachFeature: (feature, layer) => {
        const props = (feature.properties || {}) as ProvinceProperties
        const name = props.ADM2_EN || props.ADM2_PCODE || "Province"
        const id = props.ADM2_PCODE || feature.id || name

        layer.on({
          mouseover: (e) => {
            const target = e.target as L.Path
            target.setStyle(getLeafletProvinceStyle(activeLevel, true))
            if (activeLevel === "provinces") {
              setHoveredId(id)
              setHoveredName(name)
            }
          },
          mouseout: (e) => {
            const target = e.target as L.Path
            target.setStyle(getLeafletProvinceStyle(activeLevel, false))
            if (activeLevel === "provinces") {
              setHoveredId(null)
              setHoveredName(null)
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            onSelectProvince(props)
          }
        })
      }
    })
    layerGroup.addLayer(provincesLayer)
  }

  // 3. MUNICIPALITIES / CITIES LAYER
  if (municitiesGeoJson && activeLevel === "municities") {
    const municitiesLayer = L.geoJSON(municitiesGeoJson, {
      style: () => getLeafletMunicityStyle(false),
      onEachFeature: (feature, layer) => {
        const props = (feature.properties || {}) as MunicityProperties
        const name = props.ADM3_EN || props.ADM3_PCODE || "Municipality"
        const id = props.ADM3_PCODE || feature.id || name

        layer.on({
          mouseover: (e) => {
            const target = e.target as L.Path
            target.setStyle(getLeafletMunicityStyle(true))
            setHoveredId(id)
            setHoveredName(name)
          },
          mouseout: (e) => {
            const target = e.target as L.Path
            target.setStyle(getLeafletMunicityStyle(false))
            setHoveredId(null)
            setHoveredName(null)
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            onSelectMunicity(props)
          }
        })
      }
    })
    layerGroup.addLayer(municitiesLayer)
  }
}
