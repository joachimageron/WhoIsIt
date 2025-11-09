# CI/CD Pipeline

## Overview

WhoIsIt uses **GitHub Actions** for Continuous Integration and Continuous Deployment (CI/CD). The pipeline automatically tests, builds, and deploys code changes.

## Workflow Overview

```
┌──────────────────────────────────────────────────────────┐
│              Developer pushes to GitHub                   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│               GitHub Actions Triggered                    │
│  1. Checkout code                                        │
│  2. Setup Node.js and PNPM                               │
│  3. Install dependencies                                 │
│  4. Run linting                                          │
│  5. Run tests                                            │
│  6. Build applications                                   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│         Deploy (if on main branch)                       │
│  - Frontend → Vercel (automatic)                         │
│  - Backend → Railway/Heroku (automatic)                  │
└──────────────────────────────────────────────────────────┘
```

## GitHub Actions Configuration

### Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: whois_it_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run backend tests
        run: pnpm --filter @whois-it/backend test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_NAME: whois_it_test
          JWT_SECRET: test-secret
          NODE_ENV: test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build backend
        run: pnpm --filter @whois-it/backend build

      - name: Build frontend
        run: pnpm --filter @whois-it/frontend build
        continue-on-error: true  # Allow Google Fonts to fail
        env:
          NEXT_PUBLIC_API_URL: http://localhost:4000
          NEXT_PUBLIC_SOCKET_URL: http://localhost:4000
```

## Deployment Workflows

### Vercel (Frontend)

**Automatic via Vercel Integration**:
- Vercel detects pushes to main
- Builds and deploys automatically
- Preview deployments for PRs

**Manual via GitHub Actions**:
```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'apps/frontend/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
          vercel-args: '--prod'
```

### Railway (Backend)

**Automatic**:
- Railway watches GitHub repository
- Deploys on push to main
- Runs migrations via release command

**Configuration**:
```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm --filter @whois-it/backend build"

[deploy]
startCommand = "node apps/backend/dist/main.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Branch Protection Rules

### Main Branch

**Required Status Checks**:
- ✅ Linting passes
- ✅ Tests pass
- ✅ Build succeeds

**Settings**:
```
Settings → Branches → Branch protection rules → Add rule

Branch name pattern: main

✓ Require pull request reviews before merging
  - Required approving reviews: 1
✓ Require status checks to pass before merging
  - lint
  - test
  - build
✓ Require branches to be up to date before merging
✓ Do not allow bypassing the above settings
```

### Develop Branch

**Required Status Checks**:
- ✅ Linting passes
- ✅ Tests pass

## Secrets Management

### GitHub Secrets

**Repository Settings → Secrets → Actions**:

```
VERCEL_TOKEN=<vercel-token>
VERCEL_ORG_ID=<org-id>
VERCEL_PROJECT_ID=<project-id>
RAILWAY_TOKEN=<railway-token>
SENTRY_DSN=<sentry-dsn>
```

### Usage in Workflows

```yaml
steps:
  - name: Deploy
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: |
      # Deployment commands
```

## Performance Optimization

### Caching

**Dependencies**:
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'pnpm'  # Cache PNPM store
```

**Build Artifacts**:
```yaml
- uses: actions/cache@v3
  with:
    path: |
      apps/frontend/.next/cache
      apps/backend/dist
    key: ${{ runner.os }}-build-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Matrix Strategy

**Test Multiple Node Versions**:
```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
```

## Monitoring Workflows

### Workflow Status

**View in GitHub**:
1. Repository → Actions tab
2. See all workflow runs
3. Click run for details
4. View logs for each step

**Status Badge**:
```markdown
![CI](https://github.com/username/repo/workflows/CI/badge.svg)
```

### Notifications

**Email Notifications**:
- Automatic on workflow failure
- Configure in GitHub settings

**Slack Integration**:
```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Build failed: ${{ github.workflow }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Deployment Strategies

### Blue-Green Deployment

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: deploy-staging

      - name: Run smoke tests
        run: pnpm test:e2e

      - name: Deploy to production
        if: success()
        run: deploy-production
```

### Canary Deployment

Deploy to small percentage of users:
```yaml
- name: Deploy 10% traffic
  run: deploy-canary --traffic 10

- name: Monitor metrics
  run: monitor --duration 10m

- name: Deploy 100% traffic
  if: success()
  run: deploy-full
```

## Rollback Procedures

### Automatic Rollback

```yaml
- name: Deploy
  id: deploy
  run: deploy-script

- name: Health check
  run: |
    sleep 30
    curl -f https://api.yourdomain.com/health || exit 1

- name: Rollback on failure
  if: failure()
  run: rollback-to-previous
```

### Manual Rollback

```bash
# Vercel
vercel rollback

# Railway
railway rollback

# Heroku
heroku rollback
```

## Best Practices

### 1. Fast Feedback

- Run linting before tests
- Fail fast on errors
- Parallel jobs when possible

### 2. Environment Parity

- Use same Node version as production
- Match database version
- Test with production-like data

### 3. Security

- Use secrets for sensitive data
- Rotate tokens regularly
- Limit secret access

### 4. Monitoring

- Track workflow duration
- Monitor failure rates
- Set up alerts

### 5. Documentation

- Document workflow steps
- Explain complex logic
- Keep runbook updated

## Troubleshooting

### Build Fails

**Check**:
1. Workflow logs
2. Dependencies installed
3. Environment variables set
4. Build command correct

### Tests Fail

**Check**:
1. Database connection
2. Test environment setup
3. Flaky tests
4. Missing dependencies

### Deployment Fails

**Check**:
1. Deployment platform status
2. Secrets configured
3. Build artifacts created
4. Health check passes

## Related Documentation

- [Development Workflow](../development/workflow.md)
- [Production Deployment](./production.md)
- [Testing Guide](../development/testing.md)

---

**Last Updated**: November 2024
