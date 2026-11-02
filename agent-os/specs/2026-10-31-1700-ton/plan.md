# Spec: Ton – Musik, Ambiente und Soundeffekte

## Context

Die Audiodateien liegen seit Commit `50e1ed6` unter `public/audio/` (17 Musikstücke, 7 Ambiente-Schleifen, 79 Effekte in 47 Gruppen, `manifest.json`), aber nichts spielt sie ab. Die Ton-Einstellungen (`Settings.sound`: `muted`, `master`, `effects`, `music`, `ambience`, je 0–100) werden nur gespeichert. Roadmap Phase 2, Punkt „Ton“. Shaping-Entscheidungen:

- **Alles in einer Spec:** Effekte, Menümusik, adaptive Spielfeldmusik mit drei Schichten und Fraktionsthemen, Geländeambiente, wirksame Regler.
- **Stummschalter** als Lautsprecher-Symbol in der Kopfzeile (Menü- und Spielmodus), schaltet `sound.muted` und speichert.
- **Ton ab dem ersten Klick** ohne Nachfrage: Der Browser gibt Audio erst nach einer Nutzeraktion frei; die erste Interaktion in der App entsperrt den `AudioContext`, die Menümusik blendet leise ein.
- **Keine Abhängigkeit:** eigene kleine Engine auf der Web Audio API (`AudioContext`, `GainNode`-Busse, `AudioBufferSourceNode`). Howler o. ä. brächte nichts, was für Crossfades auf Taktgrenzen und den gemeinsamen Zeitstrahl der Schichten gebraucht wird.
- **Komponenten der Design-Übergabe bleiben tonlos** (Vorgabe aus `product-plan/instructions/incremental/02-spielfeld-and-zuge.md:170`): Spielfeld meldet typisierte **Cues** über einen Callback, `MatchPage` übersetzt sie in Sounds. UI-Klicks, Schalter und Dialoge werden zentral per Event-Delegation erkannt, nicht in jeder Komponente.

Erkenntnisse aus der Erkundung, auf denen der Plan aufbaut:

- **Manifest** (`public/audio/manifest.json`): `music` (id → Pfad), `ambience`, `sfx` (id → Pfade der Varianten), `playback.adaptive_field`: die drei Spielfeld-Schichten sind **komplette Mixe** derselben Länge (76,385 s, 48 kHz, ca. 87,975 BPM, 4/4 → 28 Takte à 2,728 s) und sollen **überblendet, nicht summiert** werden; `keep_shared_timeline: true`, `crossfade_bars: 2`. `music_loop_ids` = menu-lobby, menu-setup, field-explore/tension/combat; Themen, Sieg und Niederlage sind Einzelstücke. Varianten: zufällig, nicht zweimal dieselbe hintereinander.
- **Brief** (`product-plan/briefs/audio-brief.md`): Zuordnung der Menümusik (`menu-lobby` für Lobby, Kompendium, Profil, Einstellungen; `menu-setup` für Partie-Setup und Warteraum), Schichtregeln (Anspannung bei Feind in Sicht oder bedrohter Stadt, Kampf bei Angriff in diesem Zug, Kampfanimation oder Gegnerzug mit Angriffen; Wechsel nur auf Taktgrenzen über 2 Takte; Kampf → Anspannung nach einem Zug ohne Kampf, Anspannung → Erkunden nach zwei Zügen ohne Feind; Fraktionsthema als Einleitung beim ersten Kampf einer Partie), Ambiente nach Geländeanteil im sichtbaren Ausschnitt (lauter beim Hineinzoomen, leiser im Nebel), komplette SFX-Tabelle, „Effekte dürfen die Musik kurz übertönen, Musik nie die Effekte“.
- **Einhängepunkte** in `apps/web/src/sections/spielfeld/components/Spielfeld.tsx`: `selectUnit` (223, `selectedType.id`), `setPreview` (503, 543), `commitMove`/`sendMove` (443–460), `confirmAttack` (334), Kampfsequenz-Effekt (268–326) mit `combatTimeline` (muzzle 0,2 · blast 0,4 · resolve 0,7 · end) und `lastCombat` (`outcome`, `attackerDamage`, `defenderDamage`, `targetCityId`), `handleEndTurn` (614), Rundenbericht-Effekt bei Phasenwechsel (395–405), Replay-Timer (355–371, 500 ms je Schritt), `nextUnit` (583), Panels `selectedUnit`/`selectedCity`, `camera`/`viewport` (100–101), Index `idx` (92) mit `tileAt`. `MatchPage.tsx`: `useMatchCommand({ onCombat, onRejected })`, Fehlercodes `UNREACHABLE`, `INVALID_TARGET` usw.
- **Sicht:** `view.units` enthält nur sichtbare Fremdeinheiten → Feind in Sicht = `units.some(u => u.ownerId !== youId)`. `view.result` statt Phase `ended`. Ereignisse `PlayerView.events` mit `isNew` (`cityLost`, `cityCaptured`, `unitBuilt`, `fuelLow`, `unitLost`, …). Gelände: `deepSea | shallows | plains | forest | hills | mountains`, Städte über `idx.cityAt`, Nebel über `tile.visibility`.
- **Einstellungen:** `useSettings()` (React Query, `setLocal` sofort), `ApplyPlayerSettings` in `auth/RequireAuth.tsx:21` als Vorbild für einen globalen Anwender. `Einstellungen.tsx` zeigt Rubrik „Ton“ mit Switch „Stumm“ und vier Slidern.
- **Tests:** jsdom ohne `AudioContext`; Engine muss hinter einer Schnittstelle liegen, Tests nutzen eine Aufzeichnungs-Attrappe.
- **Kein Hover-Pfad:** Pfadvorschau entsteht beim ersten Tipp oder beim Ziehen. Push-Ton im Service Worker ist im Browser nicht möglich (Notifications spielen keine eigenen Dateien), `notify-*` kommen aus der App.

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-10-31-HHMM-ton/`: `plan.md` (dieser Plan), `shape.md` (Entscheidungen, Zuordnungstabellen Cue → Sound, Zustandsautomat der Spielfeldmusik, Ambiente-Formel), `standards.md`, `references.md`. `visuals/`: `umsetzung-kopfzeile-stumm.png`, `umsetzung-einstellungen-ton.png`; dazu kein Ton-Screenshot möglich, stattdessen ein Mitschnitt der Cue-Folge einer Testpartie in `shape.md`.

## Task 2: Audio-Engine `apps/web/src/audio/`

- `ids.ts`: Literal-Typen `MusicId`, `AmbienceId`, `SfxId` (alle 47), `UNIT_SFX` (Einheitentyp → select/move) und `MANIFEST_URL = '/audio/manifest.json'`. Test `ids.test.ts` liest `public/audio/manifest.json` per `fs` und prüft, dass die Typen und das Manifest dieselben IDs haben (kein Drift, wenn neue Dateien kommen).
- `engine.ts`: Schnittstelle `AudioEngine` und Implementierung `WebAudioEngine`:
  - `unlock()` beim ersten `pointerdown`/`keydown` (einmalige Listener auf `window`, `once`): `AudioContext` anlegen bzw. `resume()`, Manifest laden, danach `onReady`.
  - Busse: `master → destination`, `music`, `sfx`, `ambience → master`. `setVolumes({ muted, master, effects, music, ambience })` setzt Gains mit Kurve `(v/100)^2` (wahrgenommene Lautstärke), `muted` → master 0; Änderungen als `setTargetAtTime` über 50 ms (kein Knacken).
  - `load(id)`: `fetch` → `decodeAudioData`, Cache je Pfad, laufende Ladevorgänge dedupliziert; `preload(ids[])`.
  - `playSfx(id, { gain? })`: Variante zufällig, nicht dieselbe wie zuletzt (Merker je Gruppe), `AudioBufferSourceNode` → sfx-Bus; höchstens 8 gleichzeitige Effekte, älteste verdrängt; Effekte vor dem Laden werden verworfen, nicht nachgeholt.
  - Musik als **Decks**: `playMusic(id, { loop, fadeMs = 1500 })` blendet das laufende Deck aus und das neue ein (Gain-Rampen `linearRampToValueAtTime`); `stopMusic(fadeMs)`.
  - **Schichten**: `startLayers(ids[], { barSeconds })` startet alle drei Schleifen zur selben `ctx.currentTime` auf eigenen Gains (nur die aktive bei 1); `setLayer(id, { bars = 2 })` berechnet die nächste Taktgrenze aus Startzeit, `barSeconds` und `currentTime` und plant die Rampen beider Gains dort über `bars · barSeconds`. `barSeconds = duration_seconds / 28` aus dem Manifest (`frames / sample_rate`), nicht aus den geschätzten BPM. `stopLayers(fadeMs)`.
  - **Einzelstück über Schichten**: `playStinger(id, { duckTo = 0.2 })` (Fraktionsthema, Sieg, Niederlage): Schichten auf `duckTo` ziehen, Stück auf dem music-Bus spielen, danach Schichten zurück bzw. bei Sieg/Niederlage aus. Gibt ein Promise zurück, das beim Ende auflöst.
  - **Ambiente**: `setAmbience(mix: Partial<Record<AmbienceId, number>>, fadeMs = 800)`: je Schleife ein dauerhaft laufender Loop (lazy beim ersten Gewicht > 0), Gains auf die Gewichte gerampt; `stopAmbience()`.
  - Alles tolerant: ohne `AudioContext` (alte Browser, jsdom) ist die Engine ein No-op; Ladefehler werden einmal pro Datei geloggt.
- `fakeEngine.ts` (Test-Hilfe): zeichnet alle Aufrufe auf (`calls: {method, args}[]`), für Komponententests.
- `AudioProvider.tsx` + `useAudio()`: Context mit `{ sfx(id), engine, unlocked }`; erzeugt die Engine einmal (per Prop austauschbar, Tests reichen `fakeEngine`), hängt `unlock` ein, spiegelt `useSettings().data.settings.sound` nach `setVolumes` (Vorgabe `DEFAULT_SETTINGS.sound`, solange die Einstellungen laden), lädt nach dem Entsperren `menu-lobby` und die UI-Effekte vor.
  - **UI-Delegation** (im Provider, ein `click`-Listener auf `document`, Capture-Phase): Ziel `closest('button, [role=button], a[href], [role=menuitem], [role=tab]')`; bei `role=switch`, `role=radio`, Segment-Buttons (`[aria-pressed]`, `[aria-checked]`) → `ui-toggle`, sonst `ui-click`; deaktivierte Elemente (`disabled`, `aria-disabled`) → `ui-error`; Elemente mit `data-sound="none"` still (Slider, die Stummtaste selbst spielt `ui-toggle`). Range-Inputs lösen nichts aus.
  - **Dialoge**: `MutationObserver` auf `document.body` für hinzugefügte/entfernte Knoten mit `[role=dialog]`/`[role=alertdialog]` → `ui-panel-open`/`ui-panel-close` (entprellt, 100 ms). Deckt Sheets, Angriffsdialog, Zug-beenden, Rundenbericht, Benutzermenü nicht (Menü ist kein Dialog, bekommt `ui-click`).
  - **Routen-Musik** (`useLocation`): `/neue-partie`, `/warteraum/*`, `/einladung/*` → `menu-setup`; `/partie/*` → keine Menümusik (Spielfeld übernimmt); alles andere → `menu-lobby`. Wechsel per `playMusic` mit Crossfade; gleiche ID bleibt laufen. Sichtbarkeit: bei `visibilitychange` hidden → Musik und Ambiente auf 0 gerampt, zurück → wieder hoch (keine Musik in Hintergrund-Tabs).
- Einbau: `AudioProvider` in `auth/RequireAuth.tsx` um `<Outlet />` (neben `ApplyPlayerSettings`). Anmeldeseiten bleiben still.

## Task 3: Stummschalter und Einstellungen

- `shell/AppShell.tsx`: neue optionale Prop `headerExtra?: ReactNode`, gerendert links vom Benutzermenü (Menümodus: im `ml-auto`-Block, Spielmodus: vor dem Spielmenü). Komponente `settings/MuteButton.tsx`: Icon `Volume2`/`VolumeX`, `aria-label` „Ton aus“/„Ton an“, `aria-pressed`, `data-sound="none"` plus eigener `ui-toggle` nach dem Umschalten (nur beim Einschalten hörbar). Umschalten: `useSettingsActions().setLocal` + `save` mit `sound.muted` invertiert (gleicher Weg wie die Einstellungsseite), `title` mit Hinweis „Lautstärke in den Einstellungen“. Eingehängt in `MenuLayout` und `GameLayout`.
- `pages/profil/SettingsPage.tsx`: beim erfolgreichen Speichern (`flush` → `save` erfüllt) `ui-saved` spielen; `Einstellungen.tsx` bleibt unverändert (Switch und Segmented bekommen `ui-toggle` über die Delegation, Slider nichts). Die Regler wirken live, weil `setLocal` die Query sofort ändert und der Provider darauf hört.

## Task 4: Spielfeld-Cues (`sections/spielfeld/`)

- `types.ts`: `BoardCue` als diskriminierte Union und Prop `onCue?: (cue: BoardCue) => void`:
  - `{ type: 'unitSelected', unitTypeId }`, `{ type: 'unitMoved', unitTypeId }`, `{ type: 'moveInvalid' }`, `{ type: 'pathPreview' }`, `{ type: 'attackStarted', attackerTypeId, domain }`, `{ type: 'hit' }`, `{ type: 'unitDestroyed' }`, `{ type: 'cityCaptured' }`, `{ type: 'turnEnded' }`, `{ type: 'turnStarted' }`, `{ type: 'replayStep', action, last }`, `{ type: 'event', eventType }` (neue Ereignisse: `cityLost`, `unitBuilt`, `fuelLow`), `{ type: 'ambience', mix, zoom }`.
- `Spielfeld.tsx` (kleine Einschübe, je eine Zeile `cue({...})`):
  - `selectUnit`: nur bei Wechsel auf eine eigene Einheit → `unitSelected`.
  - `sendMove`: `unitMoved` mit `selectedType.id` (beim Absenden; ein serverseitig verweigerter Zug meldet `MatchPage` über `onRejected`).
  - `handleTap`/`handleDrag`: Vorschau neu gesetzt mit Pfad → `pathPreview` (nur wenn sich das Ziel ändert); Tipp auf ein unerreichbares Feld mit gewählter eigener Einheit mit Bewegung → `moveInvalid` (statt stillem Durchfallen; die Auswahl bleibt wie heute).
  - `confirmAttack`: `attackStarted` mit Typ und Domäne des Angreifers (Sound: `combat-gun` für Grenadiere, `combat-cannon` für Panzerwagen, Dampfkoloss und alle Schiffe, `combat-air` für Flugzeuge).
  - Kampfsequenz-Effekt: bei `blast` → `hit`; bei `resolve`, wenn der Verlierer zerstört ist (`lastCombat.outcome` plus Schaden: Angreifer oder Verteidiger auf 0 bzw. aus der Einheitenliste verschwunden) → `unitDestroyed`; bei `finish()` mit `outcome === 'victory' && targetCityId` → `cityCaptured`. Ohne Animation (`timeline === null`) sofort nacheinander.
  - `handleEndTurn` beim tatsächlichen `onEndTurn()` → `turnEnded`.
  - Rundenbericht-Effekt beim Phasenwechsel auf den eigenen Zug → `turnStarted` (einmal je Runde, gleicher Merker wie der Bericht).
  - Replay-Timer je Schritt → `replayStep` (`action`, `last`); bei `attack`/`capture` am letzten Schritt zusätzlich `hit`.
  - Neue Ereignisse: Effekt über `events` mit `isNew` und noch nicht gemeldeter `id` (Ref-Set) → `event` je Typ (`cityLost`, `unitBuilt`, `fuelLow`); maximal einer je Typ pro Ansicht, damit der Zugbeginn nicht knattert.
  - **Ambiente**: `useEffect` auf `camera`/`viewport`, gedrosselt (250 ms, `requestAnimationFrame`-frei per `setTimeout`): sichtbare Hex-Spanne aus Kamera berechnen, Kacheln zählen: `deepSea → amb-sea`, `shallows → amb-coast` (plus Landfelder mit Wassernachbar zur Hälfte), `plains → amb-plains`, `forest → amb-forest`, `hills|mountains → amb-mountains`, Feld mit Stadt → `amb-city`, `visibility === 'unexplored'` → `amb-fog`. Anteile normieren, Zoomfaktor `zoom = clamp((scale − min)/(max − min), 0, 1)`; Cue `ambience` nur bei Änderung über 2 Prozentpunkte.
- `HexMap.tsx` bleibt unverändert.

## Task 5: Spielfeldmusik und Cue-Übersetzung (`pages/`)

- `audio/fieldMusic.ts` (rein, getestet): Zustandsautomat `fieldState(prev, input)` mit `input = { round, enemyVisible, cityThreatened, combatThisTurn, replayHasCombat }` → `'explore' | 'tension' | 'combat'` plus Zähler `quietTurns`, `calmTurns`. Regeln aus dem Brief: Kampf, sobald `combatThisTurn || replayHasCombat`; sonst Anspannung bei `enemyVisible || cityThreatened`; Kampf → Anspannung nach einer Runde ohne Kampf; Anspannung → Erkunden nach zwei Runden ohne Feind. `cityThreatened` = sichtbare Fremdeinheit im Abstand ≤ 2 zu einer eigenen Stadt (`hexDistance`). `replayHasCombat` = `view.replay.some(a => a.action !== 'move')` während `phase === 'replay'`.
- `pages/useMatchAudio.ts` (Hook, in `MatchPage`):
  - Beim Mount: `engine.preload` der drei Schichten und des eigenen Fraktionsthemas, dann `startLayers` mit `barSeconds` aus dem Manifest; Menümusik stoppt (Provider sieht `/partie/*`). Beim Unmount `stopLayers`, `stopAmbience`.
  - Je Ansicht: `fieldState` auswerten → `setLayer`. Erster Wechsel auf `combat` in dieser Partie (Merker `sessionStorage` `dos-theme-played:<matchId>`) → `playStinger('<faction>-theme')`, Kampfschicht setzt mit Taktgrenze nach dem Thema ein.
  - `view.result` gesetzt und noch nicht gemeldet (Merker `dos-result-played:<matchId>`): `winnerId === youId` → `<faction>-victory`, sonst `<faction>-defeat`; Schichten blenden aus, danach bleibt es still bis zum Verlassen (Menümusik kommt beim Routing zurück).
  - `onCue`: Tabelle Cue → `sfx(...)`: `unitSelected` → `${typ}-select`, `unitMoved` → `${typ}-move`, `moveInvalid` → `move-invalid`, `pathPreview` → `path-preview` (gedrosselt 150 ms), `attackStarted` → Domänen-Sound, `hit` → `explosion-small`, `unitDestroyed` → `explosion-large`, `cityCaptured` → `city-captured`, `turnEnded` → `turn-end`, `turnStarted` → `turn-start`, `replayStep` → `replay-step`, `event cityLost` → `city-lost`, `event unitBuilt` → `production-done`, `event fuelLow` → `fuel-low`, `ambience` → `setAmbience(mix · (0,4 + 0,6·zoom))`.
  - `onRejected` in `MatchPage`: Codes `UNREACHABLE`, `INVALID_TARGET`, `NO_MOVES`, `NOT_BUILDABLE`, `INVALID_ORDER` → `move-invalid`, übrige → `ui-error`.
- `pages/lobby/LobbyPage.tsx` und `layouts/MenuLayout.tsx` (dort hängt `useLobby` für das Nav-Badge): Hook `useLobbySounds(data)` vergleicht mit der vorigen Lobby-Antwort (Ref): neue Einladungs-ID → `notify-invite`; Partie wechselt auf `yourTurn` → `notify-your-turn`; `deadlineSoon` aus den Lobby-Daten (Frist < `deadlineWarningHours`, vorher nicht) → `notify-deadline`. Erste Antwort nach dem Laden löst nichts aus. Lebt im `MenuLayout`, damit es auf allen Menüseiten greift.
- `pages/shared/toast.tsx`: `error()` → `ui-error` (einmal je Toast); `info()` bleibt still (Klick hatte schon `ui-click`).

## Task 6: Tests

- `audio/ids.test.ts`: Typen gegen Manifest (siehe oben).
- `audio/engine.test.ts`: Hilfsfunktionen rein testen: Variantenwahl ohne Wiederholung, `nextBarTime(start, barSeconds, now)`, Lautstärkekurve, `setVolumes` bei `muted`. Dazu `WebAudioEngine` mit einem minimalen `AudioContext`-Stub (`createGain`, `createBufferSource`, `decodeAudioData`, `currentTime`) für Bus-Verdrahtung und Crossfade-Rampen (Aufrufe von `linearRampToValueAtTime` mit erwarteten Zeiten).
- `audio/fieldMusic.test.ts`: Übergänge laut Brief, inklusive Rückfall nach einer bzw. zwei Runden, `cityThreatened`-Abstand.
- `audio/ambience.test.ts`: Mischung aus Kachelzählung, Normierung, Nebelanteil, Zoomfaktor.
- `AudioProvider.test.tsx`: mit `fakeEngine`: Klick auf Button → `ui-click`, auf Switch → `ui-toggle`, auf disabled → `ui-error`; Dialog erscheint → `ui-panel-open`; Routenwechsel `/` → `/neue-partie` → `playMusic('menu-setup')`; Einstellungen `muted` → `setVolumes` mit `muted: true`; Stummschalter in der Kopfzeile ruft `PUT /settings` mit `sound.muted`.
- `pages/MatchPage.test.tsx` (bestehend, erweitern): Partie öffnen → `startLayers([...])`; Einheit wählen → `panzerwagen-select`; Zug beenden → `turn-end`; abgelehnter Befehl `UNREACHABLE` → `move-invalid`; Ansicht mit sichtbarem Feind → `setLayer('field-tension')`; `view.result` mit Sieg → `playStinger('eisenbund-victory')`.
- `Spielfeld.test.tsx` (bestehend): `onCue`-Aufrufe bei Auswahl, Angriff (Sequenz `attackStarted` → `hit` → `unitDestroyed`), Zugende, Replay-Schritt.
- `Lobby.test.tsx`: zweite Lobby-Antwort mit neuer Einladung → `notify-invite`.
- `test/renderApp.tsx`: Option `audio?: FakeEngine`, Vorgabe eine frische Attrappe, über `AudioProvider engine=` gereicht.

## Task 7: Dokumentation

- `README.md`: Abschnitt „Ton“ (Engine, Busse, Cue-Prinzip, Routen-Musik, Schichten, Ambiente, Stummschalter, Grenzen: kein Ton auf Anmeldeseiten, kein Push-Ton, Browser verlangt erste Interaktion).
- `agent-os/product/roadmap.md`: „Ton“ als umgesetzt markieren.
- `agent-os/product/tech-stack.md`: Web Audio API ohne Bibliothek.
- `product-plan/briefs/audio-brief.md` bleibt unverändert; Abweichungen (Schichten als komplette Mixe, Takt aus der Dateilänge) stehen in `shape.md`.

## Verifikation

- `pnpm lint`, `pnpm typecheck`, `pnpm test` grün.
- Manuell mit `pnpm dev`: Anmelden → erster Klick in der Lobby startet `menu-lobby` leise; Wechsel zu „Neue Partie“ blendet auf `menu-setup`; Stummschalter in der Kopfzeile schaltet sofort und steht nach Neuladen noch; Regler in den Einstellungen wirken live, „Stumm“ setzt alles auf 0.
- Demo-Partie: Schichten starten, bei sichtbarem Feind (Demo hat Feindkontakt) `field-tension`; Angriff: Fraktionsthema, dann `field-combat`, Effekte Kanone/Treffer/Explosion; Panzerwagen wählen und ziehen spielt Auswahl- und Fahrgeräusch; Zug beenden `turn-end`, Rundenbericht beim nächsten Zug `turn-start`; Replay-Schritte ticken; Zoom und Schwenk über See/Wald ändern das Ambiente hörbar; Tab in den Hintergrund → still.
- Browser-Konsole ohne Audio-Fehler; Netzwerk-Tab: Schichten werden nur beim Betreten der Partie geladen, Effekte beim Entsperren.
- Screenshots Kopfzeile mit Stummschalter (Menü und Spiel) und Rubrik Ton in `visuals/`.
