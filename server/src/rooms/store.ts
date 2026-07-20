import { randomUUID } from "node:crypto"
import type { Player, RoomSnapshot, RoomState, ServerMessage } from "../types.js"
import { generateRoomCode } from "./roomCode.js"

const IDLE_CLEANUP_MS = 30_000

const rooms = new Map<string, RoomState>()

export function createRoom(): RoomState {
  const code = generateRoomCode((c) => rooms.has(c))
  const room: RoomState = {
    code,
    hostId: null,
    players: new Map(),
    sockets: new Map(),
    createdAt: Date.now(),
    cleanupTimer: null,

    phase: "lobby",
    drawOrder: [],
    drawOrderIndex: -1,
    currentDrawerId: null,
    currentWord: null,
    pendingWordOptions: [],
    roundNumber: 0,
    totalRounds: 0,
    roundEndsAt: null,
    guessedPlayerIds: new Set(),
    usedWords: new Set(),
    timers: { roundTimer: null, hintTimers: [], chooseWordTimer: null, nextTurnTimer: null },
  }
  rooms.set(code, room)
  return room
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code.toUpperCase())
}

export function addPlayer(room: RoomState, name: string, avatarId: string): Player {
  const player: Player = {
    id: randomUUID(),
    name: name.trim().slice(0, 20) || "Player",
    avatarId,
    isHost: room.players.size === 0,
    connected: true,
    score: 0,
  }
  if (player.isHost) room.hostId = player.id
  room.players.set(player.id, player)
  cancelCleanup(room)
  return player
}

export function removePlayer(room: RoomState, playerId: string): void {
  room.players.delete(playerId)
  room.sockets.delete(playerId)
  room.drawOrder = room.drawOrder.filter((id) => id !== playerId)

  if (room.hostId === playerId) {
    const next = room.players.values().next().value as Player | undefined
    room.hostId = next?.id ?? null
    if (next) next.isHost = true
  }

  if (room.players.size === 0) {
    scheduleCleanup(room)
  }
}

function scheduleCleanup(room: RoomState): void {
  cancelCleanup(room)
  room.cleanupTimer = setTimeout(() => {
    if (room.players.size === 0) {
      rooms.delete(room.code)
    }
  }, IDLE_CLEANUP_MS)
}

function cancelCleanup(room: RoomState): void {
  if (room.cleanupTimer) {
    clearTimeout(room.cleanupTimer)
    room.cleanupTimer = null
  }
}

export function toSnapshot(room: RoomState): RoomSnapshot {
  return {
    code: room.code,
    hostId: room.hostId ?? "",
    players: Array.from(room.players.values()),
    phase: room.phase,
    roundNumber: room.roundNumber,
    totalRounds: room.totalRounds,
    currentDrawerId: room.currentDrawerId,
  }
}

export function broadcast(room: RoomState, message: ServerMessage, excludePlayerId?: string): void {
  const payload = JSON.stringify(message)
  for (const [playerId, socket] of room.sockets) {
    if (playerId === excludePlayerId) continue
    if (socket.readyState === socket.OPEN) socket.send(payload)
  }
}

export function sendTo(room: RoomState, playerId: string, message: ServerMessage): void {
  const socket = room.sockets.get(playerId)
  if (socket && socket.readyState === socket.OPEN) socket.send(JSON.stringify(message))
}
