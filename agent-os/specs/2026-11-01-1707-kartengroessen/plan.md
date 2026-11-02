# Plan: Kartengrößen (Playtest Runde 2, Spec 3)

## Context

Aus `agent-os/product/playtest-runde-2.md`, Punkt 7: Die Karten sind zu klein, das heutige „Riesig“ (36×24, 864 Felder) entspricht etwa der kleinsten Karte des Vorbilds. Der Spieler will fünf Stufen zwischen 20×20 und 200×200 Feldern, geometrisch gestaffelt. Das größte Brett hat damit 40.000 Felder, das 46-fache von heute.

Erkundung (1. November 2026): Fast alles skaliert mit der Feldzahl, und zwar an den falschen Stellen.

- **Daten:** `state.map.tiles` ist ein Objekt je Feld (≈ 40 B), `participant.explored` eine Liste von Schlüsseln „col,row“ (≈ 10 B je Feld und Spieler), die Sicht `PlayerView.map.tiles` ein Objekt je Feld mit Sichtbarkeit (≈ 68 B). Bei 40.000 Feldern: Spielstand ≈ 1,6 MB Felder + bis 2,4 MB Erkundung, Sicht ≈ 2,7 MB je Antwort, unkomprimiert, bei jedem Befehl und jedem Poll komplett.
- **Engine:** `applyCommand` klont den ganzen Spielstand je Befehl; `knowledge()` baut je Aufruf eine volle Sichtprojektion plus Feldindex und wird je KI-Planung, je Bewegungsbefehl, je Erkundungsschritt aufgerufen; `updateKnowledge` baut je Teilnehmer ein Set aus `explored` nach jedem Befehl; `isCoastal` scannt alle Felder; `findPath` ist eine unbegrenzte BFS mit `queue.shift()`; die KI startet bis zu 48 Wegsuchen je Expansionsentscheidung und bis zu 40 je Erkundungsschritt der Flugzeuge; `MAX_COMMANDS = 300` je KI-Zug; alles läuft synchron in der Datenbank-Transaktion des Spielerbefehls.
- **Client:** `HexMap` zeichnet jedes Feld als SVG (3–6 Knoten je Feld, bei 40.000 Feldern 160.000 bis 240.000 Knoten), die Kamera ist ein CSS-Transform über allem, jede Mausbewegung rendert `Spielfeld`, `HexMap` und `MiniMap` neu; die Minikarte ist ebenfalls SVG je Feld und filtert Städte gegen alle Felder je Frame; kein Pan-Clamping, Mindestzoom 0,45 zeigt höchstens ≈ 61 Spalten; `findPath` läuft bei jedem Hover.
- **Generator:** Stadtzahl = Landfelder / 12 (normal), Namen aus einer Liste von 40 mit Modulo (Duplikate ab 41 Städten); Hauptstädte per Farthest-Point-Sampling, Rauschen skaliert bereits mit der Kartengröße.
- **Definitionen:** Kartengrößen stehen doppelt (`MAP_SIZES` in `catalog.ts`, `SETUP_OPTIONS.mapSizes` in `setup/data.ts`), `MapSizeId` zweimal, die DevBar hat die Liste hart kodiert; Lobby-Label fällt bei unbekannten Maßen auf „Eigene Größe“ zurück.

## Entscheidungen (Shaping, 1. November 2026)

- **Fünf quadratische Stufen, geometrisch:** Klein 20×20 (400 Felder), Mittel 40×40 (1.600), Groß 75×75 (5.625), Riesig 130×130 (16.900), Imperium 200×200 (40.000). Die bisherigen vier Stufen entfallen; bestehende Partien behalten ihre Maße und bekommen in der Lobby das Label „Breite×Höhe“. Verworfen: alte Stufen behalten plus drei neue; nur eine Stufe größer; lineare Staffelung.
- **KI-Budget:** höchstens 10 Sekunden je KI-Zug auf Imperium. Verworfen: 3 Sekunden (zu eng für die geplante KI), kein Budget.
- **Städte:** proportional zur Landfläche, aber mit deutlich geringerer Dichte als heute („heute waren es recht viele Städte“): Landfelder je Stadt 45 / 30 / 20 (wenig / normal / viele) statt 18 / 12 / 8. Imperium bei 45 % Land ≈ 600 Städte, Riesig ≈ 250, Groß ≈ 85, Mittel ≈ 24, Klein ≈ 6. Stadtnamen werden generiert (Vorsilbe plus Grundwort, deterministisch aus dem Seed), die 40 klassischen Namen bleiben die ersten. Verworfen: streng proportional (≈ 1.500 Städte); feste Zahl je Stufe; Dichte-Regler im Setup.
- **Rundenlimit:** Optionen 50, 100, 150, 250, 500 und „kein Limit“, Vorgabe je Stufe (Klein 50, Mittel 100, Groß 150, Riesig 250, Imperium 500).
- **Empfohlene Spieler:** Klein 2–3, Mittel 2–4, Groß 3–6, Riesig 4–6, Imperium 4–6; Sitze bleiben 2–6.
- **Architektur (Konsequenz, keine Produktfrage):** kompakte Felddaten (ein Zeichen je Feld für Gelände und Sicht, Erkundung als Bitset), komprimierte Antworten, gedeckelte Wegsuche und KI-Kandidaten, KI-Budget in deterministischen Arbeitseinheiten, Canvas für Gelände, Nebel und Minikarte, SVG nur noch für sichtbare Overlays, Kamera außerhalb des React-States mit Pan-Clamping und „Karte einpassen“.
- **Außerhalb des Umfangs:** gleichzeitige Züge im Vorspiel (Spec 4), Rechteckkarten, Kartenvorschau im Setup aus dem Generator, Server-seitige Diffs der Sicht (Polling bleibt, komprimiert).

## Reihenfolge

Engine zuerst (Tasks 2 bis 7), weil die Oberfläche auf das kompakte Kartenformat aufbaut; dazwischen ist der Web-Typecheck rot, bis Task 8 nachzieht. Jeder Engine-Task lässt `tsc` in `packages/shared` grün.

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-11-01-HHMM-kartengroessen/`: `plan.md`, `shape.md` (Entscheidungen oben, Regelmodell Stadtdichte und Namen, Architektur-Konsequenzen, Verworfenes), `standards.md`, `references.md` (Generator, Sicht, Wegsuche, KI, HexMap, MiniMap, Setup), `visuals/` (Setup-Schritt Karte mit fünf Stufen, Imperium eingepasst und bei Zoom 1, Minikarte). Danach `playtest-runde-2.md`, `roadmap.md` (Phase 1c Punkt 3), README (Abschnitte Partie-Setup, Spielfeld, Betrieb: Komprimierung, Datenformat) nachziehen.

## Engine

### Task 2: Eine Definition der Stufen, Rundenlimit „ohne“

- Neu `packages/shared/src/game/mapSizes.ts`: `MAP_SIZES` als Objekt mit `id, label, width, height, recommendedPlayers, defaultRoundLimit` (small Klein 20×20 [2,3] 50; medium Mittel 40×40 [2,4] 100; large Groß 75×75 [3,6] 150; huge Riesig 130×130 [4,6] 250; empire Imperium 200×200 [4,6] 500), `MapSizeId = keyof typeof MAP_SIZES`, `MAP_SIZE_OPTIONS`, `mapSize(id)`, `mapSizeLabel(width, height)` (Stufenlabel bei passenden Maßen, sonst „Breite×Höhe“), `MAX_MAP_SIDE = 256`. Die Ids bleiben, damit gespeicherte Setups, Presets und Tests weiterlaufen; `catalog.ts` verliert `MAP_SIZES`, `game/index.ts` exportiert aus `mapSizes.ts`.
- `setup/types.ts`: `MapSizeId`/`MapSizeOption` von dort re-exportieren, `SetupOptions.roundLimits: (number | null)[]`, `MatchDraft.roundLimit: number | null`. `setup/data.ts`: `mapSizes: MAP_SIZE_OPTIONS`, `roundLimits: [50, 100, 150, 250, 500, null]`, `roundLimitLabel(n)` („Ohne Limit“ / „n Runden“). `game/types.ts` `GameRules.roundLimit: number | null`; `engine/turn.ts:58` prüft `!= null`. `setup/validate.ts`: `null` nur mit anderer Siegbedingung als Rundenlimit („Mit der Siegbedingung Rundenlimit brauchst du eine Rundenzahl.“). `DEFAULT_PRESET` bleibt medium/100.

### Task 3: Codecs

- Neu `packages/shared/src/game/bits.ts`: Bitset als URL-sicheres Base64 (6 Bit je Zeichen, 40.000 Felder → 6.667 Zeichen): `emptyBits(n)`, `decodeBits(s, n): Uint8Array`, `encodeBits(bits)`, `hasBit(s, i)` (O(1) ohne Dekodieren), `setBit`, `countBits`.
- Neu `packages/shared/src/game/mapcodec.ts`: Geländecodes wie in den Test-Fixtures (`~` Tiefsee, `s` Flachwasser, `.` Ebene, `f` Wald, `h` Hügel, `m` Gebirge), Sichtcodes `u/e/v`; `tileIndex(map, c)` (−1 außerhalb), `terrainAt`, `visibilityAt`, `encodeTerrain(tiles, w, h)`, `packMap({width,height,seed,tiles})` (für Beispieldaten und Tests), `expandMap(map): Tile[]`, `isWaterCode`. Export über `game/index.ts`.

### Task 4: Kompakter Spielstand und kompakte Sicht

- `game/types.ts`: `GameMap = { width, height, seed, terrain: string, visibility: string }`; `Tile` bleibt als Ergebnis von `expandMap`. Sicht je Antwort ≈ 80 KB statt ≈ 2,7 MB auf Imperium.
- `hex.ts`: `BoardIndex` bekommt `terrainAt(c)` und `visibilityAt(c)` ohne Allokation, `tileAt(c)` bleibt für den Client (erzeugt ein Objekt); `buildIndex` liest die Strings per `tileIndex`, keine `Map` aller Felder mehr; `canEnter`, `attackTargets.coastal` nutzen die Accessoren. `findPath(unit, target, idx, budget?: PathBudget)` mit `PathBudget { maxNodes, used }`: BFS mit `Int32Array`-Queue und Kopfzeiger, numerische Indizes, gleiche Nachbarreihenfolge (gleiche Wege wie heute), `null` bei erschöpftem Budget. Neu `tilesNear(map, center, radius)` (Bounding-Box-Scan, nächstes zuerst).
- `engine/state.ts`: `GameState.map = { width, height, seed, terrain }`, `ParticipantState.explored: string` (Bitset). `normalizeState` migriert `map.tiles[]` → `terrain` (`encodeTerrain`) und `explored: string[]` → Bitset (`bitsFromKeys`); alte Partien werden beim nächsten Speichern kompakt. `create.ts`: `explored: emptyBits(n)`, `map.terrain = world.terrain`. `demo.ts`: `encodeTerrain` über die gepatchten Demo-Felder, `demo-data.json` unverändert.
- `engine/visibility.ts`: `visibleIndices(state, pid): Set<number>` als Primitive, `visibleTiles` bleibt als dünner Wrapper (hexKeys) für `turn.ts`, `explore.ts`, `movement.ts`; Explored-Cache `WeakMap<ParticipantState, { source, bits, dirty }>` mit `exploredBits`, `markExplored`, `flushExplored` (Encode nur bei Änderung), `isExplored`, `bitsFromKeys`, `markAllExplored`. `updateKnowledge` ohne `new Set(p.explored)`. `tileAt(state, c)` behält die Signatur (liefert `{col,row,terrain}` aus `terrainAt`). `isCoastal` prüft die sechs Nachbarn statt alle Felder.
- `engine/view.ts`: `projectBoard(state, viewerId)` baut `visibility` als `Uint8Array` (Explored-Bits → `e`, sichtbare Indizes → `v`, Rest `u`) und daraus den String; Städte und Einheiten über `visible.has(tileIndex)`. `projectView` = `projectBoard` + Teilnehmer, Ereignisse, Wiedergabe, Vorschauen.
- `engine/movement.ts`: `knowledge()` = `projectBoard` + `buildIndex` (≈ 0,5 ms statt ≈ 30 ms auf Imperium). `logAction`: Sicht-Vorher/Nachher nur für Teilnehmer mit Einheit oder Stadt nahe der Bounding-Box des Pfads.
- `engine/turn.ts`: die Extra-`projectView` zur Replay-Prüfung durch einen `log.some(...)`-Test ersetzen; neu `pruneHistory(state)` am Ende von `endTurn`: `log` auf Einträge ab dem kleinsten `lastTurnEndSeq` aktiver Teilnehmer kürzen (abgeschlossene Züge liegen bereits in `turns`), `events` auf die letzten zwei Runden.
- `engine/minimap.ts`: `terrainAt` und `isExplored` statt `Map` aller Felder.
- Kosten je Befehl auf Imperium danach: Klon ≈ 1 ms (Strings werden geteilt), `knowledge` ≈ 0,5 ms, `findPath` ≤ 10 ms im schlechtesten Fall, `updateKnowledge` ≈ 0,5 ms; typisch ≈ 3 ms, Antwort-Projektion ≈ 2 ms. Der Spielerbefehl bleibt von Postgres dominiert (≈ 300 KB JSON lesen und schreiben).

### Task 5: Generator, Stadtdichte und Namen (`engine/mapgen.ts`)

- `World { terrain: string, capitals, neutralCities }`, intern typisierte Arrays (`Float32Array` Höhe, `Uint8Array` Land/Gelände, `Int32Array` Landmasse) indiziert `row*width+col`; Reihenfolge der Zufallsaufrufe (Rauschen, `shuffle`) unverändert, damit bestehende Seeds bei gleichen Maßen dieselbe Welt ergeben. Erwartete Generierung auf Imperium ≈ 150–300 ms.
- `LAND_TILES_PER_CITY = { low: 45, normal: 30, high: 20 }`. Stadtabstand ≥ 3 über ein `blocked`-Array (`tilesNear(…, 2)`) statt Vergleich gegen alle Städte.
- Namen: `CITY_NAMES` (40) zuerst; ab der 41. Stadt `generatedCityNames(rng, count)` aus 40 Vorsilben (Alt, Neu, Ober, Nieder, Nord, Süd, Ost, West, Eisen, Kohl, Dampf, Rost, Ruß, Messing, Kupfer, Zahnrad, Kolben, Niet, Schlot, Kessel, Teer, Glut, Asche, Nebel, Salz, Sturm, Funken, Blei, Stahl, Gas, Öl, Schiefer, Kran, Signal, Anker, Turbinen, Hammer, Möwen, Krähen, Pump) × 40 Grundwörtern (hafen, burg, furt, berg, feld, wacht, heim, stedt, bach, tal, au, brück, horn, kai, werft, dock, grund, hall, bucht, rode, mark, fels, sund, stein, kap, licht, werk, hain, moor, ried, wald, see, born, hof, dorf, münde, eck, gau, hagen, hausen), ohne Kollision mit `CITY_NAMES`/`CAPITAL_NAMES`, ohne Wiederholung (gemischte Indexliste); kleine Karten verbrauchen keine zusätzlichen Zufallszahlen.

### Task 6: KI im Budget (`engine/ai.ts`, `engine/explore.ts`)

- `MAX_COMMANDS` wird ein deterministisches Arbeitsbudget: `WORK = { command: 20, pathNode: 1 }`, `MAX_WORK = 60_000`, ein `PathBudget` wird durch `planUnit → approach → findPath` gereicht, `MAX_PATH_NODES = 3_000` je KI-Wegsuche. Gleiche Reihenfolge ⇒ gleicher Seed, gleicher Zug. Zusätzlich ein Wanduhr-Ventil `AiTurnOptions.deadline` (Epoch-ms), das der Server mit 10 s setzt; Tests setzen keines.
- Expansion: 3 nächste Städte nach `hexDistance`, `approach` mit höchstens 2 freien Nachbarn ⇒ ≤ 6 budgetierte Wegsuchen je Entscheidung. Erkundung: `frontierNear(idx, from, radius, limit)` über `tilesNear` (KI Radius 15, Rückfall 40; Flugzeuge Radius `fuel`, Kandidaten 40 → 12), `MAX_CANDIDATES` 8 → 4. Produktion: Schiffszahl einmal je Zug, Garnisonen über eine `Map<hexKey, Einheiten>`.

### Task 7: Server (`apps/server`)

- `@fastify/compress` registrieren (Schwelle 2 KB, br/gzip; `app.inject`-Tests senden kein `Accept-Encoding`).
- `matches/service.ts:runAITurns`: bleibt in der gesperrten Transaktion, mit `deadline: Date.now() + 10_000` je KI; Kommentar zur Folge (6 KIs bis 60 s Sperre, Hintergrundjob als spätere Spec).
- `lobby/service.ts:mapInfo`: Label über `mapSizeLabel(state.map.width, state.map.height)` (Altpartien zeigen „14×10“), Landanteil aus `terrain` zählen. `setup/service.ts:engineMap` über `mapSize(id)`. `matches/command.ts:isCoord` prüft `0 ≤ col,row < MAX_MAP_SIDE`.
- Spielstand auf Imperium mit 6 Spielern und 600 Städten ≈ 250–350 KB JSON (heute ≈ 4 MB); Lobby-Poll lädt entsprechend weniger.

### Tests Engine

- Anpassen: `fixtures.ts` (`terrain` aus den ASCII-Zeilen, `explored` als Bitset), `mapgen.test.ts` (Strings statt `tiles`, Eindeutigkeit der Namen auch auf Imperium), `ai.test.ts` (Simulation jetzt 40×40, Laufzeit prüfen), `erkunden.test.ts` (`countBits`, `isExplored`), `engine/__tests__/lobby.test.ts`, `engine.test.ts:472`, Server `setup.test.ts` (fünf Stufen, `map.terrain`), `lobby.test.ts` (`markAllExplored`), `validate.test.ts` (Rundenlimit `null`).
- Neu: `bits.test.ts` (Round-Trip für n ∈ {1, 6, 7, 400, 40000}, `hasBit`), `migration.test.ts` (alter Spielstand mit `tiles[]`/`explored[]` → kompakt, Sicht identisch), `mapcodec.test.ts` (`expandMap`, `packMap`, `buildIndex` kompakt), `findPath` mit Budget (null bei Erschöpfung, sonst gleicher Weg), `mapgen.test.ts` (Stadtzahl je Stufe ±15 %, 6 Hauptstädte bei 20 % Land auf Klein, Generierung Imperium < 2 s), `ai.test.ts` Imperium-Rauchtest (200×200, 2 KIs, 3 Runden, jeder KI-Zug < 10 s, Determinismus über 2 Runden, Timeout 120 s) und eine 30-Runden-Simulation hinter `SLOW_TESTS`.

## Oberfläche

### Task 8: Kompakte Karte im Client

- Komponenten lesen die kompakte Karte direkt (kein `expandMap` je Antwort): `HexMap` (`tileByKey` → `visibilityAt`), `MiniMap`, `audio/ambience.ts` (keine `Map` aller Felder, Schleife über den Sichtbereich mit `terrainAt`/`visibilityAt`), `sections/spielfeld/components/hex.ts` re-exportiert `terrainAt`, `visibilityAt`, `packMap`. `useMatchView` bleibt mit Structural Sharing (Stringvergleich ist billig, Identität von `unitTypes`/`participants` bleibt erhalten). Koordinatenanzeigen „col,row“ bleiben.

### Task 9: Kamera außerhalb des React-States

- Neu `components/camera.ts` (rein, getestet): `Camera`, `MAX_SCALE = 2.4`, `DEFAULT_MIN_SCALE = 0.45`, `fitScale`, `scaleBounds` (Mindestzoom = min(0,45, Einpassen); Imperium auf 1280×720 ≈ 0,058), `clampCamera` (Kartenrand darf bis zur Bildschirmmitte, kleinere Karten zentriert, No-op bei Viewport 0 für jsdom), `zoomAt`, `fitCamera`, `visibleTileRange(cam, viewport, map, pad)` (Eckenmathematik aus `ambience.ts` hierher), `cameraEquals`.
- Neu `components/cameraStore.ts`: `createCameraStore` mit `get/set/subscribe/animateTo` (rAF-Tween statt CSS-Transition, damit Canvas und SVG synchron bleiben), Hooks `useCameraRange` (setzt React-State nur, wenn sich der sichtbare Feldbereich um ≥ 2 Felder ändert) und `useCameraValue`.
- `Spielfeld.tsx`: `cameraStore` statt `useState`, `centerOnPixel` und Initialkamera über den Store mit Clamping, Knopf „Karte einpassen“ (`Maximize2`) neben der Lagekarte, Tasten `+`/`-`/Pfeile (80 px, Shift ×4)/`f`; Ambiente-Effekt liest die Kamera im Debounce aus dem Store; `reachable`/`unsafeTiles` memoisiert. `HexMap`: Welt-`<g>` per `useLayoutEffect` imperativ transformiert (keine React-Renderung je Pointermove), Pan und Zoom über `clampCamera`/`zoomAt`; `MIN_SCALE`/`MAX_SCALE` aus `HexMap` und `ambience.ts` entfernt, Ambiente-Lautstärke auf logarithmischer Zoomskala zwischen `bounds.min` und `max`.

### Task 10: Gelände und Nebel auf Canvas

- Neu `components/terrainChunks.ts` (rein, getestet): `CHUNK_PX = 512`, `levelFor(scale, dpr)` (Zweierpotenz in [1/16, 2]), `chunkWorldSize`, `chunksInView`, `tileRangeForWorldRect`, `chunksForTile`, `diffVisibility(prev, next)` (geänderte Indizes zweier Sichtstrings), `detailFor(level)` (Glyphen ab 20 px Hex, Konturen ab 10 px, Rechtecke unter 6 px), `drawTile` (Hex als gecachter `Path2D`, Wald/Hügel/Gebirge/Wellen-Glyphen als Canvas-Pfade, Nebel: unerforscht dunkel mit Schraffurmuster, erforscht halbtransparent), `PALETTE` hell/dunkel aus den heutigen Farbwerten.
- Neu `components/TerrainCanvas.tsx`: `<canvas data-testid="terrain-canvas">` unter dem SVG (SVG behält Pointer-Events und `role="application"`); `getContext('2d')`-Guard (jsdom); Chunk-Cache (LRU 96) mit Dirty-Set; bei Kartenwechsel: neuer `terrain`-String → Cache leeren, sonst nur Chunks der geänderten Sichtfelder; Frame je Store-Änderung (ein rAF), Zeitbudget 6 ms je Frame, fehlende Chunks aus benachbarter Stufe überblenden und nachrendern; Theme-Wechsel leert den Cache. `TerrainLayer`, `TerrainGlyph`, `TERRAIN_FILL`, `#dos-hatch` aus `HexMap.tsx` entfernen (`#dos-hatch-rose` bleibt).

### Task 11: SVG-Overlays nur im Sichtbereich, Minikarte auf Canvas

- `HexMap.tsx`: `useCameraRange` liefert den Bereich, `inView(c)` (null in jsdom ⇒ alles rendern, bestehende Tests unverändert); memoisierte Schichten `ReachLayer`, `CityLayer` (Städte nur sichtbar und im Bereich), `TokenLayer` (Stapelbildung nach dem Aussortieren unsichtbarer Einheiten, gewählte Einheit immer); feste Hex-Punkte plus `transform` statt `hexPoints` je Feld; `data-testid` `unsafe-tile`/`attack-marker` bleiben.
- `MiniMap.tsx` neu auf Canvas: ein Pixelraster von 4 Gerätepixeln je Hex (Imperium ≈ 800×700), Gelände-Bitmap einmal je `terrain`, Sichtänderungen nur für `diffVisibility`-Indizes nachgezeichnet, `visibleCities` memoisiert über `visibilityAt`, Städtequadrate und Viewport-Rechteck je Kamera-Frame, Klick springt wie heute; `role="img"` „Minikarte, antippen zum Springen“.
- Hover-Wegvorschau in `Spielfeld.tsx`: ein rAF je Frame, `findPath` mit `maxNodes: 2500`, keine Vorschau jenseits von 25 Feldern Abstand; Tipp- und Drop-Ziele weiter ohne Budget.

### Task 12: Setup-Assistent, DevBar

- `partie-setup/components/setup.ts`: `roundLimitForSize`, `roundLimitAfterSizeChange` (Stufenvorgabe übernehmen, solange der Spieler das Limit nicht selbst geändert hat).
- `StepMap.tsx`: Raster `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`, Fußabdruck als Quadrat mit logarithmischer Seitenlänge (Klein 16 px bis Imperium 56 px), Beschriftung „40.000 Felder“, „200×200“, Spielerempfehlung, „Rundenlimit: 500“; Stufenwechsel setzt das Rundenlimit über `roundLimitAfterSizeChange`. `StepRules.tsx`: Optionen inklusive „Ohne Limit“, Hinweis „Empfohlen für Imperium: 500“. `StepSummary.tsx`: Felderzahl und „ohne Rundenlimit“. `DevBar.tsx`: Optionen aus `SETUP_OPTIONS.mapSizes`.

### Tests Oberfläche

- Anpassen: `test/setup.ts` (`getContext` → `null`), `Spielfeld.test.tsx` und `report.test.ts` (`packMap(sample.map)`, Beispieldatei bleibt), `selection.test.ts`/`ambience.test.ts` (Strings), `MatchPage.test.tsx` (fünf Optionen inklusive „Imperium“), `PartieSetup.test.tsx` (Imperium → Zusammenfassung „500 Runden“; eigenes Limit bleibt bei Stufenwechsel), `lobbyData.ts` unverändert.
- Neu: `camera.test.ts`, `terrainChunks.test.ts`, `cameraStore.test.ts`, Rauchtests `TerrainCanvas`/`MiniMap` ohne 2D-Kontext, Minikarte zählt unerforschte Städte nicht, `StepMap` fünf Stufen, Tasten `+`/`-`/`f` ändern den Store.

## Verifikation

1. `pnpm test`, `pnpm typecheck`, `pnpm lint`; Imperium-Rauchtest der KI (< 10 s je Zug), Generierung < 2 s, Bits/Migration/Codec grün.
2. Container `docker compose up -d --build`: Solo-Partie Imperium über die DevBar; Playwright-Skript misst Antwortgröße von `/view` (Ziel < 60 KB komprimiert), Bildrate beim Schwenken bei Zoom 1 und beim Einpassen (Ziel ≥ 55 fps), erste Geländezeichnung < 50 ms; Screenshots eingepasst und bei Zoom 1 für `visuals/`. Alte Demo-Partie öffnen (Migration `tiles[]`/`explored[]`).
3. Setup-Assistent: fünf Stufen, Rundenlimit folgt der Stufe, „Ohne Limit“ nur mit anderer Siegbedingung; Lobby zeigt Altpartien als „Breite×Höhe“.
4. Klein 20×20 mit 6 Spielern bei 20 % Land erzeugt alle Hauptstädte (sonst `MAP_TOO_SMALL`).
