# Each target installs only the dependencies it needs from package-lock.json.
# Packages come from a shared npm cache; sharing=locked makes stages take turns,
# so the first one downloads and the rest install from the cache.
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS build
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci
COPY . .
RUN npm run build

# Only the Prisma CLI, from its own lock file in migrator/
FROM node:24-alpine AS migrate
WORKDIR /app
COPY migrator/package*.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci
COPY prisma.config.ts ./
COPY prisma ./prisma
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

# Production dependencies only: --omit=optional also drops prisma and typescript.
FROM base AS runtime
ENV NODE_ENV=production
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --omit=dev --omit=optional
RUN mkdir uploads && chown node:node uploads

# Code stays owned by root; the app can only write to uploads/
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
