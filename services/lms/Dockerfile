# Vonova LMS (LMS + LMS-AI) – NATS microservice
# Multi-stage build for smaller production image

# ---- Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
RUN pnpm run build
RUN pnpm prune --prod

# ---- Production ----
FROM node:20-alpine AS production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R nestjs:nodejs /app
USER nestjs

# NATS microservice only (no HTTP port)
CMD ["node", "dist/main.js"]
