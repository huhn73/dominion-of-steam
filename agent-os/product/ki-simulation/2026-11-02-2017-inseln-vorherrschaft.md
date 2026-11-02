# KI-Simulation: inseln-vorherrschaft

Lauf vom 02.11.2026, 20:17, Modus `run`. 360 Partien gespielt, 32 Worker, Dauer 3 min 33 s.

Karten: medium-islands-35 (Welt islands, Land 35 %, Städte normal, Gelände normal); medium-archipelago-30 (Welt archipelago, Land 30 %, Städte normal, Gelände normal); medium-continent-35 (Welt continent, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 30, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Vorherrschaft.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 18 s | 117,9 | 151,2 | 69,2 | 6,9 |

## Matchup hard-vs-normal

180 Partien, Median 112 Runden (Mittel 113,7). Spielende: Vorherrschaft 96, Kapitulation 33, Abbruch (Rundendeckel) 49, Ausschaltung 2.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 106/180 | 59 % | 52–66 % | 1,19 | 3 (Median R88) | R12,1 (180/180) | 10,3 | 61,7 | 96 ms | 357 ms |
| **normal** (eisenbund, normal) | 25/180 | 14 % | 10–20 % | 1,81 | 32 (Median R93) | R13,8 (179/180) | 5,9 | 53,1 | 64 ms | 236 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 41 % · Sitz 2 32 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 52,7 | 79 % | 17,2 (13,1 erfolgreich) | 7,9 | 5,3 | 3,8 | 40,7 | 28,3 | 4,2 | 60,6 / 80,2 |
| normal | 37,0 | 72 % | 14,2 (10,4 erfolgreich) | 6,6 | 3,8 | 5,3 | 49,1 | 16,3 | 5,5 | 50,4 / 82,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 6,1 | 0,5 | 4,7 | 19,2 | 4,7 | 56,2 | 2,2 | 2,0 | 8,3 | 0 |
| normal | 0,0 | 0,0 | 4,1 | 54,8 | 6,9 | 35,1 | 0,0 | 0,0 | 6,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 2,0 | 1,4 / 2,0 |
| 20 | 2,5 / 3,9 | 2,2 / 4,0 |
| 30 | 3,4 / 7,3 | 3,0 / 7,1 |
| 40 | 4,4 / 11,7 | 3,8 / 11,7 |
| 50 | 5,8 / 17,5 | 4,8 / 17,6 |
| 60 | 6,9 / 24,0 | 5,9 / 24,0 |
| 70 | 7,7 / 29,7 | 6,4 / 30,2 |
| 80 | 8,4 / 35,2 | 6,5 / 35,5 |
| 90 | 8,9 / 40,1 | 6,5 / 39,5 |
| 100 | 9,2 / 44,3 | 6,5 / 42,7 |
| 110 | 9,6 / 48,4 | 6,3 / 45,5 |
| 120 | 9,8 / 52,1 | 6,2 / 47,4 |
| 130 | 9,9 / 55,3 | 6,1 / 49,4 |
| 140 | 10,2 / 58,8 | 5,9 / 51,1 |
| 150 | 10,3 / 61,6 | 5,9 / 52,9 |
| 151 | 10,3 / 61,6 | 5,9 / 52,9 |


## Matchup aurelia-vs-eisenbund

180 Partien, Median 133 Runden (Mittel 122,1). Spielende: Kapitulation 23, Vorherrschaft 77, Abbruch (Rundendeckel) 80.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 52/180 | 29 % | 23–36 % | 1,48 | 17 (Median R98) | R13,5 (180/180) | 8,4 | 73,6 | 58 ms | 207 ms |
| **eisenbund** (eisenbund, normal) | 48/180 | 27 % | 21–34 % | 1,52 | 6 (Median R60) | R13,4 (180/180) | 8,3 | 79,8 | 60 ms | 216 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 36 % · Sitz 2 19 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 45,9 | 76 % | 17,5 (13,0 erfolgreich) | 7,6 | 5,4 | 5,5 | 45,6 | 22,0 | 3,6 | 50,2 / 76,8 |
| eisenbund | 45,2 | 76 % | 17,1 (12,8 erfolgreich) | 7,3 | 5,5 | 5,4 | 45,5 | 21,6 | 3,2 | 51,2 / 75,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 3,9 | 63,8 | 6,7 | 40,8 | 6,6 | 0 |
| eisenbund | 3,8 | 67,4 | 6,3 | 43,2 | 6,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,9 | 1,4 / 2,0 |
| 20 | 2,2 / 3,7 | 2,2 / 3,9 |
| 30 | 3,0 / 6,9 | 3,1 / 7,2 |
| 40 | 3,9 / 11,2 | 3,9 / 12,0 |
| 50 | 5,0 / 16,7 | 5,0 / 18,5 |
| 60 | 6,2 / 22,8 | 6,0 / 25,2 |
| 70 | 7,1 / 29,5 | 6,8 / 32,4 |
| 80 | 7,5 / 35,5 | 7,2 / 39,3 |
| 90 | 7,7 / 41,9 | 7,5 / 46,1 |
| 100 | 7,9 / 47,5 | 7,8 / 52,7 |
| 110 | 8,0 / 53,0 | 7,9 / 59,0 |
| 120 | 8,1 / 58,4 | 8,1 / 64,5 |
| 130 | 8,2 / 63,5 | 8,1 / 69,9 |
| 140 | 8,2 / 68,2 | 8,2 / 74,6 |
| 150 | 8,4 / 73,3 | 8,3 / 79,4 |
| 151 | 8,4 / 73,3 | 8,3 / 79,4 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
