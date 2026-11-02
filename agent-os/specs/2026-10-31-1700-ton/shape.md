# Ton: Shaping-Notizen

## Umfang

Roadmap Phase 2, Punkt „Ton“. Die Dateien aus dem Audio-Brief liegen seit Commit `50e1ed6` unter `public/audio/`; diese Spec spielt sie ab. Betroffen: neues Modul `apps/web/src/audio/`, Kopfzeile (`AppShell`), Layouts, `RequireAuth`, `MatchPage` mit `useMatchAudio`, Spielfeld-Cues (`onCue`), Einstellungsseite, Toasts.

## Entscheidungen

- **Alles in einer Spec:** Effekte, Menümusik, adaptive Spielfeldmusik mit drei Schichten, Fraktionsthemen, Sieg und Niederlage, Ambiente, wirksame Regler. Verworfen: Stufenweise Einführung, Effekte zuerst.
- **Eigene Engine auf der Web Audio API**, keine Bibliothek. Busse `master → out`, `music`, `sfx`, `ambience → master`, `layerBus → music` für die Schichten. Lautstärkekurve `(v/100)²`. Verworfen: Howler.js (Crossfades auf Taktgrenzen und gemeinsamer Zeitstrahl wären trotzdem Handarbeit), `<audio>`-Elemente (kein sauberes Überblenden).
- **Ton ab dem ersten Klick** ohne Nachfrage: `pointerdown`/`keydown` entsperrt den `AudioContext`, danach laden Oberflächen-Effekte und `menu-lobby`. Anmeldeseiten still (Provider sitzt in `RequireAuth`). Verworfen: Hinweisleiste, Vorgabe stumm.
- **Stummschalter** in der Kopfzeile beider Modi, schaltet `sound.muted` über denselben Weg wie die Einstellungsseite (`setLocal` + `PUT /settings`); hörbar nur beim Einschalten.
- **Komponenten bleiben tonlos:** Spielfeld meldet `BoardCue`s (`unitSelected`, `unitMoved`, `moveInvalid`, `pathPreview`, `attackStarted`, `hit`, `unitDestroyed`, `cityCaptured`, `turnEnded`, `turnStarted`, `replayStep`, `event`, `ambience`); `useMatchAudio` übersetzt. Oberflächen-Töne per Event-Delegation (`click` in der Capture-Phase, `MutationObserver` für `role=dialog`/`alertdialog`); `data-sound="none"` schaltet ein Element stumm. Verworfen: Sound-Aufrufe in jeder Komponente.
- **Schichten als komplette Mixe** (Abweichung vom Brief, Vorgabe des Manifests): alle drei laufen synchron, nur eine ist hörbar, Wechsel auf der nächsten Taktgrenze über `crossfade_bars` (2). Taktlänge = `frames / sample_rate / 28` aus dem Manifest, nicht aus den geschätzten 88 BPM.
- **Zustandsautomat** (`audio/fieldMusic.ts`): Kampf bei laufendem Angriff (`lastCombat`) oder Gegner-Replay mit Angriffen, hält bis eine ganze Runde ohne Kampf vergangen ist; Anspannung bei sichtbarem Feind oder Feind im Abstand ≤ 2 zu einer eigenen Stadt, hält zwei Runden; sonst Erkunden. Fraktionsthema einmal je Partie (`sessionStorage dos-theme-played:<id>`), Schichten auf 20 % abgesenkt; seit Playtest Runde 2 (1. November 2026) beim ersten Öffnen der Partie statt beim ersten Kampf, weil es bei einer Stadteroberung wie eine Siegesmelodie wirkte. Spielfeld-Effekte werden seitdem beim Betreten vorgeladen und verspätet eintreffende Dateien innerhalb von 1,5 s nachgeholt. Sieg/Niederlage einmal je Partie, danach Stille bis zum Verlassen.
- **Ambiente:** Kacheln im sichtbaren Ausschnitt zählen (`deepSea → sea`, `shallows → coast`, `plains`, `forest`, `hills|mountains → mountains`, Stadt → `city`, unerforscht → `fog`), normieren, Lautheit `0,4 + 0,6 · zoom`; gedrosselt auf 250 ms, Cue nur bei Änderung über 2 Prozentpunkte. Vor der ersten Messung dient die Fenstergröße als Ausschnitt.
- **Benachrichtigungstöne** aus dem Lobby-Polling im `MenuLayout` (Diff zur vorigen Antwort: neue Einladung, Partie neu auf „am Zug“, Frist unter der Warnschwelle). Push-Ton nicht möglich (Browser spielen keine eigenen Dateien aus dem Service Worker).
- **Hintergrund-Tab:** `visibilitychange` zieht den Ausgangsbus auf 0.
- **Effekte vor dem Laden** werden verworfen und für das nächste Mal geladen; höchstens 8 gleichzeitig.

## Zuordnung Cue → Sound

| Cue | Sound |
| --- | --- |
| `unitSelected` | `<typ>-select` |
| `unitMoved` | `<typ>-move` |
| `moveInvalid`, abgelehnter Befehl (`UNREACHABLE`, `INVALID_TARGET`, `NO_MOVES`, `NOT_BUILDABLE`, `INVALID_ORDER`) | `move-invalid` |
| `pathPreview` (höchstens alle 150 ms) | `path-preview` |
| `attackStarted` | `combat-gun` (Grenadiere), `combat-air` (Luft), sonst `combat-cannon` |
| `hit` / `unitDestroyed` | `explosion-small` / `explosion-large` |
| `cityCaptured`, Ereignis `cityLost` | `city-captured` / `city-lost` |
| `turnStarted` / `turnEnded` / `replayStep` | `turn-start` / `turn-end` / `replay-step` |
| Ereignis `unitBuilt` / `fuelLow` | `production-done` / `fuel-low` |
| Klick / Schalter / gesperrt / Dialog auf / zu / Fehler-Toast / gespeichert | `ui-click` / `ui-toggle` / `ui-error` / `ui-panel-open` / `ui-panel-close` / `ui-error` / `ui-saved` |
| Lobby: Einladung / am Zug / Frist | `notify-invite` / `notify-your-turn` / `notify-deadline` |

## Out of scope

Push-Ton, Ton auf den Anmeldeseiten, Hover-Pfadvorschau (gibt es nicht), Ambiente-Übergänge nach Tageszeit, Lautstärke je Einheit.

## Kontext

- **Visuals:** `visuals/umsetzung-kopfzeile-stumm.png`, `umsetzung-kopfzeile-spiel.png`, `umsetzung-einstellungen-ton.png`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 2, Punkt „Ton“; `product-plan/briefs/audio-brief.md`.

## Angewandte Standards

Noch keine, siehe `standards.md`.
