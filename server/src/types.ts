import type { WebSocket } from "ws"

export type GamePhase = "lobby" | "choosing_word" | "drawing" | "round_reveal" | "game_end"

export interface Player {
  id: string
  name: string
  avatarId: string
  isHost: boolean
  connected: boolean
  score: number
}

export interface RoomTimers {
  roundTimer: NodeJS.Timeout | null
  hintTimers: NodeJS.Timeout[]
  chooseWordTimer: NodeJS.Timeout | null
  nextTurnTimer: NodeJS.Timeout | null
}

export interface RoomState {
  code: string
  hostId: string | null
  players: Map<string, Player>
  sockets: Map<string, WebSocket>
  createdAt: number
  cleanupTimer: NodeJS.Timeout | null
  playerTokens: Map<string, string>
  disconnectTimers: Map<string, NodeJS.Timeout>
  currentStrokes: StrokeEvent[]
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
  guessedPlayerIds: Set<string>
  usedWords: Set<string>
  revealedHintIndices: Set<number>
  timers: RoomTimers
}

export interface RoomSnapshot {
  code: string
  hostId: string
  players: Player[]
  phase: GamePhase
  roundNumber: number
  totalRounds: number
  currentDrawerId: string | null
}

export type ChatKind = "chat" | "system" | "correct-guess"

export interface ChatEntry {
  id: string
  playerId: string | null
  playerName: string
  text: string
  kind: ChatKind
}

export type StrokeEvent =
  | { type: "stroke"; points: [number, number][]; color: string; size: number; start: boolean }
  | { type: "canvas-clear" }

export type ServerMessage =
  | {
      type: "room-state"
      room: RoomSnapshot
      selfId: string
      token: string
      strokes: StrokeEvent[]
      blanks: string | null
      endsAt: number | null
      revealedWord: string | null
    }
  | { type: "room-update"; room: RoomSnapshot }
  | { type: "word-options"; words: string[] }
  | { type: "your-word"; word: string }
  | { type: "round-start"; room: RoomSnapshot; blanks: string; endsAt: number }
  | { type: "hint-update"; blanks: string }
  | { type: "round-reveal"; room: RoomSnapshot; word: string }
  | { type: "chat"; entry: ChatEntry }
  | { type: "guess-result"; correct: boolean }
  | { type: "error"; message: string }
  | StrokeEvent

export type ClientMessage =
  | { type: "join"; name: string; avatarId: string; token?: string }
  | { type: "start-game" }
  | { type: "choose-word"; word: string }
  | { type: "chat"; text: string }
  | StrokeEvent
