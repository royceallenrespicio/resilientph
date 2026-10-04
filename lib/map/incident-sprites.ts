export function createIncidentSprite(symbol: string, bgColor: string, size = 32): ImageData {
  // Create a canvas
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // Draw rounded rectangle badge
  const radius = 8
  const padding = 2
  ctx.beginPath()
  ctx.moveTo(padding + radius, padding)
  ctx.lineTo(size - padding - radius, padding)
  ctx.arcTo(size - padding, padding, size - padding, padding + radius, radius)
  ctx.lineTo(size - padding, size - padding - radius)
  ctx.arcTo(size - padding, size - padding, size - padding - radius, size - padding, radius)
  ctx.lineTo(padding + radius, size - padding)
  ctx.arcTo(padding, size - padding, padding, size - padding - radius, radius)
  ctx.lineTo(padding, padding + radius)
  ctx.arcTo(padding, padding, padding + radius, padding, radius)
  ctx.closePath()

  // Fill background
  ctx.fillStyle = bgColor
  ctx.fill()

  // Draw border
  ctx.lineWidth = 2
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()

  // Draw symbol inside
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(size * 0.45)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Adjust vertical position slightly for optical center
  ctx.fillText(symbol, size / 2, size / 2 + 1)

  return ctx.getImageData(0, 0, size, size)
}

export const INCIDENT_SPRITES = [
  { id: "incident-power_outage", symbol: "⚡", color: "#f59e0b" }, // Amber
  { id: "incident-flood",        symbol: "〰",  color: "#3b82f6" }, // Blue
  { id: "incident-landslide",    symbol: "△",  color: "#b45309" }, // Orange-brown
  { id: "incident-fire",         symbol: "🔥", color: "#ef4444" }, // Red-orange
  { id: "incident-road_hazard",  symbol: "⚠",  color: "#eab308" }, // Yellow
  { id: "incident-gas_leak",     symbol: "☁",  color: "#8b5cf6" }, // Violet
  { id: "incident-waste",        symbol: "⊕",  color: "#10b981" }, // Emerald
]
