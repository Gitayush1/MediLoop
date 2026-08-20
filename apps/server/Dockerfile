FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=@mediloop/server --workspace=@mediloop/shared

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@mediloop/server

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mediloop

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

RUN mkdir -p /app/apps/server/uploads && chown mediloop:nodejs /app/apps/server/uploads

USER mediloop

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
