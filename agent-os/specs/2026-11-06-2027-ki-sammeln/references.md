# Referenzen für KI-Verhalten, sechster Block

### Befunde und Vorgänger

- **Ort:** `agent-os/product/ki-balance.md` („Nachmessung 5“), Spec `2026-11-06-1851-ki-verhalten-5`, Block 2 (`2026-11-01-1430-ki-verhalten-2`, Belagerung mit Übermacht)
- **Bezug:** Warum Einheiten einzeln ankommen; Zielwerte.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`planUnit` Schritt 2 Expansion, `approach`, `siegePaysOff`, Einheitenschleife in `playAITurn` mit abschließendem `sentry`, `k.ghosts`, `k.masses`)
- **Bezug:** Sammelpunkt und Warten.

### Engine

- **Ort:** `engine/commands.ts` (`skip` setzt `skipped`), `engine/turn.ts` (setzt `skipped` zu Zugbeginn zurück), `hex.ts` (`tilesNear`, `findPath`)
- **Bezug:** Warten ohne Wache.

### Simulation

- **Ort:** `packages/sim/src/collector.ts`, `aggregate.ts`, `report.ts` (Kennzahl), `config.ts` (`PROFILE_KEYS`, Validierung)
- **Bezug:** Verluste vor Städten, Sweep.
