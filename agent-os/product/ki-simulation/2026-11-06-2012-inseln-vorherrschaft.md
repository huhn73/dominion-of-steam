# KI-Simulation: inseln-vorherrschaft

Lauf vom 06.11.2026, 20:12, Modus `run`. 360 Partien gespielt, 28 Worker, Dauer 2 min 59 s.

Karten: medium-islands-35 (Welt islands, Land 35 %, Städte normal, Gelände normal); medium-archipelago-30 (Welt archipelago, Land 30 %, Städte normal, Gelände normal); medium-continent-35 (Welt continent, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 30, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Vorherrschaft.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 13 s | 107,8 | 124,0 | 56,7 | 7,0 |

## Matchup hard-vs-normal

180 Partien, Median 100 Runden (Mittel 101,0). Spielende: Vorherrschaft 139, Kapitulation 32, Abbruch (Rundendeckel) 8, Ausschaltung 1.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 148/180 | 82 % | 76–87 % | 1,14 | 4 (Median R75) | R11,9 (180/180) | 11,0 | 45,3 | 76 ms | 289 ms |
| **normal** (eisenbund, normal) | 24/180 | 13 % | 9–19 % | 1,86 | 29 (Median R87) | R13,7 (180/180) | 5,5 | 38,5 | 50 ms | 191 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-islands-35 | 60 | 98 % | R100 | Vorherrschaft 55, Kapitulation 4, Abbruch (Rundendeckel) 1 | hard 53 : normal 6 |
| medium-archipelago-30 | 60 | 95 % | R109 | Kapitulation 16, Vorherrschaft 41, Abbruch (Rundendeckel) 3 | hard 54 : normal 3 |
| medium-continent-35 | 60 | 93 % | R94 | Vorherrschaft 43, Kapitulation 12, Ausschaltung 1, Abbruch (Rundendeckel) 4 | hard 41 : normal 15 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 52 % · Sitz 2 44 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 50,5 | 78 % | 18,4 (14,0 erfolgreich) | 8,3 | 5,7 | 4,0 | 41,7 | 25,4 | 2,9 | 56,7 / 81,3 | 6,3 (5,3 gefallen) |
| normal | 37,9 | 71 % | 14,2 (10,4 erfolgreich) | 6,4 | 4,0 | 5,7 | 46,6 | 16,6 | 4,0 | 49,7 / 77,8 | 4,8 (4,0 gefallen) |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| hard | 13,2 | 94,5 | 14,6 (15 %) | 3,6 |
| normal | 7,0 | 54,4 | 13,1 (24 %) | 2,2 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 4,4 | 0,4 | 5,5 | 15,9 | 5,3 | 42,8 | 2,2 | 1,9 | 8,7 | 0 |
| normal | 0,0 | 0,0 | 4,5 | 43,9 | 6,2 | 28,1 | 0,0 | 0,0 | 6,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 2,0 | 1,4 / 2,0 |
| 20 | 2,5 / 3,8 | 2,2 / 4,0 |
| 30 | 3,4 / 7,4 | 3,0 / 7,0 |
| 40 | 4,4 / 11,7 | 4,0 / 11,6 |
| 50 | 5,8 / 17,1 | 5,0 / 17,3 |
| 60 | 7,0 / 22,6 | 5,7 / 23,1 |
| 70 | 8,1 / 27,4 | 6,0 / 27,6 |
| 80 | 8,8 / 31,8 | 6,1 / 31,4 |
| 90 | 9,4 / 36,1 | 6,0 / 34,3 |
| 100 | 10,0 / 39,2 | 5,9 / 36,4 |
| 110 | 10,3 / 41,4 | 5,8 / 37,3 |
| 120 | 10,5 / 43,0 | 5,7 / 37,9 |
| 130 | 10,7 / 44,5 | 5,6 / 38,4 |
| 140 | 10,8 / 45,2 | 5,6 / 38,7 |
| 150 | 11,0 / 45,3 | 5,5 / 38,5 |
| 151 | 11,0 / 45,3 | 5,5 / 38,5 |


## Matchup aurelia-vs-eisenbund

180 Partien, Median 116 Runden (Mittel 114,5). Spielende: Vorherrschaft 116, Kapitulation 18, Abbruch (Rundendeckel) 46.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 67/180 | 37 % | 30–44 % | 1,50 | 11 (Median R89) | R13,6 (180/180) | 8,4 | 57,6 | 50 ms | 177 ms |
| **eisenbund** (eisenbund, normal) | 67/180 | 37 % | 30–44 % | 1,50 | 7 (Median R92) | R13,4 (179/180) | 8,6 | 66,9 | 52 ms | 188 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-islands-35 | 60 | 70 % | R116 | Vorherrschaft 36, Kapitulation 6, Abbruch (Rundendeckel) 18 | aurelia 22 : eisenbund 20 |
| medium-archipelago-30 | 60 | 62 % | R128 | Vorherrschaft 35, Abbruch (Rundendeckel) 23, Kapitulation 2 | aurelia 24 : eisenbund 13 |
| medium-continent-35 | 60 | 92 % | R100 | Kapitulation 10, Vorherrschaft 45, Abbruch (Rundendeckel) 5 | aurelia 21 : eisenbund 34 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 41 % · Sitz 2 33 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 47,1 | 75 % | 17,6 (12,9 erfolgreich) | 7,7 | 5,2 | 5,4 | 47,2 | 22,2 | 2,7 | 54,2 / 80,9 | 5,8 (4,7 gefallen) |
| eisenbund | 46,7 | 75 % | 17,3 (12,9 erfolgreich) | 7,5 | 5,4 | 5,2 | 46,6 | 22,3 | 2,8 | 55,0 / 80,0 | 5,8 (4,8 gefallen) |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 10,0 | 71,8 | 18,4 (26 %) | 3,2 |
| eisenbund | 10,3 | 73,3 | 15,9 (22 %) | 2,9 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 4,9 | 53,6 | 7,0 | 34,4 | 6,6 | 0 |
| eisenbund | 5,1 | 59,3 | 6,7 | 37,3 | 6,7 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,9 | 1,4 / 2,0 |
| 20 | 2,2 / 3,7 | 2,2 / 3,9 |
| 30 | 3,0 / 6,7 | 3,1 / 7,1 |
| 40 | 4,0 / 10,8 | 3,9 / 11,8 |
| 50 | 5,1 / 16,1 | 5,1 / 17,7 |
| 60 | 6,2 / 22,0 | 6,0 / 24,6 |
| 70 | 7,0 / 27,9 | 6,7 / 31,5 |
| 80 | 7,4 / 33,7 | 7,1 / 37,9 |
| 90 | 7,6 / 38,5 | 7,7 / 44,3 |
| 100 | 7,9 / 43,0 | 7,9 / 49,9 |
| 110 | 8,2 / 47,1 | 8,1 / 54,6 |
| 120 | 8,2 / 50,5 | 8,3 / 58,6 |
| 130 | 8,3 / 53,2 | 8,5 / 62,0 |
| 140 | 8,3 / 55,4 | 8,5 / 64,7 |
| 150 | 8,4 / 57,5 | 8,6 / 66,7 |
| 151 | 8,4 / 57,5 | 8,6 / 66,7 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
