# Referenzen für Kampfsystem mit Trefferpunkten

### Kampfregeln-Spec

- **Ort:** `agent-os/specs/2026-10-31-0207-kampfregeln/shape.md`
- **Bezug:** Domänenmatrix, Nachrücken, Boni, Stadtschaden bleiben; „Angriff beendet den Zug“ und „Stärke × Zustand“ sind durch diese Spec überholt.

### Engine

- **Ort:** `packages/shared/src/game/engine/combat.ts` (`combatChance`, `combatOdds`, `resolveCombat`, `destroyUnit`, `canAdvance`), `rules.ts` (`exchangeOdds`, `cityAttackOdds`, Boni), `hex.ts` (`attackTargets`, Client-Fallback), `engine/commands.ts` (`attack`, Heranfahren), `engine/turn.ts` (Reparatur), `engine/state.ts` (`normalizeState`, `random`), `engine/view.ts` (`combatPreviews`)
- **Bezug:** Trefferchance, Rundenschleife, Vorschauen, Migration.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (Hauptschleife, `planUnit`)
- **Bezug:** Mehrere Befehle je Einheit, Bewertung über `killChance`.

### Stammdaten

- **Ort:** `packages/shared/src/compendium/data.json`, `compendium/types.ts`, `game/catalog.ts`, `game/demo-data.json`
- **Bezug:** `hitPoints`, `damage`; Demo-Partie mit `hp`.

### Oberfläche

- **Ort:** `apps/web/src/sections/spielfeld/components/` (`Spielfeld.tsx` Angriffsdialog und Kampfsequenz, `UnitPanel.tsx`, `CityPanel.tsx`, `HexMap.tsx`), `sections/fraktionen/components/EinheitDetail.tsx`, `UnitRow.tsx`, `pages/useMatchAudio.ts`
- **Bezug:** Anzeige in TP, Dialog, Sequenz, Toast, Kompendium.

### Tests

- **Ort:** `packages/shared/src/game/engine/__tests__/` (`fixtures.ts`, `kampf.test.ts`, `engine.test.ts`, `ai.test.ts`), `apps/web/src/sections/spielfeld/Spielfeld.test.tsx`, `CityPanel.test.tsx`, `product-plan/sections/spielfeld-and-zuge/sample-data.json`
- **Bezug:** Muster für Engine- und Spielfeld-Tests.
