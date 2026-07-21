const keyFor = (code: string) => `scribble:token:${code.toUpperCase()}`

export function getStoredToken(code: string): string | undefined {
  return localStorage.getItem(keyFor(code)) ?? undefined
}

export function setStoredToken(code: string, token: string): void {
  localStorage.setItem(keyFor(code), token)
}
