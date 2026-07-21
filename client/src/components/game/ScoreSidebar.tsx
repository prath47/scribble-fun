import { Pencil } from "lucide-react"
import { avatarSrc } from "@/lib/avatars"
import { cn } from "@/lib/utils"
import type { Player } from "@/types/room"

interface ScoreSidebarProps {
  players: Player[]
  currentDrawerId: string | null
  selfId: string | null
}

export function ScoreSidebar({ players, currentDrawerId, selfId }: ScoreSidebarProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-white/95 p-3 shadow md:w-56">
      {sorted.map((player) => (
        <div
          key={player.id}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5",
            player.id === selfId && "bg-muted",
            player.id === currentDrawerId && "ring-2 ring-amber-400",
            !player.connected && "opacity-50",
          )}
        >
          <div className="relative">
            <img src={avatarSrc(player.avatarId)} alt="" className="size-9 rounded-full object-cover" />
            {player.id === currentDrawerId && (
              <Pencil className="absolute -bottom-1 -right-1 size-4 rounded-full bg-amber-400 p-0.5 text-white" />
            )}
          </div>
          <span className="flex-1 truncate text-sm font-medium">
            {player.name}
            {!player.connected && <span className="ml-1 text-xs text-muted-foreground">(reconnecting)</span>}
          </span>
          <span className="text-sm font-bold text-muted-foreground">{player.score}</span>
        </div>
      ))}
    </div>
  )
}
