# Architecture Documentation

## Overview

This section provides comprehensive documentation of the WhoIsIt system architecture, covering the design decisions, technology stack, and architectural patterns used throughout the project.

## Documents in This Section

### [System Architecture Overview](./overview.md)

High-level architecture and system design:
- **Client-Server Architecture** with Next.js frontend and NestJS backend
- **Communication Patterns** - REST APIs and WebSocket connections
- **Data Flow** - Request/response cycles and real-time updates
- **Service Architecture** - Modular backend services
- **Scalability Considerations** - Horizontal scaling and performance
- **Security Architecture** - Authentication, authorization, and data protection

### [Monorepo Structure](./monorepo.md)

PNPM workspace organization:
- **Workspace Configuration** - PNPM workspace setup
- **Package Organization** - Apps and shared packages
- **Dependency Management** - Hoisting and installation strategies
- **Build System** - Turbo for monorepo builds
- **Development Scripts** - Running and building packages
- **Best Practices** - Monorepo conventions

### [Technology Stack](./tech-stack.md)

Complete technology choices and rationale:
- **Frontend Stack** - Next.js 15, React 19, HeroUI, Tailwind CSS 4
- **Backend Stack** - NestJS 11, TypeORM, PostgreSQL
- **Real-time** - Socket.IO for bidirectional communication
- **Build Tools** - Turbopack, Vite, TypeScript
- **Package Management** - PNPM workspaces
- **Rationale** - Why each technology was chosen

### [Design Patterns](./patterns.md)

Architectural patterns and conventions:
- **Backend Patterns** - NestJS modules, services, controllers, DTOs
- **Frontend Patterns** - React hooks, components, state management
- **Data Patterns** - TypeORM entities, repositories, query builders
- **Communication Patterns** - REST, WebSocket, event-driven
- **Error Handling** - Exception filters, error boundaries
- **Testing Patterns** - Unit, integration, and E2E testing

## Key Architectural Concepts

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  Next.js 15 App Router + React 19 + HeroUI + Tailwind  │
└─────────────────────────────────────────────────────────┘
                          ▲ ▼
                    REST + WebSocket
                          ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                      API Layer                          │
│   NestJS Controllers + WebSocket Gateways + Guards     │
└─────────────────────────────────────────────────────────┘
                          ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                  │
│       NestJS Services + Game Logic + Email Service     │
└─────────────────────────────────────────────────────────┘
                          ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Access Layer                    │
│      TypeORM Repositories + Database Entities          │
└─────────────────────────────────────────────────────────┘
                          ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                          │
│                  PostgreSQL Database                    │
└─────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
whoisit/
├── apps/
│   ├── frontend/       # Next.js application
│   └── backend/        # NestJS application
├── packages/
│   └── contracts/      # Shared TypeScript types
├── docs/               # Documentation
└── package.json        # Root workspace config
```

### Communication Flow

**HTTP Requests**:
```
Frontend → REST API → Controller → Service → Repository → Database
                                             ← ← ← ← ←
```

**WebSocket Events**:
```
Frontend → Socket.IO → Gateway → Service → Database
                                   ↓
                              Broadcast ← Other Clients
```

## Design Principles

### 1. Separation of Concerns

- **Frontend**: UI, state management, routing
- **Backend**: Business logic, data persistence, authentication
- **Shared**: Type contracts, DTOs

### 2. Type Safety

- TypeScript throughout the codebase
- Shared types via `@whois-it/contracts`
- Runtime validation with class-validator

### 3. Modularity

- NestJS modules for backend features
- Next.js App Router for frontend pages
- Reusable React components
- Service-oriented architecture

### 4. Real-time Communication

- REST for CRUD operations
- WebSocket for live updates
- Optimistic UI updates
- Connection state management

### 5. Security First

- JWT authentication with HTTP-only cookies
- CORS protection
- Input validation
- SQL injection prevention (TypeORM)
- XSS protection (React)

### 6. Developer Experience

- Hot module replacement
- TypeScript for intellisense
- Comprehensive error messages
- Detailed logging
- Easy local development setup

## Architectural Decisions

### Why Monorepo?

**Benefits**:
- Shared types between frontend and backend
- Atomic commits across services
- Simplified dependency management
- Consistent tooling and configuration
- Easier refactoring

**Trade-offs**:
- Larger repository size
- Requires proper workspace configuration
- Need for careful dependency management

### Why Next.js App Router?

**Benefits**:
- Server Components for performance
- File-based routing
- Built-in internationalization
- API routes (not used, but available)
- Excellent developer experience

**Trade-offs**:
- Learning curve for new paradigm
- Some features still stabilizing
- Server/client component boundaries

### Why NestJS?

**Benefits**:
- TypeScript-first framework
- Dependency injection
- Modular architecture
- Excellent TypeORM integration
- Built-in testing support
- Decorators for clean code

**Trade-offs**:
- Heavier than Express
- Steeper learning curve
- More boilerplate

### Why TypeORM?

**Benefits**:
- TypeScript support
- Active Record and Data Mapper patterns
- Migration system
- Query builder
- Relationship management

**Trade-offs**:
- Performance overhead vs raw SQL
- Some advanced queries require raw SQL
- Migration complexity

### Why Socket.IO?

**Benefits**:
- Automatic reconnection
- Room-based broadcasting
- Fallback mechanisms
- Large ecosystem
- Easy to use

**Trade-offs**:
- Heavier than native WebSockets
- Some features require configuration
- Polling fallback overhead

## Performance Considerations

### Frontend

- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Static Generation**: Where possible
- **Lazy Loading**: Components and routes
- **Caching**: React Query (future)

### Backend

- **Database Indexing**: Proper indexes on queries
- **Connection Pooling**: TypeORM connection pool
- **Query Optimization**: Avoid N+1 queries
- **Caching**: Redis for session/game state (future)
- **Load Balancing**: Horizontal scaling support

### Real-time

- **Room Isolation**: Socket.IO rooms for targeted broadcasting
- **Connection Management**: Track and cleanup connections
- **Message Batching**: Reduce network overhead (future)
- **Delta Updates**: Send only changes (future)

## Scalability

### Horizontal Scaling

**Frontend**:
- Static site deployment (Vercel, Netlify)
- CDN for assets
- Edge caching

**Backend**:
- Stateless API design
- Session management via JWT
- Database connection pooling
- Load balancer ready

**Database**:
- PostgreSQL replication
- Read replicas
- Connection pooling
- Query optimization

### Vertical Scaling

- Database server resources
- Application server CPU/memory
- WebSocket connection limits

## Security

### Authentication

- JWT tokens in HTTP-only cookies
- Token expiration and refresh
- Password hashing with bcrypt
- Email verification

### Authorization

- Role-based access control (future)
- Route guards
- Ownership checks

### Data Protection

- SQL injection prevention (TypeORM parameterization)
- XSS prevention (React escaping)
- CSRF protection (SameSite cookies)
- CORS configuration
- Rate limiting (future)

## Monitoring and Observability

### Logging

- Structured logging
- Log levels (debug, info, warn, error)
- Request/response logging
- Error stack traces

### Metrics (Future)

- Request latency
- Error rates
- Active connections
- Database query performance
- Game statistics

### Error Tracking (Future)

- Sentry integration
- Error aggregation
- Source maps
- User context

## Testing Strategy

### Unit Tests

- Service logic
- Utility functions
- Component logic

### Integration Tests

- API endpoints
- Database operations
- Authentication flow

### E2E Tests (Future)

- User flows
- Game scenarios
- Real-time interactions

## Deployment Architecture

### Development

```
Developer Laptop
├── Frontend (localhost:3000)
├── Backend (localhost:4000)
└── PostgreSQL (localhost:5432)
```

### Production

```
┌──────────────────────────────────────────────────┐
│              CDN / Edge Network                   │
│           (Vercel Edge Network)                   │
└──────────────────────────────────────────────────┘
                      ▲
                      │
┌──────────────────────────────────────────────────┐
│           Frontend (Next.js on Vercel)            │
└──────────────────────────────────────────────────┘
                      ▲
                      │
┌──────────────────────────────────────────────────┐
│     Backend API + WebSocket (Railway/Heroku)     │
└──────────────────────────────────────────────────┘
                      ▲
                      │
┌──────────────────────────────────────────────────┐
│        PostgreSQL (Managed Database)              │
│          (Railway/Heroku Postgres)                │
└──────────────────────────────────────────────────┘
```

## Related Documentation

- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)
- [API Documentation](../api/README.md)
- [Development Guide](../development/README.md)
- [Deployment Guide](../deployment/README.md)

---

**Last Updated**: November 2024
