import type { FastifyInstance } from "fastify"
import { recentMatches } from "../db/matches.js"

export function registerMatchRoutes(app: FastifyInstance): void {
  app.get("/api/matches/recent", async () => {
    return recentMatches(20)
  })
}
