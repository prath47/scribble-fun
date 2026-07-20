import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { GameBoard } from "@/components/game/GameBoard"
import { LobbyView } from "@/components/lobby/LobbyView"
import { Button } from "@/components/ui/button"
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity"
import { useGameConnection } from "@/hooks/useGameConnection"

export function RoomPage() {
  const { code = "" } = useParams<{ code: string }>()
  const { identity } = usePlayerIdentity()
  const navigate = useNavigate()

  const connection = useGameConnection(code, identity.name, identity.avatarId)
  const { status, room, selfId, startGame } = connection

  useEffect(() => {
    if (status === "error") toast.error("Couldn't connect to that room")
  }, [status])

  if (!identity.name) {
    return <Navigate to="/" replace />
  }

  if (status === "connecting" || !room) {
    return (
      <div className="scribble-bg flex min-h-screen items-center justify-center gap-2 text-white">
        <Loader2 className="size-5 animate-spin" />
        Connecting…
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="scribble-bg flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center text-white">
        <p>This room doesn't exist or the connection failed.</p>
        <Button onClick={() => navigate("/")}>Back to home</Button>
      </div>
    )
  }

  if (room.phase === "lobby") {
    return <LobbyView code={code} room={room} selfId={selfId} onStartGame={startGame} />
  }

  return <GameBoard code={code} selfId={selfId} connection={connection} />
}
