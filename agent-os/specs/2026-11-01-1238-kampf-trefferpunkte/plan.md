# Plan: Kampfsystem mit Trefferpunkten (Playtest Runde 2, Spec 2)

## Context

Aus `agent-os/product/playtest-runde-2.md`, Punkte 4 bis 6: Verlierer eines Kampfes werden sofort ausgelöscht, ein Angriff beendet den Zug der Einheit, der Zustand wird prozentual angezeigt. Vom Spieler vorgegeben: Trefferpunkte und Schadenswert je Typ, beide Seiten nehmen Schaden, Angriff als Aktion, die Bewegungspunkte kostet, Städte werden von Infanterie „verbraucht“ erobert.

Dies nimmt die Entscheidung „Angriff beendet den Zug, keine Angriffskosten in Bewegungspunkten“ aus `agent-os/specs/2026-10-31-0207-kampfregeln/shape.md` zurück. Domänenmatrix, Nachrücken, Gelände- und Stadtbonus sowie Stadtschaden unter Beschuss bleiben.

Stand im Code (Erkundung): `Unit.health` 0–100 skaliert Stärke und Abwehr (`engine/combat.ts` 28–46), ein `random()` je Kampf entscheidet, der Gewinner verliert `max(5, 50·(1−Chance))` Prozent, der Verlierer wird zerstört, `movesLeft = 0` (Z. 112). `hex.ts:attackTargets` hält eine zweite Kopie der Formel als Client-Fallback. Die KI gibt jeder Einheit genau einen Befehl je Runde (`ai.ts` 131–146) und filtert Ziele nach `combatChance ≥ Schwelle`. Heilung +20 je Runde in eigener Stadt (`turn.ts:82`). Der Client zeigt Prozent in `UnitPanel` (3×), `CityPanel`, Lebensbalken in `HexMap`; der Angriffsdialog in `Spielfeld.tsx` 1082–1130 zeigt `winChance`; die Kampfsequenz (`Spielfeld.tsx` 284–355) geht vom Tod des Verlierers aus (`loserGone`), Toast „Schaden: eigene −x · Gegner −y“.

## Entscheidungen (Shaping, 1. November 2026)

- **Trefferpunkte und Schaden je Typ** (Blatt des Spielers, Dampfkoloss und Wolkenkreuzer ergänzt):

| Typ | TP | Schaden | | Typ | TP | Schaden |
|---|---|---|---|---|---|---|
| Grenadiere | 1 | 1 | | Frachter | 3 | 1 |
| Panzerwagen | 2 | 1 | | Kanonenboot | 3 | 1 |
| Dampfkoloss | 3 | 2 | | Tauchboot | 2 | 3 |
| Doppeldecker | 1 | 1 | | Blitzkorvette | 8 | 2 |
| Schwerbomber | 1 | 2 | | Panzerkreuzer | 12 | 3 |
| Wolkenkreuzer | 2 | 2 | | Flugzeugträger | 8 | 1 |

- **Kampfkonzept (vom Spieler vorgegeben):** Jede Einheit hat Trefferpunkte und einen Schadenswert. Greift eine Einheit an, wird einmal die Trefferchance des Angreifers in Prozent berechnet (hier a/(a+d) aus Stärke gegen Abwehr mit den bestehenden Gelände-, Stadt- und Befestigungsboni, ohne Zustandsskalierung: beschädigte Einheiten kämpfen voll). Dann läuft der Kampf in Runden: Schafft der Angreifer in einer Runde die Trefferchance, verliert der Verteidiger den Schadenswert des Angreifers, sonst verliert der Angreifer den Schadenswert des Verteidigers. Die Trefferchance ändert sich zwischen den Runden nicht.
- **Rundenzahl:** Der Kampf läuft, bis eine Seite vernichtet ist. Eine Begrenzung auf 3 Treffer war im Shaping zunächst gewählt und wurde vom Spieler revidiert. Beide Seiten überleben einen Nahkampf also nie; Fernkampf („ranged fire“, endet beim ersten Fehlschlag) gibt es in diesem Spiel nicht und bleibt außerhalb des Umfangs. Verworfen: ein Wurf mit festem Schaden; Rundenzahl nach Stärke; 3-Treffer-Deckel.
- **Angriff kostet 1 Bewegungspunkt**, Nachrücken nach Vernichtung des Verteidigers ist frei. Grenadiere und Dampfkoloss (Bewegung 1) fahren oder greifen an; Panzerwagen (2) kann zweimal angreifen oder fahren und angreifen.
- **Stadtangriff nach Blatt:** Angriff auf eine Stadt ohne Verteidiger ist ein Wurf gegen die Stadtabwehr; die angreifende Einheit ist danach immer verbraucht. Bei Sieg wechselt die Stadt den Besitzer; ein unbeschädigter Panzerwagen oder Dampfkoloss hinterlässt Grenadiere in der Stadt, Grenadiere hinterlassen eine leere Stadt. Verteidiger in der Stadt werden vorher wie Einheiten bekämpft. Verworfen: Einrücken des Angreifers wie heute.
- **Reparatur:** +1 TP je Runde in eigener Stadt bis zum Maximum. Verworfen: volle Reparatur nach einer Runde.
- **Anzeige in Trefferpunkten** („3/5“), Angriffsdialog zeigt Trefferchance und erwartetes Ergebnis eines Angriffs statt Siegchance.
- **Außerhalb des Umfangs** (Blatt des Spielers, spätere Specs): Luftwaffenstützpunkte, Sichtbarkeit von Tauchbooten, abweichende Bewegungs- und Bauwerte, Tragfähigkeit nach Zustand.

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-11-01-HHMM-kampf-trefferpunkte/`: `plan.md`, `shape.md` (Entscheidungen oben, Regelmodell, Verworfenes, Rücknahme aus Kampfregeln-Spec), `standards.md` (Repo-Konventionen: Regeln in `packages/shared`, Design-Übergabe nur minimal anfassen, Komponenten tonlos, Vitest), `references.md` (Kampfregeln-Spec, `combat.ts`, `hex.ts`, `ai.ts`, Spielfeld-Komponenten, Tests), `visuals/` (Screenshots Angriffsdialog, Einheitenpanel mit TP, Toast nach mehrrundigem Kampf, Kompendium; Playwright-Rezept aus Memory). Danach `playtest-runde-2.md`, `roadmap.md` (Phase 1c Punkt 2) und README (Abschnitt Spielregeln/Kampf) nachziehen; in der Kampfregeln-Spec `shape.md` einen Hinweis auf die Rücknahme ergänzen.

## Engine (Tasks 2 bis 6)

### Task 2: Stammdaten und Einheitenzustand

- `packages/shared/src/compendium/types.ts` (`UnitType` 45–68) und `data.json` (alle 12 Typen): `hitPoints`, `damage` nach `defense` (Tabelle oben). `game/types.ts` `UnitType` (92–109) und `catalog.ts` `UNIT_TYPES`-Mapping nachziehen. Da `data.json` per Cast geladen wird, Test „alle `UNIT_TYPES` haben `hitPoints ≥ 1` und `damage ≥ 1`“.
- `game/types.ts` `Unit` (148–160): `health` (0–100) ersetzen durch `hp` (aktuelle Trefferpunkte, ≥ 1 solange lebend). Erzeuger auf `hp: type.hitPoints`: `engine/create.ts:121`, `engine/turn.ts:95`, `__tests__/fixtures.ts` `unit()`, `game/__tests__/fuel.test.ts:20`. `game/demo-data.json` 14 Stellen mit `max(1, round(health/100 · hitPoints))` (u2 Panzerwagen 80 → 2, u4 Kanonenboot 70 → 2, u9 Dampfkoloss 60 → 2, Grenadiere 40 → 1, e1 Panzerkreuzer → 12, Flugzeugträger → 8 …).
- Reparatur `turn.ts:80-82`: `if (inOwnCity) u.hp = min(type.hitPoints, u.hp + 1)`.
- Migration in `engine/state.ts` `normalizeState` (nach der Städte-Schleife): fehlt `hp`, dann `hp = max(1, min(max, round((health ?? 100)/100 · max)))`, `health` löschen. `normalizeState` läuft an allen Ladepunkten (`apps/server/src/matches/repository.ts:28`, `service.ts:159`, Lobby, Benachrichtigungen), keine Server- oder DB-Änderung.

### Task 3: Odds-Funktion in `game/rules.ts`

Dort, nicht in `combat.ts`, weil `hex.ts` (Client-Fallback) `rules` importiert und `combat.ts` `hex` importiert (sonst Zyklus).

```ts
export interface CombatOdds {
  hitChance: number          // je Runde (Stadt: Eroberungschance)
  killChance: number         // Verteidiger vernichtet (Stadt: erobert); Nahkampf: deathChance = 1 − killChance
  deathChance: number        // Angreifer verloren (Stadt: immer 1)
  expectedDamageTaken: number // erwartete eigene TP-Verluste über den ganzen Kampf (Stadt: attackerHp)
}
export function exchangeOdds(a, d, attackerHp, attackerDamage, defenderHp, defenderDamage): CombatOdds
export function cityAttackOdds(hitChance, attackerHp): CombatOdds   // { hitChance, killChance: hitChance, deathChance: 1, taken: attackerHp }
```

`exchangeOdds` rechnet exakt per dynamischer Programmierung über den Zustand (i Treffer des Angreifers gelandet, j Treffer des Verteidigers gelandet): `p = a/(a+d)`, `k = ceil(defenderHp/attackerDamage)` nötige Angreifertreffer, `m = ceil(attackerHp/defenderDamage)` nötige Verteidigertreffer. `killChance = Σ_{j<m} C(k−1+j, j) · p^k · (1−p)^j`, `deathChance = 1 − killChance`; `expectedDamageTaken` aus derselben Verteilung (bei Sieg j·defenderDamage gedeckelt auf attackerHp, bei Niederlage attackerHp). Keine Aufzählung von Trefferfolgen nötig (Panzerkreuzer gegen Flugzeugträger braucht bis zu 14 Runden). Referenzwerte: a = d, 1 TP/1 Schaden beidseits → hitChance 0,5, kill 0,5, death 0,5, taken 0,5; Panzerwagen (a 4, 2 TP, 1) gegen Grenadiere (d 2, 1 TP, 1) → p 2/3, kill 8/9, death 1/9, taken 4/9; Panzerkreuzer (12 TP, 3) gegen Blitzkorvette (8 TP, 2) bei p 0,5: k 3, m 6, kill = Σ_{j<6} C(2+j, j)/2^(3+j) ≈ 0,855.

### Task 4: Kampfauflösung `engine/combat.ts`

- `attackValue`/`defenseValue` (28–46): Faktor `health/100` entfernen, Boni bleiben. `combatChance` behalten (Trefferchance je Runde; bestehende 4/6-Tests bleiben gültig). `winnerDamage` löschen. Neu exportiert (auch in `engine/index.ts`): `combatOdds(state, attackerId, target)` → `exchangeOdds(a, d, attacker.hp, aType.damage, defender.hp, dType.damage)` bzw. `cityAttackOdds(a/(a+CITY_DEFENSE+fortification), attacker.hp)`.
- `resolveCombat` neu:
  - Kosten: `movesLeft = max(0, movesLeft − 1)`, Flugzeuge zusätzlich `fuel − 1` (Entscheidung: ein Zug = ein Treibstoff wie in `walk()`), `order = none`.
  - Einheit: bei Belagerung `damageCity` einmal wie heute. `p = combatChance` einmal berechnet; Schleife `while attacker.hp > 0 && defender.hp > 0`: `random(state) < p` → Verteidiger −`aType.damage`, `hits.push('attacker')`, sonst Angreifer −`dType.damage`, `hits.push('defender')`. Genau eine Seite wird vernichtet (`destroyUnit`); `advanced` nur wenn der Verteidiger vernichtet wurde und `canAdvance` (Nachrücken bewegungskostenfrei, Flugzeug zahlt 1 Treibstoff wie heute).
  - Stadt ohne Verteidiger: `damageCity`, ein Wurf `captured = random < p`, `hits = [captured ? 'attacker' : 'defender']`, `leavesGarrison = captured && aType.hitPoints > 1 && hp0 === aType.hitPoints` (generisch: unbeschädigter Panzerwagen oder Dampfkoloss, nie Grenadiere). `destroyUnit(attacker)` immer (Ladung geht mit). Bei Sieg Besitzerwechsel wie heute (`ownerId`, `production = null`, `underFire = false`, `citiesCaptured++`, `knownBy`) und ggf. neue Grenadiere (`newId(state,'n')`, `hp 1`, `movesLeft 0`, `needsOrders false`) in der Stadt.
- `CombatResult` (`types.ts` 201–214) neu: `attackerUnitId`, `defenderUnitId | null`, `targetCityId | null`, `hits: ('attacker'|'defender')[]`, `attackerDamage`, `defenderDamage` (TP), `attackerDestroyed`, `defenderDestroyed`, `advanced`, `captured`, `garrisonUnitId | null`, `message`.
- Meldungen und Events (A/D = Typnamen, `delay` = „ Produktion verzögert.“ bei Belagerung):
  - Verteidiger vernichtet: Angreifer `combat` „A gegen D: Gegner vernichtet.[ Rückt nach.]“, Verteidiger `unitLost` „D wurde von <Name> vernichtet.<delay>“.
  - Angreifer vernichtet: Angreifer `unitLost` „A ist im Kampf gegen D gefallen.“, Verteidiger `combat` „D hat einen Angriff von <Name> abgewehrt.<delay>“.
  - Stadt erobert: `cityCaptured` „<Stadt> wurde erobert. Grenadiere halten die Stadt.“ bzw. „… Die Stadt ist unbesetzt.“; `cityLost` an Vorbesitzer wie heute.
  - Stadtangriff gescheitert: Angreifer `unitLost` „Der Angriff auf <Stadt> ist gescheitert.“, Vorbesitzer `combat` „<Stadt> hat einen Angriff von <Name> abgewehrt. Produktion verzögert.“
  - `ReplayAction.result = message`, `action = 'capture'` nur bei `captured`; keine Typänderung an `ReplayAction`/`GameEvent`.

### Task 5: Befehle und Vorschauen

- `engine/commands.ts`: `applyCommand` case `'attack'` (100–106) `if (combat.captured) checkVictory`. In `attack()` (235–282) nach `resolveCombat`: überlebende Einheit → `refreshNeedsOrders` (braucht bei `movesLeft > 0` weiter Befehle), `action = captured ? 'capture' : 'attack'`. Heranfahren mit `dist < movesLeft` bleibt (reserviert den Angriffspunkt).
- `hex.ts attackTargets` (222–270): `movesLeft === 0` → `moveBudget(unit) <= 0` (Flugzeug ohne Treibstoff greift nicht an), Formel ohne Zustand, `odds = preview?.odds ?? exchangeOdds(...)` bzw. `cityAttackOdds(...)`. `AttackTarget` (215): `winChance` ersetzen durch `odds: CombatOdds`, `attacker: { hp, damage }`, `defender: { hp, damage } | null`.
- `types.ts` `CombatPreview`: `winChance` → `odds: CombatOdds`. `engine/view.ts` 86–100: `odds: combatOdds(state, u.id, t)`, Skip-Bedingung `min(movesLeft, fuel ?? ∞) <= 0`.
- Server `apps/server/src/matches/service.ts` 100–115 reicht `combat` unverändert durch.

### Task 6: KI `engine/ai.ts`

- Hauptschleife (131–146): je Einheit eine innere Schleife bis `MAX_UNIT_COMMANDS = 6`: Abbruch wenn Einheit weg, `movesLeft ≤ 0`, `carriedBy`, Dauerbefehl gesetzt, `planUnit` nichts liefert, derselbe Befehl wie zuvor (blockierte Bewegung) oder `run` scheitert. Danach wie heute Wache bei Restbewegung. `skipShare`-Wurf bleibt ein Wurf je Einheit.
- Angriffsbewertung in `planUnit` Schritt 1: `score = combatOdds(...).killChance` (Chance, den Kampf zu gewinnen; bei 1-TP-Duellen gleich der alten `winChance`), die Schwellen (easy 0,7 / normal 0,55 / hard 0,45 ± Persönlichkeit) behalten ihre Bedeutung. Filter und Sortierung (`+0,25` für Städte) wie heute; bei gleichem `score` bevorzugt die KI das Ziel mit kleinerem `expectedDamageTaken`. Stadtziel nur, wenn nicht `hitPoints > 1 && hp < hitPoints` (beschädigter Panzerwagen opfert sich nicht ohne Garnison).
- Determinismus: Odds rein, neue `random`-Aufrufe nur je Runde in `resolveCombat`.

### Tests Engine

- Anpassen: `kampf.test.ts` (`attackUntil` nimmt Prädikat auf `CombatResult`; „rückt nach dem Sieg …“ erwartet `movesLeft 1`; Doppeldecker `fuel 10`; Städte-unter-Beschuss über `captured`; `winChance` → `odds.hitChance`), `engine.test.ts` describe('Kampf') (Zustandsfaktor-Teil streichen, Trefferfolge statt „Verlierer weg“, Stadteroberung: Angreifer weg, Grenadiere `p1` in der Stadt), `ai.test.ts` (Angreifer Panzerwagen gegen Grenadiere/Dampfkoloss statt `health 30`; Simulation `0 < hp ≤ hitPoints`, Seeds ggf. neu wählen).
- Neu `game/__tests__/odds.test.ts`: Referenzwerte oben, `killChance + deathChance = 1`, Monotonie in p, `cityAttackOdds`, Stammdaten-Test.
- Neu `engine/__tests__/schlagabtausch.test.ts`: Trefferfolge aus `createRng(`${seed}:${rng+k}`)` nachgerechnet; Kampf endet erst mit Vernichtung einer Seite (Panzerkreuzer gegen Blitzkorvette: `hits.length ≥ 4`, genau eine Einheit weg, TP des Überlebenden = Start − Trefferzahl · Schaden); Tauchboot 3 Schaden vernichtet Kanonenboot mit einem Treffer; Grenadiere sterben beim ersten Treffer; Angriff kostet 1 Bewegung, zweiter Angriff möglich (`needsOrders` true → false), Flugzeug −1 Treibstoff; Stadtangriff verbraucht immer, Garnison nur bei unbeschädigtem Panzerwagen/Dampfkoloss, `citiesCaptured`, Sieg geprüft; Reparatur +1 gedeckelt, außerhalb keine; Migration `health 50` → Panzerwagen 1, Flugzeugträger 4, `health 10` Grenadiere 1; Vorschau Server = Fallback ohne Bonus, abweichend mit Salzküste; KI handelt zweimal mit einem Panzerwagen.

### Risiken

- JSON-Casts (`data.json`, `demo-data.json`) fallen nicht beim Kompilieren auf: Stammdaten-Test und Demo-Seed-Test.
- `product-plan/**` ist nicht im Workspace-Build; nur Hinweis.
- Spieler, dessen letzte Einheit beim Stadtangriff aufgeht, bleibt mit der Stadt im Spiel (`updateEliminations` prüft Stadt oder Einheit): korrekt, bewusst.
- Reihenfolge: Engine zuerst (Tasks 2–6), dann Oberfläche (7–11); zwischendurch bricht der Web-Typecheck, bis Task 7 bis 9 nachziehen.

## Oberfläche

### Task 7: Zustand in Trefferpunkten

- `UnitPanel.tsx:157` `Stat label="Trefferpunkte" value={unit.hp} sub={`/${type.hitPoints}`}` wie „Bewegung 2/3“; Stapel-Chips `:206` und Ladung `:249` sowie `CityPanel.tsx:83`: `{u.hp}/{type.hitPoints}` statt `{health} %`. Neuer Stat „Schaden“ (`type.damage`) im Panel neben Stärke/Abwehr.
- `HexMap.tsx:232,256-259`: Balkenbreite `24 * hp / hitPoints`, Farbschwellen auf Anteil umstellen (>2/3 grün, >1/3 amber, sonst rose); Balken nur zeigen, wenn `hp < hitPoints` (Vollzustand bleibt ruhig, wie bisher bei 100 optional prüfen).
- Tests: `CityPanel.test.tsx:52,74` („80 %“ → „2/3“), `Spielfeld.test.tsx:494` Fixtures, `selection.test.ts:18`, `sample-data.json` Einheiten `health` → `hp`, Einheitentypen um `hitPoints`/`damage` ergänzen.

### Task 8: Angriffsdialog und Markierungen

- `Spielfeld.tsx` 1082–1130: statt „Siegchance x %“ zwei Zeilen: „Siegchance y %“ (Balken, `odds.killChance`, der Kampf endet mit der Vernichtung einer Seite) und „Trefferchance je Runde x % · Schaden je Treffer: eigene 2, Gegner 1 TP · erwarteter eigener Verlust −b TP“ (`hitChance`, Schadenswerte, `expectedDamageTaken`). Bei Stadtziel: „Eroberungschance x %“ und Warnung „Die Einheit wird dabei verbraucht“ (bei unbeschädigtem Panzerwagen/Dampfkoloss: „… hinterlässt Grenadiere“).
- `attackDetails` (`:759-775`) bleibt (Heranfahren mit `dist < movesLeft`).
- `HexMap.tsx:606-620` Markierungslabel: Siegchance `odds.killChance` in % (Einheiten) bzw. Eroberungschance (Städte); Datenquelle `AttackTarget.odds` aus `@dos/shared/game/hex` (Server-Vorschau überschreibt Fallback).
- Nach dem Angriff: keine Änderung nötig, `targets`/`reach` werden aus der neuen Sicht neu berechnet (`:182-198`); prüfen, dass `pendingAttack` und Auswahl bei verbrauchter Einheit (Stadtangriff) sauber zurückgesetzt werden (Effekt `:270-277` deckt „Einheit verschwunden“ ab).

### Task 9: Kampfsequenz und Toast

- `Spielfeld.tsx` 284–355: `loserGone` durch `defenderDestroyed`/`attackerDestroyed` aus dem neuen `CombatResult` ersetzen; `fading` = die vernichtete Einheit (Nahkampf genau eine; Stadtangriff der Angreifer). `hit`-Cues aus `hits`: höchstens 4 Blitze gleichmäßig im `blast`-Fenster verteilt (lange Kämpfe werden nicht länger animiert), `unitDestroyed` einmal bei `resolve`. Ghost zum Zielfeld nur bei `advanced`; bei `captured` ohne Nachrücken (Angreifer verbraucht) Stadtöffnung wie heute, Angreifer fadet aus.
- Toast `:927-953`: Kopf „Sieg“ (Gegner vernichtet oder Stadt erobert), „Niederlage“ (eigene Einheit verloren), Text `message`, Zeile „Schaden: eigene −x · Gegner −y TP · n Runden“.
- Wiedergabe-Overlay `:906-910` und `report.ts` nutzen weiter `ReplayAction.result` (Server-Strings); keine Strukturänderung, Texte kommen aus der Engine.
- Tests `Spielfeld.test.tsx:119,197` (Toast, Sequenz) auf neues `lastCombat` umstellen; neuer Test „nach einem Sieg mit Restbewegung bleibt die Einheit gewählt und bekommt wieder Ziele“; `data/match.test.tsx` unverändert.

### Task 10: Kompendium und Stadt-Panel

- `EinheitDetail.tsx:15-23`: `STATS` um `hitPoints` („Trefferpunkte“) und `damage` („Schaden“, Einheit „je Treffer“) ergänzen, Grid `lg:grid-cols-8`; Regeltext `:264` neu: „Ein Angriff läuft in Runden, bis eine Seite keine Trefferpunkte mehr hat; je Runde trifft entweder der Angreifer oder der Verteidiger mit seinem Schadenswert. Ein Angriff kostet einen Bewegungspunkt. Wer eine Einheit vernichtet, rückt auf ihr Feld nach. Infanterie und Panzer erobern Städte und werden dabei verbraucht; jeder Angriff auf eine Stadt verzögert dort die Produktion.“
- `UnitRow.tsx:18-23` `TP` und `SCH` ergänzen; `CityPanel.tsx:217` Bauliste `· TP {t.hitPoints}`.
- `packages/shared/src/compendium/data.json` und `compendium/types.ts` liefern die Werte (Engine-Task).

### Task 11: Ton

- `pages/useMatchAudio.ts:129-134`: `hit` bleibt `explosion-small`, `unitDestroyed` `explosion-large`; keine neuen Dateien. Kampf-Schicht wird weiter über `lastCombat` ausgelöst.

## Verifikation

1. `pnpm test` (shared: neue Kampf-, KI- und Migrationstests; web: Panel, Dialog, Sequenz, Kompendium), `pnpm typecheck`, `pnpm lint`.
2. Simulation: bestehender 40-Runden-KI-Test (`ai.test.ts:115`) läuft durch, KI nutzt mehrere Aktionen je Einheit (Test „handelt zweimal mit einer 2-Bewegung-Einheit“).
3. Container `docker compose up -d --build`: Demo-Partie, Panzerwagen greift Grenadiere an (Toast, TP-Anzeige, zweiter Angriff möglich), Grenadiere greifen eine leere Stadt an (Einheit verbraucht, Stadt erobert), Panzerkreuzer gegen Blitzkorvette (mehrere Runden, Toast nennt Rundenzahl, Überlebender zeigt reduzierte TP), Reparatur in Stadt +1 je Runde; alte Partie aus der Datenbank öffnen (Migration `health` → `hp`).
4. Screenshots für `visuals/` per Playwright (Memory-Rezept).
