# syntax=docker/dockerfile:1

# Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install all dependencies (including dev)
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build stage
FROM base AS builder
# ⚠️ Đặt NODE_ENV=development để Next.js không tự cài lại packages
ENV NODE_ENV=development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Install only production dependencies
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache libc6-compat
USER node

# Copy production modules and build artifacts
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/next.config.js ./next.config.js
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next ./.next

EXPOSE 3000
CMD ["yarn", "start", "-p", "3000"]