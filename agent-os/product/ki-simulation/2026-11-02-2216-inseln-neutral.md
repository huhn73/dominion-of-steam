# KI-Simulation: inseln-vorherrschaft (neutrale Inseln)

Lauf vom 02.11.2026, 22:16, Modus `run`. 360 Partien gespielt, 32 Worker, Dauer 3 min 41 s.

Karten: medium-islands-35 (Welt islands, Land 35 %, Städte normal, Gelände normal); medium-archipelago-30 (Welt archipelago, Land 30 %, Städte normal, Gelände normal); medium-continent-35 (Welt continent, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 30, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Vorherrschaft.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 16 s | 107,2 | 148,6 | 68,1 | 7,2 |

## Matchup hard-vs-normal

180 Partien, Median 98 Runden (Mittel 99,4). Spielende: Vorherrschaft 135, Kapitulation 33, Abbruch (Rundendeckel) 11, Ausschaltung 1.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 147/180 | 82 % | 75–87 % | 1,13 | 3 (Median R85) | R11,9 (180/180) | 10,9 | 42,2 | 90 ms | 355 ms |
| **normal** (eisenbund, normal) | 22/180 | 12 % | 8–18 % | 1,87 | 31 (Median R91) | R13,7 (179/180) | 5,3 | 34,7 | 72 ms | 268 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-islands-35 | 60 | 93 % | R101 | Vorherrschaft 49, Kapitulation 7, Abbruch (Rundendeckel) 4 | hard 50 : normal 6 |
| medium-archipelago-30 | 60 | 95 % | R104 | Kapitulation 14, Vorherrschaft 43, Abbruch (Rundendeckel) 3 | hard 54 : normal 3 |
| medium-continent-35 | 60 | 93 % | R93 | Vorherrschaft 43, Kapitulation 12, Ausschaltung 1, Abbruch (Rundendeckel) 4 | hard 43 : normal 13 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 52 % · Sitz 2 42 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 51,4 | 78 % | 18,4 (14,0 erfolgreich) | 8,2 | 5,8 | 4,0 | 42,0 | 26,1 | 3,1 | 56,8 / 82,3 |
| normal | 37,7 | 72 % | 14,3 (10,3 erfolgreich) | 6,3 | 4,0 | 5,8 | 47,0 | 16,7 | 4,7 | 50,3 / 78,1 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| hard | 12,6 | 86,2 | 10,5 (12 %) | 3,6 |
| normal | 7,1 | 52,2 | 12,1 (23 %) | 2,2 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 3,7 | 0,4 | 5,7 | 15,0 | 5,2 | 41,6 | 2,0 | 2,0 | 8,8 | 0 |
| normal | 0,0 | 0,0 | 4,3 | 42,8 | 5,9 | 27,0 | 0,0 | 0,0 | 6,7 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 2,0 | 1,4 / 2,0 |
| 20 | 2,5 / 3,9 | 2,2 / 4,0 |
| 30 | 3,4 / 7,4 | 3,0 / 7,0 |
| 40 | 4,5 / 11,7 | 4,0 / 11,8 |
| 50 | 5,8 / 17,1 | 4,9 / 17,5 |
| 60 | 7,0 / 22,5 | 5,8 / 22,9 |
| 70 | 8,2 / 27,1 | 6,0 / 27,6 |
| 80 | 8,9 / 31,2 | 6,0 / 31,0 |
| 90 | 9,6 / 35,2 | 6,0 / 33,9 |
| 100 | 10,0 / 37,9 | 5,8 / 35,3 |
| 110 | 10,4 / 40,0 | 5,6 / 35,7 |
| 120 | 10,6 / 40,7 | 5,5 / 35,2 |
| 130 | 10,8 / 41,6 | 5,4 / 34,9 |
| 140 | 10,9 / 42,1 | 5,3 / 34,8 |
| 150 | 10,9 / 42,2 | 5,3 / 34,7 |
| 151 | 10,9 / 42,2 | 5,3 / 34,7 |


## Matchup aurelia-vs-eisenbund

180 Partien, Median 113 Runden (Mittel 115,0). Spielende: Vorherrschaft 114, Kapitulation 15, Abbruch (Rundendeckel) 51.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 67/180 | 37 % | 30–44 % | 1,48 | 10 (Median R84) | R13,6 (180/180) | 8,6 | 60,4 | 56 ms | 206 ms |
| **eisenbund** (eisenbund, normal) | 62/180 | 34 % | 28–42 % | 1,52 | 5 (Median R99) | R13,4 (180/180) | 8,3 | 66,1 | 58 ms | 221 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-islands-35 | 60 | 70 % | R112 | Vorherrschaft 36, Kapitulation 6, Abbruch (Rundendeckel) 18 | aurelia 22 : eisenbund 20 |
| medium-archipelago-30 | 60 | 48 % | R131 | Kapitulation 1, Vorherrschaft 28, Abbruch (Rundendeckel) 31 | aurelia 17 : eisenbund 12 |
| medium-continent-35 | 60 | 97 % | R101 | Vorherrschaft 50, Kapitulation 8, Abbruch (Rundendeckel) 2 | aurelia 28 : eisenbund 30 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 39 % · Sitz 2 32 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 45,8 | 76 % | 17,9 (13,1 erfolgreich) | 7,7 | 5,4 | 5,4 | 46,1 | 21,6 | 3,0 | 52,0 / 78,0 |
| eisenbund | 46,0 | 75 % | 17,3 (12,7 erfolgreich) | 7,3 | 5,4 | 5,4 | 45,7 | 21,9 | 3,1 | 51,7 / 77,7 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 10,0 | 72,9 | 20,2 (28 %) | 3,1 |
| eisenbund | 9,5 | 74,4 | 17,9 (24 %) | 2,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 4,8 | 55,3 | 6,5 | 35,1 | 6,8 | 0 |
| eisenbund | 4,9 | 58,6 | 6,3 | 37,4 | 6,7 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,9 | 1,4 / 2,0 |
| 20 | 2,2 / 3,7 | 2,2 / 3,9 |
| 30 | 3,0 / 6,9 | 3,1 / 7,2 |
| 40 | 3,9 / 11,1 | 4,0 / 12,1 |
| 50 | 5,1 / 16,4 | 5,1 / 18,3 |
| 60 | 6,2 / 22,1 | 6,1 / 25,1 |
| 70 | 6,9 / 28,6 | 6,9 / 32,1 |
| 80 | 7,3 / 34,7 | 7,3 / 38,3 |
| 90 | 7,6 / 39,6 | 7,7 / 44,5 |
| 100 | 7,9 / 44,1 | 7,9 / 49,5 |
| 110 | 8,1 / 48,4 | 8,1 / 53,9 |
| 120 | 8,3 / 52,1 | 8,1 / 57,6 |
| 130 | 8,4 / 55,1 | 8,2 / 60,9 |
| 140 | 8,5 / 57,6 | 8,3 / 63,7 |
| 150 | 8,6 / 60,2 | 8,3 / 65,9 |
| 151 | 8,6 / 60,2 | 8,3 / 65,9 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
