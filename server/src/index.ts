import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import Fastify from "fastify"
import { ensureDefaultWordPack } from "./db/client.js"
import { INSTANCE_ID, PORT, PUBLIC_URL } from "./instanceId.js"
import { registerRoomOwner } from "./redis/registry.js"
import { saveRoomSnapshot } from "./redis/snapshot.js"
import { registerMatchRoutes } from "./routes/matches.js"
import { registerRoomRoutes } from "./routes/rooms.js"
import { registerWordPackRoutes } from "./routes/wordPacks.js"
import { listRooms } from "./rooms/store.js"
import { handleConnection } from "./ws/handlers.js"

await ensureDefaultWordPack()

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(websocket)

registerRoomRoutes(app)
registerWordPackRoutes(app)
registerMatchRoutes(app)

app.get("/api/health", async () => ({ ok: true, instanceId: INSTANCE_ID }))

app.register(async (fastify) => {
  fastify.get<{ Params: { code: string } }>("/ws/:code", { websocket: true }, (socket, request) => {
    void handleConnection(socket, request.params.code)
  })
})

// Redis is optional: if unreachable this is a no-op per-room, so single-instance
// dev keeps working unchanged. When present, this both persists a crash-recovery
// snapshot and keeps this instance's room ownership registration alive.
const SNAPSHOT_INTERVAL_MS = 8_000
setInterval(() => {
  for (const room of listRooms()) {
    if (room.players.size === 0) continue
    void saveRoomSnapshot(room)
    void registerRoomOwner(room.code)
  }
}, SNAPSHOT_INTERVAL_MS)

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`instance ${INSTANCE_ID} public at ${PUBLIC_URL}`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
