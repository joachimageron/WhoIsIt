# WhoIsIt Monorepo

[![CI](https://github.com/joachimageron/WhoIsIt/actions/workflows/ci.yml/badge.svg)](https://github.com/joachimageron/WhoIsIt/actions/workflows/ci.yml)

Monorepo template for the WhoIsIt guessing game featuring a mobile-first Next.js frontend styled with [HeroUI](https://www.heroui.dev), real-time updates through Socket.IO, and a NestJS backend with PostgreSQL persistence.

## Project structure

```text
.
├─ apps/
│  ├─ frontend/    # Next.js + HeroUI client, includes Zustand store and Socket.IO client runtime deps
│  └─ backend/     # NestJS API/WebSocket server configured for PostgreSQL via TypeORM
├─ packages/       # Reserved for future shared libraries
├─ package.json    # Workspace orchestration scripts
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure backend environment**

   Duplicate `apps/backend/.env.example` to `.env` and adjust values for your PostgreSQL instance.

   ```bash
   copy apps\backend\.env.example apps\backend\.env
   ```

3. **Configure frontend environment**

   Duplicate `apps/frontend/.env.example` to `.env` to configure API and Socket.IO URLs.

   ```bash
   copy apps\frontend\.env.example apps\frontend\.env
   ```

   The default values (`http://localhost:4000`) should work for local development.

4. **Run the apps in development**

   ```bash
   pnpm dev
   ```

   - Frontend only: `pnpm dev:frontend`
   - Backend only: `pnpm dev:backend`

## Current Status

**✅ Implemented:**
- Complete authentication system (register, login, email verification, password reset)
- Character sets API with full CRUD operations
- Game lobby system (create, join, get lobby state)
- Game start functionality with character assignment
- Real-time Socket.IO integration with security (authentication, reconnection handling, lobby cleanup)
- Frontend game pages (create game, join game, lobby with real-time updates)
- CI/CD pipeline with GitHub Actions
- Comprehensive test coverage (115/115 backend tests passing)

**🚧 In Development (Phase 3):**
- Gameplay core mechanics (questions, answers, guesses, scoring)
- Game play page UI
- UI components for game interaction

See [todo.md](./todo.md) for detailed roadmap and current progress.

## Tooling highlights

- **Frontend**: Next.js 15 with Turbopack, Tailwind CSS 4, HeroUI component suite, Zustand state management, and Socket.IO client.
- **Backend**: NestJS 11 with ConfigModule, TypeORM auto-loading entities, Socket.IO gateway support, and PostgreSQL driver.
- **Package manager**: pnpm workspaces with shared hoisting configured for HeroUI packages.
