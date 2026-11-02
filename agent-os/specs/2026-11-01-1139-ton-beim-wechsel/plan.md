# Plan: Ton beim Wechsel (Playtest Runde 2, Spec 1)

## Context

Aus `agent-os/product/playtest-runde-2.md`, Punkte 1 bis 3: Siegesmusik und Lobby-Musik laufen gleichzeitig, wenn man nach dem Spielende schnell in die Lobby geht; auch außerhalb der Partie liefen Lieder übereinander; nach dem Abmelden spielt die Musik weiter. Keine neuen Screens, nur die Audio-Schicht in `apps/web/src/audio/` und ihr Einbau.

Ursachen aus der Erkundung:

- **Einzelstücke sind unsichtbar für das Deck.** `WebAudioEngine.playStinger` (`audio/engine.ts:437`) hängt Fraktionsthema, Sieg und Niederlage direkt an den `musicBus`, merkt sich die Quelle aber nicht. `playMusic`/`stopMusic` kennen nur `this.deck`, `dispose` stoppt nur Deck, Schichten, Ambiente. Verlässt man die Partie, ruft `RouteMusic` (`AudioProvider.tsx:230`) `playMusic('menu-lobby')`, während das Stück weiterläuft. `useMatchAudio` (`pages/useMatchAudio.ts:60-69`) stoppt im Cleanup nur Schichten und Ambiente.
- **Die Engine überlebt den Provider.** `AudioProvider` sitzt in `RequireAuth` (`auth/RequireAuth.tsx:22`). Beim Abmelden (`useSignOut`, `data/session.ts:61`) wird zur Anmeldeseite navigiert, der Provider wird abgebaut, aber `OwnedAudio` hat keinen Unmount-Cleanup; `engine.dispose()` (`engine.ts:501`) ruft niemand. Musik läuft weiter. Meldet man sich erneut an, entsteht ein zweiter `WebAudioEngine` mit eigenem `AudioContext`, beide spielen Menümusik: das sind die „Lieder übereinander“ außerhalb der Partie. Dieselbe Lücke betrifft das Fraktionsthema, wenn man die Partie mitten im ersten Kampf verlässt.

Entscheidung aus dem Shaping: Beim Verlassen der Partie blendet ein laufendes Ergebnisstück oder Fraktionsthema in etwa einer Sekunde aus, die Menümusik blendet ein („Lobby wartet“ und hartes Abschneiden verworfen). Öffentliche Seiten (Anmelden, Registrieren, Passwort, Impressum, Datenschutz, Lizenzen) bleiben still; das gilt schon heute, weil sie außerhalb von `RequireAuth` liegen, und wird nun durch den Abbau der Engine auch nach dem Abmelden eingehalten.

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-11-01-HHMM-ton-beim-wechsel/`: `plan.md` (dieser Plan), `shape.md` (Umfang, Ursachen, Entscheidung „ausblenden“, Verworfenes), `standards.md` (keine Standards in `agent-os/standards/`; Repo-Konventionen: Komponenten spielen keinen Ton, Doku Deutsch, Kommentare Englisch, Vitest), `references.md` (Ton-Spec `2026-10-31-1700-ton`, `engine.ts`, `AudioProvider.tsx`, `useMatchAudio.ts`, `RequireAuth.tsx`, `session.ts`, Tests), `visuals/` leer mit Hinweis (Audio, keine Screenshots). Danach in `playtest-runde-2.md` und `roadmap.md` (Phase 1c) als umgesetzt markieren, wie in Runde 1.

## Task 2: Engine kennt ihre Einzelstücke (`apps/web/src/audio/engine.ts`)

- Neues Feld `private stinger: { loop: Loop; token: number } | null` plus `stingerToken`. `playStinger` legt die Quelle dort ab, nutzt `onended` zum Aufräumen und löst das Promise auch auf, wenn das Stück vorzeitig gestoppt wird (Resolve-Funktion merken, nicht nur `onended`).
- Neue Methode `stopStinger(fadeMs = DEFAULT_FADE_MS)`: `stopLoop` auf die Quelle, Promise auflösen, `layerBus` wieder auf 1 nur wenn Schichten noch laufen, Token hochzählen, damit ein noch ladendes Stück nicht mehr startet.
- `playMusic` ruft vor dem Start des Decks `stopStinger(fadeMs)`; `stopMusic` ebenfalls. Damit greift die Regel „zu jeder Zeit höchstens ein Musikstück“ im Deck-Weg, ohne dass die Aufrufer etwas wissen müssen.
- `dispose()` stoppt zusätzlich den Stinger und lehnt spätere Wünsche ab (`desiredMusic = null`, `layersWanted = false`), damit ein noch laufender `load`-Callback nach dem Abbau nichts mehr startet (`this.ctx === null` fängt das bereits ab, Token zur Sicherheit erhöhen).
- Interface `AudioEngine` um `stopStinger` ergänzen; `fakeEngine.ts` zeichnet den Aufruf auf (`note('stopStinger')`).

## Task 3: Provider räumt beim Abbau auf (`apps/web/src/audio/AudioProvider.tsx`)

**Nachtrag nach Playtest:** `dispose()` beim Abmelden kostete die Entsperrung, nach dem Login kam Musik erst mit dem ersten Klick. Umgesetzt wurde stattdessen: `AudioProvider` in `main.tsx` über dem Router (Eingabe auf der Anmeldeseite entsperrt), `SignedInAudio` in `RequireAuth` ersetzt `RouteMusic` und ruft beim Unmount `engine.stopAll()`; Oberflächen-Töne nur angemeldet. Der ursprüngliche Plan darunter bleibt zur Nachvollziehbarkeit stehen.

- `OwnedAudio`: `useEffect(() => () => engine.dispose(), [engine])` als letzter Effekt. Für den Test-Fall mit übergebener Engine (`given`) gilt dasselbe, der Fake protokolliert `dispose`.
- `AudioProvider`: `engineRef` bleibt pro Mount; nach dem Abbau durch Abmelden entsteht beim nächsten Login eine frische Engine, die der erste Klick entsperrt (wie heute beim ersten Laden). Ein modulweiter Singleton wird nicht eingeführt, weil der geschlossene `AudioContext` ohnehin neu erzeugt werden müsste.
- `RouteMusic`: unverändert, weil `playMusic` jetzt den Stinger ausblendet. Kommentar an `musicForPath` ergänzen, dass öffentliche Routen nie erreicht werden (Provider in `RequireAuth`).

## Task 4: Partie-Ton gibt beim Verlassen alles frei (`apps/web/src/pages/useMatchAudio.ts`)

- Cleanup des Mount-Effekts (Zeile 60-69): zusätzlich `engine.stopStinger()`. Damit endet das Fraktionsthema oder Ergebnisstück auch dann, wenn die nächste Route kein Deck startet (z. B. direkt in eine andere Partie, wo erst die Schichten starten).
- Die Kette `playStinger(theme).then(() => engine.setLayer(layer))` bleibt; `setLayer` ist nach `stopLayers` ein No-op.

## Task 5: Tests

- `audio/engine.test.ts` (Fake-Kontext `FakeSource.stopped`, `gainOf`): (a) „blendet ein laufendes Einzelstück aus, wenn Musik startet“: `playStinger('aether-victory')`, dann `playMusic('menu-lobby')` → Stinger-Quelle hat `stopped`, Gain fällt auf 0, Deck startet. (b) „dispose stoppt auch Einzelstücke und schließt den Kontext“. (c) „stopStinger löst das Promise auf“.
- `audio/AudioProvider.test.tsx`: „räumt die Engine beim Abmelden auf“: App mit `FakeEngine` rendern, Abmelden im Benutzermenü klicken (Muster aus bestehenden Tests mit `renderApp`), erwarten, dass `dispose` protokolliert ist und nach dem Wechsel zur Anmeldeseite kein weiteres `playMusic` folgt.
- `pages/MatchPage.test.tsx` (vorhandener Sieg-Ton-Test bei Zeile ~184): nach Navigation „Zur Lobby“ erwartet der Fake `stopStinger` oder `playMusic('menu-lobby')` nach dem Stinger.
- Manifest-IDs für Tests aus `audio/ids.ts` (`FACTION_IDS`), Stub-Manifest im Test um ein Victory-Stück ergänzen.

## Verifikation

1. `pnpm --filter web test -- audio pages/MatchPage` und `pnpm typecheck`, `pnpm lint`.
2. Lokal im Container (`docker compose up -d --build`, läuft bereits): Partie bis zum Ergebnis bringen (Demo-Partie per psql auf `finished` patchen, siehe Memory-Notiz) → Sieg-Stück startet → sofort „Zur Lobby“: Stück blendet aus, Lobby-Musik blendet ein, nichts überlagert.
3. Lobby → Abmelden: Stille auf der Anmeldeseite. Erneut anmelden, klicken: genau eine Menümusik. Lobby → Partie (erster Kampf, Thema läuft) → Lobby: Thema blendet aus.
4. Abmelden aus der Partie heraus (Benutzermenü im `GameLayout`): Schichten, Ambiente und Stinger enden.
