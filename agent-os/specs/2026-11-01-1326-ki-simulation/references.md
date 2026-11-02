# Referenzen für KI-Simulation und Parameter-Sweep

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`aiProfile`, `AiTurnOptions`, `playAITurn`, `chooseProduction`, `planUnit`), `packages/shared/src/setup/data.ts` (`AI_PERSONALITIES`, `aiPersonality`)
- **Bezug:** Profilfelder, Stufenverzweigungen, Hooks für Override und Befehlsmeldung.

### Engine

- **Ort:** `packages/shared/src/game/engine/create.ts` (`createMatch`, `NewMatch`), `turn.ts` (`endTurn`, `startTurn`), `commands.ts` (`CommandOutcome`), `victory.ts` (`score`, `checkVictory`, `finishMatch`), `mapgen.ts` (`MapSettings`), `state.ts` (`defaultRules`, `random`), `game/types.ts` (`CombatResult`), `game/catalog.ts` (`FACTIONS`, `MAP_SIZES`)
- **Bezug:** Partie anlegen, Zugschleife, Spielende, Kennzahlenquellen.

### Vorhandene Simulation

- **Ort:** `packages/shared/src/game/engine/__tests__/ai.test.ts` („Simulation KI gegen KI“)
- **Bezug:** Vorlage der Schleife; bleibt als Regressionstest bestehen.

### Simulationspaket

- **Ort:** `packages/sim/src/` (`config.ts`, `jobs.ts`, `sweep.ts`, `collector.ts`, `game.ts`, `stats.ts`, `aggregate.ts`, `report.ts`, `output.ts`, `pool.ts`, `worker.ts`, `cli.ts`), `packages/sim/configs/`, Tests in `packages/sim/src/__tests__/`
- **Bezug:** Werkzeug dieser Spec.

### Paketvorlage

- **Ort:** `apps/server/package.json`, `apps/server/tsconfig.json`
- **Bezug:** tsx, `@types/node`, Workspace-Abhängigkeit auf `@dos/shared`.

### Produktdokumente

- **Ort:** `agent-os/product/playtest-runde-1.md` (frühere 100-Partien-Simulation), `playtest-runde-2.md` (Punkt 7, Zugdauer), `roadmap.md`, `agent-os/product/ki-simulation/` (Berichte), `agent-os/product/ki-balance.md` (Befunde und Maßnahmen)
- **Bezug:** Herkunft und Ablage der Auswertung.
