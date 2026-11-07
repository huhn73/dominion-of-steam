# Balance der Fraktionen und Einheiten über Werte

## Context

Die KI-Arbeit der letzten Blöcke hat die Quoten zwischen den Fraktionen nicht mehr bewegt. Die Simulation stößt beim KI-Verhalten an ihre Grenze (Nachmessung 5 und 6 in `agent-os/product/ki-balance.md`). Die verbleibende Schieflage liegt in den Werten:
- **Kontinent-Duelle** (`ki-simulation/2026-11-06-2007-fraktionen.md`): Eisenbund gewinnt 58–63 % gegen alle (baut ein Viertel mehr Panzerwagen, weil diese 6 statt 7 Runden brauchen), Nordmark 37–48 %.
- **Inseln:** Aurelia gegen Eisenbund 70 %.
- Der letzte Vierer stammt vom 1. November auf der alten Kartengröße und ist veraltet.

Im Shaping festgelegt:
- **Was sich ändert:** nur Werte. Fraktionsboni, Sondereinheiten (Dampfkoloss, Blitzkorvette, Wolkenkreuzer) und allgemeine Einheiten dürfen sich ändern. Es kommen keine neuen Einheiten und kein neuer Setup-Schalter dazu, und die KI bleibt unverändert.
- **Was zählt:** der Vierer aller Fraktionen auf „Mittel“ (40×40), Kontinent und Inseln, jeweils mit „normal“ und „schwer“. „Schwer“ baut Sondereinheiten, damit werden sie mitgemessen.
- **Ziel:** jede Fraktion 20–30 % in jeder der vier Zellen (2 Weltformen × 2 Stufen).
- **Werkzeug:** ein Katalog-Sweep in `packages/sim`, der Einheiten- und Fraktionswerte rastert wie heute die KI-Parameter.

## Task 1: Spec-Dokumentation speichern

Ordner `agent-os/specs/2026-11-07-1551-balance-fraktionen-einheiten/` mit:
- `plan.md`: dieser Plan
- `shape.md`: Umfang, Entscheidungen (siehe oben), Ausgangsquoten, Kontext. Produktbezug: Roadmap Phase 1c / ki-balance.md.
- `standards.md`: Es gibt kein `agent-os/standards/`. Das wird vermerkt, außerdem gelten die Projektregeln aus dem Memory: Typecheck je Paket, Release erst gesammelt mit dem NEWS-Eintrag 0.11.0.
- `references.md`: KI-Parameter-Sweep (`packages/sim/src/sweep.ts`, `config.ts`, `cli.ts`, `report.ts`), Katalog (`packages/shared/src/game/catalog.ts`, `compendium/data.json`), Boni (`game/bonus.ts`, `engine/combat.ts:26`), Sondereinheiten in der KI (`engine/ai.ts:723–803`, `specialShare`), Spec `2026-11-01-2015-inselbalance-tarnung` als Vorbild für eine Wertänderung mit Nachmessung.
- Keine Visuals.

## Task 2: Katalog-Überschreibungen in der Simulation

- `packages/sim/src/config.ts`: Neuer optionaler Abschnitt `catalog` mit `{ units?: { [unitTypeId]: Partial<{strength, defense, hitPoints, damage, movement, range, capacity, productionTurns}> }, factions?: { [factionId]: Partial<{modifier, minBase}> } }`. Er wird beim Parsen geprüft: Die IDs müssen existieren und die Zahlen müssen ganzzahlig ≥ 0 sein, außer `modifier`.
- **Anwendung im Worker:** `GameJob` bekommt `catalog?`. In `game.ts` bzw. `runGame` werden die Objekte in `UNIT_TYPES` und `FACTIONS` **an Ort und Stelle** gepatcht und nach der Partie zurückgesetzt. Das geht, weil `state.ts:187` (`typeMap`) und die übrigen Module dieselben Objektreferenzen halten. Ein Hilfsmodul `packages/sim/src/catalogOverride.ts` mit `applyCatalog(o)` gibt eine Restore-Funktion zurück.
- **Sweep-Modus für Kataloge:** `SweepConfig` erhält eine Variante `{ catalogGrid: { "units.panzerwagen.productionTurns": [6,7,8], "factions.nordmark.modifier": [1.5, 2] } }`. Jeder Rasterpunkt spielt **alle Matchups** der Config (hier die Vierer) mit diesem Katalog. Es gibt kein Subjekt gegen eine Referenz.
- **Bewertung je Punkt** in `aggregate.ts`/`report.ts`: Siegquote je Fraktionslabel und Zelle, dazu die Kennzahl „größte Abweichung von 25 %“. Die Rangliste sortiert nach dieser Abweichung, die Basis (`sweep-0`) steht immer oben mit.
- Tests in `packages/sim/src/__tests__`: Parsen, Anwenden und Zurücksetzen, Rasterbildung mit Pfadschlüsseln.

## Task 3: Serien anlegen und Nullmessung

- `packages/sim/configs/fraktionen-ffa.json` umstellen auf „Mittel“ mit Kontinent 35 % und Inseln 35 %, Rundenlimit 150, Siegbedingung wie in den Inselserien (Vorherrschaft), Sitze rotiert.
- `fraktionen-ffa-hard.json` hat dieselben Einstellungen mit „schwer“.
- Die Nullmessung läuft mit beiden Configs und `fraktionen.json` (Duelle als Gegenprobe). Ergebnisse kommen in `ki-balance.md` unter dem neuen Abschnitt „Nachmessung Werte“. Die Laufzeit wird vorher mit `--dry-run` und wenigen Seeds geschätzt. Bei rund 10 s je Partie wird die Seed-Zahl für Sweeps auf 20–30 je Zelle begrenzt.

## Task 4: Sweeps und Wahl der Werte

Die Reihenfolge folgt dem Befund der Nullmessung. Kandidaten nach heutiger Lage:
1. **Eisenbund:** Bonus `minBase`/`modifier` (z. B. erst ab 7 Runden, oder nur der Dampfkoloss), alternativ Bauzeit des Panzerwagens.
2. **Nordmark:** Reichweitenfaktor 1,5 → 2, zusätzlich Werte des Wolkenkreuzers (Bauzeit 12, Stärke 3).
3. **Aurelia auf Inseln:** Bewegung der Blitzkorvette (6), ihre TP (8) oder ihre Bauzeit.
4. **Salzküste:** Stadtabwehr +1 (bleibt vermutlich).
5. **Allgemeine Einheiten** nur, wenn die Fraktionswerte das Ziel nicht erreichen. Diese Änderungen treffen alle Fraktionen und auch die Stufenquoten.

Je Sweep höchstens etwa 6–9 Punkte (Kombinationen klein halten). Der beste Punkt wird danach mit voller Seed-Zahl bestätigt, bevor er übernommen wird.

## Task 5: Werte übernehmen

- `packages/shared/src/compendium/data.json`: Werte setzen. Die Bonus-Beschreibungen (`bonus.description`, z. B. „+50 % Reichweite“) und die Taktiktexte müssen zu den Zahlen passen. Das Kompendium im Web liest dieselbe Quelle und braucht keinen eigenen Code.
- **Laufende Partien:** prüfen, ob gespeicherte Einheiten TP über einem gesenkten Maximum haben können (`hitPoints` im Spielstand). Falls ja, wird beim Laden gekappt, nach dem Muster der Migration in der Spec `kampf-trefferpunkte`.
- Tutorial (`engine/tutorial.ts`) und Demo-Partie auf Annahmen über die Werte prüfen.
- Tests, die Werte festnageln (`game/__tests__/odds.test.ts`, `kette.test.ts`, Engine-Tests), werden auf die neuen Werte angepasst, aber nur dort, wo der Test die Werte selbst prüft.
- NEWS: Eintrag in `packages/shared/src/news` unter 0.11.0 ergänzen (z. B. „Fraktionen neu ausbalanciert: …“). Release nur nach Rückfrage.

## Task 6: Nachmessung und Doku

- Nachmessung mit den Vierern (normal und schwer, Kontinent und Inseln) und den Gegenproben `fraktionen.json`, `stufen.json` und `inseln-vorherrschaft.json`, damit die Stufenquoten sich nicht verschieben.
- Ergebnis kommt in `ki-balance.md` als Tabelle vorher/nachher mit Entscheidung. Der Abschnitt „Kataloge rastern“ kommt in `ki-simulation/README.md`.
- Die Roadmap bekommt einen Eintrag in Phase 1c.

## Verifikation

- `pnpm --filter @dos/sim test`, `pnpm --filter @dos/shared test`. Der Typecheck läuft je Paket einzeln (`pnpm -r typecheck` stirbt mit SIGKILL).
- `pnpm sim sweep --config packages/sim/configs/sweep-katalog-<x>.json --dry-run` listet die Rasterpunkte. Ein kleiner Lauf mit 2 Seeds bestätigt, dass die Überschreibung wirkt (Produktion bzw. Bauzeit im Bericht sichtbar verändert) und nach der Partie zurückgesetzt ist (Basis reproduziert die Nullmessung exakt).
- Endkriterium: Jede Fraktion liegt in allen vier Zellen bei 20–30 %. Die Duelle bleiben bei 40–60 % und „schwer“ gegen „normal“ unverändert im Intervall.
- Kompendium im Browser ansehen (`/kompendium`): Werte und Bonus-Texte sind aktualisiert.
