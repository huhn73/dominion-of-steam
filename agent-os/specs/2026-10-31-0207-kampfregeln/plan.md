# Spec: Kampfregeln (Playtest Runde 1, Spec 1)

## Context

Die erste gespielte Runde nach dem MVP (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 1“) hat fünf Regel-Lücken in der Kampf-Engine gezeigt. Die Startstädte-Prüfung (Punkt 0 der Roadmap-Phase 1b) ist erledigt: kein Bug, bereits dokumentiert (uncommittete Änderungen in `roadmap.md` und `playtest-runde-1.md`).

Heutiger Stand der Engine (`packages/shared/src/game/`):
- Angriffslegalität liegt in **einer** gemeinsamen Funktion `attackTargets` (`hex.ts:221-265`), die Engine (`engine/commands.ts:231`), KI (`engine/ai.ts:203`), Server-Vorschau (`engine/view.ts:79-94`) und Web-Client (`Spielfeld.tsx:131,357`) nutzen. `fitsDomain` prüft nur das Gelände des Zielfelds, nie die Domäne der Zieleinheit.
- `resolveCombat` (`engine/combat.ts:71-186`): Alles-oder-nichts, Sieger verliert `max(5, 50·(1−chance))` HP, Angreifer hat danach 0 Bewegung. Nach Sieg gegen eine Einheit bleibt der Angreifer stehen; nur Stadteroberung zieht ein.
- Heranfahren bei entferntem Ziel ist in `commands.ts:240-255` bereits umgesetzt (Reichweite ist fest 1). Beobachtung 3 ist damit nur noch Anzeige: der Angriffsdialog sagt nicht, dass die Einheit heranfährt.
- Boni: nur Stadt +1 Abwehr plus `fortification` (Salzküste +1). Gelände wirkt nicht. Die Fallback-Siegchance in `hex.ts:246-261` dupliziert die Formel ohne Boni.
- `CityState` (`engine/state.ts:106-110`) hat keine Produktivität; `startTurn` (`engine/turn.ts:81-109`) zählt Produktion stur herunter.

**Shaping-Entscheidungen (mit dem Nutzer abgestimmt):**
- **Domänen:** Klassisch. Land greift Land, Flugzeuge am Boden **und Schiffe auf benachbarten Feldern** (Küstengewässer wie Hafenstädte) an. See greift See, Landeinheiten auf Küstenfeldern und Flugzeuge an; **Tauchboot nur Schiffe**; Frachter (Stärke 0) nie. Luft greift alles an. Städte erobern weiterhin nur Einheiten mit `canCaptureCities`.
- **Nachrücken:** Nach Sieg gegen eine Einheit rückt der Angreifer auf das Zielfeld, wenn er es betreten darf (Domäne), kein weiterer Gegner darauf steht und dort keine fremde Stadt liegt (Stadt bleibt eigener Angriff mit eigener Chance). Angriff beendet den Zug der Einheit (0 BP, wie heute). Flugzeuge zahlen 1 Treibstoff fürs Nachrücken; Ladung zieht mit.
- **Boni (additiv auf Abwehr):** Wald +1, Hügel +1, Gebirge +2, nur für Landeinheiten als Verteidiger. Stadt +1 für alle Einheiten darin (bestehend; Salzküste zusätzlich +1). Kein Angriffsbonus. Flugzeuge und Schiffe erhalten keinen Geländebonus.
- **Produktivität:** Schadenswert 0–3 je Stadt. Jeder Angriff auf die Stadt oder eine Einheit darin: Schaden +1 (max. 3) und laufende Produktion +1 Runde. Neue Bauaufträge (auch der automatische Neustart) dauern Basis + Schaden Runden. Jede eigene Runde ohne Angriff heilt 1 Punkt. Schaden überlebt eine Eroberung. Anzeige im Stadt-Panel.
- **Out of scope:** Fernkampf (`range` > 1), Angriffskosten in BP, Kampfanimation (Spec 2), Rundenbericht (Spec 3), neue Ereignistypen, KI-Stellungsspiel (Hügel suchen).

## Task 1: Save spec documentation

Create `agent-os/specs/2026-10-31-0207-kampfregeln/` im Format der bisherigen Specs (plan.md englisch wie `2026-10-30-1732-spielfeld-engine/plan.md`; shape.md, references.md, standards.md deutsch):
- **plan.md**: dieser Plan.
- **shape.md**: `# Kampfregeln: Shaping-Notizen` mit `## Umfang`, `## Entscheidungen`, `## Regelmodell` (Domänenmatrix, Nachrück-Bedingungen, Bonus-Tabelle, Schadensmodell), `## Kontext` (Visuals: keine, keine neuen Screens; Referenzen: siehe references.md; Produktbezug: Roadmap Phase 1b Punkt 1, Playtest-Dokument), `## Angewandte Standards`: „Noch keine, siehe standards.md“.
- **standards.md**: `agent-os/standards/` existiert nicht; Konventionen: Prettier (`semi: false, singleQuote, printWidth 100`), `strict` TypeScript, `pnpm lint`/`typecheck`/`test`.
- **references.md**: `### Kampf-Engine` (`engine/combat.ts`, `hex.ts attackTargets`), `### Stadteroberung als Vorbild fürs Nachrücken` (`combat.ts:144-168`), `### Faction-Bonus` (`bonus.ts`, `combat.ts fortification`), `### Kompendium-Bonusanzeige` (`apps/web/src/sections/fraktionen/components/theme.ts bonusEffect`), `### Design-Übergabe` (`product-plan/instructions/incremental/02-spielfeld-and-zuge.md:159-163`: Formel „Stärke × Zustand gegen Abwehr × Zustand, +1 Abwehr in Städten“).
- **visuals/**: leer anlegen (`.gitkeep`), nach Umsetzung Screenshots `umsetzung-angriff.png`, `umsetzung-stadt-schaden.png`, `umsetzung-kompendium.png`.

## Task 2: Gemeinsames Regelmodul `packages/shared/src/game/rules.ts`

Neue, zustandsfreie Datei, von Engine und Web genutzt (Export über `packages/shared/src/game/index.ts`):
- `TERRAIN_DEFENSE: Record<Terrain, number>` = deepSea 0, shallows 0, plains 0, forest 1, hills 1, mountains 2.
- `CITY_DEFENSE = 1`, `MAX_CITY_DAMAGE = 3`.
- `canAttack(attacker: UnitType, target: UnitType, targetTile: Terrain, coastal: boolean): boolean` – Matrix:
  - `attacker.strength === 0` → false.
  - land → land: true; → air: nur wenn `!isWater(targetTile)` (Flugzeug am Boden/über Land); → sea: true (Ziel ist durch Reichweite 1 immer benachbart).
  - sea → sea: true; → land: nur `coastal` (Zielfeld hat Wasser-Nachbarn, heutige Prüfung); → air: true. Ausnahme `attacker.id === 'tauchboot'`: nur sea.
  - air → alles.
- `terrainDefense(defender: UnitType, terrain: Terrain): number` – `TERRAIN_DEFENSE[terrain]` für `domain === 'land'`, sonst 0.
- `defenseModifiers(defender, terrain, inCity): { label: string; value: number }[]` – Liste für Anzeige (z. B. `[{label:'Hügel',value:1},{label:'Stadt',value:1}]`), Summe = Bonus ohne Befestigung. Deutsche Geländenamen hier zentral (`TERRAIN_LABEL`).
- `canEnter(type: UnitType, terrain: Terrain): boolean` – land: `!isWater`, sea: `isWater`, air: true (für das Nachrücken; Hafen-Sonderfall siehe Task 4).

## Task 3: Angriffslegalität in `hex.ts attackTargets`

- `fitsDomain` durch `canAttack(type, enemyType, tile.terrain, coastal)` ersetzen; `coastal` wie bisher über `neighbors(c)` + `isWater`.
- Fallback-Siegchance: `defense = et.defense·health/100 + terrainDefense(et, tile.terrain) + (cityAt ? CITY_DEFENSE : 0)`. Für Stadtziele unverändert `attack/(attack+1)`. Serververschau (`combatPreviews`) überschreibt weiterhin.
- Keine Änderung an Reichweite/`origins`.

## Task 4: Kampfauflösung `engine/combat.ts`

- `defenseValue`: `base + terrainDefense(type, tileAt(u).terrain) + (city ? CITY_DEFENSE + fortification(...) : 0)`. Für Tile-Zugriff kleinen Helper `tileAt(state, c)` (Suche in `state.map.tiles`, wie `cityAt`).
- **Nachrücken** im Sieg-Zweig gegen Einheiten (nach `destroyUnit`): wenn `!state.units.some(u => sameHex(u, at) && u.ownerId !== attacker.ownerId)` und `canEnter(type, terrain)` und (keine Stadt auf `at` oder `city.ownerId === attacker.ownerId`): Angreifer auf `at` setzen, Ladung (`cargoUnitIds`) mitziehen (gleichen Mechanismus wie `walk` in `movement.ts:47-74` benutzen, ggf. dortigen Teil als `placeUnit(state, unit, coord)` herausziehen), bei `fuel != null` 1 Treibstoff abziehen (min 0). `CombatResult` bekommt neues Feld `advanced: boolean` (für Replay/Anzeige nicht zwingend, aber für Tests und Dialogtext „rückt nach“).
- **Stadtschaden**: Helper `damageCity(state, city)` → `damage = min(MAX_CITY_DAMAGE, damage+1)`, `underFire = true`, wenn `production` dann `turnsRemaining += 1`. Aufruf in jedem Zweig von `resolveCombat`, in dem Ziel eine Stadt ist oder der Verteidiger auf einer Stadt steht, deren `ownerId !== attacker.ownerId` (auch bei Niederlage des Angreifers, auch bei neutralen Städten). Bei Eroberung bleibt `damage`, `underFire = false`.
- Ereignistexte: bei Schaden an eigene Stadt den bestehenden `combat`/`unitLost`-Event-Text des Verteidigers um „Produktion verzögert.“ ergänzen (kein neuer `GameEventType`).

## Task 5: Stadtzustand, Produktion, Normalisierung

- `CityState` (`engine/state.ts`): `damage: number`, `underFire: boolean`. `normalizeState` (`state.ts:164-180`): `c.damage ??= 0; c.underFire ??= false` für alle Städte (Bestandsspielstände im JSONB). `create.ts` und `demo.ts` setzen beide Felder initial.
- `City` (View-Typ, `types.ts:129-137`): `damage: number` (für fremde/explored-only Städte in `projectView` 0 setzen, für sichtbare den echten Wert).
- `turn.ts startTurn`: vor der Produktion für eigene Städte: `if (city.underFire) city.underFire = false; else city.damage = max(0, damage-1)`. Beim automatischen Neustart: `turnsRemaining = base + damage`.
- `commands.ts setProduction` (`271-287`): beim Start eines neuen Typs `turnsRemaining = base + damage` (Wechsel zurück auf laufenden Typ behält Fortschritt wie heute).
- `Production` unverändert; Panel rechnet `total = progress + turnsRemaining` weiter korrekt.

## Task 6: Web – Angriffsdialog und Stadt-Panel (`apps/web/src/sections/spielfeld/`)

- **Angriffsdialog** (`Spielfeld.tsx` ~655-690): unter der Siegchance eine Zeile „Verteidiger: Hügel +1 · Stadt +1“ aus `defenseModifiers(defenderType, tile.terrain, !!cityAt)` (Tile aus `idx.tileAt`), bei leerer Liste weglassen. Wenn `hexDistance(attacker, target) > 1`: Hinweis „fährt N Felder heran“ (N = kürzeste Entfernung zu einem Nachbarfeld, aus `reachableTiles`). Nach Sieg mit `advanced` Toast/Resultattext „… und rückt nach.“ (Text aus `CombatResult.message` reicht: Message im Engine-Sieg-Zweig um „Rückt nach.“ erweitern).
- **CityPanel.tsx**: wenn `city.damage > 0` eine Zeile im Produktionsblock: Badge „Beschädigt N/3“ (amber/rose) mit Text „Bauzeiten +N Runden, heilt in ruhigen Runden“. Im Einheiten-Wähler die angezeigte Bauzeit um `damage` erhöhen (neben dem bestehenden Bonus-Durchstrich, `CityPanel.tsx:133-137`).
- Tests `Spielfeld.test.tsx` / vorhandene CityPanel-Tests: Dialog zeigt Modifikatoren, Panel zeigt Schaden.

## Task 7: Kompendium (`apps/web/src/sections/fraktionen/components/EinheitDetail.tsx`)

- Neuer Block „Gefecht“ unter den Werten: „Greift an: …“ aus `canAttack` gegen die drei Domänen (Land / See / Luft, Sonderfälle: Tauchboot „nur Schiffe“, Land „Schiffe nur in Küstennähe“, See „Landeinheiten nur an der Küste“), und für Landeinheiten die Verteidigungstabelle „Wald +1 · Hügel +1 · Gebirge +2 · Stadt +1“; für See/Luft „Stadt +1, kein Geländebonus“. Werte ausschließlich aus `rules.ts`, keine Zahlen im Component.
- Test in der Fraktionen-Testdatei: Tauchboot zeigt „nur Schiffe“, Grenadiere zeigen Gebirge +2.

## Task 8: Engine-Tests (`packages/shared/src/game/engine/__tests__/`)

- `fixtures.ts`: `TERRAIN` um `h: 'hills'`, `m: 'mountains'` ergänzen; `city()` setzt `damage: 0, underFire: false`.
- `rules.test.ts`, neue `describe`-Blöcke:
  - **Domänen**: Panzerwagen greift Kanonenboot auf benachbartem Wasser an, nicht 2 Felder entfernt über Wasser; Grenadiere greifen Doppeldecker über Land, nicht über Wasser; Tauchboot kann Doppeldecker/Grenadiere nicht angreifen; Panzerkreuzer greift Grenadiere an der Küste, nicht im Landesinneren; Frachter hat keine Ziele; `attack`-Command wirft `INVALID_TARGET` für illegale Ziele.
  - **Nachrücken**: Sieg auf Ebene → Angreifer steht auf Zielfeld, `movesLeft 0`; Sieg gegen Schiff → bleibt an Land; zwei Gegner auf dem Feld → bleibt stehen; Verteidiger in fremder Stadt → bleibt stehen, Stadt nicht erobert; Flugzeugträger mit Ladung → Ladung zieht mit; Flugzeug verliert 1 Treibstoff; Log-Pfad endet auf Zielfeld.
  - **Boni**: `combatChance` gegen Grenadiere auf Hügel/Gebirge/Wald vs. Ebene; Doppeldecker auf Gebirge ohne Bonus; Stadt auf Hügel addiert (+2), Salzküste +3; Fallback in `attackTargets` ohne Previews entspricht Serverchance, wenn keine Befestigung/kein Faction-Bonus wirkt.
  - **Stadtschaden**: Angriff auf Stadt (Sieg und Niederlage) → damage 1, `turnsRemaining` +1; Angriff auf Verteidiger in Stadt → damage; Deckel 3; ruhige eigene Runde heilt 1, Runde nach Angriff heilt nicht; neue Produktion dauert Basis+Schaden; Auto-Neustart ebenso; `normalizeState` ergänzt Felder; Eroberung behält Schaden.
  - **KI**: `ai.test.ts`: KI greift mit Tauchboot kein Flugzeug an (kein illegaler Befehl im Log), bestehende Tests grün.
- Bestehende Kampftests in `engine.test.ts:250-352` anpassen, wo Nachrücken Positionen ändert.

## Task 9: Doku und Abschluss

- `README.md`: Regelabschnitt um Domänenmatrix, Nachrücken, Boni, Stadtschaden ergänzen.
- `agent-os/product/roadmap.md`: Phase-1b-Punkt 1 als erledigt markieren (Datum 31. Oktober 2026); `playtest-runde-1.md` Spec-1-Tabelle mit Verweis auf den Spec-Ordner.
- Screenshots in `visuals/` (Spiel läuft lokal unter http://localhost:5173, Dev-Konto Passwort `dampfmaschine`).
- Commit nach Repo-Konvention zusammen mit Spec und Doku-Änderungen (inkl. der bereits uncommitteten Roadmap/Playtest-Änderungen): `Playtest 1 / Kampfregeln: Domänen, Nachrücken, Gelände- und Stadtbonus, Stadtschaden`.

## Critical files

- **Neu:** `packages/shared/src/game/rules.ts`, `agent-os/specs/2026-10-31-0207-kampfregeln/*`
- **Geändert (Engine):** `packages/shared/src/game/hex.ts`, `types.ts` (City.damage, CombatResult.advanced), `index.ts`, `engine/combat.ts`, `engine/state.ts`, `engine/turn.ts`, `engine/commands.ts`, `engine/create.ts`, `engine/demo.ts`, `engine/view.ts`, `engine/movement.ts` (Helper extrahieren)
- **Geändert (Web):** `apps/web/src/sections/spielfeld/components/Spielfeld.tsx`, `CityPanel.tsx`, `apps/web/src/sections/fraktionen/components/EinheitDetail.tsx` (+ ggf. `types.ts` der Section für Re-Export aus shared)
- **Tests:** `engine/__tests__/fixtures.ts`, `rules.test.ts`, `engine.test.ts`, `ai.test.ts`, `apps/web/src/sections/spielfeld/Spielfeld.test.tsx`, Fraktionen-Tests
- **Wiederverwendet:** `withBonus` (`bonus.ts`), `fortification`/`cityAt` (`combat.ts`), `reachableTiles`/`neighbors`/`isWater` (`hex.ts`), `walk`-Mechanik (`movement.ts`), `normalizeState` (`state.ts`), `bonusEffect`-Muster für Kompendium-Anzeige

## Verification

1. `pnpm test` (shared: neue Regel-Tests; web: Dialog/Panel/Kompendium), `pnpm typecheck`, `pnpm lint`.
2. Server läuft bereits (`pnpm dev`, tsx watch lädt Änderungen). Bestehende Partien in Postgres laden ohne Fehler (normalizeState) – Lobby öffnen, Demo-Partie `/partie/demo` öffnen.
3. Manuell in einer Dev-Solo-Partie (Dev-Leiste in der Lobby, kleine Karte, 1 KI leicht): Panzerwagen neben Kanonenboot → Ziel rot markiert, Dialog zeigt Siegchance; Angriff auf Grenadiere auf Hügel → Dialog zeigt „Hügel +1“; Sieg → Einheit steht auf dem Zielfeld; Angriff auf KI-Stadt → im Zug danach eigene Stadt unter Beschuss zeigt „Beschädigt 1/3“ und längere Bauzeit; nach ruhiger Runde heilt der Wert.
4. Kompendium `/fraktionen` → Einheit Tauchboot zeigt „Greift an: nur Schiffe“, Grenadiere zeigen Geländetabelle.
5. Screenshots für `visuals/`.
