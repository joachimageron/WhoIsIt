# WhoIsIt Monorepo

[![CI](https://github.com/joachimageron/WhoIsIt/actions/workflows/ci.yml/badge.svg)](https://github.com/joachimageron/WhoIsIt/actions/workflows/ci.yml)

Monorepo for the WhoIsIt 2-player guessing game featuring a mobile-first Next.js frontend styled with [HeroUI](https://www.heroui.dev), real-time updates through Socket.IO, and a NestJS backend with PostgreSQL persistence.

## Project structure

```text
.
├─ apps/
│  ├─ frontend/    # Next.js + HeroUI client, includes Zustand store and Socket.IO client runtime deps
│  └─ backend/     # NestJS API/WebSocket server configured for PostgreSQL via TypeORM
├─ packages/       # Shared libraries (contracts)
├─ package.json    # Workspace orchestration scripts
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

## Getting started

### Option 1: Using Docker (Recommended for Quick Start)

The easiest way to run the application is with Docker:

```bash
# Start all services (frontend, backend, and database)
docker-compose -f docker-compose.dev.yml up

# Access the application
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - PostgreSQL: localhost:5432
```

For production deployment, see the `docker-compose.prod.yml` file.

### Option 2: Using pnpm (Local Development)

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure backend environment**

   Duplicate `apps/backend/.env.example` to `.env` and adjust values for your PostgreSQL instance.

   ```bash
   # On Unix/Linux/macOS
   cp apps/backend/.env.example apps/backend/.env
   
   # On Windows
   copy apps\backend\.env.example apps\backend\.env
   ```

3. **Configure frontend environment**

   Duplicate `apps/frontend/.env.example` to `.env` to configure API and Socket.IO URLs.

   ```bash
   # On Unix/Linux/macOS
   cp apps/frontend/.env.example apps/frontend/.env
   
   # On Windows
   copy apps\frontend\.env.example apps\frontend\.env
   ```

   The default values (`http://localhost:4000`) should work for local development.

4. **Run the apps in development**

   ```bash
   pnpm dev
   ```

   - Frontend only: `pnpm dev:frontend`
   - Backend only: `pnpm dev:backend`

5. **Run tests**

   ```bash
   # Run all tests (frontend + backend)
   pnpm test

   # Backend tests
   pnpm test:backend           # Run all backend tests
   pnpm test:backend:watch     # Watch mode
   pnpm test:backend:cov       # With coverage report
   pnpm test:backend:e2e       # E2E tests only
   pnpm test:backend:debug     # Debug mode

   # Frontend tests
   pnpm test:frontend          # Run all frontend tests
   pnpm test:frontend:watch    # Watch mode
   pnpm test:frontend:cov      # With coverage report

   # All tests in watch mode (parallel)
   pnpm test:watch

   # All tests with coverage
   pnpm test:cov
   ```

   Run tests frequently during development to ensure code quality.

### Database Management (Seeding & Resetting)

**Using Docker (Development):**

```bash
# Seed the database (populates with initial data)
docker-compose -f docker-compose.dev.yml exec backend-dev pnpm seed

# Reset database (drop + recreate + seed)
docker-compose -f docker-compose.dev.yml exec backend-dev pnpm db:reset
```

**Using pnpm directly (Local):**

```bash
# Seed the database
pnpm seed

# Reset database
pnpm db:reset
```

## Tooling highlights

- **Frontend**: Next.js 15 with Turbopack, Tailwind CSS 4, HeroUI component suite, Zustand state management, and Socket.IO client.
- **Backend**: NestJS 11 with ConfigModule, TypeORM auto-loading entities, Socket.IO gateway support, and PostgreSQL driver.
- **Package manager**: pnpm workspaces with shared hoisting configured for HeroUI packages and shared contracts.

## Documentation

Comprehensive documentation is available throughout the codebase:

### Backend Documentation
- **[Game Module](./apps/backend/src/game/README.md)** - Game logic, lobby management, and gameplay mechanics
- **[Authentication Module](./apps/backend/src/auth/README.md)** - User authentication and authorization
- **[Database Module](./apps/backend/src/database/README.md)** - Database schema, entities, and migrations
- **[Email Module](./apps/backend/src/email/README.md)** - Email functionality

### Frontend Documentation
- **[Components](./apps/frontend/components/README.md)** - Reusable React components
- **[State Management](./apps/frontend/store/README.md)** - Zustand stores for global state
- **[Library & Hooks](./apps/frontend/lib/README.md)** - API clients and custom hooks
- **[Game Pages](./apps/frontend/app/[lang]/game/README.md)** - Game-related pages and routing

### Shared Packages
- **[Contracts](./packages/contracts/README.md)** - Shared TypeScript types and API contracts

## Contributing

This repository includes [GitHub Copilot instructions](./.github/copilot-instructions.md) to help developers and AI coding assistants understand the architecture, conventions, and workflows. Review these guidelines before making changes.
