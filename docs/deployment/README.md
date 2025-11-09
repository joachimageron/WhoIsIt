# Deployment Documentation

## Overview

This section contains guides for deploying WhoIsIt to production environments, including environment configuration, database migrations, and CI/CD setup.

## Contents

### Environment Configuration (Coming Soon)

Production environment setup:

- Environment variables for frontend and backend
- Security considerations
- Secrets management
- Multi-environment configuration

### Database Migrations (Coming Soon)

Managing database schema changes:

- Creating migrations
- Running migrations in production
- Rolling back migrations
- Migration best practices

### Production Deployment (Coming Soon)

Deploying to production:

- Docker containerization
- Cloud platform options (Vercel, Railway, AWS)
- Database hosting (PostgreSQL)
- Environment-specific configurations
- Health checks and monitoring

### CI/CD Pipeline (Coming Soon)

Automated deployment workflows:

- GitHub Actions configuration
- Automated testing
- Build and deployment
- Environment promotion

## Quick Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] SSL certificates ready
- [ ] Domain configured
- [ ] Backup strategy in place

### Deployment Steps

1. **Backend**:
   - [ ] Build production bundle
   - [ ] Configure database connection
   - [ ] Set JWT secret
   - [ ] Configure CORS origins
   - [ ] Set up email service (optional)
   - [ ] Run database migrations
   - [ ] Deploy to hosting platform

2. **Frontend**:
   - [ ] Build production bundle
   - [ ] Configure API URLs
   - [ ] Set up CDN (if needed)
   - [ ] Deploy to hosting platform

3. **Database**:
   - [ ] Provision PostgreSQL instance
   - [ ] Configure connection pooling
   - [ ] Set up backups
   - [ ] Run migrations
   - [ ] Seed initial data (if needed)

### Post-Deployment

- [ ] Verify health endpoints
- [ ] Test authentication flow
- [ ] Test game creation and joining
- [ ] Monitor error rates
- [ ] Check WebSocket connections
- [ ] Review logs

## Recommended Hosting Platforms

### Frontend (Next.js)

**Vercel** (Recommended)

- Native Next.js support
- Automatic deployments
- Edge functions
- Free tier available

```bash
# Deploy with Vercel CLI
vercel --prod
```

**Alternatives**:

- Netlify
- AWS Amplify
- Railway
- Self-hosted with PM2/Docker

### Backend (NestJS)

**Railway** (Recommended for full-stack)

- PostgreSQL included
- Automatic deployments from GitHub
- Environment variables management
- Affordable pricing

**Alternatives**:

- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run
- DigitalOcean App Platform
- Self-hosted with Docker

### Database (PostgreSQL)

**Included with Backend Platform**:

- Railway (included)
- Heroku Postgres
- AWS RDS

**Managed Database Services**:

- Supabase
- Neon
- PlanetScale (MySQL alternative)
- AWS RDS
- Google Cloud SQL

## Environment Variables

### Backend (`apps/backend/.env`)

```bash
# Server
NODE_ENV=production
PORT=4000

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=whois_it_production
DB_SYNC=false  # IMPORTANT: Never use sync in production!

# Authentication
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production
JWT_EXPIRATION=7d

# Frontend
FRONTEND_ORIGIN=https://whoisit.com
FRONTEND_URL=https://whoisit.com

# Email (Optional)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@whoisit.com

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Frontend (`apps/frontend/.env`)

```bash
# API URLs (must be accessible from browser)
NEXT_PUBLIC_API_URL=https://api.whoisit.com
NEXT_PUBLIC_SOCKET_URL=https://api.whoisit.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**⚠️ Security Notes**:

1. **Never commit `.env` files** to version control
2. Use platform-specific secret management
3. Rotate secrets regularly
4. Use strong, random values for `JWT_SECRET`
5. Enable HTTPS in production (SSL/TLS)

## Database Migration Strategy

### Development

```bash
# Auto-sync (convenient but not safe for production)
DB_SYNC=true pnpm dev:backend
```

### Production

#### Step 1: Generate Migration

```bash
# After making entity changes
pnpm migration:generate DescriptiveMigrationName
```

#### Step 2: Review Migration

```bash
# Check generated migration in apps/backend/src/database/migrations/
# Verify SQL statements are correct
```

#### Step 3: Test Locally

```bash
# Test migration on local database
DB_SYNC=false pnpm migration:run
```

#### Step 4: Run in Production

```bash
# SSH to production or use platform CLI
npm run migration:run
# Or run as part of deployment script
```

#### Step 5: Rollback (if needed)

```bash
npm run migration:revert
```

## Docker Deployment

### Dockerfile for Backend

```dockerfile
# apps/backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/backend ./apps/backend
COPY packages/contracts ./packages/contracts

# Build
WORKDIR /app/apps/backend
RUN pnpm build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/contracts ./packages/contracts

WORKDIR /app/apps/backend

# Run migrations and start
CMD ["sh", "-c", "pnpm migration:run && node dist/main"]
```

### Dockerfile for Frontend

```dockerfile
# apps/frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/contracts/package.json ./packages/contracts/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/frontend ./apps/frontend
COPY packages/contracts ./packages/contracts

# Build
WORKDIR /app/apps/frontend
RUN pnpm build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/package.json ./package.json

# Install production dependencies
RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: whois_it
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: whois_it
      JWT_SECRET: your-secret-key
    ports:
      - "4000:4000"
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
      NEXT_PUBLIC_SOCKET_URL: http://localhost:4000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## GitHub Actions CI/CD

### Workflow File

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10.20.0
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway deployment script
          # Or use Railway GitHub Action

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Health Checks

### Backend Health Endpoint

```typescript
// apps/backend/src/app.controller.ts
@Get()
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### Database Health Check

```typescript
@Get('health/db')
async databaseHealth() {
  try {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    return { status: 'error', database: 'disconnected' };
  }
}
```

## Monitoring and Logging

### Recommended Tools

**Error Tracking**:

- Sentry
- Rollbar
- Bugsnag

**Application Monitoring**:

- New Relic
- DataDog
- AppDynamics

**Log Management**:

- Logtail
- Papertrail
- LogDNA

**Uptime Monitoring**:

- UptimeRobot
- Pingdom
- StatusCake

### Implementing Sentry

```typescript
// Backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Frontend
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Performance Optimization

### Backend

- Enable HTTP compression
- Implement caching (Redis)
- Optimize database queries
- Use connection pooling
- Enable CDN for static assets

### Frontend

- Enable Next.js image optimization
- Use CDN for assets
- Implement code splitting
- Enable compression
- Optimize bundle size

### Database

- Add appropriate indexes
- Implement query caching
- Use read replicas
- Optimize slow queries
- Regular VACUUM (PostgreSQL)

## Security Checklist

- [ ] HTTPS enabled (SSL/TLS)
- [ ] Secure cookies (HttpOnly, Secure, SameSite)
- [ ] JWT secret is strong and secret
- [ ] Database credentials are secure
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Security headers configured
- [ ] Dependencies regularly updated
- [ ] Secrets not in source code
- [ ] Error messages don't leak sensitive info
- [ ] Database backups automated

## Backup Strategy

### Database Backups

**Automated Daily Backups**:

```bash
# PostgreSQL backup script
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | \
  gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3 or similar
aws s3 cp backup-*.sql.gz s3://your-backup-bucket/
```

**Retention Policy**:

- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

## Scaling Considerations

### Horizontal Scaling

**Backend**:

- Multiple backend instances behind load balancer
- Redis for session storage
- Redis adapter for Socket.IO
- Sticky sessions for WebSocket

**Database**:

- Read replicas for scaling reads
- Connection pooling
- Query optimization

**Frontend**:

- CDN for static assets
- Edge functions for API routes

### Monitoring Metrics

- Response times
- Error rates
- WebSocket connections
- Database query performance
- Memory usage
- CPU usage
- Disk usage

## Rollback Strategy

1. **Identify Issue**: Monitor error rates and logs
2. **Quick Rollback**: Revert to previous deployment
3. **Database**: Revert migration if needed
4. **Verify**: Check health endpoints
5. **Post-Mortem**: Document what went wrong

## Related Documentation

- [Getting Started](../development/getting-started.md)
- [Environment Configuration](./environment.md) (Coming Soon)
- [Database Migrations](./migrations.md) (Coming Soon)
- [CI/CD Pipeline](./cicd.md) (Coming Soon)

---

**Deployment Version**: 1.0.0  
**Last Updated**: November 2024
