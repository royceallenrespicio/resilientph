export interface ContactNumber {
  label: string
  value: string
}

export interface ContactInfo {
  id: string
  name: string
  acronym: string
  category: "alert" | "responder" | "public"
  description: string
  numbers: ContactNumber[]
  website?: string
  color: string
}

export const EMERGENCY_CONTACTS: ContactInfo[] = [
  {
    id: "national-911",
    name: "National Emergency Hotline",
    acronym: "911",
    category: "responder",
    description: "Primary emergency response hotline for all police, fire, and medical incidents nationwide.",
    numbers: [
      { label: "Emergency Hotline", value: "911" }
    ],
    website: "https://www.911.gov.ph",
    color: "border-destructive/30 text-destructive bg-destructive/5 hover:border-destructive/50"
  },
  {
    id: "ndrrmc",
    name: "National Disaster Risk Reduction and Management Council",
    acronym: "NDRRMC",
    category: "alert",
    description: "National body responsible for disaster prevention, preparedness, response, and rehabilitation.",
    numbers: [
      { label: "Operations Center", value: "(02) 8911-5061" },
      { label: "Hotline 2", value: "(02) 8911-1406" },
      { label: "Hotline 3", value: "(02) 8912-5668" }
    ],
    website: "https://ndrrmc.gov.ph",
    color: "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
  },
  {
    id: "pagasa",
    name: "Philippine Atmospheric, Geophysical and Astronomical Services Administration",
    acronym: "PAGASA",
    category: "alert",
    description: "National weather agency providing flood alerts, tropical cyclone warnings, and meteorological forecasts.",
    numbers: [
      { label: "Weather Division", value: "(02) 8284-0800" },
      { label: "Flood Forecasting", value: "(02) 8929-4065" }
    ],
    website: "https://bagong.pagasa.dost.gov.ph",
    color: "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
  },
  {
    id: "phivolcs",
    name: "Philippine Institute of Volcanology and Seismology",
    acronym: "PHIVOLCS",
    category: "alert",
    description: "National agency for monitoring and predicting volcanic activity, earthquakes, and tsunamis.",
    numbers: [
      { label: "Operations Center", value: "(02) 8426-1468" },
      { label: "Seismology Div", value: "(02) 8929-9254" }
    ],
    website: "https://www.phivolcs.dost.gov.ph",
    color: "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
  },
  {
    id: "redcross",
    name: "Philippine Red Cross",
    acronym: "PRC",
    category: "responder",
    description: "Humanitarian organization providing disaster rescue operations, blood services, and community relief.",
    numbers: [
      { label: "PRC Hotline", value: "143" },
      { label: "Trunkline", value: "(02) 8790-2300" }
    ],
    website: "https://redcross.org.ph",
    color: "border-destructive/30 text-destructive bg-destructive/5 hover:border-destructive/50"
  },
  {
    id: "bfp",
    name: "Bureau of Fire Protection",
    acronym: "BFP",
    category: "responder",
    description: "Government service responsible for fire suppression, prevention, and emergency rescue operations.",
    numbers: [
      { label: "National Operations", value: "(02) 8426-0219" },
      { label: "Hotline 2", value: "(02) 8426-3812" }
    ],
    website: "https://bfp.gov.ph",
    color: "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
  },
  {
    id: "pnp",
    name: "Philippine National Police",
    acronym: "PNP",
    category: "responder",
    description: "Law enforcement agency providing security patrols, public safety checkpoints, and police assistance.",
    numbers: [
      { label: "Emergency Hotline", value: "117" },
      { label: "Hotline", value: "(02) 8722-0650" }
    ],
    website: "https://pnp.gov.ph",
    color: "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
  },
  {
    id: "pcg",
    name: "Philippine Coast Guard",
    acronym: "PCG",
    category: "responder",
    description: "Armed service monitoring maritime boundaries and executing search and rescue during floods and sea disasters.",
    numbers: [
      { label: "Command Center", value: "(02) 8527-8481" },
      { label: "Mobile Hotline", value: "0917-724-3682" }
    ],
    website: "https://www.coastguard.gov.ph",
    color: "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
  },
  {
    id: "mmda",
    name: "Metro Manila Development Authority",
    acronym: "MMDA",
    category: "public",
    description: "Metropolitan agency managing traffic control, metro flood management, and emergency response.",
    numbers: [
      { label: "Metrobase Hotline", value: "136" },
      { label: "Rescue Unit", value: "(02) 8882-4151" }
    ],
    website: "https://www.mmda.gov.ph",
    color: "border-secondary/30 text-secondary-foreground bg-secondary/20 hover:border-secondary/50"
  },
  {
    id: "doh",
    name: "Department of Health",
    acronym: "DOH",
    category: "public",
    description: "National health authority managing medical center responses, hospital alerts, and health hotlines.",
    numbers: [
      { label: "DOH Hotline", value: "(02) 8651-7800" },
      { label: "HEMB Operations", value: "(02) 8711-1001" }
    ],
    website: "https://doh.gov.ph",
    color: "border-secondary/30 text-secondary-foreground bg-secondary/20 hover:border-secondary/50"
  },
  {
    id: "dswd",
    name: "Department of Social Welfare and Development",
    acronym: "DSWD",
    category: "public",
    description: "Government agency distributing relief assistance, food packs, and managing temporary evacuations.",
    numbers: [
      { label: "Disaster Response", value: "(02) 8931-8101" }
    ],
    website: "https://www.dswd.gov.ph",
    color: "border-secondary/30 text-secondary-foreground bg-secondary/20 hover:border-secondary/50"
  }
]
