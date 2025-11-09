# Development Workflow

## Overview

This guide covers the day-to-day development workflow for the WhoIsIt project, including setup, development practices, code review, and deployment processes.

## Daily Development Workflow

### 1. Starting Development

```bash
# Pull latest changes
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Install dependencies (if needed)
pnpm install

# Start development servers
pnpm dev  # Starts both frontend and backend
```

### 2. Making Changes

```bash
# Work on your feature
# Edit files, add features, fix bugs

# Run linter frequently
pnpm lint

# Fix linting errors
pnpm lint:fix

# Run tests
pnpm test

# Test specific areas
pnpm --filter @whois-it/backend test auth.service
pnpm --filter @whois-it/frontend test
```

### 3. Committing Changes

```bash
# Check what changed
git status
git diff

# Stage changes
git add apps/backend/src/auth/auth.service.ts
git add apps/backend/src/auth/auth.service.spec.ts

# Commit with descriptive message
git commit -m "feat(auth): add password strength validation

- Add password complexity requirements
- Update validation tests
- Add error messages"

# Push to remote
git push origin feature/my-feature
```

### 4. Creating Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill in PR template:
   - **Title**: Clear, concise description
   - **Description**: What changed and why
   - **Testing**: How to test the changes
   - **Screenshots**: For UI changes
5. Request reviews
6. Address feedback
7. Merge when approved

## Commit Message Convention

### Format

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(game): add character elimination animation"

# Bug fix
git commit -m "fix(auth): prevent duplicate email registration"

# Documentation
git commit -m "docs(api): update WebSocket events reference"

# Refactoring
git commit -m "refactor(lobby): extract player list to separate component"

# Tests
git commit -m "test(auth): add integration tests for password reset"

# With body
git commit -m "feat(game): add turn timer

Implement countdown timer for player turns with visual indicator.
Timer starts when it's player's turn and shows remaining time.

Closes #123"
```

## Branch Strategy

### Branch Types

**Main Branches**:
- `main` - Production code (stable)
- `develop` - Development branch (integration)

**Supporting Branches**:
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

### Workflow

```
main
 └── develop
      ├── feature/add-lobby-chat
      ├── feature/add-sound-effects
      └── fix/connection-timeout
```

### Creating Branches

```bash
# Feature
git checkout -b feature/add-lobby-chat develop

# Bug fix
git checkout -b fix/connection-timeout develop

# Hotfix (from main)
git checkout -b hotfix/security-patch main
```

### Merging

```bash
# Merge feature to develop
git checkout develop
git merge --no-ff feature/add-lobby-chat
git push origin develop

# Delete feature branch
git branch -d feature/add-lobby-chat
git push origin --delete feature/add-lobby-chat
```

## Code Review Process

### Before Requesting Review

- [ ] Code is complete and tested
- [ ] All tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Commits are clean
- [ ] PR description is clear

### Requesting Review

1. Create Pull Request
2. Add reviewers
3. Add labels (feature, bug, documentation)
4. Link related issues
5. Wait for feedback

### Addressing Feedback

```bash
# Make requested changes
# ... edit files ...

# Commit changes
git add .
git commit -m "refactor: address PR feedback

- Extract magic numbers to constants
- Add JSDoc comments
- Improve error handling"

# Push changes
git push origin feature/my-feature
```

### Review Checklist

**For Reviewers**:
- [ ] Code follows project conventions
- [ ] No security vulnerabilities
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No breaking changes (or documented)
- [ ] Performance is acceptable

## Testing Workflow

### Running Tests

```bash
# All tests
pnpm test

# Backend tests only
pnpm --filter @whois-it/backend test

# Frontend tests only
pnpm --filter @whois-it/frontend test

# Watch mode (re-run on changes)
pnpm --filter @whois-it/backend test:watch

# Coverage
pnpm --filter @whois-it/backend test:cov
```

### Writing Tests

**Test-Driven Development (TDD)**:

```bash
# 1. Write failing test
# 2. Implement feature
# 3. Test passes
# 4. Refactor
```

**Example**:

```typescript
// 1. Write test first
describe('AuthService', () => {
  it('should validate password strength', () => {
    const result = authService.validatePassword('weak');
    expect(result.isStrong).toBe(false);
  });
});

// 2. Implement
validatePassword(password: string) {
  return {
    isStrong: password.length >= 8 && /[A-Z]/.test(password),
  };
}

// 3. Test passes ✅

// 4. Refactor if needed
```

## Development Environment

### VS Code Setup

**Recommended Extensions**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Jest Runner
- GitLens

**Settings**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Environment Variables

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env

# Edit with your values
vi apps/backend/.env
```

### Database Setup

```bash
# Start PostgreSQL
# macOS with Homebrew
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Create database
createdb whois_it

# Run migrations (when available)
pnpm --filter @whois-it/backend migration:run

# Seed database
pnpm seed
```

## Debugging Workflow

### Backend Debugging

**VS Code Launch Configuration**:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["--filter", "@whois-it/backend", "start:debug"],
  "console": "integratedTerminal",
  "restart": true,
  "protocol": "inspector",
  "skipFiles": ["<node_internals>/**"]
}
```

**Chrome DevTools**:

```bash
# Start backend in debug mode
pnpm --filter @whois-it/backend start:debug

# Open chrome://inspect
# Click "Open dedicated DevTools for Node"
```

### Frontend Debugging

**Browser DevTools**:
- F12 or Cmd+Option+I
- Network tab for API calls
- Console for errors
- React DevTools extension

**VS Code Debugging**:

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/apps/frontend"
}
```

## Hot Reload / Development Server

### Frontend

```bash
# Start with Turbopack (faster)
pnpm --filter @whois-it/frontend dev

# Runs on http://localhost:3000
# Auto-reloads on file changes
```

### Backend

```bash
# Start with watch mode
pnpm --filter @whois-it/backend start:dev

# Runs on http://localhost:4000
# Auto-restarts on file changes
```

## Common Tasks

### Adding a New Dependency

```bash
# Backend
pnpm --filter @whois-it/backend add package-name

# Frontend
pnpm --filter @whois-it/frontend add package-name

# Shared contracts
pnpm --filter @whois-it/contracts add package-name

# Dev dependency
pnpm --filter @whois-it/backend add -D package-name
```

### Creating a New Module (Backend)

```bash
# Generate module, service, controller
cd apps/backend
nest g module feature-name
nest g service feature-name
nest g controller feature-name
```

### Creating a New Page (Frontend)

```bash
# Create page directory
mkdir -p apps/frontend/app/[lang]/new-page

# Create page.tsx
touch apps/frontend/app/[lang]/new-page/page.tsx
```

### Running Database Migrations

```bash
# Generate migration
pnpm --filter @whois-it/backend migration:generate -n MigrationName

# Run migrations
pnpm --filter @whois-it/backend migration:run

# Revert migration
pnpm --filter @whois-it/backend migration:revert
```

## Performance Profiling

### Frontend

**React DevTools Profiler**:
1. Install React DevTools extension
2. Open DevTools → Profiler tab
3. Click Record
4. Perform actions
5. Stop recording
6. Analyze flame graph

**Lighthouse**:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit
4. Review results

### Backend

**Node.js Profiler**:

```bash
# Start with profiler
node --inspect apps/backend/dist/main.js

# Or with NestJS
pnpm --filter @whois-it/backend start:debug

# Generate CPU profile in Chrome DevTools
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Frontend
lsof -i :4000  # Backend

# Kill process
kill -9 <PID>
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules
pnpm install

# Clear build cache
rm -rf apps/frontend/.next
rm -rf apps/backend/dist
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -h localhost -U postgres -d whois_it

# Reset database
pnpm db:reset
```

### Type Errors After Updating

```bash
# Rebuild TypeScript
pnpm build

# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Best Practices

### 1. Commit Often

Commit small, logical changes frequently:

```bash
# ✅ Good - Small, focused commits
git commit -m "feat: add username validation"
git commit -m "test: add username validation tests"
git commit -m "docs: update auth documentation"

# ❌ Bad - One large commit
git commit -m "add username validation, tests, and docs"
```

### 2. Write Tests First

TDD approach:
1. Write failing test
2. Implement feature
3. Test passes
4. Refactor

### 3. Keep PRs Small

- Max 400 lines changed
- Single feature or fix
- Easy to review

### 4. Update Documentation

Documentation changes should be in the same PR as code changes.

### 5. Run Tests Before Pushing

```bash
# Pre-push checklist
pnpm lint       # ✅
pnpm test       # ✅
pnpm build      # ✅
git push        # 🚀
```

### 6. Review Your Own Code

Before requesting review:
- Read through all changes
- Check for console.logs
- Ensure tests are meaningful
- Verify documentation is updated

## CI/CD Integration

### GitHub Actions

**Workflow runs on**:
- Push to main/develop
- Pull requests

**Steps**:
1. Lint code
2. Run tests
3. Build applications
4. Deploy (if on main)

**Configuration**: `.github/workflows/ci.yml`

## Related Documentation

- [Testing Guide](./testing.md)
- [Debugging Guide](./debugging.md)
- [Getting Started](./getting-started.md)
- [Deployment](../deployment/README.md)

---

**Last Updated**: November 2024
