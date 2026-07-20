import { Crown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { avatarSrc } from "@/lib/avatars"
import { cn } from "@/lib/utils"
import type { Player } from "@/types/room"

interface GameEndScreenProps {
  players: Player[]
  isHost: boolean
  onPlayAgain: () => void
}

export function GameEndScreen({ players, isHost, onPlayAgain }: GameEndScreenProps) {
  const navigate = useNavigate()
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="scribble-bg flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <Card className="w-full max-w-md border-white/10 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Final Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={cn("flex items-center gap-3 rounded-lg p-2", i === 0 && "bg-amber-50 ring-1 ring-amber-300")}
            >
              <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
              <div className="relative">
                <img src={avatarSrc(player.avatarId)} alt="" className="size-10 rounded-full object-cover" />
                {i === 0 && <Crown className="absolute -top-2 -right-2 size-5 fill-amber-400 text-amber-400" />}
              </div>
              <span className="flex-1 truncate font-medium">{player.name}</span>
              <span className="font-bold">{player.score}</span>
            </div>
          ))}

          <div className="mt-4 flex flex-col gap-2">
            {isHost && (
              <Button size="lg" onClick={onPlayAgain}>
                Play Again
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => navigate("/")}>
              Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
