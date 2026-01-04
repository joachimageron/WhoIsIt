# ============================================
# Stage 1: Builder
# ============================================
FROM node:lts-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/contracts/package.json ./packages/contracts/

# Install dependencies
ENV CI=true
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source files
COPY apps/frontend ./apps/frontend
COPY packages/contracts ./packages/contracts

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV DOCKER_BUILD=true

# Build frontend
RUN pnpm --filter @whois-it/frontend build

# ============================================
# Stage 2: Production
# ============================================
FROM node:lts-alpine AS production

WORKDIR /app

# Variables d'environnement indispensables pour Docker
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy built application from builder (standalone mode)
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Placement dans le dossier de l'app pour lancer le serveur
WORKDIR /app/apps/frontend

EXPOSE 3000

# Healthcheck amélioré (accepte 200, 301, 302, 307, 308)
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', (r) => {process.exit(r.statusCode < 400 ? 0 : 1)})"

# Start command
CMD ["node", "server.js"]