# Dominion of Steam: Web-App (gebaut) und Server in einem Container
FROM node:24-alpine
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
ENV VITE_DEV_TOOLS=$DEV_TOOLS
# Anbieterdaten für Impressum und Datenschutz (nicht im Repository); ohne Werte erscheinen Platzhalter
ARG VITE_ANBIETER_NAME=
ARG VITE_ANBIETER_STRASSE=
ARG VITE_ANBIETER_ORT=
ARG VITE_ANBIETER_LAND=
ARG VITE_ANBIETER_EMAIL=
RUN pnpm --filter @dos/web build

ENV NODE_ENV=production \
    DEV_TOOLS=$DEV_TOOLS \
    STATIC_DIR=/app/apps/web/dist \
    PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
WORKDIR /app/apps/server
CMD ["pnpm", "start"]
