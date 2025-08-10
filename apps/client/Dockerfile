# Use the official Bun image
FROM oven/bun:1.1.13

# Set working directory
WORKDIR /app

COPY . .

# Install dependencies (including devDependencies for TypeScript)
RUN bun install

RUN bun run build

CMD ["bun", "run", "start"]