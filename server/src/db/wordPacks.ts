import { randomUUID } from "node:crypto"
import { DEFAULT_PACK_ID, db } from "./client.js"

export interface WordPack {
  id: string
  name: string
  words: string[]
  createdAt: number
}

interface WordPackRow {
  id: string
  name: string
  words: string
  created_at: number
}

function rowToPack(row: WordPackRow): WordPack {
  return { id: row.id, name: row.name, words: JSON.parse(row.words), createdAt: row.created_at }
}

export function listWordPacks(): WordPack[] {
  const rows = db.prepare("SELECT * FROM word_packs ORDER BY created_at ASC").all() as WordPackRow[]
  return rows.map(rowToPack)
}

export function getWordPack(id: string): WordPack | null {
  const row = db.prepare("SELECT * FROM word_packs WHERE id = ?").get(id) as WordPackRow | undefined
  return row ? rowToPack(row) : null
}

export function createWordPack(name: string, words: string[]): WordPack {
  const cleanWords = Array.from(new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean)))
  const cleanName = name.trim().slice(0, 40) || "Custom pack"
  const id = randomUUID()
  const createdAt = Date.now()
  db.prepare("INSERT INTO word_packs (id, name, words, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    cleanName,
    JSON.stringify(cleanWords),
    createdAt,
  )
  return { id, name: cleanName, words: cleanWords, createdAt }
}

/** Words to draw a round's options from; falls back to the default pack if the requested one is missing/too small. */
export function getWordsForPack(packId: string | null): string[] {
  const pack = packId ? getWordPack(packId) : null
  if (pack && pack.words.length >= 3) return pack.words
  return getWordPack(DEFAULT_PACK_ID)!.words
}
