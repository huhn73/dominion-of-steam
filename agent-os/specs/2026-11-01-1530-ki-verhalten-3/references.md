# Referenzen für KI-Verhalten, dritter Block

### Befunde und Vorgänger

- **Ort:** `agent-os/product/ki-balance.md`, `agent-os/specs/2026-11-01-1430-ki-verhalten-2/`, `agent-os/specs/2026-11-01-1358-ki-regeln/`, `agent-os/specs/2026-11-01-1326-ki-simulation/`
- **Bezug:** Zielwerte, Vorher-Werte, Werkzeug.

### Regel

- **Ort:** `packages/shared/src/compendium/data.json` (Eisenbund `bonus.minBase`, `trait`, `description`), `compendium/types.ts` und `game/types.ts` (`FactionBonus.minBase`), `game/catalog.ts`, `game/bonus.ts` (`withBonus`), `apps/web/src/sections/fraktionen/components/theme.ts` (`bonusEffect`)
- **Bezug:** Bonus nur ab fünf Runden Bauzeit.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`aiProfile`: `repair`, `specialShare`; `chooseProduction`: Geleitschutz, Fraktionsbomber, Land-Sondereinheit; `planWarship`; Reparaturschritt in `planUnit`)
- **Bezug:** alle Bausteine dieser Spec.

### Engine

- **Ort:** `engine/turn.ts` (Reparatur +1 je Runde in eigener Stadt), `game/rules.ts` (`canAttack`: See gegen See und Küste), `game/hex.ts` (`attackTargets`, `approach` über Wasser)
- **Bezug:** Randbedingungen für Reparatur und Marine.

### Simulation

- **Ort:** `packages/sim/src/config.ts` (`PROFILE_KEYS` mit `repair`), `packages/sim/configs/sparring.json`, `inseln.json`, `stufen.json`, `fraktionen.json`, `fraktionen-ffa.json`, `persoenlichkeiten.json`
- **Bezug:** Nachmessung und Sparring.

### Tests

- **Ort:** `packages/shared/src/game/engine/__tests__/ai.test.ts` (Reparatur, Sondereinheiten, Geleitschutz), `engine.test.ts`, `kampf.test.ts`, `mapgen.test.ts` (Bauzeiten ohne Grenadier-Bonus), `apps/web/src/sections/spielfeld/components/CityPanel.test.tsx`, `apps/web/src/pages/kompendium/Kompendium.test.tsx`
- **Bezug:** angepasste Erwartungen an die Bauzeiten.
