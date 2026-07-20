export async function createRoom(): Promise<string> {
  const res = await fetch("/api/rooms", { method: "POST" })
  if (!res.ok) throw new Error("Failed to create room")
  const data = (await res.json()) as { code: string }
  return data.code
}

export async function roomExists(code: string): Promise<boolean> {
  const res = await fetch(`/api/rooms/${code}`)
  return res.ok
}

export function wsUrl(code: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/ws/${code}`
}
