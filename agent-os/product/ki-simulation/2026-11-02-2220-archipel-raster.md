# KI-Simulation: archipel-raster

Lauf vom 02.11.2026, 22:19, Modus `run`. 320 Partien gespielt, 32 Worker, Dauer 1 min 59 s.

Karten: medium-archipelago-30 (Welt archipelago, Land 30 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 40, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Vorherrschaft.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 12 s | 129,9 | 92,4 | 42,5 | 6,0 |

## Matchup basis

80 Partien, Median 140 Runden (Mittel 128,0). Spielende: Kapitulation 6, Vorherrschaft 40, Abbruch (Rundendeckel) 34.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenbund** (eisenbund, normal) | 20/80 | 25 % | 17–35 % | 1,57 | 3 (Median R91) | R12,8 (80/80) | 8,0 | 80,5 | 46 ms | 152 ms |
| **aurelia** (aurelia, normal) | 26/80 | 33 % | 23–43 % | 1,43 | 3 (Median R84) | R13,2 (80/80) | 8,0 | 71,8 | 45 ms | 145 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 30 % · Sitz 2 28 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 36,7 | 75 % | 12,6 (9,2 erfolgreich) | 7,0 | 2,2 | 2,1 | 37,9 | 18,5 | 3,6 | 48,9 / 67,6 |
| aurelia | 38,1 | 76 % | 12,7 (9,3 erfolgreich) | 7,1 | 2,1 | 2,2 | 37,0 | 19,6 | 3,0 | 49,3 / 67,0 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| eisenbund | 14,8 | 101,4 | 27,8 (27 %) | 4,8 |
| aurelia | 17,9 | 97,1 | 30,8 (32 %) | 4,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 5,2 | 64,1 | 6,4 | 40,5 | 5,8 | 0 |
| aurelia | 5,0 | 57,0 | 6,9 | 37,4 | 5,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenbund | aurelia |
| --- | --- | --- |
| 10 | 1,4 / 2,0 | 1,4 / 1,6 |
| 20 | 2,3 / 3,8 | 2,2 / 3,5 |
| 30 | 2,8 / 7,3 | 2,8 / 6,7 |
| 40 | 3,2 / 11,7 | 3,0 / 11,0 |
| 50 | 4,2 / 16,6 | 4,0 / 15,3 |
| 60 | 5,1 / 22,5 | 5,1 / 20,1 |
| 70 | 5,8 / 29,4 | 6,0 / 26,4 |
| 80 | 6,3 / 37,5 | 6,5 / 34,8 |
| 90 | 6,7 / 45,3 | 6,9 / 41,5 |
| 100 | 7,0 / 52,9 | 7,1 / 48,1 |
| 110 | 7,3 / 58,7 | 7,4 / 54,0 |
| 120 | 7,5 / 64,9 | 7,6 / 58,9 |
| 130 | 7,7 / 70,7 | 7,7 / 63,3 |
| 140 | 7,9 / 76,4 | 7,8 / 67,9 |
| 150 | 8,0 / 80,0 | 8,0 / 71,4 |
| 151 | 8,0 / 80,0 | 8,0 / 71,4 |


## Matchup depart2

80 Partien, Median 151 Runden (Mittel 132,7). Spielende: Abbruch (Rundendeckel) 41, Vorherrschaft 32, Kapitulation 7.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 22/80 | 28 % | 19–38 % | 1,44 | 3 (Median R127) | R13,2 (80/80) | 7,8 | 76,9 | 40 ms | 125 ms |
| **eisenbund** (eisenbund, normal) | 17/80 | 21 % | 14–31 % | 1,56 | 4 (Median R107) | R12,8 (80/80) | 8,1 | 84,7 | 40 ms | 128 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 26 % · Sitz 2 23 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 40,0 | 75 % | 13,6 (9,7 erfolgreich) | 7,1 | 2,6 | 2,8 | 39,4 | 20,4 | 3,4 | 52,7 / 72,5 |
| eisenbund | 40,2 | 74 % | 14,0 (9,8 erfolgreich) | 6,9 | 2,8 | 2,6 | 40,8 | 19,9 | 4,2 | 52,9 / 73,0 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 17,1 | 97,0 | 28,6 (30 %) | 4,9 |
| eisenbund | 14,0 | 99,8 | 24,8 (25 %) | 4,7 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 5,8 | 61,0 | 7,5 | 39,6 | 5,9 | 0 |
| eisenbund | 5,7 | 68,6 | 6,8 | 42,5 | 5,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,6 | 1,4 / 2,0 |
| 20 | 2,2 / 3,5 | 2,3 / 3,8 |
| 30 | 2,8 / 6,7 | 2,8 / 7,3 |
| 40 | 3,0 / 10,9 | 3,2 / 11,7 |
| 50 | 4,0 / 15,0 | 4,2 / 16,6 |
| 60 | 5,3 / 20,0 | 5,2 / 22,4 |
| 70 | 6,0 / 26,5 | 5,9 / 29,5 |
| 80 | 6,5 / 34,9 | 6,5 / 38,3 |
| 90 | 6,9 / 42,1 | 6,9 / 45,9 |
| 100 | 7,1 / 48,9 | 7,2 / 52,8 |
| 110 | 7,4 / 56,0 | 7,4 / 59,7 |
| 120 | 7,6 / 62,3 | 7,6 / 66,9 |
| 130 | 7,6 / 67,5 | 7,8 / 73,3 |
| 140 | 7,7 / 71,8 | 8,0 / 78,7 |
| 150 | 7,8 / 76,7 | 8,1 / 84,2 |
| 151 | 7,8 / 76,7 | 8,1 / 84,2 |


## Matchup scout2

80 Partien, Median 150 Runden (Mittel 132,3). Spielende: Vorherrschaft 35, Kapitulation 6, Abbruch (Rundendeckel) 39.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 20/80 | 25 % | 17–35 % | 1,51 | 4 (Median R88) | R13,2 (80/80) | 8,0 | 78,7 | 40 ms | 126 ms |
| **eisenbund** (eisenbund, normal) | 21/80 | 26 % | 18–37 % | 1,49 | 2 (Median R96) | R13,0 (80/80) | 8,3 | 86,7 | 41 ms | 132 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 21 % · Sitz 2 30 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 40,7 | 75 % | 13,6 (9,7 erfolgreich) | 7,4 | 2,3 | 2,6 | 40,3 | 20,8 | 2,8 | 53,9 / 72,8 |
| eisenbund | 40,6 | 74 % | 13,5 (9,7 erfolgreich) | 7,1 | 2,6 | 2,3 | 41,0 | 20,4 | 3,3 | 53,2 / 73,6 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 14,6 | 102,7 | 31,3 (30 %) | 5,0 |
| eisenbund | 16,0 | 105,5 | 25,2 (24 %) | 4,8 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 5,5 | 61,6 | 7,4 | 41,5 | 6,0 | 0 |
| eisenbund | 5,5 | 68,7 | 6,8 | 44,1 | 5,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,6 | 1,4 / 2,0 |
| 20 | 2,2 / 3,5 | 2,3 / 3,8 |
| 30 | 2,8 / 6,8 | 2,7 / 7,4 |
| 40 | 3,1 / 10,7 | 3,1 / 11,4 |
| 50 | 4,1 / 15,1 | 4,0 / 16,6 |
| 60 | 5,4 / 19,8 | 5,2 / 22,4 |
| 70 | 6,2 / 26,8 | 6,0 / 29,0 |
| 80 | 6,7 / 34,7 | 6,5 / 37,2 |
| 90 | 7,1 / 42,4 | 6,8 / 45,2 |
| 100 | 7,5 / 50,1 | 7,1 / 53,2 |
| 110 | 7,5 / 56,2 | 7,4 / 61,2 |
| 120 | 7,6 / 62,7 | 7,8 / 67,9 |
| 130 | 7,8 / 67,9 | 8,0 / 74,5 |
| 140 | 7,9 / 73,6 | 8,2 / 80,9 |
| 150 | 8,0 / 78,3 | 8,3 / 86,4 |
| 151 | 8,0 / 78,3 | 8,3 / 86,4 |


## Matchup trans3

80 Partien, Median 134 Runden (Mittel 126,5). Spielende: Vorherrschaft 41, Kapitulation 9, Abbruch (Rundendeckel) 30.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 28/80 | 35 % | 25–46 % | 1,44 | 4 (Median R132) | R13,0 (80/80) | 8,9 | 71,2 | 45 ms | 145 ms |
| **eisenbund** (eisenbund, normal) | 22/80 | 28 % | 19–38 % | 1,56 | 5 (Median R91) | R12,8 (80/80) | 8,2 | 72,8 | 44 ms | 143 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 29 % · Sitz 2 34 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 42,3 | 75 % | 15,1 (11,0 erfolgreich) | 7,9 | 3,1 | 3,0 | 41,9 | 20,9 | 3,0 | 55,5 / 76,2 |
| eisenbund | 42,5 | 73 % | 14,9 (10,4 erfolgreich) | 7,4 | 3,0 | 3,1 | 42,9 | 20,4 | 4,2 | 54,5 / 76,9 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 19,1 | 128,4 | 43,9 (34 %) | 5,6 |
| eisenbund | 17,2 | 134,8 | 35,6 (26 %) | 5,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 6,4 | 56,4 | 9,0 | 38,0 | 6,6 | 0 |
| eisenbund | 6,6 | 59,5 | 8,1 | 39,7 | 6,4 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | eisenbund |
| --- | --- | --- |
| 10 | 1,4 / 1,6 | 1,4 / 2,0 |
| 20 | 2,2 / 3,5 | 2,3 / 3,8 |
| 30 | 2,8 / 6,6 | 2,8 / 7,3 |
| 40 | 3,0 / 10,5 | 3,1 / 10,9 |
| 50 | 3,7 / 14,6 | 3,7 / 15,9 |
| 60 | 5,2 / 19,7 | 4,9 / 21,3 |
| 70 | 6,3 / 25,9 | 5,9 / 27,9 |
| 80 | 7,1 / 33,4 | 6,5 / 34,3 |
| 90 | 7,6 / 40,1 | 6,9 / 42,0 |
| 100 | 7,9 / 46,9 | 7,2 / 49,3 |
| 110 | 8,3 / 53,0 | 7,5 / 55,8 |
| 120 | 8,5 / 59,1 | 7,8 / 61,2 |
| 130 | 8,7 / 63,8 | 7,9 / 65,3 |
| 140 | 8,8 / 67,7 | 8,0 / 69,4 |
| 150 | 8,9 / 70,7 | 8,2 / 72,4 |
| 151 | 8,9 / 70,7 | 8,2 / 72,4 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
