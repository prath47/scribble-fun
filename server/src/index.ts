import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import Fastify from "fastify"
import { registerRoomRoutes } from "./routes/rooms.js"
import { handleConnection } from "./ws/handlers.js"

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(websocket)

registerRoomRoutes(app)

app.get("/api/health", async () => ({ ok: true }))

app.register(async (fastify) => {
  fastify.get<{ Params: { code: string } }>("/ws/:code", { websocket: true }, (socket, request) => {
    handleConnection(socket, request.params.code)
  })
})

const port = Number(process.env.PORT ?? 4000)
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err)
  process.exit(1)
})
