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

# Production dependencies + Prisma CLI. npm keeps prisma with --omit=dev
# because it is an optional peer dependency of @prisma/client.
FROM base AS migrate
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --omit=dev
COPY prisma.config.ts ./
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]

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
