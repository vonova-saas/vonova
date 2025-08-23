# Use the official Bun image as the base image
FROM oven/bun:1 as base

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb (if available)
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim as production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Create logs directory for runtime
RUN mkdir -p logs

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory to the nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 4005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4005

# Start the application
CMD ["bun", "start"]
