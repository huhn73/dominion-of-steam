# KI-Simulation: rundenlimit-mittel

Lauf vom 01.11.2026, 18:07, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 6 min 40 s.

Karten: medium (Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 51 s | 129,8 | 394,5 | 181,2 | 9,6 |

## Matchup hard-vs-normal

100 Partien, Median 145 Runden (Mittel 129,4). Spielende: Ausschaltung 55, Rundenlimit 45.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal** (eisenbund, normal) | 11/100 | 11 % | 6–19 % | 1,89 | 54 (Median R113) | R12,1 (100/100) | 2,5 | 21,5 | 99 ms | 399 ms |
| **hard** (eisenbund, hard) | 89/100 | 89 % | 81–94 % | 1,11 | 1 (Median R127) | R10,6 (100/100) | 16,3 | 126,3 | 235 ms | 943 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 53 % · Sitz 2 47 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal | 50,8 | 72 % | 17,2 (13,0 erfolgreich) | 7,3 | 5,6 | 11,5 | 83,2 | 23,7 | 1,3 | 73,3 / 135,2 |
| hard | 97,2 | 79 % | 26,6 (20,9 erfolgreich) | 9,4 | 11,5 | 5,6 | 64,7 | 56,2 | 0,7 | 108,4 / 122,2 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal | 0,0 | 4,6 | 48,9 | 9,8 | 34,1 | 0,0 | 0,0 | 6,6 | 0 |
| hard | 13,5 | 4,3 | 38,8 | 6,2 | 103,6 | 3,8 | 3,0 | 11,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal | hard |
| --- | --- | --- |
| 10 | 1,5 / 2,0 | 1,6 / 1,9 |
| 20 | 2,7 / 4,0 | 3,1 / 4,0 |
| 30 | 3,9 / 7,7 | 4,7 / 8,3 |
| 40 | 4,8 / 12,3 | 6,2 / 14,1 |
| 50 | 5,3 / 16,1 | 7,8 / 21,2 |
| 60 | 5,2 / 17,7 | 9,2 / 29,6 |
| 70 | 4,9 / 18,7 | 10,5 / 38,8 |
| 80 | 4,6 / 19,1 | 11,7 / 49,3 |
| 90 | 4,3 / 17,9 | 12,8 / 59,8 |
| 100 | 3,9 / 17,8 | 13,8 / 71,6 |
| 110 | 3,5 / 17,6 | 14,5 / 84,0 |
| 120 | 3,1 / 18,2 | 15,1 / 96,1 |
| 130 | 2,8 / 18,9 | 15,6 / 106,8 |
| 140 | 2,5 / 19,8 | 16,0 / 116,7 |
| 150 | 2,5 / 21,5 | 16,3 / 126,3 |


## Matchup normal-vs-easy

100 Partien, Median 140 Runden (Mittel 130,3). Spielende: Ausschaltung 56, Rundenlimit 44.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **normal** (eisenbund, normal) | 84/100 | 84 % | 76–90 % | 1,16 | 0 | R11,0 (100/100) | 15,6 | 125,8 | 240 ms | 966 ms |
| **easy** (eisenbund, easy) | 16/100 | 16 % | 10–24 % | 1,84 | 56 (Median R118) | R12,6 (100/100) | 2,8 | 32,0 | 152 ms | 701 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 54 % · Sitz 2 46 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal | 133,5 | 77 % | 37,2 (27,2 erfolgreich) | 10,7 | 16,5 | 12,5 | 77,5 | 75,7 | 0,5 | 89,2 / 125,6 |
| easy | 51,6 | 73 % | 26,6 (18,3 erfolgreich) | 5,7 | 12,5 | 16,5 | 107,6 | 19,7 | 0,0 | 70,8 / 119,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 5,1 | 104,1 | 11,3 | 68,1 | 12,1 | 0 |
| easy | 0,0 | 123,0 | 0,0 | 12,6 | 8,1 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | normal | easy |
| --- | --- | --- |
| 10 | 1,5 / 2,0 | 1,4 / 2,4 |
| 20 | 2,7 / 4,2 | 2,5 / 4,9 |
| 30 | 4,1 / 8,4 | 3,5 / 9,7 |
| 40 | 5,5 / 14,4 | 4,8 / 15,4 |
| 50 | 7,0 / 22,1 | 5,5 / 22,5 |
| 60 | 7,9 / 31,4 | 6,1 / 29,3 |
| 70 | 9,0 / 41,0 | 6,2 / 34,1 |
| 80 | 10,1 / 50,9 | 5,9 / 36,1 |
| 90 | 11,4 / 61,9 | 5,3 / 36,8 |
| 100 | 12,4 / 74,2 | 4,9 / 35,4 |
| 110 | 13,3 / 85,7 | 4,3 / 33,9 |
| 120 | 14,0 / 97,8 | 3,8 / 32,0 |
| 130 | 14,7 / 109,1 | 3,4 / 31,5 |
| 140 | 15,2 / 118,2 | 3,0 / 32,0 |
| 150 | 15,6 / 125,8 | 2,8 / 32,0 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
