import { weatherTool } from "./weather"
import { earthquakeTool } from "./earthquakes"
import { floodTool } from "./flood"
import { marineTool } from "./marine"
import { airQualityTool } from "./air-quality"
import { seasonalTool } from "./seasonal"
import { historicalWeatherTool } from "./historical-weather"
import { historicalForecastTool } from "./historical-forecast"
import { pagasaForecastTool } from "./pagasa-forecast"
import { phivolcsEarthquakesTool } from "./phivolcs-earthquakes"
import { communityIncidentsTool, createCommunityReportTool } from "./incidents"

export const tools = [
  weatherTool,
  earthquakeTool,
  floodTool,
  marineTool,
  airQualityTool,
  seasonalTool,
  historicalWeatherTool,
  historicalForecastTool,
  pagasaForecastTool,
  phivolcsEarthquakesTool,
  communityIncidentsTool,
  createCommunityReportTool
]

export {
  weatherTool,
  earthquakeTool,
  floodTool,
  marineTool,
  airQualityTool,
  seasonalTool,
  historicalWeatherTool,
  historicalForecastTool,
  pagasaForecastTool,
  phivolcsEarthquakesTool,
  communityIncidentsTool,
  createCommunityReportTool
}
