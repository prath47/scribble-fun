import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { CANVAS_HEIGHT, CANVAS_WIDTH, clearCanvasContext, renderStrokeSegment } from "@/lib/drawing"
import type { StrokeEvent } from "@/hooks/useGameConnection"

export interface DrawingCanvasHandle {
  clearLocal: () => void
}

interface DrawingCanvasProps {
  isDrawer: boolean
  color: string
  brushSize: number
  roundKey: number
  initialStrokes: StrokeEvent[]
  subscribeStroke: (cb: (event: StrokeEvent) => void) => () => void
  onStroke: (points: [number, number][], color: string, size: number, start: boolean) => void
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas(
  { isDrawer, color, brushSize, roundKey, initialStrokes, subscribeStroke, onStroke },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDownRef = useRef(false)
  const pendingPointsRef = useRef<[number, number][]>([])
  const isFirstFlushRef = useRef(true)
  const rafIdRef = useRef<number | null>(null)

  // fresh white canvas on mount / new round, then replay any buffered strokes
  // (populated on reconnect mid-round so the canvas doesn't come up blank)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    clearCanvasContext(ctx)
    for (const event of initialStrokes) {
      if (event.type === "canvas-clear") clearCanvasContext(ctx)
      else renderStrokeSegment(ctx, event.points, event.color, event.size, event.start)
    }
  }, [roundKey, initialStrokes])

  useImperativeHandle(ref, () => ({
    clearLocal: () => {
      const ctx = canvasRef.current?.getContext("2d")
      if (ctx) clearCanvasContext(ctx)
    },
  }))

  useEffect(() => {
    return subscribeStroke((event) => {
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return
      if (event.type === "canvas-clear") {
        clearCanvasContext(ctx)
        return
      }
      renderStrokeSegment(ctx, event.points, event.color, event.size, event.start)
    })
  }, [subscribeStroke])

  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
  }

  const flush = () => {
    if (pendingPointsRef.current.length > 0) {
      onStroke(pendingPointsRef.current, color, brushSize, isFirstFlushRef.current)
      pendingPointsRef.current = []
      isFirstFlushRef.current = false
    }
    if (isDownRef.current) {
      rafIdRef.current = requestAnimationFrame(flush)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    canvasRef.current?.setPointerCapture(e.pointerId)

    const point = toCanvasPoint(e)
    isDownRef.current = true
    isFirstFlushRef.current = true
    pendingPointsRef.current = [point]
    renderStrokeSegment(ctx, [point], color, brushSize, true)
    rafIdRef.current = requestAnimationFrame(flush)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDownRef.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const point = toCanvasPoint(e)
    renderStrokeSegment(ctx, [point], color, brushSize, false)
    pendingPointsRef.current.push(point)
  }

  const endStroke = () => {
    if (!isDownRef.current) return
    isDownRef.current = false
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    flush()
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full touch-none rounded-lg border border-border bg-white shadow"
      style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`, cursor: isDrawer ? "crosshair" : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerLeave={endStroke}
    />
  )
})
