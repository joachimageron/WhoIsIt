# GitHub Copilot Instructions for WhoIsIt Repository

> **Purpose**: These instructions help GitHub Copilot coding agents understand this repository's architecture, conventions, and workflows to provide better assistance and make more accurate code changes.

## How to use these instructions

- **For developers**: These guidelines help Copilot provide context-aware suggestions and completions.
- **For Copilot coding agents**: Follow these instructions when making code changes, debugging issues, or suggesting improvements.

## Quick orientation — what this repo is

- **Monorepo**: PNPM workspace with Next.js frontend (`apps/frontend`) + NestJS backend (`apps/backend`). Types shared via `packages/contracts` (important — use these types everywhere).
- **Real-time communication**: Socket.IO for lobby sync and gameplay (client in `apps/frontend/lib/socket.ts`, server gateway in `apps/backend/src/game/game.gateway.ts`).
- **Tech stack**: Next.js 15 (App Router + Turbopack) + HeroUI components + Tailwind CSS 4 + Zustand (frontend) | NestJS 11 + TypeORM + PostgreSQL (backend).
- **Development**: Frontend runs on port 3000, backend on port 4000 by default.

## Key technical points an AI agent should know

- **Frontend runtime**
  - Next.js 15 App Router with **internationalization** (i18n): routes under `app/[lang]` support `en` and `fr` locales (default: `en`). Middleware in `middleware.ts` handles locale detection and redirects.
  - **HeroUI** component library (React UI components built on Tailwind CSS) — main UI framework. Custom theme config in `tailwind.config.js` with semantic colors (primary/success/warning/danger/secondary).
  - **Zustand** stores: `apps/frontend/store/game-store.ts` (lobby state, connection status) and `apps/frontend/store/auth-store.ts` (user auth state).
  - **Socket.IO client**: `apps/frontend/lib/socket.ts` (getSocket() uses autoConnect: false; transports: ["websocket"]).
  - **Helper hook**: `apps/frontend/hooks/use-game-socket.ts` exposes joinRoom/leaveRoom/updatePlayerReady and listener helpers (onLobbyUpdate, onPlayerJoined, onPlayerLeft, onGameStarted).
  - **Middleware protection**: `middleware.ts` protects routes like `/game/create` — requires either `access_token` cookie (authenticated) OR guest session. Also handles locale routing.

- **Backend runtime**
  - NestJS 11 app (TypeORM + PostgreSQL). Main modules: AuthModule, GameModule, CharacterSetsModule, EmailModule, DatabaseModule.
  - **Backend WebSocket gateway**: `apps/backend/src/game/game.gateway.ts` with custom WebSocket adapter `apps/backend/src/game/ws-auth.adapter.ts`.
  - **Authentication for sockets**: Adapter reads JWT from cookie `access_token` or `handshake.auth.token` and attaches `socket.user` (may be null). Important: connections are allowed even when unauthenticated, but code relies on `socket.user` when available.
  - **Game REST API**: `apps/backend/src/game/game.controller.ts`. Endpoints: `POST /games` (create), `POST /games/:roomCode/join` (join), `GET /games/:roomCode` (get lobby), `POST /games/:roomCode/start` (start + broadcasts).
  - **Character Sets API**: `apps/backend/src/character-sets/character-sets.controller.ts` — CRUD operations for character sets and characters. Used when creating games.
  - **Auth API**: `apps/backend/src/auth/auth.controller.ts` — registration, login, email verification, password reset, logout. Uses JWT tokens in HTTP-only cookies.
  - **Email system**: `apps/backend/src/email/email.service.ts` with MJML templates in `src/email/templates/` — sends verification and password reset emails (or logs to console if not configured).

## Socket.IO contract / patterns (concrete)

- Event names used by both sides (refer to `packages/contracts/index.d.ts`):
  - Client -> Server: `joinRoom`, `leaveRoom`, `updatePlayerReady` (all use callback acknowledgements).
  - Server -> Client: `lobbyUpdate`, `playerJoined`, `playerLeft`, `gameStarted`.
- Client emits with acknowledgement callbacks (see `use-game-socket.ts` implementations). When implementing or changing an event, update `packages/contracts` types first and keep server/client shapes compatible.
- Room codes are normalized to uppercase on the server (`normalizeRoomCode` in `game.gateway.ts`). Frontend should send codes trimmed — server enforces uppercase.

## Useful commands / developer flows (Windows / cmd.exe)

- **Install** (root):
  - `pnpm install`
- **Run both apps in dev** (root):
  - `pnpm dev` (runs both frontend and backend concurrently)
  - Frontend only: `pnpm dev:frontend` (runs `next dev --turbopack` on port 3000)
  - Backend only: `pnpm dev:backend` (runs `nest start --watch` on port 4000)
- **Backend helpers** (seed/reset DB):
  - `pnpm seed` (seeds users and "Classic Characters" set with 24 characters)
  - `pnpm db:reset` (resets database)
- **Build**:
  - `pnpm build` (builds all workspaces)
  - Frontend only: `pnpm --filter @whois-it/frontend build`
  - Backend only: `pnpm --filter @whois-it/backend build`
- **Tests / lint** (root):
  - `pnpm test` (runs all workspace tests — 115/115 backend tests currently passing)
  - `pnpm lint` (runs ESLint across all workspaces)
  - Backend tests only: `pnpm --filter @whois-it/backend test`
  - Frontend currently has no tests

When editing backend socket auth, remember to update `.env` (copy `apps/backend/.env.example` -> `apps/backend/.env`) and set `JWT_SECRET` + DB credentials. Frontend also needs `.env` (copy `apps/frontend/.env.example`) with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`.

## Project-specific conventions to follow

- **Types-first**: shared DTOs and socket types live in `packages/contracts` — change that file for cross-cutting type updates. Both frontend and backend import from `@whois-it/contracts`.
- **Socket pattern**: always use acknowledgement callbacks for client->server messages (server returns `{ success: boolean, ... }`) — frontend expects this shape (see `use-game-socket.ts`).
- **State sync**: UI gets the initial lobby via REST `GET /games/:roomCode` and then joins Socket.IO room for realtime updates (`joinRoom`). The sequence is implemented in `apps/frontend/app/[lang]/game/lobby/[roomCode]/lobby-client.tsx`.
- **Auth on sockets**: Ws adapter allows unauthenticated sockets but marks `socket.user = null`. Server logic frequently checks `client.user` before mapping players — preserve this behavior when changing auth flows.
- **Normalize data on the server**: e.g., room codes are trimmed/uppercased in `normalizeRoomCode()` in game.gateway.ts. Follow these normalizations to avoid subtle bugs.
- **Guest sessions**: Frontend supports guest users via `apps/frontend/lib/guest-session.ts`. Guest sessions are stored in localStorage and tracked via cookies. Middleware allows guests to access game routes like `/game/create`.
- **HeroUI components**: Use HeroUI components (Button, Card, Input, Modal, etc.) from `@heroui/*` packages. Theme customization is in `tailwind.config.js`. Follow existing patterns in components.
- **Internationalization**: All routes are prefixed with `[lang]` (en or fr). Use dictionaries from `apps/frontend/dictionaries/` for translations. Middleware automatically redirects users without locale prefix.

## Integration / external dependencies to watch

- **PostgreSQL** via TypeORM (backend). Env keys in `apps/backend/.env.example` (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME). Default: localhost:5432/whois_it with postgres/postgres credentials.
- **Email config** optional — if not set, the app logs emails to console (see `apps/backend/.env.example`). Uses Nodemailer + MJML for templates.
- **Socket.IO** versions are pinned in package.json (v4.x). Frontend uses `socket.io-client` and backend `socket.io` — keep compatibility when upgrading.
- **HeroUI** packages use specific hoisting configuration in `pnpm-workspace.yaml` (see `onlyBuiltDependencies`). Required for proper build.
- **Tailwind CSS 4** is used with custom HeroUI plugin configuration. Check `tailwind.config.js` for theme customization.
- **CI/CD**: GitHub Actions workflow in `.github/workflows/ci.yml` runs lint, test, and build on push/PR to main/develop branches. Frontend build may fail in restricted environments (Google Fonts) — this is expected and allowed to fail.

## Where to look for examples when implementing features

- **Real-time lobby flow**: `apps/frontend/app/[lang]/game/lobby/[roomCode]/lobby-client.tsx` and `apps/backend/src/game/game.gateway.ts`.
- **Socket auth**: `apps/backend/src/game/ws-auth.adapter.ts` (JWT extraction from cookie or handshake.auth).
- **REST endpoints and validation examples**: `apps/backend/src/game/game.controller.ts`, `apps/backend/src/auth/auth.controller.ts`, and `apps/backend/src/character-sets/character-sets.controller.ts`.
- **Shared types**: `packages/contracts/index.d.ts` (update first when changing payloads/events).
- **Authentication flow**: `apps/frontend/app/[lang]/auth/login/page.tsx` (frontend) and `apps/backend/src/auth/auth.service.ts` (backend logic).
- **HeroUI components usage**: Check existing pages like `apps/frontend/app/[lang]/game/join/join-form.tsx` for Button, Input, Card patterns.
- **Middleware and route protection**: `apps/frontend/middleware.ts` (locale routing + auth guards).
- **Email templates**: `apps/backend/src/email/templates/` for MJML email examples.
- **TypeORM entities**: `apps/backend/src/database/entities/` for all database models (User, Game, GamePlayer, Character, CharacterSet, etc.).
- **Testing patterns**: `apps/backend/src/**/*.spec.ts` for Jest unit tests. Frontend has no tests yet.

## Database and entity relationships

- **TypeORM** with auto-loading entities from `apps/backend/src/database/entities/`.
- **Key entities**: User, Game, GamePlayer, Round, Question, Answer, Guess, Character, CharacterSet, GameEvent, UserStatistics, PlayerStatistics, Invitation.
- **Seeding**: `src/seed.ts` creates demo users and "Classic Characters" set with 24 characters.
- **DB_SYNC** env variable: when `true`, TypeORM auto-syncs schema (use only in dev). In production, use migrations.

## Testing and quality

- **Backend tests**: Jest unit tests in `src/**/*.spec.ts` — 162/162 tests currently passing. Run with `pnpm test`.
- **Frontend tests**: None yet — testing infrastructure not set up.
- **ESLint**: Configured for both apps. Run `pnpm lint` to check all workspaces.
- **CI/CD**: `.github/workflows/ci.yml` runs on push/PR to main/develop. Jobs: lint, test, build.
- **Test patterns**: Look at `apps/backend/src/auth/auth.controller.spec.ts` or `apps/backend/src/game/game.service.spec.ts` for mocking patterns with TypeORM repositories and NestJS testing utilities.

## Current implementation status (Phase 2 complete)

- ✅ **Authentication system**: Complete with email verification and password reset.
- ✅ **Character sets API**: Full CRUD with characters.
- ✅ **Game lobby system**: Create, join, get lobby state, real-time Socket.IO updates.
- ✅ **Game start**: Start game and assign characters to players.
- ✅ **CI/CD pipeline**: GitHub Actions workflow.
- 🚧 **Gameplay mechanics**: Questions, answers, guessing, scoring — NOT YET IMPLEMENTED (planned for Phase 3).
- 🚧 **Game play page**: UI for actual gameplay — NOT YET IMPLEMENTED.

See `todo.md` for detailed roadmap and priorities.

## Common pitfalls and troubleshooting

- **Frontend build fails with Google Fonts error**: This is expected in restricted environments (CI). The build is configured to `continue-on-error: true` in CI. Locally with proper network access, it should work.
- **Socket.IO not connecting**: Check that `NEXT_PUBLIC_SOCKET_URL` in frontend `.env` matches backend URL (default `http://localhost:4000`). Verify backend is running and CORS is properly configured in `main.ts`.
- **TypeORM sync issues**: If DB_SYNC=true and you see schema errors, try `pnpm db:reset` to drop and recreate tables. In production, use migrations instead of sync.
- **Guest session not working**: Ensure `middleware.ts` is checking for both `access_token` AND guest session cookies/localStorage. Check browser console for localStorage keys.
- **Room code case sensitivity**: Room codes are normalized to uppercase on server (`normalizeRoomCode`). Frontend should send trimmed codes.
- **HeroUI styling issues**: Ensure `tailwind.config.js` includes HeroUI content path: `"./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"`.
- **PNPM hoisting issues**: If HeroUI or Tailwind build fails, check `pnpm-workspace.yaml` `onlyBuiltDependencies` configuration is correct.
- **Locale routing confusion**: Remember all routes need `[lang]` prefix. Middleware auto-redirects if missing. Check `middleware.ts` for locale detection logic.

If anything here is unclear or you'd like additional examples (small code snippets or tests), tell me which section to expand and I'll iterate.

---

## Guidelines for Copilot Coding Agents

When making changes to this repository, follow these essential guidelines:

### Making Code Changes

- **Minimal modifications**: Make the smallest possible changes to achieve the goal. Change as few lines as possible.
- **Preserve working code**: Never delete or modify working code unless absolutely necessary for the fix or feature.
- **Test incrementally**: Build and test changes frequently after each modification.
- **Ignore unrelated issues**: Don't fix unrelated bugs or broken tests. Focus only on your specific task.

### Before Making Changes

1. **Understand the codebase**: Explore relevant files and understand the existing architecture.
2. **Check existing tests**: Run `pnpm test` and `pnpm lint` to understand the baseline.
3. **Identify test patterns**: Look at existing tests in `apps/backend/src/**/*.spec.ts` to understand the testing approach.

### During Development

1. **Lint early and often**: Run `pnpm lint` after making changes.
2. **Build frequently**: Use `pnpm build` to catch compilation errors early.
3. **Test thoroughly**: Run relevant tests with `pnpm test` or workspace-specific commands.
4. **Use existing tools**: Prefer ecosystem tools (npm scripts, package managers) over manual changes.

### Security and Quality

- **Security scanning**: Always validate changes don't introduce security vulnerabilities.
- **Dependency checks**: When adding dependencies, verify they don't have known vulnerabilities.
- **Code review**: Request code reviews before finalizing changes using the code_review tool.
- **Type safety**: Maintain TypeScript type safety. Use types from `@whois-it/contracts` for shared interfaces.

### Committing Changes

- **Report progress frequently**: Use the report_progress tool to commit and push changes.
- **Meaningful commits**: Write clear, concise commit messages describing what changed.
- **Review before commit**: Always review the files that will be committed.
- **Use .gitignore**: Exclude build artifacts, dependencies (node_modules, dist), and temporary files.

### Documentation

- **Update related docs**: If you change functionality, update relevant documentation.
- **Keep consistency**: Match the style and format of existing documentation.
- **Inline comments**: Add comments only when they match existing patterns or are necessary for complex logic.

### Troubleshooting Failed Changes

If tests or builds fail:
1. Read error messages carefully
2. Check if the failure is related to your changes
3. Review the specific section in this document related to the error
4. Use the troubleshooting section above for common issues
5. Don't attempt to fix unrelated failures unless explicitly asked

### Key Reminders

- ✅ Always use types from `packages/contracts` for cross-cutting changes
- ✅ Socket.IO events must use acknowledgement callbacks
- ✅ Room codes are uppercase on the server
- ✅ All frontend routes require `[lang]` prefix
- ✅ Guest sessions are supported alongside authenticated users
- ✅ Backend tests are required; frontend tests are not yet set up
- ⚠️ Frontend builds may fail in restricted environments (Google Fonts) - this is expected
- ⚠️ Don't use `DB_SYNC=true` in production - use migrations instead
