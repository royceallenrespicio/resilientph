import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudLightning
} from "lucide-react"

// Map Open-Meteo codes to icons and text
export const getWeatherConfig = (code: number) => {
  if (code === 0) return { icon: Sun, text: "Clear Sky", color: "text-warning" }
  if (code >= 1 && code <= 3) return { icon: CloudSun, text: "Partly Cloudy", color: "text-info" }
  if (code === 45 || code === 48) return { icon: CloudFog, text: "Foggy", color: "text-muted-foreground" }
  if (code >= 51 && code <= 55) return { icon: CloudDrizzle, text: "Light Drizzle", color: "text-info" }
  if (code >= 61 && code <= 65) return { icon: CloudRain, text: "Rainy", color: "text-info" }
  if (code >= 80 && code <= 82) return { icon: CloudRainWind, text: "Heavy Showers", color: "text-info" }
  if (code >= 95) return { icon: CloudLightning, text: "Thunderstorm", color: "text-destructive font-semibold" }
  return { icon: Cloud, text: "Overcast", color: "text-muted-foreground" }
}
