# Getting Started

## Overview

This guide will help you set up the WhoIsIt development environment on your local machine. Follow these steps to get both the frontend and backend running.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PNPM** (v10.20.0 or higher)
   - Install: `npm install -g pnpm@10.20.0`
   - Verify: `pnpm --version`

3. **PostgreSQL** (v12 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

### Optional Software

4. **Git** (for version control)
   - Download: https://git-scm.com/
   - Verify: `git --version`

5. **VS Code** (recommended IDE)
   - Download: https://code.visualstudio.com/
   - Extensions:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/joachimageron/WhoIsIt.git
cd WhoIsIt
```

### 2. Install Dependencies

```bash
pnpm install
```

This will:
- Install all dependencies for frontend, backend, and packages
- Set up workspace links between packages
- Take 2-5 minutes depending on your internet speed

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

1. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE whois_it;

   # Exit psql
   \q
   ```

2. **Verify Connection**:
   ```bash
   psql -U postgres -d whois_it -c "SELECT version();"
   ```

#### Option B: Docker PostgreSQL

```bash
docker run --name whoisit-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=whois_it \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configure Backend Environment

```bash
# Copy example environment file
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
DB_SYNC=true  # Auto-sync schema in development

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000

# Email Configuration (OPTIONAL)
# If not configured, emails will be logged to console
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# EMAIL_FROM=noreply@whoisit.com
```

**⚠️ Important**: Change `JWT_SECRET` to a secure random string!

Generate a secure secret:
```bash
# On Unix/Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32|%{Get-Random -Maximum 256}))
```

### 5. Configure Frontend Environment

```bash
# Copy example environment file
cd apps/frontend
cp .env.example .env
```

Edit `apps/frontend/.env`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Socket.IO server URL (usually same as API)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 6. Seed the Database

```bash
# From project root
pnpm seed
```

This will create:
- 2 demo users (testuser@example.com / Test User)
- 1 character set ("Classic Characters")
- 24 characters in the set

### 7. Start Development Servers

#### Option A: Start Both (Recommended)

```bash
# From project root
pnpm dev
```

This runs both frontend and backend in parallel.

#### Option B: Start Individually

**Terminal 1 - Backend**:
```bash
pnpm dev:backend
```

**Terminal 2 - Frontend**:
```bash
pnpm dev:frontend
```

### 8. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/

## Development Workflow

### Running Commands

```bash
# Development
pnpm dev                # Run both apps
pnpm dev:frontend       # Frontend only
pnpm dev:backend        # Backend only

# Building
pnpm build              # Build all workspaces
pnpm --filter @whois-it/frontend build
pnpm --filter @whois-it/backend build

# Testing
pnpm test               # Run all tests
pnpm --filter @whois-it/backend test

# Linting
pnpm lint               # Lint all workspaces
pnpm --filter @whois-it/frontend lint
pnpm --filter @whois-it/backend lint

# Database
pnpm seed               # Seed database
pnpm db:reset           # Reset database (WARNING: Deletes all data!)
```

### Making Code Changes

1. **Frontend Changes**: 
   - Edit files in `apps/frontend/`
   - Hot reload is automatic (Turbopack)
   - See changes at http://localhost:3000

2. **Backend Changes**:
   - Edit files in `apps/backend/src/`
   - Nest.js watches for changes and recompiles
   - Changes reflected immediately

3. **Shared Types**:
   - Edit `packages/contracts/index.d.ts`
   - Both frontend and backend will use updated types
   - Restart TypeScript server in VS Code if needed

### Creating a New Game

1. Navigate to http://localhost:3000
2. Click "Create Game"
3. Select "Classic Characters"
4. Click "Create Game"
5. Share room code with friends or open in another browser

### Testing Authentication

**Demo Users** (created by seed script):

```
Email: testuser@example.com
Password: password123

Email: testuser2@example.com
Password: password123
```

Or create a new account via the registration page.

## Project Structure Quick Reference

```
WhoIsIt/
├── apps/
│   ├── frontend/          # Next.js app (port 3000)
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # API clients, utilities
│   │   └── store/        # Zustand stores
│   │
│   └── backend/           # NestJS app (port 4000)
│       ├── src/
│       │   ├── auth/     # Authentication
│       │   ├── game/     # Game logic
│       │   ├── database/ # Entities, migrations
│       │   └── main.ts   # Entry point
│       └── test/         # E2E tests
│
└── packages/
    └── contracts/         # Shared TypeScript types
```

## Common Issues and Solutions

### Issue: PNPM not found

```bash
npm install -g pnpm@10.20.0
```

### Issue: PostgreSQL connection failed

**Check if PostgreSQL is running**:
```bash
# On Mac
brew services list

# On Linux
sudo systemctl status postgresql

# On Windows
# Check Services app for PostgreSQL service
```

**Verify credentials in `.env`**:
```bash
# Test connection
psql -h localhost -U postgres -d whois_it
```

### Issue: Port already in use

**Frontend (3000)**:
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

**Backend (4000)**:
```bash
# Find process using port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Issue: Module not found errors

```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Issue: TypeScript errors in VS Code

```bash
# Restart TypeScript server
# Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
# TypeScript: Restart TS Server
```

### Issue: Database schema out of sync

```bash
# Option 1: Reset database (development only!)
pnpm db:reset
pnpm seed

# Option 2: Generate and run migration
pnpm migration:generate FixSchema
pnpm migration:run
```

### Issue: Frontend build fails with Google Fonts error

This is expected in restricted network environments. The error is allowed to fail in CI. Locally, it should work with proper internet access.

### Issue: WebSocket connection fails

1. Check backend is running on port 4000
2. Check `NEXT_PUBLIC_SOCKET_URL` in frontend `.env`
3. Check CORS settings in `apps/backend/src/main.ts`
4. Verify firewall isn't blocking WebSocket connections

## Development Tips

### Hot Reload

- **Frontend**: Turbopack provides instant updates
- **Backend**: Nest.js watches files and recompiles
- **Contracts**: Restart TypeScript server after changes

### Debugging

**Frontend**:
- Use Chrome DevTools
- React DevTools extension
- Console logs in browser

**Backend**:
- Use VS Code debugger
- NestJS built-in logger
- Database query logs (enabled in development)

### Database Inspection

**Using psql**:
```bash
psql -U postgres -d whois_it

# List tables
\dt

# Describe table
\d users

# Query
SELECT * FROM users;

# Exit
\q
```

**Using GUI Tools**:
- pgAdmin: https://www.pgadmin.org/
- DBeaver: https://dbeaver.io/
- TablePlus: https://tableplus.com/

### Environment Variables

**Frontend**:
- Must start with `NEXT_PUBLIC_` to be exposed to browser
- Available in both server and client components

**Backend**:
- All environment variables are server-side only
- Access via `ConfigService` or `process.env`

## Next Steps

Once you have the development environment running:

1. **Explore the Code**:
   - Read [Architecture Documentation](../architecture/overview.md)
   - Review [Design Patterns](../architecture/patterns.md)
   - Check [Database Schema](../backend/database.md)

2. **Make Your First Change**:
   - Follow [Development Workflow](./workflow.md)
   - Read [Testing Guide](./testing.md)
   - Learn [Debugging Techniques](./debugging.md)

3. **Understand the Features**:
   - [Authentication System](../backend/authentication.md)
   - [Game Mechanics](../backend/game-mechanics.md)
   - [Real-time Communication](../backend/websockets.md)

4. **Deploy to Production**:
   - [Environment Configuration](../deployment/environment.md)
   - [Production Deployment](../deployment/production.md)
   - [CI/CD Pipeline](../deployment/cicd.md)

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review [GitHub Copilot Instructions](../../.github/copilot-instructions.md)
3. Search existing GitHub issues
4. Open a new issue with:
   - Steps to reproduce
   - Error messages
   - Environment details (OS, Node version, etc.)

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [HeroUI Documentation](https://www.heroui.dev/)

---

**Welcome to WhoIsIt development! 🎮**
