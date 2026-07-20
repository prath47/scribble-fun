import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { PlayerList } from "@/components/lobby/PlayerList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RoomSnapshot } from "@/types/room"

interface LobbyViewProps {
  code: string
  room: RoomSnapshot
  selfId: string | null
  onStartGame: () => void
}

export function LobbyView({ code, room, selfId, onStartGame }: LobbyViewProps) {
  const [copied, setCopied] = useState(false)

  const isHost = selfId !== null && room.hostId === selfId
  const canStart = room.players.length >= 2

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`)
    setCopied(true)
    toast.success("Invite link copied!")
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="scribble-bg flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      <Card className="w-full max-w-3xl border-white/10 bg-white/95 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Room code</CardTitle>
            <p className="font-mono text-3xl font-black tracking-[0.3em]">{code}</p>
          </div>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy invite link
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <PlayerList players={room.players} selfId={selfId} />

          <div className="flex flex-col items-center gap-2">
            {isHost ? (
              <Button size="lg" disabled={!canStart} onClick={onStartGame} className="w-full max-w-xs">
                {canStart ? "Start Game" : "Waiting for more players…"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for the host to start the game…</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
