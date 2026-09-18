# ==============================================================================
# Dashboard Development Dockerfile
# ==============================================================================
# Minimal Node.js container for running the dashboard dev server.
# The application source is bind-mounted from the host at runtime.
# Dependencies are installed inside the container on startup (CMD).
# ==============================================================================

ARG NODE_VERSION="24"
ARG PNPM_VERSION="10.12.1"

FROM node:${NODE_VERSION}-bullseye-slim

ARG PNPM_VERSION

# Install PNPM
RUN npm install -g "pnpm@${PNPM_VERSION}"

# Set working directory (application is bind-mounted here)
WORKDIR /workspace

# Start: run Vite dev server (deps already installed by API container)
CMD ["sh", "-c", "pnpm --filter='./packages/website' dev -- --host 0.0.0.0"]
