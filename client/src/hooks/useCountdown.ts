import { useEffect, useState } from "react"

export function useCountdown(endsAt: number | null): number {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(endsAt))

  useEffect(() => {
    setSecondsLeft(secondsUntil(endsAt))
    if (endsAt === null) return
    const interval = setInterval(() => setSecondsLeft(secondsUntil(endsAt)), 250)
    return () => clearInterval(interval)
  }, [endsAt])

  return secondsLeft
}

function secondsUntil(endsAt: number | null): number {
  if (endsAt === null) return 0
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000))
}
