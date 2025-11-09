# Environment Configuration

## Overview

WhoIsIt uses environment variables for configuration across different environments (development, staging, production). This guide covers all environment variables, their purposes, and recommended values.

## Environment Files

### Backend Environment

**File**: `apps/backend/.env`
**Template**: `apps/backend/.env.example`

```bash
# Copy template
cp apps/backend/.env.example apps/backend/.env
```

### Frontend Environment

**File**: `apps/frontend/.env`
**Template**: `apps/frontend/.env.example`

```bash
# Copy template
cp apps/frontend/.env.example apps/frontend/.env
```

## Backend Configuration

### Database Configuration

#### `DB_HOST`
**Type**: String  
**Required**: Yes  
**Default**: `localhost`  
**Description**: PostgreSQL server hostname

```bash
# Development
DB_HOST=localhost

# Production (Railway, Heroku, etc.)
DB_HOST=postgres-production.railway.app

# Docker
DB_HOST=postgres  # Service name
```

#### `DB_PORT`
**Type**: Integer  
**Required**: Yes  
**Default**: `5432`  
**Description**: PostgreSQL server port

```bash
DB_PORT=5432
```

#### `DB_USER`
**Type**: String  
**Required**: Yes  
**Default**: `postgres`  
**Description**: Database username

```bash
# Development
DB_USER=postgres

# Production
DB_USER=whoisit_prod_user
```

#### `DB_PASSWORD`
**Type**: String  
**Required**: Yes  
**Default**: `postgres`  
**Description**: Database password

```bash
# Development
DB_PASSWORD=postgres

# Production (use strong password!)
DB_PASSWORD=xK9#mP2$vL7@qR4&wN8!
```

**Security Note**: Always use strong, randomly generated passwords in production.

Generate strong password:
```bash
# Unix/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### `DB_NAME`
**Type**: String  
**Required**: Yes  
**Default**: `whois_it`  
**Description**: Database name

```bash
# Development
DB_NAME=whois_it

# Production
DB_NAME=whoisit_production
```

#### `DB_SYNC`
**Type**: Boolean  
**Required**: No  
**Default**: `true`  
**Description**: Auto-sync database schema

```bash
# Development (convenient but risky)
DB_SYNC=true

# Production (NEVER use sync in production!)
DB_SYNC=false
```

**⚠️ Warning**: Setting `DB_SYNC=true` in production will auto-sync the database schema, which can cause data loss. Always use migrations in production.

### Authentication Configuration

#### `JWT_SECRET`
**Type**: String  
**Required**: Yes  
**Default**: None (must set)  
**Description**: Secret key for signing JWT tokens

```bash
# Development (change this!)
JWT_SECRET=your-secret-key-change-this

# Production (use strong random secret)
JWT_SECRET=8f7a9b6c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1r0s
```

**Security Requirements**:
- Minimum 32 characters
- Cryptographically random
- Never commit to source control
- Rotate periodically
- Different for each environment

Generate secure secret:
```bash
# Unix/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

#### `JWT_EXPIRATION`
**Type**: String  
**Required**: No  
**Default**: `7d`  
**Description**: JWT token expiration time

```bash
# 7 days (default)
JWT_EXPIRATION=7d

# Other examples
JWT_EXPIRATION=24h  # 24 hours
JWT_EXPIRATION=30d  # 30 days
JWT_EXPIRATION=1y   # 1 year
```

### Email Configuration

#### `EMAIL_HOST`
**Type**: String  
**Required**: No (emails logged to console if not set)  
**Description**: SMTP server hostname

```bash
# Gmail
EMAIL_HOST=smtp.gmail.com

# SendGrid
EMAIL_HOST=smtp.sendgrid.net

# Mailgun
EMAIL_HOST=smtp.mailgun.org

# AWS SES
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
```

#### `EMAIL_PORT`
**Type**: Integer  
**Required**: No  
**Default**: `587`  
**Description**: SMTP server port

```bash
# TLS (recommended)
EMAIL_PORT=587

# SSL
EMAIL_PORT=465

# Plain (not recommended)
EMAIL_PORT=25
```

#### `EMAIL_USER`
**Type**: String  
**Required**: No  
**Description**: SMTP authentication username

```bash
# Gmail
EMAIL_USER=your-email@gmail.com

# SendGrid
EMAIL_USER=apikey

# Generic
EMAIL_USER=smtp_username
```

#### `EMAIL_PASSWORD`
**Type**: String  
**Required**: No  
**Description**: SMTP authentication password

```bash
# Gmail (use app password, not account password)
EMAIL_PASSWORD=your-app-password

# SendGrid
EMAIL_PASSWORD=your-sendgrid-api-key

# Generic
EMAIL_PASSWORD=smtp_password
```

**Gmail Setup**:
1. Enable 2-factor authentication
2. Generate app password: https://myaccount.google.com/apppasswords
3. Use app password for `EMAIL_PASSWORD`

**SendGrid Setup**:
1. Create API key in SendGrid dashboard
2. Use `apikey` as `EMAIL_USER`
3. Use API key as `EMAIL_PASSWORD`

#### `EMAIL_FROM`
**Type**: String  
**Required**: No  
**Default**: `noreply@whoisit.com`  
**Description**: "From" email address

```bash
EMAIL_FROM=noreply@whoisit.com
EMAIL_FROM="WhoIsIt Game <noreply@yourdomain.com>"
```

### Application Configuration

#### `NODE_ENV`
**Type**: String  
**Required**: No  
**Default**: `development`  
**Description**: Node.js environment

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production

# Testing
NODE_ENV=test
```

**Effects**:
- Enables/disables debug logging
- Affects error messages
- Changes security settings
- Enables/disables hot reload

#### `PORT`
**Type**: Integer  
**Required**: No  
**Default**: `4000`  
**Description**: Backend server port

```bash
# Development
PORT=4000

# Production (often set by hosting platform)
PORT=8080
```

#### `FRONTEND_ORIGIN`
**Type**: String  
**Required**: Yes (production)  
**Description**: Frontend URL for CORS

```bash
# Development (allow all)
FRONTEND_ORIGIN=http://localhost:3000

# Production (specific origin)
FRONTEND_ORIGIN=https://whoisit.com

# Multiple origins (comma-separated)
FRONTEND_ORIGIN=https://whoisit.com,https://www.whoisit.com
```

**⚠️ Security**: Always set specific origin in production to prevent unauthorized cross-origin requests.

#### `FRONTEND_URL`
**Type**: String  
**Required**: Yes  
**Description**: Frontend URL for email links

```bash
# Development
FRONTEND_URL=http://localhost:3000

# Production
FRONTEND_URL=https://whoisit.com
```

### Logging Configuration

#### `LOG_LEVEL`
**Type**: String  
**Required**: No  
**Default**: `info`  
**Description**: Logging verbosity

```bash
# Development (verbose)
LOG_LEVEL=debug

# Production (minimal)
LOG_LEVEL=warn

# Options: error, warn, info, debug, verbose
```

### Monitoring Configuration

#### `SENTRY_DSN`
**Type**: String  
**Required**: No  
**Description**: Sentry error tracking DSN

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

## Frontend Configuration

### API Configuration

#### `NEXT_PUBLIC_API_URL`
**Type**: String  
**Required**: Yes  
**Description**: Backend API base URL

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:4000

# Production
NEXT_PUBLIC_API_URL=https://api.whoisit.com
```

**⚠️ Note**: Must start with `NEXT_PUBLIC_` to be accessible in browser.

#### `NEXT_PUBLIC_SOCKET_URL`
**Type**: String  
**Required**: Yes  
**Description**: WebSocket server URL

```bash
# Development
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Production
NEXT_PUBLIC_SOCKET_URL=https://api.whoisit.com
```

Usually same as `NEXT_PUBLIC_API_URL`.

### Analytics Configuration

#### `NEXT_PUBLIC_GA_ID`
**Type**: String  
**Required**: No  
**Description**: Google Analytics tracking ID

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Environment-Specific Configurations

### Development Environment

**Backend** (`.env`):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
DB_SYNC=true

# Auth
JWT_SECRET=dev-secret-key-change-this
JWT_EXPIRATION=7d

# Email (optional - logs to console if not set)
# EMAIL_HOST=
# EMAIL_PORT=
# EMAIL_USER=
# EMAIL_PASSWORD=

# App
NODE_ENV=development
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

**Frontend** (`.env`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Production Environment

**Backend** (`.env` or platform env vars):
```bash
# Database (use managed database)
DB_HOST=production-db.example.com
DB_PORT=5432
DB_USER=whoisit_prod
DB_PASSWORD=STRONG_RANDOM_PASSWORD_HERE
DB_NAME=whoisit_production
DB_SYNC=false  # NEVER true in production!

# Auth (use strong random secrets)
JWT_SECRET=STRONG_RANDOM_SECRET_64_CHARS_MINIMUM
JWT_EXPIRATION=7d

# Email (configure real SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=YOUR_SENDGRID_API_KEY
EMAIL_FROM=noreply@yourdomain.com

# App
NODE_ENV=production
PORT=4000  # Or set by platform
FRONTEND_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=warn

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Frontend** (`.env` or Vercel env vars):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Staging Environment

Similar to production but with:
- Separate database
- Test email service
- Different domain
- May have DEBUG enabled

```bash
NODE_ENV=staging
FRONTEND_ORIGIN=https://staging.yourdomain.com
FRONTEND_URL=https://staging.yourdomain.com
LOG_LEVEL=info
```

## Platform-Specific Configuration

### Vercel (Frontend)

Environment variables set in Vercel dashboard:

**Project Settings → Environment Variables**

```
NEXT_PUBLIC_API_URL = https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL = https://api.yourdomain.com
```

### Railway (Backend + Database)

Environment variables set in Railway dashboard:

**Project → Variables**

Railway automatically provides:
- `DATABASE_URL` (connection string)
- `PORT` (assigned port)

Can reference Railway database:
```bash
# Railway provides DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:port/db

# Or use individual vars
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}
```

### Heroku (Full-stack)

**Config Vars**:

Heroku automatically provides:
- `DATABASE_URL`
- `PORT`

Set others via Heroku CLI:
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set FRONTEND_ORIGIN=https://yourapp.herokuapp.com
```

### Docker Compose

**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  backend:
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}  # From .env
      DB_NAME: whois_it
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_ORIGIN: http://localhost:3000

  frontend:
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
      NEXT_PUBLIC_SOCKET_URL: http://localhost:4000
```

**`.env` file for Docker Compose**:
```bash
DB_PASSWORD=strong_password
JWT_SECRET=strong_secret
```

## Security Best Practices

### Secrets Management

**Never**:
- ❌ Commit `.env` files to git
- ❌ Share secrets in Slack/email
- ❌ Use weak secrets
- ❌ Reuse secrets across environments

**Always**:
- ✅ Use `.env.example` as template
- ✅ Add `.env` to `.gitignore`
- ✅ Use strong random secrets
- ✅ Different secrets per environment
- ✅ Use platform secret management
- ✅ Rotate secrets periodically

### Environment Variable Security

1. **Use Platform Secret Storage**:
   - Vercel: Encrypted environment variables
   - Railway: Encrypted variables
   - AWS: AWS Secrets Manager
   - GCP: Secret Manager
   - Azure: Key Vault

2. **Access Control**:
   - Limit who can view/edit secrets
   - Use role-based access control
   - Audit secret access

3. **Encryption**:
   - Secrets encrypted at rest
   - Secrets encrypted in transit
   - Never log secrets

### Validating Configuration

**Backend Validation**:
```typescript
// apps/backend/src/config/validation.ts
import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(4000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SYNC: Joi.boolean().default(true),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('7d'),
  FRONTEND_ORIGIN: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
});
```

**Usage**:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: configValidationSchema,
    }),
  ],
})
export class AppModule {}
```

## Troubleshooting

### Backend Can't Connect to Database

**Check**:
1. `DB_HOST` is correct
2. `DB_PORT` is correct
3. `DB_USER` and `DB_PASSWORD` are correct
4. Database server is running
5. Firewall allows connection
6. Network connectivity

**Test Connection**:
```bash
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

### Frontend Can't Connect to Backend

**Check**:
1. `NEXT_PUBLIC_API_URL` is correct
2. Backend is running
3. CORS configured correctly
4. Network connectivity

**Test**:
```bash
curl $NEXT_PUBLIC_API_URL
```

### JWT Token Issues

**Check**:
1. `JWT_SECRET` is set
2. `JWT_SECRET` matches between services
3. Token not expired
4. Cookie sent with requests (`credentials: 'include'`)

### Email Not Sending

**Check**:
1. `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` are set
2. SMTP credentials are correct
3. Email service allows SMTP
4. Not blocked by firewall

**Test SMTP**:
```bash
telnet $EMAIL_HOST $EMAIL_PORT
```

## Environment Variables Checklist

### Before Deployment

- [ ] All required variables set
- [ ] Strong JWT_SECRET generated
- [ ] Database credentials configured
- [ ] CORS origin set correctly
- [ ] Email service configured (optional)
- [ ] Secrets not in source control
- [ ] `.env.example` updated
- [ ] DB_SYNC=false in production
- [ ] NODE_ENV=production
- [ ] Monitoring configured

### After Deployment

- [ ] Test database connection
- [ ] Test API endpoints
- [ ] Test WebSocket connection
- [ ] Test authentication flow
- [ ] Test email sending
- [ ] Verify CORS works
- [ ] Check logs for errors
- [ ] Monitor error rates

## Related Documentation

- [Getting Started](../development/getting-started.md)
- [Production Deployment](./production.md)
- [Database Migrations](./migrations.md)
- [CI/CD Pipeline](./cicd.md)

---

**Last Updated**: November 2024
