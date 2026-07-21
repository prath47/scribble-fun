import { useCallback, useEffect, useReducer, useRef } from "react"
import { resolveRoomOrigin, wsUrl } from "@/lib/api"
import { getStoredToken, setStoredToken } from "@/lib/roomToken"
import type { ChatEntry, ClientMessage, RoomSnapshot, ServerMessage, StrokeEvent } from "@/types/room"

export type ConnectionStatus = "connecting" | "connected" | "error" | "closed"
export type { StrokeEvent }

interface GameState {
  status: ConnectionStatus
  room: RoomSnapshot | null
  selfId: string | null
  blanks: string | null
  roundEndsAt: number | null
  yourWord: string | null
  wordOptions: string[] | null
  revealedWord: string | null
  chatMessages: ChatEntry[]
  lastGuessCorrect: boolean | null
  initialStrokes: StrokeEvent[]
}

const initialState: GameState = {
  status: "connecting",
  room: null,
  selfId: null,
  blanks: null,
  roundEndsAt: null,
  yourWord: null,
  wordOptions: null,
  revealedWord: null,
  chatMessages: [],
  lastGuessCorrect: null,
  initialStrokes: [],
}

type Action = { type: "status"; status: ConnectionStatus } | ServerMessage

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "status":
      return { ...state, status: action.status }
    case "room-state":
      return {
        ...state,
        room: action.room,
        selfId: action.selfId,
        blanks: action.blanks,
        roundEndsAt: action.endsAt,
        revealedWord: action.revealedWord,
        initialStrokes: action.strokes,
      }
    case "room-update":
      return { ...state, room: action.room }
    case "word-options":
      return { ...state, wordOptions: action.words }
    case "your-word":
      return { ...state, yourWord: action.word }
    case "round-start":
      return {
        ...state,
        room: action.room,
        blanks: action.blanks,
        roundEndsAt: action.endsAt,
        wordOptions: null,
        yourWord: state.selfId === action.room.currentDrawerId ? state.yourWord : null,
        revealedWord: null,
        lastGuessCorrect: null,
        initialStrokes: [],
      }
    case "hint-update":
      return { ...state, blanks: action.blanks }
    case "round-reveal":
      return { ...state, room: action.room, revealedWord: action.word }
    case "chat":
      return { ...state, chatMessages: [...state.chatMessages, action.entry].slice(-100) }
    case "guess-result":
      return { ...state, lastGuessCorrect: action.correct }
    case "error":
      return { ...state, status: "error" }
    default:
      return state
  }
}

export function useGameConnection(roomCode: string, name: string, avatarId: string) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const socketRef = useRef<WebSocket | null>(null)
  const strokeListeners = useRef(new Set<(event: StrokeEvent) => void>())

  useEffect(() => {
    if (!roomCode || !name || !avatarId) return

    let cancelled = false
    let socket: WebSocket | null = null

    void (async () => {
      // resolves to a different origin than the current one only in multi-instance
      // setups where this room is owned by another instance
      const origin = await resolveRoomOrigin(roomCode)
      if (cancelled) return

      socket = new WebSocket(wsUrl(roomCode, origin))
      socketRef.current = socket

      socket.onopen = () => {
        if (cancelled) return
        dispatch({ type: "status", status: "connected" })
        const join: ClientMessage = { type: "join", name, avatarId, token: getStoredToken(roomCode) }
        socket?.send(JSON.stringify(join))
      }

      socket.onmessage = (event) => {
        if (cancelled) return
        const message = JSON.parse(event.data) as ServerMessage
        if (message.type === "stroke" || message.type === "canvas-clear") {
          strokeListeners.current.forEach((cb) => cb(message))
          return
        }
        if (message.type === "room-state") {
          setStoredToken(roomCode, message.token)
        }
        dispatch(message)
      }

      socket.onerror = () => {
        if (cancelled) return
        dispatch({ type: "status", status: "error" })
      }
      socket.onclose = () => {
        if (cancelled) return
        dispatch({ type: "status", status: "closed" })
      }
    })()

    return () => {
      cancelled = true
      socket?.close()
      socketRef.current = null
    }
  }, [roomCode, name, avatarId])

  const send = useCallback((message: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(message))
  }, [])

  const startGame = useCallback(() => send({ type: "start-game" }), [send])
  const chooseWord = useCallback((word: string) => send({ type: "choose-word", word }), [send])
  const sendChat = useCallback((text: string) => send({ type: "chat", text }), [send])
  const sendStroke = useCallback(
    (points: [number, number][], color: string, size: number, start: boolean) =>
      send({ type: "stroke", points, color, size, start }),
    [send],
  )
  const sendClear = useCallback(() => send({ type: "canvas-clear" }), [send])

  const subscribeStroke = useCallback((cb: (event: StrokeEvent) => void) => {
    strokeListeners.current.add(cb)
    return () => strokeListeners.current.delete(cb)
  }, [])

  return { ...state, startGame, chooseWord, sendChat, sendStroke, sendClear, subscribeStroke }
}
