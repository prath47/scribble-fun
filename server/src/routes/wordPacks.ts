import type { FastifyInstance } from "fastify"
import { createWordPack, listWordPacks } from "../db/wordPacks.js"

export function registerWordPackRoutes(app: FastifyInstance): void {
  app.get("/api/word-packs", async () => {
    return listWordPacks().map((p) => ({ id: p.id, name: p.name, wordCount: p.words.length }))
  })

  app.post<{ Body: { name: string; words: string[] } }>("/api/word-packs", async (request, reply) => {
    const { name, words } = request.body ?? { name: "", words: [] }
    if (!Array.isArray(words) || words.filter((w) => typeof w === "string" && w.trim()).length < 3) {
      reply.code(400)
      return { error: "Need at least 3 words" }
    }
    const pack = createWordPack(name, words)
    return { id: pack.id, name: pack.name, wordCount: pack.words.length }
  })
}
