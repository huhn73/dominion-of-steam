# Playtest Runde 2: Beobachtungen und Zuordnung

Stand: 1. November 2026. Zweite gespielte Runde nach Abschluss von Phase 1b (Playtest Runde 1) und den Phase-2-Specs Ton, Konten, Deployment, Online-Auftritt und Spielabschluss.

Vier Gruppen, jede wird eine eigene Spec (`/shape-spec`), Reihenfolge wie nummeriert: zuerst der kleine Ton-Fix, dann das Kampfsystem, dann Kartengrößen, zuletzt das freie Vorspiel, weil dessen Kontaktregel die neue Angriffsreichweite nutzt und erst große Karten das lange Vorspiel erzeugen. Keine Gruppe braucht neue Screens; Spec 4 ändert aber den Rundenablauf im Server und damit Kopfzeile, Polling und Wiedergabe.

## Spec 1: Ton beim Wechsel (umgesetzt)

Umgesetzt am 1. November 2026, Spec in `agent-os/specs/2026-11-01-1139-ton-beim-wechsel/` (Entscheidungen in `shape.md`). Die Engine merkt sich Einzelstücke (`stopStinger`), `playMusic`/`stopMusic` blenden sie aus, `useMatchAudio` räumt beim Verlassen auf, `SignedInAudio` in `RequireAuth` blendet beim Abmelden alles aus (`stopAll`); die Engine lebt über dem Router, damit die Eingabe auf der Anmeldeseite entsperrt und die Musik direkt nach dem Login startet. Entscheidung: Stück ausblenden statt warten.

Befund (1. November 2026): Sieg und Niederlage laufen in `apps/web/src/audio/engine.ts` als Einzelstück (`playPiece`) über den Schichten-Bus, die Menümusik über das Musik-Deck (`playMusic`). Die beiden Wege wissen nichts voneinander, deshalb überlagern sie sich. Beim Abmelden stoppt niemand die Engine.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 1 | Siegesmusik und Menümusik laufen gleichzeitig, wenn man nach dem Spielende schnell in die Lobby geht | Beim Verlassen der Partie endet das Ergebnisstück (ausblenden), oder die Menümusik wartet, bis es zu Ende ist. Eine Entscheidung im Shaping. | `apps/web/src/pages/useMatchAudio.ts`, `audio/engine.ts` (`playPiece`, `playMusic`), `AudioProvider.tsx` |
| 2 | Auch außerhalb der Partie liefen Lieder übereinander | Zu jeder Zeit höchstens ein Musikstück. Schnelle Routenwechsel und Doppelstarts (Effekte, Hot-Reload, zwei Provider) abfangen. Ursache im Shaping reproduzieren. | `AudioProvider.tsx` (Menümusik nach Route), `engine.ts` (Deck-Wechsel) |
| 3 | Nach dem Abmelden läuft die Musik weiter | Abmelden stoppt Musik, Schichten und Ambiente; auf den öffentlichen Seiten (Anmelden, Registrieren, Impressum …) ist es still. | Abmelde-Aktion im Benutzermenü, `AudioProvider.tsx` |

## Spec 2: Kampfsystem mit Trefferpunkten (umgesetzt)

Umgesetzt am 1. November 2026, Spec in `agent-os/specs/2026-11-01-1238-kampf-trefferpunkte/` (Entscheidungen in `shape.md`). Im Shaping hat der Spieler Einheitenwerte und Kampfkonzept vorgegeben: Trefferpunkte und Schadenswert je Typ, Trefferchance einmal berechnet, Runden bis zur Vernichtung einer Seite (eine zunächst gewählte 3-Treffer-Grenze wurde revidiert), Angriff kostet einen Bewegungspunkt, Städte werden von Infanterie und Panzern verbraucht erobert, Reparatur +1 je Runde. Engine `rules.ts` (`exchangeOdds`), `combat.ts`, `hex.ts`, `ai.ts` (mehrere Befehle je Einheit), Migration in `normalizeState`; Oberfläche Panels, Angriffsdialog, Kampfsequenz, Kompendium.

Befund (1. November 2026): `Unit.health` ist bereits 0–100 und geht als Faktor in Stärke und Abwehr ein (`engine/combat.ts`). Der Gewinner nimmt schon Schaden, der Verlierer wird aber immer zerstört, und jeder Angriff setzt `movesLeft` auf 0. Die Kampfregeln-Spec aus Runde 1 (`agent-os/specs/2026-10-31-0207-kampfregeln/shape.md`) hat Angriffskosten in Bewegungspunkten ausdrücklich verworfen; diese Entscheidung wird hier zurückgenommen.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 4 | Verlierer eines Kampfes werden sofort ausgelöscht | Einheiten haben Trefferpunkte je Typ. Ein Angriff verteilt Schaden auf beide Seiten; vernichtet wird nur, wessen Trefferpunkte auf 0 fallen. Beide können überleben, dann muss erneut angegriffen werden. Schadensformel und Punktwerte je Typ im Shaping. | `engine/combat.ts`, `UNIT_TYPES` in `game/catalog.ts`, `CombatResult`, KI-Bewertung in `engine/ai.ts` |
| 5 | Angriff beendet den Zug der Einheit | Ein Angriff kostet Bewegungspunkte (Wert im Shaping, Vorschlag 1). Einheiten mit mehr Bewegung können mehrfach angreifen, fahren und angreifen oder angreifen und fahren. Nachrücken nach Sieg bleibt. | `engine/combat.ts` (`movesLeft = 0`), `engine/commands.ts`, `attackTargets` in `engine/view.ts`, Angriffsdialog, Kampfsequenz |
| 6 | Zustand der Einheit wird prozentual angezeigt | Anzeige in Trefferpunkten („3/5“) statt Prozent: Einheitenpanel, Angriffsdialog (erwarteter Schaden statt nur Siegchance), Kampfsequenz, Rundenbericht, Kompendium | `apps/web/src/sections/spielfeld/components/`, `CombatPreview.winChance`, Kompendium |

## Spec 3: Kartengrößen (umgesetzt)

Umgesetzt am 1. November 2026, Spec in `agent-os/specs/2026-11-01-1707-kartengroessen/` (Entscheidungen in `shape.md`). Fünf quadratische Stufen von 20×20 bis 200×200 (Klein, Mittel, Groß, Riesig, Imperium), Rundenlimit bis 500 oder ohne Limit mit Vorgabe je Stufe, Städte proportional zur Landfläche bei 2,5-fach geringerer Dichte, generierte Stadtnamen. Dafür kompaktes Datenformat (Gelände und Sicht als Zeichenketten, Erkundung als Bitset, Migration alter Spielstände), komprimierte Antworten, Wegsuche und KI mit Arbeitsbudget plus 10-Sekunden-Ventil, Gelände und Minikarte auf Canvas, Kamera-Store mit Clamping, Einpassen und Tasten.

Befund (1. November 2026): `MAP_SIZES` in `game/catalog.ts` reicht von 14×10 („Klein“) bis 36×24 („Riesig“). Für Partien mit vielen Inseln und langen Seewegen ist das zu wenig.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 7 | Karten sind zu klein, auch „Riesig“ bietet zu wenig Raum | Neue Stufen oberhalb der heutigen, Benennung und Zuordnung im Shaping. Städtezahl, Landanteil und Startabstände skalieren mit. Leistungsbudget für Generator, Sichtbarkeit, Minikarte, KI-Zugdauer und Spielstandsgröße festlegen und messen. KI-Zugdauer und Spielstandsgröße misst seit dem 1. November 2026 `pnpm sim bench` (`agent-os/specs/2026-11-01-1326-ki-simulation/`): auf „Mittel“ 8–25 ms je Runde, bis 11 ms je KI-Zug, Spielstand bis 350 KiB nach 100 Runden. | `game/catalog.ts`, `engine/mapgen.ts`, `engine/create.ts`, `engine/minimap.ts`, Partie-Setup (Kartenwahl), Demo-Partie |

## Spec 4: Freies Vorspiel (zurückgestellt)

Am 1. November 2026 als Idee zurückgestellt; Befund und Zielbild bleiben hier stehen, Kontaktregel und Ablauf würden beim Wiederaufgreifen im Shaping festgelegt. Verwandte Idee: KI-Züge als Hintergrundjob außerhalb der Befehls-Transaktion.

Befund (1. November 2026): `GameState.phase` kennt nur `replay`, `yourTurn` und `waiting`; `engine/turn.ts` schaltet streng nacheinander durch die Teilnehmer, der Server und das Polling der Partie bauen darauf auf.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 8 | Die ersten Runden muss man auf den Gegner warten, obwohl niemand jemanden erreichen kann | Solange kein Spieler einen Gegner erreichen könnte, ziehen alle gleichzeitig ohne Warten. Sobald eine Einheit oder Stadt eines Spielers in Reichweite eines Gegners kommen könnte (Kontaktregel im Shaping: Sicht, Bewegung plus Angriffsreichweite), wechselt die Partie in den Rundenmodus. KI zieht im Vorspiel sofort. | `engine/turn.ts`, `GameState.phase`, `apps/server/src/matches/service.ts` und `command.ts`, Partie-Polling, Kopfzeile, Rundenbericht und Wiedergabe |

## Offen

- Balance-Werte aus Runde 1 (Boni, Stadtschaden) werden mit Spec 2 neu bewertet, weil Trefferpunkte die Formel ändern.
