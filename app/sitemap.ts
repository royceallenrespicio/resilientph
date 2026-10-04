import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL
  const routes = ["", "/chat", "/map", "/pagasa", "/emergency", "/login", "/signup"]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: route === "" || route === "/map" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : route === "/map" || route === "/chat" ? 0.8 : 0.5,
  }))
}
