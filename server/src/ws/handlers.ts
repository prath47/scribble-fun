import type { WebSocket } from "ws"
import { beginGame, chooseWord, getCurrentBlanks, handleChat, handleDrawerDisconnect } from "../game/engine.js"
import { addPlayer, broadcast, getRoom, markDisconnected, restorePlayer, sendTo, toSnapshot } from "../rooms/store.js"
import type { ClientMessage, RoomState } from "../types.js"

const CHAT_MIN_INTERVAL_MS = 300
const MAX_STROKE_BUFFER = 2000
const lastChatAt = new WeakMap<WebSocket, number>()

export async function handleConnection(socket: WebSocket, roomCode: string): Promise<void> {
  const room = await getRoom(roomCode)
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

      const restored = message.token ? restorePlayer(room, message.token, socket) : null
      let token: string
      if (restored) {
        playerId = restored.id
        token = message.token!
      } else {
        const created = addPlayer(room, message.name, message.avatarId)
        playerId = created.player.id
        token = created.token
        room.sockets.set(playerId, socket)
      }

      sendTo(room, playerId, {
        type: "room-state",
        room: toSnapshot(room),
        selfId: playerId,
        token,
        strokes: room.currentStrokes,
        blanks: getCurrentBlanks(room),
        endsAt: room.roundEndsAt,
        revealedWord: room.phase === "round_reveal" ? room.currentWord : null,
      })
      broadcast(room, { type: "room-update", room: toSnapshot(room) }, playerId)

      // if this player is mid-turn as the drawer (e.g. they refreshed), resend their private word info
      if (playerId === room.currentDrawerId) {
        if (room.phase === "choosing_word" && room.pendingWordOptions.length > 0) {
          sendTo(room, playerId, { type: "word-options", words: room.pendingWordOptions })
        } else if (room.phase === "drawing" && room.currentWord) {
          sendTo(room, playerId, { type: "your-word", word: room.currentWord })
        }
      }
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
          const event = { type: "stroke" as const, points: message.points, color: message.color, size: message.size, start: message.start }
          room.currentStrokes.push(event)
          if (room.currentStrokes.length > MAX_STROKE_BUFFER) room.currentStrokes.shift()
          broadcast(room, event, playerId)
        }
        break

      case "canvas-clear":
        if (playerId === room.currentDrawerId) {
          room.currentStrokes = []
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

  markDisconnected(room, playerId)

  if (wasDrawer) handleDrawerDisconnect(room, playerId)

  broadcast(room, { type: "room-update", room: toSnapshot(room) })
}
