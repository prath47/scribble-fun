import { Crown } from "lucide-react"
import { avatarSrc } from "@/lib/avatars"
import { cn } from "@/lib/utils"
import type { Player } from "@/types/room"

interface PlayerCardProps {
  player: Player
  isSelf: boolean
}

export function PlayerCard({ player, isSelf }: PlayerCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-center">
      <div className="relative">
        <img
          src={avatarSrc(player.avatarId)}
          alt={player.name}
          className="size-14 rounded-full border-2 border-white object-cover shadow"
        />
        {player.isHost && <Crown className="absolute -top-2 -right-2 size-5 fill-amber-400 text-amber-400" />}
      </div>
      <span className={cn("max-w-full truncate text-sm font-medium text-foreground", isSelf && "font-bold")}>
        {player.name}
        {isSelf && " (you)"}
      </span>
    </div>
  )
}
