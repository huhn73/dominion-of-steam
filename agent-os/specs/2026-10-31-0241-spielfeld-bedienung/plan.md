# Spec: Spielfeld-Bedienung (Playtest Runde 1, Spec 2)

## Context

Zweite Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 2“, Punkte 6–10). Alles liegt im Web-Client `apps/web/src/sections/spielfeld/` (plus `pages/MatchPage.tsx`, `data/match.ts`); Engine und Server bleiben unverändert, die nötigen Daten (eigene Städte mit Produktion, alle eigenen Einheiten, `CombatResult`) sind schon im `PlayerView`.

Heutiger Stand:
- **Stapel:** `HexMap.tsx` zeichnet jede Einheit als eigenes Token an derselben Position (Zeile 526-536), es gibt keinen Stapelzähler; nur Ladung hat ein Abzeichen (252-264). In Städten wird das Token versetzt und verkleinert (`UnitToken`, 215-217).
- **Stadt nicht auswählbar:** `ownUnitAt` (`Spielfeld.tsx:272-274`) bevorzugt Einheiten mit offenen Befehlen bzw. eine andere als die gewählte; bei zwei Einheiten ohne Befehl wechselt der Tipp endlos zwischen ihnen, die Stadt im Zyklus „Einheit → Stadt → nichts“ (319-337) wird nie erreicht. Kein UI zum Wechseln zwischen Einheiten eines Feldes (`UnitPanel.tsx` listet nur Ladung).
- **Nächste Einheit:** `nextUnit` (`Spielfeld.tsx:399-405`) sucht die gewählte Einheit in `pendingOrders`; nach einem Befehl fällt sie heraus (`needsOrders=false`), `i = -1`, es geht bei Index 0 weiter. Kein Tastenkürzel außer Escape (388-394).
- **Kampfanimation:** `confirmAttack` (221-228) startet die Explosion optimistisch beim Klick; `lastCombat` (212-219) zeigt nur den Toast. Der neue Spielstand kommt sofort per `queryClient.setQueryData` (`data/match.ts:37-40`), der Verlierer verschwindet schlagartig. Einstellung „Kampfanimationen“ wirkt nur per CSS-Klasse `dos-no-combat-fx` (`settings/BoardSettingsLayer.tsx:89`, `styles/index.css:42-45`), „Animationen reduzieren“ per `html.dos-reduce-motion`; die Board-Komponenten bekommen keine Einstellungen.
- **Produktion:** `CityPanel.tsx` kennt nur die eine Stadt und `buildable`; Bestand und Bauaufträge anderer Städte sind in `units`/`cities` vorhanden (`engine/view.ts:37,43`).

**Shaping-Entscheidungen (mit dem Nutzer abgestimmt):**
- **Stapel & Stadt:** Marker mit Zähler für mehrere Einheiten auf einem Feld (wie Ladungs-Abzeichen); in Städten zeigt das versetzte Token so die Garnisonsgröße. Tippen wechselt Einheit 1 → Einheit 2 → … → Stadt → nichts. Einheiten-Panel bekommt „Auf diesem Feld“ (alle Einheiten und die Stadt zum Umschalten), Stadt-Panel eine Garnisonsliste (antippen wählt die Einheit).
- **Nächste Einheit:** Merkt sich die Position der zuletzt gewählten eigenen Einheit in der Einheitenliste und springt zur nächsten offenen Einheit dahinter, am Ende von vorn. Tastenkürzel N und Leertaste (ohne offenen Dialog, nicht in Eingabefeldern).
- **Kampfanimation:** Sequenz ~1,2 s nach der Serverantwort: Heranfahren als Ghost, Mündungsblitz beim Angreifer, Explosion auf dem Ziel, Verlierer-Token verblasst, Sieger rückt sichtbar nach, danach Toast. Der neue Spielstand wird erst nach der Sequenz übernommen, das Spielfeld ist solange gesperrt. „Kampfanimationen“ aus: 0 ms, nur Toast. „Animationen reduzieren“: 300 ms.
- **Produktion:** Im Bauauftrag-Wähler je Zeile „Bestand N · N im Bau (Stadt A, Stadt B)“, darüber Summenzeile „Reichsweit N Einheiten · N im Bau“. Rein clientseitig.
- **Out of scope:** Gegner-Stapel-Details (nur Zähler), Replay-Animation der Gegnerzüge (bleibt wie heute), Einstellungen „Einheiten ziehen“/„Nachfrage beim Zugende“ (Phase 2), Server-/Engine-Änderungen.

## Task 1: Save spec documentation

`agent-os/specs/2026-10-31-0241-spielfeld-bedienung/` wie bei `2026-10-31-0207-kampfregeln/`: `plan.md` (dieser Plan), `shape.md` (Umfang, Entscheidungen, Bedienmodell: Tipp-Zyklus, Cursor-Regel, Animationsphasen mit Zeiten, Übersichtsformat), `standards.md` (keine Standards, Repo-Konventionen), `references.md` (Ladungs-Abzeichen `HexMap.tsx:252-264` als Vorbild für den Stapelzähler; Ghost/Replay-Mechanik `HexMap.tsx` `Ghost`/`dos-march` für Heranfahren und Nachrücken; `dos-blast`/`dos-flash`; `BoardSettingsLayer.tsx` als Ort der Einstellungs-Weitergabe; `UnitPanel.tsx` Ladungsliste als Muster für die Feldliste; Design-Übergabe `product-plan/sections/spielfeld-and-zuge/README.md:16-23`), `visuals/` mit Screenshots nach Umsetzung (`umsetzung-stapel.png`, `umsetzung-kampf.png`, `umsetzung-produktion.png`).

## Task 2: Reine Hilfsfunktionen `apps/web/src/sections/spielfeld/components/selection.ts` (neu, testbar ohne Karte)

- `unitsOnHex(idx, c, youId)`: eigene Einheiten auf dem Feld ohne Ladung (`!carriedBy`), in `units`-Reihenfolge.
- `nextTapSelection({ ownUnits, city, selectedUnitId, selectedCityId })` → `{ unitId } | { cityId } | null`: nichts gewählt (oder Auswahl auf anderem Feld) → erste Einheit, bevorzugt die erste mit `needsOrders`; gewählte Einheit i → Einheit i+1, nach der letzten → Stadt (falls vorhanden) sonst null; Stadt gewählt → null.
- `nextPendingUnit(units, youId, cursorIndex)`: erste Einheit mit `needsOrders && !carriedBy && ownerId === youId` an Index > cursorIndex, sonst von vorn; `cursorIndex` ist der Index der zuletzt gewählten eigenen Einheit in `units` (−1 ohne Auswahl).
- `productionOverview(units, cities, youId, cityId)` → `Map<unitTypeId, { owned: number; building: string[] }>` (Stadtnamen, die aktuelle Stadt als „hier“ zuerst) plus Summen `{ owned, building }`. Eigene Einheiten inklusive Ladung.
- `combatTimeline(ms)` → Phasen-Zeiten (Heranfahren 0–25 %, Blitz 20–45 %, Explosion 40–75 %, Verblassen/Nachrücken 70–100 %) aus einer Gesamtdauer; bei 0 ms alles leer.

## Task 3: Stapel auf der Karte (`HexMap.tsx`)

- `visibleUnits` nach `hexKey` gruppieren. Pro Feld nur ein `UnitToken` zeichnen: die gewählte Einheit, sonst eine eigene mit `needsOrders`, sonst die erste. Bei mehr als einer Einheit ein Abzeichen unten rechts (`translate(13,13)`, Muster Ladungs-Abzeichen 252-264, Farbe stone/amber) mit der Anzahl; `aria-label`/`<title>` „N Einheiten“. Gegner-Stapel ebenso (Anzahl sichtbarer Gegner).
- In Städten bleibt die Versetzung (+13,−12, 0.82); der Zähler zeigt die Garnisonsgröße.
- Token bekommt optionale Klassen für die Kampfsequenz: `fading` (Verlierer, `opacity` Transition) und `muzzle` (Mündungsblitz: kleiner `dos-flash`-Stern am Angreifer). Neue Props `fadingUnitIds: Set<string>`, `muzzleUnitId: string | null`, `advanceGhost: Ghost | null` (nutzt die bestehende `Ghost`-Zeichnung mit 400 ms Transform-Transition).

## Task 4: Auswahl und Feldliste (`Spielfeld.tsx`, `UnitPanel.tsx`, `CityPanel.tsx`)

- `handleTap`-Zyklus (319-337) durch `nextTapSelection` ersetzen; `ownUnitAt` nur noch für Drag (`draggableUnitAt`: gewählte Einheit, wenn auf dem Feld, sonst erste mit `needsOrders`, sonst erste).
- `UnitPanel`: neue Props `stack: { unit: Unit; type?: UnitType }[]` (alle eigenen Einheiten des Feldes inkl. der gewählten), `cityHere?: City`, `onSelectStackUnit(id)`, `onOpenCity(id)`. Abschnitt „Auf diesem Feld“ oberhalb der Ladung, nur wenn `stack.length > 1 || cityHere`: Chips mit `UnitIcon`, Name, Zustand %, Befehlsmarke, gewählte hervorgehoben (`aria-pressed`); Stadt-Chip mit `Crown`/Stadt-Icon öffnet das Stadt-Panel.
- `CityPanel`: neue Props `garrison: { unit: Unit; type?: UnitType }[]`, `onSelectUnit?(id)`. Abschnitt „Garnison“ (nach Produktion, auch bei fremden Städten mit sichtbaren Einheiten) als Liste mit Icon, Name, Zustand, Befehl; Klick ruft `onSelectUnit` (Spielfeld: `selectUnit`).
- Spielfeld berechnet `stack`/`garrison` aus `idx.unitsAt`.

## Task 5: Nächste Einheit mit Cursor und Tasten (`Spielfeld.tsx`)

- `cursorRef = useRef(-1)`; in `selectUnit` auf `units.findIndex(id)` setzen, wenn eigene Einheit. `nextUnit` nutzt `nextPendingUnit(units, youId, cursorRef.current)`, setzt Cursor und `centerOn`. Zähler und Zugende-Dialog bleiben bei `pendingOrders.length`.
- Tastatur im bestehenden `keydown`-Handler (388-394): `n`/`N` und `' '` → `nextUnit()`, wenn `canAct`, kein `pendingAttack`, kein `confirmEnd`, `mode === 'normal'` und `e.target` kein `input/textarea/select/button` (Leertaste würde sonst Buttons auslösen). `preventDefault` bei Leertaste. Hinweistext im Panel-Footer um „N: nächste Einheit“ ergänzen.

## Task 6: Kampfsequenz (`Spielfeld.tsx`, `HexMap.tsx`, `MatchPage.tsx`, `data/match.ts`)

- `useMatchCommand` bekommt Option `holdViewMs?: () => number`. In `onSuccess`: bei `combat` und `holdViewMs() > 0` zuerst `onCombat`, dann `setQueryData` per `setTimeout` nach der Dauer (Timer in Ref, bei Unmount/neuem Erfolg löschen); sonst wie heute.
- `MatchPage`: `combatAnimationMs = settings.display.combatAnimations ? (settings.display.reduceMotion ? 300 : 1200) : 0` (Feldnamen aus `@dos/shared/profile` `DisplaySettings` prüfen) an `useMatchCommand({ holdViewMs })` und als Prop `combatAnimationMs` an `Spielfeld` (Standard 0 im Props-Typ, damit Tests/Design-Übergabe unverändert laufen).
- `Spielfeld`: `confirmAttack` startet keine Explosion mehr. Neuer State `combatPlay: { combat: CombatResult; attackerFrom: HexCoord; origin: HexCoord; target: HexCoord; phase } | null`, gesetzt im `lastCombat`-Effekt aus den **alten** Props (Angreifer per `attackerUnitId` in `units`, Ziel per `defenderUnitId` bzw. `targetCityId`; Ursprung bei Distanz > 1 wie der Server über `reachableTiles` + kleinste `dist`). Phasen per `combatTimeline(combatAnimationMs)` und `setTimeout`-Kette: Ghost fährt zum Ursprung → `muzzleUnitId` → `combatFx` auf Ziel → `fadingUnitIds` (Verlierer) und bei `advanced` Ghost zum Ziel → Ende: Toast (`setToast`), `openCity` bei Eroberung, State löschen. Bei 0 ms sofort Toast wie heute.
- Sperre: `canAct` zusätzlich `&& !combatPlay`; Aktionsleiste und Panels `disabled`.
- Replay bleibt (Explosion am letzten Schritt).
- CSS: `dos-no-combat-fx`-Regel bleibt als Fallback; neue Klasse für Verblassen (`transition: opacity 400ms`).

## Task 7: Produktionsübersicht (`CityPanel.tsx`, `Spielfeld.tsx`)

- Prop `overview: ReturnType<typeof productionOverview>` aus Spielfeld.
- Über der Liste: „Reichsweit N Einheiten · N im Bau“ (Mono, klein). Je Zeile unter den Werten: „Bestand N · N im Bau (hier, Kesselstadt)“, Städte auf zwei Namen gekürzt plus „+N“; „Bestand 0“ gedämpft, „im Bau“ amber, wenn > 0.

## Task 8: Tests

- `selection.test.ts` (neu): Tipp-Zyklus (zwei Einheiten + Stadt; eine Einheit; nur Stadt; Auswahl auf anderem Feld), Cursor-Regel (nach Befehl weiter hinter der Position, Wrap, nichts offen), Übersicht (Bestand inkl. Ladung, Bauaufträge mit „hier“ zuerst, Summen), Timeline (0 ms leer).
- `Spielfeld.test.tsx`: Karten-Tipps per `fireEvent.pointerDown/pointerUp` auf `svg[role=application]` mit `hexToPixel`-Koordinaten (Kamera bleibt in jsdom bei 0/0/1, da `viewport.width === 0`); Fälle: Eisenhafen (3,4) mit `u3` → Tipp 1 Einheit, Tipp 2 Stadt-Panel, Tipp 3 nichts; Frachter-Feld (7,8) mit Ladung zeigt kein Stapel-Abzeichen (Ladung ist kein Stapel); Stapel-Abzeichen bei zwei Einheiten auf einem Feld (Props mit zusätzlicher Einheit); „Nächste“ nach `needsOrders=false` der gewählten Einheit springt zur nächsten dahinter (u1 → u5 → u8 …, nach Rerender ohne u5 weiter bei u8); Taste N; Kampfsequenz mit `vi.useFakeTimers`: `combatAnimationMs=1200` + `lastCombat` → Explosion (`data-testid="combat-fx"`) sichtbar, Toast erst nach Ablauf, Aktionsleiste gesperrt; `combatAnimationMs=0` → Toast sofort (bestehender Test).
- `CityPanel.test.tsx`: Garnisonsliste mit Klick, Übersichtszeilen.
- `MatchPage.test.tsx` oder `data/match.test.ts`: Spielstand wird bei Kampf erst nach `holdViewMs` gesetzt (Fake-Timer, `mockApi`).

## Task 9: Doku und Abschluss

- `README.md` Abschnitt „Kampfregeln“/„Profil & Einstellungen“: Stapel, Feldliste, Taste N, Kampfsequenz und Einstellungswirkung (Kampfanimationen aus → nur Toast; Animationen reduzieren → kurz), Produktionsübersicht.
- `agent-os/product/roadmap.md` Punkt 2 als erledigt (31. Oktober 2026, Spec-Ordner); `playtest-runde-1.md` Spec-2-Abschnitt „(umgesetzt)“.
- Screenshots per Playwright wie bei Spec 1 (Demo-Partie patchen: zwei Einheiten in Eisenhafen; Kampf gegen `e9` auf dem Hügel mit Screenshot mitten in der Sequenz; Stadt-Panel mit Übersicht), danach Demo zurücksetzen.
- Commit: `Playtest 1 / Spielfeld-Bedienung: Stapel, Feldliste, Nächste Einheit, Kampfsequenz, Produktionsübersicht`.

## Critical files

- **Neu:** `apps/web/src/sections/spielfeld/components/selection.ts` (+ `.test.ts`), Spec-Ordner
- **Geändert:** `apps/web/src/sections/spielfeld/components/Spielfeld.tsx`, `HexMap.tsx`, `UnitPanel.tsx`, `CityPanel.tsx`, `apps/web/src/sections/spielfeld/types.ts` (Prop `combatAnimationMs?`), `apps/web/src/pages/MatchPage.tsx`, `apps/web/src/data/match.ts`, `apps/web/src/styles/index.css`
- **Tests:** `Spielfeld.test.tsx`, `CityPanel.test.tsx`, `MatchPage.test.tsx`
- **Wiederverwendet:** `buildIndex`/`unitsAt`/`reachableTiles`/`hexToPixel` (`@dos/shared/game/hex`), `Ghost` + `dos-march`/`dos-blast`/`dos-flash` (`HexMap.tsx`), Ladungs-Abzeichen-Markup, `useSettings` (`data/profile`), `BoardSettingsLayer`

## Verification

1. `pnpm test`, `pnpm typecheck`, `pnpm lint`.
2. Demo-Partie unter http://localhost:5173/partie/demo: Eisenhafen antippen (u3 → Stadt → nichts), Frachter mit Ladung zeigt Ladungs-Abzeichen aber keinen Stapel; zwei Einheiten auf ein Feld ziehen → Zähler „2“, Feldliste im Panel schaltet um; N springt reihum weiter, nach „Wache“ geht es hinter der Position weiter.
3. Angriff auf einen Gegner: Blitz, Explosion, Verblassen, Nachrücken, dann Toast; während der Sequenz keine Eingabe möglich. Einstellungen: „Kampfanimationen“ aus → sofort Toast; „Animationen reduzieren“ → kurze Sequenz.
4. Stadt-Panel: Summenzeile und je Typ Bestand/im Bau mit Städten.
5. Screenshots in `visuals/`.
