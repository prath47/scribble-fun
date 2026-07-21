import { Redis } from "ioredis"

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379"

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: () => null,
  maxRetriesPerRequest: 1,
})

// swallow connection errors -- Redis/multi-instance is opt-in; without it we just
// run as a single in-memory instance, which is the default (and fully supported) mode.
redis.on("error", () => {})

let connectAttempted = false
let available = false

export async function isRedisAvailable(): Promise<boolean> {
  if (!connectAttempted) {
    connectAttempted = true
    try {
      await redis.connect()
      available = true
    } catch {
      available = false
    }
  }
  return available
}
