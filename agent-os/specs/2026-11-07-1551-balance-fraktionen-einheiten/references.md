# References for Balance der Fraktionen und Einheiten

## KI-Parameter-Sweep

- **Location:** `packages/sim/src/sweep.ts`, `config.ts`, `cli.ts`, `aggregate.ts`, `report.ts`, `worker.ts`, `game.ts`
- **Relevance:** Diesen Sweep erweitert die Spec um Katalogwerte.
- **Key patterns:** `gridCombinations` (kartesisches Produkt), `sweep-0` als Basis, Validierung in `config.ts` über `fail(path, …)`, Rangliste im Bericht

## Katalog und Boni

- **Location:** `packages/shared/src/compendium/data.json`, `packages/shared/src/game/catalog.ts` (`FACTIONS`, `UNIT_TYPES`), `game/bonus.ts` (`withBonus`), `game/engine/combat.ts:26` (Stadtabwehr der Salzküste), `engine/state.ts:187` (`typeMap` hält dieselben Objektreferenzen)
- **Relevance:** Diese Werte werden überschrieben und übernommen.
- **Key patterns:** Die Objekte werden beim Patchen nicht ersetzt, nur ihre Felder.

## Sondereinheiten in der KI

- **Location:** `packages/shared/src/game/engine/ai.ts:723–803`, `specialShare` (Zeile 136)
- **Relevance:** Nur „schwer“ (und einzelne Persönlichkeiten) baut Sondereinheiten, deshalb wird mit „schwer“ gemessen.

## Vorbild Wertänderung mit Nachmessung

- **Location:** `agent-os/specs/2026-11-01-2015-inselbalance-tarnung/`, `agent-os/specs/2026-11-01-1530-ki-verhalten-3/` (Eisenbund-Bonus `minBase` 5)
- **Relevance:** Ablauf Sweep → Bestätigung → Übernahme → Nachmessung → `ki-balance.md`
