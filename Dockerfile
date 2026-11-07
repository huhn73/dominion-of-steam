# Dominion of Steam: Web-App (gebaut) und Server (gebündelt) in einem Container.
# Drei Stufen: build (alle Abhängigkeiten, baut Web und Server), deps (nur die
# Produktions-Abhängigkeiten des Servers), runtime (nur das, was zur Laufzeit gebraucht wird).

# --- build: Web-App mit Vite, Server mit esbuild (inklusive @dos/shared) ---
FROM node:24-alpine AS build
RUN corepack enable pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
# Dev-Werkzeuge (Dev-Konten, Demo-Partie, Dev-Leiste in der Lobby): nur im lokalen Docker-Setup
# (`docker compose` baut mit DEV_TOOLS=true), in Produktion aus
ARG DEV_TOOLS=false
# Anbieterdaten für Impressum und Datenschutz (nicht im Repository); ohne Werte erscheinen Platzhalter
ARG VITE_ANBIETER_NAME
ARG VITE_ANBIETER_STRASSE
ARG VITE_ANBIETER_ORT
ARG VITE_ANBIETER_LAND
ARG VITE_ANBIETER_EMAIL
# Version, Commit und Build-Datum vom Deploy-Workflow; ohne sie zeigt das Spiel „<version>-dev“
ARG APP_VERSION
ARG APP_COMMIT
ARG APP_BUILT
RUN VITE_DEV_TOOLS=$DEV_TOOLS VITE_APP_VERSION=$APP_VERSION VITE_APP_COMMIT=$APP_COMMIT \
  VITE_APP_BUILT=$APP_BUILT pnpm --filter @dos/web build \
  && pnpm --filter @dos/server build

# --- deps: nur die Produktions-Abhängigkeiten des Servers (sharp mit musl-Binärdatei) ---
FROM node:24-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --prod --frozen-lockfile --filter @dos/server...

# --- runtime: gebündelter Server, Migrationen, gebaute Web-App, kein pnpm ---
FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
# Version für /api/health und die Neuigkeiten
COPY package.json ./
COPY apps/server/package.json apps/server/
COPY apps/server/drizzle apps/server/drizzle
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/web/dist apps/web/dist

ARG DEV_TOOLS=false
ARG APP_VERSION
ARG APP_COMMIT
ENV NODE_ENV=production \
    DEV_TOOLS=$DEV_TOOLS \
    APP_VERSION=$APP_VERSION \
    APP_COMMIT=$APP_COMMIT \
    STATIC_DIR=/app/apps/web/dist \
    PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
WORKDIR /app/apps/server
CMD ["node", "--enable-source-maps", "dist/index.js"]
