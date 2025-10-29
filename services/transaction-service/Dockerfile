# Dockerfile for Transaction Service
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl wget dumb-init
COPY package*.json ./
COPY services/transaction-service/package*.json ./services/transaction-service/
COPY shared/*/package.json ./shared/*/

FROM base AS development
RUN npm install
COPY . .
RUN npm run build:shared
WORKDIR /app/services/transaction-service
RUN npm install
EXPOSE 3002
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npm run build:shared
WORKDIR /app/services/transaction-service
RUN npm ci --only=production && npm run build
RUN addgroup -g 1001 -S nodejs && adduser -S cloudpos -u 1001
USER cloudpos
EXPOSE 3002
HEALTHCHECK CMD curl -f http://localhost:3002/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]