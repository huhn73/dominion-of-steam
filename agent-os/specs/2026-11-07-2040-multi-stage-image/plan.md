# Multi-Stage-Image ohne Dev-Abhängigkeiten

## Context
Offener Roadmap-Punkt „Betrieb, offen“. Das heutige `Dockerfile` installiert alle Abhängigkeiten
des Workspaces (vite, vitest, jsdom, tailwind, drizzle-kit, typescript, Quellen von web/sim …),
baut darin das Web und startet den Server mit `tsx src/index.ts`. Ziel: ein Laufzeit-Image, das
nur gebautes Web, gebündelten Server, Migrationen und die Produktions-Abhängigkeiten des Servers
enthält – kleiner, schneller zu ziehen, weniger Angriffsfläche. Staging bleibt ein eigener Punkt.

Hürden aus dem Code:
- Server läuft heute über `tsx` (devDependency); `@dos/shared` ist reines TS ohne Build;
  Imports ohne Endung → Node-Typ-Stripping reicht nicht, also bündeln.
- `src/ai/runner.ts:61` startet `new URL('./worker.ts')` mit `--import tsx`.
- Pfade über `import.meta.url` mit unterschiedlicher Tiefe: `src/db/client.ts:15` (drizzle),
  `src/profile/service.ts:55` (uploads), `src/version.ts:6` (Root-`package.json`) – im Bündel
  liegt alles in `dist/index.js`, die relativen Pfade stimmen dann nicht mehr.

## Umsetzung

1. **Pfade zentral** – neues `apps/server/src/paths.ts`:
   `serverDir = fileURLToPath(new URL('..', import.meta.url))` (aus `src/paths.ts` wie aus
   `dist/index.js` → `apps/server/`). `client.ts`, `profile/service.ts`, `version.ts` nutzen es
   (`drizzle`, `uploads`, `../../package.json` relativ zu `serverDir`).
2. **Worker im Bündel** – `runner.ts` `spawn()`: läuft das Modul als `.ts`, wie bisher
   `worker.ts` + `--import tsx`; sonst `new URL('./worker.js', import.meta.url)` ohne execArgv.
3. **Server-Build** – `apps/server/build.mjs` mit esbuild (als devDependency von `@dos/server`,
   liegt schon im Store): Einstiege `src/index.ts` und `src/ai/worker.ts` → `dist/index.js`,
   `dist/worker.js`; `platform: node`, `format: esm`, `target: node24`, Sourcemaps;
   `external` = alle `dependencies` aus `package.json` außer `@dos/shared` (wird mitgebündelt),
   dazu `banner` mit `createRequire` für CJS-Abhängigkeiten. Scripts: `"build": "node build.mjs"`,
   `"start:prod": "node --enable-source-maps dist/index.js"`; `start` (tsx) bleibt für lokal.
   `dist` ist schon in `.dockerignore`/Git ignoriert – prüfen, `.gitignore` ggf. ergänzen.
4. **Dockerfile in drei Stufen** (`node:24-alpine`):
   - `build`: wie heute volle Installation, ARGs (DEV_TOOLS, ANBIETER_*, APP_*), Web-Build,
     dann `pnpm --filter @dos/server build`.
   - `deps`: nur Manifeste + Lockfile, `pnpm install --prod --frozen-lockfile --filter @dos/server...`
     (sharp mit musl-Binärdatei wie bisher).
   - `runtime`: `node_modules` aus `deps`, `apps/server/dist`, `apps/server/drizzle`,
     Root-`package.json`, `apps/web/dist`; ENV, EXPOSE, HEALTHCHECK unverändert;
     `CMD ["node", "--enable-source-maps", "dist/index.js"]` in `/app/apps/server`, kein pnpm/corepack.
   - Nicht-Root-User bewusst nicht in diesem Schritt (bestehendes Upload-Volume gehört root).
5. **Doku**: `deploy/README.md` kurz zum Aufbau des Images, Roadmap-Punkt teilweise abhaken
   (Staging bleibt offen), Spec-Ordner `agent-os/specs/2026-11-07-…-multi-stage-image/`,
   Eintrag im NEWS-Sammler 0.11.x nur falls gewünscht (keine sichtbare Funktion → eher nicht).

## Verifikation
- `pnpm --filter @dos/server typecheck` und `test` (einzeln, nicht `-r`).
- Lokal `pnpm --filter @dos/server build && node apps/server/dist/index.js` gegen die Dev-DB.
- `docker compose build app && docker compose up`: `/api/health`, Login, neue Partie gegen KI
  (Worker-Zug läuft), Avatar hochladen (sharp), Neuigkeiten/Version korrekt.
- `docker images` vorher/nachher vergleichen; im Image prüfen, dass kein vite/vitest/tsx/
  typescript liegt (`docker run --rm … ls /app/node_modules/.pnpm`).
- Kein Push nach main ohne Rückfrage (main deployt live); ggf. erst `main:dev`.

## Ergebnis (7. November 2026)
- Image lokal 1,88 GB → 280 MB (`node_modules` 63 MB, Web 54 MB, Server-Bündel 2,4 MB).
- Im Container geprüft: `/api/health`, Migrationen beim Start, Solo-Partie mit KI-Zug im
  Worker-Thread (`dist/worker.js`), Avatar-Upload mit sharp.
- `pnpm --filter @dos/server typecheck` und `test` grün.
