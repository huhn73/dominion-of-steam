# Balance der Fraktionen und Einheiten über Werte — Shaping Notes

## Scope

Die Fraktionen werden über Spielwerte ausbalanciert: Fraktionsboni, Sondereinheiten und bei Bedarf allgemeine Einheiten. Dazu bekommt die Simulation einen Katalog-Sweep, der diese Werte rastert. Gemessen wird am Vierer aller Fraktionen.

## Decisions

- Es ändern sich nur Werte. Neue Einheiten (auch keine Sondereinheit für die Salzküste), Setup-Optionen und Änderungen am KI-Verhalten gehören nicht dazu.
- Diese Stellschrauben sind erlaubt: Fraktionsboni (`modifier`, `minBase`), Sondereinheiten (Dampfkoloss, Blitzkorvette, Wolkenkreuzer) und allgemeine Einheiten. Allgemeine Einheiten kommen zuletzt dran, weil sie auch die Stufenquoten verschieben.
- Messung: Vierer auf „Mittel“ (40×40), Kontinent und Inseln mit je 35 % Land, „normal“ und „schwer“. „Schwer“ baut Sondereinheiten (`specialShare` 0,15) und misst sie so mit.
- Ziel: jede Fraktion 20–30 % in allen vier Zellen. Das ist enger als das bisherige Band 15–35 %.
- Gegenproben: Duelle (`fraktionen.json`) bleiben bei 40–60 %, `stufen.json` und `inseln-vorherrschaft.json` bleiben unverändert im Intervall.
- Werkzeug: Katalog-Überschreibungen in `packages/sim`, die je Partie im Worker an Ort und Stelle gepatcht und danach zurückgesetzt werden. Dazu kommt ein Sweep-Modus, der je Rasterpunkt alle Matchups spielt und nach der größten Abweichung von 25 % sortiert.

## Ausgangslage

- Kontinent-Duelle `normal` (`ki-simulation/2026-11-06-2007-fraktionen.md`): Eisenbund 61 / 63 / 58 % gegen Aurelia, Nordmark und Salzküste. Nordmark 37 / 48 / 42 %. Aurelia gegen Salzküste 46 %. Eisenbund baut 34,6 Panzerwagen je Partie gegen 27,2 bei Aurelia (Bonus: 6 statt 7 Runden).
- Inseln: Aurelia gegen Eisenbund 70 % (Nachmessung neutrale Inseln).
- Der letzte Vierer (`2026-11-01-1550-fraktionen-ffa.md`, 26 / 30 / 18 / 27 %) lief noch auf der alten Kartengröße.
- Die KI baut auf „normal“ keine Sondereinheiten.

## Ergebnis (7. November 2026)

- Die Siegbedingung im Vierer ist „Rundenlimit“ statt Vorherrschaft, weil viele Vierer sonst ohne Sieger am Deckel enden.
- Nullmessung mit 50 Seeds: 18–30 % je Fraktion (Eisenbund ≈ 29 %, Nordmark ≈ 21 %).
- Sweep 1 (Eisenbund `minBase` 8, Wolkenkreuzer 10 Runden) und Sweep 2 (Panzerwagen 8/9 Runden × Stärke 4/5): Kein Punkt ist klar besser als die Basis. `minBase` 8 kippt die Inseln zu Aurelia.
- Das Rauschen bei 20 Seeds liegt bei ±10 Punkten je Zelle, weil die Rotationen eines Seeds auf derselben Welt spielen.
- Entscheidung des Nutzers nach Sweep 1: allgemeine Einheiten probieren. Nach Sweep 2 gibt es keine Wertänderung (Task 5 entfällt). Das Werkzeug und die Doku bleiben.

## Context

- **Visuals:** keine
- **References:** KI-Parameter-Sweep in `packages/sim`, Katalog aus `compendium/data.json`, Boni in `game/bonus.ts` und `engine/combat.ts`
- **Product alignment:** Fortsetzung der Balance-Arbeit aus Roadmap Phase 1c (`ki-balance.md`). Nach zwei KI-Blöcken ohne messbaren Effekt liegt der Hebel jetzt bei den Werten.

## Standards Applied

Es gibt kein `agent-os/standards/`. Stattdessen gelten die Projektregeln, siehe `standards.md`.
