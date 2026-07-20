import type { WebSocket } from "ws"
import { beginGame, chooseWord, handleChat, handleDrawerDisconnect } from "../game/engine.js"
import { addPlayer, broadcast, getRoom, removePlayer, toSnapshot } from "../rooms/store.js"
import type { ClientMessage, RoomState } from "../types.js"

const CHAT_MIN_INTERVAL_MS = 300
const lastChatAt = new WeakMap<WebSocket, number>()

export function handleConnection(socket: WebSocket, roomCode: string): void {
  const room = getRoom(roomCode)
  if (!room) {
    socket.send(JSON.stringify({ type: "error", message: "Room not found" }))
    socket.close()
    return
  }

  let playerId: string | null = null

  socket.on("message", (raw) => {
    let message: ClientMessage
    try {
      message = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (message.type === "join") {
      if (playerId) return // already joined on this connection
      const player = addPlayer(room, message.name, message.avatarId)
      playerId = player.id
      room.sockets.set(player.id, socket)

      socket.send(JSON.stringify({ type: "room-state", room: toSnapshot(room), selfId: player.id }))
      broadcast(room, { type: "room-update", room: toSnapshot(room) }, player.id)
      return
    }

    if (!playerId) return // every other message requires having joined

    switch (message.type) {
      case "start-game":
        if (playerId === room.hostId) beginGame(room)
        break

      case "choose-word":
        chooseWord(room, playerId, message.word)
        break

      case "chat": {
        const now = Date.now()
        const last = lastChatAt.get(socket) ?? 0
        if (now - last < CHAT_MIN_INTERVAL_MS) return
        lastChatAt.set(socket, now)
        handleChat(room, playerId, message.text)
        break
      }

      case "stroke":
        if (playerId === room.currentDrawerId) {
          broadcast(
            room,
            { type: "stroke", points: message.points, color: message.color, size: message.size, start: message.start },
            playerId,
          )
        }
        break

      case "canvas-clear":
        if (playerId === room.currentDrawerId) {
          broadcast(room, { type: "canvas-clear" }, playerId)
        }
        break
    }
  })

  socket.on("close", () => {
    if (!playerId) return
    handleDisconnect(room, playerId)
  })
}

function handleDisconnect(room: RoomState, playerId: string): void {
  const wasDrawer = room.currentDrawerId === playerId

  removePlayer(room, playerId)

  if (room.players.size === 0) return

  if (wasDrawer) handleDrawerDisconnect(room, playerId)

  broadcast(room, { type: "room-update", room: toSnapshot(room) })
}
