FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci

# Vite dev server for docker-compose.yml, which mounts the source code
FROM deps AS development
EXPOSE 3000
CMD ["npm", "start"]

FROM deps AS build
COPY . .
RUN npm run build

# Static files served by nginx
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
