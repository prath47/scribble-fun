export async function createRoom(wordPackId?: string): Promise<string> {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordPackId }),
  })
  if (!res.ok) throw new Error("Failed to create room")
  const data = (await res.json()) as { code: string }
  return data.code
}

export async function roomExists(code: string): Promise<boolean> {
  const res = await fetch(`/api/rooms/${code}`)
  return res.ok
}

/**
 * Resolves which origin actually owns a room. In single-instance/no-Redis setups this
 * is always the current origin. In multi-instance mode, the current origin's server may
 * report a different instance's public URL as the owner -- callers should talk to that
 * origin instead (both for further REST calls and the WS connection).
 */
export async function resolveRoomOrigin(code: string): Promise<string> {
  try {
    const res = await fetch(`/api/rooms/${code}`)
    if (!res.ok) return window.location.origin
    const data = (await res.json()) as { code: string; playerCount?: number; ownerUrl?: string }
    return data.ownerUrl ?? window.location.origin
  } catch {
    return window.location.origin
  }
}

export function wsUrl(code: string, origin: string = window.location.origin): string {
  const protocol = origin.startsWith("https") ? "wss:" : "ws:"
  const host = origin.replace(/^https?:\/\//, "")
  return `${protocol}//${host}/ws/${code}`
}
