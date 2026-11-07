# Konten, Profil und Freunde (Roadmap Phase 2, Punkte 1–3)

## Context

Aus der Roadmap (Phase 2, „Noch offen“) sollen drei Punkte umgesetzt werden, „Inhalte“ (Illustrationen) entfällt:

1. **Konten:** Anzeigenamen werden nicht moderiert. Es gibt keine Sperrliste und keine reservierten Namen. Die Längenprüfung steht doppelt in `validateRegistration` (`packages/shared/src/account/index.ts:74`) und `validateDisplayName` (`packages/shared/src/profile/index.ts:137`).
2. **Profil:**
   - `getProfile` (`apps/server/src/profile/service.ts:229`) lädt bei jedem Aufruf die Teilnehmer aller Partien des Spielers aus dem jsonb-Spielstand. Bilanz und Verlauf rechnet es in JS, die Seiten schneidet es im Speicher zu.
   - Die Filter (Ergebnis, Fraktion) wirken nur auf schon geladene Einträge (`Profil.tsx:133`). „Mehr anzeigen“ verschwindet, wenn der Filter alles Geladene ausblendet.
   - Öffentliche Profile und Abzeichen fehlen.
3. **Freunde:**
   - Freundschaft entsteht sofort und in beide Richtungen (`addFriendByName`, `apps/server/src/auth/accounts.ts:335`).
   - Entfernen ist nicht möglich, und das Web hat außer dem Picker im Setup keine Freundes-Oberfläche.

**Entscheidungen aus der Rückfrage:**
- Moderation über eine feste Liste im Code.
- Das öffentliche Profil zeigt Bilanz, Fraktionen, Partieverlauf, Abzeichen und einen Knopf „Freund hinzufügen“.
- Etwa 12 Abzeichen, mit Benachrichtigung beim Erreichen.
- Eine eigene Seite `/freunde` mit Anfragen.

## Task 1: Spec-Dokumentation speichern

Unter `agent-os/specs/2026-11-07-HHMM-profil-freunde-moderation/` (Uhrzeit beim Anlegen) liegen `plan.md`, `shape.md` (Umfang, Entscheidungen), `standards.md` (Projektregeln: Typecheck je Paket, `LocalizedError`/`sendError`, i18n mit de+en, Wächtertest, Prettier, NEWS 0.11.0, Push nur nach Rückfrage) und `references.md`. Commit.

## Task 2: Namensmoderation (Punkt 1)

- `packages/shared/src/account/names.ts` (neu):
  - `normalizeName()` macht Kleinbuchstaben, löst Umlaute und ß auf, ersetzt Leetspeak (0→o, 1/!→i, 3→e, 4/@→a, 5/$→s, 7→t) und streicht Trennzeichen.
  - `RESERVED_NAMES` muss als ganzer Name passen: admin, administrator, moderator, mod, system, support, dominion, dominionofsteam, ki, ai, server, root, gast, guest sowie die Namen der KI-Kommandanten (aus `AI_PERSONALITIES`).
  - `BLOCKED_PARTS` sind Teilwörter (Beleidigungen und Nazi-Begriffe, DE und EN, etwa 40 Einträge), mit einer Ausnahmeliste gegen Fehltreffer.
  - `nameProblem(name): Message | null` liefert Schlüssel `account.nameReserved` / `account.nameBlocked`.
- `validateDisplayName` prüft Länge plus `nameProblem`, und `validateRegistration` nutzt `validateDisplayName`. Damit verschwindet die doppelte Längenprüfung.
- Server: Registrierung (`routes/auth.ts`) und Namensänderung (`profile/service.ts` `updateDisplayName`) bekommen die Prüfung automatisch über die gemeinsamen Funktionen. Dev-Konten bleiben ungeprüft.
- Bestehende Namen bleiben unangetastet.
- Texte kommen nach `i18n/{de,en}/account.json`.
- Tests:
  - shared: Treffer, Normalisierung, Fehltreffer wie „Kassel“
  - Server: Registrierung und Umbenennung lehnen ab
  - Web: Fehlermeldung im Registrierungsformular

Commit.

## Task 3: Ergebnisse vorberechnen (Grundlage für Punkt 2)

**Neue Tabelle `player_results`** (Migration `0011_ergebnisse.sql`):
- Schlüssel ist (playerId, matchId), mit Index (playerId, endedAt desc, matchId).
- Spalten:
  - `result` (victory/defeat/surrendered), `placement`, `playerCount`, `rounds`, `endedAt`, `factionId`
  - `citiesCaptured`, `unitsBuilt`
  - `victoryCondition`, `endReason`, `beatHardAi` (bool)
  - `opponents` jsonb `[{ id: string|null, name, isAI }]`
  - `matchName`

**Schreiben:**
- `recordResults(tx, state)` in `apps/server/src/profile/results.ts` (neu) baut die Zeilen aus `GameState` mit der bisherigen Logik von `playedMatch()` (`profile/service.ts:107`). Diese Logik wandert dorthin.
- Aufgerufen wird es, wenn eine Partie endet und wenn ein Spieler aufgibt. Die Stellen beim Speichern des Spielstands sind in `matches/repository.ts` bzw. im Match-Service und im Surrender-Pfad von `lobby/service.ts` zu finden; Tutorial-Partien zählen nicht.
- Das Schreiben ist idempotent (`onConflictDoUpdate`).

**Nachtrag beim Serverstart** (wie die Avatar-Umrechnung): Beendete Partien und Aufgaben ohne Zeilen werden einmal nachgetragen.

**`getProfile(viewerId, playerId, { cursor, limit, result, faction })` liest nur noch aus `player_results`:**
- Bilanz und Fraktionswerte per SQL-Aggregat.
- Verlauf per Keyset-Pagination (`endedAt`, `matchId`) mit Filtern in SQL.
- Der Cursor behält sein Format.

**Typen:**
- `HistoryEntry.opponents` wird zu `{ id: string | null; name: string; isAI: boolean }[]`, damit Gegner verlinkbar sind.
- `ProfileData` bekommt `badges` und `isOwn`; bei fremden Profilen kommt die Freundschaftslage dazu.

**Tests:** `profile.test.ts` mit denselben Erwartungen wie bisher, dazu Filter-Pagination und Nachtrag.

Commit.

## Task 4: Abzeichen und Filter auf dem Server (Punkt 2)

**Abzeichen** in `packages/shared/src/profile/badges.ts` (neu): Katalog mit `id`, Symbol (lucide-Name) und Regel über die Bilanz (aggregiert aus `player_results` plus `tutorialCompletedAt`).
- **Die 12 Abzeichen:**
  - erster Sieg
  - 10 und 50 Siege
  - Sieg mit jeder der vier Fraktionen
  - Tutorial abgeschlossen
  - 100 eroberte Städte
  - 500 gebaute Einheiten
  - Sieg durch Vorherrschaft
  - Sieg durch Hauptstädte
  - Partie über 150 Runden
  - Sieg gegen eine KI auf „schwer“
  - Sieg mit 4 oder mehr Teilnehmern
- Texte in `i18n/{de,en}/badges.json`.

**Neue Tabelle `player_badges`** (playerId, badgeId, earnedAt) in derselben Migration oder als `0012`:
- Nach `recordResults` prüft `awardBadges(tx, playerId)` neue Abzeichen, speichert sie und reiht eine Benachrichtigung ein: neue `NotificationKind` `badge`, neues `NotificationEvent` `achievement` (Push an, E-Mail aus).
- Das neue Event braucht Einträge in beiden `NotificationEvent`-Definitionen (`packages/shared/src/notifications/index.ts:4`, `profile/types.ts:63`), in `NOTIFICATION_EVENTS`, den Defaults, `EVENT_OF` (`notifications/service.ts:27`), `notify.json` und der Einstellungen-Tabelle (`Einstellungen.tsx` `EVENTS`).
- Der Nachtrag beim Serverstart vergibt Abzeichen ohne Benachrichtigung.

**Web:**
- `useProfile(playerId?, filters)` (`apps/web/src/data/profile.ts:19`) gibt Filter als Query-Parameter mit. Der Query-Key enthält die Filter, und `Profil.tsx` filtert nicht mehr selbst.
- „Mehr anzeigen“ hängt nur noch an `hasMoreHistory`.
- Die Abzeichen erscheinen als Abschnitt im Profil (erreicht farbig, offene grau mit Hinweis).

Tests für Server (Vergabe, Benachrichtigung einmalig) und Web. Commit.

## Task 5: Öffentliche Profile (Punkt 2)

- Server: `GET /api/players/:id/profile` (angemeldet; 404 für gelöschte oder unbekannte Konten) nutzt dasselbe `getProfile`. Die E-Mail-Adresse wird nicht ausgeliefert.
- Web:
  - Route `/spieler/:playerId` (`routes.ts`, `router.tsx`) zeigt `Profil` ohne Bearbeiten, aber mit „Freund hinzufügen“ / „Anfrage gesendet“ / „Befreundet“ (aus Task 6).
  - Die eigene id leitet auf `/profil` um.
- **Verlinkte Namen** über eine kleine `PlayerLink`-Komponente, nur für Menschen mit id:
  - Gegner im Verlauf
  - Teilnehmer in Lobby-Detailsheet und Warteraum
  - Rangliste im Partieabschluss
  - Freundesliste
- Texte in `profile.json`. Tests für Server (fremdes Profil, 404) und Web (Profil öffnen über Verlauf).

Commit.

## Task 6: Freunde mit Anfragen (Punkt 3)

**Neue Tabelle `friend_requests`** (fromId, toId, createdAt; PK aus beiden; cascade):
- Schicken B und A sich gegenseitig eine Anfrage, nimmt die zweite Anfrage die erste an.

**Server** in `apps/server/src/friends/service.ts` (neu; die Freundesfunktionen ziehen aus `accounts.ts` dorthin):
- `GET /api/friends` liefert `{ friends, incoming, outgoing }` mit Anwesenheit (`presenceOf`).
- `POST /api/friends/requests` nimmt `{ playerId }` oder `{ name }`.
- `POST /api/friends/requests/:id/accept` und `/decline`.
- `DELETE /api/friends/requests/:id` zieht eine Anfrage zurück.
- `DELETE /api/friends/:id` entfernt einen Freund in beide Richtungen.
- Fehler: `PLAYER_NOT_FOUND`, `CANNOT_FRIEND_SELF`, `ALREADY_FRIENDS`, `REQUEST_EXISTS`.
- Anfragen und Annahmen schicken ein Signal an beide Spieler. Neues `SignalTopic` `friends` in `packages/shared/src/realtime/index.ts:10`; `signal()` steht in `apps/server/src/realtime/signals.ts:20`.
- Benachrichtigungen:
  - Kind `friendRequest` bei Anfrage, Kind `friendAccepted` bei Annahme.
  - Beide hängen am neuen Event `friends` (Push an, E-Mail aus).
  - Texte in `notify.json`.
- Der alte `POST /api/friends` mit `{name}` entfällt (das Web nutzt ihn nicht). `addFriend` bleibt intern für die Dev-Konten.

**Web:**
- Seite `/freunde` (`pages/freunde/FriendsPage.tsx`, Bereich `sections/freunde/`) im Stil der Lobby:
  - Suchfeld nach Name mit „Anfrage senden“.
  - Eingehende Anfragen mit Annehmen und Ablehnen.
  - Ausgehende Anfragen mit Zurückziehen.
  - Freundesliste mit Anwesenheit, Profil-Link und Entfernen (mit Rückfrage).
- Navigationspunkt „Freunde“ in `MenuLayout.tsx` mit Zähler für eingehende Anfragen.
- `data/friends.ts` mit React Query und Realtime-Thema `friends` (Muster aus `data/lobby.ts`, `data/events.ts`).
- Im Partie-Setup zeigt der `FriendPicker` einen Link „Freunde verwalten“, wenn die Liste leer ist.

**Tests:**
- Server: Anfrage, gegenseitige Anfrage, Annehmen, Ablehnen, Zurückziehen, Entfernen, Benachrichtigung, Signal.
- Web: Seite und Navigationszähler.
- Englischer Rauchtest erweitert.

Commit.

## Task 7: Abschluss

- **Roadmap** (`agent-os/product/roadmap.md`):
  - Punkt „Inhalte“ streichen.
  - Konten, Profil und Freunde als umgesetzt eintragen, mit Spec-Verweis.
  - Die Profil-Punkte „Filter serverseitig“ und „Bilanz vorberechnen“ ebenfalls als erledigt markieren.
- **NEWS 0.11.0:** Items (de+en) für Freunde, öffentliche Profile und Abzeichen, Datum offen.
- **Datenschutzerklärung (de+en):**
  - Freundschaftsanfragen erwähnen.
  - Erwähnen, dass Bilanz, Verlauf und Abzeichen für angemeldete Mitspieler sichtbar sind.
  - Stand aktualisieren.
- Prettier, Typecheck je Paket, alle Tests. Commit, Push nur nach Rückfrage.

## Kritische Dateien

- `packages/shared/src/account/{index,names}.ts`, `packages/shared/src/profile/{index,types,badges}.ts`, `packages/shared/src/notifications/index.ts`, `packages/shared/src/realtime/index.ts`, `packages/shared/src/i18n/{de,en}/*.json`
- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0011_*`, `apps/server/src/profile/{service,results}.ts`, `apps/server/src/friends/service.ts`, `apps/server/src/routes/{profile,auth}.ts`, `apps/server/src/notifications/{service,events}.ts`, `apps/server/src/index.ts` (Nachtrag beim Start)
- `apps/web/src/data/{profile,friends}.ts`, `apps/web/src/pages/profil/ProfilePage.tsx`, `apps/web/src/sections/profil/components/Profil.tsx`, `apps/web/src/pages/freunde/*`, `apps/web/src/layouts/MenuLayout.tsx`, `apps/web/src/router.tsx`, `apps/web/src/routes.ts`

## Verification

- Je Etappe Typecheck je Paket einzeln (shared, sim, server, web), dazu `pnpm vitest run` in allen vier Paketen und `npx prettier --check .`.
- Mit `pnpm dev` und den Dev-Konten (Björn und Mitspieler):
  - Einen gesperrten Namen bei der Registrierung und bei der Umbenennung versuchen.
  - Eine Partie beenden: Bilanz, Verlauf mit Filter über mehrere Seiten und das Abzeichen samt Benachrichtigung prüfen.
  - Ein fremdes Profil über einen Gegnernamen öffnen.
  - Eine Freundschaftsanfrage zwischen zwei Browsern schicken: Zähler in der Navigation, Annehmen, Entfernen.
  - Das Ganze auf Englisch wiederholen.
