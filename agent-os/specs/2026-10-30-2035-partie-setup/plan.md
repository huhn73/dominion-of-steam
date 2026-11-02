# Spec: Partie-Setup & KI-Gegner (Meilenstein 04)

## Kontext
Der Assistent „Neue Partie“ (`PartieSetup` aus der Design-Übergabe) führt in fünf Schritten durch Regeln, eigene Fraktion, Gegner und Mitspieler, Karte und Übersicht. Bisher gab es nur einen Platzhalter unter `/neue-partie` und eine Dev-Leiste für Solo-Partien. Mit diesem Meilenstein entstehen echte, dauerhaft gespeicherte Partien mit Regeln, KI-Persönlichkeiten, Einladungen und Einladungslink. Meilenstein 05 (Lobby & Warteraum) baut auf dem Datenmodell der wartenden Partien auf.

## Aufgaben
1. **Spec-Dokumentation speichern** (dieser Ordner)
2. **Stammdaten in `packages/shared/src/setup/`:** KI-Persönlichkeiten (`AI_PERSONALITIES`), Optionen (`SETUP_OPTIONS`), Fraktionen in der Form des Assistenten (`SETUP_FACTIONS`), Startentwurf (`defaultDraft`), Beschriftungen für 05 (`turnLimitLabel`, `victoryConditionLabel`); `setup.ts` und die Datentypen unverändert aus der Übergabe; Prüfung `validateDraft`; API-Typen
3. **Engine:**
   - `GameState.rules` (Modus, Frist/Zeitlimit, Siegbedingung, Rundenlimit, Fraktionsregel); `createMatch` nimmt `rules` und Teilnehmer mit `aiPersonalityId`
   - Frist pro Zug aus der Regel (asynchron Stunden, live Minuten oder keine)
   - Siegbedingungen „Alle Gegner besiegen“, „Hauptstädte erobern“, „Rundenlimit“ (`victory.ts`); `winnerId`, `endedAt`, Platzierung je Teilnehmer, Zähler `citiesCaptured` und `unitsBuilt`
   - KI-Profil aus Schwierigkeit und Spielweise der Persönlichkeit (`aiProfile`)
   - `normalizeState` für gespeicherte Zustände älterer Versionen
4. **Server (Migration `0002_partie_setup`):**
   - `matches`: Status `waiting`, `state` darf leer sein, `host_id`, `setup`, `invite_token`, `ended_at`
   - Tabellen `match_seats`, `invitations`, `setup_reservations`
   - `GET /api/setup`, `POST /api/matches`, `GET /api/matches/:id/room`; Sicht einer wartenden Partie: 409 `MATCH_WAITING`
   - Start sofort oder Warten, Auffüllen mit KI (`launchMatch`, auch für 05)
   - Dev-Solo-Partien über denselben Code
5. **Web:** Komponenten unverändert in `apps/web/src/sections/partie-setup/components/` (`setup.ts` als Re-Export), Seite `/neue-partie` mit Lade-, Fehler- und Erfolgszuständen, Toasts, Teilen/Kopieren, vorläufiger Warteraum `/warteraum/:matchId`, Weiterleitung vom Spielfeld einer wartenden Partie
6. **Tests:** Engine (Regeln, Fristen, Siegbedingungen, Platzierung, Zähler, KI-Profil), Prüfung des Entwurfs, Server mit Datenbank (Setup-Daten, Solo-Start, wartende Partie mit Einladung, Fehlermeldungen, gleicher Seed, Start mit Auffüllen), Web (Ablauf 1 und 2, Blocker, Fraktionssperre im KI-Dialog, Serverfehler, Teilen, Kartencode, Abbrechen)
7. **Prüfen:** Docker neu bauen, Abläufe mit curl, Screenshots hell, dunkel, Smartphone
