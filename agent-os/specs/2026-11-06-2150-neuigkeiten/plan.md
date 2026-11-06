# Neuigkeiten: Hinweis auf neue Versionen und Übersicht der Updates

## Context

Spieler erfahren bisher nicht, was eine neue Version bringt. Die Fußzeile zeigt nur die Versionsnummer (`apps/web/src/shell/AppVersion.tsx`), die auf das technische GitHub-Release verlinkt. Gewünscht (Spieler, 6. November 2026):
- Nach einem Update sieht ein Spieler beim nächsten Besuch einmal einen Hinweis. Er fasst die neuen Funktionen aller Versionen zusammen, die er noch nicht kennt, je Funktion ein Satz.
- Ohne neues Update gibt es keinen Hinweis, nur einen Link „Neuigkeiten“ in der Fußzeile zu einer Seite mit allen Update-Infos.

Entscheidungen aus dem Shaping:
- **Quelle:** gepflegte Datei im Repo (Version, Datum, Einträge mit Titel und einem Satz), nur spielerrelevante Neuerungen.
- **Gesehen:** im Spielerkonto (neue Spalte), gilt auf allen Geräten, wie `tutorialDismissedAt`.
- **Neue Spieler:** kein Hinweis; bei der Registrierung gilt die aktuelle Version als gesehen.
- **Zeitpunkt:** beim nächsten Besuch einer Menüseite, auch mit bestehender Sitzung; nie mitten in einer Partie.
- **Rückwirkend:** Einträge für 0.9.0, 0.10.0 und 0.10.1. Bestehende Spieler gelten als bis 0.10.1 informiert und sehen den ersten Hinweis mit dem Release, das diese Funktion ausliefert.
- **Visuals:** keine; Dialog im Stil von Rundenbericht und Tutorial-Angebot, Seite im Stil der Rechtstexte.

Spec-Ordner: `agent-os/specs/2026-11-06-2150-neuigkeiten/`.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-06-2150-neuigkeiten/` mit `plan.md`, `shape.md` (Umfang, Entscheidungen oben; außerhalb des Umfangs: E-Mail oder Push zu Updates, GitHub-Release-Text aus derselben Datei), `standards.md` („Keine; `agent-os/standards/` ist nicht angelegt.“), `references.md`.

## Task 2: Update-Infos als Daten (`packages/shared`)

- Neue Datei `packages/shared/src/news/index.ts` (Export `@dos/shared/news` in `package.json` ergänzen, wie `./lobby`):
  - `NEWS: ReleaseNotes[]`, neueste zuerst, `{ version, date, items: { title, text }[] }`
  - `compareVersions(a, b)` für x.y.z
  - `unseenNews(seen: string | null, current: string)`: alle Versionen > `seen` und ≤ `current` mit mindestens einem Eintrag, neueste zuerst. `seen = null` heißt: nichts zeigen (Sicherheitsnetz).
  - `latestNewsVersion()`
- Einträge rückwirkend aus der Git-Historie, je ein Satz in Spielersprache, ohne Technik wie Header, Deploy, Formatierung:
  - **0.9.0:** was bis dahin für Spieler sichtbar dazukam; aus `git log v0.9.0` zusammenfassen
  - **0.10.0:** Tutorial-Mission „Erste Schritte“, Kompendium mit Fraktionsausführungen und Bildern, Link-Vorschau beim Teilen, Hinweis bei der Push-Freigabe
  - **0.10.1:** Echtzeit-Aktualisierung von Lobby, Warteraum und Partie, KI zieht im Hintergrund (Zugende sofort), Spielfeld-Einstellungen „Einheiten ziehen“, „Nachfrage beim Zugende“, Pinch-Zoom, klügere KI (gemeinsame Angriffe, merkt sich Gegner im Nebel)
  - **Nächste Version** (die diese Funktion ausliefert, z. B. 0.11.0): „Neuigkeiten“ selbst. Die Versionsnummer setzt `pnpm release` beim Release; der Eintrag wird dann angepasst.
- Test in `packages/shared`: `NEWS` absteigend sortiert, Versionen eindeutig, jeder Eintrag ein Satz mit Punkt am Ende, `unseenNews`-Fälle. Dazu ein Test, dass die Version im Root-`package.json` einen `NEWS`-Eintrag hat (Eintrag ohne Items erlaubt, z. B. für reine Fehlerbehebungen), damit kein Release ohne Notiz entsteht. Hinweis dazu in `scripts/release.mjs` bei den nächsten Schritten.

## Task 3: Server

- Migration `apps/server/drizzle/0009_neuigkeiten.sql` per `pnpm --filter server db:generate`: Spalte `players.news_seen_version text`. Bestehende Zeilen bekommen `'0.10.1'` (UPDATE in der Migration).
- `schema.ts`: `newsSeenVersion: text('news_seen_version')`.
- Registrierung (`apps/server/src/auth/accounts.ts`, Insert): `newsSeenVersion: latestNewsVersion()`.
- `Me` (`packages/shared/src/account/index.ts`) um `newsSeenVersion: string | null` erweitern, `toMe` setzt es.
- Route `POST /api/news/seen` mit Body `{ version }`, `requireAuth`. Sie setzt das Feld nur nach oben (`compareVersions`), unbekannte Versionen ergeben 422, und sie antwortet wie `GET /api/me`. Vorbild: `routes/tutorial.ts` (`/tutorial/dismiss`). Neue Datei `apps/server/src/routes/news.ts`, registriert in `app.ts`.
- Tests in `apps/server` wie bei `tutorial`: Registrierung setzt die Version, Route setzt sie hoch und nicht zurück, ohne Anmeldung 401.

## Task 4: Web

- **Hinweis-Dialog** `apps/web/src/shell/NewsDialog.tsx`, eingehängt in `MenuLayout.tsx`. Er sitzt unter dem Router, Spieler-Queries über dem Router sind wegen des Query-Cache-Clears beim Login tabu. In `GameLayout` erscheint er nie.
  - Zeigt die Einträge aus `unseenNews(me.newsSeenVersion, appVersion())`, gruppiert nach Version mit Datum.
  - Knopf „Verstanden“ ruft `POST /api/news/seen` mit der neuesten gezeigten Version und aktualisiert `me` im Cache. Schließen per Esc oder Klick daneben zählt auch als gesehen.
  - Link „Alle Neuigkeiten“ führt zur Seite.
  - Die App-Version kommt aus `appVersion().label`, der Teil vor `+` oder `-dev`. Lokal (`-dev`) zählt die Version aus `__APP_VERSION__`.
  - Dialog-Aufbau und Fokusführung wie bei vorhandenen Dialogen (`sections/spielfeld/components/Rundenbericht.tsx`, Tutorial-Angebot in `sections/lobby`), mobil voll nutzbar.
- **Seite** `apps/web/src/pages/neuigkeiten/NeuigkeitenPage.tsx`, Route `routes.news = '/neuigkeiten'`. Öffentlich wie die Rechtstexte (`router.tsx`), Layout über `pages/rechtliches/LegalPage.tsx`. Alle `NEWS`-Versionen, neueste zuerst, Datum deutsch formatiert.
- **Link in den Fußzeilen:** „Neuigkeiten“ neben der Version in `shell/MenuFooter.tsx` und `pages/anmeldung/AuthLayout.tsx`, gleicher Stil wie `LegalLinks`.
- Data-Hook in `apps/web/src/data/` (Muster `data/lobby.ts`, `after(() => post(...))`) für das Markieren als gesehen.
- Tests (Vitest/RTL wie `AppVersion.test.tsx`, `Rechtliches.test.tsx`):
  - Dialog erscheint bei älterer gesehener Version, nicht bei aktueller und nicht bei `null`.
  - „Verstanden“ sendet die neueste Version.
  - Die Seite listet alle Versionen.
  - Der Fußzeilen-Link führt auf `/neuigkeiten`.

## Verification

1. Tests und Typecheck je Paket einzeln (`shared`, `server`, `web`); nicht `pnpm -r typecheck`.
2. Lokal starten (Skill `run`). Mit Playwright aus dem npx-Cache und System-Chrome (Memory) einen Spieler per psql auf `news_seen_version = '0.9.0'` setzen und prüfen:
   - Nach dem Laden der Lobby erscheint der Dialog mit 0.10.0 und 0.10.1.
   - Nach „Verstanden“ kommt kein Dialog mehr, auch nicht nach einem Reload.
   - Ein neu registrierter Spieler sieht keinen Dialog.
   - `/neuigkeiten` ist auch abgemeldet erreichbar.
   - Screenshot hell und dunkel, mobil 375 px.
3. Migration auf einer Kopie prüfen: bestehende Spieler stehen auf `0.10.1`.
4. Commit; Push nach `main:dev` erst nach Rückfrage. Live (`main`) geht es erst mit dem nächsten Release (`pnpm release`), dann den `NEWS`-Eintrag auf die Release-Version setzen.
