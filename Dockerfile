FROM node:24.11-bookworm-slim AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# Dependencies stage
FROM base AS dependencies

WORKDIR /app

COPY app/package.json app/pnpm-lock.yaml ./ 

# Install the dependencies with pnpm, using a cache for the pnpm store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build stage
FROM base AS build

WORKDIR /app

# Copy over installed dependencies from the dependencies stage
COPY  --from=dependencies /app/node_modules ./node_modules
COPY /app ./

RUN ls -a
RUN pnpm run build

# Production image
FROM base AS web

WORKDIR /app

# Copy over built files from the build stage
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# COPY --from=build /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT [ "node", "server.js" ]
