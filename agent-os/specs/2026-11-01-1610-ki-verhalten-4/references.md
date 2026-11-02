# Referenzen für KI-Verhalten, vierter Block

### Befunde und Vorgänger

- **Ort:** `agent-os/product/ki-balance.md`, `agent-os/specs/2026-11-01-1530-ki-verhalten-3/` und frühere KI-Specs
- **Bezug:** Zielwerte, Vorher-Werte, Werkzeug.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`aiProfile`: `garrisonTarget`, `subShare`; `chooseProduction`: Garnisonsziel, Tauchboote; `planWarship`)
- **Bezug:** alle Änderungen dieser Spec.

### Engine

- **Ort:** `game/rules.ts` (`canAttack`: Tauchboot nur gegen Schiffe), `compendium/data.json` (Tauchboot Stärke 5, Abwehr 1, 2 TP, Schaden 3, 9 Runden)
- **Bezug:** Einsatzprofil des Tauchboots.

### Simulation

- **Ort:** `packages/sim/src/config.ts` (`PROFILE_KEYS`), `packages/sim/configs/sweep-hard-6.json`, `sparring.json`
- **Bezug:** Sweep und Sparring.

### Tests

- **Ort:** `packages/shared/src/game/engine/__tests__/ai.test.ts` (Garnisonsziel, Tauchboote)
- **Bezug:** Szenarien.
