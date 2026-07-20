import type { FastifyInstance } from "fastify"
import { createRoom, getRoom } from "../rooms/store.js"

export function registerRoomRoutes(app: FastifyInstance): void {
  app.post("/api/rooms", async () => {
    const room = createRoom()
    return { code: room.code }
  })

  app.get<{ Params: { code: string } }>("/api/rooms/:code", async (request, reply) => {
    const room = getRoom(request.params.code)
    if (!room) {
      reply.code(404)
      return { error: "Room not found" }
    }
    return { code: room.code, playerCount: room.players.size }
  })
}
