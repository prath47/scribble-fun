import { PlayerCard } from "@/components/lobby/PlayerCard"
import type { Player } from "@/types/room"

interface PlayerListProps {
  players: Player[]
  selfId: string | null
}

export function PlayerList({ players, selfId }: PlayerListProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} isSelf={player.id === selfId} />
      ))}
    </div>
  )
}
