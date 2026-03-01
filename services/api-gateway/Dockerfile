# Use Node.js LTS and install pnpm
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

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

# Set proper permissions
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose the port
EXPOSE 4000

# Start the application
CMD ["pnpm", "run", "start:prod"]