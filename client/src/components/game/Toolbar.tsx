import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BRUSH_SIZES, DRAW_COLORS } from "@/lib/drawing"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  color: string
  size: number
  onColorChange: (color: string) => void
  onSizeChange: (size: number) => void
  onClear: () => void
}

export function Toolbar({ color, size, onColorChange, onSizeChange, onClear }: ToolbarProps) {
  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-3 rounded-lg bg-white/95 p-2 shadow">
      <div className="flex gap-1">
        {DRAW_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onColorChange(c)}
            className={cn(
              "size-6 rounded-full border-2 transition-transform",
              color === c ? "scale-110 border-foreground" : "border-white/60",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex gap-1">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.size}
            type="button"
            onClick={() => onSizeChange(b.size)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md border text-xs font-bold",
              size === b.size ? "border-foreground bg-muted" : "border-border",
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        <Trash2 className="size-4" />
        Clear
      </Button>
    </div>
  )
}
