# Plan: Echte Inselwelt

## Context

Der Kartengenerator schwellte ein Rauschfeld und ergab fast immer einen Kontinent plus Krümel; selbst nach dem Nachtrag „Hauptstädte zufällig über die Landmassen“ lagen die Hauptstädte bei 35 % Land auf „Mittel“ nur in 9 von 20 Karten getrennt. Der Spieler will echte Inselwelten, damit Transporte, Geleitschutz und Seeboni (KI-Blöcke 2–4) zum Tragen kommen. Festlegungen vom 1. November 2026: sinnvoller Landanteil 20–40 %, Hauptstädte zufällig verteilt, Rundenlimit Mittel 150.

## Entscheidungen (Shaping, 1. November 2026)

Siehe `shape.md`: Weltform `continent | islands | archipelago` (Vorgabe Kontinent), Kuppeln plus Meerengen-Band, Rangschwelle bleibt, Hauptstadt je Zelle an der Küste, Städte in zwei Phasen, goldene Hashes für den Kontinent, `pnpm sim maps` als Messwerkzeug.

## Task 1: Spec-Dokumentation

Dieser Ordner (`plan.md`, `shape.md`, `standards.md`, `references.md`, `visuals/`). Nachzug: `agent-os/product/roadmap.md` (Punkt 3 Nachtrag, Punkt 10 Inselwelt), README `## Kartengrößen` (Weltform), `agent-os/product/ki-simulation/README.md` (Serie F auf Inseln, Serie H Inselwelt, `sim maps`), `agent-os/specs/2026-11-01-1707-kartengroessen/shape.md` (Regelmodell `minMass`), `agent-os/product/ki-balance.md` („Nachmessung Inselwelt“).

## Task 2: Goldene Hashes (erledigt, Commit 4117be9)

`engine/__tests__/inselwelt.test.ts` „Kontinent unverändert“: sechs Welten (small/20/6, small/45/2, medium/35/4, medium/70/3, large/30/6, large/45/4) mit `hashString(JSON.stringify(generateWorld(…)))`, dazu `worldShape: 'continent'` ≡ ohne Feld. Vor jeder Generatoränderung festgeschrieben.

## Task 3: Typ und Durchreichung (erledigt, Commit 4117be9)

`game/worldShapes.ts` (`WORLD_SHAPES`, `WorldShape`, `DEFAULT_WORLD_SHAPE`, `isWorldShape`, `worldShapeLabel`), `MapSettings.worldShape?`, Kartencode `:${shape}` nur bei ≠ Kontinent.

## Task 4: Generator (erledigt, Commit c69e03a)

`mapgen.ts`: `islandLayout` (Budget, Heimatzentren per Dart-Throwing, neutrale Inseln mit räumlichem Hash, Inselchen-Durchgang für Restbudget), Band und Zellen je Versuch, Kuppelhöhe, Rangschwelle, `landmasses()` exportiert, `islandCapitals` je Zelle mit Fallback-Kette und Sicherheitsnetz (Band +1, bis 3×), Städte in zwei Phasen, `continentCapitals` unverändert ausgelagert. `islandTargets()` und `ISLAND_PARAMS` exportiert. Nachgezogen nach dem ersten Übersichtsbild: Domain-Warp der Meerengen (gerades Gitter → Mäander) und Hinweis „Archipel mit 20–30 % Land“.

## Task 5: Messwerkzeug (erledigt, Commit c69e03a)

`packages/sim/src/mapstats.ts`, Subkommando `pnpm sim maps` mit `--shape --sizes --shares --seats --seeds`. Tuning-Schritte: Budget nur für gesetzte Inseln belasten; neutrale Inselgröße auf Zellfläche/12 deckeln; Abstände auf einen Saum; Inselzentren nur außerhalb des Bandes statt mit Sicherheitsabstand; Inselchen-Durchgang; Rauschanteil 0,3 → 0,2.

## Task 6: Engine-Tests (erledigt, Commit c69e03a)

`inselwelt.test.ts`, 14 Tests: Matrix `{islands, archipelago} × {small, medium} × {20, 35, 50} × {2, 4, 6} × 20 Seeds` (Hauptstädte vollzählig und auf getrennten Massen, auf Mittel an der Küste, Städteabstand), Groß/Riesig/Imperium mit sechs Sitzen, Heimatgrößen im Band `[0,5; 2,5]·Ziel` und Verhältnis ≤ 2,2 in ≥ 80 % der Seeds, neutrale Inseln mit Städten und Heimatinseln mit ≥ 2 Städten, Landanteil ±1 (Klein 70 %/6 Sitze ≥ 45 %), Randring, Determinismus, Imperium < 2 s.

## Task 7: Setup, Server, Lobby (erledigt, Commit c69e03a)

`setup/types.ts`, `setup/data.ts` (Optionen, Regler-Labels „Wenig Land“/„Viel Land“, Vorgabe Kontinent), `setup/validate.ts` (Vorgabe für alte Entwürfe, Prüfung, Übernahme), `apps/server/src/setup/service.ts` (`engineMap`, `lastPreset`, `createSolo` mit `shape`), `lobby/types.ts` und `lobby/service.ts` (`worldShape` in `MatchMapInfo`). Tests `validate.test.ts`.

## Task 8: Web (erledigt, Commit c69e03a)

`StepMap.tsx` (Weltform-`Segmented` mit Erklärung, Hinweis unter dem Regler bei Inseln), `StepSummary.tsx` (Row Weltform), `Warteraum.tsx` und `MatchDialogs.tsx` (nur bei ≠ Kontinent), `DevBar.tsx` (Auswahl), `data/match.ts`. Test `PartieSetup.test.tsx`.

## Task 9: Simulation (erledigt, Commit c69e03a; Serien laufen)

`MapConfig.worldShape`, `mapId` `medium-islands`, Berichtszeile „Welt“; Configs `inselwelt.json` (Mittel, Inseln, 35 %, 150 Runden: schwer gegen normal, Aurelia gegen Eisenbund, Vierer mit Varenne, Kessler, Brandt, Ostrow), `archipel.json`, `inseln.json`/`inseln-ohne.json` auf Inseln 35 % mit 150 Runden. Ergebnisse in `ki-balance.md`.

## Task 10: Verifikation und Visuals

1. `pnpm --filter @dos/shared test` (202), `--filter @dos/web test` (252), `--filter @dos/sim test` (23), `--filter @dos/server test` (72 ohne Datenbank), Typecheck je Paket, `pnpm lint`: grün.
2. `pnpm sim maps --shape islands|archipelago --sizes small,medium,large --shares 20,35,50 --seats 2,4,6 --seeds 30`: Hauptstädte getrennt und an der Küste 30/30 in allen 54 Zellen; Heimatinseln bei 20–35 % im Zielband (Mittel 4 Sitze 61–89–143 bei Ziel 77, Groß 125–140–234 bei Ziel 150); neutrale Inseln ab 6 Feldern: Mittel 35 % 11, Groß 35 % 55, Imperium 426; bei 50 % verschmelzen Inseln zu einem zerklüfteten Kontinent (Heimatmassen bis 1 100), Trennung bleibt; Klein mit 4–6 Sitzen ohne neutrale Inseln (400 Felder); Laufzeit mit Domain-Warp: Mittel 6 ms, Groß 13–17 ms, Riesig 77 ms, Imperium 114 ms.
3. Serien `inselwelt`, `inseln`, `inseln-ohne`, `archipel`: Der erste Lauf deckte auf, dass „schwer“ ohne Kanonenboote keine fremden Inseln entdeckt und deshalb keine Frachter baut (10 % gegen normal); nach der Seeaufklärer-Regel in `ai.ts` 68 % auf Inseln, 66 % auf dem Kontinent. Aurelia gewinnt Inselduelle 80–88 %, Inselpartien enden zu 99 % am Rundenlimit; Befunde und Folgepunkte in `agent-os/product/ki-balance.md`, „Nachmessung Inselwelt“, und Roadmap 1c Punkt 11.
4. Visuals in `visuals/`: `umsetzung-setup-weltform.png` (Kartenschritt mit Weltform), `umsetzung-welten.png` (gerenderte Welten: Kontinent, Inseln, Archipel 25 %, Groß mit sechs Sitzen, Hauptstädte orange, Städte weiß), `umsetzung-partie-mittel-inseln.png` (Solo-Partie über die DevBar, Startsicht).
