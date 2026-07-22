import { DEFAULT_PACK_ID, prisma } from "./client.js"

export interface WordPack {
  id: string
  name: string
  words: string[]
  createdAt: number
}

function toWordPack(row: { id: string; name: string; words: string[]; createdAt: Date }): WordPack {
  return { id: row.id, name: row.name, words: row.words, createdAt: row.createdAt.getTime() }
}

export async function listWordPacks(): Promise<WordPack[]> {
  const rows = await prisma.wordPack.findMany({ orderBy: { createdAt: "asc" } })
  return rows.map(toWordPack)
}

export async function getWordPack(id: string): Promise<WordPack | null> {
  const row = await prisma.wordPack.findUnique({ where: { id } })
  return row ? toWordPack(row) : null
}

export async function createWordPack(name: string, words: string[]): Promise<WordPack> {
  const cleanWords = Array.from(new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean)))
  const cleanName = name.trim().slice(0, 40) || "Custom pack"
  const row = await prisma.wordPack.create({ data: { name: cleanName, words: cleanWords } })
  return toWordPack(row)
}

/** Words to draw a round's options from; falls back to the default pack if the requested one is missing/too small. */
export async function getWordsForPack(packId: string | null): Promise<string[]> {
  const pack = packId ? await getWordPack(packId) : null
  if (pack && pack.words.length >= 3) return pack.words
  return (await getWordPack(DEFAULT_PACK_ID))!.words
}
