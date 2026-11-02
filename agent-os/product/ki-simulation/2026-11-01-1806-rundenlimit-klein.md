# KI-Simulation: rundenlimit-klein

Lauf vom 01.11.2026, 18:06, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 13 s.

Karten: small (Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 75, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 2 s | 59,5 | 27,0 | 11,4 | 3,5 |

## Matchup hard-vs-normal

100 Partien, Median 67 Runden (Mittel 59,8). Spielende: Ausschaltung 56, Rundenlimit 44.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **hard** (eisenbund, hard) | 69/100 | 69 % | 59–77 % | 1,31 | 22 (Median R45) | R10,2 (97/100) | 4,2 | 19,2 | 16 ms | 59 ms |
| **normal** (eisenbund, normal) | 31/100 | 31 % | 23–41 % | 1,69 | 34 (Median R51) | R10,7 (92/100) | 1,9 | 6,7 | 13 ms | 60 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 61 % · Sitz 2 39 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 16,2 | 78 % | 7,2 (5,4 erfolgreich) | 2,3 | 3,1 | 2,2 | 13,3 | 7,3 | 0,0 | 14,8 / 22,3 |
| normal | 11,5 | 73 % | 5,4 (4,1 erfolgreich) | 1,9 | 2,2 | 3,1 | 14,4 | 4,3 | 0,2 | 10,3 / 22,7 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Dampfkoloss | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hard | 0,6 | 0,2 | 7,1 | 0,1 | 18,3 | 0,8 | 0,4 | 3,7 | 0 |
| normal | 0,0 | 0,7 | 8,8 | 2,5 | 6,2 | 0,0 | 0,0 | 3,1 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | hard | normal |
| --- | --- | --- |
| 10 | 1,6 / 1,9 | 1,6 / 1,9 |
| 20 | 2,4 / 3,3 | 2,2 / 3,4 |
| 30 | 3,0 / 5,2 | 2,2 / 4,5 |
| 40 | 3,7 / 7,9 | 2,1 / 5,1 |
| 50 | 4,0 / 11,5 | 2,0 / 5,4 |
| 60 | 4,2 / 14,6 | 1,9 / 6,0 |
| 70 | 4,2 / 17,5 | 1,9 / 6,5 |
| 75 | 4,2 / 19,2 | 1,9 / 6,7 |


## Matchup normal-vs-easy

100 Partien, Median 64 Runden (Mittel 59,3). Spielende: Ausschaltung 59, Rundenlimit 41.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **easy** (eisenbund, easy) | 18/100 | 18 % | 12–27 % | 1,82 | 58 (Median R50) | R12,2 (98/100) | 1,2 | 6,9 | 6 ms | 24 ms |
| **normal** (eisenbund, normal) | 82/100 | 82 % | 73–88 % | 1,18 | 1 (Median R31) | R11,3 (100/100) | 5,0 | 18,1 | 9 ms | 33 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 58 % · Sitz 2 42 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| easy | 9,8 | 69 % | 7,4 (4,9 erfolgreich) | 1,6 | 3,3 | 4,7 | 17,9 | 1,9 | 0,0 | 8,6 / 19,3 |
| normal | 22,0 | 78 % | 9,8 (7,3 erfolgreich) | 2,6 | 4,7 | 3,3 | 14,0 | 9,9 | 0,0 | 11,3 / 22,2 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| easy | 0,0 | 21,6 | 0,0 | 1,8 | 2,8 | 0 |
| normal | 1,1 | 14,4 | 3,3 | 9,1 | 4,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | easy | normal |
| --- | --- | --- |
| 10 | 1,5 / 2,3 | 1,6 / 2,0 |
| 20 | 1,9 / 3,9 | 2,4 / 3,9 |
| 30 | 2,0 / 4,7 | 3,1 / 6,4 |
| 40 | 1,8 / 5,4 | 3,8 / 8,7 |
| 50 | 1,5 / 6,0 | 4,4 / 11,6 |
| 60 | 1,3 / 6,3 | 4,8 / 14,6 |
| 70 | 1,2 / 6,8 | 5,0 / 17,1 |
| 75 | 1,2 / 6,9 | 5,0 / 18,1 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
