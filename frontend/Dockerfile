# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:${NODE_VERSION} AS runner
ARG FRONTEND_PORT=4173
ENV PORT=${FRONTEND_PORT}
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY server.js ./
EXPOSE ${FRONTEND_PORT}
CMD ["node", "server.js"]

