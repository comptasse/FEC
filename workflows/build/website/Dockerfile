# ==============================================================================
# Dashboard Production Dockerfile
# ==============================================================================
# Multi-stage build: build React app with Vite, serve with Nginx
# ==============================================================================

FROM node:24-alpine AS base
RUN npm i -g pnpm@latest

# Define build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_WEBSITE_BASE_URL
ARG VERSION=0.0.0-unknown

# Set environment variables during the build process
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WEBSITE_BASE_URL=$VITE_WEBSITE_BASE_URL
ENV VERSION=$VERSION
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build stage
FROM base AS build
WORKDIR /root
COPY . .
RUN CI=true pnpm install --no-frozen-lockfile
ARG CACHEBUST
RUN pnpm --filter='@comptasse/fec-engine' run test
RUN pnpm run build

# Deploy stage - serve static files with Nginx
FROM nginx:alpine AS deploy
WORKDIR /
COPY workflows/build/website/nginx/default.conf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /root/packages/website/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
