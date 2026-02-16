# --- Build stage ---
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies with npm (this repo uses package-lock.json)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:18-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built output
COPY --from=build /app/dist ./dist

EXPOSE 4001

# Run compiled Nest app
CMD ["node", "dist/main"]