# Hinweise für Copilot-Reviews

Dominion of Steam ist ein rundenbasiertes Strategiespiel im Browser. pnpm-Monorepo mit `apps/web` (React, Vite, Tailwind CSS v4), `apps/server` (Fastify, Drizzle, PostgreSQL), `packages/shared` (Typen, Regel-Engine, KI, Setup-Regeln) und `packages/sim` (Headless-Simulation KI gegen KI). Architektur und Regeln im Detail: `docs/ENTWICKLUNG.md`.

## Sprache

- Review-Kommentare auf Deutsch.
- Texte in der Oberfläche, in E-Mails und in Spielereignissen auf Deutsch, mit typografischen Anführungszeichen („…“). Code-Kommentare und Bezeichner auf Englisch.

## Worauf besonders achten

- **Determinismus der Engine** (`packages/shared/src/game/engine/`): kein `Math.random`, Zufall nur über `random(state)`. Zeit kommt als Parameter `now` herein; die Wanduhr ist nur für das Zeitbudget der KI erlaubt, das der Server setzt. Gleicher Kartencode muss dieselbe Welt ergeben (goldene Hashes in den Tests).
- **Kriegsnebel:** Was `projectView` und Ereignisse (`addEvent`) einem Teilnehmer liefern, darf keine Einheiten, Städte, Koordinaten oder Bewegungen verraten, die er nicht sieht. Ereignisse über andere Spieler liegen auf einer eigenen Stadt des Empfängers.
- **Gespeicherte Spielstände:** Neue Felder in `GameState` oder `ParticipantState` brauchen einen Standardwert in `normalizeState`, sonst brechen laufende Partien. Änderungen am Datenbankschema nur über Migrationen in `apps/server/drizzle/`.
- **Eine Quelle für Regeln:** Werte wie Kampfwerte, Kartengrößen oder Schwellen stehen in `packages/shared` (`game/rules.ts`, `game/mapSizes.ts`, `setup/data.ts`); Web, Server und Simulation lesen sie von dort, keine Kopien.
- **Server:** Eingaben prüfen (Setup über `validateDraft`), Rechte des angemeldeten Spielers prüfen, keine Daten fremder Konten ausliefern (E-Mail-Adressen nie an Mitspieler). Rate-Limits auf Konto-Endpunkten erhalten.
- **Abfragen im Web:** Komponenten über dem Router dürfen keine spielerbezogenen Queries abonnieren, weil An- und Abmelden den Query-Cache leeren.
- **Barrierefreiheit:** Bedienelemente mit Rolle und Namen (Tests suchen per `getByRole`), Touch-Ziele mindestens 44 px (`min-h-11`), helles und dunkles Farbschema.
- **Tests:** Neue Regeln und Fehlerbehebungen brauchen Tests (Vitest; Engine-Tests in `packages/shared/src/game/engine/__tests__/`). Hinweisen, wenn ein Test nur den Ist-Zustand festschreibt, statt das Verhalten zu prüfen.

## Was nicht ins Repository gehört

- Persönliche Daten: Name, Anschrift und E-Mail des Anbieters kommen aus Build-Variablen (`VITE_ANBIETER_*`), keine echten Adressen in Code, Tests oder Screenshots.
- Zugangsdaten, `.env`-Dateien, Server-Details (IP, Hoster-Zugänge, Heimnetz).
- Verweise auf kommerzielle Spiele als Vorbild in Code, Specs oder Doku.
- Illustrationen und Audio sind von der MIT-Lizenz ausgenommen (`LICENSE`); neue Soundeffekte nur mit Quelle in `public/audio/credits.json`.

## Nicht kommentieren

- Formatierung: Prettier (`pnpm lint`) entscheidet, die Zeilenbreite ist 100.
- Dateien aus der Design-Übergabe (Liste in `.prettierignore`, etwa `apps/web/src/sections/*/components/`) sind bewusst nicht formatiert und behalten ihren Stil; lange Zeilen dort nicht bemängeln.
- Specs und Messberichte unter `agent-os/` sind Dokumentation, kein Code.
