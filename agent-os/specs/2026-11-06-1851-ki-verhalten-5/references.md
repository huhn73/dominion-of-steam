# Referenzen für KI-Verhalten, fünfter Block

### Befunde und Vorgänger

- **Ort:** `agent-os/product/ki-balance.md`, Specs `2026-11-01-1430-ki-verhalten-2` bis `2026-11-02-2209-ki-neutrale-inseln`
- **Bezug:** Zielwerte, Vorher-Werte, Werkzeug.

### KI

- **Ort:** `packages/shared/src/game/engine/ai.ts` (`playAITurn`: Bedrohung, Garnison, Rückruf, Einheitenschleife; `planUnit`: Angriff Schritt 1, Verfolgung 2b; `siegePaysOff`, `cityAttackPaysOff`, `transportTargets`, `unitCost`, `approach`)
- **Bezug:** alle Verhaltensänderungen dieser Spec.

### Kampf

- **Ort:** `packages/shared/src/game/rules.ts` (`exchangeOdds`, `cityAttackOdds`), `engine/combat.ts` (`combatOdds`), `hex.ts` (`attackTargets`, `reachableTiles`)
- **Bezug:** Kettenbewertung der koordinierten Angriffe.

### Sicht und Spielstand

- **Ort:** `engine/view.ts` (`projectBoard`: Nebel, `knownBy` für Städte; Teilnehmer-Abbildung), `engine/state.ts` (`ParticipantState`, `seenAtTurnEnd` als Vorbild für gespeichertes Wissen, Normalisierung)
- **Bezug:** Gedächtnis `aiMemory`, das nicht an Clients geht.

### Simulation

- **Ort:** `packages/sim/src/config.ts` (`PROFILE_KEYS`), Configs `stufen.json`, `fraktionen.json`, `inseln-vorherrschaft.json`, `archipel.json`, `sparring.json`
- **Bezug:** Nullmessung, Sweep, Nachmessung.
