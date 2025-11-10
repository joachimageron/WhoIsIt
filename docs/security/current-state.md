# État Actuel de la Sécurité - WhoIsIt

Ce document présente un audit détaillé des mesures de sécurité actuellement en place dans l'application WhoIsIt.

## Date de l'audit
**Date:** Novembre 2024  
**Version:** 0.1.0

---

## Table des matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Sécurité Backend](#sécurité-backend)
3. [Sécurité Frontend](#sécurité-frontend)
4. [Infrastructure et Déploiement](#infrastructure-et-déploiement)
5. [Base de Données](#base-de-données)
6. [Points Forts](#points-forts)
7. [Vulnérabilités Identifiées](#vulnérabilités-identifiées)

---

## Résumé Exécutif

L'application WhoIsIt présente un **niveau de sécurité satisfaisant** avec plusieurs mesures de protection déjà en place. Cependant, des améliorations importantes sont nécessaires pour un environnement de production.

**Évaluation globale:** 🟡 **Moyen/Bon**
- ✅ Authentification JWT robuste
- ✅ Validation des données entrantes
- ✅ Protection contre le brute-force (rate limiting)
- ⚠️ Gestion des secrets à améliorer
- ⚠️ Audit des dépendances manquant
- ⚠️ Monitoring de sécurité absent

---

## Sécurité Backend

### 1. Authentification et Autorisation

#### ✅ Points Forts

**JWT (JSON Web Tokens)**
- Implémentation avec `@nestjs/jwt` et `passport-jwt`
- Tokens stockés dans des cookies HTTP-only
- Expiration configurée à 7 jours
- Vérification du secret JWT en production
- Double extraction: cookies ET headers Authorization

```typescript
// Source: apps/backend/src/auth/strategies/jwt.strategy.ts
jwtFromRequest: ExtractJwt.fromExtractors([
  (request: Request) => {
    return request?.cookies?.access_token as string | null;
  },
  ExtractJwt.fromAuthHeaderAsBearerToken(),
])
```

**Hachage des mots de passe**
- Utilisation de bcrypt avec un coût de 10 rounds
- Mots de passe jamais stockés en clair
- Vérification sécurisée avec `bcrypt.compare()`

```typescript
// Source: apps/backend/src/auth/services/auth.service.ts
const passwordHash = await bcrypt.hash(password, 10);
```

**Gestion des sessions**
- Support des utilisateurs authentifiés et invités
- Tracking de la dernière activité (`lastSeenAt`)
- Déconnexion côté serveur (suppression du cookie)

#### ⚠️ Points à Améliorer

1. **Secret JWT par défaut faible**
   - Valeur de fallback: `'dev-secret-change-in-production'`
   - Risque si oublié en production
   - **Impact:** Critique

2. **Pas de rotation des tokens**
   - Tokens valides 7 jours sans rafraîchissement
   - Pas de mécanisme de révocation
   - **Impact:** Moyen

3. **Pas de limitation du nombre de sessions simultanées**
   - Un utilisateur peut avoir un nombre illimité de tokens actifs
   - **Impact:** Faible

### 2. Validation des Données

#### ✅ Points Forts

**ValidationPipe Global**
```typescript
// Source: apps/backend/src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // Supprime les propriétés non-définies
    forbidNonWhitelisted: true, // Rejette les requêtes avec propriétés non-définies
    transform: true,            // Transforme les données au bon type
  }),
);
```

**DTOs avec class-validator**
- Validation stricte sur tous les endpoints
- Contraintes de longueur minimale pour les mots de passe (6 caractères)
- Validation des emails
- Validation des usernames (minimum 3 caractères)

```typescript
// Source: apps/backend/src/auth/dto/register.dto.ts
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
  @MinLength(6)
  password!: string;
}
```

#### ⚠️ Points à Améliorer

1. **Contraintes de mot de passe faibles**
   - Minimum 6 caractères seulement
   - Pas de vérification de complexité (majuscules, chiffres, caractères spéciaux)
   - **Recommandation:** Minimum 8 caractères + complexité
   - **Impact:** Moyen

2. **Pas de validation de la force du mot de passe**
   - Pas de détection des mots de passe communs
   - **Impact:** Moyen

### 3. Protection contre les Attaques

#### ✅ Points Forts

**Rate Limiting Global**
```typescript
// Source: apps/backend/src/app.module.ts
ThrottlerModule.forRoot([
  {
    ttl: 60000,  // 60 secondes
    limit: 100,  // 100 requêtes
  },
])
```

**Rate Limiting Spécifique par Endpoint**
- Login: 5 tentatives/minute
- Register: 3 tentatives/minute
- Forgot password: 3 tentatives/minute
- Resend verification: 3 tentatives/minute

```typescript
// Source: apps/backend/src/auth/auth.controller.ts
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
```

**Headers de Sécurité avec Helmet**
```typescript
// Source: apps/backend/src/main.ts
app.use(helmet());
```

Helmet active automatiquement:
- `X-DNS-Prefetch-Control`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `X-Download-Options: noopen`
- `X-Permitted-Cross-Domain-Policies`

**CORS Configuré**
```typescript
// Source: apps/backend/src/main.ts
app.enableCors({
  origin: frontendOrigin || false,  // Pas de wildcard
  credentials: true,
})
```

#### ⚠️ Points à Améliorer

1. **Pas de protection CSRF explicite**
   - Cookies SameSite=Lax (pas Strict)
   - Pas de tokens CSRF pour les mutations
   - **Impact:** Moyen

2. **Pas de Content Security Policy (CSP)**
   - Helmet n'active pas CSP par défaut
   - Vulnérable aux attaques XSS si une faille est trouvée
   - **Impact:** Moyen

3. **Pas de détection de tentatives de brute-force distribuées**
   - Rate limiting basé uniquement sur l'IP
   - Pas de détection par compte
   - **Impact:** Moyen

### 4. WebSocket Security

#### ✅ Points Forts

**Authentification des Connexions WebSocket**
```typescript
// Source: apps/backend/src/auth/ws-auth.adapter.ts
server.use(async (socket: AuthenticatedSocket, next) => {
  // Extraction du JWT depuis les cookies ou headers
  // Vérification et attachement de l'utilisateur au socket
})
```

- Authentification optionnelle (supporte les invités)
- Vérification du JWT avant acceptation de la connexion
- Logging des échecs d'authentification
- CORS configuré sur le gateway

#### ⚠️ Points à Améliorer

1. **Pas de limitation du nombre de connexions simultanées**
   - Un utilisateur peut ouvrir un nombre illimité de connexions WebSocket
   - **Impact:** Moyen (risque de DoS)

2. **Pas de validation stricte des messages**
   - Les événements WebSocket ne sont pas validés avec class-validator
   - Validation basique avec TypeScript uniquement
   - **Impact:** Faible

### 5. Gestion des Emails

#### ✅ Points Forts

**Emails Transactionnels Sécurisés**
- Templates MJML pour les emails
- Tokens de vérification générés avec `crypto.randomBytes(32)`
- Expiration des tokens (24h pour vérification, temps limité pour reset)
- Pas d'exposition des informations sensibles dans les emails

```typescript
// Source: apps/backend/src/auth/services/auth.service.ts
const verificationToken = crypto.randomBytes(32).toString('hex');
const verificationTokenExpiresAt = new Date();
verificationTokenExpiresAt.setHours(
  verificationTokenExpiresAt.getHours() + 24,
);
```

#### ⚠️ Points à Améliorer

1. **Stockage des credentials email en environnement**
   - Pas de rotation automatique
   - Utilisation potentielle de mots de passe d'application Gmail (acceptable)
   - **Impact:** Faible

2. **Pas de vérification de la livraison des emails**
   - Échec silencieux si l'envoi échoue
   - **Impact:** Faible

---

## Sécurité Frontend

### 1. Gestion de l'Authentification

#### ✅ Points Forts

**Cookies HTTP-Only**
- Tokens JWT stockés dans des cookies HTTP-only
- Protection contre les attaques XSS (JavaScript ne peut pas lire le token)
- SameSite=Lax pour protection CSRF basique

```typescript
// Source: apps/backend/src/auth/auth.controller.ts
res.cookie('access_token', result.accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

**Middleware de Protection des Routes**
```typescript
// Source: apps/frontend/middleware.ts
const protectedGameRoutes = ["/game/create"];
// Vérification de l'authentification avant accès
```

#### ⚠️ Points à Améliorer

1. **Stockage dans localStorage**
   - Certaines données de session dans localStorage (invités)
   - Vulnérable aux attaques XSS
   - **Impact:** Moyen

2. **SameSite=Lax au lieu de Strict**
   - Protection CSRF limitée
   - **Impact:** Faible

### 2. Configuration Next.js

#### ✅ Points Forts

**Variables d'Environnement Publiques**
- Variables `NEXT_PUBLIC_*` explicitement définies
- Pas de fuites de secrets backend côté client

```env
# Source: apps/frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

**Internationalization Sécurisée**
- Pas de vulnérabilités d'injection dans les traductions
- Utilisation de `intl-messageformat`

#### ⚠️ Points à Améliorer

1. **Pas de Content Security Policy**
   - Next.js peut être configuré avec des headers CSP
   - Non implémenté actuellement
   - **Impact:** Moyen

2. **Pas de Subresource Integrity (SRI)**
   - CDN externes sans vérification d'intégrité
   - **Impact:** Faible (HeroUI chargé via npm)

---

## Infrastructure et Déploiement

### 1. Docker Configuration

#### ✅ Points Forts

**Multi-stage Builds**
```dockerfile
# Source: apps/backend/Dockerfile
FROM node:25-alpine AS builder
# Build stage

FROM node:25-alpine AS production
# Production stage - only production dependencies
```

**Images Optimisées**
- Utilisation de `node:25-alpine` (petite surface d'attaque)
- Installation des dépendances de production uniquement en prod
- Séparation des stages builder/production

**Health Checks**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health'...)"
```

**Network Isolation**
- Réseau Docker bridge dédié: `whoisit-network`
- Services isolés les uns des autres

#### ⚠️ Points à Améliorer

1. **Images Node non-root**
   - Containers s'exécutent en tant que root
   - **Recommandation:** Utiliser un utilisateur non-root
   - **Impact:** Moyen

```dockerfile
# Recommandé:
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

2. **Pas de scan de vulnérabilités dans les images**
   - Pas d'intégration avec Trivy, Snyk, ou similaire
   - **Impact:** Moyen

3. **Secrets en variables d'environnement**
   - JWT_SECRET, DB_PASSWORD passés en clair dans docker-compose
   - **Recommandation:** Utiliser Docker secrets
   - **Impact:** Élevé en production

### 2. Variables d'Environnement

#### ✅ Points Forts

**Fichiers .env.example**
- Templates fournis avec documentation
- Warnings de sécurité dans les commentaires
- Pas de valeurs réelles committées

```bash
# Source: .env.example
# SECURITY: Never commit this file with real credentials
JWT_SECRET=change-this-to-a-very-secure-random-key-in-production
```

**.gitignore Configuré**
```gitignore
# Source: .gitignore
.env
.env*.local
.env.prod
.env.production
```

#### ⚠️ Points à Améliorer

1. **Pas de validation des variables d'environnement au démarrage**
   - Application démarre même avec des valeurs manquantes ou invalides
   - Sauf JWT_SECRET en production (check partiel)
   - **Impact:** Moyen

2. **Valeurs par défaut faibles**
   ```typescript
   password: process.env.DB_PASSWORD ?? 'postgres',
   ```
   - **Impact:** Élevé si oublié en production

### 3. CI/CD

#### ✅ Points Forts

**Pipeline GitHub Actions**
```yaml
# Source: .github/workflows/ci.yml
- Lint
- Tests
- Build
```

**Permissions Minimales**
```yaml
permissions:
  contents: read
```

#### ⚠️ Points à Améliorer

1. **Pas d'audit de sécurité automatisé**
   - Pas de `npm audit` ou `pnpm audit`
   - Pas de scan de vulnérabilités
   - **Impact:** Élevé

2. **Pas de scan SAST (Static Analysis)**
   - Pas d'outils comme SonarQube, CodeQL
   - **Impact:** Moyen

3. **Pas de tests de sécurité**
   - Pas de tests de pénétration
   - Pas de tests des endpoints d'auth avec Burp/ZAP
   - **Impact:** Moyen

---

## Base de Données

### 1. Configuration PostgreSQL

#### ✅ Points Forts

**Migrations Gérées**
```typescript
// Source: apps/backend/src/app.module.ts
synchronize: false,     // Pas de sync auto en prod
migrationsRun: true,    // Migrations automatiques
```

**ORM TypeORM**
- Utilisation exclusive de TypeORM pour les requêtes
- Pas de SQL brut détecté dans le code applicatif
- Protection contre les injections SQL

**Index de Performance**
```typescript
// Source: apps/backend/src/database/entities/user.entity.ts
@Index('idx_users_last_seen', ['lastSeenAt'])
```

#### ⚠️ Points à Améliorer

1. **Credentials par défaut**
   ```yaml
   # docker-compose.yml
   POSTGRES_USER: ${DB_USER:-postgres}
   POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
   ```
   - Valeurs par défaut faibles
   - **Impact:** Critique en production

2. **Pas de chiffrement des données sensibles**
   - Mots de passe hashés (✅) mais pas d'autres champs sensibles
   - Emails stockés en clair
   - **Impact:** Moyen

3. **Pas de sauvegarde automatique**
   - Volume Docker `postgres_data` sans stratégie de backup
   - **Impact:** Élevé (perte de données)

4. **Pas d'audit des accès**
   - Pas de logging des requêtes sensibles
   - Pas de traçabilité des modifications
   - **Impact:** Moyen

### 2. Gestion des Secrets

#### ⚠️ Points Critiques

1. **Tokens stockés en clair**
   ```typescript
   verificationToken?: string | null;
   passwordResetToken?: string | null;
   ```
   - Tokens de vérification stockés sans hash
   - Si la DB est compromise, tous les tokens sont exposés
   - **Impact:** Élevé

2. **Pas de chiffrement au repos**
   - Base de données non chiffrée par défaut
   - **Impact:** Élevé en production

---

## Points Forts

### Sécurité Générale

1. ✅ **Architecture sécurisée par défaut**
   - Séparation frontend/backend
   - API RESTful + WebSocket bien structurés

2. ✅ **Authentification robuste**
   - JWT avec bcrypt
   - Rate limiting sur les endpoints sensibles
   - Support des invités sans compromis de sécurité

3. ✅ **Validation des données**
   - ValidationPipe global
   - DTOs strictement typés
   - Whitelist activée

4. ✅ **Headers de sécurité**
   - Helmet configuré
   - CORS restreint

5. ✅ **TypeScript End-to-End**
   - Type safety du frontend au backend
   - Réduction des erreurs

6. ✅ **Dépendances récentes**
   - Node 25, Next.js 15, NestJS 11
   - Packages à jour

---

## Vulnérabilités Identifiées

### 🔴 Critiques (à corriger immédiatement)

1. **Secret JWT par défaut faible**
   - Fichier: `apps/backend/src/auth/auth.module.ts`
   - Risque: Compromission de toutes les sessions
   - Solution: Générer un secret fort unique en production

2. **Credentials DB par défaut**
   - Fichier: `docker-compose.prod.yml`
   - Risque: Accès non autorisé à la base de données
   - Solution: Variables d'environnement requises sans valeurs par défaut

3. **Secrets en variables d'environnement (Docker)**
   - Risque: Exposition via `docker inspect`
   - Solution: Utiliser Docker secrets ou un vault

### 🟠 Élevées (à corriger rapidement)

4. **Pas d'audit automatique des dépendances**
   - Risque: Vulnérabilités non détectées (Log4j, etc.)
   - Solution: Intégrer `pnpm audit` dans CI/CD

5. **Tokens de vérification stockés en clair**
   - Fichier: `apps/backend/src/database/entities/user.entity.ts`
   - Risque: Compromission en cas de fuite DB
   - Solution: Hasher les tokens avant stockage

6. **Pas de sauvegarde DB automatique**
   - Risque: Perte de données en cas de défaillance
   - Solution: Stratégie de backup automatisée

7. **Containers Docker en root**
   - Risque: Élévation de privilèges en cas de compromission
   - Solution: Utilisateurs non-root dans les Dockerfiles

### 🟡 Moyennes (à corriger à moyen terme)

8. **Politique de mots de passe faible**
   - Minimum 6 caractères sans complexité
   - Solution: 8+ caractères + complexité obligatoire

9. **Pas de CSP**
   - Risque: XSS non mitigées
   - Solution: Implémenter Content-Security-Policy

10. **Pas de protection CSRF explicite**
    - SameSite=Lax insuffisant
    - Solution: Tokens CSRF ou SameSite=Strict

11. **Stockage localStorage pour invités**
    - Vulnérable aux XSS
    - Solution: Cookies HTTP-only également pour invités

12. **Pas de rotation des tokens JWT**
    - Tokens valides 7 jours
    - Solution: Refresh tokens + rotation automatique

13. **Pas de limitation des connexions WebSocket**
    - Risque: DoS par utilisateur malveillant
    - Solution: Limite par utilisateur/IP

### 🟢 Faibles (améliorations recommandées)

14. **Pas de monitoring de sécurité**
    - Solution: Logs centralisés + alertes

15. **Pas de tests de sécurité automatisés**
    - Solution: Tests de pénétration dans CI/CD

16. **Pas de détection des mots de passe communs**
    - Solution: Bibliothèque comme `zxcvbn`

17. **Pas de rate limiting distribué**
    - Problème si plusieurs instances backend
    - Solution: Redis pour rate limiting partagé

---

## Score de Sécurité par Catégorie

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| Authentification | 8/10 | Très bon, manque rotation tokens |
| Validation | 7/10 | Bon, contraintes à renforcer |
| Rate Limiting | 8/10 | Bien implémenté |
| Headers Sécurité | 6/10 | Helmet OK, manque CSP |
| Base de Données | 6/10 | ORM sécurisé, manque chiffrement |
| Infrastructure | 5/10 | Plusieurs points critiques |
| Monitoring | 3/10 | Quasi inexistant |
| CI/CD Security | 4/10 | Tests OK, audits manquants |
| **GLOBAL** | **6.5/10** | **Acceptable mais améliorable** |

---

## Conformité aux Standards

### OWASP Top 10 (2021)

| Vulnérabilité | État | Notes |
|---------------|------|-------|
| A01: Broken Access Control | 🟢 Protégé | Guards JWT + rate limiting |
| A02: Cryptographic Failures | 🟡 Partiel | Bcrypt OK, mais tokens en clair |
| A03: Injection | 🟢 Protégé | ORM + validation |
| A04: Insecure Design | 🟢 Bon | Architecture saine |
| A05: Security Misconfiguration | 🟠 Risques | Secrets par défaut, pas de CSP |
| A06: Vulnerable Components | 🟠 Risques | Pas d'audit automatique |
| A07: Authentication Failures | 🟡 Partiel | Auth solide, rate limiting OK |
| A08: Data Integrity Failures | 🟢 Bon | Validation stricte |
| A09: Logging Failures | 🟠 Insuffisant | Logs basiques uniquement |
| A10: SSRF | 🟢 N/A | Pas de requêtes sortantes utilisateur |

### Légende
- 🟢 Protégé / Conforme
- 🟡 Partiellement protégé
- 🟠 Vulnérable / Non conforme
- ⚪ Non applicable

---

## Conclusion

L'application WhoIsIt dispose d'**une base de sécurité solide** pour un projet en développement, avec notamment:
- Une authentification JWT robuste
- Une validation stricte des données
- Des protections contre le brute-force
- Une utilisation sécurisée de l'ORM

Cependant, **plusieurs améliorations critiques sont nécessaires avant un déploiement en production**, notamment:
- Gestion sécurisée des secrets
- Audit automatique des dépendances
- Content Security Policy
- Sauvegarde et chiffrement de la base de données
- Monitoring et alertes de sécurité

**Recommandation:** ⚠️ **Ne pas déployer en production** sans avoir corrigé au minimum les vulnérabilités critiques et élevées.

Consulter le document [Recommandations de Sécurité](./recommendations.md) pour les actions détaillées à entreprendre.
