import { motion } from "motion/react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AnimatedTitle } from "@/components/landing/AnimatedTitle"
import { AvatarPicker } from "@/components/landing/AvatarPicker"
import { InfoFooter } from "@/components/landing/InfoFooter"
import { RecentGames } from "@/components/landing/RecentGames"
import { WordPackPicker } from "@/components/landing/WordPackPicker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity"
import { createRoom, roomExists } from "@/lib/api"

export function LandingPage() {
  const { identity, update } = usePlayerIdentity()
  const [roomCode, setRoomCode] = useState("")
  const [wordPackId, setWordPackId] = useState("default")
  const [loading, setLoading] = useState<"join" | "create" | null>(null)
  const navigate = useNavigate()

  const nameValid = identity.name.trim().length > 0

  const goToRoom = (code: string) => navigate(`/room/${code}`)

  const handlePlay = async () => {
    if (!nameValid) return toast.error("Enter a name first")
    setLoading("join")
    try {
      const trimmed = roomCode.trim().toUpperCase()
      if (trimmed) {
        const exists = await roomExists(trimmed)
        if (!exists) {
          toast.error("Room not found")
          return
        }
        goToRoom(trimmed)
      } else {
        const code = await createRoom(wordPackId)
        goToRoom(code)
      }
    } catch {
      toast.error("Something went wrong, try again")
    } finally {
      setLoading(null)
    }
  }

  const handleCreatePrivateRoom = async () => {
    if (!nameValid) return toast.error("Enter a name first")
    setLoading("create")
    try {
      const code = await createRoom(wordPackId)
      goToRoom(code)
    } catch {
      toast.error("Something went wrong, try again")
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div
      className="scribble-bg flex min-h-screen flex-col items-center gap-10 py-12"
      animate={{ backgroundPosition: ["0px 0px, 0px 0px, 0px 0px, 0px 0px", "140px 140px, -160px 160px, 120px -120px, 0px 0px"] }}
      transition={{ repeat: Infinity, repeatType: "mirror", duration: 60, ease: "linear" }}
    >
      <div className="flex flex-col items-center gap-1">
        <AnimatedTitle />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-sm font-medium text-white/80"
        >
          draw &amp; guess with friends, no sign-up needed
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
      <Card className="border-white/10 bg-white/95 shadow-2xl">
        <CardContent className="flex flex-col gap-5 pt-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your name"
              value={identity.name}
              maxLength={20}
              onChange={(e) => update({ name: e.target.value })}
              className="flex-1"
            />
            <Select defaultValue="en">
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AvatarPicker avatarId={identity.avatarId} onAvatarChange={(avatarId) => update({ avatarId })} />

          <WordPackPicker value={wordPackId} onChange={setWordPackId} />

          <Input
            placeholder="Room code (optional)"
            value={roomCode}
            maxLength={6}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="text-center tracking-[0.3em] uppercase"
          />

          <Button
            size="lg"
            className="bg-emerald-500 text-base font-bold hover:bg-emerald-600"
            disabled={loading !== null}
            onClick={handlePlay}
          >
            {roomCode.trim() ? "Join Room" : "Play!"}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-sky-500 text-base font-bold text-white hover:bg-sky-600"
            disabled={loading !== null}
            onClick={handleCreatePrivateRoom}
          >
            Create Private Room
          </Button>
        </CardContent>
      </Card>
      </motion.div>

      <RecentGames />
      <InfoFooter />
    </motion.div>
  )
}
