try {
  process.loadEnvFile()
} catch {
  // no .env file present (e.g. in production where env vars are set by the platform)
}

import { PrismaClient } from "@prisma/client"
import { WORDS } from "../data/words.js"

export const prisma = new PrismaClient()

export const DEFAULT_PACK_ID = "default"

export async function ensureDefaultWordPack(): Promise<void> {
  const existing = await prisma.wordPack.findUnique({ where: { id: DEFAULT_PACK_ID } })
  if (existing) return
  await prisma.wordPack.create({
    data: { id: DEFAULT_PACK_ID, name: "Default", words: WORDS },
  })
}
