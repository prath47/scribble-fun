import { WORDS } from "../data/words.js"
import { broadcast, sendTo, toSnapshot } from "../rooms/store.js"
import type { ChatEntry, Player, RoomState } from "../types.js"

const ROUNDS_PER_PLAYER = 2
const ROUND_DURATION_MS = 80_000
const CHOOSE_WORD_TIMEOUT_MS = 15_000
const REVEAL_PAUSE_MS = 5_000
const WORD_OPTIONS_COUNT = 3
const GUESSER_MIN_POINTS = 20
const GUESSER_MAX_POINTS = 100
const DRAWER_POINTS_PER_GUESSER = 10

function clearTimers(room: RoomState): void {
  if (room.timers.roundTimer) clearTimeout(room.timers.roundTimer)
  if (room.timers.chooseWordTimer) clearTimeout(room.timers.chooseWordTimer)
  if (room.timers.nextTurnTimer) clearTimeout(room.timers.nextTurnTimer)
  room.timers.hintTimers.forEach(clearTimeout)
  room.timers = { roundTimer: null, hintTimers: [], chooseWordTimer: null, nextTurnTimer: null }
}

function pickWordOptions(room: RoomState): string[] {
  const pool = WORDS.filter((w) => !room.usedWords.has(w))
  const source = pool.length >= WORD_OPTIONS_COUNT ? pool : WORDS
  const picked: string[] = []
  const candidates = [...source]
  while (picked.length < WORD_OPTIONS_COUNT && candidates.length > 0) {
    const i = Math.floor(Math.random() * candidates.length)
    picked.push(candidates.splice(i, 1)[0])
  }
  return picked
}

function blanksFor(word: string, revealed: Set<number>): string {
  return word
    .split("")
    .map((ch, i) => (ch === " " ? " " : revealed.has(i) ? ch : "_"))
    .join(" ")
}

function systemChat(room: RoomState, text: string): void {
  const entry: ChatEntry = { id: crypto.randomUUID(), playerId: null, playerName: "", text, kind: "system" }
  broadcast(room, { type: "chat", entry })
}

export function beginGame(room: RoomState): void {
  if (room.players.size < 2) return
  if (room.phase !== "lobby" && room.phase !== "game_end") return

  clearTimers(room)
  for (const player of room.players.values()) player.score = 0
  room.drawOrder = Array.from(room.players.keys())
  room.drawOrderIndex = -1
  room.usedWords = new Set()
  room.roundNumber = 0
  room.totalRounds = room.drawOrder.length * ROUNDS_PER_PLAYER

  nextTurn(room)
}

export function nextTurn(room: RoomState): void {
  clearTimers(room)
  room.currentWord = null
  room.pendingWordOptions = []
  room.roundEndsAt = null
  room.guessedPlayerIds = new Set()

  room.drawOrderIndex += 1
  if (room.drawOrderIndex >= room.totalRounds || room.drawOrder.length < 2) {
    room.phase = "game_end"
    room.currentDrawerId = null
    broadcast(room, { type: "room-update", room: toSnapshot(room) })
    return
  }

  const drawerId = room.drawOrder[room.drawOrderIndex % room.drawOrder.length]
  const drawer = room.players.get(drawerId)
  if (!drawer) {
    nextTurn(room)
    return
  }

  room.roundNumber += 1
  room.currentDrawerId = drawerId
  room.phase = "choosing_word"

  const options = pickWordOptions(room)
  room.pendingWordOptions = options

  sendTo(room, drawerId, { type: "word-options", words: options })
  broadcast(room, { type: "room-update", room: toSnapshot(room) })
  systemChat(room, `${drawer.name} is choosing a word…`)

  room.timers.chooseWordTimer = setTimeout(() => {
    if (room.phase === "choosing_word" && room.pendingWordOptions.length > 0) {
      startRound(room, room.pendingWordOptions[0])
    }
  }, CHOOSE_WORD_TIMEOUT_MS)
}

export function chooseWord(room: RoomState, playerId: string, word: string): void {
  if (room.phase !== "choosing_word" || playerId !== room.currentDrawerId) return
  if (!room.pendingWordOptions.includes(word)) return
  startRound(room, word)
}

export function startRound(room: RoomState, word: string): void {
  clearTimers(room)
  room.phase = "drawing"
  room.currentWord = word
  room.usedWords.add(word)
  room.pendingWordOptions = []
  room.guessedPlayerIds = new Set()
  room.roundEndsAt = Date.now() + ROUND_DURATION_MS

  const revealed = new Set<number>()
  const blanks = blanksFor(word, revealed)

  broadcast(room, { type: "round-start", room: toSnapshot(room), blanks, endsAt: room.roundEndsAt })
  if (room.currentDrawerId) {
    sendTo(room, room.currentDrawerId, { type: "your-word", word })
  }

  const hintCount = word.replace(/\s/g, "").length > 4 ? 2 : 1
  for (let i = 1; i <= hintCount; i++) {
    const timer = setTimeout(
      () => {
        if (room.phase !== "drawing" || !room.currentWord) return
        const candidates = room.currentWord
          .split("")
          .map((ch, idx) => ({ ch, idx }))
          .filter(({ ch, idx }) => ch !== " " && !revealed.has(idx))
        if (candidates.length === 0) return
        const pick = candidates[Math.floor(Math.random() * candidates.length)]
        revealed.add(pick.idx)
        broadcast(room, { type: "hint-update", blanks: blanksFor(room.currentWord, revealed) })
      },
      (ROUND_DURATION_MS * i) / (hintCount + 1),
    )
    room.timers.hintTimers.push(timer)
  }

  room.timers.roundTimer = setTimeout(() => endRound(room), ROUND_DURATION_MS)
}

export function handleChat(room: RoomState, playerId: string, text: string): void {
  const player = room.players.get(playerId)
  if (!player) return

  // anti-cheat: the drawer cannot send any chat during their own drawing phase
  if (room.phase === "drawing" && playerId === room.currentDrawerId) return

  const entry: ChatEntry = { id: crypto.randomUUID(), playerId, playerName: player.name, text, kind: "chat" }

  const isGuessable = room.phase === "drawing" && !room.guessedPlayerIds.has(playerId)
  if (!isGuessable) {
    broadcast(room, { type: "chat", entry })
    return
  }

  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
  const isCorrect = room.currentWord !== null && normalize(text) === normalize(room.currentWord)

  if (!isCorrect) {
    broadcast(room, { type: "chat", entry })
    return
  }

  room.guessedPlayerIds.add(playerId)
  const elapsedSeconds = room.roundEndsAt ? (ROUND_DURATION_MS - (room.roundEndsAt - Date.now())) / 1000 : 0
  const points = Math.max(GUESSER_MIN_POINTS, Math.round(GUESSER_MAX_POINTS - elapsedSeconds * 2))
  player.score += points

  const drawer = room.currentDrawerId ? room.players.get(room.currentDrawerId) : undefined
  if (drawer) drawer.score += DRAWER_POINTS_PER_GUESSER

  sendTo(room, playerId, { type: "guess-result", correct: true })
  broadcast(room, {
    type: "chat",
    entry: { id: crypto.randomUUID(), playerId, playerName: player.name, text: "guessed the word!", kind: "correct-guess" },
  })
  broadcast(room, { type: "room-update", room: toSnapshot(room) })

  const nonDrawerCount = room.players.size - 1
  if (room.guessedPlayerIds.size >= nonDrawerCount) {
    endRound(room)
  }
}

export function endRound(room: RoomState): void {
  if (room.phase !== "drawing") return
  clearTimers(room)
  room.phase = "round_reveal"
  const word = room.currentWord ?? ""
  broadcast(room, { type: "round-reveal", room: toSnapshot(room), word })

  room.timers.nextTurnTimer = setTimeout(() => nextTurn(room), REVEAL_PAUSE_MS)
}

export function handleDrawerDisconnect(room: RoomState, playerId: string): void {
  if (room.currentDrawerId !== playerId) return
  if (room.phase === "drawing") {
    endRound(room)
  } else if (room.phase === "choosing_word") {
    clearTimers(room)
    nextTurn(room)
  }
}
