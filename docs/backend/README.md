# Backend Documentation

## Overview

This section contains comprehensive documentation for the WhoIsIt backend, built with NestJS 11, TypeORM, and PostgreSQL.

## Contents

### [Database Schema](./database.md)

Complete database schema documentation with:

- **15 entities** covering users, games, characters, and gameplay
- Entity relationships and diagrams
- Database enums and types
- Indexes and query optimization
- Migration strategies

### [Authentication](./authentication.md)
JWT-based authentication system with:
- **User registration and login**
- **Email verification workflow**
- **Password reset functionality**
- **Guest session support**
- **WebSocket authentication adapter**
- **Guards and route protection**
- **Passport strategies (JWT, Local)**
- **Security best practices**

### [WebSocket Implementation](./websockets.md)
Real-time communication with Socket.IO:
- **Custom auth adapter with JWT**
- **GameGateway with event handlers**
- **ConnectionManager for tracking**
- **BroadcastService for messaging**
- **Room-based broadcasting patterns**
- **Type-safe Socket.IO setup**
- **Error handling and logging**
- **Testing strategies**

### API Endpoints

See [REST API Reference](../api/rest-api.md) for complete endpoint documentation.

## Quick Links

### Project Structure

```text
apps/backend/
├── src/
│   ├── auth/           # Authentication module
│   ├── game/           # Game logic module
│   ├── database/       # Entities, migrations, seeds
│   ├── email/          # Email service (Nodemailer + MJML)
│   └── main.ts         # Application entry point
└── test/               # E2E tests
```

### Key Technologies

- **NestJS 11**: Progressive Node.js framework
- **TypeORM**: Object-Relational Mapper
- **PostgreSQL**: Primary database
- **Socket.IO**: WebSocket server
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Nodemailer**: Email sending
- **MJML**: Email templates

### Running the Backend

```bash
# Development
pnpm dev:backend

# Build
pnpm --filter @whois-it/backend build

# Test
pnpm --filter @whois-it/backend test

# Lint
pnpm --filter @whois-it/backend lint

# Database
pnpm seed          # Seed database
pnpm db:reset      # Reset database
```

### Environment Variables

Create `apps/backend/.env` from `.env.example`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
DB_SYNC=true

JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000

# Optional email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Architecture Overview

### Module Structure

The backend follows NestJS modular architecture:

```text
AppModule
├── ConfigModule (global)
├── TypeOrmModule (global)
├── DatabaseModule
├── AuthModule
│   ├── AuthController
│   ├── AuthService
│   ├── JwtStrategy
│   └── Guards
├── GameModule
│   ├── GameController
│   ├── GameService
│   ├── GameLobbyService
│   ├── GamePlayService
│   ├── GameGateway
│   └── Services
└── CharacterSetsModule
    ├── CharacterSetsController
    └── CharacterSetsService
```

### Service Layer Pattern

Services are decomposed by responsibility:

- **GameService**: Orchestrator
- **GameLobbyService**: Lobby management
- **GamePlayService**: Gameplay logic
- **GameStatsService**: Statistics tracking
- **BroadcastService**: WebSocket broadcasting
- **LobbyCleanupService**: Scheduled cleanup

### Data Access Pattern

Uses TypeORM repositories:

```typescript
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}
}
```

## Security Features

- **JWT Tokens**: HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Origin whitelisting
- **Input Validation**: class-validator decorators
- **XSS Protection**: React's built-in escaping

## Testing

### Unit Tests

```bash
# Run all tests
pnpm --filter @whois-it/backend test

# Watch mode
pnpm --filter @whois-it/backend test:watch

# Coverage
pnpm --filter @whois-it/backend test:cov
```

### Current Test Status

- **162/162** tests passing
- Controllers, services, and integration tests
- Mock repositories and dependencies

### E2E Tests

```bash
pnpm --filter @whois-it/backend test:e2e
```

## Development Tips

### Hot Reload

The backend watches for file changes and automatically recompiles:

```bash
pnpm dev:backend  # Starts with --watch flag
```

### Debugging

Use VS Code debugger:

1. Set breakpoints in code
2. Run "Debug NestJS" configuration
3. Inspect variables and call stack

### Database Queries

Enable query logging in development:

```typescript
// In app.module.ts
TypeOrmModule.forRoot({
  // ...
  logging: process.env.NODE_ENV === 'development',
})
```

### Adding New Entity

1. Create entity file in `src/database/entities/`
2. Add to `DATABASE_ENTITIES` in `database.module.ts`
3. Generate migration: `pnpm migration:generate AddNewEntity`
4. Review and run migration: `pnpm migration:run`

### Creating New Module

```bash
cd apps/backend
nest generate module feature
nest generate controller feature
nest generate service feature
```

## API Documentation

For complete API endpoint documentation, see:

- [REST API Reference](../api/rest-api.md)
- [Socket.IO Events](../api/socket-events.md) (Coming Soon)

## Common Patterns

### Controller Pattern

```typescript
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async create(@Body() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }
}
```

### Service Pattern

```typescript
@Injectable()
export class GameService {
  async createGame(dto: CreateGameDto): Promise<Game> {
    // Business logic here
  }
}
```

### Gateway Pattern (WebSocket)

```typescript
@WebSocketGateway()
export class GameGateway {
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: any) {
    // Handle WebSocket event
  }
}
```

## Performance Considerations

### Query Optimization

- Use eager loading for relations
- Implement pagination
- Add indexes on frequently queried columns
- Use QueryBuilder for complex queries

### Caching (Future)

- Redis for session storage
- Cache frequently accessed data
- Invalidate on updates

### Horizontal Scaling (Future)

- Redis adapter for Socket.IO
- Load balancer with sticky sessions
- Database connection pooling

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres -d whois_it

# Verify connection string in .env
# Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
```

### TypeORM Sync Issues

```bash
# Reset database (development only!)
pnpm db:reset

# Or generate and run migration
pnpm migration:generate FixSchema
pnpm migration:run
```

### Port Already in Use

```bash
# Find process on port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>
```

## Next Steps

1. Read [Database Schema](./database.md) to understand data model
2. Review [Design Patterns](../architecture/patterns.md)
3. Check [Getting Started](../development/getting-started.md) for setup
4. Explore [REST API Reference](../api/rest-api.md)

---

**Related Documentation**:

- [Architecture Overview](../architecture/overview.md)
- [Technology Stack](../architecture/tech-stack.md)
- [Frontend Documentation](../frontend/README.md)
- [API Documentation](../api/rest-api.md)
