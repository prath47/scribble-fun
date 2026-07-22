# Phase 3 — Reconnect, Multi-Instance (Redis), Persistence

Closes three gaps the design doc explicitly deferred from earlier phases: mid-round
reconnect, Redis-backed multi-instance room routing, and persistent match history /
custom word packs. This doc explains what was built, how it works, and exactly how to
run/demo each piece locally.

## 1. Reconnect mid-round

**Problem it solves:** before this, refreshing your browser tab mid-game dropped you
from the room and re-added you as a brand-new player — losing your score, host status,
and drawer turn, and leaving your canvas blank if you were spectating a round in
progress.

**How it works:**
- On first join, the server issues a random `token` (`server/src/rooms/store.ts`,
  `addPlayer`) alongside the player record. The token is kept in a `playerTokens: Map<token, playerId>`
  on `RoomState` — **never** serialized into `RoomSnapshot` or broadcast to other
  clients, so no one else can see or reuse it.
- The client stores this token in `localStorage`, keyed per room code
  (`client/src/lib/roomToken.ts`), and sends it back on the `join` message if present.
- Disconnects are now a two-step process instead of an instant removal
  (`server/src/rooms/store.ts`):
  - `markDisconnected` — flips `player.connected = false`, keeps their seat/score/host
    status intact, and starts a 20s grace timer.
  - `finalizeRemoval` — the *actual* removal (host migration, draw-order cleanup, idle
    room teardown), fired either by the grace timer expiring or immediately if the
    disconnecting player was the current drawer (the round can't wait on a maybe-returning
    drawer — it ends early and skips to the next player, same as before).
  - `restorePlayer` — if a `join` arrives with a token matching a still-grace-period
    player, it cancels their timer, re-attaches the new socket, and hands back their
    existing player object (score and all) instead of creating a new one.
- **Redraw on reconnect:** the server now keeps a rolling buffer of the current round's
  strokes (`room.currentStrokes`) and sends it back in the `room-state` message. The
  client replays it onto the canvas before live strokes resume
  (`DrawingCanvas.tsx`'s `initialStrokes` prop). The same message also carries the
  current blanks pattern, round end time, and (if you're the drawer) your word again —
  computed live via `engine.ts`'s new `getCurrentBlanks`, which now tracks revealed hint
  letters on `RoomState` instead of a function-local variable, specifically so it can be
  recomputed at any time for a reconnecting client.
- Player cards now show a "Reconnecting…" / dimmed treatment while `connected: false`.

**Known limitation:** chat history is not replayed on reconnect (only game state:
score, seat, canvas, phase). Also, restoring your seat requires the *same browser*
(the token lives in `localStorage`) — opening the room fresh in a different browser or
incognito window is indistinguishable from a new player, by design (no accounts).

## 2. Redis-backed multi-instance routing

**Problem it solves:** the game previously only worked as a single process holding all
room state in memory — fine for a demo, but the doc explicitly calls out how this
should scale to multiple server instances behind a load balancer.

**How it works — matches the doc precisely:** Redis is a **registry + crash-recovery
snapshot**, not a message bus. Every client of a given room ends up talking to the one
instance that owns it, so in-process broadcast keeps working completely unchanged — no
pub/sub relay needed.

- `server/src/redis/registry.ts` — `registerRoomOwner`/`getRoomOwner`. Whichever
  instance creates or takes over a room writes `{instanceId, url}` to
  `room:<code>:owner` with a 20s TTL, refreshed every snapshot tick. If an instance
  dies, it stops refreshing and the key naturally expires ~20s later.
- `server/src/redis/snapshot.ts` — `saveRoomSnapshot`/`loadRoomSnapshot`. Every 8s
  (`index.ts`), each instance snapshots all its in-memory rooms with any players to
  `room:<code>:snapshot` (players, tokens, scores, phase, draw order, current word,
  etc. — everything needed to rebuild the room, minus live sockets/timers).
- `server/src/rooms/store.ts`'s `getRoom` is now `async`: local map hit → return
  immediately (fast path, zero behavior change for single-instance dev). Local miss →
  check the registry. If another instance still owns it, return `undefined` (not mine
  to touch — the room is alive elsewhere). If ownership has lapsed, rehydrate from the
  snapshot, claim ownership, and serve it.
- `GET /api/rooms/:code` checks the registry *first*: if a different live instance owns
  the room, it responds with `{ ownerUrl }` instead of trying to load it locally. The
  client (`client/src/lib/api.ts`'s `resolveRoomOrigin`, used by `useGameConnection`
  before opening any WebSocket) follows this — every room page load resolves the
  correct origin first, so this works even on a direct URL/refresh, not just the
  landing-page join flow.
- Redis is **fully optional** — `redis/client.ts` connects lazily and swallows
  connection errors; if it's unreachable, every registry/snapshot call is a no-op and
  the server behaves exactly like single-instance mode.

**Update:** word packs and match history now live in Postgres (see §3 below), which
*is* a shared, networked store — so unlike the original SQLite version, multiple
instances pointed at the same `DATABASE_URL` genuinely share one history/word-pack set,
not just an accident of running from the same disk.

**Demo it locally:**

```bash
# 1. start Redis
docker compose up -d redis

# 2. instance A (default port 4000)
cd server && pnpm dev

# 3. instance B, in another terminal
cd server && PORT=4001 INSTANCE_ID=B PUBLIC_URL=http://localhost:4001 pnpm dev
```

Create a room via instance A, then `curl http://localhost:4001/api/rooms/<code>` —
instance B reports `{ "ownerUrl": "http://localhost:4000" }` instead of trying to serve
it. Kill instance A (both the `tsx watch` process and its child) and wait ~20s for the
registry TTL to lapse; instance B can now take over the room from its last snapshot.

## 3. Persistent match history + custom word packs

**Problem it solves:** the word bank was a single hardcoded list, and finishing a game
left no trace — no history, no way to play with a different word set.

**How it works:**
- Postgres + [Prisma](https://www.prisma.io/) (`server/prisma/schema.prisma`) — two
  models, `WordPack` (id, name, `words String[]`, createdAt) and `Match` (id, roomCode,
  playedAt, `players Json`, rounds, wordPackId). `server/src/db/client.ts` instantiates
  the Prisma client and seeds a `"Default"` word pack from the existing static word array
  on boot if it doesn't already exist.
- `server/src/db/wordPacks.ts` — `listWordPacks`, `createWordPack`, `getWordsForPack`
  (falls back to the default pack if a room's chosen pack is missing or too small), all
  async Prisma queries. `engine.ts`'s `pickWordOptions` now calls this instead of
  importing the static array directly — which made `pickWordOptions`/`nextTurn` async
  too (call sites that don't need the result just `void nextTurn(room)`).
- `server/src/db/matches.ts` — `recordMatch` (called from `engine.ts`'s `nextTurn` the
  moment a room transitions to `game_end`) and `recentMatches`, also async.
- REST: `GET/POST /api/word-packs`, `GET /api/matches/recent`,
  `POST /api/rooms` now accepts an optional `wordPackId`.
- Client: `WordPackPicker.tsx` on the landing page — pick an existing pack or open a
  small dialog to paste words and create a custom one (auto-selected once saved).
  `RecentGames.tsx` shows the last few completed matches (winner, player count, rounds,
  time ago) near the info footer.
- Connection string comes from `DATABASE_URL` (`server/.env`, gitignored — see
  `server/.env.example` for the local default matching `docker-compose.yml`'s
  `postgres` service). Migrations live in `server/prisma/migrations/` and are checked
  into git; run `pnpm db:migrate` after changing the schema.

**Demo it locally:**

```bash
# 1. start Postgres (and Redis, if also demoing multi-instance)
docker compose up -d postgres

# 2. apply the schema (first time only, or after schema changes)
cd server && pnpm db:migrate

# 3. run the app as usual
pnpm dev
```

On the landing page, click the `+` next to the word-pack dropdown, name a pack and
paste ≥3 words, save it, then create a room — the drawer's word choices will only ever
come from that pack. Finish a game and refresh the landing page to see it appear under
"Recent games". `pnpm db:studio` opens Prisma Studio if you want to browse the tables
directly.

## Verification performed

- `pnpm exec tsc -b --noEmit` (client) / `pnpm exec tsc --noEmit` (server) — clean.
- Reconnect: played a real round via browser automation, refreshed the guesser's tab
  mid-round, confirmed the player list still showed exactly one entry for them (not a
  duplicate), the canvas correctly redrew the drawer's in-progress stroke from the
  server-side buffer, and the round completed normally afterward.
- Multi-instance: created a room on instance A, confirmed instance B's `GET /api/rooms/:code`
  correctly redirected to A; opened a raw WebSocket against the redirected URL and
  completed a full join handshake. Killed instance A, waited for the registry TTL to
  lapse, confirmed instance B successfully rehydrated the room from its Redis snapshot
  (preserved player/score) and claimed ownership.
- Persistence: migrated a real Postgres instance (`docker compose up -d postgres` +
  `pnpm db:migrate`), confirmed the default word pack seeds correctly on boot, created a
  custom word pack via the REST API and confirmed it's queryable afterward, then played
  a full 4-round game via browser automation end-to-end and confirmed the completed
  match (both players' final scores) showed up via `GET /api/matches/recent`.
