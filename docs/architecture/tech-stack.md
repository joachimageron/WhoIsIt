# Technology Stack

## Overview

WhoIsIt is built on modern, production-ready technologies chosen for type safety, developer experience, and scalability. This document details each technology, its role, configuration, and rationale.

## Frontend Stack

### Core Framework

#### Next.js 15.3.1
**Role**: React meta-framework with SSR, routing, and optimization

**Key Features Used**:
- **App Router**: File-based routing with layouts
- **Server Components**: Default server rendering
- **Turbopack**: Fast development bundler
- **Image Optimization**: Automatic image optimization
- **Font Optimization**: Google Fonts optimization
- **Internationalization**: Built-in i18n routing

**Configuration** (`next.config.js`):
```javascript
const nextConfig = {};
module.exports = nextConfig;
```

**Why Next.js?**
- Server-side rendering for SEO and performance
- Built-in optimization (images, fonts, code splitting)
- App Router for modern React patterns
- TypeScript first-class support
- Large ecosystem and community

#### React 18.3.1
**Role**: UI library for building component-based interfaces

**Features Used**:
- Hooks for state and effects
- Server Components (via Next.js)
- Suspense for loading states
- Concurrent features

**Why React?**
- Industry standard
- Large ecosystem
- Server Components support
- Excellent TypeScript integration

### UI and Styling

#### HeroUI 2.x
**Role**: React component library built on Tailwind CSS

**Components Used**:
- Button, Card, Input, Modal
- Navbar, Dropdown, Avatar
- Table, Tabs, Toast
- Progress, Spinner, Skeleton
- And many more...

**Installation**:
```bash
pnpm add @heroui/react @heroui/theme
# Plus individual component packages
```

**Theme Configuration** (`tailwind.config.js`):
```javascript
const { heroui } = require("@heroui/theme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};
```

**Why HeroUI?**
- Beautiful, modern design
- Built on Tailwind CSS (familiar patterns)
- Full TypeScript support
- Accessible components (ARIA compliant)
- Regular updates and active maintenance

#### Tailwind CSS 4.1.11
**Role**: Utility-first CSS framework

**Configuration**:
- Custom color palette
- Responsive breakpoints
- Dark mode support
- HeroUI integration

**Why Tailwind CSS?**
- Rapid development with utility classes
- Consistent spacing and sizing
- Purges unused CSS automatically
- Easy to customize and extend
- Excellent VS Code extension

### State Management

#### Zustand 5.0.8
**Role**: Lightweight state management

**Stores**:
1. **Auth Store** (`store/auth-store.ts`):
   - User authentication state
   - Guest session management
   - Login/logout actions

2. **Game Store** (`store/game-store.ts`):
   - Lobby state
   - Connection status
   - Player list
   - Room information

**Example Store**:
```typescript
import { create } from 'zustand';

interface GameStore {
  roomCode: string | null;
  isConnected: boolean;
  setRoomCode: (code: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomCode: null,
  isConnected: false,
  setRoomCode: (code) => set({ roomCode: code }),
}));
```

**Why Zustand?**
- Minimal boilerplate
- No providers needed
- TypeScript-first
- DevTools support
- Small bundle size (~1KB)

### Real-time Communication

#### Socket.IO Client 4.8.1
**Role**: WebSocket client for real-time updates

**Configuration** (`lib/socket.ts`):
```typescript
import { io, Socket } from 'socket.io-client';

export function getSocket(): Socket {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
  });
}
```

**Why Socket.IO?**
- Automatic reconnection
- Room support built-in
- Acknowledgement callbacks
- Fallback to polling if needed
- Works with NestJS out of the box

### Internationalization

#### Intl-MessageFormat 10.7.16
**Role**: Message formatting for i18n

**Supported Locales**:
- English (en) - Default
- French (fr)

**Dictionary Structure** (`dictionaries/`):
```typescript
// dictionaries/en.json
{
  "home": {
    "title": "Welcome to WhoIsIt",
    "subtitle": "Guess the character!"
  }
}
```

**Why IntlMessageFormat?**
- Standards-based (Intl API)
- Pluralization support
- Date/time formatting
- Number formatting

### Icons

#### Iconify React 6.0.2
**Role**: Unified icon framework

**Usage**:
```typescript
import { Icon } from '@iconify/react';

<Icon icon="mdi:account" />
```

**Why Iconify?**
- Access to 150,000+ icons
- Multiple icon sets in one library
- Tree-shakeable
- TypeScript support

## Backend Stack

### Core Framework

#### NestJS 11.0.1
**Role**: Progressive Node.js framework

**Architecture**:
- **Modules**: Feature organization
- **Controllers**: HTTP request handling
- **Services**: Business logic
- **Guards**: Authentication/authorization
- **Pipes**: Validation and transformation
- **Interceptors**: Request/response transformation
- **Gateways**: WebSocket handling

**Key Modules**:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({ ... }),
    AuthModule,
    GameModule,
    CharacterSetsModule,
  ],
})
export class AppModule {}
```

**Why NestJS?**
- TypeScript-first framework
- Modular architecture
- Dependency injection
- Decorator-based
- Excellent testing support
- WebSocket integration
- Production-ready

#### Node.js
**Role**: JavaScript runtime

**Version**: LTS (via package.json engines)

**Why Node.js?**
- JavaScript across stack
- Large ecosystem (npm)
- Non-blocking I/O
- WebSocket support
- Great for real-time apps

### Database and ORM

#### PostgreSQL
**Role**: Primary database

**Version**: 12+ recommended

**Features Used**:
- ACID transactions
- JSON/JSONB columns
- Foreign key constraints
- Indexes for performance
- Connection pooling

**Why PostgreSQL?**
- Reliable and battle-tested
- ACID compliance for game state
- JSON support for flexible metadata
- Excellent performance
- Free and open-source

#### TypeORM 11.0.0
**Role**: Object-Relational Mapper

**Configuration** (`app.module.ts`):
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'whois_it',
  entities: DATABASE_ENTITIES,
  synchronize: process.env.DB_SYNC === 'true',
  migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
})
```

**Entity Example**:
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Game, game => game.host)
  hostedGames: Game[];
}
```

**Why TypeORM?**
- TypeScript decorators
- Active Record pattern
- Migration generation
- Repository pattern support
- NestJS integration

### Authentication

#### Passport JWT 4.0.1
**Role**: JWT authentication strategy

**Strategy Configuration**:
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.access_token,
      ]),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }
}
```

**Why Passport JWT?**
- Industry standard
- Flexible extractors
- Easy to test
- NestJS integration

#### bcrypt 6.0.0
**Role**: Password hashing

**Usage**:
```typescript
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

**Why bcrypt?**
- Cryptographically secure
- Adaptive (configurable rounds)
- Resistant to rainbow tables
- Industry standard

### Real-time Communication

#### Socket.IO 4.x
**Role**: WebSocket server

**Gateway** (`game/gateway/game.gateway.ts`):
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  },
})
export class GameGateway {
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: SocketJoinRoomRequest,
    @ConnectedSocket() client: Socket,
  ) {
    // Handle join room logic
  }
}
```

**Custom Auth Adapter** (`auth/ws-auth.adapter.ts`):
- Extracts JWT from cookies
- Attaches user to socket
- Allows unauthenticated connections

**Why Socket.IO?**
- Automatic reconnection
- Room/namespace support
- Acknowledgements
- NestJS decorator support
- Proven at scale

### Validation

#### class-validator 0.14.2
**Role**: Validation decorators

**DTO Example**:
```typescript
export class CreateGameDto {
  @IsUUID()
  characterSetId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  hostUsername?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers?: number;
}
```

**Why class-validator?**
- Decorator-based
- TypeScript integration
- NestJS integration
- Comprehensive validators

#### class-transformer 0.5.1
**Role**: Object transformation

**Usage**:
- Plain to class conversion
- Exclude properties
- Transform values
- Nested object handling

**Why class-transformer?**
- Works with class-validator
- Type-safe transformations
- Decorator-based

### Email

#### Nodemailer 7.0.9
**Role**: Email sending

**Service** (`email/email.service.ts`):
```typescript
@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      auth: { ... },
    });
  }
}
```

**Why Nodemailer?**
- Popular and mature
- Multiple transport options
- HTML email support
- Template integration

#### MJML 4.16.1
**Role**: Responsive email markup

**Template Structure** (`email/templates/`):
```xml
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Welcome to WhoIsIt!</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

**Why MJML?**
- Responsive by default
- Cross-client compatibility
- Component-based
- Easy to maintain

## Shared Technologies

### TypeScript 5.6.3
**Role**: Type-safe JavaScript

**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Why TypeScript?**
- Type safety
- Better IDE support
- Refactoring safety
- Self-documenting code
- Catches errors at compile time

### PNPM 10.20.0
**Role**: Package manager

**Features**:
- Content-addressable storage
- Hard links for efficiency
- Strict dependency resolution
- Workspace support

**Why PNPM?**
- Faster than npm/yarn
- Disk space efficient
- Prevents phantom dependencies
- Great monorepo support

## Development Tools

### Linting and Formatting

#### ESLint 9.25.1
**Role**: Code linting

**Configuration**: Workspace-level ESLint configs

**Rules**:
- TypeScript recommended rules
- React recommended rules
- Next.js rules
- Prettier integration

#### Prettier 3.5.3
**Role**: Code formatting

**Configuration** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Testing

#### Jest
**Role**: Testing framework

**Backend Tests**:
- Unit tests for services
- Integration tests for controllers
- E2E tests for workflows

**Current Coverage**: 162/162 tests passing

**Why Jest?**
- Fast and parallel execution
- Snapshot testing
- Mocking utilities
- TypeScript support
- NestJS integration

### Version Control

#### Git
**Role**: Source control

**Branching Strategy**:
- `main` - Production
- `develop` - Development
- Feature branches

#### GitHub Actions
**Role**: CI/CD

**Workflows**:
- Lint on push/PR
- Test on push/PR
- Build verification

## Production Dependencies Summary

### Frontend Core
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.3.1 | React framework |
| react | 18.3.1 | UI library |
| react-dom | 18.3.1 | React DOM renderer |

### Frontend UI
| Package | Version | Purpose |
|---------|---------|---------|
| @heroui/* | 2.x | Component library |
| tailwindcss | 4.1.11 | CSS framework |
| framer-motion | 11.18.2 | Animation library |

### Frontend State & Data
| Package | Version | Purpose |
|---------|---------|---------|
| zustand | 5.0.8 | State management |
| socket.io-client | 4.8.1 | WebSocket client |
| intl-messageformat | 10.7.16 | i18n formatting |

### Backend Core
| Package | Version | Purpose |
|---------|---------|---------|
| @nestjs/core | 11.0.1 | Framework core |
| @nestjs/platform-express | 11.0.1 | HTTP server |
| @nestjs/websockets | 11.1.6 | WebSocket support |

### Backend Data
| Package | Version | Purpose |
|---------|---------|---------|
| @nestjs/typeorm | 11.0.0 | ORM integration |
| typeorm | 0.3.20 | ORM |
| pg | 8.16.3 | PostgreSQL driver |

### Backend Auth
| Package | Version | Purpose |
|---------|---------|---------|
| @nestjs/jwt | 11.0.0 | JWT tokens |
| @nestjs/passport | 11.0.5 | Auth strategies |
| bcrypt | 6.0.0 | Password hashing |

### Backend Real-time
| Package | Version | Purpose |
|---------|---------|---------|
| socket.io | 4.x | WebSocket server |
| @nestjs/platform-socket.io | 11.1.6 | Socket.IO adapter |

## Technology Decision Criteria

When choosing technologies for WhoIsIt, we prioritized:

1. **Type Safety**: TypeScript throughout
2. **Developer Experience**: Modern tooling and hot reload
3. **Performance**: SSR, optimizations, efficient bundling
4. **Scalability**: Proven technologies that scale
5. **Community**: Active maintenance and large ecosystems
6. **Documentation**: Good docs and examples
7. **Testing**: Easy to test and mock
8. **Real-time**: Native WebSocket support

## Future Considerations

### Potential Additions

**Frontend**:
- React Query for server state caching
- Framer Motion for advanced animations
- Storybook for component documentation

**Backend**:
- Redis for caching and session storage
- Bull for job queues
- Swagger for API documentation
- Winston for advanced logging

**Infrastructure**:
- Docker for containerization
- Kubernetes for orchestration
- Prometheus for metrics
- Grafana for dashboards

**Testing**:
- Playwright for E2E tests
- Testing Library for React components
- Cypress as alternative to Playwright

## Deprecations and Migrations

### Completed Migrations
- ✅ Next.js Pages → App Router
- ✅ Webpack → Turbopack
- ✅ Tailwind CSS 3 → 4

### Planned Migrations
None currently planned

## Version Compatibility Matrix

| Frontend | Backend | Node.js | PostgreSQL |
|----------|---------|---------|------------|
| 0.1.0 | 0.1.0 | 18+ | 12+ |

**Browser Support**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile: Modern browsers

## Conclusion

The WhoIsIt technology stack is carefully selected for type safety, developer experience, and production readiness. Every technology serves a specific purpose and integrates well with the others, creating a cohesive development experience.

The focus on TypeScript throughout ensures consistency and reduces runtime errors, while modern frameworks like Next.js and NestJS provide the structure and tooling needed for professional development.

---

**Related Documentation**:
- [System Architecture Overview](./overview.md)
- [Monorepo Structure](./monorepo.md)
- [Design Patterns](./patterns.md)
