export type BoundaryLevel = "regions" | "provinces" | "municities"

export interface RegionProperties {
  Shape_Leng: number
  Shape_Area: number
  ADM1_EN: string
  ADM1_PCODE: string
  ADM1_REF: string
  ADM1ALT1EN: string
  ADM1ALT2EN: string
  ADM0_EN: string
  ADM0_PCODE: string
  date: string
  validOn: string
  validTo: string
}

export interface ProvinceProperties {
  Shape_Leng: number
  Shape_Area: number
  ADM2_EN: string
  ADM2_PCODE: string
  ADM2_REF: string | null
  ADM2ALT1EN: string | null
  ADM2ALT2EN: string | null
  ADM1_EN: string
  ADM1_PCODE: string
  ADM0_EN: string
  ADM0_PCODE: string
  date: string
  validOn: string
}

export interface MunicityProperties {
  Shape_Leng: number
  Shape_Area: number
  ADM3_EN: string
  ADM3_PCODE: string
  ADM3_REF: string | null
  ADM3ALT1EN: string | null
  ADM3ALT2EN: string | null
  ADM2_EN: string
  ADM2_PCODE: string
  ADM1_EN: string
  ADM1_PCODE: string
  ADM0_EN: string
  ADM0_PCODE: string
  date: string
  validOn: string
}

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection"
  features: GeoJSON.Feature[]
}
