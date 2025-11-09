# Development Documentation

## Overview

This section contains guides and best practices for developing WhoIsIt, including setup instructions, workflow guidelines, testing strategies, and debugging techniques.

## Contents

### [Getting Started Guide](./getting-started.md)

Complete setup instructions:

- **Prerequisites**: Node.js, PNPM, PostgreSQL
- **Installation steps**: Clone, install, configure
- **Database setup**: Create database and seed data
- **Environment configuration**: Backend and frontend `.env` files
- **Running the apps**: Development servers
- **Common issues**: Troubleshooting guide

### Development Workflow (Coming Soon)

Day-to-day development practices:

- Git workflow and branching strategy
- Code review process
- Commit message conventions
- Pull request guidelines
- Issue tracking

### [Testing Guide](./testing.md)
Testing strategies and examples:
- **Unit testing with Jest**
- **Integration testing patterns**
- **Service and controller testing**
- **DTO validation testing**
- **Mocking strategies**
- **Test coverage goals**
- **Debugging tests**
- **Best practices**

### Debugging Guide (Coming Soon)

Debugging tools and techniques:

- VS Code debugger setup
- Chrome DevTools for frontend
- NestJS debugging
- Database query debugging
- WebSocket debugging

## Quick Reference

### Common Commands

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
pnpm --filter @whois-it/backend test:watch
pnpm --filter @whois-it/backend test:cov

# Linting
pnpm lint               # Lint all workspaces
pnpm --filter @whois-it/frontend lint
pnpm --filter @whois-it/backend lint

# Database
pnpm seed               # Seed database with demo data
pnpm db:reset           # Reset database (WARNING: Deletes all data!)
pnpm migration:generate MigrationName  # Generate migration
pnpm migration:run      # Run pending migrations
pnpm migration:revert   # Revert last migration
```

### Directory Structure

```text
WhoIsIt/
├── .github/            # GitHub workflows and configs
│   └── workflows/      # CI/CD pipelines
├── apps/
│   ├── frontend/       # Next.js application
│   └── backend/        # NestJS application
├── packages/
│   └── contracts/      # Shared TypeScript types
├── docs/               # Documentation
└── [config files]      # Root configuration
```

### Development Ports

- **Frontend**: <http://localhost:3000>
- **Backend**: <http://localhost:4000>
- **PostgreSQL**: localhost:5432

## Development Workflow

### Git Branching Strategy

```text
main            # Production-ready code
├── develop     # Development branch
    ├── feature/add-xxx    # Feature branches
    ├── fix/bug-xxx        # Bug fix branches
    └── chore/update-xxx   # Maintenance branches
```

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

### Commit Message Format

```text
type(scope): subject

body

footer
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Example**:

```text
feat(game): add player ready status

- Add isReady field to GamePlayer entity
- Implement updatePlayerReady endpoint
- Broadcast ready status changes via WebSocket

Closes #123
```

## Code Style Guidelines

### TypeScript

```typescript
// Use explicit types
function getUser(id: string): Promise<User | null> {
  return this.userRepository.findOne(id);
}

// Prefer interfaces for objects
interface UserData {
  email: string;
  username: string;
}

// Use enums for constants
enum GameStatus {
  LOBBY = 'lobby',
  IN_PROGRESS = 'in_progress',
}
```

### React

```typescript
// Functional components with TypeScript
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

export default function UserProfile({ user, onUpdate }: Props) {
  // Component logic
}

// Use descriptive names
const isLoading = true;
const hasError = false;
const userData = null;
```

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes/Components**: `PascalCase`
- **Constants**: `UPPER_CASE`
- **Files**: `kebab-case.ts` or `PascalCase.tsx` for components
- **Private methods**: `_privateMethod()` (convention)

## Testing Guidelines

### Unit Tests

```typescript
describe('GameService', () => {
  let service: GameService;
  let repository: Repository<Game>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    repository = module.get(getRepositoryToken(Game));
  });

  it('should create a game', async () => {
    const dto = { characterSetId: '123' };
    jest.spyOn(repository, 'save').mockResolvedValue(mockGame);
    
    const result = await service.createGame(dto);
    
    expect(result).toBeDefined();
    expect(result.roomCode).toHaveLength(6);
  });
});
```

### Test Coverage Goals

- **Controllers**: 100% (thin layer, easy to test)
- **Services**: 90%+ (business logic)
- **Utilities**: 100%
- **Overall**: 80%+

## Debugging Tips

### Backend Debugging

**VS Code Launch Configuration**:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["--filter", "@whois-it/backend", "start:debug"],
  "console": "integratedTerminal",
  "restart": true,
  "protocol": "inspector"
}
```

**Console Logging**:

```typescript
// Use NestJS Logger
import { Logger } from '@nestjs/common';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  async createGame(dto: CreateGameDto) {
    this.logger.log('Creating game with data:', dto);
    // ...
  }
}
```

### Frontend Debugging

**React DevTools**:

- Install React DevTools extension
- Inspect component props and state
- Track component renders

**Browser DevTools**:

- Network tab for API calls
- Console for logs
- Sources tab for breakpoints

### Database Debugging

**Enable Query Logging**:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  logging: true,  // or ['query', 'error']
})
```

**psql Commands**:

```bash
# Connect to database
psql -U postgres -d whois_it

# List tables
\dt

# Describe table
\d users

# Show running queries
SELECT * FROM pg_stat_activity;
```

## Best Practices

### Code Organization

- Keep files focused and small (<300 lines)
- One component/service per file
- Group related files in directories
- Use index files for clean imports

### Error Handling

**Backend**:

```typescript
try {
  await this.gameService.createGame(dto);
} catch (error) {
  this.logger.error('Failed to create game', error);
  throw new BadRequestException('Could not create game');
}
```

**Frontend**:

```typescript
try {
  await createGame(data);
  toast.success('Game created!');
} catch (error) {
  toast.error('Failed to create game');
  console.error(error);
}
```

### Performance

- Use React.memo for expensive components
- Implement pagination for large lists
- Optimize database queries (indexes, eager loading)
- Use WebSocket for real-time, REST for queries

### Security

- Validate all inputs
- Sanitize user content
- Use parameterized queries
- Store secrets in environment variables
- Never log sensitive data

## Development Environment

### Recommended VS Code Extensions

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Language support
- **Tailwind CSS IntelliSense**: Tailwind autocomplete
- **Git Lens**: Git integration
- **Docker**: Docker support
- **REST Client**: API testing

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Common Development Tasks

### Add New Backend Endpoint

1. Create DTO for validation
2. Add controller method
3. Implement service method
4. Add unit tests
5. Update API documentation

### Add New Frontend Page

1. Create page component in `app/[lang]/`
2. Add Client Component if needed
3. Connect to API
4. Add to navigation
5. Update route in middleware if protected

### Add New Database Entity

1. Create entity file
2. Add to DATABASE_ENTITIES
3. Create migration
4. Run migration locally
5. Update seed if needed

### Update Shared Types

1. Edit `packages/contracts/index.d.ts`
2. Update backend to use new types
3. Update frontend to use new types
4. Restart TypeScript server

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules .next dist
pnpm install
```

### TypeScript errors in VS Code

1. Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Check `tsconfig.json` is correct
3. Ensure types are installed

### Hot reload not working

1. Check file watcher limits (Linux):

   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. Restart development server

### Database connection issues

1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Test connection: `psql -U postgres -d whois_it`
4. Check firewall rules

## Performance Profiling

### Backend

```typescript
// Add timing logs
const start = Date.now();
await someOperation();
this.logger.log(`Operation took ${Date.now() - start}ms`);
```

### Frontend

- Use React DevTools Profiler
- Chrome DevTools Performance tab
- Lighthouse for overall performance

## Documentation

### When to Update Docs

- New features added
- API changes
- Configuration changes
- Breaking changes

### How to Update Docs

1. Edit relevant files in `docs/`
2. Keep examples up-to-date
3. Update main README if needed
4. Include in PR

## Getting Help

1. **Documentation**: Check `/docs` directory
2. **GitHub Issues**: Search existing issues
3. **GitHub Discussions**: Ask questions
4. **Copilot Instructions**: `.github/copilot-instructions.md`

## Learning Resources

### Next.js

- [Official Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### NestJS

- [Official Documentation](https://docs.nestjs.com/)
- [NestJS Courses](https://courses.nestjs.com/)

### TypeScriptt

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### PostgreSQL

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQL Tutorial](https://www.postgresqltutorial.com/)

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Submit pull request

## Next Steps

1. Complete [Getting Started Guide](./getting-started.md)
2. Review [Architecture Documentation](../architecture/overview.md)
3. Check [API Reference](../api/rest-api.md)
4. Explore [Backend Documentation](../backend/README.md)
5. Read [Frontend Documentation](../frontend/README.md)

---

Happy Coding! 🚀
