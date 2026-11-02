# Plan: KI-Regeln je Stufe und Fraktion

## Context

Die KI-Simulation (`agent-os/specs/2026-11-01-1326-ki-simulation/`, Befunde in `agent-os/product/ki-balance.md`) hat am 1. November 2026 gezeigt: „leicht“ greift nie an (Schwelle 0,7 über der Eroberungschance von Grenadieren), „schwer“ verliert gegen „normal“ (45 %, Münzwurf-Angriffe und teure Sondereinheiten), Salzküste gewinnt 74 bis 92 % der Duelle (ihre Stadtabwehr drückt Grenadiere unter die Schwelle), Ostrow verliert 100 % (Schwelle 0,75). Zahlenparameter allein bewegen „normal gegen normal“ nicht aus dem Rauschen; es fehlen Verhaltensbausteine: Einheiten auf Wache werden nie neu geplant, es gibt keine Stadtverteidigung, die Produktion friert beim ersten Wurf je Stadt ein.

Diese Spec setzt die Maßnahmen um, die ohne neue Einheitenbefehle auskommen, und misst sie mit denselben Serien nach. Transporte, Flugzeuge und fraktionsspezifische Produktion folgen als eigener Block.

## Entscheidungen (Shaping, 1. November 2026)

Siehe `shape.md`. Kurz: leicht 0,6 ohne Belagerung; schwer 0,55 ohne Sondereinheiten und Schiffe, dafür Neuplanung, Stadtverteidigung und Produktion nach Lage; Ertragsbewertung beim Stadtangriff für normal und schwer; Schwellendeckel 0,65; Produktion wird bei jedem Neustart neu gewürfelt.

## Task 1: Spec-Dokumentation

Dieser Ordner. Nachgezogen: `agent-os/product/roadmap.md` (Phase 1c Punkt 6 umgesetzt, Folgeblock als Punkt 7), `agent-os/product/ki-balance.md` (Abschnitt „Nachmessung“ mit Vorher und Nachher), `agent-os/product/ki-simulation/README.md` (neue Berichte).

## Task 2: Profil (`packages/shared/src/game/engine/ai.ts`, `aiProfile`)

- `ATTACK_THRESHOLD`: easy 0,6, normal 0,55, hard 0,55. `SKIP_SHARE` unverändert.
- `specialShare` 0 für alle Stufen (nur „Luftkrieg“ +0,15), `shipShare` 0,35 nur für normal (Tags wie bisher).
- Neue Felder: `siege` (easy false), `cityValue` (easy false), `replan` (`'none' | 'goto' | 'all'`: easy, normal, hard), `defend` (hard).
- Tags: „Defensiv“ +0,1 und Garnison, „Befestigung“ nur Garnison. Deckel `min(0.65, max(0.3, …))`.

## Task 3: Zugablauf (`playAITurn`)

- Sichtwissen je Zustand einmal (`know()`), nach jedem angenommenen Befehl verworfen.
- Bedrohte Städte (`defend`): eigene Städte mit sichtbarem Feind im Abstand ≤ 3.
- Produktion: Städte ohne Produktion oder mit Fortschritt 0 wählen neu; `setProduction` nur, wenn sich der Typ ändert. Bedrohte Städte bauen Grenadiere.
- Garnison: erste Landeinheit in jeder eigenen Stadt (`garrison`) bzw. in jeder bedrohten Stadt (`defend`) bleibt auf Wache. Bedrohte Städte ohne Garnison rufen die nächste freie Landeinheit im Abstand ≤ 6 per `goto` zurück; zurückgerufene Einheiten werden in diesem Zug nicht weiter geplant.
- Hauptschleife: `goto` nur mit `replan ≠ 'none'`, `sentry` nur mit `replan = 'all'` neu planen; `patrol` und `explore` nie. Vor einem neuen Befehl `cancelOrder`, außer das `goto`-Ziel ist dasselbe. Rest wie bisher (bis sechs Befehle je Einheit, danach Wache).

## Task 4: Zielwahl (`planUnit`, `cityAttackPaysOff`)

- Städte ohne Verteidiger: mit `cityValue` lohnt der Angriff, wenn `killChance × Stadtwert ≥ Bauzeit / Grenadier-Bauzeit − Gutschrift` (Stadtwert 3 neutral, 6 feindlich; Gutschrift 1 für unbeschädigte Einheiten mit mehr als einem Trefferpunkt; Kosten mindestens 0,5). Ohne `cityValue` wie bisher über die Schwelle. Beschädigte Mehr-TP-Einheiten greifen weiterhin keine Städte an.
- Verteidiger in Städten: nur mit `siege`.
- Einheiten im Feld: Schwelle wie bisher. Sortierung unverändert.

## Task 5: Tests (`engine/__tests__/ai.test.ts`)

Leicht erobert neutrale Städte (20 Seeds) und greift keine Verteidiger in Städten an, normal schon; Grenadiere greifen eine Salzküste-Stadt an (normal), leicht nicht; Produktion wird bei Fortschritt 0 neu gewürfelt, bei Fortschritt 3 nicht; schwer plant eine Wache-Einheit neu, normal nicht; schwer ruft eine Einheit in eine bedrohte Stadt zurück, normal nicht; schwer hält eine bedrohte Stadt besetzt; Profil-Deckel und Profilfelder je Stufe. Bestehende Tests unverändert, Simulationstest bleibt.

## Task 6: Nachmessung

`pnpm sim bench`, dann `stufen.json`, `fraktionen.json`, `fraktionen-ffa.json`, `persoenlichkeiten.json`; Ergebnisse in `ki-balance.md` neben die Vorher-Werte. Zielwerte: hard gegen normal ≥ 65 % mit unterer Intervallgrenze > 55 %; easy gegen normal 15–30 % mit mindestens einer Eroberung in 90 % der Partien; Salzküste in den Duellen unter 65 %; Ostrow 35–65 %.

## Verifikation

1. `pnpm --filter @dos/shared test` (149 Tests), `pnpm --filter @dos/sim test`, `pnpm typecheck` je Paket, `pnpm lint`.
2. Nachmessung laut Task 6; Zahlen in `ki-balance.md`.
