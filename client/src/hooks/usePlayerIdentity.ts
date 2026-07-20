import { useCallback, useState } from "react"
import { randomAvatarId } from "@/lib/avatars"

const STORAGE_KEY = "scribble:identity"

export interface PlayerIdentity {
  name: string
  avatarId: string
}

function load(): PlayerIdentity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PlayerIdentity
  } catch {
    // ignore malformed storage
  }
  return { name: "", avatarId: randomAvatarId() }
}

export function usePlayerIdentity() {
  const [identity, setIdentity] = useState<PlayerIdentity>(load)

  const update = useCallback((next: Partial<PlayerIdentity>) => {
    setIdentity((prev) => {
      const merged = { ...prev, ...next }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    })
  }, [])

  return { identity, update }
}
