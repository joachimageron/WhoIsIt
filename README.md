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

## Tooling highlights

- **Frontend**: Next.js 15 with Turbopack, Tailwind CSS 4, HeroUI component suite, Zustand state management, and Socket.IO client.
- **Backend**: NestJS 11 with ConfigModule, TypeORM auto-loading entities, Socket.IO gateway support, and PostgreSQL driver.
- **Package manager**: pnpm workspaces with shared hoisting configured for HeroUI packages.
