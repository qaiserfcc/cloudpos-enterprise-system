# Multi-stage Dockerfile for API Gateway
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    dumb-init

# Create app directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/
COPY shared/database/package.json ./shared/database/

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Build shared packages first
RUN npm run build:shared

# Change to service directory
WORKDIR /app/services/api-gateway

# Install service-specific dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Development command with hot reload
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build shared packages
RUN npm run build:shared

# Build the API Gateway service
WORKDIR /app/services/api-gateway
RUN npm ci --only=production
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install production system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cloudpos -u 1001

# Copy built application from build stage
COPY --from=build --chown=cloudpos:nodejs /app/services/api-gateway/dist ./dist
COPY --from=build --chown=cloudpos:nodejs /app/services/api-gateway/node_modules ./node_modules
COPY --from=build --chown=cloudpos:nodejs /app/services/api-gateway/package*.json ./
COPY --from=build --chown=cloudpos:nodejs /app/shared ./shared

# Switch to non-root user
USER cloudpos

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]