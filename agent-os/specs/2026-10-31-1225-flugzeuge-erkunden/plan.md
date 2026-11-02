# Spec: Flugzeuge erkunden und Treibstoffschutz (Playtest Runde 1, Spec 4)

## Context

Vierte Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 4“, Punkt 12; Roadmap Phase 1b Punkt 4). Im Shaping hat der Nutzer die Beobachtung präzisiert: Gemeint ist ein **Erkundungsbefehl**. Das Flugzeug fliegt selbstständig in den Kriegsnebel, deckt die Karte auf und bleibt stehen, sobald es einen Feind entdeckt; dann steuert der Spieler wieder selbst. Zweiter Punkt aus dem Playtest: Flugzeuge stürzen ab, weil man sie versehentlich aus der Treibstoffreichweite zieht. Der Client soll sich dagegen wehren.

Heutiger Stand:
- **Befehle:** `UnitOrder` (`packages/shared/src/game/types.ts:141`) kennt `none | sentry | goto | patrol(waypoints)`. Stehende Befehle laufen in `turn.ts executeStandingOrders` (Wache weckt bei Feindsicht, Marsch und Patrouille per `advance` → `findPath` + `walk` + `logAction`). `commands.ts move()` zieht sofort los und setzt bei Rest einen `goto`.
- **Treibstoff:** `walk` (`movement.ts:43`) zieht je Feld 1 ab, `budget = min(movesLeft, fuel)`. Auftanken in `startTurn` in eigener Stadt oder auf dem Träger, Absturz in `crashAircraft` am Zugende (`unitLost` „ist ohne Treibstoff abgestürzt.“). `fuelLow`-Ereignis bei `fuel <= movement`. Flugzeuge dürfen nur erforschte Felder betreten (`hex.ts canEnter`). Die KI schickt Flugzeuge heim, wenn `fuel <= dist(Basis) + movement` (`ai.ts:183`). Im Client gibt es keinerlei Warnung; `reachableTiles` zeigt alle Felder im Budget gleich an.
- **Client:** `Spielfeld.tsx commitMove` (Tipp zweimal oder Drag-Ende) ruft direkt `onMoveUnit`/`onSetGoto`. Angriffsdialog (inline, `bottom-24`) und Zugende-Dialog (`role="alertdialog"`) als Muster. `UnitPanel.tsx` zeigt Treibstoffbalken (`fuel/range`), Befehlszeile (`ORDER_LABEL`) und die Buttons Wache, Patrouille, Aufheben, Überspringen.

**Shaping-Entscheidungen (mit dem Nutzer abgestimmt):**
- **Erkunden:** Neuer Befehl nur für Flugzeuge. Jede Runde (und sofort beim Erteilen) fliegt das Flugzeug zum nächsten erreichbaren Nebelrand mit sicherem Rückweg. Reicht der Treibstoff nur noch für den Heimweg, fliegt es zur nächsten Basis, tankt und erkundet weiter. Gibt es nichts Erreichbares mehr, endet der Befehl mit Meldung „Erkundung abgeschlossen“.
- **Stopp:** Sobald eine Feindeinheit oder eine bisher unbekannte fremde Stadt (gegnerisch oder frei) in Sicht kommt: Befehl aufheben, Flugzeug braucht Befehle, Ereignis „Erkundung: feindliche X bei c,r entdeckt.“ bzw. „Erkundung: Stadt X entdeckt.“
- **Treibstoffschutz:** Reichweiten-Anzeige zeigt Felder ohne Rückweg rot schraffiert. Zug oder Marschbefehl dorthin öffnet die Bestätigung „Kein Rückweg … Trotzdem fliegen?“. Der Zug-beenden-Dialog warnt zusätzlich vor Flugzeugen, die mit ihrem Treibstoff keine Basis mehr erreichen.
- **Rückweg:** Basis = eigene Stadt oder eigener Träger. Sicher, wenn Resttreibstoff nach dem Zug ≥ Luftlinie (Hex-Distanz) zur nächsten Basis. Button „Zur Basis“ im Panel setzt einen Marsch zur nächsten erreichbaren Basis.
- **Out of scope:** Erkunden für Schiffe/Landeinheiten, serverseitige Sperre unsicherer Züge, KI nutzt Erkunden nicht, Patrouillen-Ringflug.

## Task 1: Save spec documentation

`agent-os/specs/2026-10-31-1225-flugzeuge-erkunden/`: `plan.md` (dieser Plan), `shape.md` (Umfang, Entscheidungen, Erkundungsregel Schritt für Schritt, Sicherheitsregel, Dialogtexte), `standards.md` (Repo-Konventionen), `references.md` (`executeStandingOrders`/`advance` als Muster, `walk`/`logAction`, `reportSightings`-Dedupe, Angriffsdialog als Dialog-Muster, `ai.ts` Basislogik, `reachableTiles`), `visuals/` (Screenshots nach Umsetzung: `umsetzung-reichweite.png` mit roten Feldern, `umsetzung-kein-rueckweg.png`, `umsetzung-erkunden.png`).

## Task 2: Gemeinsame Treibstoffregeln `packages/shared/src/game/fuel.ts` (neu, rein, Client und Engine)

- `airBases(cities, units, unitTypes, ownerId): HexCoord[]` → eigene Städte plus eigene, nicht geladene Einheiten mit `cargoDomain === 'air'`.
- `returnDistance(at, bases)` → kleinste `hexDistance`, `Infinity` ohne Basis.
- `isAircraft(unit, type)` → `type.domain === 'air' && unit.fuel != null`.
- `canReturn(fuelAfter, at, bases)` → `fuelAfter >= returnDistance(at, bases)`.
- `unsafeTiles(unit, type, reach: Map<string,{coord,dist}>, bases)` → `Set<hexKey>` der Felder mit `fuel - dist < returnDistance(coord)`; leer für Nicht-Flugzeuge.
- `moveSafety(unit, type, target, pathLength, bases)` → `{ fuelAfter, returnDist, safe }`; `safe = fuelAfter >= 0 && canReturn`. Basen selbst zählen immer als sicher (`returnDistance === 0`).
- `strandedAircraft(units, unitTypes, bases, ownerId)` → eigene Flugzeuge außerhalb einer Basis mit `fuel < returnDistance`.
- Tests `game/__tests__/fuel.test.ts`.

## Task 3: Engine, Befehl „Erkunden“ (`packages/shared`)

- `types.ts`: `UnitOrder` um `{ type: 'explore' }`, `Command` (`game/view.ts`) um `{ type: 'explore'; unitId }`, `GameEventType` um `'exploration'` (Meldung „Erkundung abgeschlossen“; Stopps nutzen `enemySighted`/`cityDiscovered`).
- `engine/explore.ts` (neu): `exploreTurn(state, unit)` führt die Runde eines erkundenden Flugzeugs aus:
  1. `knowledge(state, ownerId)` für Index und Sicht; `bases = airBases(...)`; Nebelrand = erforschte, betretbare Felder mit mindestens einem unerforschten Nachbarn.
  2. Schleife, solange `budget(unit) > 0`: Ziel = nächster Nebelrand (nach `findPath`-Länge, Kandidaten vorab nach `hexDistance` sortiert, maximal die 40 nächsten), für den `fuel - pathLength >= returnDistance(ziel)` gilt. Ohne solches Ziel: Heimflug (Pfad zur nächsten Basis, Rest der Runde dort bleiben; `patrolIndex` unberührt). Gibt es auch von einer Basis aus mit vollem Tank keinen Nebelrand → Befehl aufheben, `needsOrders = true`, Ereignis `exploration` „Erkundung abgeschlossen: kein unerforschtes Feld mehr erreichbar.“
  3. Bewegung **schrittweise** (`walk` mit Pfad der Länge 1 je Schritt), nach jedem Schritt `updateKnowledge(state)` und Vergleich: neu sichtbare Feindeinheit (`visibleTiles` vorher/nachher, fremde Einheit ohne `carriedBy`) → Stopp mit `enemySighted` „Erkundung: feindliche {Typ} ({Spieler}) bei c,r entdeckt.“ am Feind-Feld; neu bekannte fremde Stadt (`knownBy[owner]` vorher nicht gesetzt, `ownerId !== owner`) → Stopp mit `cityDiscovered` „Erkundung: Stadt {Name} entdeckt.“ bzw. „… entdeckt, in der Hand von {Spieler}.“ Stopp = `order = none`, `needsOrders = true`, Schleife beenden. Vom `walk` gemeldete Blockade (`blocked`) zählt ebenfalls als Stopp (Ereignis kommt aus `walk`).
  4. Am Ende einmal `logAction(state, unit, 'move', [start, ...walked], null, before)` mit dem Schnappschuss vor dem ersten Schritt, dann `updateKnowledge`.
- `commands.ts`: Fall `explore`: `ownUnit`, nur `unitType.domain === 'air'` sonst `INVALID_ORDER` „Nur Flugzeuge können erkunden.“; setzt `order = { type: 'explore' }`, `delete patrolIndex`, `needsOrders = false`, dann sofort `exploreTurn(state, unit)` (wie `move` sofort loszieht). `cancelOrder` unverändert (deckt explore ab). `move`/`goto` setzen den Befehl ohnehin zurück.
- `turn.ts executeStandingOrders`: Zweig `order.type === 'explore'` → `exploreTurn(state, unit)`. `reportSightings`: zusätzlich Städte überspringen, für die in dieser Runde schon ein `cityDiscovered` am selben Feld vorliegt (Dedupe wie bei `enemySighted`).
- `engine/index.ts` exportiert nichts Neues außer Typen; `fuel.ts` aus `game/index.ts` exportieren (Client importiert `@dos/shared/game/fuel`).
- Tests `engine/__tests__/erkunden.test.ts` (`makeState` mit `unexplored`): fliegt zum Nebelrand und deckt Felder auf (explored wächst); stoppt bei Feindsicht mit Ereignis und `needsOrders`; stoppt bei entdeckter Stadt; fliegt bei knappem Treibstoff zur Basis, tankt in der nächsten Runde und erkundet weiter; meldet „abgeschlossen“ ohne Nebel; lehnt Landeinheiten ab; Rundenbericht wiederholt die Erkundungsmeldung nicht; Replay-Log enthält den Flug.

## Task 4: Client, Treibstoffschutz (`apps/web/src/sections/spielfeld/`)

- `Spielfeld.tsx`: `bases = airBases(cities, units, unitTypes, youId)` (memo); `unsafe = unsafeTiles(selectedUnit, selectedType, reach, bases)`; an HexMap `unsafeTiles: HexCoord[]`.
- `HexMap.tsx`: Prop `unsafeTiles`, gezeichnet nach `reachable` als Polygon `fill-rose-500/25 stroke-rose-500/80` plus Schraffur (neues `pattern id="dos-hatch-rose"`), `data-testid="unsafe-tile"`.
- Bestätigung: State `pendingMove: { unitId; target; inReach; fuelAfter; returnDist } | null`. `commitMove` prüft bei Flugzeugen `moveSafety(unit, type, target, pathLength, bases)` (Pfadlänge aus `findPath`); unsicher → `setPendingMove` statt Befehl. Inline-Panel wie der Angriffsdialog (`role="alertdialog"`, Rahmen rose): Titel „Kein Rückweg“, Text je Fall: „Der Treibstoff reicht nicht bis zum Ziel ({pathLength} Felder, {fuel} Treibstoff).“ oder „Nach diesem Zug hat der {Typ} noch {fuelAfter} Treibstoff, die nächste Basis ist {returnDist} Felder entfernt.“, ohne Basis „Es gibt keine eigene Stadt und keinen Träger in Reichweite.“ Buttons „Abbrechen“ und „Trotzdem fliegen“ (führt `onMoveUnit`/`onSetGoto` aus). Esc/`cancelStep` bricht ab, `canAct`-Verlust räumt auf.
- „Zur Basis“: `UnitPanel` Prop `onReturnToBase?`, Button (Icon `PlaneLanding`) nur für Flugzeuge, deaktiviert in einer Basis. Spielfeld: Basen nach `hexDistance` sortieren, erste mit `findPath` → `commitMove(unit, base, reach.has(base))` (läuft durch dieselbe Sicherheitsprüfung).
- Zugende: `stranded = strandedAircraft(units, unitTypes, bases, youId)`; `handleEndTurn` öffnet den Dialog, wenn `pendingOrders.length > 0 || stranded.length > 0`. Dialogtext ergänzt: „{n} Flugzeug(e) erreichen mit ihrem Treibstoff keine Basis mehr: Doppeldecker bei 8,3 (Treibstoff 2, Basis 4 Felder).“ Button „Zu den Einheiten“ wählt bei nur gestrandeten Flugzeugen das erste davon (`selectUnit` + `centerOn`).
- `types.ts` (Props): `onSetExplore?(unitId)`, keine weiteren Datenprops (Basen kommen aus `cities`/`units`).

## Task 5: Client, Befehl „Erkunden“

- `UnitPanel.tsx`: `ORDER_LABEL.explore = 'Erkundung'`, Befehlszeile „· fliegt in den Nebel“; Button „Erkunden“ (Icon `Compass`) nur bei `type.domain === 'air'`, `active` bei explore; Prop `onExplore?`. Buttonzeile für Flugzeuge: Wache, Erkunden, Zur Basis, Aufheben, Überspringen (Patrouille bleibt; bei 6 Buttons `flex-wrap`).
- `Spielfeld.tsx`: `onExplore={() => onSetExplore?.(selectedUnit.id)}`; `MatchPage.tsx`: `onSetExplore={(unitId) => send({ type: 'explore', unitId })}`.
- `EventLog.tsx` `EVENT_STYLE.exploration` (Icon `Compass`, sky); `report.ts` `SECTION_OF.exploration = 'home'`.

## Task 6: Tests Web

- `Spielfeld.test.tsx`: Doppeldecker `u8` (8,3, Treibstoff 6, Kesselstadt 6,2): rote Felder vorhanden (`unsafe-tile`), nahe Felder nicht rot; zweimal Tippen auf ein unsicheres Feld öffnet „Kein Rückweg“, „Abbrechen“ schließt ohne Befehl, „Trotzdem fliegen“ ruft `onMoveUnit`; sicheres Feld zieht ohne Dialog; „Zur Basis“ ruft `onMoveUnit` mit Kesselstadt (Reichweite 6 ≥ 2); „Erkunden“ ruft `onSetExplore('u8')`; Zugende mit gestrandetem Flugzeug (Props: `u8` fuel 1, Kesselstadt entfernt) zeigt die Warnung im Dialog.
- `UnitPanel.test`? Buttons über Spielfeld-Tests abgedeckt. `report.test.ts` um `exploration` ergänzen.
- `MatchPage.test.tsx`: „Erkunden“ sendet `{ type: 'explore', unitId }`.

## Task 7: Doku und Abschluss

- `README.md`: Abschnitt „Flugzeuge: Erkunden und Treibstoff“ (Erkundungsregel, Stopps, Heimflug, rote Felder, Dialog, Zugende-Warnung, „Zur Basis“).
- `agent-os/product/roadmap.md` Punkt 4 durchgestrichen (31. Oktober 2026, Spec-Ordner, Hinweis „Erkunden statt Patrouille über Stadt“); `playtest-runde-1.md` Spec-4-Abschnitt „(umgesetzt)“ mit der präzisierten Beobachtung.
- Screenshots per Playwright (Demo: `u8` wählen → rote Felder; Tipp auf unsicheres Feld → Dialog; nach „Erkunden“ Befehlszeile und Flug), Demo zurücksetzen.
- Commit: `Playtest 1 / Flugzeuge: Erkundungsbefehl, Treibstoffschutz mit Rückweg-Prüfung, Zur Basis`.

## Critical files

- **Neu:** `packages/shared/src/game/fuel.ts` (+ `__tests__/fuel.test.ts`), `packages/shared/src/game/engine/explore.ts` (+ `__tests__/erkunden.test.ts`), Spec-Ordner
- **Geändert (Engine):** `game/types.ts`, `game/view.ts` (Command), `game/index.ts`, `engine/commands.ts`, `engine/turn.ts`
- **Geändert (Web):** `Spielfeld.tsx`, `HexMap.tsx`, `UnitPanel.tsx`, `EventLog.tsx`, `report.ts`, `spielfeld/types.ts`, `pages/MatchPage.tsx`, Tests `Spielfeld.test.tsx`, `MatchPage.test.tsx`, `report.test.ts`
- **Wiederverwendet:** `knowledge`/`walk`/`logAction`/`snapshotVisibility` (`movement.ts`), `findPath`/`reachableTiles`/`hexDistance` (`hex.ts`), `visibleTiles`/`updateKnowledge`, `addEvent`, Angriffsdialog-Markup, `OrderButton`, Basislogik aus `ai.ts`

## Verification

1. `pnpm test`, `pnpm typecheck`, `pnpm lint`.
2. Demo: Doppeldecker bei 8,3 wählen → ferne Felder rot schraffiert; Zug dorthin fragt „Kein Rückweg“; „Zur Basis“ fliegt nach Kesselstadt; „Erkunden“ lässt das Flugzeug in den Nebel fliegen, Befehlszeile „Erkundung“, Ereignis bei Feindsicht; Zugende mit gestrandetem Flugzeug warnt.
3. Solo-Partie gegen KI: Flugzeug auf Erkunden setzen, mehrere Runden beenden: Nebel lichtet sich, Flugzeug tankt zwischendurch, stoppt bei Feindkontakt, kein Absturz.
4. Screenshots in `visuals/`.
