import type { GamePhase, Player, RoomState } from "../types.js"
import { isRedisAvailable, redis } from "./client.js"

const SNAPSHOT_TTL_SECONDS = 120

interface SnapshotData {
  code: string
  hostId: string | null
  players: Player[]
  playerTokens: [string, string][]
  wordPackId: string | null
  phase: GamePhase
  drawOrder: string[]
  drawOrderIndex: number
  currentDrawerId: string | null
  currentWord: string | null
  pendingWordOptions: string[]
  roundNumber: number
  totalRounds: number
  roundEndsAt: number | null
  guessedPlayerIds: string[]
  usedWords: string[]
  revealedHintIndices: number[]
}

export async function saveRoomSnapshot(room: RoomState): Promise<void> {
  if (!(await isRedisAvailable())) return
  const data: SnapshotData = {
    code: room.code,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
    playerTokens: Array.from(room.playerTokens.entries()),
    wordPackId: room.wordPackId,
    phase: room.phase,
    drawOrder: room.drawOrder,
    drawOrderIndex: room.drawOrderIndex,
    currentDrawerId: room.currentDrawerId,
    currentWord: room.currentWord,
    pendingWordOptions: room.pendingWordOptions,
    roundNumber: room.roundNumber,
    totalRounds: room.totalRounds,
    roundEndsAt: room.roundEndsAt,
    guessedPlayerIds: Array.from(room.guessedPlayerIds),
    usedWords: Array.from(room.usedWords),
    revealedHintIndices: Array.from(room.revealedHintIndices),
  }
  await redis.set(`room:${room.code}:snapshot`, JSON.stringify(data), "EX", SNAPSHOT_TTL_SECONDS)
}

/**
 * Rebuilds an in-memory RoomState from a Redis snapshot after a crashed owner's
 * ownership TTL has lapsed. Sockets/timers start empty -- players reconnect (with
 * their persisted token) via the normal restore-on-join flow to re-attach live sockets.
 */
export async function loadRoomSnapshot(code: string): Promise<RoomState | null> {
  if (!(await isRedisAvailable())) return null
  const raw = await redis.get(`room:${code.toUpperCase()}:snapshot`)
  if (!raw) return null
  const data = JSON.parse(raw) as SnapshotData

  const players = new Map(data.players.map((p) => [p.id, { ...p, connected: false }]))

  return {
    code: data.code,
    hostId: data.hostId,
    players,
    sockets: new Map(),
    createdAt: Date.now(),
    cleanupTimer: null,
    playerTokens: new Map(data.playerTokens),
    disconnectTimers: new Map(),
    currentStrokes: [],
    wordPackId: data.wordPackId,

    phase: data.phase,
    drawOrder: data.drawOrder,
    drawOrderIndex: data.drawOrderIndex,
    currentDrawerId: data.currentDrawerId,
    currentWord: data.currentWord,
    pendingWordOptions: data.pendingWordOptions,
    roundNumber: data.roundNumber,
    totalRounds: data.totalRounds,
    roundEndsAt: data.roundEndsAt,
    guessedPlayerIds: new Set(data.guessedPlayerIds),
    usedWords: new Set(data.usedWords),
    revealedHintIndices: new Set(data.revealedHintIndices),
    timers: { roundTimer: null, hintTimers: [], chooseWordTimer: null, nextTurnTimer: null },
  }
}
