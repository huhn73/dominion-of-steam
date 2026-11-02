# Referenzen für KI-Verhalten, zweiter Block

### Befunde und Vorgänger

- **Ort:** `agent-os/product/ki-balance.md`, `agent-os/specs/2026-11-01-1358-ki-regeln/`, `agent-os/specs/2026-11-01-1326-ki-simulation/`
- **Bezug:** Vorher-Werte, Zielwerte, Werkzeug.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`aiProfile`, `landmasses`, `siegePaysOff`, `planTransport`, `planCargo`, `planUnit`, `chooseProduction`)
- **Bezug:** alle Bausteine dieser Spec.

### Engine: Transport und Ladung

- **Ort:** `engine/commands.ts` (`move` ruft `boardIfPossible`, `unload`), `engine/movement.ts` (`boardIfPossible`: nur auf Wasser, Bewegung 0; `walk` mit `detach`), `engine/turn.ts` (`advance` ohne Einstieg), `game/hex.ts` (`transportAt`, `canEnter`: Wasserfeld nur als letzter Schritt mit Transporter, `reachableTiles` von Bord), `engine/combat.ts` (`destroyUnit` mit Ladung), `engine/state.ts` (`placeUnit`)
- **Bezug:** Einsteigen, Mitfahren, Anlanden, Verlust der Ladung.

### Engine: Flugzeuge

- **Ort:** `engine/explore.ts` (`exploreTurn`), `engine/commands.ts` (`explore`, `patrol`), `engine/turn.ts` (`crashAircraft`, Tanken in `startTurn`), `game/fuel.ts` (`airBases`, `returnDistance`, `canReturn`), `game/rules.ts` (`canAttack`), `game/hex.ts` (`attackTargets`: Städte nur mit `canCaptureCities`)
- **Bezug:** Aufklärung, Treibstoffschutz, Angriffsregeln.

### Kartengenerator

- **Ort:** `engine/mapgen.ts` (`generateWorld`, `massOf` lokal)
- **Bezug:** Landmassen; Messung mit 30 Seeds je Landanteil (siehe `shape.md`).

### Simulation

- **Ort:** `packages/sim/src/config.ts` (`PROFILE_KEYS`), Configs `stufen.json`, `fraktionen.json`, `fraktionen-ffa.json`, `persoenlichkeiten.json`, `inseln.json`, `inseln-ohne.json`, `sweep-hard-2.json`
- **Bezug:** Nachmessung und Sweep.

### Tests

- **Ort:** `packages/shared/src/game/engine/__tests__/ai.test.ts` (describe „KI“ und „KI: Transporte“), `rules.test.ts` (Persönlichkeiten), `engine.test.ts` (Transport, Träger, Absturz), `erkunden.test.ts`
- **Bezug:** Szenarien und Engine-Verhalten.
