# KI erobert neutrale Inseln

## Context
Das ist Roadmap Phase 1c, Punkt 13, und schließt die Phase ab.

Seit der Spec `2026-11-02-1952-enden-inselwelten` gibt es die Siegbedingung Vorherrschaft (50 % der Städte auf Inseln und Archipel). Trotzdem endet das ausgeglichene Duell Aurelia gegen Eisenbund auf dem Archipel nur zu **21 %** vor Runde 150. Auf Inseln sind es 53 %, auf dem Kontinent 91 % (`agent-os/product/ki-balance.md`, „Nachmessung Enden“). „Normal“ kommt ab Runde 80 nicht über etwa 6,5 Städte hinaus, hortet aber 50 bis 80 Einheiten.

Befund in `packages/shared/src/game/engine/ai.ts`:
- **Zielwahl:** `planTransport` (ca. Z. 601) schickt beladene Frachter zur *nächstgelegenen* fremden Stadt. Ob sie neutral ist oder verteidigt, spielt keine Rolle. Den `neutralBias` gibt es nur beim Landmarsch (Z. 846).
- **Möglicher Hänger bei der Landung:** `planCargo` (ca. Z. 694) lässt Ladung nur auf Landmassen ohne eigene Stadt an Land (`!homeMasses.has(mass)`). Hat die KI auf einer Insel schon eine Stadt, liegt der Frachter vor deren übrigen Städten und die Ladung bleibt an Bord.
- **Aufklärung:** Zur See erkundet höchstens ein Kanonenboot, und nur solange `fogLeft` gilt. Neutrale Städte auf unentdeckten Inseln kennt die KI nicht. `overseasCities` und die Frachter-Produktion reagieren nur auf bekannte Städte.
- **Vorherrschaft:** Die KI weiß nichts von ihr. Sie baut nicht mehr Frachter, wenn die Mehrheit greifbar ist, und hält gewonnene Städte nicht gezielt.

## Entscheidungen
- Die Spec umfasst alle vier Hebel: Zielwahl, Landungsfehler, Vorherrschaft im Blick, Seeaufklärung.
- Sie gilt für die Stufen **normal und schwer**. „Leicht“ bleibt ohne Transporte.
- **Ziele:**
  - Das ausgeglichene Duell auf dem Archipel endet zu **≥ 50 %** vor Runde 150.
  - Inseln (heute 53–71 %) und Kontinent (86–91 %) fallen nicht ab.
  - „Schwer“ gewinnt gegen „normal“ weiter ≥ 65 % der entschiedenen Partien.
  - Fraktionsduelle bleiben bei 40–60 %.
  - Ø KI-Zug bleibt unter 100 ms, und `Budget erschöpft` bleibt 0.

## Task 1: Spec-Dokumentation speichern
Ordner `agent-os/specs/2026-11-02-2209-ki-neutrale-inseln/` mit:
- `plan.md`: dieser Plan
- `shape.md`: Befund mit Messwerten, die Entscheidungen von oben, verworfene Optionen (keine Regeländerung an der Vorherrschaftsschwelle)
- `references.md`: `ai.ts` (`planTransport`, `planCargo`, `planWarship`, `chooseProduction`, `overseasCities`, `landmasses`), `victory.ts` (`dominanceShare`, `updateDominance`), `rules.ts` (`DOMINANCE_SHARE`), `packages/sim` (`collector.ts`, `report.ts`, `config.ts` `PROFILE_KEYS`), die Specs `ki-verhalten-2` (Landungen) und `inselbalance-tarnung` (Geleit)
- `standards.md`: Vermerk, dass es kein `agent-os/standards/` gibt
- keine Visuals

## Task 2: Diagnose in der Simulation
Ziel ist, vor jeder Verhaltensänderung zu messen, wo die Zeit verloren geht.
- `packages/sim/src/collector.ts` und `aggregate.ts` erfassen je Partie:
  - Landungen (Ladung geht an fremder Küste an Land)
  - Frachter-Runden mit Ladung ohne Fahrt („wartet beladen“)
  - eroberte neutrale Städte auf fremden Landmassen
- In `report.ts` kommt eine Spalte bzw. Zeile dazu, außerdem „Spielende“ getrennt nach Karte, falls das noch nicht so ist.
- Lauf von `pnpm sim --config packages/sim/configs/inseln-vorherrschaft.json` als Ausgangswert. Bestätigt sich der Hänger aus `planCargo` („wartet beladen“ hoch), wird er zuerst behoben.

## Task 3: Landung und Zielwahl der Frachter (`ai.ts`)
**Landung:** `planCargo` landet auf jeder Landmasse, auf der eine *fremde* Stadt liegt, auch wenn dort schon eine eigene steht. Die Bedingung `!homeMasses.has(mass)` wird ersetzt durch „Landmasse ≠ Herkunftsinsel der Ladung oder fremde Stadt auf der Landmasse“. Liegt die Zielstadt direkt neben dem Frachter, greift Schritt 1 (Angriff von Bord) wie bisher.

**Zielwahl:** Neue Funktion `transportTarget(k, playerId, unit, profile)` ersetzt die Sortierung nach Entfernung. Bewertung je bekannter fremder Stadt auf einer anderen Landmasse:
- Wert: `CITY_WORTH.neutral` oder `CITY_WORTH.enemy`
- plus Zuschlag für weitere fremde Städte auf derselben Landmasse (eine Insel mit 3 neutralen Städten zählt mehr)
- minus Abschlag je sichtbarem Verteidiger in oder an der Stadt
- geteilt durch die Fahrstrecke (`hexDistance` zum nächsten Küstenfeld)
- Kandidaten bleiben auf `MAX_CANDIDATES` begrenzt, Pfadsuche wie heute über `shoreTiles` und `findPath`.

**Ladeziel:** Kein Teil des Frachters, sondern der Landeinheiten. Schritt 2a in `planUnit` sucht schon „Städte jenseits des Wassers“. Das bleibt, nur wird der Frachter bevorzugt, der zum Ziel mit dem besten Wert unterwegs ist.

**Abfahrtsschwelle:** `loaded` (heute ≥ 3 Einheiten) sinkt auf 2, wenn das Ziel neutral und unverteidigt ist. Gegen neutrale Städte reichen Grenadiere.

## Task 4: Seeaufklärung (`ai.ts`)
- `chooseProduction`: Solange `fogLeft` gilt und mindestens eine Küste ans Unbekannte grenzt, baut die KI bis zu `maxScoutShips` Kanonenboote zum Erkunden. Der Wert ist neu im Profil: normal 1, schwer 2, „Seekrieg“ +1. Heute ist es höchstens ein Schiff und nur, wenn noch gar keins existiert.
- `planWarship`: Ein Kriegsschiff ohne Konvoi mit Ladung und ohne Beute in Sicht erkundet. Es fährt mit `frontierNear` zum nächsten Wasserfeld am Rand des Unbekannten, statt untätig zu bleiben. Höchstens ein Schiff je Konvoi bleibt als Geleit, die übrigen erkunden.
- Die neuen Profilfelder kommen in `PROFILE_KEYS` (`packages/sim/src/config.ts`), damit man sie rastern kann.

## Task 5: Vorherrschaft im Blick (`ai.ts`)
- Neue Hilfsfunktion `dominanceGap(k, state, playerId)`. Sie nutzt nur, was die eigene Sicht zeigt: bekannte Städte und deren Besitzer sowie `view.dominance`. Die Schwelle kommt aus `dominanceShare(state)` (`victory.ts`). Wenn die Sicht die Gesamtzahl der Städte nicht hergibt, wird sie aus den bekannten Städten geschätzt (das ist im Code zu prüfen). Ergebnis: Wie viele Städte fehlen bis zur Schwelle?
- Das Profilfeld `dominanceDrive` ist bei normal und schwer an, bei leicht aus, und nur aktiv, wenn `rules.victoryCondition === 'dominance'`. Gilt `gap ≤ max(2, 25 % der eigenen Städte)`, ändert sich das Verhalten:
  - `maxTransports` steigt um 1, und Frachter haben in Küstenstädten Vorrang vor weiteren Panzerwagen.
  - Die Abfahrtsschwelle sinkt auf 2 Einheiten.
  - Gegen neutrale Städte wirkt `neutralBias` mindestens 3, an Land wie zur See.
- Hält die KI selbst die Vorherrschaft (`view.dominance` auf sie), läuft `defend`/`garrisonTarget` wie bei bedrohten Städten für alle Städte mit sichtbarem Feind. Damit soll der Countdown nicht mehr leicht kippen.
- Hält ein Gegner die Vorherrschaft, bekommen dessen Städte in der Zielwahl (Task 3) einen Zuschlag. Ein Bruch des Countdowns zählt mehr als eine neutrale Stadt.

## Task 6: Messen und nachjustieren
- Nach jedem Task 3–5 läuft `pnpm sim --config packages/sim/configs/inseln-vorherrschaft.json`, danach `stufen.json` und `fraktionen.json` gegen die Ziele aus „Entscheidungen“.
- Wird ein Ziel verfehlt, zuerst rastern mit Sweep-Konfigurationen nach dem Muster `sweep-transporte-*.json` über `maxTransports`, `maxScoutShips` und den Abfahrtswert, erst dann Logik ändern.
- Ergebnis kommt als „Nachmessung neutrale Inseln“ in `agent-os/product/ki-balance.md`, mit Tabelle wie bei „Nachmessung Enden“.

## Task 7: Tests und Doku
- `packages/shared/src/game/engine/__tests__/ai.test.ts` mit kleinen Hand-Karten:
  - Ladung landet auf einer Insel mit eigener Stadt, wenn dort eine neutrale liegt.
  - Der Frachter wählt die unverteidigte neutrale Insel vor einer näheren verteidigten Feindstadt.
  - Ein Kriegsschiff ohne Konvoi fährt in den Nebel.
  - Mit `dominance` und kleiner Lücke baut die Küstenstadt einen Frachter. Ohne `dominance` passiert das nicht.
  - „Leicht“ ist unverändert.
- Sim-Tests für die neuen Kennzahlen, falls `packages/sim` Tests für den Collector hat.
- Doku:
  - In `agent-os/product/roadmap.md` 1c Punkt 13 abhaken, mit Messwerten.
  - In `ki-balance.md` die Nachmessung eintragen.

## Verification
- `pnpm lint`, Typecheck je Paket einzeln (nicht `pnpm -r typecheck`), `pnpm test` in shared und sim.
- Simulationsläufe aus Task 6 mit erfüllten Zielwerten. Die Berichte landen in `agent-os/product/ki-simulation/`.
- Stichprobe im Spiel: Archipel-Partie gegen „normal“ im Container. Die KI landet auf neutralen Inseln und erkundet mit Schiffen.
- Commit auf main, dann `git push origin main:dev`. Vorher `git log` prüfen, weil parallele Sessions auf main arbeiten.

> **Nachtrag nach der Umsetzung (2. November 2026):**
> - Das Ladeziel der Landeinheiten (Task 3) bleibt unverändert. Einheiten steigen weiter in den nächsten Frachter mit Platz, das Ziel wählt der Frachter.
> - Den Halter der Vorherrschaft bekommt die KI über ihr Wissen (`Knowledge.holder`) aus dem Zustand mit, weil die reduzierte Sicht `dominance` nicht enthält. Die Information ist öffentlich.
> - Die Gesamtzahl der Städte gilt als öffentlich, die Meldungen zur Vorherrschaft nennen ohnehin Anteile.
> - Die Reichweite der Vorherrschaft liegt bei höchstens 3 fehlenden Städten oder der Hälfte der eigenen Städte.
> - Ergebnis: Archipel im ausgeglichenen Duell 22 → 54 % (zwei Läufe, 140 Partien), weitere Werte in `ki-balance.md`, „Nachmessung neutrale Inseln“.
