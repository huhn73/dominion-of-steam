# KI-Simulation: persoenlichkeiten

Lauf vom 01.11.2026, 13:32, Modus `run`. 700 Partien gespielt, 28 Worker, Dauer 1 min 54 s.

Karten: medium (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 4 s | 76,2 | 52,4 | 23,9 | 5,1 |

## Matchup kessler-vs-normal

100 Partien, Median 100 Runden (Mittel 78,7). Spielende: Ausschaltung 43, Rundenlimit 57.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (aurelia, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 20 (Median R47) | R6,5 (99/100) | 5,8 | 34,5 | 18 ms | 55 ms |
| **kessler** (aurelia, normal, kessler) | 50/100 | 50 % | 40–60 % | 1,50 | 23 (Median R50) | R6,5 (99/100) | 5,7 | 31,0 | 14 ms | 57 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 48 % · Sitz 2 52 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 26,6 | 72 % | 16,4 (11,3 erfolgreich) | 4,8 | 6,5 | 6,5 | 34,3 | 7,9 | 0,0 | 30,0 / 50,0 |
| kessler | 38,3 | 70 % | 15,5 (11,2 erfolgreich) | 4,8 | 6,5 | 6,5 | 30,6 | 15,6 | 0,0 | 29,2 / 50,0 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| referenz | 39,1 | 10,4 | 14,9 | 4,2 | 0 |
| kessler | 28,2 | 16,2 | 12,5 | 3,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | kessler |
| --- | --- | --- |
| 10 | 2,0 / 1,5 | 2,1 / 1,5 |
| 20 | 3,3 / 3,4 | 3,4 / 3,3 |
| 30 | 4,7 / 5,3 | 4,5 / 5,0 |
| 40 | 5,5 / 8,0 | 5,3 / 7,5 |
| 50 | 6,1 / 11,2 | 5,3 / 10,0 |
| 60 | 6,2 / 15,5 | 5,3 / 12,9 |
| 70 | 6,1 / 20,1 | 5,4 / 16,8 |
| 80 | 6,0 / 24,8 | 5,5 / 21,3 |
| 90 | 5,9 / 29,6 | 5,6 / 26,2 |
| 100 | 5,8 / 34,5 | 5,7 / 31,0 |


## Matchup varenne-vs-normal

100 Partien, Median 100 Runden (Mittel 84,1). Spielende: Ausschaltung 31, Rundenlimit 69.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **varenne** (aurelia, normal, varenne) | 46/100 | 46 % | 37–56 % | 1,54 | 16 (Median R48) | R6,5 (99/100) | 5,4 | 36,1 | 14 ms | 54 ms |
| **referenz** (aurelia, normal) | 54/100 | 54 % | 44–63 % | 1,46 | 15 (Median R50) | R6,5 (99/100) | 6,1 | 42,2 | 18 ms | 67 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 48 % · Sitz 2 52 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| varenne | 33,3 | 75 % | 18,6 (13,1 erfolgreich) | 4,8 | 8,4 | 8,7 | 33,4 | 11,7 | 0,0 | 24,8 / 47,3 |
| referenz | 34,0 | 74 % | 19,0 (13,4 erfolgreich) | 4,7 | 8,7 | 8,4 | 33,9 | 11,8 | 0,0 | 24,0 / 48,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| varenne | 41,3 | 8,7 | 14,8 | 3,8 | 0 |
| referenz | 46,2 | 9,7 | 15,4 | 4,4 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | varenne | referenz |
| --- | --- | --- |
| 10 | 2,1 / 1,5 | 2,1 / 1,5 |
| 20 | 3,4 / 3,5 | 3,4 / 3,5 |
| 30 | 4,3 / 5,8 | 4,7 / 6,0 |
| 40 | 5,0 / 7,9 | 5,7 / 9,0 |
| 50 | 5,4 / 10,8 | 5,9 / 12,9 |
| 60 | 5,5 / 14,4 | 6,0 / 17,3 |
| 70 | 5,5 / 19,4 | 6,0 / 23,1 |
| 80 | 5,5 / 25,0 | 6,0 / 29,9 |
| 90 | 5,5 / 30,5 | 6,0 / 36,0 |
| 100 | 5,4 / 36,1 | 6,1 / 42,2 |


## Matchup brandt-vs-normal

100 Partien, Median 100 Runden (Mittel 86,8). Spielende: Ausschaltung 30, Rundenlimit 70.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **brandt** (eisenbund, normal, brandt) | 46/100 | 46 % | 37–56 % | 1,54 | 16 (Median R47) | R8,5 (100/100) | 6,1 | 42,8 | 32 ms | 129 ms |
| **referenz** (eisenbund, normal) | 54/100 | 54 % | 44–63 % | 1,46 | 14 (Median R61) | R6,2 (100/100) | 5,5 | 47,0 | 108 ms | 576 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 44 % · Sitz 2 56 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brandt | 48,1 | 78 % | 18,2 (12,7 erfolgreich) | 4,1 | 8,6 | 7,6 | 46,0 | 25,0 | 0,0 | 46,7 / 61,3 |
| referenz | 47,9 | 75 % | 18,7 (13,2 erfolgreich) | 5,6 | 7,6 | 8,6 | 50,0 | 22,9 | 0,0 | 39,7 / 70,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| brandt | 59,1 | 5,0 | 21,2 | 5,8 | 0 |
| referenz | 60,0 | 10,6 | 21,3 | 13,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | brandt | referenz |
| --- | --- | --- |
| 10 | 1,9 / 2,9 | 2,2 / 2,4 |
| 20 | 3,1 / 5,5 | 3,7 / 5,8 |
| 30 | 4,0 / 8,4 | 5,1 / 10,6 |
| 40 | 4,5 / 10,5 | 6,3 / 16,0 |
| 50 | 5,0 / 13,4 | 6,5 / 21,8 |
| 60 | 5,4 / 17,3 | 6,2 / 27,3 |
| 70 | 5,6 / 22,6 | 6,0 / 32,3 |
| 80 | 5,8 / 28,4 | 5,8 / 37,4 |
| 90 | 5,9 / 35,8 | 5,7 / 42,9 |
| 100 | 6,1 / 42,8 | 5,5 / 47,0 |


## Matchup eisenhart-vs-normal

100 Partien, Median 63 Runden (Mittel 69,1). Spielende: Ausschaltung 64, Rundenlimit 36.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenhart** (eisenbund, normal, eisenhart) | 50/100 | 50 % | 40–60 % | 1,50 | 31 (Median R51) | R6,2 (99/100) | 5,8 | 34,7 | 14 ms | 48 ms |
| **referenz** (eisenbund, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 33 (Median R51) | R6,3 (100/100) | 5,5 | 32,2 | 15 ms | 54 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 46 % · Sitz 2 54 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenhart | 43,6 | 66 % | 19,4 (13,4 erfolgreich) | 4,8 | 8,6 | 8,6 | 40,1 | 15,4 | 0,0 | 28,5 / 51,5 |
| referenz | 34,2 | 73 % | 19,0 (13,2 erfolgreich) | 4,6 | 8,6 | 8,6 | 37,7 | 11,9 | 0,0 | 27,8 / 52,0 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| eisenhart | 52,3 | 4,4 | 13,7 | 4,1 | 0 |
| referenz | 45,3 | 7,3 | 12,8 | 4,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenhart | referenz |
| --- | --- | --- |
| 10 | 2,1 / 2,5 | 2,1 / 2,4 |
| 20 | 3,8 / 5,7 | 3,6 / 5,1 |
| 30 | 4,9 / 9,2 | 4,4 / 8,2 |
| 40 | 5,7 / 12,4 | 5,1 / 10,6 |
| 50 | 5,7 / 15,6 | 5,5 / 13,7 |
| 60 | 5,8 / 19,1 | 5,5 / 17,3 |
| 70 | 5,9 / 22,9 | 5,5 / 21,4 |
| 80 | 5,9 / 26,8 | 5,4 / 24,5 |
| 90 | 5,9 / 30,7 | 5,5 / 28,3 |
| 100 | 5,8 / 34,7 | 5,5 / 32,2 |


## Matchup halvorsen-vs-normal

100 Partien, Median 73 Runden (Mittel 74,1). Spielende: Ausschaltung 56, Rundenlimit 44.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (nordmark, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 30 (Median R51) | R6,5 (99/100) | 5,5 | 30,6 | 11 ms | 44 ms |
| **halvorsen** (nordmark, normal, halvorsen) | 50/100 | 50 % | 40–60 % | 1,50 | 26 (Median R53) | R6,5 (99/100) | 5,8 | 24,3 | 9 ms | 34 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 42 % · Sitz 2 58 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 29,6 | 74 % | 17,8 (12,3 erfolgreich) | 4,6 | 7,8 | 7,8 | 30,9 | 9,5 | 0,0 | 20,0 / 43,8 |
| halvorsen | 31,8 | 73 % | 18,0 (12,5 erfolgreich) | 4,7 | 7,8 | 7,8 | 30,5 | 10,8 | 0,1 | 21,8 / 42,9 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Wolkenkreuzer | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| referenz | 37,2 | 7,6 | 12,5 | 0,0 | 3,9 | 0 |
| halvorsen | 29,0 | 5,6 | 13,3 | 2,3 | 3,4 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | halvorsen |
| --- | --- | --- |
| 10 | 2,1 / 1,5 | 2,1 / 1,5 |
| 20 | 3,4 / 3,6 | 3,4 / 3,5 |
| 30 | 4,3 / 5,6 | 4,5 / 5,7 |
| 40 | 5,1 / 8,0 | 5,3 / 7,7 |
| 50 | 5,4 / 10,6 | 5,6 / 10,0 |
| 60 | 5,8 / 13,9 | 5,5 / 12,3 |
| 70 | 5,6 / 17,7 | 5,7 / 14,7 |
| 80 | 5,6 / 21,9 | 5,7 / 17,7 |
| 90 | 5,6 / 26,4 | 5,7 / 21,0 |
| 100 | 5,5 / 30,6 | 5,8 / 24,3 |


## Matchup lindqvist-vs-normal

100 Partien, Median 100 Runden (Mittel 78,3). Spielende: Ausschaltung 42, Rundenlimit 58.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **lindqvist** (nordmark, normal, lindqvist) | 50/100 | 50 % | 40–60 % | 1,50 | 21 (Median R47) | R6,5 (99/100) | 5,7 | 33,0 | 12 ms | 46 ms |
| **referenz** (nordmark, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 21 (Median R47) | R6,5 (99/100) | 5,7 | 33,0 | 12 ms | 46 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 44 % · Sitz 2 56 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lindqvist | 33,1 | 74 % | 18,7 (13,0 erfolgreich) | 4,7 | 8,3 | 8,3 | 33,1 | 11,6 | 0,0 | 24,5 / 47,6 |
| referenz | 33,1 | 74 % | 18,7 (13,0 erfolgreich) | 4,7 | 8,3 | 8,3 | 33,1 | 11,6 | 0,0 | 24,5 / 47,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| lindqvist | 40,2 | 7,9 | 13,5 | 3,9 | 0 |
| referenz | 40,2 | 7,9 | 13,5 | 3,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | lindqvist | referenz |
| --- | --- | --- |
| 10 | 2,1 / 1,5 | 2,1 / 1,5 |
| 20 | 3,4 / 3,6 | 3,4 / 3,6 |
| 30 | 4,5 / 5,8 | 4,5 / 5,8 |
| 40 | 5,3 / 8,4 | 5,3 / 8,4 |
| 50 | 5,6 / 11,4 | 5,6 / 11,4 |
| 60 | 5,7 / 14,4 | 5,7 / 14,4 |
| 70 | 5,7 / 18,0 | 5,7 / 18,0 |
| 80 | 5,7 / 22,1 | 5,7 / 22,1 |
| 90 | 5,7 / 27,4 | 5,7 / 27,4 |
| 100 | 5,7 / 33,0 | 5,7 / 33,0 |


## Matchup ostrow-vs-normal

100 Partien, Median 52 Runden (Mittel 62,5). Spielende: Ausschaltung 76, Rundenlimit 24.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **ostrow** (salzkueste, normal, ostrow) | 0/100 | 0 % | 0–4 % | 2,00 | 76 (Median R49) | – | 0,1 | 1,4 | 9 ms | 37 ms |
| **referenz** (salzkueste, normal) | 100/100 | 100 % | 96–100 % | 1,00 | 0 | R6,7 (100/100) | 11,2 | 63,0 | 33 ms | 130 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 50 % · Sitz 2 50 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ostrow | 0,0 | – | 0,0 (0,0 erfolgreich) | 0,0 | 0,0 | 0,9 | 10,8 | 0,0 | 0,0 | 9,1 / 10,8 |
| referenz | 28,3 | 75 % | 14,8 (10,2 erfolgreich) | 9,3 | 0,9 | 0,0 | 17,4 | 10,8 | 0,0 | 10,8 / 28,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| ostrow | 11,2 | 0,0 | 0,0 | 3,2 | 0 |
| referenz | 52,4 | 10,2 | 13,7 | 8,4 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | ostrow | referenz |
| --- | --- | --- |
| 10 | 1,0 / 3,0 | 2,1 / 1,6 |
| 20 | 1,0 / 4,8 | 3,7 / 4,0 |
| 30 | 1,0 / 5,3 | 6,0 / 8,8 |
| 40 | 0,8 / 4,1 | 8,7 / 17,3 |
| 50 | 0,3 / 2,7 | 10,6 / 27,5 |
| 60 | 0,1 / 1,9 | 11,1 / 36,8 |
| 70 | 0,1 / 1,5 | 11,2 / 44,2 |
| 80 | 0,1 / 1,3 | 11,2 / 51,0 |
| 90 | 0,1 / 1,4 | 11,2 / 57,0 |
| 100 | 0,1 / 1,4 | 11,2 / 63,0 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
