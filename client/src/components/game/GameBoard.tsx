import { useRef, useState } from "react"
import { ChatPanel } from "@/components/game/ChatPanel"
import { DrawingCanvas, type DrawingCanvasHandle } from "@/components/game/DrawingCanvas"
import { GameEndScreen } from "@/components/game/GameEndScreen"
import { RoundRevealOverlay } from "@/components/game/RoundRevealOverlay"
import { ScoreSidebar } from "@/components/game/ScoreSidebar"
import { Toolbar } from "@/components/game/Toolbar"
import { WordBanner } from "@/components/game/WordBanner"
import { WordChoiceModal } from "@/components/game/WordChoiceModal"
import { DRAW_COLORS } from "@/lib/drawing"
import type { useGameConnection } from "@/hooks/useGameConnection"

interface GameBoardProps {
  code: string
  selfId: string | null
  connection: ReturnType<typeof useGameConnection>
}

export function GameBoard({ selfId, connection }: GameBoardProps) {
  const {
    room,
    blanks,
    roundEndsAt,
    yourWord,
    wordOptions,
    revealedWord,
    chatMessages,
    lastGuessCorrect,
    initialStrokes,
    chooseWord,
    sendChat,
    sendStroke,
    sendClear,
    subscribeStroke,
    startGame,
  } = connection

  const [color, setColor] = useState<string>(DRAW_COLORS[0])
  const [brushSize, setBrushSize] = useState(8)
  const canvasHandle = useRef<DrawingCanvasHandle>(null)

  if (!room) return null

  const isDrawer = room.currentDrawerId === selfId
  const isHost = room.hostId === selfId
  const drawerName = room.players.find((p) => p.id === room.currentDrawerId)?.name ?? "Someone"

  const handleClear = () => {
    canvasHandle.current?.clearLocal()
    sendClear()
  }

  if (room.phase === "game_end") {
    return <GameEndScreen players={room.players} isHost={isHost} onPlayAgain={startGame} />
  }

  if (room.phase === "choosing_word" && !(isDrawer && wordOptions)) {
    return (
      <div className="scribble-bg flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center text-white">
        <p className="text-xl font-semibold">{drawerName} is choosing a word…</p>
        <p className="text-sm text-white/70">
          Round {room.roundNumber}/{room.totalRounds}
        </p>
      </div>
    )
  }

  const chatDisabled = (isDrawer && room.phase === "drawing") || lastGuessCorrect === true
  const chatPlaceholder =
    isDrawer && room.phase === "drawing"
      ? "You're drawing — guessing is off"
      : lastGuessCorrect
        ? "You guessed it! 🎉"
        : "Type your guess…"

  return (
    <div className="scribble-bg flex min-h-screen flex-col items-center gap-3 px-4 py-6">
      {isDrawer && wordOptions && <WordChoiceModal words={wordOptions} onChoose={chooseWord} />}

      <WordBanner
        roundNumber={room.roundNumber}
        totalRounds={room.totalRounds}
        blanks={blanks}
        yourWord={isDrawer ? yourWord : null}
        roundEndsAt={roundEndsAt}
      />

      <div className="flex w-full max-w-5xl flex-col gap-3 md:flex-row">
        <ScoreSidebar players={room.players} currentDrawerId={room.currentDrawerId} selfId={selfId} />

        <div className="flex flex-1 flex-col items-center gap-2">
          {isDrawer && room.phase === "drawing" && (
            <Toolbar color={color} size={brushSize} onColorChange={setColor} onSizeChange={setBrushSize} onClear={handleClear} />
          )}
          <div className="relative w-full max-w-3xl">
            <DrawingCanvas
              ref={canvasHandle}
              isDrawer={isDrawer && room.phase === "drawing"}
              color={color}
              brushSize={brushSize}
              roundKey={room.roundNumber}
              initialStrokes={initialStrokes}
              subscribeStroke={subscribeStroke}
              onStroke={sendStroke}
            />
            {room.phase === "round_reveal" && revealedWord && <RoundRevealOverlay word={revealedWord} />}
          </div>
        </div>

        <ChatPanel messages={chatMessages} selfId={selfId} disabled={chatDisabled} placeholder={chatPlaceholder} onSend={sendChat} />
      </div>
    </div>
  )
}
