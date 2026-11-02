# Referenzen für Inselbalance, Träger und Tauchboot-Tarnung

### Tarnung

- **Ort:** `packages/shared/src/game/engine/visibility.ts` (`STEALTH_UNIT_TYPES`, `hiddenFrom`, `seesUnit`, `sightingSnapshot`), `view.ts` (`projectBoard`), `movement.ts` (`walk` setzt `revealedTo`, `logAction` ohne Spur), `turn.ts` (`startTurn` löscht `revealedTo`, Sichtungsbericht, Wachalarm), `explore.ts` (Erkundungsstopp), `state.ts` (`UnitState.revealedTo`)
- **Bezug:** alle Sichtpfade.

### Träger

- **Ort:** `engine/movement.ts` (`boardIfPossible`), `engine/turn.ts` (Tanken, `crashAircraft`), `game/fuel.ts` (`airBases`), `engine/ai.ts` (`chooseProduction`: Träger, `planWarship`, Rückkehr der Bomber)
- **Bezug:** vorhandene Engine-Regel, neue KI-Nutzung.

### KI-Balance

- **Ort:** `engine/ai.ts` (`SKIP_SHARE`, Geleitschutz, `specialShare` bei „Seekrieg“), `agent-os/product/ki-balance.md`
- **Bezug:** Aurelia, „leicht“.

### Tests und Doku

- **Ort:** `engine/__tests__/tarnung.test.ts`, `ai.test.ts`, `engine.test.ts` (Träger), `compendium/data.json` (Tauchboot-Text), README (Kampfregeln)
