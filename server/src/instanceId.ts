import { randomUUID } from "node:crypto"

export const PORT = Number(process.env.PORT ?? 4000)
export const INSTANCE_ID = process.env.INSTANCE_ID ?? randomUUID().slice(0, 8)
export const PUBLIC_URL = process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
