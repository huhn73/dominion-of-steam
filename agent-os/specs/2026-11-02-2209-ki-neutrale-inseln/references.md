# Referenzen für KI erobert neutrale Inseln

### KI-Logik

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`planTransport`, `planCargo`, `planWarship`, `chooseProduction`, `overseasCities`, `shoreTiles`, `landmasses`, `planUnit` Schritt 2a)
- **Bezug:** Zielwahl, Landung, Erkundung und Produktion der Frachter und Kriegsschiffe

### Vorherrschaft

- **Ort:** `packages/shared/src/game/engine/victory.ts` (`dominanceShare`, `updateDominance`), `packages/shared/src/game/rules.ts` (`DOMINANCE_SHARE`)
- **Bezug:** Schwelle je Weltform und Zustand `dominance`, den die KI auswertet

### Simulation

- **Ort:** `packages/sim/src/collector.ts`, `aggregate.ts`, `report.ts`, `config.ts` (`PROFILE_KEYS`), `configs/inseln-vorherrschaft.json`, `configs/sweep-transporte-*.json`
- **Bezug:** neue Kennzahlen, Messung und Raster

### Frühere Specs

- `agent-os/specs/2026-11-01-1430-ki-verhalten-2/` (Frachter und Landungen)
- `agent-os/specs/2026-11-01-2015-inselbalance-tarnung/` (Geleit, Frachterzahl)
- `agent-os/specs/2026-11-02-1952-enden-inselwelten/` (Vorherrschaft, Kapitulation)
