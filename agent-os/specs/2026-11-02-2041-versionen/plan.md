# Versionsnummer: festlegen, beim Deploy markieren, im Spiel anzeigen

## Context
Bisher gibt es keine Versionsnummer: Alle `package.json` stehen auf `0.0.0`, es gibt keine Git-Tags. Im deployten Spiel sieht man nicht, welcher Stand läuft.

Entscheidungen des Nutzers:
- Die Version steht im Root-`package.json` und wird per Skript gesetzt.
- Der Deploy-Workflow liest sie. Bei einer neuen Version legt er Git-Tag, Image-Tag und GitHub-Release an. Pushes ohne neue Version laufen als `0.9.0+abc1234`.
- Die Version erscheint in der Fußzeile der Menüseiten und unter der Anmeldekarte.
- Start mit **0.9.0**, die 1.0.0 kommt bewusst zum öffentlichen Start.

## Task 1: Spec-Dokumentation speichern
`agent-os/specs/2026-11-02-2041-versionen/` mit:
- `plan.md` und `shape.md` (Entscheidungen von oben)
- `references.md`: `MenuFooter`, `AuthLayout`, `deploy.yml`, `Dockerfile`, Anbieter-Variablen als Muster für Build-Werte
- `standards.md`: Vermerk, dass es keine Standards gibt

## Task 2: Version festlegen
- Root-`package.json`: `"version": "0.9.0"`. Die Workspace-Pakete (`apps/*`, `packages/*`) bekommen dieselbe Version, damit nirgends `0.0.0` steht.
- Neu: `scripts/release.mjs` mit `pnpm release <patch|minor|major|x.y.z>`.
  - Prüft auf SemVer.
  - Setzt die Version im Root und in allen Workspace-`package.json`, ohne die übrige Formatierung anzutasten.
  - Gibt die nächsten Schritte aus: committen, nach `dev` pushen, beim Merge nach `main` entsteht das Release.
  - Legt selbst keinen Tag an; das macht der Workflow nach erfolgreichem Deploy.
- Root-Skript `"release": "node scripts/release.mjs"`.

## Task 3: Version in den Build
- `apps/web/vite.config.ts`: `define` mit `__APP_VERSION__` aus dem Root-`package.json` (per `readFileSync`) als Rückfall. Den Build-Wert liest die App aus `import.meta.env.VITE_APP_VERSION`, dazu `VITE_APP_COMMIT` und `VITE_APP_BUILT`. Die Typen kommen in `apps/web/src/vite-env.d.ts` bzw. als `declare const`.
- Neu: `apps/web/src/version.ts` mit `appVersion()`. Es liefert `{ label, commit, built }`:
  - `label` aus `VITE_APP_VERSION`, sonst `__APP_VERSION__`.
  - Lokal ohne Build-Werte wird daraus `0.9.0-dev`.
- `Dockerfile`: `ARG APP_VERSION`, `ARG APP_COMMIT`, `ARG APP_BUILT`, ohne leere Vorgaben wie bei den Anbieter-Variablen, als `VITE_APP_*` an `pnpm --filter @dos/web build`. Außerdem `ENV APP_VERSION` und `APP_COMMIT` für den Server.
- Server `apps/server/src/app.ts`: `/api/health` liefert `{ ok, version, commit }` aus `process.env`, mit Rückfall auf die Version aus `package.json`. So lässt sich nach dem Deploy per `curl` prüfen, was läuft.
- Lokales `docker-compose.yml`: unverändert. Ohne Build-Werte heißt der Stand `0.9.0-dev`.

## Task 4: Deploy-Workflow
In `.github/workflows/deploy.yml`, Job `build`:
- Neuer Schritt `version`:
  - `VERSION` aus `package.json` lesen.
  - Prüfen, ob es den Tag `v$VERSION` schon gibt (`git ls-remote --tags origin`).
  - Gibt es ihn nicht: `release=true` und `label=$VERSION`.
  - Gibt es ihn: `release=false` und `label=$VERSION+${sha::7}`.
- `metadata-action` bekommt zusätzlich `type=raw,value=v${{ VERSION }},enable=${{ release }}`.
- `build-args`: `APP_VERSION=label`, `APP_COMMIT=${{ github.sha }}`, `APP_BUILT=` mit dem Datum des Commits.
- Ausgaben `release` und `version` an die folgenden Jobs weiterreichen.

Neuer Job `release` nach `deploy`:
- Läuft nur bei `release == 'true'`, mit `permissions: contents: write`.
- `gh release create v$VERSION --target ${{ github.sha }} --generate-notes --title "Dominion of Steam $VERSION"`.
- Schlägt der Deploy fehl, entsteht kein Tag, und der nächste Lauf versucht es erneut.

## Task 5: Anzeige
- Neu: `apps/web/src/shell/AppVersion.tsx`. Kleiner, gedämpfter Text „v0.9.0“, der Tooltip zeigt „Commit abc1234 · gebaut am 2. November 2026“.
  - Ist ein Commit bekannt, verlinkt er auf das Release (`…/releases/tag/v0.9.0`) bzw. auf den Commit.
  - Lokal steht dort „v0.9.0-dev“ ohne Link.
- Eingebaut in `apps/web/src/shell/MenuFooter.tsx` neben „© 2026 Dominion of Steam“ und in `apps/web/src/pages/anmeldung/AuthLayout.tsx` unter den `LegalLinks`.
- Test: `AppVersion` zeigt die Version aus gestubbten Env-Werten (`vi.stubEnv`) und lokal „-dev“. Dazu die Fußzeile im bestehenden Test der Rechtsseiten.

## Task 6: Doku
- `deploy/README.md`: neuer Abschnitt „Versionen und Releases“. Ablauf `pnpm release minor` → Commit → PR nach `main` → Deploy legt Tag, Image `v0.10.0` und Release an. Rollback auf `APP_TAG=v0.9.0` als lesbare Alternative zu `sha-…`.
- `docs/ENTWICKLUNG.md`: kurzer Absatz zur Version (`version.ts`, `/api/health`).
- `README.md`: unverändert.

## Verification
- `pnpm release patch` probeweise: Danach stehen alle `package.json` auf `0.9.1`. Mit `git checkout` zurücksetzen bzw. auf `0.9.0` lassen.
- `pnpm lint`, Typecheck je Paket, Tests in web und server; der Health-Test wird um `version` erweitert.
- `docker compose up -d --build`: Die Fußzeile zeigt „v0.9.0-dev“.
- `docker build --build-arg APP_VERSION=0.9.0 --build-arg APP_COMMIT=… .` und das Image starten: Die Fußzeile zeigt „v0.9.0“, `/api/health` liefert Version und Commit.
- Den Workflow-Teil prüfe ich per Lesen und mit `actionlint`, falls verfügbar. Er läuft erst beim ersten Push auf `main`.
- Commit, dann `git push origin main:dev`.
