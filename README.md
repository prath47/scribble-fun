# Scribble

A real-time multiplayer draw & guess game (skribbl.io-style) — one player draws a secret word each round while everyone else races to guess it in chat. No accounts, no sign-up — just a shareable room code.

## How to play

1. Open the app, enter a name, and pick an avatar (use the arrows or dice to cycle through faces).
2. Click **Create Private Room** to start a new room, or paste a room code and hit **Join Room** to join a friend's.
3. Share the room code / invite link with friends. Once at least 2 players are in the lobby, the host clicks **Start Game**.
4. Each round, the drawer gets 3 word choices and draws the one they pick while everyone else sees blanks (`_ _ _ _`) and guesses in chat.
   - Guess faster to earn more points (up to 100, decaying to a minimum of 20 as time runs out).
   - The drawer earns points for every correct guesser.
   - Random letters are revealed as hints if the round runs long.
5. Play rotates through every player as the drawer (2 rounds each by default). At the end, the final leaderboard is shown — the host can start a new game in the same room.

The server is the only party that ever knows the secret word — it's never sent to a guesser's browser until they guess it correctly or the round ends, so there's nothing to see even by inspecting network traffic.

## Tech stack

**Monorepo:** pnpm workspaces, two packages — `client/` and `server/`.

**Client** (`client/`)
- [React](https://react.dev/) + TypeScript, built with [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4 for styling
- [shadcn/ui](https://ui.shadcn.com/) components on top of [Radix UI](https://www.radix-ui.com/) primitives (button, input, select, dialog, card, avatar, etc.)
- [motion](https://motion.dev/) (Framer Motion) for the landing page animations
- [react-router-dom](https://reactrouter.com/) for client-side routing (landing page ↔ room)
- [sonner](https://sonner.emilkowal.ski/) for toast notifications
- Raw HTML5 `<canvas>` for drawing — no external whiteboard/canvas library
- Avatar art from Freepik ("Kubanek"), attributed on the landing page

**Server** (`server/`)
- [Node.js](https://nodejs.org/) + TypeScript, run via [tsx](https://github.com/privatenumber/tsx)
- [Fastify](https://fastify.dev/) for the couple of REST routes (room creation/lookup, health check)
- [`@fastify/websocket`](https://github.com/fastify/fastify-websocket) (raw `ws`, no Socket.IO) for real-time communication
- In-memory room state (`Map<roomCode, RoomState>`) — no database; rooms are short-lived and torn down after everyone leaves
- A bundled static word list (`server/src/data/words.ts`), no external word API

**Why no CRDT / no Socket.IO / no DB:** only one person draws at a time per round, so strokes are a simple one-to-many broadcast rather than a multi-writer merge problem — no CRDT needed. Raw `ws` keeps the room/broadcast logic explicit instead of hiding it behind a heavier abstraction. Game state is entirely in-memory and short-lived, so there's no database round-trip in the hot path.

## Project structure

```
scribble-fun/
  client/               React app (landing page, lobby, game board)
  server/                Fastify + ws game server
```

## Running locally

Requires Node.js and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

This runs the client (`http://localhost:5173`) and server (`http://localhost:4000`) together. Individually:

```bash
pnpm dev:client
pnpm dev:server
```
