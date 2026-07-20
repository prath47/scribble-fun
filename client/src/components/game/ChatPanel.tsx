import { Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ChatEntry } from "@/types/room"

interface ChatPanelProps {
  messages: ChatEntry[]
  selfId: string | null
  disabled: boolean
  placeholder: string
  onSend: (text: string) => void
}

export function ChatPanel({ messages, selfId, disabled, placeholder, onSend }: ChatPanelProps) {
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText("")
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-white/95 p-3 shadow md:w-64">
      <div ref={scrollRef} className="flex h-64 flex-col gap-1 overflow-y-auto md:h-full">
        {messages.map((msg) => (
          <p
            key={msg.id}
            className={cn(
              "text-sm break-words",
              msg.kind === "system" && "text-center text-xs italic text-muted-foreground",
              msg.kind === "correct-guess" && "font-semibold text-emerald-600",
              msg.kind === "chat" && msg.playerId === selfId && "text-blue-600",
            )}
          >
            {msg.kind === "chat" && <span className="font-semibold">{msg.playerName}: </span>}
            {msg.kind === "correct-guess" ? `${msg.playerName} ${msg.text}` : msg.text}
          </p>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={100}
        />
        <Button type="submit" size="icon" disabled={disabled || !text.trim()} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
