# Multi-stage Dockerfile for Auth Service
FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache curl wget dumb-init

COPY package*.json ./
COPY services/auth-service/package*.json ./services/auth-service/
COPY shared/*/package.json ./shared/*/

FROM base AS development
RUN npm install
COPY . .
RUN npm run build:shared
WORKDIR /app/services/auth-service
RUN npm install
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm ci --only=production
COPY . .
RUN npm run build:shared
WORKDIR /app/services/auth-service
RUN npm ci --only=production && npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl wget dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S cloudpos -u 1001
COPY --from=build --chown=cloudpos:nodejs /app/services/auth-service/dist ./dist
COPY --from=build --chown=cloudpos:nodejs /app/services/auth-service/node_modules ./node_modules
COPY --from=build --chown=cloudpos:nodejs /app/services/auth-service/package*.json ./
COPY --from=build --chown=cloudpos:nodejs /app/shared ./shared
USER cloudpos
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]