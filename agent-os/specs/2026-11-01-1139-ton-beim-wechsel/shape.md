# Ton beim Wechsel: Shaping-Notizen

## Umfang

Spec 1 aus Playtest Runde 2 (`agent-os/product/playtest-runde-2.md`, Punkte 1 bis 3). Drei Beobachtungen, eine Ursache in der Audio-Schicht (`apps/web/src/audio/`): Sieges- und Menümusik gleichzeitig nach schnellem Wechsel in die Lobby, Lieder übereinander außerhalb der Partie, Musik läuft nach dem Abmelden weiter. Keine neuen Screens, keine neuen Töne, keine Änderung am Manifest.

## Ursachen

- **Einzelstücke laufen am Deck vorbei.** `playStinger` (Fraktionsthema, Sieg, Niederlage) hängt die Quelle direkt an den Musik-Bus und merkt sie sich nicht. `playMusic`, `stopMusic` und `dispose` kennen nur das Deck. Beim Verlassen der Partie startet `RouteMusic` die Menümusik, während das Stück weiterläuft.
- **Die Engine überlebt den Provider.** `AudioProvider` sitzt in `RequireAuth`. Beim Abmelden wird der Provider abgebaut, aber niemand ruft `dispose()`. Die Musik läuft weiter; nach erneutem Anmelden spielt eine zweite Engine mit eigenem `AudioContext` dazu. Das sind die „Lieder übereinander“ außerhalb der Partie.

## Entscheidungen

- **Ausblenden statt warten:** Verlässt man die Partie, während Ergebnisstück oder Fraktionsthema läuft, blendet das Stück mit der normalen Deck-Überblendung (1,5 s) aus und die Menümusik blendet ein. Verworfen: „Lobby wartet, bis das Stück zu Ende ist“ (unklare Stille in der Lobby, Sonderfall im Deck) und hartes Abschneiden.
- **Die Engine setzt die Regel durch, nicht die Aufrufer:** `playMusic` und `stopMusic` blenden einen laufenden Stinger aus. Zu jeder Zeit spielt höchstens ein Musikstück. `useMatchAudio` räumt zusätzlich im Cleanup auf, damit auch der Weg Partie → Partie still bleibt.
- **Eine Engine über dem Router, still machen statt abbauen** (nach Playtest korrigiert): Der erste Wurf baute die Engine beim Abmelden ab (`dispose()`); dann fehlte nach dem Login die Interaktion zum Entsperren, Musik kam erst mit dem ersten Klick in der Navigation. Jetzt sitzt `AudioProvider` in `main.tsx` über dem Router, die Eingabe auf der Anmeldeseite entsperrt bereits, und `SignedInAudio` in `RequireAuth` blendet beim Verlassen des angemeldeten Bereichs alles aus (`stopAll`), der `AudioContext` bleibt offen.
- **Entsperren bis der Kontext läuft** (nach Playtest ergänzt): Chrome meldete „The AudioContext was not allowed to start“ nach Strg+F5 auf der Anmeldeseite: die gehaltene Strg-Taste schickt auf der neu geladenen Seite `keydown`-Wiederholungen, die keine Aktivierung sind. `gestureCounts` ignoriert deshalb Modifier-Tasten und folgt `navigator.userActivation.hasBeenActive`, wo der Browser es meldet (mit Playwright nachgestellt: kein Kontext bei gehaltener Strg-Taste, laufender Kontext beim Tippen). Der Provider hört jetzt auf `pointerdown`, `pointerup` und `keydown`, bis `engine.running` wahr ist; `unlock()` ruft bei jedem weiteren Aufruf `resume()` nach, und das Laden des Manifests wartet nicht mehr auf `resume()`, weil Chrome dessen Promise bis zur nächsten gültigen Geste offen hält.
- **Spielerabhängiges nur im angemeldeten Bereich** (nach Playtest ergänzt): Nach dem Umzug des Providers über den Router griffen weder Einstellungen noch Stummschalter, Klicktöne fehlten nach dem Login. Ursache: `useAuthActions`/`useSignOut` rufen `queryClient.clear()`, und die Abonnements des dauerhaft montierten Providers (`useMe`, `useSettings`) hingen danach an entfernten Abfragen. Deshalb liegen Einstellungen → Lautstärken, Menümusik und Oberflächen-Töne in `SignedInAudio` innerhalb von `RequireAuth` (wird nach jedem Login neu montiert); der Provider hält nur Engine, Entsperren und Hintergrund-Stummschaltung. Test: Anmeldeablauf mit gemutetem Konto.
- **Öffentliche Seiten bleiben still:** Menümusik und Oberflächen-Töne gibt es nur angemeldet (`SignedInAudio` liegt in `RequireAuth`, Klick- und Dialogtöne prüfen `me`). Anmelden, Registrieren, Passwort, Impressum, Datenschutz und Lizenzen bleiben still, auch nach dem Abmelden.

## Kontext

- **Visuals:** Keine (Ton).
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c, Punkt 1. Ergänzt die Ton-Spec (`agent-os/specs/2026-10-31-1700-ton/`), deren Regel „Sieg/Niederlage einmal je Partie, danach Stille bis zum Verlassen“ bestehen bleibt.

## Angewandte Standards

Noch keine, siehe `standards.md`.
