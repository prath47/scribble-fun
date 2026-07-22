import type { Prisma } from "@prisma/client"
import type { Player } from "../types.js"
import { prisma } from "./client.js"

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

export async function recordMatch(roomCode: string, players: Player[], rounds: number, wordPackId: string | null): Promise<void> {
  const sorted: MatchPlayerResult[] = [...players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ name: p.name, avatarId: p.avatarId, score: p.score }))

  await prisma.match.create({
    data: { roomCode, players: sorted as unknown as Prisma.InputJsonValue, rounds, wordPackId },
  })
}

export async function recentMatches(limit = 20): Promise<MatchRecord[]> {
  const rows = await prisma.match.findMany({ orderBy: { playedAt: "desc" }, take: limit })
  return rows.map((row) => ({
    id: row.id,
    roomCode: row.roomCode,
    playedAt: row.playedAt.getTime(),
    players: row.players as unknown as MatchPlayerResult[],
    rounds: row.rounds,
    wordPackId: row.wordPackId,
  }))
}
