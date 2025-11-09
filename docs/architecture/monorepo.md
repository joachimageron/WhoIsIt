# Monorepo Structure

## Overview

WhoIsIt uses a **PNPM workspace-based monorepo** to manage multiple related packages in a single repository. This structure enables code sharing, consistent dependency management, and atomic cross-package changes.

## Directory Structure

```text
WhoIsIt/
├── .github/                      # GitHub-specific files
│   ├── workflows/               # CI/CD workflows
│   │   └── ci.yml              # Main CI pipeline
│   └── copilot-instructions.md # AI assistant guidelines
│
├── apps/                        # Application packages
│   ├── frontend/               # Next.js client application
│   │   ├── app/               # Next.js App Router pages
│   │   │   └── [lang]/       # Internationalized routes
│   │   │       ├── auth/     # Authentication pages
│   │   │       ├── game/     # Game pages
│   │   │       └── profile/  # User profile
│   │   ├── components/        # Reusable React components
│   │   ├── config/           # Configuration files
│   │   ├── dictionaries/     # i18n translations
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries
│   │   │   ├── auth-api.ts   # Auth API client
│   │   │   ├── game-api.ts   # Game API client
│   │   │   ├── socket.ts     # Socket.IO client setup
│   │   │   └── guest-session.ts # Guest session manager
│   │   ├── store/            # Zustand state stores
│   │   │   ├── auth-store.ts
│   │   │   └── game-store.ts
│   │   ├── middleware.ts     # Next.js middleware
│   │   ├── package.json
│   │   └── ...config files
│   │
│   └── backend/               # NestJS server application
│       ├── src/
│       │   ├── auth/         # Authentication module
│       │   │   ├── dto/      # Data Transfer Objects
│       │   │   ├── guards/   # Auth guards
│       │   │   ├── services/ # Auth services
│       │   │   └── strategies/ # Passport strategies
│       │   ├── game/         # Game logic module
│       │   │   ├── character-sets/ # Character set management
│       │   │   ├── gateway/  # WebSocket gateway
│       │   │   └── services/ # Game services
│       │   ├── database/     # Database configuration
│       │   │   ├── entities/ # TypeORM entities
│       │   │   ├── migrations/ # DB migrations
│       │   │   └── seeds/    # Database seeding
│       │   ├── email/        # Email service
│       │   └── main.ts       # Application entry point
│       ├── test/             # E2E tests
│       └── package.json
│
├── packages/                  # Shared packages
│   └── contracts/            # Shared TypeScript types
│       ├── index.d.ts        # Type definitions
│       └── package.json
│
├── docs/                     # Documentation
│   ├── architecture/         # Architecture docs
│   ├── backend/             # Backend docs
│   ├── frontend/            # Frontend docs
│   ├── api/                 # API docs
│   ├── development/         # Dev guides
│   └── deployment/          # Deployment docs
│
├── package.json              # Root workspace config
├── pnpm-lock.yaml           # Dependency lock file
├── pnpm-workspace.yaml      # PNPM workspace config
└── README.md                # Project overview
```

## Workspace Configuration

### Root `package.json`

```json
{
  "name": "whois-it",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@10.20.0",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:frontend": "pnpm --filter @whois-it/frontend dev",
    "dev:backend": "pnpm --filter @whois-it/backend start:dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  }
}
```

**Key Features**:

- `private: true` - Prevents accidental publishing
- `packageManager` - Enforces PNPM version
- Workspace-level scripts run across all packages
- `--filter` allows targeting specific packages
- `--parallel` runs commands concurrently

### `pnpm-workspace.yaml`

```yaml
packages:
  - apps/*
  - packages/*

onlyBuiltDependencies:
  - '@heroui/shared-utils'
  - '@nestjs/core'
  - '@tailwindcss/oxide'
  - bcrypt
  - sharp
  - unrs-resolver
```

**Purpose**:

- Defines workspace package locations
- `onlyBuiltDependencies` optimizes hoisting for packages with native binaries
- Ensures HeroUI packages build correctly

## Package Naming Convention

### Package Names

- `@whois-it/frontend` - Next.js frontend app
- `@whois-it/backend` - NestJS backend app
- `@whois-it/contracts` - Shared type definitions

**Convention**: `@whois-it/<package-name>`

- Scoped to organization
- Prevents naming conflicts
- Clear ownership

## Dependency Management

### Types of Dependencies

1. **Workspace Dependencies**

   ```json
   {
     "dependencies": {
       "@whois-it/contracts": "workspace:*"
     }
   }
   ```

   - Uses `workspace:*` protocol
   - Always resolves to local package
   - Enables type sharing

2. **External Dependencies**

   ```json
   {
     "dependencies": {
       "next": "15.3.1",
       "react": "18.3.1"
     }
   }
   ```

   - Standard npm packages
   - Installed via PNPM
   - Shared when possible

3. **Dev Dependencies**

   ```json
   {
     "devDependencies": {
       "typescript": "5.6.3",
       "@types/node": "20.5.7"
     }
   }
   ```

   - Build-time only
   - Not included in production bundles

### Dependency Hoisting

PNPM uses a **content-addressable store** with **symlinks**:

```text
node_modules/
├── .pnpm/                    # Actual package storage
│   ├── next@15.3.1/
│   ├── react@18.3.1/
│   └── ...
└── [symlinks to .pnpm/]      # Symlinked packages
```

**Benefits**:

- Disk space efficiency (single copy per version)
- Fast installation (hard links)
- Strict dependency resolution (no phantom dependencies)

### Special Hoisting Configuration

Some packages require special handling:

```yaml
onlyBuiltDependencies:
  - '@heroui/shared-utils'  # HeroUI internal dependency
  - '@nestjs/core'          # NestJS core framework
  - 'bcrypt'                # Native binary
  - 'sharp'                 # Image processing binary
```

These packages:

- Have native binaries
- Need to be built during installation
- Must be hoisted to workspace root

## Application Packages

### Frontend (`apps/frontend`)

**Type**: Next.js 15 application
**Port**: 3000
**Entry Point**: `app/[lang]/page.tsx`

**Key Directories**:

- `app/[lang]/` - App Router pages with i18n
- `components/` - Reusable UI components
- `store/` - Zustand state management
- `lib/` - API clients and utilities
- `hooks/` - Custom React hooks

**Build Output**: `.next/` (gitignored)

**Scripts**:

```bash
pnpm --filter @whois-it/frontend dev     # Development server
pnpm --filter @whois-it/frontend build   # Production build
pnpm --filter @whois-it/frontend start   # Production server
pnpm --filter @whois-it/frontend lint    # Lint code
```

### Backend (`apps/backend`)

**Type**: NestJS 11 application
**Port**: 4000
**Entry Point**: `src/main.ts`

**Key Directories**:

- `src/auth/` - Authentication module
- `src/game/` - Game logic module
- `src/database/` - Database entities and config
- `src/email/` - Email service
- `test/` - E2E tests

**Build Output**: `dist/` (gitignored)

**Scripts**:

```bash
pnpm --filter @whois-it/backend start:dev  # Development mode
pnpm --filter @whois-it/backend build      # Production build
pnpm --filter @whois-it/backend start:prod # Production server
pnpm --filter @whois-it/backend test       # Run tests
pnpm --filter @whois-it/backend seed       # Seed database
```

## Shared Packages

### Contracts (`packages/contracts`)

**Type**: TypeScript type definitions
**Purpose**: Share types between frontend and backend

**Contents**:

```typescript
// index.d.ts
export type GameStatus = "lobby" | "in_progress" | "completed";
export type CreateGameRequest = { ... };
export type GameLobbyResponse = { ... };
export interface ServerToClientEvents { ... }
export interface ClientToServerEvents { ... }
```

**Usage in Frontend**:

```typescript
import type { GameLobbyResponse } from "@whois-it/contracts";
```

**Usage in Backend**:

```typescript
import type { CreateGameRequest } from "@whois-it/contracts";
```

**Benefits**:

- Single source of truth
- Type safety across apps
- Refactoring safety
- Auto-completion in IDEs

## Workspace Scripts

### Running Scripts

**Parallel Execution** (all workspaces):

```bash
pnpm -r --parallel dev    # Run dev in all packages concurrently
pnpm -r build             # Build all packages sequentially
pnpm -r test              # Test all packages
```

**Filtered Execution** (specific workspace):

```bash
pnpm --filter @whois-it/frontend dev    # Run frontend only
pnpm --filter @whois-it/backend test    # Test backend only
```

**Root-Level Shortcuts** (defined in root `package.json`):

```bash
pnpm dev              # Start both frontend and backend
pnpm build            # Build all workspaces
pnpm lint             # Lint all workspaces
pnpm test             # Test all workspaces
```

### Script Execution Order

PNPM automatically handles dependencies:

1. If frontend depends on contracts, contracts builds first
2. Parallel execution where possible
3. Sequential for dependent packages

## Build Artifacts

### Gitignored Directories

```gitignore
# Frontend
apps/frontend/.next/
apps/frontend/node_modules/

# Backend
apps/backend/dist/
apps/backend/node_modules/

# Root
node_modules/
.pnpm-store/
```

### Build Output Locations

- **Frontend**: `apps/frontend/.next/`
  - Server chunks
  - Client chunks
  - Static files
  
- **Backend**: `apps/backend/dist/`
  - Compiled JavaScript
  - Source maps
  - Type definitions

## Environment Configuration

### Environment Files

Each application has its own `.env` file:

```text
apps/
├── frontend/
│   ├── .env           # Frontend environment variables
│   └── .env.example   # Template
└── backend/
    ├── .env           # Backend environment variables
    └── .env.example   # Template
```

**Frontend `.env`**:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

**Backend `.env`**:

```bash
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
JWT_SECRET=your-secret-key
```

### Environment Variable Scope

- `NEXT_PUBLIC_*` - Exposed to browser (frontend)
- All other variables - Server-side only
- No shared `.env` at root (isolation)

## Version Management

### Versioning Strategy

Currently using **fixed versions** across workspace:

- All packages at `0.1.0`
- Pre-release stage
- Breaking changes allowed

### Future Versioning

For production:

- Semantic versioning (semver)
- Independent package versions
- Changelog generation
- Version bump automation

## Monorepo Advantages

### Developer Experience

1. **Single Clone**: One `git clone` gets entire codebase
2. **Single Install**: One `pnpm install` for all dependencies
3. **Atomic Commits**: Change frontend and backend in one commit
4. **Unified CI/CD**: Single pipeline for all packages
5. **Easy Refactoring**: Change types, update all usage

### Code Sharing

1. **Type Definitions**: Shared via contracts package
2. **Utilities**: Can create shared utils package
3. **Configuration**: Share ESLint, TypeScript configs
4. **Development**: Run all apps with single command

### Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| Large repo size | PNPM's efficient storage |
| Build times | Parallel builds, incremental compilation |
| Dependency conflicts | Strict PNPM resolution |
| Testing complexity | Workspace-filtered test runs |

## PNPM-Specific Features

### Content-Addressable Storage

```text
~/.pnpm-store/
└── v3/
    └── files/
        ├── 00/  # First 2 chars of hash
        │   └── e4f...  # Package content
        └── ...
```

**Benefits**:

- Single global store
- Hard links to projects
- Disk space savings

### Strict Node Modules

PNPM prevents accessing undeclared dependencies:

```typescript
// ❌ Will fail - not in package.json
import { something } from 'undeclared-package';

// ✅ Works - declared in package.json
import { something } from 'declared-package';
```

This prevents "phantom dependencies" common in npm/yarn.

### Peer Dependency Resolution

PNPM resolves peer dependencies automatically:

- Creates multiple instances if needed
- Warns about missing peers
- Better than npm's flat structure

## Best Practices

### Adding Dependencies

**Workspace Dependency**:

```bash
cd apps/frontend
pnpm add @whois-it/contracts@workspace:*
```

**External Dependency**:

```bash
cd apps/frontend
pnpm add socket.io-client
```

**Root-Level Dependency** (shared config):

```bash
pnpm add -w eslint  # -w = workspace root
```

### Removing Dependencies

```bash
cd apps/frontend
pnpm remove socket.io-client
```

### Updating Dependencies

```bash
pnpm update               # Update all to latest allowed
pnpm update --latest      # Update to latest versions
pnpm update --recursive   # Update in all workspaces
```

### Running Commands

**Best Practice**: Use filters for specific packages

```bash
# ✅ Good - explicit
pnpm --filter @whois-it/frontend dev

# ❌ Avoid - ambiguous in monorepo
cd apps/frontend && pnpm dev
```

## Migration Considerations

### From Multi-Repo

If migrating from separate repositories:

1. **Preserve Git History**:

   ```bash
   git subtree add --prefix=apps/frontend frontend-repo main
   ```

2. **Update Imports**: Change absolute to workspace imports
3. **Merge Configs**: Consolidate ESLint, TypeScript configs
4. **Update CI/CD**: Single pipeline for all packages

### To Micro-frontends

If scaling to micro-frontends:

1. Keep shared packages in monorepo
2. Deploy apps independently
3. Use module federation or similar

## Conclusion

The monorepo structure provides a solid foundation for WhoIsIt's development:

- **Type Safety**: Shared contracts ensure consistency
- **Efficiency**: PNPM's storage and hoisting optimize disk usage
- **Developer Experience**: Single command to run entire stack
- **Maintainability**: Atomic changes across multiple packages
- **Scalability**: Easy to add new packages or apps

The combination of PNPM workspaces and TypeScript creates a type-safe, efficient development environment that scales with the project's needs.

---

**Related Documentation**:

- [System Architecture Overview](./overview.md)
- [Technology Stack](./tech-stack.md)
- [Development Workflow](../development/workflow.md)
