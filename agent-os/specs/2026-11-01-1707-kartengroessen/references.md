# Referenzen für Kartengrößen

### Stufen und Setup

- **Ort:** `packages/shared/src/game/mapSizes.ts`, `setup/data.ts` (`SETUP_OPTIONS`, `roundLimitLabel`), `setup/types.ts`, `setup/validate.ts`, `apps/server/src/setup/service.ts` (`engineMap`, `createSolo`), `apps/server/src/lobby/service.ts` (`mapInfo`), `apps/web/src/sections/partie-setup/components/StepMap.tsx`, `StepRules.tsx`, `StepSummary.tsx`, `apps/web/src/pages/lobby/DevBar.tsx`
- **Bezug:** eine Definition, Rundenlimit `null`, Labels für Altpartien.

### Kompakte Daten

- **Ort:** `packages/shared/src/game/bits.ts`, `mapcodec.ts`, `types.ts` (`GameMap`), `engine/state.ts` (`normalizeState`), `engine/visibility.ts`, `engine/view.ts` (`projectBoard`), `engine/movement.ts` (`knowledge`, `logAction`), `engine/turn.ts` (`pruneHistory`), `engine/minimap.ts`, `engine/demo.ts`, `engine/create.ts`
- **Bezug:** Zeichenketten je Feld, Bitset je Teilnehmer, Migration, Sicht.

### Wegsuche und KI

- **Ort:** `packages/shared/src/game/hex.ts` (`buildIndex`, `findPath`, `PathBudget`, `tilesNear`, `frontierNear`), `engine/ai.ts` (Arbeitsbudget, `deadline`, Kandidaten), `engine/explore.ts`, `apps/server/src/matches/service.ts` (`runAITurns`, `AI_TURN_BUDGET_MS`)
- **Bezug:** gedeckelte Suchen, deterministisches Budget, Wanduhr-Ventil.

### Generator

- **Ort:** `packages/shared/src/game/engine/mapgen.ts` (`generateWorld`, `generatedCityNames`, `LAND_TILES_PER_CITY`)
- **Bezug:** typisierte Arrays, Stadtdichte, Namen.

### Darstellung

- **Ort:** `apps/web/src/sections/spielfeld/components/` (`camera.ts`, `cameraStore.ts`, `terrainChunks.ts`, `TerrainCanvas.tsx`, `HexMap.tsx`, `MiniMap.tsx`, `Spielfeld.tsx`), `apps/web/src/audio/ambience.ts`
- **Bezug:** Canvas-Kacheln, Culling, Kamera-Store, Minikarte.

### Server

- **Ort:** `apps/server/src/app.ts` (`@fastify/compress`), `apps/server/src/matches/command.ts` (`isCoord`)
- **Bezug:** Komprimierung, Koordinatengrenzen.

### Tests

- **Ort:** `packages/shared/src/game/__tests__/bits.test.ts`, `mapcodec.test.ts`, `engine/__tests__/kartengroessen.test.ts` (Stufen, Generator je Stufe, Migration, Imperium-KI, Verlauf), `mapgen.test.ts`, `apps/server/src/setup/setup.test.ts`, `lobby/lobby.test.ts`, `packages/sim/src/__tests__/jobs.test.ts`, Web-Tests in `sections/spielfeld` und `pages/partie-setup`
- **Bezug:** Muster und Budgets.
