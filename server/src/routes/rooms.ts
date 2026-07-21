import type { FastifyInstance } from "fastify"
import { getRoomOwner } from "../redis/registry.js"
import { INSTANCE_ID } from "../instanceId.js"
import { createRoom, getRoom } from "../rooms/store.js"

export function registerRoomRoutes(app: FastifyInstance): void {
  app.post<{ Body: { wordPackId?: string } }>("/api/rooms", async (request) => {
    const room = createRoom(request.body?.wordPackId ?? null)
    return { code: room.code }
  })

  app.get<{ Params: { code: string } }>("/api/rooms/:code", async (request, reply) => {
    const code = request.params.code

    // if another live instance owns this room, tell the client where to go instead
    // of trying (and failing) to serve it from here
    const owner = await getRoomOwner(code)
    if (owner && owner.instanceId !== INSTANCE_ID) {
      return { code: code.toUpperCase(), ownerUrl: owner.url }
    }

    const room = await getRoom(code)
    if (!room) {
      reply.code(404)
      return { error: "Room not found" }
    }
    return { code: room.code, playerCount: room.players.size }
  })
}
