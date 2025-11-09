# System Architecture Overview

## Introduction

WhoIsIt is a real-time multiplayer guessing game built on a modern full-stack architecture. The system follows a **monorepo** pattern with clear separation between frontend, backend, and shared contracts, enabling type-safe communication and efficient development workflows.

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Next.js 15 Frontend (Port 3000)                       │     │
│  │  - App Router with i18n ([lang] routes)                │     │
│  │  - HeroUI Components + Tailwind CSS 4                  │     │
│  │  - Zustand State Management                            │     │
│  │  - Socket.IO Client (WebSocket transport)              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ▲ ▼
                    HTTP/REST + WebSocket
                              ▲ ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Server Layer                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  NestJS 11 Backend (Port 4000)                         │     │
│  │  - REST API Controllers                                │     │
│  │  - WebSocket Gateway (Socket.IO)                       │     │
│  │  - JWT Authentication + Guest Sessions                 │     │
│  │  - Business Logic Services                             │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ▲ ▼
                         TypeORM ORM
                              ▲ ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  PostgreSQL Database                                   │     │
│  │  - User accounts and authentication                    │     │
│  │  - Game state and history                              │     │
│  │  - Character sets and characters                       │     │
│  │  - Questions, answers, and guesses                     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Next.js 15)

The frontend is a server-rendered React application with real-time capabilities:

- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Library**: HeroUI (React components built on Tailwind CSS)
- **State Management**: Zustand for client-side state
- **Styling**: Tailwind CSS 4 with custom theme configuration
- **Real-time**: Socket.IO client with WebSocket transport
- **Internationalization**: Built-in i18n with English and French locales
- **Routing**: File-based routing with `[lang]` dynamic segments

**Key Features**:

- Server-side rendering (SSR) for SEO and performance
- Mobile-first responsive design
- Real-time game updates without polling
- Protected routes with middleware
- Guest session support alongside authenticated users

### 2. Backend (NestJS 11)

The backend provides both REST API and WebSocket endpoints:

- **Framework**: NestJS 11 with TypeScript
- **Database ORM**: TypeORM with PostgreSQL driver
- **Authentication**: JWT tokens with HTTP-only cookies
- **Real-time**: Socket.IO gateway with custom auth adapter
- **Validation**: class-validator and class-transformer
- **Email**: Nodemailer with MJML templates

**Architecture Pattern**: Modular architecture with:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Gateways**: Handle WebSocket connections and events
- **Entities**: TypeORM database models
- **DTOs**: Data Transfer Objects for validation
- **Guards**: Authentication and authorization

### 3. Shared Contracts (TypeScript Package)

Type-safe contracts shared between frontend and backend:

- **Location**: `packages/contracts`
- **Purpose**: Single source of truth for API types
- **Contents**:
  - REST API request/response types
  - Socket.IO event types
  - Shared enums and constants
  - Game state types

**Benefits**:

- Compile-time type checking
- Consistent API contracts
- Refactoring safety
- Auto-completion in IDEs

## Communication Patterns

### REST API (Synchronous)

Used for:

- User authentication (login, register, password reset)
- Creating and joining games
- Fetching game state and lobby information
- Character set management
- Starting games

**Pattern**: Standard HTTP request/response

- Client sends HTTP request with JSON body
- Server validates, processes, and returns JSON response
- JWT token in HTTP-only cookie for auth

### WebSocket (Real-time)

Used for:

- Real-time lobby updates
- Player join/leave notifications
- Game start events
- Question/answer broadcasting
- Guess results
- Game over notifications

**Pattern**: Socket.IO with acknowledgement callbacks

- Client emits event with payload and callback
- Server processes and returns success/error via callback
- Server broadcasts events to all connected clients in room
- Automatic reconnection handling

## Authentication Flow

### Authenticated Users

1. User registers or logs in via REST API
2. Server generates JWT token
3. Token stored in HTTP-only cookie
4. Cookie automatically sent with all requests
5. Backend validates token on each request
6. WebSocket adapter extracts token from cookie

### Guest Sessions

1. Frontend generates guest session ID
2. Stored in localStorage and cookie
3. Middleware allows access to game routes
4. WebSocket allows unauthenticated connections
5. Server tracks guest users by session ID

## Data Flow Example: Game Lobby

### 1. Initial Load (REST)

```text
Frontend                  Backend                 Database
   |                         |                        |
   |--GET /games/:code------>|                        |
   |                         |--Query game & players->|
   |                         |<-Game data-------------|
   |<-Game lobby data--------|                        |
   |                         |                        |
```

### 2. Join Room (WebSocket)

```text
Frontend                  Backend                 Database
   |                         |                        |
   |--emit joinRoom--------->|                        |
   |                         |--Validate & join room->|
   |                         |<-Success---------------|
   |<-callback: success------|                        |
   |                         |                        |
   |                         |--broadcast playerJoined--->
   |<-on playerJoined--------|                    (to all in room)
   |                         |                        |
```

### 3. Update Ready State (WebSocket)

```text
Frontend                  Backend                 Database
   |                         |                        |
   |--emit updateReady------>|                        |
   |                         |--Update player state-->|
   |                         |<-Updated game----------|
   |<-callback: lobby--------|                        |
   |                         |                        |
   |                         |--broadcast lobbyUpdate---->
   |<-on lobbyUpdate---------|                    (to all in room)
   |                         |                        |
```

## Scalability Considerations

### Current Architecture

- **Single Server**: Both REST and WebSocket on same process
- **In-Memory Rooms**: Socket.IO rooms stored in memory
- **Database Connection Pool**: TypeORM connection pooling
- **Stateful WebSocket**: Connections tied to single server

### Future Scaling Options

**Horizontal Scaling**:

1. **Redis Adapter**: Use Redis for Socket.IO room state
2. **Session Store**: Move to Redis for distributed sessions
3. **Load Balancer**: Sticky sessions for WebSocket connections
4. **Microservices**: Separate game engine from auth service

**Vertical Scaling**:

1. **Database**: PostgreSQL read replicas
2. **Caching**: Redis for frequently accessed data
3. **CDN**: Static assets served from CDN

## Security Architecture

### Authentication

- JWT tokens with secure signing
- HTTP-only cookies prevent XSS attacks
- Short expiration times (configurable)
- Refresh token pattern (future enhancement)

### Authorization

- Route-level protection via middleware
- Method-level guards in backend
- WebSocket auth adapter validates connections
- Role-based access control (host vs player)

### Data Protection

- Password hashing with bcrypt
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CORS configuration for origin whitelisting
- Input validation on all endpoints

## Error Handling

### Frontend

- Try-catch blocks for async operations
- Toast notifications for user errors
- Error boundaries for React component errors
- Connection state monitoring for Socket.IO

### Backend

- Global exception filters
- Custom exception classes
- Validation pipes for input validation
- Detailed error logging
- User-friendly error messages

## Monitoring and Observability

### Logging

- **Frontend**: Browser console (development)
- **Backend**: Console logging with configurable levels
- **Database**: TypeORM query logging (development)

### Health Checks

- Backend health endpoint
- Database connection monitoring
- Socket.IO connection state

### Future Enhancements

- Application Performance Monitoring (APM)
- Centralized logging (e.g., ELK stack)
- Metrics collection (e.g., Prometheus)
- Distributed tracing

## Development Architecture

### Monorepo Structure

```text
WhoIsIt/
├── apps/
│   ├── frontend/         # Next.js application
│   └── backend/          # NestJS application
├── packages/
│   └── contracts/        # Shared TypeScript types
├── docs/                 # Documentation (this file!)
└── [config files]        # Root workspace configuration
```

### Build System

- **Package Manager**: PNPM with workspaces
- **Build Tool**:
  - Frontend: Turbopack (Next.js 15)
  - Backend: TypeScript compiler + Nest CLI
- **Linting**: ESLint with workspace-level config
- **Testing**: Jest for backend unit tests
- **CI/CD**: GitHub Actions

### Development Workflow

1. Install dependencies: `pnpm install`
2. Start both apps: `pnpm dev`
3. Frontend: <http://localhost:3000>
4. Backend: <http://localhost:4000>

## Technology Choices

### Why NestJS?

- **TypeScript-first**: Type safety throughout
- **Modular**: Clear separation of concerns
- **Scalable**: Enterprise-ready architecture
- **WebSocket**: Built-in Socket.IO integration
- **ORM Integration**: TypeORM support out of the box
- **Testing**: Jest integration for unit/e2e tests

### Why Next.js?

- **SSR/SSG**: SEO-friendly and fast initial loads
- **App Router**: Modern routing with layouts
- **TypeScript**: Full type support
- **API Routes**: Optional backend endpoints
- **Optimizations**: Image optimization, code splitting
- **Developer Experience**: Hot reload, error overlay

### Why Socket.IO?

- **Reliability**: Automatic reconnection
- **Fallbacks**: WebSocket with polling fallback
- **Room Support**: Built-in room management
- **Acknowledgements**: Request-response pattern over WebSocket
- **Namespace**: Logical connection grouping
- **Adapters**: Redis adapter for scaling

### Why PostgreSQL?

- **ACID Compliance**: Data integrity for game state
- **JSON Support**: Flexible metadata storage
- **Performance**: Excellent query performance
- **Ecosystem**: Rich tooling and extensions
- **TypeORM Support**: First-class ORM integration

### Why PNPM?

- **Disk Space**: Efficient storage with hard links
- **Speed**: Faster than npm/yarn
- **Strict**: Better dependency resolution
- **Workspaces**: Native monorepo support

## Architectural Decisions

### Monorepo vs Multi-repo

**Decision**: Monorepo with PNPM workspaces

**Rationale**:

- Shared types between frontend/backend
- Atomic commits across multiple packages
- Simplified dependency management
- Single CI/CD pipeline
- Easier refactoring

### REST + WebSocket vs GraphQL + Subscriptions

**Decision**: REST for queries, WebSocket for real-time

**Rationale**:

- REST simpler for CRUD operations
- WebSocket natural fit for game events
- No GraphQL learning curve
- Better TypeScript integration
- Socket.IO maturity and reliability

### TypeORM vs Prisma

**Decision**: TypeORM with Active Record pattern

**Rationale**:

- NestJS first-class support
- Decorator-based entities
- Active Record pattern simplicity
- Migration generation
- Extensive PostgreSQL feature support

### Zustand vs Redux vs Context

**Decision**: Zustand for state management

**Rationale**:

- Minimal boilerplate
- TypeScript-friendly
- No provider wrapping
- DevTools support
- Small bundle size

## Performance Considerations

### Frontend Optimizations

- Server-side rendering for initial load
- Code splitting by route
- Image optimization via Next.js
- Font optimization
- Lazy loading for modals and drawers

### Backend Optimizations

- Connection pooling for database
- Query optimization with indexes
- Eager vs lazy loading strategy
- Pagination for list endpoints
- Caching for character sets

### Real-time Optimizations

- WebSocket over polling
- Room-based broadcasting
- Minimal payload sizes
- Connection state management
- Automatic reconnection

## Conclusion

The WhoIsIt architecture balances simplicity and scalability, using proven technologies and patterns. The monorepo structure enables efficient development, while the separation of concerns ensures maintainability. Real-time features are implemented using WebSocket, providing instant updates without polling overhead.

The architecture supports both authenticated users and guest sessions, making the game accessible while maintaining security. Type safety is enforced throughout via shared contracts, reducing runtime errors and improving developer experience.

Future enhancements can include horizontal scaling with Redis, microservices separation, and advanced monitoring, all without major architectural changes.

---

**Related Documentation**:

- [Monorepo Structure](./monorepo.md)
- [Technology Stack Details](./tech-stack.md)
- [Design Patterns](./patterns.md)
- [Backend Architecture](../backend/README.md)
- [Frontend Architecture](../frontend/README.md)
