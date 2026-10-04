export const Intents = {
  getWeatherOutlook: (loc: string) => `Analyze the current weather forecast and 5-day outlook for ${loc}.`,
  getWeatherTrends: (loc: string) => `Analyze the 24-hour weather trends for ${loc}.`,
  getWeatherAQI: (loc: string) => `Analyze the current air quality index (AQI) and pollutant levels for ${loc}.`,
  getWeatherPagasa: () => `Analyze the latest official PAGASA daily weather forecast, including the synopsis, regional forecasts, coastal wind warnings, and any active tropical cyclone information (both inside and outside the PAR).`,
  getRegionalHazards: (loc: string) => `Analyze the regional weather forecast for ${loc}. What are the potential weather hazards or flood risks, and what precautions should local residents take?`,
  getEarthquakeAnalysis: (place: string, magnitude: string, depth: string, formattedTime: string, coords?: string, source?: string) => `Please analyze this specific earthquake event that I am currently looking at on the map:
- Location: ${place}
- Magnitude: ${magnitude}
- Depth: ${depth}km
- Time: ${formattedTime}
${coords ? `- Coordinates: ${coords}\n` : ""}${source ? `- Source: ${source}\n` : ""}
Treat this precise data as factual and real (do not declare it missing or fake). Based on this data, what are the details, local hazards, and general safety protocols for this area?`,
  getRegionalProfiling: (locationName: string, parentContext?: string) => `Let's discuss the regional geological characteristics, environmental hazard profile, climate patterns, and local disaster mitigation strategies for ${locationName}${parentContext ? `, ${parentContext}` : ""}, Philippines.`,
  getIncidentAnalysis: (title: string, lat: string, lng: string, timeStr: string, description: string) => `Let's discuss the community incident report for ${title} at location coordinates (${lat}, ${lng}). It was reported on ${timeStr}. Notes: ${description}. What are the hazard risks, and local action steps?`,
  getTyphoonAnalysis: (stormName: string) => `Analyze the active tropical cyclone ${stormName} currently inside the Philippine Area of Responsibility (PAR). Based on the latest PAGASA bulletin, summarize the storm's intensity, wind signal areas, affected regions, and the recommended safety actions for residents in the Philippines.`
}
