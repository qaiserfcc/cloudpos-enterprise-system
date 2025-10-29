# Standard Service Dockerfile Template
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl dumb-init
COPY package*.json ./
COPY services/inventory-service/package*.json ./services/inventory-service/
COPY shared/*/package.json ./shared/*/

FROM base AS development  
RUN npm install
COPY . .
WORKDIR /app/services/inventory-service
RUN npm install
EXPOSE 3003
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --only=production
COPY . .
WORKDIR /app/services/inventory-service  
RUN npm ci --only=production && npm run build
RUN adduser -S cloudpos
USER cloudpos
EXPOSE 3003
HEALTHCHECK CMD curl -f http://localhost:3003/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]