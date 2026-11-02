# Referenzen für Partie-Setup & KI-Gegner

### Design-Übergabe

- **Ort:** `product-plan/sections/partie-setup-and-ki-gegner/` (README, `components/`, `types.ts`, `sample-data.json`, `tests.md`, `screenshot.png`), `product-plan/instructions/incremental/04-partie-setup-and-ki-gegner.md`
- **Bezug:** Komponenten, Datentypen, Stammdaten (Persönlichkeiten, Optionen), Abläufe und Hinweise zur Umsetzung

### Art-Brief

- **Ort:** `product-plan/briefs/art-brief.md` (Abschnitt „KI-Persönlichkeiten“)
- **Bezug:** Porträts `public/art/portraits/<id>.webp` (noch nicht vorhanden, Initialen als Ersatz)

### Lobby & Multiplayer (05)

- **Ort:** `product-plan/instructions/incremental/05-lobby-and-multiplayer.md`, `product-plan/sections/lobby-and-multiplayer/types.ts`
- **Bezug:** `WaitingRoom`/`WaitingSeat`, `Invitation`, `OpenMatch`, `FinishedMatch` (Platzierung, Ergebnis) als Ziel des Datenmodells

### Bisherige Specs

- **Ort:** `agent-os/specs/2026-10-30-1732-spielfeld-engine/`, `2026-10-30-1917-ki-und-kartengenerator/`, `2026-10-30-2030-konten-und-anmeldung/`
- **Bezug:** `createMatch`, `generateWorld`, `randomSeed`, `playAITurn`, `endTurn`; Konten, Freunde und Anwesenheit; Spieler-ID = Teilnehmer-ID

### Code

- **Ort:** `packages/shared/src/game/engine/`, `apps/server/src/matches/`, `apps/server/src/auth/accounts.ts`, `apps/web/src/sections/fraktionen/types.ts`
- **Bezug:** Engine, Partie-Service, Freundesliste, Muster für Abschnitts-Typen (Datentypen aus `shared`, Props unverändert)
