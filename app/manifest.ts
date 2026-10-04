import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ResilientPH Disaster Preparedness Portal",
    short_name: "ResilientPH",
    description: "Real-time weather tracking, geological hazard monitoring, active disaster alerts, and AI-assisted emergency preparedness planning for the Philippines.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/google-gemini-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
