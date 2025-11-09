# ============================================
# Stage 1: Builder
# ============================================
FROM node:25-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/

# Install dependencies
ENV CI=true
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/backend ./apps/backend
COPY packages/contracts ./packages/contracts

# Build backend - run from root to access workspace context
RUN pnpm --filter @whois-it/backend... install --frozen-lockfile && \
  pnpm --filter @whois-it/backend build

# ============================================
# Stage 2: Production
# ============================================
FROM node:25-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/contracts ./packages/contracts

WORKDIR /app/apps/backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["node", "dist/main.js"]
