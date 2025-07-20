# Use the official Bun image
FROM oven/bun:1.1.13

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json bun.lockb ./

# Install dependencies (including devDependencies for TypeScript)
RUN bun install

# Copy all source files
COPY . .

# Build the TypeScript project
RUN bun run build && cp ./package.json ./dist/

# Prune dev dependencies to reduce image size (optional)
RUN bun prune --production

# Expose the port your app runs on
EXPOSE 4000

# Start the compiled application
CMD ["bun", "run", "start"]