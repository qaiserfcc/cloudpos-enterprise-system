FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl dumb-init
COPY package*.json ./
COPY services/payment-service/package*.json ./services/payment-service/
COPY shared/*/package.json ./shared/*/

FROM base AS development  
RUN npm install
COPY . .
WORKDIR /app/services/payment-service
RUN npm install
EXPOSE 3004
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --only=production
COPY . .
WORKDIR /app/services/payment-service  
RUN npm ci --only=production && npm run build
RUN adduser -S cloudpos
USER cloudpos
EXPOSE 3004
HEALTHCHECK CMD curl -f http://localhost:3004/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]