import { Clock } from "lucide-react"
import { useCountdown } from "@/hooks/useCountdown"
import { cn } from "@/lib/utils"

interface WordBannerProps {
  roundNumber: number
  totalRounds: number
  blanks: string | null
  yourWord: string | null
  roundEndsAt: number | null
}

export function WordBanner({ roundNumber, totalRounds, blanks, yourWord, roundEndsAt }: WordBannerProps) {
  const secondsLeft = useCountdown(roundEndsAt)
  const display = yourWord ?? blanks ?? ""

  return (
    <div className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-lg bg-white/95 px-4 py-2 shadow">
      <span className="text-sm font-semibold text-muted-foreground">
        Round {roundNumber}/{totalRounds}
      </span>
      <span className={cn("font-mono text-xl font-bold tracking-[0.3em]", yourWord && "text-emerald-600")}>{display}</span>
      <span className={cn("flex items-center gap-1 text-sm font-semibold", secondsLeft <= 10 && "text-red-500")}>
        <Clock className="size-4" />
        {secondsLeft}s
      </span>
    </div>
  )
}
