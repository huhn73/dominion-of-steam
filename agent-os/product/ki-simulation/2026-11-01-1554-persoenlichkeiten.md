# KI-Simulation: persoenlichkeiten

Lauf vom 01.11.2026, 15:54, Modus `run`. 700 Partien gespielt, 28 Worker, Dauer 65 s.

Karten: medium (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 3 s | 64,5 | 40,6 | 17,3 | 4,0 |

## Matchup kessler-vs-normal

100 Partien, Median 56 Runden (Mittel 61,5). Spielende: Ausschaltung 86, Rundenlimit 14.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (aurelia, normal) | 52/100 | 52 % | 42–62 % | 1,48 | 40 (Median R54) | R6,6 (100/100) | 5,9 | 15,9 | 21 ms | 81 ms |
| **kessler** (aurelia, normal, kessler) | 48/100 | 48 % | 38–58 % | 1,52 | 46 (Median R52) | R6,6 (97/100) | 5,4 | 14,9 | 23 ms | 90 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 52 % · Sitz 2 48 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 24,0 | 74 % | 15,1 (11,0 erfolgreich) | 4,9 | 6,1 | 6,2 | 29,1 | 6,8 | 0,0 | 28,1 / 48,9 |
| kessler | 31,6 | 71 % | 14,4 (10,5 erfolgreich) | 4,4 | 6,2 | 6,1 | 26,5 | 11,9 | 0,0 | 27,1 / 49,2 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Blitzkorvette | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,4 | 0,5 | 18,2 | 5,7 | 13,8 | 3,5 | 0 |
| kessler | 0,3 | 0,4 | 13,9 | 8,3 | 12,2 | 3,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | kessler |
| --- | --- | --- |
| 10 | 2,1 / 1,2 | 2,0 / 1,1 |
| 20 | 3,3 / 2,6 | 3,0 / 2,6 |
| 30 | 4,5 / 4,1 | 4,2 / 4,1 |
| 40 | 5,4 / 6,4 | 5,0 / 6,1 |
| 50 | 6,1 / 8,8 | 5,1 / 7,5 |
| 60 | 6,0 / 11,0 | 5,2 / 9,1 |
| 70 | 6,0 / 12,8 | 5,2 / 10,6 |
| 80 | 6,0 / 14,0 | 5,3 / 12,0 |
| 90 | 5,9 / 14,9 | 5,3 / 13,4 |
| 100 | 5,9 / 15,9 | 5,4 / 14,9 |


## Matchup varenne-vs-normal

100 Partien, Median 59 Runden (Mittel 64,3). Spielende: Ausschaltung 83, Rundenlimit 17.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **varenne** (aurelia, normal, varenne) | 50/100 | 50 % | 40–60 % | 1,50 | 43 (Median R51) | R6,8 (100/100) | 5,9 | 21,4 | 17 ms | 61 ms |
| **referenz** (aurelia, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 40 (Median R58) | R6,8 (100/100) | 5,8 | 18,6 | 15 ms | 58 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 58 % · Sitz 2 42 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| varenne | 27,4 | 76 % | 16,1 (11,9 erfolgreich) | 5,0 | 6,9 | 7,0 | 27,2 | 8,9 | 0,0 | 20,4 / 43,6 |
| referenz | 27,1 | 76 % | 16,2 (11,7 erfolgreich) | 4,7 | 7,0 | 6,9 | 27,3 | 8,8 | 0,0 | 20,5 / 43,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Blitzkorvette | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- |
| varenne | 0,6 | 0,4 | 21,5 | 3,9 | 15,6 | 4,1 | 0 |
| referenz | 0,7 | 0,5 | 19,5 | 3,7 | 14,7 | 3,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | varenne | referenz |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,2 / 2,9 | 3,2 / 2,9 |
| 30 | 4,2 / 5,1 | 4,5 / 5,0 |
| 40 | 5,2 / 7,5 | 5,7 / 7,8 |
| 50 | 5,4 / 9,6 | 6,2 / 10,2 |
| 60 | 5,6 / 12,0 | 6,1 / 12,2 |
| 70 | 5,8 / 15,0 | 5,9 / 14,4 |
| 80 | 5,8 / 17,5 | 5,8 / 15,9 |
| 90 | 5,8 / 19,7 | 5,9 / 17,1 |
| 100 | 5,9 / 21,4 | 5,8 / 18,6 |


## Matchup brandt-vs-normal

100 Partien, Median 60 Runden (Mittel 65,5). Spielende: Ausschaltung 80, Rundenlimit 20.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **brandt** (eisenbund, normal, brandt) | 49/100 | 49 % | 39–59 % | 1,51 | 44 (Median R51) | R6,5 (100/100) | 5,6 | 26,6 | 21 ms | 82 ms |
| **referenz** (eisenbund, normal) | 51/100 | 51 % | 41–61 % | 1,49 | 36 (Median R57) | R6,9 (99/100) | 5,9 | 19,0 | 21 ms | 84 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 49 % · Sitz 2 51 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brandt | 24,2 | 74 % | 15,9 (11,2 erfolgreich) | 4,4 | 6,8 | 6,6 | 31,5 | 6,7 | 0,0 | 23,7 / 44,5 |
| referenz | 36,6 | 70 % | 16,1 (11,7 erfolgreich) | 5,1 | 6,6 | 6,8 | 29,3 | 14,0 | 0,0 | 22,9 / 46,6 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| brandt | 0,3 | 34,1 | 3,0 | 15,2 | 4,5 | 0 |
| referenz | 0,4 | 21,7 | 4,2 | 15,5 | 4,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | brandt | referenz |
| --- | --- | --- |
| 10 | 2,1 / 1,6 | 2,0 / 1,5 |
| 20 | 3,4 / 3,5 | 3,2 / 3,5 |
| 30 | 4,2 / 6,3 | 4,4 / 6,2 |
| 40 | 5,0 / 9,0 | 5,5 / 8,9 |
| 50 | 5,4 / 11,4 | 5,8 / 12,1 |
| 60 | 5,7 / 14,7 | 5,8 / 13,7 |
| 70 | 5,6 / 17,9 | 5,8 / 15,0 |
| 80 | 5,6 / 20,9 | 5,9 / 16,4 |
| 90 | 5,6 / 23,8 | 5,9 / 17,8 |
| 100 | 5,6 / 26,6 | 5,9 / 19,0 |


## Matchup eisenhart-vs-normal

100 Partien, Median 52 Runden (Mittel 59,3). Spielende: Ausschaltung 85, Rundenlimit 15.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenhart** (eisenbund, normal, eisenhart) | 50/100 | 50 % | 40–60 % | 1,50 | 44 (Median R54) | R6,6 (100/100) | 5,5 | 18,8 | 14 ms | 57 ms |
| **referenz** (eisenbund, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 41 (Median R47) | R7,1 (100/100) | 5,8 | 17,6 | 15 ms | 58 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 56 % · Sitz 2 44 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenhart | 30,0 | 70 % | 15,2 (11,3 erfolgreich) | 4,5 | 6,8 | 6,7 | 28,3 | 9,8 | 0,0 | 21,5 / 43,4 |
| referenz | 26,3 | 75 % | 15,9 (11,6 erfolgreich) | 4,9 | 6,7 | 6,8 | 28,0 | 8,1 | 0,0 | 21,4 / 44,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| eisenhart | 0,4 | 21,1 | 3,6 | 15,4 | 3,8 | 0 |
| referenz | 0,4 | 19,4 | 4,4 | 14,7 | 3,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenhart | referenz |
| --- | --- | --- |
| 10 | 2,1 / 1,5 | 2,0 / 1,5 |
| 20 | 3,4 / 3,1 | 3,3 / 3,2 |
| 30 | 4,6 / 5,8 | 4,4 / 5,3 |
| 40 | 5,5 / 8,4 | 5,1 / 7,1 |
| 50 | 5,9 / 10,8 | 5,4 / 9,7 |
| 60 | 5,7 / 12,7 | 5,6 / 12,8 |
| 70 | 5,7 / 14,4 | 5,7 / 14,4 |
| 80 | 5,7 / 15,9 | 5,7 / 16,1 |
| 90 | 5,6 / 17,4 | 5,8 / 16,9 |
| 100 | 5,5 / 18,8 | 5,8 / 17,6 |


## Matchup halvorsen-vs-normal

100 Partien, Median 59 Runden (Mittel 65,3). Spielende: Ausschaltung 82, Rundenlimit 18.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **halvorsen** (nordmark, normal, halvorsen) | 37/100 | 37 % | 28–47 % | 1,63 | 52 (Median R53) | R7,4 (99/100) | 4,3 | 14,7 | 13 ms | 48 ms |
| **referenz** (nordmark, normal) | 63/100 | 63 % | 53–72 % | 1,37 | 30 (Median R55) | R7,6 (100/100) | 7,3 | 27,9 | 16 ms | 60 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 45 % · Sitz 2 55 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| halvorsen | 25,7 | 73 % | 14,6 (10,5 erfolgreich) | 4,5 | 6,0 | 7,2 | 24,8 | 8,3 | 0,1 | 18,3 / 39,1 |
| referenz | 26,3 | 75 % | 16,9 (12,3 erfolgreich) | 5,0 | 7,2 | 6,0 | 27,3 | 7,4 | 0,0 | 19,0 / 42,2 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Doppeldecker | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Wolkenkreuzer | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| halvorsen | 1,1 | 0,4 | 16,2 | 3,9 | 11,1 | 1,7 | 3,4 | 0 |
| referenz | 0,0 | 0,5 | 25,8 | 4,5 | 17,5 | 0,0 | 4,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | halvorsen | referenz |
| --- | --- | --- |
| 10 | 1,9 / 1,2 | 1,9 / 1,2 |
| 20 | 3,1 / 2,9 | 3,2 / 3,0 |
| 30 | 4,1 / 4,8 | 4,8 / 5,8 |
| 40 | 4,7 / 6,1 | 6,2 / 8,7 |
| 50 | 4,7 / 6,9 | 6,7 / 11,6 |
| 60 | 4,4 / 8,5 | 7,2 / 15,2 |
| 70 | 4,4 / 10,3 | 7,2 / 18,9 |
| 80 | 4,4 / 12,1 | 7,2 / 22,3 |
| 90 | 4,3 / 13,4 | 7,2 / 25,2 |
| 100 | 4,3 / 14,7 | 7,3 / 27,9 |


## Matchup lindqvist-vs-normal

100 Partien, Median 57 Runden (Mittel 66,1). Spielende: Ausschaltung 78, Rundenlimit 22.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **lindqvist** (nordmark, normal, lindqvist) | 50/100 | 50 % | 40–60 % | 1,50 | 39 (Median R54) | R6,7 (100/100) | 5,8 | 22,0 | 15 ms | 57 ms |
| **referenz** (nordmark, normal) | 50/100 | 50 % | 40–60 % | 1,50 | 39 (Median R54) | R6,7 (100/100) | 5,8 | 22,0 | 14 ms | 55 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 52 % · Sitz 2 48 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| lindqvist | 27,6 | 75 % | 16,5 (12,1 erfolgreich) | 4,8 | 7,3 | 7,3 | 27,6 | 8,6 | 0,0 | 19,7 / 43,4 |
| referenz | 27,6 | 75 % | 16,5 (12,1 erfolgreich) | 4,8 | 7,3 | 7,3 | 27,6 | 8,6 | 0,0 | 19,7 / 43,4 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| lindqvist | 0,4 | 22,2 | 4,3 | 15,9 | 3,8 | 0 |
| referenz | 0,4 | 22,2 | 4,3 | 15,9 | 3,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | lindqvist | referenz |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,2 / 2,8 | 3,2 / 2,8 |
| 30 | 4,3 / 5,0 | 4,3 / 5,0 |
| 40 | 5,4 / 7,6 | 5,4 / 7,6 |
| 50 | 5,7 / 10,3 | 5,7 / 10,3 |
| 60 | 5,8 / 12,7 | 5,8 / 12,7 |
| 70 | 5,8 / 15,0 | 5,8 / 15,0 |
| 80 | 5,8 / 17,5 | 5,8 / 17,5 |
| 90 | 5,8 / 19,8 | 5,8 / 19,8 |
| 100 | 5,8 / 22,0 | 5,8 / 22,0 |


## Matchup ostrow-vs-normal

100 Partien, Median 70 Runden (Mittel 69,5). Spielende: Ausschaltung 86, Rundenlimit 14.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **referenz** (salzkueste, normal) | 63/100 | 63 % | 53–72 % | 1,37 | 31 (Median R72) | R6,7 (100/100) | 7,3 | 24,3 | 19 ms | 69 ms |
| **ostrow** (salzkueste, normal, ostrow) | 37/100 | 37 % | 28–47 % | 1,63 | 55 (Median R58) | R6,6 (99/100) | 4,4 | 17,5 | 17 ms | 69 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 49 % · Sitz 2 51 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| referenz | 39,0 | 64 % | 16,7 (10,9 erfolgreich) | 5,6 | 5,3 | 4,6 | 33,6 | 14,1 | 0,0 | 26,7 / 53,7 |
| ostrow | 24,4 | 71 % | 13,8 (8,7 erfolgreich) | 4,1 | 4,6 | 5,3 | 29,8 | 8,8 | 0,0 | 29,6 / 45,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| referenz | 0,5 | 26,8 | 5,2 | 19,1 | 4,7 | 0 |
| ostrow | 0,4 | 25,8 | 3,7 | 12,8 | 4,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | referenz | ostrow |
| --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,4 / 3,2 | 3,0 / 3,3 |
| 30 | 4,9 / 6,3 | 3,5 / 5,5 |
| 40 | 6,4 / 9,8 | 4,0 / 7,4 |
| 50 | 7,1 / 13,6 | 4,2 / 8,7 |
| 60 | 7,3 / 15,9 | 4,3 / 10,7 |
| 70 | 7,3 / 18,1 | 4,4 / 13,1 |
| 80 | 7,2 / 21,1 | 4,5 / 15,2 |
| 90 | 7,3 / 22,6 | 4,4 / 16,3 |
| 100 | 7,3 / 24,3 | 4,4 / 17,5 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
