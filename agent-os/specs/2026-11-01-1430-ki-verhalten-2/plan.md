# Plan: KI-Verhalten, zweiter Block

## Context

Nach der Spec `2026-11-01-1358-ki-regeln` erreichte „schwer“ 67 % gegen „normal“, aber 272 von 400 Duellen endeten am Rundenlimit, „schwer gegen leicht“ sogar 294 von 400. Die Analyse der Rohdaten und eine Messung des Kartengenerators (30 Seeds je Landanteil) zeigten: Nicht Inseln sind die Ursache, sondern Belagerungen ohne Angriff und fehlende Verfolgung versprengter Einheiten. Der Spieler wollte außerdem die Befestigungs-Persönlichkeit (Ostrow) spürbar machen sowie Flugzeuge und Transporte in die KI bringen; letztere brauchen Inselkarten, die es mit niedrigem Landanteil auf „Groß“ gibt und mit den geplanten größeren Karten häufiger werden.

Engine-Fakten für Landungen und Flugzeuge stehen in `shape.md` und `references.md`; die KI nutzt nur vorhandene Befehle (`move`, `goto`, `attack`, `explore`, `setProduction`, `sentry`, `cancelOrder`).

## Entscheidungen (Shaping, 1. November 2026)

Siehe `shape.md`. Kurz: Belagerung nach Ertrag mit Übermacht (schwer 1,5-fach, normal doppelt); Panzeranteil 0,8 für schwer; Verfolgung sichtbarer Feinde; Doppeldecker nur für „Aufklärung“ (der Sweep zeigte Aufklärer als Verlust von 20 Punkten für „schwer“); Schwerbomber für „schwer“ und „Luftkrieg“ mit Rückweg-Prüfung; Frachter mit Flutfüllung der Landmassen, Einstieg per `move`, Überfahrt mit drei Einheiten, Angriff oder Anlanden von Bord; Grenzgarnison und Panzerwagen für „Befestigung“.

## Task 1: Spec-Dokumentation

Dieser Ordner. Nachgezogen: `agent-os/product/roadmap.md` (Phase 1c Punkt 7 umgesetzt, Rest als Punkt 8), `agent-os/product/ki-balance.md` (Abschnitt „Nachmessung 2“), `agent-os/product/ki-simulation/README.md` (Serie F Inseln, neue Berichte).

## Task 2: Belagerung und Verfolgung (`ai.ts`)

- Profil: `siegeRatio` (normal 2, schwer 1,5) und `armourShare` (normal 0,4, schwer 0,8; Grenzstädte von Befestigern mindestens 0,6). `siegePaysOff(k, playerId, type, defenderId, city, odds, ratio)`: Verteidiger und Belagerer (eigene Kampfeinheiten im Abstand ≤ 2) zählen; Angriff, wenn Belagerer > Verteidiger × `ratio` und `killChance × (Wert Verteidiger + 6 / Verteidiger) ≥ deathChance × eigener Wert` (Werte in Grenadier-Bauten). Vorrang hat weiter die Schwelle; ohne `siege` (leicht) nie.
- `planUnit` Schritt 2b: ohne erreichbare fremde Stadt `approach` an den nächsten sichtbaren Feind an Land (bis acht Kandidaten).

## Task 3: Flugzeuge

- Profil: `scoutShare` (0; „Aufklärung“ 0,15), `maxScouts` 1, Aufklärer nur bis Runde 30 (`SCOUT_ROUNDS`), `bomberShare` (schwer 0,15; „Luftkrieg“ +0,15 mit `maxBombers` 4).
- `chooseProduction`: Doppeldecker, solange ein unerforschtes Feld bekannt ist und weniger als `maxScouts` fliegen; Schwerbomber, solange Feinde in Sicht sind.
- `planUnit`: Basen über `airBases`; Rückkehrregel wie bisher; Aufklärer (Stärke ≤ 1) bekommen `explore`, ohne Nebel `goto` zur Basis; Bomber filtern Ziele nach `fuel − (Abstand − 1) − 2 ≥ returnDistance(Ziel)` und warten ohne Ziel an der Basis. Flugzeuge expandieren, jagen und erkunden nicht per `goto`.

## Task 4: Transporte

- Profil: `transports` (normal und schwer), `maxTransports` 1 („Seekrieg“ 2).
- `Knowledge` erweitert um `masses` (Flutfüllung `landmasses(view)` über bekannte Landfelder, einmal je Zug). `overseasCities(k, playerId, from)`, `shoreTiles(k, mass, near)`.
- `chooseProduction`: Frachter in einer Küstenstadt, wenn Übersee-Städte bekannt sind, mindestens vier Landeinheiten existieren und weniger als `maxTransports` Frachter.
- `planTransport`: mit mindestens drei Einheiten an Bord `goto` zur Küste der nächsten fremden Stadt (Wasserfeld neben deren Landmasse, per `findPath` geprüft); angekommen warten; leer zum Wasserfeld neben der eigenen Stadt mit den meisten Landeinheiten in der Nähe.
- `planCargo`: von Bord angreifen (normale Zielwahl), sonst `move` auf das Landfeld der fremden Landmasse, das der nächsten fremden Stadt am nächsten liegt; nie auf eine eigene Landmasse.
- `planUnit` Schritt 2a: Landeinheiten mit Übersee-Zielen und ohne Landweg steigen per `move` in einen Frachter mit Platz in Reichweite oder marschieren an die Küste daneben.
- Hauptschleife: Transporter und Ladung werden unabhängig von `replan` jede Runde geplant; `unitIds` enthält die Ladung.

## Task 5: Befestigung

- Profil: `fortify` („Befestigung“). Grenzstädte: eigene Städte mit fremder Stadt (nicht neutral) oder Feind im Abstand ≤ 5 (`BORDER_RANGE`). Garnison wie bei bedrohten Städten; Produktion dort mindestens 60 % Panzerwagen. Nur für die Persönlichkeit, nicht für „schwer“ (Sweep: Garnisonen kosten Expansion).

## Task 6: Simulation

- `packages/sim/src/config.ts`: `PROFILE_KEYS` um die neuen Felder erweitert, Wertprüfung je Typ.
- Configs: `inseln.json` (Groß, 30 % Land: schwer gegen normal, Aurelia gegen Eisenbund), `inseln-ohne.json` (gleiche Partien mit `transports`, `scoutShare`, `bomberShare` auf 0), `sweep-hard-2.json` bis `sweep-hard-4.json` (Belagerung, Bomber, Aufklärer, Transporte, Panzeranteil, Grenzgarnison).

## Task 7: Tests

`ai.test.ts`: Belagerung nur mit Übermacht (1 gegen 1 nein, 3 gegen 1 ja); Verfolgung; Doppeldecker-Bau bei Nebel und `explore`; Bomber nur mit Rückweg; Grenzgarnison (Grenzstadt ja, Hinterland nein, ohne Persönlichkeit nein); describe „KI: Transporte“ auf einer Zwei-Inseln-Karte: Frachterbau (leicht nicht), Einsteigen, Überfahrt, Angriff von Bord und Anlanden. `rules.test.ts` an die neuen Tag-Felder angepasst. 158 Tests in shared.

## Task 8: Nachmessung

Serien A bis C, E und F (Inseln) mit den endgültigen Werten; Zahlen in `ki-balance.md`.

## Verifikation

1. `pnpm --filter @dos/shared test`, `pnpm --filter @dos/sim test`, Typecheck je Paket, `pnpm lint`.
2. `pnpm sim --config packages/sim/configs/inseln.json` gegen `inseln-ohne.json`: mehr Ausschaltungen und mehr feindliche Eroberungen mit Transporten.
3. Serien laut Task 8.
