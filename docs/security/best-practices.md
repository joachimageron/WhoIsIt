# Guide des Bonnes Pratiques de Sécurité - WhoIsIt

Ce document présente les bonnes pratiques de sécurité à suivre lors du développement et de la maintenance de l'application WhoIsIt.

## Table des matières

1. [Développement Sécurisé](#développement-sécurisé)
2. [Authentification et Autorisation](#authentification-et-autorisation)
3. [Gestion des Données](#gestion-des-données)
4. [API et Communication](#api-et-communication)
5. [Infrastructure](#infrastructure)
6. [Monitoring et Réponse aux Incidents](#monitoring-et-réponse-aux-incidents)
7. [Checklist du Développeur](#checklist-du-développeur)

---

## Développement Sécurisé

### Principe du Moindre Privilège

**Toujours accorder le minimum de permissions nécessaires:**

```typescript
// ❌ MAUVAIS: Tout le monde peut accéder
@Get('users')
async getAllUsers() {
  return this.userService.findAll();
}

// ✅ BON: Accès restreint aux admins
@UseGuards(JwtAuthGuard, AdminGuard)
@Get('users')
async getAllUsers() {
  return this.userService.findAll();
}
```

### Validation des Entrées

**Toujours valider TOUTES les entrées utilisateur:**

```typescript
// ✅ BON: Validation stricte avec class-validator
export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s-]+$/, {
    message: 'Game name can only contain letters, numbers, spaces and hyphens'
  })
  name!: string;

  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### Gestion des Erreurs Sécurisée

**Ne jamais exposer les détails d'implémentation:**

```typescript
// ❌ MAUVAIS: Expose des détails internes
catch (error) {
  throw new InternalServerErrorException(error.message);
}

// ✅ BON: Messages génériques pour l'utilisateur
catch (error) {
  this.logger.error('Failed to create game', error.stack);
  throw new InternalServerErrorException('Unable to create game');
}
```

### Logging Sécurisé

**Ne jamais logger de données sensibles:**

```typescript
// ❌ MAUVAIS: Log des mots de passe
this.logger.log(`User login attempt: ${email}, ${password}`);

// ✅ BON: Log sans données sensibles
this.logger.log(`Login attempt for user: ${email}`);

// ✅ BON: Redaction des données sensibles
const sanitized = {
  ...user,
  passwordHash: '[REDACTED]',
  verificationToken: '[REDACTED]',
};
this.logger.debug('User data:', sanitized);
```

### Gestion des Secrets

**Jamais de secrets dans le code:**

```typescript
// ❌ MAUVAIS: Secret en dur
const jwtSecret = 'my-super-secret-key';

// ❌ MAUVAIS: Secret dans le code même avec commentaire
// TODO: Move to env
const apiKey = 'sk-abc123...';

// ✅ BON: Secrets depuis l'environnement
const jwtSecret = this.configService.get<string>('JWT_SECRET');
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be configured');
}

// ✅ BON: Validation au démarrage
@Injectable()
export class ConfigValidationService {
  constructor(private configService: ConfigService) {
    this.validateConfig();
  }

  private validateConfig(): void {
    const required = ['JWT_SECRET', 'DB_PASSWORD'];
    const missing = required.filter(key => !this.configService.get(key));
    
    if (missing.length > 0) {
      throw new Error(`Missing required config: ${missing.join(', ')}`);
    }
  }
}
```

---

## Authentification et Autorisation

### Mots de Passe

**Toujours utiliser bcrypt avec un coût approprié:**

```typescript
// ✅ BON: Bcrypt avec coût 10-12
const passwordHash = await bcrypt.hash(password, 10);

// ✅ BON: Vérification sécurisée
const isValid = await bcrypt.compare(password, user.passwordHash);

// ❌ MAUVAIS: Stockage en clair ou MD5
const passwordHash = md5(password); // DANGEREUX
```

**Politique de mot de passe robuste:**

```typescript
// Minimum requirements:
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial
- Vérification avec zxcvbn (score >= 3)
```

### Tokens JWT

**Configuration sécurisée:**

```typescript
// ✅ BON: Configuration robuste
{
  secret: strongRandomSecret,
  signOptions: {
    expiresIn: '15m',        // Access tokens courts
    algorithm: 'HS256',
    issuer: 'whoisit-api',
    audience: 'whoisit-app',
  }
}

// ✅ BON: Refresh tokens séparés
{
  secret: differentStrongSecret,
  signOptions: {
    expiresIn: '7d',
    algorithm: 'HS256',
  }
}
```

**Stockage sécurisé:**

```typescript
// ✅ BON: HTTP-only cookies
res.cookie('access_token', token, {
  httpOnly: true,
  secure: true,           // HTTPS uniquement
  sameSite: 'strict',     // Protection CSRF
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
  domain: process.env.COOKIE_DOMAIN,
});

// ❌ MAUVAIS: Token dans localStorage
localStorage.setItem('token', token); // Vulnérable XSS
```

### Rate Limiting

**Protéger les endpoints sensibles:**

```typescript
// ✅ BON: Rate limiting strict sur auth
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5/minute
@Post('login')
async login() { }

@Throttle({ default: { limit: 3, ttl: 60000 } })  // 3/minute
@Post('register')
async register() { }

@Throttle({ default: { limit: 3, ttl: 300000 } }) // 3/5 minutes
@Post('forgot-password')
async forgotPassword() { }
```

### Guards et Décorateurs

**Utiliser les guards systématiquement:**

```typescript
// ✅ BON: Protection explicite
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  
  @Get()
  async findAll() { }  // Protégé par le guard
  
  @Public()  // Décorateur custom pour endpoints publics
  @Get('public')
  async findPublic() { }
}

// ✅ BON: Guards cumulables
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
async delete(@Param('id') id: string) { }
```

---

## Gestion des Données

### Bases de Données

**Toujours utiliser l'ORM pour les requêtes:**

```typescript
// ✅ BON: TypeORM Query Builder
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email })
  .getMany();

// ✅ BON: Repository methods
const user = await this.userRepository.findOne({
  where: { email }
});

// ❌ MAUVAIS: SQL brut (injection possible)
const users = await this.userRepository.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Sanitization et Échappement:**

```typescript
// ✅ BON: Paramètres bindés
const users = await this.userRepository.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ BON: Utiliser des DTOs pour filtrer les données
class UserResponseDto {
  @Expose()
  id!: string;
  
  @Expose()
  username!: string;
  
  // passwordHash n'est PAS exposé
}
```

### Données Sensibles

**Chiffrement et hashing appropriés:**

```typescript
// ✅ BON: Hashing pour mots de passe
passwordHash = await bcrypt.hash(password, 10);

// ✅ BON: Hashing pour tokens de vérification
tokenHash = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

// ✅ BON: Chiffrement AES pour données sensibles
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function encrypt(text: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

**Masquage dans les logs:**

```typescript
// ✅ BON: Service de masquage
@Injectable()
export class LogSanitizer {
  private readonly sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'creditCard',
  ];

  sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    for (const key of Object.keys(sanitized)) {
      if (this.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }
    
    return sanitized;
  }
}
```

---

## API et Communication

### CORS

**Configuration stricte:**

```typescript
// ✅ BON: CORS restreint
app.enableCors({
  origin: [
    process.env.FRONTEND_URL,
    'https://app.whoisit.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
});

// ❌ MAUVAIS: CORS ouvert
app.enableCors({ origin: '*' }); // DANGEREUX
```

### Headers de Sécurité

**Helmet avec configuration stricte:**

```typescript
// ✅ BON: Configuration Helmet complète
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
```

### WebSocket Security

**Authentification obligatoire:**

```typescript
// ✅ BON: Vérification JWT sur connexion WebSocket
server.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = extractToken(socket);
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const payload = this.jwtService.verify(token);
    const user = await this.authService.findById(payload.sub);
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

**Validation des événements:**

```typescript
// ✅ BON: Validation stricte des événements
@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @ConnectedSocket() client: TypedSocket,
  @MessageBody(new ValidationPipe()) data: JoinRoomDto,
) {
  // data est validé par ValidationPipe
  // DTOs avec class-validator
}
```

---

## Infrastructure

### Docker

**Images sécurisées:**

```dockerfile
# ✅ BON: Image alpine, utilisateur non-root
FROM node:25-alpine AS production

# Install dependencies
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy files with correct ownership
COPY --chown=nestjs:nodejs . .

# Switch to non-root user
USER nestjs

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
```

**Scan de vulnérabilités:**

```bash
# Intégrer Trivy dans CI/CD
trivy image --severity HIGH,CRITICAL whoisit-backend:latest
```

### Variables d'Environnement

**Validation stricte:**

```typescript
// ✅ BON: Schéma de validation avec class-validator
import { IsString, IsNumber, IsUrl, MinLength, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(16)
  DB_PASSWORD!: string;

  @IsUrl({ require_tld: false })
  FRONTEND_URL!: string;

  @IsNumber()
  @Min(1024)
  @Max(65535)
  PORT!: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config);
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => 
        Object.values(e.constraints || {}).join(', ')
      ).join('\n')}`
    );
  }

  return validatedConfig;
}
```

### Sauvegarde et Récupération

**Stratégie 3-2-1:**

- **3** copies des données
- **2** types de médias différents
- **1** copie hors site

```bash
# ✅ BON: Backup automatique avec chiffrement
#!/bin/bash

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql.gz"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Backup + compression + chiffrement
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | \
  gzip | \
  openssl enc -aes-256-cbc -salt -k "$ENCRYPTION_KEY" \
  > "$BACKUP_FILE.enc"

# Upload vers S3 avec versioning
aws s3 cp "$BACKUP_FILE.enc" "s3://$BACKUP_BUCKET/backups/"

# Vérification de l'intégrité
aws s3api head-object \
  --bucket "$BACKUP_BUCKET" \
  --key "backups/$BACKUP_FILE.enc"
```

---

## Monitoring et Réponse aux Incidents

### Logging

**Niveaux appropriés:**

```typescript
// ✅ BON: Logging structuré
this.logger.error('Authentication failed', {
  event: 'auth_failed',
  userId: userId,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  timestamp: new Date().toISOString(),
});

this.logger.warn('Suspicious activity detected', {
  event: 'rate_limit_exceeded',
  userId: userId,
  ip: request.ip,
  endpoint: request.url,
});

this.logger.log('User logged in', {
  event: 'user_login',
  userId: userId,
  method: 'jwt',
});
```

### Alertes

**Configuration d'alertes critiques:**

```typescript
// ✅ BON: Alertes sur événements de sécurité
@Injectable()
export class SecurityAlertService {
  private readonly criticalEvents = [
    'multiple_failed_logins',
    'suspicious_activity',
    'unauthorized_access_attempt',
    'data_breach_detected',
  ];

  async alert(event: string, details: any): Promise<void> {
    if (this.criticalEvents.includes(event)) {
      // Envoyer aux canaux de notification
      await this.sendToSlack(event, details);
      await this.sendToEmail(event, details);
      await this.sendToSentry(event, details);
      
      // Log pour analyse
      this.logger.error(`SECURITY ALERT: ${event}`, details);
    }
  }
}
```

### Plan de Réponse aux Incidents

**Procédure en cas d'incident:**

1. **Détection**
   - Surveiller les logs et alertes
   - Vérifier les métriques anormales

2. **Containment**
   ```bash
   # Isoler le système compromis
   docker stop whoisit-backend
   
   # Bloquer l'accès réseau si nécessaire
   iptables -A INPUT -s <suspicious-ip> -j DROP
   ```

3. **Investigation**
   ```bash
   # Examiner les logs
   docker logs whoisit-backend --since 1h > incident-logs.txt
   
   # Vérifier les connexions actives
   psql -c "SELECT * FROM pg_stat_activity;"
   ```

4. **Éradication**
   - Corriger la vulnérabilité
   - Révoquer les tokens compromis
   - Changer les secrets

5. **Récupération**
   - Restaurer depuis backup sain
   - Redéployer avec correctif
   - Surveiller étroitement

6. **Post-Incident**
   - Documenter l'incident
   - Mettre à jour les procédures
   - Former l'équipe

---

## Checklist du Développeur

### Avant Chaque Commit

- [ ] Aucun secret dans le code
- [ ] Pas de `console.log` avec données sensibles
- [ ] Validation des entrées implémentée
- [ ] Gestion des erreurs sécurisée
- [ ] Guards appropriés sur nouveaux endpoints
- [ ] Tests de sécurité passés

### Avant Chaque Pull Request

- [ ] `pnpm audit` exécuté (pas de vulnérabilités critiques/élevées)
- [ ] Tests unitaires et e2e passés
- [ ] Code review de sécurité demandé
- [ ] Documentation mise à jour
- [ ] Changelog mis à jour

### Avant Chaque Release

- [ ] Audit de sécurité complet
- [ ] Tests de pénétration effectués
- [ ] Backup testé et validé
- [ ] Plan de rollback préparé
- [ ] Monitoring et alertes vérifiés
- [ ] Documentation de sécurité à jour

### Revue de Code - Points de Sécurité

**À vérifier systématiquement:**

```typescript
// ✅ Checklist Revue de Code
1. [ ] Validation des entrées (DTOs, ValidationPipe)
2. [ ] Authentification (Guards JWT)
3. [ ] Autorisation (Rôles, Permissions)
4. [ ] Rate limiting (endpoints sensibles)
5. [ ] Gestion des erreurs (pas de fuite d'info)
6. [ ] Logging (pas de données sensibles)
7. [ ] Sanitization (SQL, XSS)
8. [ ] CORS (origin restreinte)
9. [ ] Secrets (environnement uniquement)
10. [ ] Tests (coverage + sécurité)
```

---

## Exemples de Code Sécurisé

### Endpoint Complet Sécurisé

```typescript
@Controller('api/games')
@UseGuards(JwtAuthGuard)  // Auth obligatoire
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })  // Rate limiting
  async create(
    @Request() req: RequestWithUser,
    @Body(new ValidationPipe()) createGameDto: CreateGameDto,  // Validation
  ): Promise<GameResponseDto> {
    try {
      // Log sans données sensibles
      this.logger.log(`User ${req.user.id} creating game`);
      
      // Business logic
      const game = await this.gamesService.create(
        req.user.id,
        createGameDto,
      );
      
      // DTO pour réponse (filtre les données)
      return plainToClass(GameResponseDto, game, {
        excludeExtraneousValues: true,
      });
      
    } catch (error) {
      // Log détaillé serveur
      this.logger.error('Failed to create game', error.stack);
      
      // Message générique client
      throw new InternalServerErrorException('Unable to create game');
    }
  }
}
```

### Service avec Sécurité

```typescript
@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    private readonly logger: LoggerService,
  ) {}

  async create(userId: string, dto: CreateGameDto): Promise<Game> {
    // Vérification des permissions
    const user = await this.validateUser(userId);
    
    // Validation métier
    await this.validateGameCreation(user, dto);
    
    // Transaction pour atomicité
    return this.gamesRepository.manager.transaction(async manager => {
      const game = manager.create(Game, {
        ...dto,
        hostId: userId,
        createdAt: new Date(),
      });
      
      return manager.save(game);
    });
  }

  private async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    if (!user.emailVerified) {
      throw new ForbiddenException('Email must be verified');
    }
    
    return user;
  }

  private async validateGameCreation(
    user: User,
    dto: CreateGameDto,
  ): Promise<void> {
    // Vérifier les limites (anti-spam)
    const recentGames = await this.gamesRepository.count({
      where: {
        hostId: user.id,
        createdAt: MoreThan(new Date(Date.now() - 60000)), // Dernière minute
      },
    });
    
    if (recentGames >= 5) {
      throw new TooManyRequestsException(
        'Too many games created recently'
      );
    }
  }
}
```

---

## Formation Continue

### Ressources Recommandées

**Documentation:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

**Outils de Test:**
- Burp Suite / ZAP pour tests de pénétration
- Postman pour tests API
- npm audit / Snyk pour vulnérabilités

**Veille Sécurité:**
- [CVE Database](https://cve.mitre.org/)
- [Node Security](https://github.com/nodejs/security-wg)
- [NestJS Security Advisories](https://github.com/nestjs/nest/security)

### Entraînement

**Exercices pratiques:**
- [HackTheBox](https://www.hackthebox.com/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)

---

## Conclusion

La sécurité est un processus continu, pas un état final. Ces bonnes pratiques doivent être:

- ✅ Appliquées systématiquement
- ✅ Revues régulièrement
- ✅ Mises à jour avec les nouvelles menaces
- ✅ Partagées avec toute l'équipe
- ✅ Intégrées dans la culture de développement

**Rappel:** En cas de doute sur la sécurité d'une implémentation, toujours demander une revue de code ou consulter les experts en sécurité.

---

**Dernière mise à jour:** Novembre 2024  
**Prochaine revue:** Février 2025
