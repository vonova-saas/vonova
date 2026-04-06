FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies (dev deps needed for Nest build)
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Keep only production dependencies for runtime image
RUN pnpm prune --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/main.js health || exit 1

# Start the application (NATS microservice)
CMD ["node", "dist/main.js"]
