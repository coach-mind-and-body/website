# syntax=docker/dockerfile:1

# Base image with Node 22 (matches engines requirement)
FROM node:22-slim AS base

# Install system dependencies required by puppeteer/chromium and other libs
# (matching what Nixpacks was installing to support generate-pdf etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxss1 \
    libgtk-3-0 \
    libxshmfence1 \
    libglu1-mesa \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium (if any code path uses it)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Enable corepack + pnpm (project uses pnpm)
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# ==========================================
# Dependencies stage
# ==========================================
FROM base AS deps

# Copy only package files for better caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (dev + prod) — needed for build
RUN pnpm install --frozen-lockfile

# ==========================================
# Builder stage
# ==========================================
FROM base AS builder

# Railway automatically passes service variables (like DATABASE_URL) as --build-arg
# when using the DOCKERFILE builder. We must declare + export them so they are
# visible to Node/pnpm/drizzle-kit inside RUN steps.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source
COPY . .

# Run DB schema push (requires DATABASE_URL at build time).
# This is the same as the old "npm run db:push && npm run build" in railway.toml.
RUN pnpm run db:push

# Build the Next.js app
RUN pnpm run build

# Prune development dependencies for a smaller runtime image
RUN pnpm prune --prod

# ==========================================
# Production runner
# ==========================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what is needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Drizzle schema/migrations if needed at runtime (for some queries)
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Expose the port Next listens on
EXPOSE 3000

# Use the same start command as before
CMD ["npm", "start"]
