# KI-Verhalten, fünfter Block: koordinierte Angriffe und Gedächtnis für Feinde im Nebel

## Context

Die KI-Blöcke 1–4 und die Inselarbeit haben alle Zielwerte in `agent-os/product/ki-balance.md` erreicht. Zwei Schwächen bleiben, und Menschen merken sie am deutlichsten:

1. **Keine Koordination.** `playAITurn` plant jede Einheit für sich (`planUnit`, Schleife über `unitIds`). Ein Angriff kommt nur zustande, wenn er sich einzeln lohnt (`attackThreshold`, `siegePaysOff`). Die KI plant also nie gezielt „erst Panzer anschlagen, dann Grenadier nachsetzen und in die Stadt einrücken“, obwohl Kämpfe seit dem Trefferpunkte-System Schaden hinterlassen. Die Belagerung zählt nur Einheiten im Abstand ≤ 2.
2. **Kein Gedächtnis.** `knowledge()` → `projectBoard` liefert fremde Einheiten nur, solange sie sichtbar sind. Städte bleiben über `knownBy` in Erinnerung, Einheiten nicht. Die KI verliert deshalb Verfolgte aus den Augen, wird an Städten überrascht und unterschätzt Verteidiger im Nebel.

Entscheidungen des Spielers (6. November 2026):
- Beide Bausteine für „normal“ und „schwer“ als Profilfelder, die Werte legt der Sweep fest; „leicht“ bleibt ohne.
- Das Gedächtnis wirkt auf Stadtbedrohung, Verfolgung, Zielwahl der Frachter und Belagerung. Die KI merkt sich nur, was sie selbst gesehen hat, sie sieht also nicht mehr als ein Mensch.
- Keine Visuals und keine neuen Referenzen. Es gelten die bisherigen Ziele: schwer gegen normal ≥ 65 % der entschiedenen Partien, Fraktionsduelle 40–60 %, Inseln und Archipel fallen nicht ab, Ø KI-Zug < 100 ms, Budget nie erschöpft.

Spec-Ordner: `agent-os/specs/2026-11-06-1851-ki-verhalten-5/`. Roadmap Phase 1c, neuer Punkt 14.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-06-1851-ki-verhalten-5/` anlegen mit:
- **plan.md**: dieser Plan
- **shape.md**: Umfang, Entscheidungen oben, Befunde im Code, „Außerhalb des Umfangs“ (Gegenbau nach Gegner-Produktion, Zielwahl im Vierer, Suche nach vorn: Ideen für spätere Blöcke)
- **standards.md**: „Keine; `agent-os/standards/` ist nicht angelegt.“
- **references.md**: siehe unten

Format wie in den Specs `2026-11-01-1610-ki-verhalten-4` und `2026-11-02-2209-ki-neutrale-inseln`.

## Task 2: Nullmessung

Vor jeder Änderung messen: `pnpm sim --config packages/sim/configs/stufen.json`, `fraktionen.json` und `inseln-vorherrschaft.json`. Dazu eine neue Kennzahl im Simulationspaket: **Angriffe je Ziel**, also wie oft ein Ziel in einem Zug von mehreren Einheiten angegriffen wurde und wie oft es danach fiel. Damit sieht man, ob die Koordination wirkt. Die Zählung kommt über den vorhandenen Hook `onCommand` in `packages/sim/src/` (wie die Zählung der Landungen). Die Werte gehen als „Vorher“ nach `ki-balance.md`.

## Task 3: Gedächtnis für Feinde im Nebel

**Spielstand** (`packages/shared/src/game/engine/state.ts`):
- Neues Feld `ParticipantState.aiMemory: RememberedUnit[] | null` mit `{ id, unitTypeId, ownerId, col, row, hp, round }`.
- Beim Normalisieren alter Stände `ps.aiMemory ??= null` (bei den übrigen `??=` um Zeile 200). Keine Migration nötig.
- `create.ts`, `demo.ts` und `tutorial.ts` setzen das Feld auf `null`.
- `engine/view.ts` bildet die Teilnehmer schon explizit ab (Zeile ~79). Das Feld geht also nicht an Clients; ein Test sichert das ab.

**Pflege** (neue Funktion `updateMemory` in `ai.ts`, aufgerufen am Anfang und am Ende von `playAITurn`):
- Sichtbare fremde Einheiten (nicht als Ladung) eintragen oder aktualisieren.
- Einträge löschen, wenn
  - ihr Feld jetzt sichtbar ist und die Einheit dort nicht steht,
  - die ID jetzt anderswo sichtbar ist,
  - sie älter als `memoryRounds` sind,
  - der Besitzer ausgeschieden oder kapituliert ist,
  - es eigene Einheiten sind (z. B. nach einer Übernahme).
- Obergrenze `MAX_MEMORY` (z. B. 200 Einträge, die ältesten fliegen raus), damit der Spielstand klein bleibt.

**Nutzung:** `Knowledge` bekommt `ghosts: Unit[]`, das sind die Erinnerungen auf Feldern, die gerade nicht sichtbar sind. Sie kommen nicht in den Wegsuche-Index `idx`. Sie fließen ein in:
- **Bedrohung und Grenze**: `threatened` und `border` in `playAITurn` zählen Geister mit (Feinde in Sicht plus Geister).
- **Verfolgung** (Schritt 2b in `planUnit`): Ist kein Feind sichtbar, wird der nächste Geist an Land angesteuert (`approach`). Kommt die Einheit an und ist der Feind weg, löscht die Pflege den Eintrag.
- **Frachterziele** (`transportTargets`): Erinnerte Landeinheiten im Abstand ≤ 1 einer Zielstadt zählen als `defenders`.
- **Belagerung** (`siegePaysOff`): Erinnerte Verteidiger in der Stadt zählen nur, wenn die Stadt nicht sichtbar ist. Sichtbare Felder haben dank der Pflege nie Geister.

Profilfeld `memoryRounds` (leicht 0; normal und schwer Startwert 5, Sweep über 0/3/5/10). Neu in `PROFILE_KEYS` (`packages/sim/src/config.ts`).

## Task 4: Koordinierte Angriffe („Schwerpunkt“)

**Kampfverteilung** (reine Funktion in `packages/shared/src/game/rules.ts`, neben `exchangeOdds`):
- `exchangeOutcomes(attack, defense, attackerHp, attackerDamage, defenderHp, defenderDamage)` liefert die Siegchance und die Verteilung der Rest-Trefferpunkte des Verteidigers, wenn der Angreifer fällt. Gleiche Herleitung wie `exchangeOdds` (negativ-binomial); `exchangeOdds` bleibt unverändert.
- `chainOdds(steps)`: dynamische Programmierung über eine Angreiferfolge. Ergebnis: Siegchance der Gruppe und erwartete Verluste.

**Planung** (neue Funktion `planStrikes` in `ai.ts`, vor der Einheitenschleife, nur wenn `profile.strike`):
1. **Kandidaten.** Für jede eigene Kampfeinheit mit Bewegung über `attackTargets` die erreichbaren Ziele sammeln. Ziele, die mindestens zwei Einheiten erreichen, sind Kandidaten. Höchstens `MAX_STRIKES` Ziele (z. B. 6) und `MAX_STRIKERS` Einheiten je Ziel (z. B. 4), wegen des Budgets.
2. **Reihenfolge.** Angreifer nach Siegchance gegen den vollen Verteidiger absteigend, Ausnahme bei Städten: Eine Einheit mit `canCaptureCities` bleibt zuletzt fürs Einrücken. Flugzeuge nur mit Rückweg-Prüfung (`fuelAfterAttack`, `returnDistance`, wie in `planUnit`).
3. **Bewertung.** Gruppen-Siegchance aus `chainOdds` ≥ `attackThreshold`. Gewinn (`unitCost` des Verteidigers + bei einer Stadt `CITY_WORTH` / Verteidiger, wenn ein Eroberer bleibt) ≥ erwartete Verluste in `unitCost`. Die Bewertung nutzt `combatOdds`, damit Fraktionsboni und Gelände stimmen. Danach Ziele nach Netto-Ertrag sortieren.
4. **Ausführung.** Schritt für Schritt über `run` mit `attack`-Befehlen. Nach jedem Kampf wird mit dem echten Zustand neu bewertet (Würfel), und die Kette bricht ab, wenn der Rest nicht mehr lohnt. Ist der Verteidiger gefallen, greift der Eroberer die leere Stadt an oder rückt ein (`cityAttackPaysOff` wie bisher).
5. Beteiligte Einheiten laufen danach normal durch die Einheitenschleife, falls sie noch Bewegung haben. Garnisonen (`garrison`) und zurückgerufene Einheiten (`recalled`) nehmen nicht teil.

`siegePaysOff` bleibt als Einzelregel bestehen. Der Schwerpunkt ergänzt sie, er ersetzt sie nicht.

Profilfeld `strike` (leicht false, normal und schwer true, Sweep an/aus) und gegebenenfalls `strikeMin` (Mindestzahl Angreifer, 2). Neu in `PROFILE_KEYS`.

## Task 5: Tests

- `packages/shared/src/game/__tests__/` (Regeln): `exchangeOutcomes` stimmt in Siegchance und Erwartung mit `exchangeOdds` überein; `chainOdds` mit zwei Grenadieren gegen einen angeschlagenen Panzer gegen von Hand gerechnete Werte.
- `packages/shared/src/game/engine/__tests__/` (bestehende KI-Tests als Vorlage), mit konstruierten Ständen:
  - Zwei Panzer und ein Grenadier knacken einen Verteidiger in einer Stadt, der Grenadier rückt zuletzt ein.
  - Bei `strike: false` greift keiner an.
  - Ein Feind, der aus der Sicht verschwindet, bleibt in `aiMemory`. Die Stadt in seiner Nähe gilt als bedroht, eine Landeinheit läuft zu seiner letzten Position. Nach `memoryRounds` und bei sichtbar leerem Feld ist der Eintrag weg.
  - `aiMemory` erscheint nicht in der Spieleransicht aus `engine/view.ts`.
  - Alte Spielstände ohne `aiMemory` laufen.
- Typecheck je Paket einzeln (`pnpm --filter @…/shared typecheck`, dann `sim`, dann `server`), nicht `pnpm -r`.

## Task 6: Sweep, Werte festlegen, Nachmessung

- Sweep-Configs `packages/sim/configs/sweep-hard-7.json` und `sweep-normal-2.json` über `strike` und `memoryRounds`, gegen „normal“ beziehungsweise „leicht“ und gegen `sparring.json`.
- Werte je Stufe in `aiProfile` übernehmen (mit Kommentar zum Sweep-Ergebnis, wie bei den bisherigen Feldern).
- Nachmessung mit `stufen.json`, `fraktionen.json`, `inseln-vorherrschaft.json` und `archipel.json`. Ziele wie im Context-Abschnitt, dazu die Zugdauer (Ø und p95) aus den Rohdaten.
- Abschnitt „Nachmessung 5“ in `agent-os/product/ki-balance.md`, Roadmap Phase 1c Punkt 14 als erledigt eintragen, `shape.md` um Sweep-Befunde und Verworfenes ergänzen.

## References (für references.md)

- `packages/shared/src/game/engine/ai.ts`: `playAITurn` (Bedrohung, Garnison, Rückruf, Einheitenschleife), `planUnit` (Angriff Schritt 1, Verfolgung 2b), `siegePaysOff`, `cityAttackPaysOff`, `transportTargets`, `unitCost`, `approach`
- `packages/shared/src/game/rules.ts`: `exchangeOdds`, `cityAttackOdds`
- `packages/shared/src/game/engine/combat.ts`: `combatOdds`
- `packages/shared/src/game/hex.ts`: `attackTargets`, `reachableTiles`
- `packages/shared/src/game/engine/view.ts`: `projectBoard` (Nebel, `knownBy` für Städte), Teilnehmer-Abbildung
- `packages/shared/src/game/engine/state.ts`: `ParticipantState`, `seenAtTurnEnd` als Vorbild für gespeichertes Wissen, Normalisierung
- `packages/sim/src/config.ts`: `PROFILE_KEYS`
- Vorgänger-Specs `2026-11-01-1430-ki-verhalten-2` bis `2026-11-02-2209-ki-neutrale-inseln`

## Verification

1. Neue Tests grün: `pnpm --filter <shared> test`, plus die bestehenden KI- und Engine-Tests.
2. Typecheck für `shared`, `sim` und `server` je einzeln.
3. `pnpm sim` über die vier Configs in Task 6. Alle Zielwerte erfüllt, Ø KI-Zug < 100 ms, Budget nie erschöpft, die Kennzahl „Angriffe je Ziel“ zeigt Mehrfachangriffe mit Eroberung.
4. Kurz im echten Spiel: lokale Partie gegen „schwer“ starten (`run`-Skill), eine Einheit vor einer KI-Einheit zeigen und in den Nebel zurückziehen. Die KI soll folgen, und die KI-Züge sollen im Worker ohne Zeitüberschreitung durchlaufen.
5. Commit nur auf Nachfrage; Push nach `main:dev`, nicht auf `main` (Deploy).
