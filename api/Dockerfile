FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN mkdir -p /app/uploads && chown node:node /app /app/uploads
USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --omit=dev

COPY --from=build --chown=node:node /app/dist ./dist

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]