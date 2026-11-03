# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

# Copy root manifest and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies for building
RUN pnpm install --frozen-lockfile

# Copy root source files
COPY tsconfig.json ./
COPY src/ ./src/

# Build backend
RUN pnpm build

# Copy frontend source and build if present
COPY frontend/ ./frontend/
RUN if [ -f "frontend/package.json" ]; then \
      cd frontend && \
      corepack enable && \
      pnpm install --frozen-lockfile && \
      pnpm build; \
    fi

# Prune dev dependencies or install only production dependencies
RUN pnpm prune --prod

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
ENV PORT=3000

# Copy built backend files and production node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/infrastructure/schema.sql ./dist/infrastructure/schema.sql

# Copy frontend dist if present
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
