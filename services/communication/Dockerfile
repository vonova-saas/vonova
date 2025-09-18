# Use the official Bun image
FROM oven/bun:1.1.13

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json bun.lock ./

# Install dependencies (including devDependencies for TypeScript)
RUN bun install

# Copy all source files
COPY src/ ./src/
COPY tsconfig.json ./

# Build the TypeScript project
RUN bun run build && cp ./package.json ./dist/

# Expose the port your app runs on
EXPOSE 4004

# Start the compiled application
CMD ["bun", "run", "start"]