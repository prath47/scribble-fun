export interface MatchPlayerResult {
  name: string
  avatarId: string
  score: number
}

export interface MatchRecord {
  id: string
  roomCode: string
  playedAt: number
  players: MatchPlayerResult[]
  rounds: number
  wordPackId: string | null
}

export async function recentMatches(): Promise<MatchRecord[]> {
  const res = await fetch("/api/matches/recent")
  if (!res.ok) return []
  return res.json()
}
