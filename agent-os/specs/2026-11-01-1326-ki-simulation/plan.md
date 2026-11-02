# Plan: KI-Simulation und Parameter-Sweep

## Context

Die drei KI-Stufen (`easy`, `normal`, `hard`) unterscheiden sich fast nur in Zahlen: Angriffsschwelle, Aussetzer-Anteil, Schiffs- und Sondereinheiten-Anteil in `packages/shared/src/game/engine/ai.ts` (`ATTACK_THRESHOLD`, `SKIP_SHARE`, `aiProfile`). Ob „schwer“ wirklich stärker ist, ob die Fraktionen ausgeglichen sind und welche Persönlichkeit hilft oder schadet, wusste niemand. Der Spieler will Partien automatisiert in Serie durchspielen, die Ergebnisse auswerten und daraus KI-Regeln je Stufe und Fraktion ableiten.

Stand im Code (Erkundung, 1. November 2026): Die Engine ist per Seed deterministisch (`random(state)`), die KI handelt nur über `applyCommand`, und ein Headless-Durchlauf KI gegen KI existierte bereits als Test (`engine/__tests__/ai.test.ts`, „Simulation KI gegen KI“). Es fehlte ein Werkzeug, das Serien fährt, Kennzahlen sammelt, Berichte schreibt und Profilparameter rastert. `playtest-runde-1.md` erwähnt eine frühere Simulation über 100 Partien ohne abgelegtes Skript; `playtest-runde-2.md` Punkt 7 verlangt eine Messung der KI-Zugdauer.

## Entscheidungen (Shaping, 1. November 2026)

- **Umfang:** Werkzeug plus erste Auswertung mit Regelvorschlägen. Änderungen am KI-Verhalten folgen als eigene Spec („KI-Regeln je Stufe und Fraktion“, Roadmap 1c Punkt 6).
- **Eigenes Workspace-Paket `packages/sim` (`@dos/sim`)** nach dem Vorbild von `apps/server` (`@dos/shared: workspace:*`, `tsx`, `@types/node`). `packages/shared` bleibt frei von Node-Typen, weil Vite es in den Client bündelt. Aufruf `pnpm sim` vom Repo-Stamm.
- **Laufzeit tsx**, auch in Worker-Threads (`--import` des tsx-Loaders je Worker). Verworfen: Nodes `--experimental-strip-types` (shared nutzt endungslose Imports und JSON-Imports ohne Attribute), Vorkompilieren (`noEmit`, Exports zeigen auf `.ts`), Vitest-Bench (keine CLI, keine Worker).
- **Zwei Hooks in `playAITurn`** über ein optionales viertes Argument `AiTurnOptions`: `profile` überschreibt Felder des Profils (Sweep), `onCommand` meldet jeden angenommenen Befehl mit seinem `CommandOutcome` (Kämpfe, Eroberungen, Befehlszählung). Verworfen: ein Feld am Teilnehmer (würde persistierten State und Servertypen verschmutzen), Auswertung von `state.events`/`state.log` (nur deutsche Fließtexte).
- **Kennzahlen** je Partie und Teilnehmer: Sieger, Platz, Siegart, Runden, Eroberungen (neutral, feindlich, verloren, erste Eroberung), Kämpfe (Angriffe, gewonnen, verloren, Stadtangriffe, Einheiten verloren und vernichtet, sonstige Verluste, Schaden), Produktion je Typ, Zugdauer je KI-Zug, Befehle je Zug, Budgeterschöpfung, Rundenkurve (Städte, Einheiten je Domäne, Punkte). Aggregation je Matchup und Label mit Wilson-Intervall (95 %), Sitzvorteil, Kurven.
- **Sitzrotation:** jeder Seed einmal je Sitzreihenfolge, damit kein Label dauerhaft Sitz 1 hat. Hinweis im Bericht: Rotationen desselben Seeds sind korreliert.
- **Ausgabe:** Rohdaten `games.jsonl` (eine Zeile je Partie, sofort geschrieben) und `summary.json` nach `packages/sim/results/<stempel>-<name>/` (gitignoriert); Markdown-Bericht nach `agent-os/product/ki-simulation/` (committet; `agent-os/` steht in `.prettierignore`). Konfigurationen als JSON in `packages/sim/configs/`.
- **Raster-Sweep:** kartesisches Produkt der Parameterlisten, je Punkt ein Matchup Subjekt (mit Override) gegen Referenz, dazu `sweep-0` als Basis ohne Override; Rangliste nach Siegquote, dann unterer Wilson-Grenze, dann Platz. Verworfen: evolutionäre Suche (aufwendiger, schwerer nachvollziehbar).
- **Laufzeit erst messen:** Der Bench ergab rund 3 s je 100-Runden-Partie mit drei KIs auf „Mittel“ (8 bis 25 ms je Runde, bis 11 ms je KI-Zug, Spielstand bis 350 KiB). Eine Kürzung von `events`/`log` ist damit unnötig und entfällt.

## Task 1: Spec-Dokumentation

Dieser Ordner (`plan.md`, `shape.md`, `standards.md`, `references.md`). Nachgezogen: `agent-os/product/roadmap.md` (Phase 1c Punkte 5 und 6), `playtest-runde-2.md` (Punkt 7 verweist auf die Messung), `README.md` (Abschnitt „KI-Simulation“), `agent-os/product/ki-simulation/README.md` (Aufruf, Serien, Zielkriterien, Lesart).

## Task 2: Engine-Hook (`packages/shared/src/game/engine/ai.ts`)

```ts
export interface AiTurnOptions {
  profile?: Partial<AiProfile>
  onCommand?: (cmd: Command, outcome: CommandOutcome) => void
}
export function playAITurn(input, playerId, now = new Date(), options: AiTurnOptions = {}): GameState
```

Profil `= { ...aiProfile(stufe, persönlichkeit), ...options.profile }`; `run` ruft `options.onCommand?.(cmd, outcome)` nach jedem angenommenen Befehl. Export in `engine/index.ts`. Server unverändert. Tests in `ai.test.ts`: Override `attackThreshold: 1` unterbindet den Angriff; `onCommand` wird je Befehl einmal gerufen, der letzte gemeldete Zwischenstand ist der Rückgabewert.

## Task 3: Paketgerüst `packages/sim`

`package.json` (Skripte `sim`, `typecheck`, `test`), `tsconfig.json` mit Node-Typen, Root-Skript `sim`, `.gitignore`-Eintrag `packages/sim/results/`. Test `worker.test.ts` belegt, dass tsx die Engine in einem Worker-Thread lädt.

## Task 4: Konfiguration, Jobs, Sweep

- `src/config.ts`: `parseConfig(json)` mit Vorgaben (Karte medium, Land 55 %, 10 Seeds, Rotation an, Rundenlimit 100, Siegbedingung Rundenlimit) und Prüfung von Fraktions-IDs (`FACTIONS`), Stufen, Persönlichkeiten (`aiPersonality`), Kartengrößen (`MAP_SIZES`), `landShare` 20–70, Profilfeldern und Wertebereichen; `ConfigError` mit Pfadangabe.
- `src/jobs.ts`: `expandJobs` = Matchups × Karten × Seeds × Rotationen; Regeln `defaultRules('live')` mit Rundenlimit und Siegbedingung, `allowDuplicateFactions: true`; Teilnehmer `p1..pn`, Farben zyklisch.
- `src/sweep.ts`: `gridCombinations`, `sweepMatchups` (Basis `sweep-0` plus ein Matchup je Rasterpunkt, `sweepParams` am Matchup).

## Task 5: Collector und Partie-Schleife

- `src/game.ts` `runGame(job)`: `createMatch` → Schleife `playAITurn` (mit `profile`, `onCommand`) und `endTurn` mit festem `NOW`, bis `status` nicht mehr `running` ist oder `round > maxRounds` (Deckel auch für `elimination`/`capitals`). Siegart aus dem Endzustand.
- `src/collector.ts` `MetricsCollector`: Kämpfe und Eroberungen aus `outcome.combat` (Vorbesitzer der Stadt und Besitzer des Verteidigers aus dem Zustand vor dem Befehl); Produktion und sonstige Verluste aus dem Diff der Einheitenliste (neue Einheiten nach `endTurn` = Produktion, verschwundene ohne Kampf = Abstürze oder Ladung); Rundenschnappschuss, wenn der letzte aktive Sitz den Zug beendet; Eliminierungsrunde; Zugdauer je KI-Zug.
- Identitäten (Tests): `captures.lost` = Σ `captures.enemy`; `unitsLost` = `unitsKilled` + `lost` + `cityAttacksWon`; `finalScore` = Städte × 3 + Einheiten; gleiche Partie zweimal → identische Kennzahlen bis auf Zeiten.

## Task 6: Statistik und Aggregation

`src/stats.ts` (`wilson`, `mean`, `median`, `percentile`), `src/aggregate.ts` (`summarizeMatchup`, `rankSweep`, `aggregate` → `RunSummary` mit Laufzeitkennzahlen). Kurven: Mittel je Runde, frühere Enden führen den letzten Wert fort.

## Task 7: Bericht und Ausgabe

`src/report.ts` `renderReport`: Kopf mit Laufzeit, Sweep-Rangliste, je Matchup Tabellen (Siege und Intervall, Sitzvorteil, Kämpfe und Eroberungen, Produktion und Befehle je Zug, Verlauf alle zehn Runden), Fehlerliste, Lesehinweise. `src/output.ts`: Laufordner, `JsonlWriter`, JSON und Text.

## Task 8: Pool und CLI

`src/pool.ts` (Worker-Pool mit Warteschlange, ein Worker inline, abgestürzte Worker lassen die restlichen Jobs inline nachlaufen), `src/worker.ts`, `src/cli.ts` (`run`, `sweep`, `bench`; `--config`, `--seeds`, `--workers`, `--out`, `--report-dir`, `--no-report`, `--dry-run`, `--ms-per-round`; Fortschrittszeile mit Rate und Restzeit).

## Task 9: Konfigurationen

`packages/sim/configs/`: `smoke.json`, `stufen.json` (Serie A), `fraktionen.json` und `fraktionen-ffa.json` (Serie B), `persoenlichkeiten.json` (Serie C), `sweep-normal.json` (Serie D), `sweep-hard.json` und `sweep-easy.json` (Serie E).

## Task 10: Erste Serien und Auswertung

Serien A bis E fahren (6 240 Partien, zusammen rund 10 Minuten mit 28 Workern), Berichte unter `agent-os/product/ki-simulation/`, Befunde und Maßnahmenvorschläge je Stufe und Fraktion in `agent-os/product/ki-balance.md`.

## Verifikation

1. `pnpm typecheck`, `pnpm test` (neu `packages/sim` mit 24 Tests, `ai.test.ts` um zwei Tests ergänzt), `pnpm lint`.
2. `pnpm sim --config packages/sim/configs/smoke.json --workers 2`: 4 Partien, Rohdaten und Bericht.
3. Determinismus: derselbe Lauf mit 1 und mit 4 Workern liefert identische `games.jsonl` bis auf Zeiten (geprüft).
4. `pnpm sim bench`: Laufzeitkennzahlen (siehe Entscheidungen).
5. `pnpm sim sweep --config packages/sim/configs/sweep-normal.json --dry-run`: 25 Matchups (24 Rasterpunkte plus Basis).
