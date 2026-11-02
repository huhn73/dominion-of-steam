# Referenzen für KI-Regeln je Stufe und Fraktion

### Befunde

- **Ort:** `agent-os/product/ki-balance.md`, Berichte in `agent-os/product/ki-simulation/`
- **Bezug:** Vorher-Werte, Ursachen, Maßnahmenliste und Zielwerte.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`aiProfile`, `playAITurn`, `chooseProduction`, `cityAttackPaysOff`, `planUnit`)
- **Bezug:** alle Änderungen dieser Spec.

### Engine

- **Ort:** `engine/commands.ts` (`setProduction` ist bei gleichem Typ ein Leerlauf, `cancelOrder`), `engine/turn.ts` (`executeStandingOrders`: Wache wacht nur bei Feind im Sichtradius auf), `engine/visibility.ts` (Sichtradius 1 für Land und Städte), `game/hex.ts` (`attackTargets`: Verteidiger in Städten sind Einheitenziele mit Stadtbonus), `game/rules.ts` (`cityAttackOdds`, `CITY_DEFENSE`)
- **Bezug:** Randbedingungen der Verhaltensbausteine.

### Persönlichkeiten

- **Ort:** `packages/shared/src/setup/data.ts` (`AI_PERSONALITIES`, Tags)
- **Bezug:** Defensiv, Befestigung, Luftkrieg, Seekrieg.

### Simulation

- **Ort:** `packages/sim/` (`pnpm sim`), Configs `stufen.json`, `fraktionen.json`, `fraktionen-ffa.json`, `persoenlichkeiten.json`, Sweeps
- **Bezug:** Nachmessung.

### Tests

- **Ort:** `packages/shared/src/game/engine/__tests__/ai.test.ts`, `fixtures.ts` (`PLAINS`, `makeState`, `unit`, `city`)
- **Bezug:** Muster für Szenario-Tests der KI.
