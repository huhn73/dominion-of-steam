# KI-Simulation: sweep-transporte-normal

Lauf vom 01.11.2026, 21:13, Modus `sweep`. 250 Partien gespielt, 28 Worker, Dauer 2 min 41 s.

Karten: medium (Welt islands, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 25, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 18 s | 150,0 | 123,2 | 56,6 | 6,5 |

## Sweep: normal2 gegen normal

| Rang | Rasterpunkt | Siege | Quote | 95 %-Intervall | Ø Platz |
| --- | --- | --- | --- | --- | --- |
| 1 | maxTransports=3 | 34/50 | 68 % | 54–79 % | 1,32 |
| 2 | maxTransports=2 | 33/50 | 66 % | 52–78 % | 1,34 |
| 3 | maxTransports=4 | 28/50 | 56 % | 42–69 % | 1,44 |
| 4 | **Basis (ohne Override)** | 25/50 | 50 % | 37–63 % | 1,50 |
| 5 | maxTransports=1 | 25/50 | 50 % | 37–63 % | 1,50 |

## Matchup sweep-0

Rasterpunkt: Basis

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal** (eisenbund, normal) | 25/50 | 50 % | 37–63 % | 1,50 | 0 | R12,7 (50/50) | 8,6 | 133,5 | 56 ms | 161 ms |
| **normal2** (eisenbund, normal) | 25/50 | 50 % | 37–63 % | 1,50 | 0 | R12,7 (50/50) | 8,6 | 133,5 | 56 ms | 161 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 60 % · Sitz 2 40 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal | 42,6 | 75 % | 13,2 (9,7 erfolgreich) | 7,6 | 2,1 | 2,1 | 42,6 | 22,0 | 2,4 | 58,5 / 78,6 |
| normal2 | 42,6 | 75 % | 13,2 (9,7 erfolgreich) | 7,6 | 2,1 | 2,1 | 42,6 | 22,0 | 2,4 | 58,5 / 78,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2,8 | 95,1 | 10,6 | 63,6 | 6,1 | 0 |
| normal2 | 2,8 | 95,1 | 10,6 | 63,6 | 6,1 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal | normal2 |
| --- | --- | --- |
| 10 | 1,4 / 2,0 | 1,4 / 2,0 |
| 20 | 2,2 / 4,1 | 2,2 / 4,1 |
| 30 | 3,1 / 7,6 | 3,1 / 7,6 |
| 40 | 4,1 / 13,0 | 4,1 / 13,0 |
| 50 | 5,2 / 20,6 | 5,2 / 20,6 |
| 60 | 6,1 / 29,5 | 6,1 / 29,5 |
| 70 | 6,7 / 39,6 | 6,7 / 39,6 |
| 80 | 7,3 / 50,0 | 7,3 / 50,0 |
| 90 | 7,6 / 60,9 | 7,6 / 60,9 |
| 100 | 7,9 / 72,6 | 7,9 / 72,6 |
| 110 | 8,0 / 83,2 | 8,0 / 83,2 |
| 120 | 8,2 / 95,0 | 8,2 / 95,0 |
| 130 | 8,3 / 107,2 | 8,3 / 107,2 |
| 140 | 8,5 / 120,1 | 8,5 / 120,1 |
| 150 | 8,6 / 133,5 | 8,6 / 133,5 |


## Matchup sweep-1

Rasterpunkt: maxTransports=1

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal2** (eisenbund, normal) | 25/50 | 50 % | 37–63 % | 1,50 | 0 | R12,7 (50/50) | 8,6 | 133,5 | 51 ms | 154 ms |
| **normal** (eisenbund, normal) | 25/50 | 50 % | 37–63 % | 1,50 | 0 | R12,7 (50/50) | 8,6 | 133,5 | 51 ms | 154 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 60 % · Sitz 2 40 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal2 | 42,6 | 75 % | 13,2 (9,7 erfolgreich) | 7,6 | 2,1 | 2,1 | 42,6 | 22,0 | 2,4 | 58,5 / 78,6 |
| normal | 42,6 | 75 % | 13,2 (9,7 erfolgreich) | 7,6 | 2,1 | 2,1 | 42,6 | 22,0 | 2,4 | 58,5 / 78,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| normal2 | 2,8 | 95,1 | 10,6 | 63,6 | 6,1 | 0 |
| normal | 2,8 | 95,1 | 10,6 | 63,6 | 6,1 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal2 | normal |
| --- | --- | --- |
| 10 | 1,4 / 2,0 | 1,4 / 2,0 |
| 20 | 2,2 / 4,1 | 2,2 / 4,1 |
| 30 | 3,1 / 7,6 | 3,1 / 7,6 |
| 40 | 4,1 / 13,0 | 4,1 / 13,0 |
| 50 | 5,2 / 20,6 | 5,2 / 20,6 |
| 60 | 6,1 / 29,5 | 6,1 / 29,5 |
| 70 | 6,7 / 39,6 | 6,7 / 39,6 |
| 80 | 7,3 / 50,0 | 7,3 / 50,0 |
| 90 | 7,6 / 60,9 | 7,6 / 60,9 |
| 100 | 7,9 / 72,6 | 7,9 / 72,6 |
| 110 | 8,0 / 83,2 | 8,0 / 83,2 |
| 120 | 8,2 / 95,0 | 8,2 / 95,0 |
| 130 | 8,3 / 107,2 | 8,3 / 107,2 |
| 140 | 8,5 / 120,1 | 8,5 / 120,1 |
| 150 | 8,6 / 133,5 | 8,6 / 133,5 |


## Matchup sweep-2

Rasterpunkt: maxTransports=2

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal** (eisenbund, normal) | 17/50 | 34 % | 22–48 % | 1,66 | 0 | R12,7 (50/50) | 7,9 | 120,0 | 52 ms | 162 ms |
| **normal2** (eisenbund, normal) | 33/50 | 66 % | 52–78 % | 1,34 | 0 | R12,7 (50/50) | 9,5 | 136,7 | 60 ms | 190 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 68 % · Sitz 2 32 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal | 47,8 | 75 % | 14,3 (10,4 erfolgreich) | 7,3 | 3,1 | 3,5 | 47,5 | 25,4 | 1,8 | 64,4 / 85,9 |
| normal2 | 49,1 | 75 % | 15,7 (11,6 erfolgreich) | 8,1 | 3,5 | 3,1 | 49,4 | 25,2 | 4,0 | 63,9 / 87,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2,7 | 89,5 | 10,1 | 60,0 | 6,1 | 0 |
| normal2 | 4,9 | 101,8 | 9,1 | 67,1 | 6,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal | normal2 |
| --- | --- | --- |
| 10 | 1,4 / 2,0 | 1,4 / 2,0 |
| 20 | 2,2 / 4,1 | 2,2 / 4,1 |
| 30 | 3,2 / 7,6 | 3,2 / 7,4 |
| 40 | 4,0 / 12,6 | 4,0 / 12,4 |
| 50 | 5,1 / 19,6 | 5,0 / 19,2 |
| 60 | 5,8 / 28,6 | 6,4 / 27,6 |
| 70 | 6,7 / 38,0 | 7,2 / 37,8 |
| 80 | 6,9 / 47,8 | 7,9 / 49,1 |
| 90 | 7,1 / 58,1 | 8,3 / 61,6 |
| 100 | 7,5 / 68,7 | 8,6 / 73,4 |
| 110 | 7,6 / 79,1 | 8,8 / 86,0 |
| 120 | 7,6 / 88,7 | 9,0 / 98,4 |
| 130 | 7,7 / 99,5 | 9,3 / 111,6 |
| 140 | 7,9 / 109,5 | 9,3 / 123,8 |
| 150 | 7,9 / 120,0 | 9,5 / 136,7 |


## Matchup sweep-3

Rasterpunkt: maxTransports=3

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal2** (eisenbund, normal) | 34/50 | 68 % | 54–79 % | 1,32 | 0 | R12,7 (50/50) | 9,7 | 133,9 | 66 ms | 201 ms |
| **normal** (eisenbund, normal) | 16/50 | 32 % | 21–46 % | 1,68 | 0 | R12,7 (50/50) | 7,7 | 114,3 | 55 ms | 172 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 70 % · Sitz 2 30 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal2 | 54,0 | 75 % | 17,3 (12,6 erfolgreich) | 8,2 | 4,4 | 3,8 | 54,9 | 27,8 | 5,8 | 68,5 / 98,9 |
| normal | 52,4 | 76 % | 15,3 (11,1 erfolgreich) | 7,2 | 3,8 | 4,4 | 51,5 | 28,7 | 2,8 | 73,4 / 91,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| normal2 | 7,1 | 102,1 | 10,0 | 67,6 | 7,4 | 0 |
| normal | 2,9 | 88,5 | 10,5 | 59,5 | 6,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal2 | normal |
| --- | --- | --- |
| 10 | 1,4 / 2,0 | 1,4 / 2,0 |
| 20 | 2,2 / 4,1 | 2,2 / 4,1 |
| 30 | 3,2 / 7,1 | 3,2 / 7,6 |
| 40 | 3,9 / 11,6 | 4,2 / 12,9 |
| 50 | 5,0 / 18,2 | 5,2 / 20,4 |
| 60 | 6,2 / 26,0 | 6,1 / 29,3 |
| 70 | 7,4 / 35,8 | 6,6 / 38,8 |
| 80 | 8,2 / 46,5 | 6,9 / 48,4 |
| 90 | 8,8 / 57,9 | 7,1 / 58,2 |
| 100 | 9,0 / 70,4 | 7,4 / 67,8 |
| 110 | 9,2 / 82,9 | 7,7 / 77,8 |
| 120 | 9,5 / 95,7 | 7,7 / 87,0 |
| 130 | 9,7 / 108,5 | 7,6 / 96,3 |
| 140 | 9,7 / 120,6 | 7,6 / 105,2 |
| 150 | 9,7 / 133,9 | 7,7 / 114,3 |


## Matchup sweep-4

Rasterpunkt: maxTransports=4

50 Partien, Median 150 Runden (Mittel 150,0). Spielende: Rundenlimit 50.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal2** (eisenbund, normal) | 28/50 | 56 % | 42–69 % | 1,44 | 0 | R12,7 (50/50) | 9,5 | 123,9 | 66 ms | 196 ms |
| **normal** (eisenbund, normal) | 22/50 | 44 % | 31–58 % | 1,56 | 0 | R12,7 (50/50) | 8,0 | 113,8 | 53 ms | 165 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 62 % · Sitz 2 38 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal2 | 57,1 | 75 % | 16,9 (12,1 erfolgreich) | 8,0 | 4,1 | 3,6 | 55,2 | 30,6 | 7,7 | 74,9 / 103,3 |
| normal | 53,2 | 75 % | 15,3 (11,1 erfolgreich) | 7,5 | 3,6 | 4,1 | 55,1 | 28,7 | 2,7 | 78,3 / 98,0 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| normal2 | 8,5 | 96,2 | 10,8 | 63,8 | 7,7 | 0 |
| normal | 2,8 | 89,0 | 12,0 | 60,5 | 6,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal2 | normal |
| --- | --- | --- |
| 10 | 1,4 / 2,0 | 1,4 / 2,0 |
| 20 | 2,2 / 4,1 | 2,2 / 4,1 |
| 30 | 3,2 / 7,1 | 3,2 / 7,6 |
| 40 | 3,9 / 11,0 | 4,1 / 12,8 |
| 50 | 4,9 / 17,3 | 5,3 / 20,1 |
| 60 | 6,0 / 24,8 | 6,0 / 29,3 |
| 70 | 7,1 / 34,0 | 6,8 / 39,3 |
| 80 | 8,0 / 43,4 | 7,0 / 48,3 |
| 90 | 8,5 / 53,6 | 7,3 / 57,5 |
| 100 | 8,8 / 65,2 | 7,5 / 67,2 |
| 110 | 9,1 / 76,2 | 7,5 / 76,9 |
| 120 | 9,1 / 89,1 | 7,8 / 85,8 |
| 130 | 9,3 / 99,4 | 7,9 / 94,4 |
| 140 | 9,4 / 111,8 | 7,9 / 104,0 |
| 150 | 9,5 / 123,9 | 8,0 / 113,8 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
