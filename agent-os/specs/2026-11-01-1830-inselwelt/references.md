# Referenzen für Echte Inselwelt

### Generator

- **Ort:** `packages/shared/src/game/engine/mapgen.ts` (`generateWorld`, `islandLayout`, `islandCapitals`, `continentCapitals`, `landmasses`, `islandTargets`, `ISLAND_PARAMS`, `nearestTwo`, `valueNoise`), `engine/rng.ts` (`createRng`, `shuffle`, `hashString`), `game/hex.ts` (`neighbors`, `hexDistance`, `tilesNear`), `game/mapcodec.ts` (Codes, `isWaterCode`)
- **Bezug:** Höhenkarte, Band, Rangschwelle, Hauptstadt- und Städtewahl.

### Weltform

- **Ort:** `packages/shared/src/game/worldShapes.ts`, `game/index.ts`
- **Bezug:** eine Quelle für Ids, Labels, Beschreibungen, Vorgabe.

### Setup und Server

- **Ort:** `packages/shared/src/setup/types.ts` (`MapSettings.worldShape`, `SetupOptions.worldShapes`), `setup/data.ts` (`SETUP_OPTIONS`, `DEFAULT_PRESET`), `setup/validate.ts`, `apps/server/src/setup/service.ts` (`engineMap`, `lastPreset`, `createSolo`), `apps/server/src/lobby/service.ts` (`mapInfo`), `packages/shared/src/lobby/types.ts` (`MatchMapInfo.worldShape`), `apps/server/src/routes/dev.ts`
- **Bezug:** Durchreichung mit Vorgabe Kontinent.

### Oberfläche

- **Ort:** `apps/web/src/sections/partie-setup/components/StepMap.tsx`, `StepSummary.tsx`, `apps/web/src/sections/lobby/components/Warteraum.tsx`, `MatchDialogs.tsx`, `apps/web/src/pages/lobby/DevBar.tsx`, `apps/web/src/data/match.ts`
- **Bezug:** Auswahl, Hinweise, Anzeige.

### Simulation

- **Ort:** `packages/sim/src/config.ts` (`MapConfig.worldShape`), `jobs.ts` (`mapSettings`, `mapId`), `report.ts`, `mapstats.ts` und `cli.ts` (`pnpm sim maps`), Configs `inselwelt.json`, `archipel.json`, `inseln.json`, `inseln-ohne.json`
- **Bezug:** Vermessung und Nachmessung der KI auf Inseln.

### Tests

- **Ort:** `packages/shared/src/game/engine/__tests__/inselwelt.test.ts` (goldene Hashes, Garantien), `mapgen.test.ts`, `kartengroessen.test.ts`, `setup/__tests__/validate.test.ts`, `apps/web/src/pages/partie-setup/PartieSetup.test.tsx`, `packages/sim/src/__tests__/config.test.ts`
- **Bezug:** Muster und Erwartungen.

### Vorgänger

- **Ort:** `agent-os/specs/2026-11-01-1707-kartengroessen/` (Stufen, kompaktes Format, Nachtrag Hauptstädte und Landanteil), `agent-os/product/ki-balance.md` (Inselserien der KI)
- **Bezug:** Ausgangslage und Messwerte vorher.
