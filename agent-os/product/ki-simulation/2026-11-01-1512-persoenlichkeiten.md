# KI-Simulation: persoenlichkeiten

Lauf vom 01.11.2026, 15:12, Modus `run`. 700 Partien gespielt, 28 Worker, Dauer 45 s.

Karten: medium (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 2 s | 72,3 | 24,2 | 10,4 | 3,7 |

## Matchup kessler-vs-normal

100 Partien, Median 68 Runden (Mittel 71,6). Spielende: Ausschaltung 65, Rundenlimit 35.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (aurelia, normal) | 52/100 | 52 % | 42–62 % | 1,48 | 29 (Median R52) | R6,6 (100/100) | 6,0 | 29,3 | 10 ms | 36 ms |
| **kessler** (aurelia, normal, kessler) | 48/100 | 48 % | 38–58 % | 1,52 | 36 (Median R53) | R6,6 (97/100) | 5,5 | 26,7 | 10 ms | 37 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 54 % · Sitz 2 46 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 23,1 | 75 % | 14,9 (11,2 erfolgreich) | 5,1 | 6,1 | 6,2 | 29,4 | 6,3 | 0,0 | 25,6 / 46,2 |
| kessler | 32,2 | 72 % | 13,9 (10,6 erfolgreich) | 4,4 | 6,2 | 6,1 | 26,0 | 12,5 | 0,0 | 24,7 / 46,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,5 | 27,8 | 4,6 | 19,5 | 3,3 | 0 |
| kessler | 0,2 | 20,4 | 7,3 | 18,0 | 3,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | kessler |
| --- | --- | --- |
| 10 | 2,1 / 1,2 | 2,0 / 1,1 |
| 20 | 3,4 / 2,7 | 2,9 / 2,7 |
| 30 | 4,5 / 4,8 | 4,2 / 4,3 |
| 40 | 5,7 / 7,5 | 4,9 / 6,7 |
| 50 | 6,1 / 10,4 | 5,3 / 9,6 |
| 60 | 6,0 / 14,1 | 5,4 / 12,9 |
| 70 | 6,1 / 18,6 | 5,3 / 15,9 |
| 80 | 6,0 / 22,5 | 5,4 / 19,5 |
| 90 | 6,1 / 26,3 | 5,4 / 22,8 |
| 100 | 6,0 / 29,3 | 5,5 / 26,7 |


## Matchup varenne-vs-normal

100 Partien, Median 69 Runden (Mittel 73,1). Spielende: Ausschaltung 64, Rundenlimit 36.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **varenne** (aurelia, normal, varenne) | 42/100 | 42 % | 33–52 % | 1,58 | 37 (Median R53) | R6,8 (100/100) | 4,9 | 24,9 | 9 ms | 34 ms |
| **referenz** (aurelia, normal) | 58/100 | 58 % | 48–67 % | 1,42 | 27 (Median R56) | R6,8 (100/100) | 6,9 | 36,0 | 9 ms | 30 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 56 % · Sitz 2 44 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| varenne | 27,4 | 74 % | 15,7 (11,5 erfolgreich) | 4,9 | 6,6 | 7,6 | 27,2 | 8,9 | 0,1 | 19,3 / 41,8 |
| referenz | 28,2 | 75 % | 17,0 (12,5 erfolgreich) | 4,9 | 7,6 | 6,6 | 28,4 | 8,7 | 0,0 | 19,4 / 43,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| varenne | 0,3 | 24,8 | 3,5 | 17,2 | 3,4 | 0 |
| referenz | 0,4 | 31,7 | 3,7 | 21,8 | 3,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | varenne | referenz |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,1 / 2,9 | 3,2 / 2,9 |
| 30 | 4,3 / 5,2 | 4,6 / 5,2 |
| 40 | 4,9 / 7,3 | 6,1 / 8,6 |
| 50 | 5,0 / 10,2 | 6,7 / 12,1 |
| 60 | 5,0 / 13,3 | 6,8 / 17,1 |
| 70 | 5,0 / 16,3 | 6,8 / 22,3 |
| 80 | 5,0 / 19,2 | 6,8 / 27,0 |
| 90 | 4,9 / 22,1 | 6,9 / 31,7 |
| 100 | 4,9 / 24,9 | 6,9 / 36,0 |


## Matchup brandt-vs-normal

100 Partien, Median 68 Runden (Mittel 70,4). Spielende: Ausschaltung 64, Rundenlimit 36.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (eisenbund, normal) | 48/100 | 48 % | 38–58 % | 1,52 | 26 (Median R51) | R6,7 (100/100) | 5,5 | 27,9 | 14 ms | 54 ms |
| **brandt** (eisenbund, normal, brandt) | 52/100 | 52 % | 42–62 % | 1,48 | 38 (Median R51) | R6,7 (99/100) | 6,0 | 49,0 | 18 ms | 70 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 56 % · Sitz 2 44 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 38,6 | 71 % | 15,9 (11,5 erfolgreich) | 5,1 | 6,4 | 7,0 | 30,6 | 15,8 | 0,1 | 25,2 / 46,8 |
| brandt | 25,5 | 75 % | 15,9 (11,4 erfolgreich) | 4,4 | 7,0 | 6,4 | 33,5 | 7,7 | 0,1 | 24,1 / 46,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,5 | 29,2 | 3,3 | 19,1 | 4,2 | 0 |
| brandt | 0,6 | 51,1 | 2,6 | 22,7 | 5,0 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | brandt |
| --- | --- | --- |
| 10 | 2,1 / 1,7 | 2,2 / 1,8 |
| 20 | 3,3 / 3,8 | 3,5 / 4,2 |
| 30 | 4,6 / 6,5 | 4,5 / 7,8 |
| 40 | 5,3 / 10,4 | 5,5 / 11,7 |
| 50 | 5,5 / 14,1 | 5,7 / 16,4 |
| 60 | 5,4 / 17,1 | 6,0 / 22,5 |
| 70 | 5,4 / 20,3 | 6,0 / 29,3 |
| 80 | 5,5 / 23,6 | 5,9 / 35,9 |
| 90 | 5,5 / 25,7 | 5,9 / 42,2 |
| 100 | 5,5 / 27,9 | 6,0 / 49,0 |


## Matchup eisenhart-vs-normal

100 Partien, Median 58 Runden (Mittel 65,8). Spielende: Ausschaltung 71, Rundenlimit 29.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (eisenbund, normal) | 42/100 | 42 % | 33–52 % | 1,58 | 39 (Median R49) | R6,6 (99/100) | 5,0 | 23,9 | 9 ms | 34 ms |
| **eisenhart** (eisenbund, normal, eisenhart) | 58/100 | 58 % | 48–67 % | 1,42 | 32 (Median R46) | R6,7 (99/100) | 6,6 | 39,5 | 12 ms | 46 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 58 % · Sitz 2 42 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 27,0 | 74 % | 16,3 (11,7 erfolgreich) | 5,1 | 6,7 | 7,7 | 30,9 | 8,2 | 0,1 | 22,7 / 47,2 |
| eisenhart | 34,7 | 70 % | 16,8 (12,3 erfolgreich) | 4,5 | 7,7 | 6,7 | 30,8 | 12,1 | 0,1 | 23,9 / 47,0 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,6 | 26,0 | 3,5 | 17,9 | 3,6 | 0 |
| eisenhart | 0,6 | 36,1 | 3,2 | 23,4 | 4,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | eisenhart |
| --- | --- | --- |
| 10 | 2,1 / 1,6 | 2,2 / 1,8 |
| 20 | 3,3 / 3,5 | 3,5 / 3,5 |
| 30 | 4,6 / 5,9 | 4,8 / 6,7 |
| 40 | 5,2 / 8,7 | 5,9 / 10,4 |
| 50 | 5,3 / 11,0 | 6,2 / 14,7 |
| 60 | 5,1 / 13,4 | 6,4 / 19,4 |
| 70 | 5,1 / 16,0 | 6,5 / 24,3 |
| 80 | 5,1 / 18,6 | 6,5 / 29,4 |
| 90 | 5,0 / 21,2 | 6,6 / 34,5 |
| 100 | 5,0 / 23,9 | 6,6 / 39,5 |


## Matchup halvorsen-vs-normal

100 Partien, Median 61 Runden (Mittel 68,5). Spielende: Ausschaltung 70, Rundenlimit 30.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (nordmark, normal) | 75/100 | 75 % | 66–82 % | 1,25 | 17 (Median R60) | R7,4 (100/100) | 8,5 | 36,1 | 8 ms | 27 ms |
| **halvorsen** (nordmark, normal, halvorsen) | 25/100 | 25 % | 18–34 % | 1,75 | 53 (Median R49) | R8,0 (100/100) | 3,1 | 8,8 | 6 ms | 21 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 53 % · Sitz 2 47 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 26,3 | 74 % | 17,7 (12,7 erfolgreich) | 6,0 | 6,7 | 5,1 | 29,4 | 6,7 | 0,0 | 17,4 / 44,0 |
| halvorsen | 25,4 | 73 % | 12,1 (8,8 erfolgreich) | 3,6 | 5,1 | 6,7 | 22,3 | 9,8 | 0,3 | 18,8 / 34,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Doppeldecker | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Wolkenkreuzer | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,0 | 0,5 | 33,1 | 3,6 | 21,2 | 0,0 | 0,0 | 3,7 | 0 |
| halvorsen | 2,7 | 0,2 | 8,9 | 2,1 | 8,0 | 1,3 | 3,1 | 2,7 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | halvorsen |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 1,9 / 1,2 |
| 20 | 3,3 / 3,0 | 2,8 / 2,4 |
| 30 | 5,2 / 5,9 | 3,4 / 3,6 |
| 40 | 7,1 / 9,7 | 3,4 / 4,4 |
| 50 | 7,9 / 13,8 | 3,4 / 4,7 |
| 60 | 8,5 / 18,2 | 3,1 / 5,2 |
| 70 | 8,5 / 22,8 | 3,1 / 6,0 |
| 80 | 8,5 / 27,6 | 3,0 / 6,8 |
| 90 | 8,5 / 31,8 | 3,1 / 7,8 |
| 100 | 8,5 / 36,1 | 3,1 / 8,8 |


## Matchup lindqvist-vs-normal

100 Partien, Median 99 Runden (Mittel 78,0). Spielende: Ausschaltung 52, Rundenlimit 48.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **lindqvist** (nordmark, normal, lindqvist) | 50/100 | 50 % | 40–60 % | 1,50 | 26 (Median R55) | R6,8 (100/100) | 5,9 | 34,0 | 9 ms | 31 ms |
| **referenz** (nordmark, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 26 (Median R55) | R6,8 (100/100) | 5,9 | 34,0 | 9 ms | 32 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 50 % · Sitz 2 50 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lindqvist | 29,8 | 74 % | 18,1 (13,1 erfolgreich) | 4,9 | 8,3 | 8,3 | 29,8 | 9,0 | 0,0 | 19,7 / 44,9 |
| referenz | 29,8 | 74 % | 18,1 (13,1 erfolgreich) | 4,9 | 8,3 | 8,3 | 29,8 | 9,0 | 0,0 | 19,7 / 44,9 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| lindqvist | 0,4 | 32,1 | 3,4 | 21,1 | 3,5 | 0 |
| referenz | 0,4 | 32,1 | 3,4 | 21,1 | 3,5 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | lindqvist | referenz |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,2 / 3,0 | 3,2 / 3,0 |
| 30 | 4,5 / 5,0 | 4,5 / 5,0 |
| 40 | 5,4 / 7,6 | 5,4 / 7,6 |
| 50 | 5,8 / 10,6 | 5,8 / 10,6 |
| 60 | 5,8 / 15,1 | 5,8 / 15,1 |
| 70 | 5,9 / 19,7 | 5,9 / 19,7 |
| 80 | 5,9 / 24,3 | 5,9 / 24,3 |
| 90 | 5,9 / 29,6 | 5,9 / 29,6 |
| 100 | 5,9 / 34,0 | 5,9 / 34,0 |


## Matchup ostrow-vs-normal

100 Partien, Median 82 Runden (Mittel 79,1). Spielende: Ausschaltung 54, Rundenlimit 46.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (salzkueste, normal) | 62/100 | 62 % | 52–71 % | 1,38 | 18 (Median R70) | R6,8 (100/100) | 7,3 | 36,3 | 11 ms | 38 ms |
| **ostrow** (salzkueste, normal, ostrow) | 38/100 | 38 % | 29–48 % | 1,62 | 36 (Median R58) | R6,9 (100/100) | 4,3 | 23,8 | 11 ms | 44 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 54 % · Sitz 2 46 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 42,4 | 65 % | 18,1 (11,8 erfolgreich) | 5,8 | 6,0 | 5,5 | 34,8 | 15,7 | 0,0 | 27,8 / 53,7 |
| ostrow | 25,2 | 69 % | 14,9 (9,3 erfolgreich) | 3,9 | 5,5 | 6,0 | 32,9 | 8,1 | 0,0 | 27,6 / 48,0 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,3 | 35,5 | 4,0 | 24,7 | 4,3 | 0 |
| ostrow | 0,4 | 32,5 | 3,3 | 15,6 | 4,0 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | ostrow |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,4 / 3,3 | 3,1 / 3,4 |
| 30 | 4,9 / 6,1 | 3,6 / 5,8 |
| 40 | 6,2 / 9,6 | 4,3 / 7,6 |
| 50 | 7,1 / 13,8 | 4,3 / 9,0 |
| 60 | 7,2 / 18,2 | 4,4 / 11,1 |
| 70 | 7,3 / 22,2 | 4,4 / 14,2 |
| 80 | 7,3 / 26,4 | 4,4 / 17,2 |
| 90 | 7,3 / 31,2 | 4,3 / 20,5 |
| 100 | 7,3 / 36,3 | 4,3 / 23,8 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
