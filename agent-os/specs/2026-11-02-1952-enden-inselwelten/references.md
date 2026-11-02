# Referenzen für Enden auf Inselwelten

### Siegbedingungen

- **Ort:** `packages/shared/src/game/engine/victory.ts` (`checkVictory`, `finishMatch`, `leaderByScore`, `updateEliminations`), `engine/turn.ts` (`endTurn`, Rundenlimit)
- **Bezug:** Hier wird Vorherrschaft geprüft, und hier enden Partien.

### Aufgeben

- **Ort:** `packages/shared/src/game/engine/surrender.ts`
- **Bezug:** Muster für die Kapitulation; das Aufgeben eines Menschen übergibt den Platz an eine KI, die später kapitulieren kann.

### Vorschlag im Setup

- **Ort:** `packages/shared/src/setup/setup.ts` (`roundLimitAfterSizeChange`), `apps/web/src/sections/partie-setup/components/StepMap.tsx`
- **Bezug:** Ein Wert folgt dem Kartenwechsel, solange der Spieler ihn nicht selbst geändert hat. So folgt die Siegbedingung der Weltform.

### Simulation

- **Ort:** `packages/sim/src/config.ts`, `report.ts`, `configs/inseln.json`
- **Bezug:** Messung der Spielenden und Zielwerte
