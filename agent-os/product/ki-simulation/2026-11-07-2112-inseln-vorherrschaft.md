# KI-Simulation: inseln-vorherrschaft

Lauf vom 07.11.2026, 21:12, Modus `run`. 360 Partien gespielt, 32 Worker, Dauer 3 min 40 s.

Karten: medium-islands-35 (Welt islands, Land 35 %, Städte normal, Gelände normal); medium-archipelago-30 (Welt archipelago, Land 30 %, Städte normal, Gelände normal); medium-continent-35 (Welt continent, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 30, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Vorherrschaft.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 19 s | 109,2 | 174,7 | 79,4 | 7,0 |

## Matchup hard-vs-normal

180 Partien, Median 98 Runden (Mittel 100,3). Spielende: Kapitulation 32, Vorherrschaft 130, Abbruch (Rundendeckel) 18.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 138/180 | 77 % | 70–82 % | 1,15 | 3 (Median R58) | R11,8 (180/180) | 10,8 | 45,5 | 107 ms | 408 ms |
| **normal** (eisenbund, normal) | 24/180 | 13 % | 9–19 % | 1,85 | 29 (Median R84) | R13,2 (180/180) | 5,6 | 39,1 | 75 ms | 286 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-islands-35 | 60 | 92 % | R93 | Kapitulation 7, Vorherrschaft 48, Abbruch (Rundendeckel) 5 | hard 48 : normal 7 |
| medium-archipelago-30 | 60 | 90 % | R111 | Kapitulation 17, Vorherrschaft 37, Abbruch (Rundendeckel) 6 | hard 51 : normal 3 |
| medium-continent-35 | 60 | 88 % | R97 | Vorherrschaft 45, Kapitulation 8, Abbruch (Rundendeckel) 7 | hard 39 : normal 14 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 48 % · Sitz 2 42 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe | Verluste vor Städten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 48,7 | 77 % | 18,0 (13,5 erfolgreich) | 8,1 | 5,4 | 3,6 | 41,5 | 24,2 | 2,5 | 55,2 / 81,3 | 6,5 (5,5 gefallen) | 9,2 |
| normal | 38,0 | 72 % | 13,9 (10,3 erfolgreich) | 6,7 | 3,6 | 5,4 | 45,2 | 17,0 | 4,3 | 50,4 / 75,8 | 5,0 (4,1 gefallen) | 11,2 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| hard | 12,8 | 88,0 | 13,2 (15 %) | 3,5 |
| normal | 7,3 | 51,3 | 12,4 (24 %) | 2,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 4,1 | 0,4 | 5,5 | 15,8 | 5,7 | 43,1 | 1,9 | 2,1 | 8,5 | 0 |
| normal | 0,0 | 0,0 | 4,2 | 43,3 | 5,8 | 28,8 | 0,0 | 0,0 | 6,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 1,9 | 1,4 / 2,0 |
| 20 | 2,5 / 3,9 | 2,3 / 4,0 |
| 30 | 3,4 / 7,3 | 3,1 / 7,3 |
| 40 | 4,4 / 11,8 | 4,0 / 12,0 |
| 50 | 5,7 / 17,2 | 5,1 / 18,2 |
| 60 | 7,0 / 22,4 | 5,8 / 24,1 |
| 70 | 8,0 / 27,5 | 6,2 / 29,1 |
| 80 | 8,8 / 31,9 | 6,3 / 33,4 |
| 90 | 9,4 / 35,7 | 6,2 / 35,9 |
| 100 | 9,9 / 39,1 | 6,1 / 37,6 |
| 110 | 10,2 / 41,5 | 5,9 / 37,9 |
| 120 | 10,4 / 43,1 | 5,8 / 38,5 |
| 130 | 10,7 / 44,2 | 5,7 / 39,2 |
| 140 | 10,7 / 45,1 | 5,7 / 39,0 |
| 150 | 10,8 / 45,4 | 5,6 / 39,1 |
| 151 | 10,8 / 45,4 | 5,6 / 39,1 |


## Matchup aurelia-vs-eisenbund

180 Partien, Median 126 Runden (Mittel 118,1). Spielende: Vorherrschaft 108, Kapitulation 12, Abbruch (Rundendeckel) 60.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 57/180 | 32 % | 25–39 % | 1,52 | 6 (Median R70) | R13,4 (179/180) | 8,4 | 61,0 | 69 ms | 263 ms |
| **eisenbund** (eisenbund, normal) | 63/180 | 35 % | 28–42 % | 1,48 | 6 (Median R71) | R13,5 (180/180) | 8,8 | 71,3 | 71 ms | 273 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-islands-35 | 60 | 73 % | R113 | Vorherrschaft 40, Kapitulation 4, Abbruch (Rundendeckel) 16 | aurelia 23 : eisenbund 21 |
| medium-archipelago-30 | 60 | 40 % | R139 | Abbruch (Rundendeckel) 36, Vorherrschaft 23, Kapitulation 1 | aurelia 15 : eisenbund 9 |
| medium-continent-35 | 60 | 87 % | R102 | Kapitulation 7, Vorherrschaft 45, Abbruch (Rundendeckel) 8 | aurelia 19 : eisenbund 33 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 36 % · Sitz 2 31 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe | Verluste vor Städten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 49,6 | 74 % | 18,6 (13,6 erfolgreich) | 7,7 | 5,8 | 6,1 | 49,6 | 23,2 | 2,5 | 54,9 / 83,9 | 6,4 (5,2 gefallen) | 12,4 |
| eisenbund | 49,3 | 75 % | 18,7 (13,7 erfolgreich) | 7,5 | 6,1 | 5,8 | 49,3 | 23,2 | 3,0 | 56,9 / 82,3 | 6,3 (5,3 gefallen) | 11,1 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 9,9 | 73,2 | 19,6 (27 %) | 3,2 |
| eisenbund | 10,4 | 75,9 | 17,3 (23 %) | 2,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 4,9 | 57,1 | 7,1 | 36,3 | 6,6 | 0 |
| eisenbund | 4,8 | 63,4 | 6,5 | 41,0 | 6,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,8 | 1,4 / 2,0 |
| 20 | 2,2 / 3,6 | 2,2 / 3,9 |
| 30 | 3,1 / 6,6 | 3,1 / 7,2 |
| 40 | 3,9 / 10,9 | 4,1 / 12,0 |
| 50 | 5,0 / 16,3 | 5,2 / 18,4 |
| 60 | 6,2 / 22,0 | 6,2 / 25,3 |
| 70 | 6,9 / 27,9 | 6,9 / 32,2 |
| 80 | 7,3 / 33,9 | 7,4 / 38,8 |
| 90 | 7,6 / 39,0 | 7,8 / 44,7 |
| 100 | 7,9 / 43,4 | 8,0 / 50,3 |
| 110 | 8,0 / 47,3 | 8,2 / 55,4 |
| 120 | 8,1 / 51,3 | 8,4 / 59,8 |
| 130 | 8,2 / 54,4 | 8,6 / 63,7 |
| 140 | 8,3 / 57,6 | 8,8 / 67,7 |
| 150 | 8,4 / 60,8 | 8,8 / 71,0 |
| 151 | 8,4 / 60,8 | 8,8 / 71,0 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
