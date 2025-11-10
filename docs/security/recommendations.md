# Recommandations de Sécurité - WhoIsIt

Ce document présente des recommandations détaillées pour améliorer la sécurité de l'application WhoIsIt, basées sur l'[audit de sécurité](./current-state.md).

## Table des matières

1. [Actions Prioritaires](#actions-prioritaires)
2. [Recommandations Critiques](#recommandations-critiques)
3. [Recommandations Élevées](#recommandations-élevées)
4. [Recommandations Moyennes](#recommandations-moyennes)
5. [Recommandations Faibles](#recommandations-faibles)
6. [Roadmap de Mise en Œuvre](#roadmap-de-mise-en-œuvre)
7. [Checklist de Production](#checklist-de-production)

---

## Actions Prioritaires

### 🚨 Avant Déploiement Production

Ces actions sont **obligatoires** avant tout déploiement en production:

1. ✅ Générer et configurer un secret JWT fort unique
2. ✅ Configurer des credentials DB sécurisés
3. ✅ Implémenter Docker secrets ou un vault
4. ✅ Activer l'audit automatique des dépendances
5. ✅ Mettre en place une stratégie de sauvegarde DB
6. ✅ Exécuter les containers en utilisateur non-root
7. ✅ Hasher les tokens de vérification

**Temps estimé:** 2-3 jours  
**Impact:** Critique

---

## Recommandations Critiques

### 1. Sécurisation du Secret JWT

**Problème:** Secret JWT par défaut `'dev-secret-change-in-production'`

**Solution:**

#### 1.1 Générer un Secret Fort

```bash
# Générer un secret de 64 caractères
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 1.2 Supprimer la Valeur par Défaut

```typescript
// apps/backend/src/auth/auth.module.ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const secret = configService.get<string>('JWT_SECRET');
    
    // AVANT (DANGEREUX):
    // return {
    //   secret: secret || 'dev-secret-change-in-production',
    //   signOptions: { expiresIn: '7d' },
    // };
    
    // APRÈS (SÉCURISÉ):
    if (!secret) {
      throw new Error('JWT_SECRET must be set');
    }
    
    return {
      secret,
      signOptions: { expiresIn: '7d' },
    };
  },
  inject: [ConfigService],
})
```

#### 1.3 Documentation

Ajouter dans `apps/backend/.env.example`:

```bash
# JWT Secret - REQUIRED - NEVER USE A DEFAULT VALUE
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# This value MUST be unique and kept secret
JWT_SECRET=
```

**Impact:** Critique  
**Difficulté:** Facile  
**Temps:** 15 minutes

---

### 2. Sécurisation des Credentials Database

**Problème:** Valeurs par défaut faibles dans docker-compose

**Solution:**

#### 2.1 Supprimer les Valeurs par Défaut

```yaml
# docker-compose.prod.yml

# AVANT (DANGEREUX):
environment:
  POSTGRES_USER: ${DB_USER:-postgres}
  POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}

# APRÈS (SÉCURISÉ):
environment:
  POSTGRES_USER: ${DB_USER:?DB_USER is required}
  POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
```

#### 2.2 Script de Validation

Créer `scripts/validate-env.sh`:

```bash
#!/bin/bash

REQUIRED_VARS=(
  "JWT_SECRET"
  "DB_USER"
  "DB_PASSWORD"
  "FRONTEND_ORIGIN"
  "FRONTEND_URL"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '   - %s\n' "${MISSING_VARS[@]}"
  exit 1
fi

# Validate JWT_SECRET strength
if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "❌ JWT_SECRET must be at least 32 characters"
  exit 1
fi

# Validate DB_PASSWORD strength
if [ ${#DB_PASSWORD} -lt 16 ]; then
  echo "❌ DB_PASSWORD must be at least 16 characters"
  exit 1
fi

echo "✅ All required environment variables are set"
```

Exécuter au démarrage:

```bash
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh && docker-compose up
```

**Impact:** Critique  
**Difficulté:** Facile  
**Temps:** 30 minutes

---

### 3. Migration vers Docker Secrets

**Problème:** Secrets passés en variables d'environnement (visibles avec `docker inspect`)

**Solution:**

#### 3.1 Activer Docker Swarm Mode

```bash
docker swarm init
```

#### 3.2 Créer les Secrets

```bash
# JWT Secret
echo "your-super-secret-jwt-key-here" | docker secret create jwt_secret -

# DB Password
echo "your-super-secret-db-password" | docker secret create db_password -
```

#### 3.3 Modifier docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    # ...
    secrets:
      - jwt_secret
      - db_password
    environment:
      # Ne plus passer les secrets en environnement
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      DB_PASSWORD_FILE: /run/secrets/db_password

  postgres:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

#### 3.4 Adapter le Code Backend

```typescript
// apps/backend/src/config/secrets.ts
import { readFileSync } from 'fs';

export function getSecret(envVar: string, fileVar?: string): string {
  // Try file first (Docker secrets)
  if (fileVar && process.env[fileVar]) {
    try {
      return readFileSync(process.env[fileVar], 'utf-8').trim();
    } catch (error) {
      console.warn(`Failed to read secret from ${process.env[fileVar]}`);
    }
  }
  
  // Fallback to environment variable
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Secret ${envVar} not found`);
  }
  
  return value;
}

// Usage:
// const jwtSecret = getSecret('JWT_SECRET', 'JWT_SECRET_FILE');
```

**Alternative (HashiCorp Vault):**

Si Docker Secrets n'est pas adapté, utiliser HashiCorp Vault:

```bash
# Installation
docker run -d --name=vault --cap-add=IPC_LOCK \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  -p 8200:8200 vault

# Stockage des secrets
vault kv put secret/whoisit \
  jwt_secret="..." \
  db_password="..."
```

**Impact:** Critique  
**Difficulté:** Moyenne  
**Temps:** 2-4 heures

---

### 4. Audit Automatique des Dépendances

**Problème:** Pas de détection des vulnérabilités dans les dépendances

**Solution:**

#### 4.1 Intégrer pnpm audit dans CI/CD

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run daily at 2 AM
    - cron: '0 2 * * *'

jobs:
  audit:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run pnpm audit
        run: pnpm audit --audit-level=moderate
        continue-on-error: false

      - name: Check for high/critical vulnerabilities
        run: |
          pnpm audit --json > audit-results.json
          HIGH_VULNS=$(cat audit-results.json | jq '.metadata.vulnerabilities.high // 0')
          CRITICAL_VULNS=$(cat audit-results.json | jq '.metadata.vulnerabilities.critical // 0')
          
          if [ "$HIGH_VULNS" -gt 0 ] || [ "$CRITICAL_VULNS" -gt 0 ]; then
            echo "❌ Found $CRITICAL_VULNS critical and $HIGH_VULNS high vulnerabilities"
            exit 1
          fi
          
          echo "✅ No critical or high vulnerabilities found"
```

#### 4.2 Intégrer Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "joachimageron"
    labels:
      - "dependencies"
      - "security"

  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/apps/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "joachimageron"
    labels:
      - "dependencies"
      - "security"

  # Root dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

#### 4.3 Intégrer Snyk (Optionnel, Recommandé)

```yaml
# .github/workflows/snyk.yml
name: Snyk Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

**Impact:** Élevé  
**Difficulté:** Facile  
**Temps:** 1-2 heures

---

### 5. Hasher les Tokens de Vérification

**Problème:** Tokens stockés en clair dans la base de données

**Solution:**

#### 5.1 Modifier l'Entity User

```typescript
// apps/backend/src/database/entities/user.entity.ts

// AVANT:
@Column({ type: 'text', nullable: true })
verificationToken?: string | null;

// APRÈS:
@Column({ type: 'text', nullable: true })
verificationTokenHash?: string | null;
```

#### 5.2 Créer un Service de Tokens

```typescript
// apps/backend/src/auth/services/token-hash.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TokenHashService {
  /**
   * Hash a token using SHA-256
   * We use SHA-256 instead of bcrypt because:
   * 1. Tokens are high-entropy (crypto.randomBytes)
   * 2. We need deterministic hashing for lookups
   * 3. Speed is acceptable for this use case
   */
  hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Verify a token against its hash
   */
  verifyToken(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash),
      Buffer.from(hash)
    );
  }
}
```

#### 5.3 Modifier le Service d'Auth

```typescript
// apps/backend/src/auth/services/auth.service.ts

// AVANT:
const verificationToken = crypto.randomBytes(32).toString('hex');
user.verificationToken = verificationToken;

// APRÈS:
const verificationToken = crypto.randomBytes(32).toString('hex');
const verificationTokenHash = this.tokenHashService.hashToken(verificationToken);
user.verificationTokenHash = verificationTokenHash;

// Vérification:
// AVANT:
const user = await this.userRepository.findOne({
  where: { verificationToken: token }
});

// APRÈS:
const tokenHash = this.tokenHashService.hashToken(token);
const user = await this.userRepository.findOne({
  where: { verificationTokenHash: tokenHash }
});
```

#### 5.4 Migration de Données

```typescript
// apps/backend/src/database/migrations/XXXXX-HashVerificationTokens.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class HashVerificationTokens1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new column
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN verification_token_hash TEXT;
    `);
    
    // Migrate existing tokens (if any in production)
    // This step would need to be done carefully in production
    // as we can't recover the original tokens
    
    // Drop old column
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN verification_token;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN verification_token TEXT;
    `);
    
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN verification_token_hash;
    `);
  }
}
```

**Note Importante:** Cette migration invalide tous les tokens existants. Prévoir de re-envoyer les emails de vérification.

**Impact:** Élevé  
**Difficulté:** Moyenne  
**Temps:** 3-4 heures

---

### 6. Stratégie de Sauvegarde Base de Données

**Problème:** Pas de backup automatique de la base de données

**Solution:**

#### 6.1 Script de Backup Automatique

```bash
#!/bin/bash
# scripts/backup-db.sh

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/whoisit_backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting backup at $(date)"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"

# Verify backup
if [ ! -s "$BACKUP_FILE" ]; then
  echo "❌ Backup failed: file is empty"
  exit 1
fi

echo "✅ Backup completed successfully"

# Clean old backups
find "$BACKUP_DIR" -name "whoisit_backup_*.sql.gz" \
  -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned (retention: $RETENTION_DAYS days)"
```

#### 6.2 Cron Job dans Docker

```dockerfile
# Create a backup container
# apps/backend/Dockerfile.backup

FROM postgres:18-alpine

RUN apk add --no-cache \
    bash \
    gzip \
    curl

COPY scripts/backup-db.sh /usr/local/bin/backup-db.sh
RUN chmod +x /usr/local/bin/backup-db.sh

# Install cron
RUN apk add --no-cache dcron

# Add cron job - daily at 3 AM
RUN echo "0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -

CMD ["crond", "-f", "-l", "2"]
```

#### 6.3 Ajouter au docker-compose

```yaml
services:
  db-backup:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile.backup
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    volumes:
      - ./backups:/backups
    depends_on:
      - postgres
    networks:
      - whoisit-network
```

#### 6.4 Backup vers S3 (Production)

```bash
#!/bin/bash
# scripts/backup-db-s3.sh

# ... (backup local comme ci-dessus) ...

# Upload to S3
if [ -n "$AWS_S3_BUCKET" ]; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_FILE" \
    "s3://$AWS_S3_BUCKET/backups/$(basename $BACKUP_FILE)" \
    --storage-class STANDARD_IA
  
  echo "✅ Backup uploaded to S3"
fi
```

#### 6.5 Script de Restauration

```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restoration cancelled"
  exit 0
fi

echo "Restoring from $BACKUP_FILE..."

gunzip -c "$BACKUP_FILE" | PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}"

echo "✅ Database restored successfully"
```

**Impact:** Élevé  
**Difficulté:** Moyenne  
**Temps:** 4-6 heures

---

### 7. Containers Non-Root

**Problème:** Containers s'exécutent en tant que root

**Solution:**

#### 7.1 Modifier Backend Dockerfile

```dockerfile
# apps/backend/Dockerfile

FROM node:25-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# ... (copy files) ...

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
```

#### 7.2 Modifier Frontend Dockerfile

```dockerfile
# apps/frontend/Dockerfile

FROM node:25-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# ... (copy files) ...

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 7.3 Vérification

```bash
# Build and run
docker build -t whoisit-backend:test -f apps/backend/Dockerfile .
docker run --rm whoisit-backend:test whoami
# Should output: nestjs

# Verify no root access
docker run --rm whoisit-backend:test id
# Should output: uid=1001(nestjs) gid=1001(nodejs) groups=1001(nodejs)
```

**Impact:** Moyen  
**Difficulté:** Facile  
**Temps:** 1 heure

---

## Recommandations Élevées

### 8. Renforcement de la Politique de Mots de Passe

**Problème:** Minimum 6 caractères sans complexité

**Solution:**

#### 8.1 Installer zxcvbn

```bash
cd apps/backend
pnpm add zxcvbn
pnpm add -D @types/zxcvbn
```

#### 8.2 Créer un Validator Personnalisé

```typescript
// apps/backend/src/auth/validators/password-strength.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import zxcvbn from 'zxcvbn';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    if (!password) return false;
    
    // Minimum length
    if (password.length < 8) return false;
    
    // Check strength with zxcvbn (score 0-4)
    const result = zxcvbn(password);
    
    // Require score >= 3 (strong)
    if (result.score < 3) return false;
    
    // Require at least:
    // - 1 lowercase letter
    // - 1 uppercase letter
    // - 1 number
    // - 1 special character
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasLowercase && hasUppercase && hasNumber && hasSpecial;
  }

  defaultMessage() {
    return 'Password is too weak. Must be at least 8 characters with uppercase, lowercase, number and special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
```

#### 8.3 Utiliser dans les DTOs

```typescript
// apps/backend/src/auth/dto/register.dto.ts
import { IsStrongPassword } from '../validators/password-strength.validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()  // ✅ Nouveau validator
  password!: string;
}
```

#### 8.4 Feedback Utilisateur Frontend

```typescript
// apps/frontend/lib/password-strength.ts
import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  color: 'red' | 'orange' | 'yellow' | 'lightgreen' | 'green';
  label: string;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const result = zxcvbn(password);
  
  const colors: PasswordStrength['color'][] = [
    'red',
    'orange', 
    'yellow',
    'lightgreen',
    'green'
  ];
  
  const labels = [
    'Très faible',
    'Faible',
    'Moyen',
    'Bon',
    'Excellent'
  ];
  
  return {
    score: result.score,
    feedback: result.feedback.suggestions,
    color: colors[result.score],
    label: labels[result.score],
  };
}
```

**Impact:** Moyen  
**Difficulté:** Moyenne  
**Temps:** 2-3 heures

---

### 9. Content Security Policy (CSP)

**Problème:** Pas de CSP, vulnérable aux XSS

**Solution:**

#### 9.1 Backend: Ajouter CSP avec Helmet

```typescript
// apps/backend/src/main.ts
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Next.js needs unsafe-inline
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_ORIGIN || "'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Needed for some assets
  })
);
```

#### 9.2 Frontend: CSP Headers dans Next.js

```javascript
// apps/frontend/next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_SOCKET_URL};
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

#### 9.3 Tester CSP

```bash
# Utiliser CSP Evaluator de Google
curl -s "https://csp-evaluator.withgoogle.com/evaluate?csp=$(echo -n $CSP | jq -sRr @uri)"
```

**Impact:** Moyen  
**Difficulté:** Moyenne  
**Temps:** 3-4 heures (incluant tests)

---

### 10. Protection CSRF Renforcée

**Problème:** SameSite=Lax insuffisant, pas de tokens CSRF

**Solution Options:**

#### Option A: Passer à SameSite=Strict (Facile)

```typescript
// apps/backend/src/auth/auth.controller.ts
res.cookie('access_token', result.accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',  // ✅ Strict au lieu de Lax
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

**Avantages:**
- Simple à implémenter
- Protection CSRF forte

**Inconvénients:**
- Cookie pas envoyé lors de navigation depuis site externe
- Peut affecter l'UX (utilisateur doit se reconnecter)

#### Option B: Tokens CSRF (Recommandé)

```bash
cd apps/backend
pnpm add csurf
pnpm add -D @types/csurf
```

```typescript
// apps/backend/src/main.ts
import * as csurf from 'csurf';

// After cookieParser
app.use(csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }
}));

// Middleware to attach CSRF token to responses
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  next();
});
```

Frontend:
```typescript
// apps/frontend/lib/api-client.ts
async function apiRequest(url: string, options: RequestInit = {}) {
  // Get CSRF token from cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-TOKEN': csrfToken || '',
    },
    credentials: 'include',
  });
}
```

**Impact:** Moyen  
**Difficulté:** Moyenne  
**Temps:** 2-3 heures

---

## Recommandations Moyennes

### 11. Rotation des Tokens JWT

**Implémentation avec Refresh Tokens:**

```typescript
// apps/backend/src/auth/strategies/jwt-refresh.strategy.ts
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Validate and return user
  }
}
```

**Impact:** Moyen  
**Difficulté:** Élevée  
**Temps:** 8-12 heures

---

### 12. Limite des Connexions WebSocket

```typescript
// apps/backend/src/game/gateway/connection-limiter.ts
@Injectable()
export class ConnectionLimiter {
  private readonly connections = new Map<string, number>();
  private readonly MAX_CONNECTIONS_PER_USER = 5;

  canConnect(userId: string): boolean {
    const count = this.connections.get(userId) || 0;
    return count < this.MAX_CONNECTIONS_PER_USER;
  }

  addConnection(userId: string): void {
    const count = this.connections.get(userId) || 0;
    this.connections.set(userId, count + 1);
  }

  removeConnection(userId: string): void {
    const count = this.connections.get(userId) || 0;
    if (count > 0) {
      this.connections.set(userId, count - 1);
    }
  }
}
```

**Impact:** Moyen  
**Difficulté:** Moyenne  
**Temps:** 2-3 heures

---

## Recommandations Faibles

### 13. Monitoring et Alertes

**Winston Logger + Sentry:**

```bash
cd apps/backend
pnpm add @sentry/node @sentry/tracing winston
```

```typescript
// apps/backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Impact:** Faible  
**Difficulté:** Facile  
**Temps:** 2-3 heures

---

### 14. Tests de Sécurité Automatisés

**OWASP ZAP dans CI/CD:**

```yaml
# .github/workflows/security-scan.yml
- name: ZAP Scan
  uses: zaproxy/action-full-scan@v0.4.0
  with:
    target: 'http://localhost:4000'
```

**Impact:** Faible  
**Difficulté:** Moyenne  
**Temps:** 4-6 heures

---

## Roadmap de Mise en Œuvre

### Phase 1: Corrections Critiques (Semaine 1)
**Temps estimé:** 3-5 jours

- [ ] Jour 1: Sécurisation JWT et DB credentials
- [ ] Jour 2: Docker secrets / Vault
- [ ] Jour 3: Audit automatique des dépendances
- [ ] Jour 4: Hashing des tokens + backup DB
- [ ] Jour 5: Containers non-root + tests

### Phase 2: Améliorations Élevées (Semaine 2-3)
**Temps estimé:** 5-7 jours

- [ ] Politique de mots de passe renforcée
- [ ] Content Security Policy
- [ ] Protection CSRF
- [ ] Tests et documentation

### Phase 3: Optimisations Moyennes (Semaine 4-5)
**Temps estimé:** 5-8 jours

- [ ] Rotation des tokens JWT
- [ ] Limitation connexions WebSocket
- [ ] Amélioration du logging
- [ ] Monitoring de sécurité

### Phase 4: Améliorations Continues (Ongoing)
**Temps estimé:** Continu

- [ ] Tests de pénétration réguliers
- [ ] Revue de code sécurité
- [ ] Formation équipe
- [ ] Documentation à jour

---

## Checklist de Production

### Avant Déploiement

#### Configuration
- [ ] JWT_SECRET unique et fort (32+ caractères)
- [ ] DB_PASSWORD fort (16+ caractères)
- [ ] Toutes les variables d'environnement requises définies
- [ ] Pas de valeurs par défaut en production
- [ ] Docker secrets ou Vault configuré

#### Sécurité
- [ ] Audit des dépendances effectué (`pnpm audit`)
- [ ] Aucune vulnérabilité critique ou élevée
- [ ] Tokens hashés en base de données
- [ ] CSP configurée
- [ ] CORS restreint à l'origine du frontend
- [ ] Rate limiting actif
- [ ] Containers non-root

#### Infrastructure
- [ ] Backup automatique configuré et testé
- [ ] Restauration testée
- [ ] Logs centralisés
- [ ] Monitoring actif (uptime, erreurs)
- [ ] Alertes configurées
- [ ] SSL/TLS configuré
- [ ] Pare-feu configuré

#### Tests
- [ ] Tests de sécurité passés
- [ ] Tests de charge effectués
- [ ] Plan de reprise après sinistre documenté
- [ ] Procédures d'incident documentées

#### Documentation
- [ ] Documentation de sécurité à jour
- [ ] Runbook opérationnel
- [ ] Contacts d'urgence définis
- [ ] Plan de rotation des secrets

### Post-Déploiement

- [ ] Vérification des logs d'erreurs (24h)
- [ ] Vérification du monitoring (48h)
- [ ] Test de restauration backup (semaine 1)
- [ ] Revue de sécurité (mois 1)
- [ ] Audit de pénétration externe (trimestre 1)

---

## Ressources Complémentaires

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

### Outils
- [Snyk](https://snyk.io/) - Vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing
- [Trivy](https://trivy.dev/) - Container scanning
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - CSP validation

### Formation
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

---

## Support

Pour toute question concernant ces recommandations ou leur implémentation, consulter:
- [Document d'état actuel](./current-state.md)
- [Guide des bonnes pratiques](./best-practices.md)
- Issues GitHub du projet

**Dernière mise à jour:** Novembre 2024
