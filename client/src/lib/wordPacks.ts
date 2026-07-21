export interface WordPackSummary {
  id: string
  name: string
  wordCount: number
}

export async function listWordPacks(): Promise<WordPackSummary[]> {
  const res = await fetch("/api/word-packs")
  if (!res.ok) return []
  return res.json()
}

export async function createWordPack(name: string, words: string[]): Promise<WordPackSummary | null> {
  const res = await fetch("/api/word-packs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, words }),
  })
  if (!res.ok) return null
  return res.json()
}
