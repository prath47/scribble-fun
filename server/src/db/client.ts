import { randomUUID } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Database from "better-sqlite3"
import { WORDS } from "../data/words.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH ?? path.join(__dirname, "..", "..", "data.sqlite")

export const db = new Database(dbPath)
db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS word_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    words TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    played_at INTEGER NOT NULL,
    players TEXT NOT NULL,
    rounds INTEGER NOT NULL,
    word_pack_id TEXT
  );
`)

const DEFAULT_PACK_ID = "default"

const hasDefaultPack = db.prepare("SELECT 1 FROM word_packs WHERE id = ?").get(DEFAULT_PACK_ID)
if (!hasDefaultPack) {
  db.prepare("INSERT INTO word_packs (id, name, words, created_at) VALUES (?, ?, ?, ?)").run(
    DEFAULT_PACK_ID,
    "Default",
    JSON.stringify(WORDS),
    Date.now(),
  )
}

export { DEFAULT_PACK_ID, randomUUID }
