# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev deps for build)
RUN npm ci

# Copy source
COPY . .

# Build the app
RUN npm run build

# Stage 2: Runtime
FROM node:22-slim

WORKDIR /app

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
