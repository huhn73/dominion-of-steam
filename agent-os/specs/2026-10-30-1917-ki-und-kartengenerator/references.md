# Referenzen für 02b KI & Kartengenerator

### Regel-Engine aus 02a

- **Ort:** `packages/shared/src/game/engine/`
- **Bezug:** `applyCommand` (KI-Befehle), `knowledge` und `projectView` (Sicht der KI), `endTurn`, `startTurn`, `seedDemo` (Aufbau eines Spielzustands)
- **Übernahme:** Die KI ruft ausschließlich die vorhandenen Befehle auf; der neue Generator liefert denselben `GameState` wie `seedDemo`.

### Hex-Regeln

- **Ort:** `packages/shared/src/game/hex.ts`
- **Bezug:** `attackTargets`, `findPath`, `reachableTiles`, `neighbors`, `hexDistance`

### Partie-Setup (Meilenstein 04)

- **Ort:** `product-plan/sections/partie-setup-and-ki-gegner/types.ts`, `sample-data.json`, `product-plan/instructions/incremental/04-partie-setup-and-ki-gegner.md`
- **Bezug:** `MapSettings` (Größe, Landanteil, neutrale Städte, Gelände, Seed), Kartengrößen 14×10 bis 36×24, Seed-Format `WORT-1234`, Schwierigkeitsstufen
