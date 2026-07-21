import { INSTANCE_ID, PUBLIC_URL } from "../instanceId.js"
import { isRedisAvailable, redis } from "./client.js"

const OWNER_TTL_SECONDS = 20

export interface RoomOwner {
  instanceId: string
  url: string
}

export async function registerRoomOwner(code: string): Promise<void> {
  if (!(await isRedisAvailable())) return
  const owner: RoomOwner = { instanceId: INSTANCE_ID, url: PUBLIC_URL }
  await redis.set(`room:${code}:owner`, JSON.stringify(owner), "EX", OWNER_TTL_SECONDS)
}

export async function getRoomOwner(code: string): Promise<RoomOwner | null> {
  if (!(await isRedisAvailable())) return null
  const raw = await redis.get(`room:${code.toUpperCase()}:owner`)
  return raw ? (JSON.parse(raw) as RoomOwner) : null
}
