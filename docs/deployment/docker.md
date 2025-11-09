# Docker Setup Guide

This guide explains how to run the WhoIsIt application using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

Check your installation:
```bash
docker --version
docker-compose --version
```

## Quick Start

### Using the Helper Script (Recommended)

The repository includes a helper script to make Docker management easier:

```bash
# Make the script executable (first time only)
chmod +x docker.sh

# Start in development mode with hot-reload
./docker.sh dev

# Start in standard mode
./docker.sh start

# View all available commands
./docker.sh help
```

### Development Mode (with hot-reload)

For local development with hot-reload:

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

### Production Mode (optimized builds)

For production-like environment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Docker Compose Files

The project includes three Docker Compose configurations:

### 1. `docker-compose.dev.yml` - Development Mode

**Features:**
- Hot-reload for both frontend and backend
- Source code mounted as volumes
- Auto-installs dependencies on startup
- Development environment variables
- Database auto-sync enabled

**Usage:**
```bash
docker-compose -f docker-compose.dev.yml up
```

### 2. `docker-compose.yml` - Standard Build

**Features:**
- Optimized multi-stage Docker builds
- Production-ready images
- Development-friendly settings
- Includes database service

**Usage:**
```bash
docker-compose up -d
```

### 3. `docker-compose.prod.yml` - Production

**Features:**
- Strict production configuration
- Required environment variables
- Health checks enabled
- Auto-restart policies
- No development tools

**Usage:**
```bash
# Create .env file first with required variables
cp .env.example .env
# Edit .env with your production values

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

### Development

Development mode uses default values, but you can override them:

```bash
# Create .env file (optional for dev)
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
JWT_SECRET=your-secret-key
EOF
```

### Production

Production mode requires certain environment variables:

```bash
# Create .env.prod file
cat > .env.prod << EOF
# Database
DB_USER=postgres
DB_PASSWORD=secure-password
DB_NAME=whois_it

# Backend
JWT_SECRET=your-very-secure-secret-key
FRONTEND_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
EOF

# Use with production compose file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Building Individual Services

### Backend

```bash
# Build backend image
docker build -t whoisit-backend -f apps/backend/Dockerfile .

# Run backend container
docker run -p 4000:4000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=whois_it \
  -e JWT_SECRET=your-secret \
  whoisit-backend
```

### Frontend

```bash
# Build frontend image
docker build -t whoisit-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 \
  --build-arg NEXT_PUBLIC_SOCKET_URL=http://localhost:4000 \
  -f apps/frontend/Dockerfile .

# Run frontend container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:4000 \
  -e NEXT_PUBLIC_SOCKET_URL=http://localhost:4000 \
  whoisit-frontend
```

## Common Commands

### Start services
```bash
# Development mode with hot-reload
docker-compose -f docker-compose.dev.yml up

# Standard mode
docker-compose up

# Production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Stop services
```bash
docker-compose down

# With specific file
docker-compose -f docker-compose.dev.yml down

# Remove volumes too (deletes database)
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild and start
docker-compose up -d --build
```

### Execute commands in containers
```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Run pnpm commands in backend
docker-compose exec backend pnpm test

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d whois_it
```

## Database Management

### Run Migrations
```bash
# In development mode
docker-compose exec backend-dev pnpm migration:run

# In standard/production mode
docker-compose exec backend node -e "require('./dist/migration-runner')"
```

### Seed Database
```bash
# Development mode
docker-compose exec backend-dev pnpm seed
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres whois_it > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres whois_it < backup.sql
```

### Reset Database
```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm whoisit_postgres_data

# Start services (creates fresh database)
docker-compose up -d
```

## Troubleshooting

### Port already in use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Stop the process or change port in docker-compose.yml
```

### Services not connecting
```bash
# Check if services are running
docker-compose ps

# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Verify network
docker network ls
docker network inspect whoisit_whoisit-network
```

### Database connection issues
```bash
# Check if postgres is ready
docker-compose exec postgres pg_isready -U postgres

# Check environment variables
docker-compose exec backend env | grep DB_

# Restart services
docker-compose restart backend
```

### Build failures
```bash
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker image prune -a

# Check disk space
docker system df

# Clean up everything
docker system prune -a
```

### Permission issues (Linux)
```bash
# Fix ownership of node_modules
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up
```

## Performance Tips

### Development Mode
- Use `docker-compose.dev.yml` for hot-reload
- Mount source code as volumes
- Keep node_modules in anonymous volumes for better performance

### Production Mode
- Use multi-stage builds (already configured)
- Don't mount source code volumes
- Use `docker-compose.prod.yml`
- Enable health checks
- Set restart policies

### Optimize Build Time
```bash
# Use build cache
docker-compose build

# Build in parallel
docker-compose build --parallel

# Use BuildKit (faster)
DOCKER_BUILDKIT=1 docker-compose build
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: docker-compose build
      
      - name: Run tests
        run: docker-compose run backend pnpm test
      
      - name: Push to registry
        run: |
          docker tag whoisit-backend:latest registry.example.com/whoisit-backend:latest
          docker push registry.example.com/whoisit-backend:latest
```

## Production Deployment

### Deploy to VPS/Server

```bash
# SSH to server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourusername/WhoIsIt.git
cd WhoIsIt

# Create .env file with production values
nano .env.prod

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Update Deployment

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Or in one command
docker-compose -f docker-compose.prod.yml up -d --build
```

## Security Recommendations

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use secrets management** - Docker secrets or environment variable injection
3. **Scan images** - Use `docker scan` to check for vulnerabilities
4. **Use specific versions** - Pin Node.js and PostgreSQL versions
5. **Non-root user** - Run containers as non-root (consider adding)
6. **Limit resources** - Set memory/CPU limits in production
7. **Network isolation** - Use Docker networks (already configured)
8. **HTTPS** - Use reverse proxy (nginx/traefik) in production

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [NestJS Docker Documentation](https://docs.nestjs.com/recipes/docker)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `docker-compose logs -f`
3. Open an issue on GitHub
4. Check existing documentation in `/docs`
