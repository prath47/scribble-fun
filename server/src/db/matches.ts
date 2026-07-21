import { randomUUID } from "node:crypto"
import type { Player } from "../types.js"
import { db } from "./client.js"

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

interface MatchRow {
  id: string
  room_code: string
  played_at: number
  players: string
  rounds: number
  word_pack_id: string | null
}

function rowToMatch(row: MatchRow): MatchRecord {
  return {
    id: row.id,
    roomCode: row.room_code,
    playedAt: row.played_at,
    players: JSON.parse(row.players),
    rounds: row.rounds,
    wordPackId: row.word_pack_id,
  }
}

export function recordMatch(roomCode: string, players: Player[], rounds: number, wordPackId: string | null): void {
  const sorted: MatchPlayerResult[] = [...players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ name: p.name, avatarId: p.avatarId, score: p.score }))

  db.prepare("INSERT INTO matches (id, room_code, played_at, players, rounds, word_pack_id) VALUES (?, ?, ?, ?, ?, ?)").run(
    randomUUID(),
    roomCode,
    Date.now(),
    JSON.stringify(sorted),
    rounds,
    wordPackId,
  )
}

export function recentMatches(limit = 20): MatchRecord[] {
  const rows = db.prepare("SELECT * FROM matches ORDER BY played_at DESC LIMIT ?").all(limit) as MatchRow[]
  return rows.map(rowToMatch)
}
