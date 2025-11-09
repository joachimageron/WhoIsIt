# ============================================
# Stage 1: Builder
# ============================================
FROM node:25-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/contracts/package.json ./packages/contracts/

# Install dependencies
ENV CI=true
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/frontend ./apps/frontend
COPY packages/contracts ./packages/contracts

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV DOCKER_BUILD=true

# Build frontend - run from root to access workspace context
RUN pnpm --filter @whois-it/frontend... install --frozen-lockfile && \
  pnpm --filter @whois-it/frontend build

# ============================================
# Stage 2: Production
# ============================================
FROM node:25-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

WORKDIR /app/apps/frontend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["node", "server.js"]
