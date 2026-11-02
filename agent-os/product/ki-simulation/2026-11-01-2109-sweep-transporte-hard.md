# KI-Simulation: sweep-transporte-hard

Lauf vom 01.11.2026, 21:09, Modus `sweep`. 250 Partien gespielt, 28 Worker, Dauer 3 min 43 s.

Karten: medium (Welt islands, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 25, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 25 s | 149,2 | 169,8 | 79,8 | 7,2 |

## Sweep: hard gegen normal

| Rang | Rasterpunkt | Siege | Quote | 95 %-Intervall | Ø Platz |
| --- | --- | --- | --- | --- | --- |
| 1 | maxTransports=4 | 42/50 | 84 % | 71–92 % | 1,16 |
| 2 | maxTransports=2 | 37/50 | 74 % | 60–84 % | 1,26 |
| 3 | maxTransports=3 | 37/50 | 74 % | 60–84 % | 1,26 |
| 4 | **Basis (ohne Override)** | 22/50 | 44 % | 31–58 % | 1,56 |
| 5 | maxTransports=1 | 22/50 | 44 % | 31–58 % | 1,56 |

## Matchup sweep-0

Rasterpunkt: Basis

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 22/50 | 44 % | 31–58 % | 1,56 | 0 | R11,8 (50/50) | 9,1 | 119,9 | 94 ms | 243 ms |
| **normal** (eisenbund, normal) | 28/50 | 56 % | 42–69 % | 1,44 | 0 | R13,6 (50/50) | 7,9 | 122,5 | 50 ms | 149 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 66 % · Sitz 2 34 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 43,6 | 76 % | 12,9 (9,6 erfolgreich) | 7,5 | 2,1 | 1,5 | 32,2 | 23,4 | 2,1 | 59,6 / 63,9 |
| normal | 29,6 | 72 % | 12,8 (9,1 erfolgreich) | 7,5 | 1,5 | 2,1 | 40,9 | 12,1 | 3,6 | 41,6 / 79,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 11,7 | 0,9 | 2,1 | 28,4 | 3,6 | 94,4 | 2,6 | 2,5 | 6,7 | 0 |
| normal | 0,0 | 0,0 | 3,3 | 85,1 | 12,5 | 59,9 | 0,0 | 0,0 | 5,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 1,9 | 1,4 / 1,9 |
| 20 | 2,4 / 4,0 | 2,0 / 3,9 |
| 30 | 3,5 / 7,4 | 2,9 / 7,1 |
| 40 | 4,5 / 12,4 | 4,0 / 12,2 |
| 50 | 5,5 / 19,0 | 4,7 / 19,5 |
| 60 | 6,7 / 26,3 | 5,9 / 26,6 |
| 70 | 7,3 / 34,5 | 6,6 / 35,1 |
| 80 | 8,0 / 44,0 | 7,0 / 45,5 |
| 90 | 8,3 / 52,8 | 7,2 / 55,1 |
| 100 | 8,5 / 63,8 | 7,4 / 66,3 |
| 110 | 8,7 / 74,6 | 7,5 / 77,5 |
| 120 | 8,8 / 85,2 | 7,7 / 88,9 |
| 130 | 8,9 / 96,3 | 7,8 / 100,5 |
| 140 | 8,9 / 108,1 | 7,9 / 111,1 |
| 150 | 9,1 / 119,9 | 7,9 / 122,5 |


## Matchup sweep-1

Rasterpunkt: maxTransports=1

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 22/50 | 44 % | 31–58 % | 1,56 | 0 | R11,8 (50/50) | 9,1 | 119,9 | 88 ms | 235 ms |
| **normal** (eisenbund, normal) | 28/50 | 56 % | 42–69 % | 1,44 | 0 | R13,6 (50/50) | 7,9 | 122,5 | 46 ms | 139 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 66 % · Sitz 2 34 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 43,6 | 76 % | 12,9 (9,6 erfolgreich) | 7,5 | 2,1 | 1,5 | 32,2 | 23,4 | 2,1 | 59,6 / 63,9 |
| normal | 29,6 | 72 % | 12,8 (9,1 erfolgreich) | 7,5 | 1,5 | 2,1 | 40,9 | 12,1 | 3,6 | 41,6 / 79,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 11,7 | 0,9 | 2,1 | 28,4 | 3,6 | 94,4 | 2,6 | 2,5 | 6,7 | 0 |
| normal | 0,0 | 0,0 | 3,3 | 85,1 | 12,5 | 59,9 | 0,0 | 0,0 | 5,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 1,9 | 1,4 / 1,9 |
| 20 | 2,4 / 4,0 | 2,0 / 3,9 |
| 30 | 3,5 / 7,4 | 2,9 / 7,1 |
| 40 | 4,5 / 12,4 | 4,0 / 12,2 |
| 50 | 5,5 / 19,0 | 4,7 / 19,5 |
| 60 | 6,7 / 26,3 | 5,9 / 26,6 |
| 70 | 7,3 / 34,5 | 6,6 / 35,1 |
| 80 | 8,0 / 44,0 | 7,0 / 45,5 |
| 90 | 8,3 / 52,8 | 7,2 / 55,1 |
| 100 | 8,5 / 63,8 | 7,4 / 66,3 |
| 110 | 8,7 / 74,6 | 7,5 / 77,5 |
| 120 | 8,8 / 85,2 | 7,7 / 88,9 |
| 130 | 8,9 / 96,3 | 7,8 / 100,5 |
| 140 | 8,9 / 108,1 | 7,9 / 111,1 |
| 150 | 9,1 / 119,9 | 7,9 / 122,5 |


## Matchup sweep-2

Rasterpunkt: maxTransports=2

50 Partien, Median 150 Runden (Mittel 148,9). Spielende: Rundenlimit 48, Ausschaltung 2.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 37/50 | 74 % | 60–84 % | 1,26 | 0 | R11,8 (50/50) | 11,0 | 118,9 | 106 ms | 322 ms |
| **normal** (eisenbund, normal) | 13/50 | 26 % | 16–40 % | 1,74 | 2 (Median R124) | R13,6 (50/50) | 6,3 | 84,1 | 52 ms | 154 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 52 % · Sitz 2 48 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 64,9 | 78 % | 17,4 (13,3 erfolgreich) | 8,2 | 5,2 | 3,3 | 46,9 | 37,0 | 5,2 | 81,9 / 95,4 |
| normal | 41,5 | 71 % | 14,5 (10,4 erfolgreich) | 7,1 | 3,3 | 5,2 | 59,5 | 19,1 | 4,0 | 65,6 / 104,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 13,1 | 1,0 | 4,6 | 32,0 | 4,2 | 99,0 | 3,3 | 3,1 | 8,4 | 0 |
| normal | 0,0 | 0,0 | 3,2 | 73,8 | 12,3 | 51,2 | 0,0 | 0,0 | 5,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 1,9 | 1,4 / 1,9 |
| 20 | 2,4 / 4,0 | 2,0 / 3,9 |
| 30 | 3,5 / 7,3 | 2,9 / 7,1 |
| 40 | 4,5 / 12,4 | 3,8 / 11,9 |
| 50 | 5,7 / 18,4 | 4,7 / 18,9 |
| 60 | 7,3 / 25,8 | 5,5 / 25,6 |
| 70 | 8,3 / 34,0 | 6,1 / 32,9 |
| 80 | 9,0 / 42,4 | 6,4 / 39,5 |
| 90 | 9,4 / 51,6 | 6,4 / 47,1 |
| 100 | 9,9 / 61,4 | 6,3 / 53,2 |
| 110 | 10,2 / 72,9 | 6,4 / 60,4 |
| 120 | 10,5 / 83,7 | 6,4 / 66,1 |
| 130 | 10,6 / 94,8 | 6,3 / 72,2 |
| 140 | 10,8 / 105,8 | 6,3 / 77,0 |
| 150 | 11,0 / 118,9 | 6,3 / 84,1 |


## Matchup sweep-3

Rasterpunkt: maxTransports=3

50 Partien, Median 150 Runden (Mittel 148,5). Spielende: Rundenlimit 47, Ausschaltung 3.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 37/50 | 74 % | 60–84 % | 1,26 | 0 | R11,8 (50/50) | 12,5 | 114,0 | 126 ms | 416 ms |
| **normal** (eisenbund, normal) | 13/50 | 26 % | 16–40 % | 1,74 | 3 (Median R133) | R13,6 (50/50) | 5,4 | 73,6 | 53 ms | 166 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 56 % · Sitz 2 44 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 75,0 | 78 % | 20,9 (16,0 erfolgreich) | 8,7 | 7,3 | 4,5 | 54,9 | 42,6 | 7,3 | 86,9 / 111,2 |
| normal | 47,2 | 72 % | 16,3 (11,7 erfolgreich) | 7,2 | 4,5 | 7,3 | 67,3 | 22,4 | 3,5 | 75,2 / 112,4 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 14,4 | 1,0 | 6,7 | 32,7 | 6,2 | 96,6 | 3,4 | 2,7 | 10,0 | 0 |
| normal | 0,0 | 0,0 | 3,0 | 73,4 | 10,3 | 49,5 | 0,0 | 0,0 | 5,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 1,9 | 1,4 / 1,9 |
| 20 | 2,4 / 4,0 | 2,0 / 3,9 |
| 30 | 3,5 / 7,2 | 2,9 / 7,1 |
| 40 | 4,5 / 12,0 | 3,9 / 12,0 |
| 50 | 5,7 / 18,0 | 4,8 / 19,6 |
| 60 | 6,9 / 25,5 | 5,8 / 26,9 |
| 70 | 8,3 / 33,1 | 6,2 / 34,2 |
| 80 | 9,2 / 41,3 | 6,2 / 41,5 |
| 90 | 9,7 / 50,1 | 6,4 / 47,6 |
| 100 | 10,1 / 58,9 | 6,4 / 53,3 |
| 110 | 10,8 / 68,6 | 6,1 / 58,6 |
| 120 | 11,1 / 78,5 | 6,2 / 62,4 |
| 130 | 11,6 / 89,7 | 5,9 / 65,9 |
| 140 | 12,0 / 100,8 | 5,6 / 70,2 |
| 150 | 12,5 / 114,0 | 5,4 / 73,6 |


## Matchup sweep-4

Rasterpunkt: maxTransports=4

50 Partien, Median 150 Runden (Mittel 148,4). Spielende: Rundenlimit 47, Ausschaltung 3.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 42/50 | 84 % | 71–92 % | 1,16 | 0 | R11,8 (50/50) | 13,5 | 112,7 | 132 ms | 449 ms |
| **normal** (eisenbund, normal) | 8/50 | 16 % | 8–29 % | 1,84 | 3 (Median R121) | R13,6 (50/50) | 4,7 | 61,2 | 51 ms | 155 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 54 % · Sitz 2 46 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 85,8 | 76 % | 24,0 (17,9 erfolgreich) | 9,0 | 8,9 | 5,4 | 63,5 | 47,4 | 7,5 | 96,1 / 129,0 |
| normal | 51,5 | 73 % | 17,1 (12,6 erfolgreich) | 7,1 | 5,4 | 8,9 | 73,8 | 25,2 | 3,2 | 87,4 / 122,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 13,1 | 1,0 | 7,7 | 34,4 | 7,0 | 100,1 | 3,4 | 2,8 | 11,2 | 0 |
| normal | 0,0 | 0,0 | 2,8 | 68,9 | 11,0 | 46,8 | 0,0 | 0,0 | 5,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,5 / 1,9 | 1,4 / 1,9 |
| 20 | 2,4 / 4,0 | 2,0 / 3,9 |
| 30 | 3,5 / 7,2 | 2,9 / 7,1 |
| 40 | 4,4 / 11,4 | 4,0 / 12,0 |
| 50 | 5,4 / 17,5 | 4,8 / 19,3 |
| 60 | 6,7 / 23,9 | 5,8 / 26,6 |
| 70 | 8,2 / 30,9 | 6,3 / 33,9 |
| 80 | 9,0 / 38,2 | 6,4 / 40,3 |
| 90 | 10,0 / 46,7 | 6,3 / 46,7 |
| 100 | 10,6 / 55,1 | 6,1 / 51,5 |
| 110 | 11,4 / 66,2 | 5,7 / 56,3 |
| 120 | 12,0 / 77,1 | 5,4 / 58,4 |
| 130 | 12,5 / 88,4 | 5,3 / 59,2 |
| 140 | 13,0 / 100,1 | 4,9 / 60,9 |
| 150 | 13,5 / 112,7 | 4,7 / 61,2 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
