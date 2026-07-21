import { randomUUID } from "node:crypto"
import type { WebSocket } from "ws"
import { getRoomOwner, registerRoomOwner } from "../redis/registry.js"
import { loadRoomSnapshot } from "../redis/snapshot.js"
import { INSTANCE_ID } from "../instanceId.js"
import type { Player, RoomSnapshot, RoomState, ServerMessage } from "../types.js"
import { generateRoomCode } from "./roomCode.js"

const IDLE_CLEANUP_MS = 30_000
const DISCONNECT_GRACE_MS = 20_000

const rooms = new Map<string, RoomState>()

export function createRoom(wordPackId: string | null = null): RoomState {
  const code = generateRoomCode((c) => rooms.has(c))
  const room: RoomState = {
    code,
    hostId: null,
    players: new Map(),
    sockets: new Map(),
    createdAt: Date.now(),
    cleanupTimer: null,
    playerTokens: new Map(),
    disconnectTimers: new Map(),
    currentStrokes: [],
    wordPackId,

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
    revealedHintIndices: new Set(),
    timers: { roundTimer: null, hintTimers: [], chooseWordTimer: null, nextTurnTimer: null },
  }
  rooms.set(code, room)
  void registerRoomOwner(code)
  return room
}

/**
 * Looks up a room. If it isn't held in this instance's memory, checks whether another
 * instance still owns it in Redis (multi-instance mode) -- if so, this room isn't ours
 * to serve. If ownership has lapsed (the owner crashed and its TTL expired), rehydrates
 * the room from its last Redis snapshot and claims ownership.
 */
export async function getRoom(code: string): Promise<RoomState | undefined> {
  const upper = code.toUpperCase()
  const existing = rooms.get(upper)
  if (existing) return existing

  const owner = await getRoomOwner(upper)
  if (owner && owner.instanceId !== INSTANCE_ID) return undefined // alive elsewhere; not mine to take

  const snapshot = await loadRoomSnapshot(upper)
  if (!snapshot) return undefined

  rooms.set(upper, snapshot)
  void registerRoomOwner(upper)
  return snapshot
}

export function listRooms(): RoomState[] {
  return Array.from(rooms.values())
}

export function addPlayer(room: RoomState, name: string, avatarId: string): { player: Player; token: string } {
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

  const token = randomUUID()
  room.playerTokens.set(token, player.id)

  cancelCleanup(room)
  return { player, token }
}

export function restorePlayer(room: RoomState, token: string, socket: WebSocket): Player | null {
  const playerId = room.playerTokens.get(token)
  if (!playerId) return null
  const player = room.players.get(playerId)
  if (!player) return null

  const timer = room.disconnectTimers.get(playerId)
  if (timer) {
    clearTimeout(timer)
    room.disconnectTimers.delete(playerId)
  }

  player.connected = true
  room.sockets.set(playerId, socket)
  cancelCleanup(room)
  return player
}

/** Soft-disconnect: keeps the player's seat/score, gives them a grace window to reconnect. */
export function markDisconnected(room: RoomState, playerId: string): void {
  const player = room.players.get(playerId)
  if (!player) return

  player.connected = false
  room.sockets.delete(playerId)

  const timer = setTimeout(() => finalizeRemoval(room, playerId), DISCONNECT_GRACE_MS)
  room.disconnectTimers.set(playerId, timer)
}

/** Hard removal once the grace window has expired without a reconnect. */
export function finalizeRemoval(room: RoomState, playerId: string): void {
  const timer = room.disconnectTimers.get(playerId)
  if (timer) clearTimeout(timer)
  room.disconnectTimers.delete(playerId)

  room.players.delete(playerId)
  room.sockets.delete(playerId)
  room.drawOrder = room.drawOrder.filter((id) => id !== playerId)
  for (const [token, id] of room.playerTokens) {
    if (id === playerId) room.playerTokens.delete(token)
  }

  if (room.hostId === playerId) {
    const next = room.players.values().next().value as Player | undefined
    room.hostId = next?.id ?? null
    if (next) next.isHost = true
  }

  if (room.players.size === 0) {
    scheduleCleanup(room)
  }

  broadcast(room, { type: "room-update", room: toSnapshot(room) })
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
