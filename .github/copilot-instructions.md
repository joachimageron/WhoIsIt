## Quick orientation — what this repo is

- Monorepo: Next.js frontend (`apps/frontend`) + NestJS backend (`apps/backend`). Types shared via `packages/contracts` (important — use these types everywhere).
- Real-time communication: Socket.IO (client in `apps/frontend/lib/socket.ts`, server gateway in `apps/backend/src/game/game.gateway.ts`).

## Key technical points an AI agent should know

- Frontend runtime
  - Next.js App Router (app/...) with localized routes under `app/[lang]`.
  - Zustand holds ephemeral game state (`apps/frontend/store/game-store.ts`).
  - Socket client: `apps/frontend/lib/socket.ts` (getSocket() uses autoConnect: false; transports: ["websocket"]).
  - Helper hook: `apps/frontend/hooks/use-game-socket.ts` exposes joinRoom/leaveRoom/updatePlayerReady and listener helpers (onLobbyUpdate, onPlayerJoined, onPlayerLeft, onGameStarted).

- Backend runtime
  - NestJS 11 app (TypeORM + PostgreSQL). Backend WebSocket gateway is `apps/backend/src/game/game.gateway.ts`.
  - Authentication for sockets is done in `apps/backend/src/game/ws-auth.adapter.ts` — it reads JWT from cookie `access_token` or `handshake.auth.token` and attaches `socket.user` (may be null). Important: connections are allowed even when unauthenticated, but code relies on `socket.user` when available.
  - Game REST API controller: `apps/backend/src/game/game.controller.ts`. Important endpoints: `POST /games` (create), `POST /games/:roomCode/join` (join), `GET /games/:roomCode` (get lobby), `POST /games/:roomCode/start` (start + broadcasts).

## Socket.IO contract / patterns (concrete)

- Event names used by both sides (refer to `packages/contracts/index.d.ts`):
  - Client -> Server: `joinRoom`, `leaveRoom`, `updatePlayerReady` (all use callback acknowledgements).
  - Server -> Client: `lobbyUpdate`, `playerJoined`, `playerLeft`, `gameStarted`.
- Client emits with acknowledgement callbacks (see `use-game-socket.ts` implementations). When implementing or changing an event, update `packages/contracts` types first and keep server/client shapes compatible.
- Room codes are normalized to uppercase on the server (`normalizeRoomCode` in `game.gateway.ts`). Frontend should send codes trimmed — server enforces uppercase.

## Useful commands / developer flows (Windows / cmd.exe)

- Install (root):
  - pnpm install
- Run both apps in dev (root):
  - pnpm dev
  - frontend only: `pnpm dev:frontend` (runs `next dev --turbopack`)
  - backend only: `pnpm dev:backend` (runs `nest start --watch`)
- Backend helpers (seed/reset DB):
  - pnpm --filter @whois-it/backend seed
  - pnpm --filter @whois-it/backend db:reset
- Tests / lint (root):
  - pnpm test (runs workspace tests)
  - pnpm lint

When editing backend socket auth, remember to update `.env` (copy `apps/backend/.env.example` -> `apps/backend/.env`) and set `JWT_SECRET` + DB credentials.

## Project-specific conventions to follow

- Types-first: shared DTOs and socket types live in `packages/contracts` — change that file for cross-cutting type updates.
- Socket pattern: always use acknowledgement callbacks for client->server messages (server returns `{ success: boolean, ... }`) — frontend expects this shape (see `use-game-socket.ts`).
- State sync: UI gets the initial lobby via REST `GET /games/:roomCode` and then joins Socket.IO room for realtime updates (`joinRoom`). The sequence is implemented in `apps/frontend/app/[lang]/game/lobby/[roomCode]/lobby-client.tsx`.
- Auth on sockets: Ws adapter allows unauthenticated sockets but marks `socket.user = null`. Server logic frequently checks `client.user` before mapping players — preserve this behavior when changing auth flows.
- Normalize data on the server: e.g., room codes are trimmed/uppercased. Follow these normalizations to avoid subtle bugs.

## Integration / external dependencies to watch

- PostgreSQL via TypeORM (backend). Env keys in `apps/backend/.env.example` (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
- Email config optional — if not set, the app logs emails to console (see `apps/backend/.env.example`).
- Socket.IO versions are pinned in package.json (v4.x). Frontend uses `socket.io-client` and backend `socket.io` — keep compatibility when upgrading.

## Where to look for examples when implementing features

- Real-time lobby flow: `apps/frontend/app/[lang]/game/lobby/[roomCode]/lobby-client.tsx` and `apps/backend/src/game/game.gateway.ts`.
- Socket auth: `apps/backend/src/game/ws-auth.adapter.ts` (JWT extraction from cookie or handshake.auth).
- REST endpoints and validation examples: `apps/backend/src/game/game.controller.ts` and `apps/backend/src/game/game.service.ts`.
- Shared types: `packages/contracts/index.d.ts` (update first when changing payloads/events).

If anything here is unclear or you'd like additional examples (small code snippets or tests), tell me which section to expand and I'll iterate.
