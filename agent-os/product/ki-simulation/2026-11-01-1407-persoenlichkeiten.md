# KI-Simulation: persoenlichkeiten

Lauf vom 01.11.2026, 14:07, Modus `run`. 700 Partien gespielt, 28 Worker, Dauer 2 min 6 s.

Karten: medium (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 5 s | 81,6 | 57,6 | 26,9 | 5,5 |

## Matchup kessler-vs-normal

100 Partien, Median 100 Runden (Mittel 79,5). Spielende: Ausschaltung 46, Rundenlimit 54.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (aurelia, normal) | 53/100 | 53 % | 43–62 % | 1,47 | 23 (Median R51) | R6,6 (100/100) | 6,0 | 37,5 | 8 ms | 28 ms |
| **kessler** (aurelia, normal, kessler) | 47/100 | 47 % | 38–57 % | 1,53 | 23 (Median R51) | R6,6 (97/100) | 5,7 | 30,9 | 8 ms | 28 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 47 % · Sitz 2 53 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 26,0 | 76 % | 15,2 (11,5 erfolgreich) | 5,2 | 6,3 | 6,5 | 31,6 | 8,2 | 0,0 | 29,3 / 50,2 |
| kessler | 34,8 | 71 % | 14,7 (11,0 erfolgreich) | 4,5 | 6,5 | 6,3 | 29,1 | 13,8 | 0,0 | 28,3 / 51,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| referenz | 33,5 | 4,9 | 24,1 | 3,2 | 0 |
| kessler | 24,7 | 8,3 | 19,9 | 3,1 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | kessler |
| --- | --- | --- |
| 10 | 2,0 / 1,1 | 2,0 / 1,1 |
| 20 | 3,4 / 2,7 | 3,1 / 2,7 |
| 30 | 4,4 / 4,9 | 4,4 / 4,5 |
| 40 | 5,6 / 7,1 | 5,2 / 7,1 |
| 50 | 6,0 / 10,8 | 5,6 / 10,6 |
| 60 | 6,0 / 15,4 | 5,7 / 13,8 |
| 70 | 6,0 / 21,3 | 5,7 / 17,5 |
| 80 | 6,0 / 27,1 | 5,7 / 22,5 |
| 90 | 5,9 / 32,5 | 5,8 / 27,0 |
| 100 | 6,0 / 37,5 | 5,7 / 30,9 |


## Matchup varenne-vs-normal

100 Partien, Median 100 Runden (Mittel 83,1). Spielende: Ausschaltung 42, Rundenlimit 58.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **varenne** (aurelia, normal, varenne) | 49/100 | 49 % | 39–59 % | 1,51 | 22 (Median R49) | R6,8 (100/100) | 5,6 | 37,5 | 9 ms | 31 ms |
| **referenz** (aurelia, normal) | 51/100 | 51 % | 41–61 % | 1,49 | 20 (Median R60) | R6,8 (100/100) | 6,2 | 38,6 | 8 ms | 27 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 51 % · Sitz 2 49 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| varenne | 31,5 | 76 % | 17,6 (13,1 erfolgreich) | 5,1 | 8,0 | 8,5 | 31,3 | 11,0 | 0,0 | 22,8 / 46,9 |
| referenz | 31,8 | 75 % | 18,1 (13,2 erfolgreich) | 4,7 | 8,5 | 8,0 | 32,1 | 10,7 | 0,0 | 21,9 / 48,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| varenne | 34,6 | 3,9 | 23,4 | 3,6 | 0 |
| referenz | 35,6 | 4,1 | 24,0 | 3,5 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | varenne | referenz |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,2 / 2,9 | 3,3 / 2,9 |
| 30 | 4,6 / 5,4 | 4,7 / 5,3 |
| 40 | 5,3 / 8,5 | 6,0 / 8,5 |
| 50 | 5,7 / 11,6 | 6,1 / 11,9 |
| 60 | 5,6 / 16,3 | 6,1 / 16,8 |
| 70 | 5,6 / 21,8 | 6,2 / 22,0 |
| 80 | 5,6 / 27,1 | 6,2 / 27,7 |
| 90 | 5,6 / 32,6 | 6,2 / 33,0 |
| 100 | 5,6 / 37,5 | 6,2 / 38,6 |


## Matchup brandt-vs-normal

100 Partien, Median 100 Runden (Mittel 83,6). Spielende: Ausschaltung 34, Rundenlimit 66.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **brandt** (eisenbund, normal, brandt) | 31/100 | 31 % | 23–41 % | 1,69 | 18 (Median R43) | R10,1 (100/100) | 4,6 | 25,6 | 16 ms | 62 ms |
| **referenz** (eisenbund, normal) | 69/100 | 69 % | 59–77 % | 1,31 | 16 (Median R57) | R6,8 (100/100) | 7,2 | 68,9 | 174 ms | 1,1 s |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 41 % · Sitz 2 59 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brandt | 36,1 | 80 % | 11,9 (8,7 erfolgreich) | 3,3 | 5,5 | 5,2 | 36,0 | 20,0 | 0,0 | 38,1 / 54,7 |
| referenz | 41,7 | 75 % | 15,9 (11,6 erfolgreich) | 6,5 | 5,2 | 5,5 | 41,9 | 19,8 | 0,0 | 36,6 / 61,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| brandt | 30,8 | 3,7 | 21,1 | 3,9 | 0 |
| referenz | 59,8 | 4,6 | 39,3 | 19,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | brandt | referenz |
| --- | --- | --- |
| 10 | 1,7 / 2,4 | 2,2 / 1,7 |
| 20 | 2,7 / 3,8 | 3,7 / 4,1 |
| 30 | 3,6 / 6,1 | 5,7 / 9,0 |
| 40 | 4,0 / 7,5 | 7,3 / 15,2 |
| 50 | 4,0 / 8,9 | 7,7 / 22,7 |
| 60 | 4,2 / 11,8 | 7,6 / 31,8 |
| 70 | 4,3 / 14,9 | 7,4 / 41,4 |
| 80 | 4,4 / 18,5 | 7,3 / 51,3 |
| 90 | 4,6 / 22,4 | 7,2 / 60,4 |
| 100 | 4,6 / 25,6 | 7,2 / 68,9 |


## Matchup eisenhart-vs-normal

100 Partien, Median 64 Runden (Mittel 70,6). Spielende: Ausschaltung 55, Rundenlimit 45.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenhart** (eisenbund, normal, eisenhart) | 55/100 | 55 % | 45–64 % | 1,45 | 27 (Median R46) | R6,6 (99/100) | 6,1 | 43,8 | 10 ms | 34 ms |
| **referenz** (eisenbund, normal) | 45/100 | 45 % | 36–55 % | 1,55 | 28 (Median R49) | R6,8 (99/100) | 5,3 | 32,1 | 9 ms | 34 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 59 % · Sitz 2 41 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenhart | 35,3 | 70 % | 16,8 (12,1 erfolgreich) | 4,7 | 7,4 | 7,0 | 33,0 | 12,6 | 0,0 | 25,3 / 49,4 |
| referenz | 29,7 | 75 % | 16,4 (11,8 erfolgreich) | 4,8 | 7,0 | 7,4 | 31,9 | 10,4 | 0,0 | 24,9 / 48,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| eisenhart | 39,8 | 3,6 | 26,0 | 4,1 | 0 |
| referenz | 32,2 | 4,2 | 20,8 | 3,7 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenhart | referenz |
| --- | --- | --- |
| 10 | 2,2 / 1,8 | 2,1 / 1,6 |
| 20 | 3,7 / 3,7 | 3,2 / 3,6 |
| 30 | 4,9 / 7,3 | 4,8 / 6,4 |
| 40 | 5,8 / 10,4 | 5,4 / 9,1 |
| 50 | 6,0 / 15,7 | 5,4 / 12,5 |
| 60 | 6,0 / 21,3 | 5,5 / 16,4 |
| 70 | 6,1 / 26,4 | 5,4 / 20,8 |
| 80 | 6,1 / 32,6 | 5,4 / 24,5 |
| 90 | 6,1 / 38,2 | 5,4 / 28,2 |
| 100 | 6,1 / 43,8 | 5,3 / 32,1 |


## Matchup halvorsen-vs-normal

100 Partien, Median 81 Runden (Mittel 76,4). Spielende: Ausschaltung 55, Rundenlimit 45.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **halvorsen** (nordmark, normal, halvorsen) | 41/100 | 41 % | 32–51 % | 1,59 | 30 (Median R54) | R7,1 (99/100) | 5,1 | 21,0 | 6 ms | 20 ms |
| **referenz** (nordmark, normal) | 59/100 | 59 % | 49–68 % | 1,41 | 25 (Median R54) | R6,5 (99/100) | 6,4 | 38,5 | 8 ms | 26 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 45 % · Sitz 2 55 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| halvorsen | 29,2 | 76 % | 14,9 (11,0 erfolgreich) | 4,3 | 6,7 | 6,9 | 25,8 | 11,2 | 0,1 | 21,8 / 40,8 |
| referenz | 26,6 | 75 % | 16,5 (12,1 erfolgreich) | 5,2 | 6,9 | 6,7 | 30,0 | 7,7 | 0,0 | 19,3 / 45,4 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Wolkenkreuzer | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| halvorsen | 17,6 | 2,9 | 15,7 | 4,6 | 3,0 | 0 |
| referenz | 35,0 | 3,7 | 23,2 | 0,0 | 3,5 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | halvorsen | referenz |
| --- | --- | --- |
| 10 | 2,0 / 1,0 | 2,0 / 1,1 |
| 20 | 3,1 / 2,5 | 3,4 / 2,9 |
| 30 | 4,1 / 4,0 | 4,7 / 5,4 |
| 40 | 4,7 / 5,5 | 6,0 / 8,0 |
| 50 | 5,0 / 7,6 | 6,3 / 11,8 |
| 60 | 5,0 / 10,4 | 6,4 / 17,2 |
| 70 | 5,1 / 13,1 | 6,4 / 22,9 |
| 80 | 5,0 / 15,9 | 6,4 / 28,4 |
| 90 | 5,1 / 18,5 | 6,4 / 33,2 |
| 100 | 5,1 / 21,0 | 6,4 / 38,5 |


## Matchup lindqvist-vs-normal

100 Partien, Median 100 Runden (Mittel 88,1). Spielende: Ausschaltung 28, Rundenlimit 72.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (nordmark, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 14 (Median R58) | R6,8 (100/100) | 5,9 | 38,9 | 9 ms | 32 ms |
| **lindqvist** (nordmark, normal, lindqvist) | 50/100 | 50 % | 40–60 % | 1,50 | 14 (Median R58) | R6,8 (100/100) | 5,9 | 38,9 | 9 ms | 31 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 44 % · Sitz 2 56 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 36,1 | 75 % | 19,1 (14,2 erfolgreich) | 4,9 | 9,3 | 9,3 | 36,1 | 13,0 | 0,0 | 27,5 / 54,3 |
| lindqvist | 36,1 | 75 % | 19,1 (14,2 erfolgreich) | 4,9 | 9,3 | 9,3 | 36,1 | 13,0 | 0,0 | 27,5 / 54,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| referenz | 38,3 | 3,9 | 25,5 | 3,6 | 0 |
| lindqvist | 38,3 | 3,9 | 25,5 | 3,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | lindqvist |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,3 / 2,9 | 3,3 / 2,9 |
| 30 | 4,7 / 5,4 | 4,7 / 5,4 |
| 40 | 5,6 / 8,0 | 5,6 / 8,0 |
| 50 | 5,9 / 11,8 | 5,9 / 11,8 |
| 60 | 5,9 / 17,2 | 5,9 / 17,2 |
| 70 | 5,9 / 22,8 | 5,9 / 22,8 |
| 80 | 5,9 / 28,3 | 5,9 / 28,3 |
| 90 | 5,9 / 33,4 | 5,9 / 33,4 |
| 100 | 5,9 / 38,9 | 5,9 / 38,9 |


## Matchup ostrow-vs-normal

100 Partien, Median 100 Runden (Mittel 90,3). Spielende: Ausschaltung 21, Rundenlimit 79.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (salzkueste, normal) | 70/100 | 70 % | 60–78 % | 1,30 | 4 (Median R82) | R7,1 (100/100) | 7,5 | 54,6 | 77 ms | 498 ms |
| **ostrow** (salzkueste, normal, ostrow) | 30/100 | 30 % | 22–40 % | 1,70 | 17 (Median R47) | R12,2 (96/100) | 4,1 | 18,8 | 12 ms | 46 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 50 % · Sitz 2 50 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 40,3 | 71 % | 17,6 (11,4 erfolgreich) | 6,8 | 4,7 | 4,9 | 41,9 | 17,0 | 0,0 | 33,8 / 62,4 |
| ostrow | 35,1 | 75 % | 12,5 (7,8 erfolgreich) | 2,9 | 4,9 | 4,7 | 33,5 | 18,6 | 0,0 | 36,4 / 52,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| referenz | 50,7 | 4,6 | 34,2 | 13,1 | 0 |
| ostrow | 24,6 | 4,6 | 17,8 | 3,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | ostrow |
| --- | --- | --- |
| 10 | 2,0 / 1,3 | 1,5 / 1,7 |
| 20 | 3,4 / 3,1 | 2,2 / 3,1 |
| 30 | 5,2 / 6,3 | 2,9 / 4,5 |
| 40 | 7,1 / 11,2 | 3,3 / 5,7 |
| 50 | 8,3 / 17,8 | 3,1 / 6,1 |
| 60 | 8,3 / 25,0 | 3,3 / 6,7 |
| 70 | 8,0 / 32,2 | 3,6 / 8,3 |
| 80 | 7,8 / 39,4 | 3,8 / 10,9 |
| 90 | 7,6 / 47,2 | 4,0 / 14,4 |
| 100 | 7,5 / 54,6 | 4,1 / 18,8 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
