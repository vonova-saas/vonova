# Use Node.js LTS and pnpm
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY src/ ./src/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Build the TypeScript project
RUN pnpm run build

# Remove dev dependencies to reduce image size
RUN pnpm prune --prod

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nestjs

USER nestjs

# Start the microservice (NATS + optional HTTP app from main.ts)
CMD ["node", "dist/main.js"]