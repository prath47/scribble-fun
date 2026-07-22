# Scribble

A real-time multiplayer draw & guess game, skribbl.io-style. One player draws a secret word while everyone else races to guess it in chat. No accounts, no sign-up — just open the app and share a room code with friends.

## Features

- Create a private room or join one with a 6-character code
- Pick a name and an avatar before you jump in
- Everyone draws in rotation — pick from 3 word choices, then sketch it out on a shared canvas
- Guess in chat: faster guesses earn more points, and the drawer earns points too when people guess correctly
- Letter hints appear automatically if a round is dragging on
- Full leaderboard at the end of the game, with a "Play Again" option
- Reconnects gracefully — if your tab drops mid-game, rejoining picks up right where you left off
- Custom word packs — bring your own word list for a themed game
- Recent games list on the home page

## How to play

1. Open the app, enter a name, and pick an avatar.
2. Click **Create Private Room** to start a new room, or paste a room code and hit **Join Room** to join a friend's.
3. Share the room code (or the invite link) with friends. Once at least 2 players are in the lobby, the host clicks **Start Game**.
4. Each round, the drawer picks a word and draws it while everyone else sees blanks (`_ _ _ _`) and guesses in chat.
5. Play rotates through every player as the drawer. At the end, the final leaderboard is shown and the host can start a new game in the same room.

## Getting started

Requires [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/), and [Docker](https://www.docker.com/) (for Postgres).

```bash
docker compose up -d postgres   # match history + word packs
pnpm install
cd server && pnpm db:migrate    # first time only, or after a schema change
cd ..
pnpm dev
```

This starts everything you need — client at `http://localhost:5173`, server at `http://localhost:4000`. Open the client URL in a couple of browser tabs to try it out with "multiple players."

To run the client or server on their own:

```bash
pnpm dev:client
pnpm dev:server
```

No accounts, no other setup required to play locally.

## Project structure

```
scribble-fun/
  client/    React app — landing page, lobby, and the game itself
  server/    Realtime game server (rooms, drawing, scoring)
```

## Built with

- **Client:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, motion (animations), React Router
- **Server:** Node.js, TypeScript, Fastify, WebSockets
- **Storage:** Postgres (via Prisma) for match history and custom word packs; Redis is optional and only used if you want to run more than one server instance

For details on how reconnect support and multi-server setups work under the hood, see [`PHASE_3.md`](PHASE_3.md).
