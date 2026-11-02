# Nutzungsübersicht für Admins

## Kontext

Wer das Spiel betreibt, sieht derzeit nicht, wie es genutzt wird: wie viele Konten es gibt, wer aktiv ist und wie viele Partien laufen. Es gibt keine Admin-Rolle. Die Datenbank hat aber schon alles, was eine Übersicht braucht: `players` (createdAt, lastSeenAt, emailVerifiedAt), `matches` (status, mode, round, createdAt, endedAt), `match_seats` (kind player/ai/…) und `turns` (endedAt).

Ziel: eine Seite `/admin`, die nur Admins sehen. Sie zeigt Kennzahlen zu Konten und Partien, einen Verlauf über 7/30/90 Tage und Listen der letzten Konten und Partien. E-Mail-Adressen erscheinen nirgends.

Spec-Ordner: `agent-os/specs/2026-11-02-2059-admin-nutzungsuebersicht/`

## Entscheidungen (Shaping)

- **Admin:** Env-Variable `ADMIN_EMAILS` (kommagetrennt, ohne Unterscheidung von Groß- und Kleinschreibung) auf dem Server. Keine Migration. Ohne die Variable gibt es keine Admins.
- **Datenschutz:** In Antworten und UI keine E-Mail-Adressen, nur Anzeigenamen. In `/api/me` kommt nur `isAdmin: boolean` hinzu. Die Datenschutzerklärung bekommt einen kurzen Satz zur Auswertung.
- **Testdaten herausrechnen:** Konten mit `@dominion.test` (Dev-Konten) und die Partie `DEMO_MATCH_ID = 'demo'` zählen nicht mit.
- **Zeitraum:** umschaltbar zwischen 7, 30 und 90 Tagen (`Segmented` aus `sections/profil/components/ui.tsx`). Das Diagramm sind eigene SVG-Balken, ohne neue Abhängigkeit.
- **Stil:** wie Profil/Einstellungen.
- **Verworfen:** Spalte `is_admin`, reiner JSON-Endpunkt, Chart-Bibliothek.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-02-2059-admin-nutzungsuebersicht/` mit:
- `plan.md` (dieser Plan), `shape.md` (Umfang, Entscheidungen, Kontext; Format wie `2026-11-02-2041-versionen/shape.md`)
- `standards.md`: keine, da `agent-os/standards/` nicht existiert
- `references.md`: Verweise unten
- keine `visuals/`

## Task 2: Gemeinsame Typen (`packages/shared`)

- `packages/shared/src/account/index.ts`: `Me` um `isAdmin: boolean` erweitern.
- Neues Modul `packages/shared/src/admin/index.ts` (Export im `package.json` von shared wie bei `account`/`profile`):
  - `AdminRange = 7 | 30 | 90`
  - `AdminStats`, bestehend aus:
    - `accounts {total, verified, new, active24h, activeRange}`
    - `matches {waiting, running, finished, live, async, solo, multiplayer, avgRoundsFinished, newInRange}`
    - `daily: {date, registrations, matchesStarted, turns}[]` (lückenlos, eine Zeile pro Tag)
    - `recentPlayers: {id, name, avatarUrl, createdAt, lastSeenAt, emailVerified, matches}[]` (20)
    - `recentMatches: {id, name, mode, status, round, humans, ais, createdAt, updatedAt}[]` (20)

## Task 3: Server – Admin-Prüfung und Statistik

- `apps/server/src/session.ts`: `isAdminEmail(email)` liest `ADMIN_EMAILS` (bei jedem Aufruf, damit Tests die Variable setzen können) und `requireAdmin` als preHandler. Ohne Sitzung kommt 401 (`notAuthenticated`), ohne Admin-Recht 403 mit `{error:{code:'FORBIDDEN', message:'Kein Zugriff.'}}`.
- `apps/server/src/auth/accounts.ts` → `toMe`: `isAdmin: isAdminEmail(player.email)`.
- Neu `apps/server/src/admin/service.ts`: `createAdminService(db)` mit `stats(range, now = new Date())`, Drizzle plus `sql\`count(*)::int\``, so wie in `profile/service.ts`.
  - Filter: `players.email NOT LIKE '%@dominion.test'` und `matches.id <> 'demo'`.
  - Solo bzw. Mehrspieler: Anzahl der `match_seats` mit `kind = 'player'` und gesetzter `player_id` (1 bedeutet Solo).
  - Tagesreihe: `generate_series` über den Zeitraum mit LEFT JOIN auf die Tageszählungen von players.createdAt, matches.createdAt und turns.endedAt (`date_trunc('day', … AT TIME ZONE 'Europe/Berlin')`).
  - Aktiv: `lastSeenAt >= now - 24h` bzw. `>= now - range`.
- Neu `apps/server/src/routes/admin.ts`: `GET ${API_PREFIX}/admin/stats?range=7|30|90` (Standard 30, ungültig → 422 `INVALID_INPUT`), preHandler `requireAdmin`.
- `apps/server/src/app.ts`: Service anlegen, `adminRoutes(scope, admin)` neben `profileRoutes` registrieren.
- `deploy/README.md` und `.env`-Beispiel: `ADMIN_EMAILS` dokumentieren. `docker-compose.yml` (lokal): `ADMIN_EMAILS: bjoern@dominion.test`, damit die Seite lokal sichtbar ist. Die Zahlen sind lokal dann wegen des Filters fast leer, das ist gewollt.

## Task 4: Web – Seite `/admin`

- `apps/web/src/routes.ts`: `admin: '/admin'`. `router.tsx`: Route unter `MenuLayout`.
- `apps/web/src/data/admin.ts`: `useAdminStats(range)` mit `useQuery(['admin','stats',range])` über `api<AdminStats>()`. Die Query wird nur auf der Seite abonniert (siehe Memory „Query-Cache beim Login“).
- `apps/web/src/pages/admin/AdminPage.tsx`: Laden und Fehler über `PageState` (wie `ProfilePage`). Wenn `!me.isAdmin` gilt oder der Server 403 meldet, wird `NotFoundPage` gezeigt.
- `apps/web/src/sections/admin/components/`:
  - `Nutzungsuebersicht.tsx`: Kopf mit Titel und `Segmented` 7/30/90, darunter Kennzahl-Kacheln für Konten und Partien
  - `VerlaufDiagramm.tsx`: drei kleine SVG-Balkenreihen, `<title>` je Balken als Tooltip, Achsen mit Datum, Hell- und Dunkelmodus über Tailwind-Klassen wie im Profil
  - `Listen.tsx`: Tabellen für die letzten Konten (Avatar, Name, registriert, zuletzt gesehen, bestätigt, Partien) und die letzten Partien (Name, Modus, Status, Runde, Menschen/KI, aktualisiert). Datumsformat aus `sections/profil/components/format.ts`.
- `apps/web/src/shell/UserMenu.tsx`: optionale Prop `onOpenAdmin`. Der Eintrag „Verwaltung“ (Icon `BarChart3`) erscheint nur, wenn die Prop gesetzt ist. `AppShell`, `MenuLayout` und `GameLayout` setzen sie nur bei `user.isAdmin`. `useCurrentUser` bzw. `ShellUser` bekommt `isAdmin` durchgereicht.

## Task 5: Datenschutzerklärung

- `apps/web/src/pages/rechtliches/DatenschutzPage.tsx`: Satz ergänzen, dass Betreiber zusammengefasste Nutzungszahlen sowie Anzeigenamen, Registrierungs- und Aktivitätszeitpunkte in einer internen Übersicht einsehen und dafür keine weiteren Daten erhoben werden.

## Task 6: Tests

- Neu `apps/server/src/admin/admin.test.ts` (Muster `profile/profile.test.ts`, `TEST_DATABASE_URL`, `loginAs`):
  - 401 ohne Sitzung, 403 für LENA, 200 für BJOERN mit `ADMIN_EMAILS=bjoern@dominion.test`
  - Dev-Konten und Demo werden herausgerechnet. Dafür ein Konto `x@example.org` und eine Partie anlegen, die Zähler prüfen.
  - Die Tagesreihe hat für 7, 30 und 90 Tage genau `range` Einträge, ungültiges `range` → 422.
  - Die Antwort enthält nirgends `@`: `JSON.stringify(body)` gegen die E-Mail-Adressen prüfen.
- `/api/me` liefert `isAdmin` (bestehende Auth-Tests anpassen, falls dort Objekte exakt verglichen werden).
- Web: `AdminPage.test.tsx` (Kacheln rendern, Zeitraumwechsel lädt neu, Nicht-Admin sieht 404) und ein UserMenu-Test für den Eintrag nur bei `onOpenAdmin`.

## Task 7: Roadmap

- `agent-os/product/roadmap.md`: Eintrag „Nutzungsübersicht für Admins“ als umgesetzt mit Spec-Verweis, im Stil der übrigen Einträge.

## Referenzen

- Auth/preHandler: `apps/server/src/session.ts` (`requireAuth`, `notAuthenticated`)
- Route-Muster: `apps/server/src/routes/profile.ts`, `routes/dev.ts`; Verdrahtung `apps/server/src/app.ts:171-177`
- SQL-Muster: `apps/server/src/profile/service.ts`
- Seite/States: `apps/web/src/pages/profil/ProfilePage.tsx`, `PageState`
- UI-Bausteine: `apps/web/src/sections/profil/components/ui.tsx` (`Segmented`, `Avatar`), `format.ts`
- Menü: `apps/web/src/shell/UserMenu.tsx`, `layouts/MenuLayout.tsx`
- Testdaten: `apps/server/src/auth/devAccounts.ts` (`@dominion.test`), `DEMO_MATCH_ID` in `matches/service.ts`

## Verifikation

- Typecheck je Paket (`pnpm --filter @dos/shared typecheck`, dann server, dann web; laut Memory nicht `-r`)
- `pnpm --filter server test` mit `TEST_DATABASE_URL`, `pnpm --filter web test`
- Lokal mit `docker compose up`: als Björn anmelden, im Benutzermenü „Verwaltung“ öffnen und 7/30/90 umschalten. Als Lena anmelden: Kein Menüeintrag, `/admin` zeigt 404, `curl /api/admin/stats` liefert 403.
- Mit dem Browser-Netzwerk-Tab prüfen, dass die Stats-Antwort keine E-Mail-Adressen enthält.
