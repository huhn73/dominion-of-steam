# Playtest Runde 1: Beobachtungen und Zuordnung

Stand: 31. Oktober 2026. Erste gespielte Runde nach Abschluss der sechs MVP-Meilensteine.

Alle Punkte betreffen Regeln, Engine, KI oder die Bedienung bestehender Screens. Keiner braucht eine neue Ansicht oder neue Entitäten, deshalb wird nichts davon in Design OS bearbeitet. Jede Gruppe unten wird eine eigene Spec (`/shape-spec`), Reihenfolge wie nummeriert. Die Prüfung der Startstädte ist erledigt (siehe unten).

## Geprüft: Startstädte des Gegners (kein Bug)

**Beobachtung:** Ein Gegner besaß scheinbar von Anfang an mehrere Städte.

**Befund (31. Oktober 2026):** `engine/create.ts` gibt jedem Spieler genau eine Hauptstadt, `engine/mapgen.ts` erzeugt alle übrigen Städte neutral. Simulation über 100 frisch erzeugte Partien (2 und 4 Spieler, zwei Kartengrößen, alle KI-Schwierigkeiten): in Runde 1 besitzt jeder Spieler genau eine Stadt. Spielt der Mensch passiv weiter, erobert die KI ihre erste neutrale Stadt frühestens in Runde 4, im Median in Runde 6 (in 82 von 100 Partien bis Runde 8). Die Städte lagen beim Entdecken also schon im Besitz der KI, weil sie im Kriegsnebel erobert wurden. Die Demo-Partie (`game/demo-data.json`) startet fest mit 3 Städten für p1 und 2 für p2.

**Konsequenz:** Kein Fix nötig. Dass Eroberungen im Nebel unsichtbar bleiben, war ein Darstellungsthema für den Rundenbericht (Spec 3, umgesetzt): neu entdeckte Gegnerstädte und bemerkte Besitzerwechsel erscheinen dort als Ereignis `cityDiscovered`.

## Spec 1: Kampfregeln (umgesetzt)

Umgesetzt am 31. Oktober 2026, Spec in `agent-os/specs/2026-10-31-0207-kampfregeln/` (Entscheidungen in `shape.md`). Engine in `packages/shared/src/game/engine/` (`combat.ts`, `commands.ts`, `movement.ts`, `turn.ts`), Tests in `engine/__tests__/rules.test.ts`.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 1 | Panzer können Boote angreifen | Landeinheiten dürfen Seeeinheiten nicht angreifen. Ausnahmen (Artillerie, Küstenbatterie, Flugzeuge gegen Schiffe) festlegen. | `attackTargets` in `engine/view.ts` bzw. `commands.ts`, Domänen aus dem Kompendium |
| 2 | Nach Angriff und Sieg wird das Feld nicht eingenommen | Der Angreifer rückt nach einem Sieg auf das Feld des Verlierers vor, wenn noch Bewegung übrig ist oder grundsätzlich. Bisher nur bei Städten. | `combat.ts` (Stadt-Eroberung ab Zeile ~144 als Vorbild), `commands.ts` `attack` |
| 3 | Panzer schießen 2 Felder weit; bei Angriff auf Distanz muss er erst ein Feld fahren | Nahkampfeinheiten greifen nur benachbarte Felder an. Bei Klick auf ein entferntes Ziel: heranfahren, dann angreifen, Bewegungspunkte entsprechend verbrauchen. Fernkampf nur für Einheiten mit `range` > 1. | `commands.ts` Zeile ~241 (fährt bereits heran), `range` in `compendium`, `catalog.ts` |
| 4 | Kein Bonus nach Gelände, kein Bonus beim Angriff aus oder Verteidigung in einer Stadt | Verteidigungsbonus je Gelände (Wald, Gebirge) und für Einheiten in Städten; evtl. Angriffsbonus aus der Stadt heraus. Werte im Kompendium anzeigen. | `combat.ts` Zeile ~33 (`fortification` als Ansatz), `bonus.ts`, Kompendium-Seiten |
| 5 | Städte unter Beschuss verlieren keine Produktivität | Jeder Angriff auf eine Stadt senkt ihre Produktivität (längere Bauzeit). Ohne Produktion erholt sie sich pro Runde wieder. | Neues Feld an `CityState` in `game/types.ts`, Auswertung in `turn.ts`, Anzeige in `CityPanel.tsx` |

## Spec 2: Spielfeld-Bedienung (umgesetzt)

Umgesetzt am 31. Oktober 2026, Spec in `agent-os/specs/2026-10-31-0241-spielfeld-bedienung/` (Entscheidungen in `shape.md`). Web-Komponenten in `apps/web/src/sections/spielfeld/components/`, Tests in `Spielfeld.test.tsx`.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 6 | Städte zeigen die enthaltenen Einheiten nicht an | Auf dem Hex eine Markierung mit Anzahl, im Stadt-Panel die Liste der Einheiten. | `HexMap.tsx`, `CityPanel.tsx` |
| 7 | Stadt mit Einheiten darin ist nicht auswählbar | Klick auf eine besetzte eigene Stadt öffnet das Stadt-Panel. Umschalten zwischen Stadt und Einheiten im Panel oder per zweitem Klick. | Klick-Logik in `Spielfeld.tsx` |
| 8 | „Nächste Einheit“ beginnt immer wieder vorne im Stack | Zyklisch weiterschalten ab der zuletzt gewählten Einheit, nicht ab Index 0. | `nextUnit` in `Spielfeld.tsx` Zeile ~397 |
| 9 | Kampfanimation fehlt, Kämpfe sind sofort vorbei | Sichtbare Kampfsequenz mit Dauer (Treffer, Ergebnis), abschaltbar über die vorhandene Einstellung „Kampfanimationen“. | `HexMap.tsx`, Einstellungen in `apps/web/src/settings/`, Kampfergebnis aus `commands.ts` |
| 10 | Beim Bauen fehlt die Übersicht, was wo gebaut wird | Im Stadt-Panel beim Wählen der Produktion anzeigen: wie viele Einheiten je Typ sind reichsweit in Bau und in welchen Städten, plus Bestand. | `CityPanel.tsx`, Daten aus `engine/view.ts` |

## Spec 3: Rundenbericht (umgesetzt)

Umgesetzt am 31. Oktober 2026, Spec in `agent-os/specs/2026-10-31-1026-rundenbericht/` (Entscheidungen in `shape.md`). Engine in `packages/shared/src/game/engine/turn.ts` (`reportSightings`) und `visibility.ts` (`sightingSnapshot`), Web in `apps/web/src/sections/spielfeld/components/Rundenbericht.tsx` und `report.ts`, Tests in `engine/__tests__/bericht.test.ts`, `report.test.ts` und `Spielfeld.test.tsx`.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 11 | Man sieht nicht, was der Gegner in seinem Zug gemacht hat | Zu Beginn des eigenen Zuges ein Bericht: eigene Verluste, gesehene Gegnerbewegungen, eroberte und verlorene Städte, neu entdeckte Gegner. Nur Ereignisse, die im Sichtbereich lagen. Optional als Wiedergabe der Gegnerzüge (Einstellung „Gegnerzüge automatisch abspielen“ existiert). | `addEvent` in `engine/state.ts`, `EventLog.tsx`, neue Zusammenfassung pro Runde in `turn.ts`, Sichtbarkeit aus `visibility.ts` |

## Spec 4: Einheitenbefehle (umgesetzt)

Umgesetzt am 31. Oktober 2026, Spec in `agent-os/specs/2026-10-31-1225-flugzeuge-erkunden/` (Entscheidungen in `shape.md`). Im Shaping präzisiert: Gemeint war ein Erkundungsbefehl, nicht eine Patrouille über einer Stadt. Dazu kam der Treibstoffschutz, weil im Playtest mehrere Flugzeuge nach zu weiten Zügen abgestürzt sind. Engine in `packages/shared/src/game/engine/explore.ts`, Regeln in `game/fuel.ts`, Web in `Spielfeld.tsx`/`UnitPanel.tsx`, Tests in `engine/__tests__/erkunden.test.ts`, `game/__tests__/fuel.test.ts` und `Spielfeld.test.tsx`.

| Nr. | Beobachtung | Zielverhalten | Betroffene Stellen |
|---|---|---|---|
| 12 | Flugzeuge brauchen einen Überwachungs-/Patrouillenmodus über einer Stadt | Befehl „Patrouille“: Flugzeug kreist jede Runde automatisch über der Stadt, hält Sicht aufrecht, tankt in der Stadt auf und wird bei Feindkontakt wieder aktiv. Analog zu „Wache“ für Bodeneinheiten. | Neuer Befehl in `commands.ts`, Rundenauswertung in `turn.ts`, Treibstoff in `movement.ts`, Button in `UnitPanel.tsx` |

## Offen

- Punkt 13 aus der Liste war die Frage zu den Startstädten (oben unter „Geprüft“, kein Bug).
- Balance-Werte (Boni, Produktivitätsverlust) werden in den Specs festgelegt und nach der zweiten Playtest-Runde nachjustiert.
