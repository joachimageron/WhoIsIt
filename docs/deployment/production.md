# Production Deployment

## Overview

This guide covers deploying the WhoIsIt application to production environments, including platform-specific configurations, best practices, and monitoring.

## Deployment Architecture

### Recommended Stack

```
┌──────────────────────────────────────────┐
│      Vercel (Frontend - Next.js)         │
│  - Automatic deployments from Git        │
│  - Edge CDN distribution                 │
│  - Environment variables management      │
└──────────────────────────────────────────┘
                    ▲
                    │ HTTPS
                    ▼
┌──────────────────────────────────────────┐
│  Railway/Heroku (Backend - NestJS)       │
│  - Auto-scaling                          │
│  - Health checks                         │
│  - Environment variables                 │
└──────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌──────────────────────────────────────────┐
│ Railway/Heroku Postgres (Database)       │
│  - Managed PostgreSQL                    │
│  - Automatic backups                     │
│  - Connection pooling                    │
└──────────────────────────────────────────┘
```

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No console.logs in production code
- [ ] Error handling comprehensive
- [ ] Security vulnerabilities checked

### Configuration

- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] CORS settings correct
- [ ] API rate limiting enabled
- [ ] Secrets rotated from development
- [ ] Monitoring configured

### Database

- [ ] Migrations tested
- [ ] Backup strategy in place
- [ ] DB_SYNC=false (never sync in production!)
- [ ] Connection pooling configured
- [ ] Indexes optimized

## Platform Deployments

### Vercel (Frontend)

**Setup**:
1. Connect GitHub repository
2. Select `apps/frontend` as root directory
3. Framework: Next.js
4. Build command: `cd ../.. && pnpm build --filter=@whois-it/frontend`
5. Install command: `pnpm install`

**Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NODE_ENV=production
```

**Deployment**:
- Automatic on push to `main` branch
- Preview deployments for PRs
- Rollback via Vercel dashboard

**Custom Domain**:
1. Add domain in Vercel settings
2. Configure DNS records
3. SSL automatically provisioned

### Railway (Backend + Database)

**Setup**:
1. Create new project
2. Add PostgreSQL service
3. Add backend service from GitHub

**Backend Configuration**:
```bash
# Build Command
pnpm install && pnpm --filter @whois-it/backend build

# Start Command
node apps/backend/dist/main.js

# Health Check
/health
```

**Environment Variables**:
```bash
NODE_ENV=production
PORT=4000

# Database (from Railway PostgreSQL)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_SYNC=false

# Auth
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION=7d

# CORS
FRONTEND_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email (optional)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@yourdomain.com
```

**Deployment**:
- Automatic on push to `main`
- Manual deploys via dashboard
- Rollback to previous deployment

### Heroku (Alternative)

**Setup**:
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create whoisit-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git push heroku main
```

**Procfile**:
```
web: node apps/backend/dist/main.js
release: pnpm --filter @whois-it/backend migration:run
```

**Config Vars**:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<secret>
heroku config:set FRONTEND_ORIGIN=https://yourdomain.com
```

## Database Setup

### Initial Setup

```bash
# Run migrations
pnpm --filter @whois-it/backend migration:run

# Seed initial data (optional)
pnpm --filter @whois-it/backend seed
```

### Backups

**Automated Backups**:
- Railway: Automatic daily backups (paid plans)
- Heroku: Automatic backups with heroku-postgresql
- Manual: `pg_dump` scheduled via cron

**Manual Backup**:
```bash
# Backup
pg_dump -h hostname -U username -d database > backup.sql

# Restore
psql -h hostname -U username -d database < backup.sql
```

## Monitoring & Logging

### Health Checks

**Backend Health Endpoint**:
```typescript
// src/app.controller.ts
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

**Monitoring Tools**:
- Vercel Analytics (frontend)
- Railway Metrics (backend)
- UptimeRobot (uptime monitoring)

### Error Tracking

**Sentry Integration**:

```typescript
// Backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Frontend
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Logging

**Production Logging**:
```typescript
// Use structured logging
logger.log({
  level: 'info',
  message: 'User logged in',
  userId: user.id,
  timestamp: new Date(),
});
```

## Security

### Environment Variables

- Use platform secret management
- Rotate secrets regularly
- Never commit secrets to git
- Use strong random values

### HTTPS

- Enforce HTTPS in production
- HSTS headers enabled
- Secure cookies

### Rate Limiting

```typescript
// Backend rate limiting
import * as rateLimit from 'express-rate-limit';

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}));
```

### CORS

```typescript
// Strict CORS in production
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN, // Specific origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
```

## Performance Optimization

### Frontend

- Static generation where possible
- Image optimization (Next.js Image)
- Code splitting
- CDN distribution (automatic with Vercel)

### Backend

- Database connection pooling
- Query optimization
- Caching (Redis - future)
- Horizontal scaling

### Database

- Proper indexes
- Query optimization
- Connection pooling
- Read replicas (for scale)

## Scaling

### Horizontal Scaling

**Backend**:
- Multiple instances behind load balancer
- Stateless design (JWT tokens)
- Shared database

**Database**:
- Read replicas for queries
- Write to primary
- Connection pooling

### Vertical Scaling

- Increase CPU/memory
- Upgrade database plan
- More disk space

## Troubleshooting

### Deployment Fails

**Check**:
1. Build logs in platform dashboard
2. Environment variables set correctly
3. Dependencies installed
4. Build command correct

### Application Crashes

**Check**:
1. Application logs
2. Error tracking (Sentry)
3. Health check endpoint
4. Database connection

### Slow Performance

**Check**:
1. Database query performance
2. Memory usage
3. CPU usage
4. Network latency

## Rollback Strategy

### Vercel

1. Go to Deployments
2. Select previous deployment
3. Click "Promote to Production"

### Railway/Heroku

1. Go to Deployments
2. Select previous deployment
3. Click "Redeploy"

### Database

```bash
# Restore from backup
psql -h hostname -U username -d database < backup.sql

# Or revert migration
pnpm migration:revert
```

## Related Documentation

- [Environment Configuration](./environment.md)
- [Database Migrations](./migrations.md)
- [CI/CD Pipeline](./cicd.md)

---

**Last Updated**: November 2024
