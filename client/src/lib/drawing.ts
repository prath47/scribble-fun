export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

export const DRAW_COLORS = [
  "#1e1e1e",
  "#ffffff",
  "#9ca3af",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#78350f",
] as const

export const BRUSH_SIZES = [
  { label: "S", size: 3 },
  { label: "M", size: 8 },
  { label: "L", size: 16 },
] as const

export function renderStrokeSegment(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  size: number,
  start: boolean,
): void {
  if (points.length === 0) return

  ctx.strokeStyle = color
  ctx.lineWidth = size
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (start) {
    ctx.beginPath()
    const [x0, y0] = points[0]
    ctx.moveTo(x0, y0)
    if (points.length === 1) {
      ctx.lineTo(x0 + 0.01, y0 + 0.01) // render a visible dot for a simple click
    }
  }

  for (let i = start ? 1 : 0; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1])
  }
  ctx.stroke()
}

export function clearCanvasContext(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
}
