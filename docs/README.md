# WhoIsIt Documentation

Welcome to the comprehensive documentation for the WhoIsIt project - a real-time multiplayer guessing game built as a modern monorepo application.

## Documentation Structure

This documentation is organized into the following sections:

### 📐 [Architecture](./architecture/)
System design, monorepo structure, and architectural decisions.
- [Overview](./architecture/overview.md) - High-level system architecture
- [Monorepo Structure](./architecture/monorepo.md) - Workspace organization
- [Technology Stack](./architecture/tech-stack.md) - Technologies and libraries used
- [Design Patterns](./architecture/patterns.md) - Common patterns and conventions

### 🔧 [Backend](./backend/)
NestJS backend API, game logic, and database documentation.
- [API Endpoints](./backend/api-endpoints.md) - REST API reference
- [Database Schema](./backend/database.md) - Entity relationships and schema
- [Authentication](./backend/authentication.md) - Auth system and JWT implementation
- [Game Mechanics](./backend/game-mechanics.md) - Core game logic and services
- [WebSocket Implementation](./backend/websockets.md) - Real-time communication

### 🎨 [Frontend](./frontend/)
Next.js application structure and client-side implementation.
- [Application Structure](./frontend/structure.md) - App Router and file organization
- [State Management](./frontend/state-management.md) - Zustand stores and patterns
- [UI Components](./frontend/ui-components.md) - HeroUI components and theming
- [Internationalization](./frontend/i18n.md) - Multi-language support
- [Real-time Client](./frontend/realtime.md) - Socket.IO client implementation

### 🔌 [API](./api/)
API contracts, types, and communication protocols.
- [REST API Reference](./api/rest-api.md) - Complete REST endpoint documentation
- [Socket.IO Events](./api/socket-events.md) - Real-time event reference
- [Shared Types](./api/types.md) - TypeScript contracts and DTOs

### 💻 [Development](./development/)
Developer guides, workflows, and best practices.
- [Getting Started](./development/getting-started.md) - Setup and installation
- [Development Workflow](./development/workflow.md) - Day-to-day development
- [Testing Guide](./development/testing.md) - Testing strategies and examples
- [Debugging](./development/debugging.md) - Debugging tools and techniques

### 🚀 [Deployment](./deployment/)
Production deployment and operations documentation.
- [Environment Configuration](./deployment/environment.md) - Environment variables
- [Database Migrations](./deployment/migrations.md) - Running and managing migrations
- [Production Deployment](./deployment/production.md) - Deployment procedures
- [CI/CD Pipeline](./deployment/cicd.md) - Automated workflows

## Quick Links

- [Main README](../README.md) - Project overview and quick start
- [GitHub Copilot Instructions](../.github/copilot-instructions.md) - AI assistant guidelines
- [Contributing Guidelines](./development/workflow.md) - How to contribute

## About WhoIsIt

WhoIsIt is a real-time multiplayer guessing game where players try to identify mystery characters by asking yes/no questions. The project demonstrates:

- **Modern Full-Stack Architecture**: PNPM monorepo with TypeScript throughout
- **Real-Time Communication**: Socket.IO for instant game updates
- **Scalable Backend**: NestJS with PostgreSQL and TypeORM
- **Rich Frontend**: Next.js 15 with HeroUI component library
- **Type Safety**: Shared type contracts between frontend and backend
- **Internationalization**: Multi-language support (English, French)
- **Authentication**: JWT-based auth with guest session support

## Getting Help

If you can't find what you're looking for:

1. Check the relevant section above
2. Search across all documentation files
3. Review the [GitHub Copilot Instructions](../.github/copilot-instructions.md) for technical details
4. Open an issue on the GitHub repository

## Documentation Conventions

Throughout this documentation:

- 📝 **Code Examples**: Shown in code blocks with syntax highlighting
- ⚠️ **Important Notes**: Marked with warning emoji
- 💡 **Tips**: Best practices and helpful hints
- 🔗 **Cross-References**: Links to related documentation

---

Last updated: November 2024
