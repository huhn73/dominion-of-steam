# KI-Verhalten, sechster Block: Sammeln vor dem Angriff

## Context

Nachmessung 5 (`agent-os/product/ki-balance.md`) hat gezeigt: Koordinierte Angriffe lösen selten aus, weil Einheiten einzeln an verteidigten Städten ankommen. `planUnit` Schritt 2 (`packages/shared/src/game/engine/ai.ts`) schickt jede Eroberungseinheit per `goto` direkt auf ein Nachbarfeld der nächsten fremden Stadt (`approach`). Dort steht sie allein, die Belagerung (`siegePaysOff`) verlangt mehr als `siegeRatio` × Verteidiger Einheiten im Abstand ≤ 2, also wartet sie neben der Stadt, wo die Verteidiger sie angreifen können. „Belagerung ohne Übermacht füttert Einheiten einzeln“ war schon in Block 2 ein Befund.

Ziel: Einheiten sammeln sich außer Reichweite vor einer verteidigten Stadt und rücken gemeinsam vor, sobald genug da sind. Dann greifen Belagerung und Schwerpunkt aus Block 5. Der Spieler hat diese Folge-Spec gewählt (6. November 2026). Es gelten die bisherigen Ziele: schwer gegen normal ≥ 65 % der entschiedenen Partien, Fraktionsduelle 40–60 %, Inseln und Archipel fallen nicht ab, keine Zunahme der Rundenlimit-Enden, Zugdauer unverändert.

Spec-Ordner: `agent-os/specs/2026-11-06-2027-ki-sammeln/`. Roadmap Phase 1c, Punkt 15.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-06-2027-ki-sammeln/` mit `plan.md` (dieser Plan), `shape.md` (Umfang, Befund aus Nachmessung 5, Entscheidungen; außerhalb des Umfangs: Sammeln vor Feldarmeen, Sammeln für Landungen), `standards.md` („Keine; `agent-os/standards/` ist nicht angelegt.“), `references.md`. Format wie `2026-11-06-1851-ki-verhalten-5`.

## Task 2: Kennzahl und Nullmessung

- Neue Kennzahl im Simulationspaket: **Verluste vor Städten**, also eigene Einheiten, die im Abstand ≤ 2 einer fremden Stadt vernichtet wurden, ob als Angreifer oder als Angegriffene. Zählung in `packages/sim/src/collector.ts` aus `outcome.combat` (Feld des Verlierers gegen `prev.cities`), dann `aggregate.ts` und die Kampftabelle in `report.ts`, wie „Mehrfachangriffe“.
- Nullmessung mit `stufen`, `fraktionen`, `inseln-vorherrschaft` und `archipel`, wieder in einer Kopie des Repos im Scratchpad, damit Codeänderungen die laufende Messung nicht verfälschen. Rundenlimit-Enden mit erfassen.

## Task 3: Sammeln in `ai.ts`

**Profilfeld `musterDistance`** (Abstand der Sammelfelder zur Stadt; 0 = aus). Startwert für normal und schwer 3, leicht 0. Neu in `PROFILE_KEYS` und in der Validierung in `packages/sim/src/config.ts` (ganze Zahl ≥ 0).

**In `planUnit` Schritt 2**, nachdem die Zielstadt gewählt ist, nur für Landeinheiten mit `canCaptureCities` und `strength > 0`:
1. **Verteidiger** der Stadt `d`: sichtbare fremde Einheiten auf dem Stadtfeld plus Geister (`k.ghosts`) dort. Bei `d = 0` (auch bei allen neutralen Städten) wie bisher direkt anrücken.
2. **Bedarf** `need = floor(siegeRatio × d) + 1`, dieselbe Bedingung wie in `siegePaysOff`.
3. **Versammelt**: eigene Land-Kampfeinheiten (nicht geladen) im Abstand ≤ `musterDistance + 1` zur Stadt, die Einheit selbst eingeschlossen.
4. **Kein Warten ohne Aussicht:** Gibt es auf derselben Landmasse (`k.masses`) nicht mindestens `need` eigene Land-Kampfeinheiten außerhalb von Garnisonen, wird nicht gewartet. Das verhindert, dass eine kleine Armee ewig vor einer Stadt steht.
5. Ist `versammelt ≥ need`, wie bisher anrücken (`approach`).
6. Sonst:
   - Steht die Einheit weiter weg als `musterDistance`, `goto` auf das nächste erreichbare Landfeld im Abstand genau `musterDistance` zur Stadt (`tilesNear` aus `hex.ts`, Prüfung mit `findPath`, höchstens `MAX_APPROACHES` Kandidaten).
   - Steht sie näher, wartet sie mit `skip`.

**Warten ohne Wache:** `skip` statt `sentry`, weil „normal“ Einheiten auf Wache nie neu plant (`replan: 'goto'`). In der Einheitenschleife von `playAITurn`:
- Ein `skip` beendet die Befehlsschleife der Einheit.
- Das abschließende `sentry` entfällt, wenn die Einheit `skipped` ist.
- `skipped` wird zu Rundenbeginn zurückgesetzt (`turn.ts`), die Einheit wird also nächste Runde neu geplant.

Wiederverwenden: `approach`, `findPath`, `tilesNear`, `fitsDomain`, `k.ghosts`, `k.masses`/`massOf`, `garrison`-Menge (als Parameter an `planUnit` durchreichen oder über die Zählung „nicht auf Wache in eigener Stadt“ annähern).

## Task 4: Tests (`packages/shared/src/game/engine/__tests__/ki-sammeln.test.ts`)

Konstruierte Stände auf `PLAINS` (oder einer breiteren Karte, falls die 8×6-Felder für Abstand 3 plus Anmarsch nicht reichen):
- Ein Grenadier weit vor einer feindlichen Stadt mit einem Verteidiger, zwei weitere eigene Grenadiere weiter hinten auf derselben Landmasse: Er geht auf ein Feld im Abstand 3 und wartet dort mit `skipped`, nicht auf Wache.
- Drei eigene Einheiten im Abstand ≤ 4: Sie rücken an (bei `normal` reicht 3 > 2 × 1).
- Nur eine eigene Einheit auf der Landmasse: Sie rückt wie bisher direkt an.
- Unverteidigte oder neutrale Stadt: direktes Anrücken.
- `musterDistance: 0` schaltet das Sammeln ab.
- Eine wartende „normal“-Einheit wird in der nächsten Runde neu geplant (nach `endTurn` bis zum eigenen Zug), sie bleibt nicht auf Wache hängen.

## Task 5: Sweep, Werte, Nachmessung

- Sweeps `packages/sim/configs/sweep-ki6-normal.json` (Referenz „normal“ mit `musterDistance: 0`) und `sweep-ki6-hard.json` (Referenz „normal“ mit Vorgaben), Raster `musterDistance` [0, 2, 3, 4], 100 Seeds (200 Partien je Punkt), Karte „Mittel“. Dazu ein Lauf auf Inseln über `inseln-vorherrschaft.json`, weil Landungen anders ankommen.
- Werte in `aiProfile` setzen, mit Kommentar zum Sweep-Ergebnis. Zeigt der Sweep keinen Effekt oder Verluste, wird das Sammeln ausgeschaltet (0) und der Befund dokumentiert.
- Nachmessung mit den vier Serien aus Task 2. Zugdauer bei gleicher Worker-Zahl vergleichen (Lehre aus Block 5: unterschiedliche Worker-Zahlen verfälschen die ms-Werte).
- Abschnitt „Nachmessung 6“ in `ki-balance.md`, Roadmap-Punkt 15, Befunde in `shape.md`.

## Verification

1. `pnpm test` und `pnpm typecheck` in `packages/shared` und `packages/sim`, Typecheck in `apps/server`, je Paket einzeln.
2. Sweeps und Nachmessung wie in Task 5. Ziele: keine Quote außerhalb der Zielbänder, Rundenlimit-Enden nicht mehr als vorher, „Verluste vor Städten“ sinken bei eingeschaltetem Sammeln.
3. Commit, dann Push nach `main:dev` erst nach Rückfrage.
