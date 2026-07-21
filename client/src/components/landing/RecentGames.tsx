import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { avatarSrc } from "@/lib/avatars"
import { recentMatches, type MatchRecord } from "@/lib/matches"

export function RecentGames() {
  const [matches, setMatches] = useState<MatchRecord[] | null>(null)

  useEffect(() => {
    recentMatches().then(setMatches)
  }, [])

  if (!matches || matches.length === 0) return null

  return (
    <Card className="w-full max-w-4xl border-white/10 bg-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Recent games</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {matches.slice(0, 5).map((match) => {
          const winner = match.players[0]
          return (
            <div key={match.id} className="flex items-center gap-3 rounded-md bg-white/5 px-3 py-2 text-sm text-white/90">
              {winner && <img src={avatarSrc(winner.avatarId)} alt="" className="size-8 rounded-full object-cover" />}
              <span className="flex-1 truncate">
                {winner ? `${winner.name} won` : "Game finished"} · {match.players.length} players · {match.rounds} rounds
              </span>
              <span className="text-xs text-white/60">{timeAgo(match.playedAt)}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
