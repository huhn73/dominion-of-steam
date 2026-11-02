# KI-Simulation: fraktionen-ffa

Lauf vom 01.11.2026, 15:50, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 3 min 53 s.

Karten: large (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 33 s | 94,4 | 350,3 | 92,9 | 6,0 |

## Matchup ffa-4

200 Partien, Median 100 Runden (Mittel 94,4). Spielende: Ausschaltung 79, Rundenlimit 121.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenbund** (eisenbund, normal) | 51/200 | 26 % | 20–32 % | 2,40 | 105 (Median R68) | R7,0 (200/200) | 6,6 | 24,1 | 100 ms | 446 ms |
| **aurelia** (aurelia, normal) | 59/200 | 30 % | 24–36 % | 2,46 | 108 (Median R67) | R6,8 (200/200) | 6,7 | 25,4 | 106 ms | 514 ms |
| **nordmark** (nordmark, normal) | 36/200 | 18 % | 13–24 % | 2,69 | 129 (Median R68) | R7,0 (200/200) | 4,4 | 15,8 | 76 ms | 343 ms |
| **salzkueste** (salzkueste, normal) | 54/200 | 27 % | 21–34 % | 2,46 | 106 (Median R67) | R6,8 (198/200) | 6,7 | 22,8 | 90 ms | 421 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 27 % · Sitz 2 25 % · Sitz 3 28 % · Sitz 4 20 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 57,2 | 72 % | 31,8 (21,9 erfolgreich) | 5,4 | 16,5 | 16,3 | 62,6 | 19,5 | 0,1 | 51,6 / 103,0 |
| aurelia | 62,2 | 77 % | 29,4 (20,2 erfolgreich) | 5,2 | 15,0 | 14,5 | 50,3 | 27,6 | 0,1 | 62,3 / 89,8 |
| nordmark | 47,7 | 71 % | 26,4 (17,8 erfolgreich) | 4,9 | 12,9 | 14,4 | 51,3 | 16,2 | 0,2 | 42,8 / 84,8 |
| salzkueste | 52,8 | 74 % | 28,1 (20,3 erfolgreich) | 4,9 | 15,3 | 14,5 | 55,8 | 19,1 | 0,3 | 48,5 / 92,0 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Blitzkorvette | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 0,0 | 3,5 | 37,2 | 10,0 | 24,6 | 6,2 | 0 |
| aurelia | 3,5 | 2,4 | 34,1 | 3,9 | 21,7 | 6,6 | 0 |
| nordmark | 0,0 | 2,9 | 27,7 | 8,2 | 18,9 | 5,3 | 0 |
| salzkueste | 0,0 | 3,3 | 34,3 | 8,8 | 22,0 | 5,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenbund | aurelia | nordmark | salzkueste |
| --- | --- | --- | --- | --- |
| 10 | 2,0 / 1,6 | 2,0 / 1,2 | 2,0 / 1,2 | 2,0 / 1,2 |
| 20 | 3,3 / 3,5 | 3,2 / 2,9 | 3,1 / 2,9 | 3,2 / 2,8 |
| 30 | 4,4 / 5,4 | 4,1 / 4,4 | 4,2 / 4,8 | 4,3 / 4,8 |
| 40 | 5,3 / 7,5 | 4,9 / 5,8 | 4,9 / 6,7 | 5,0 / 6,6 |
| 50 | 6,0 / 10,5 | 5,4 / 8,4 | 5,1 / 8,0 | 5,6 / 8,7 |
| 60 | 6,6 / 13,1 | 5,8 / 11,5 | 4,9 / 9,2 | 6,0 / 10,9 |
| 70 | 6,7 / 15,5 | 6,1 / 14,3 | 4,7 / 10,3 | 6,4 / 13,1 |
| 80 | 6,8 / 18,1 | 6,3 / 17,7 | 4,7 / 11,8 | 6,4 / 16,1 |
| 90 | 6,8 / 21,3 | 6,5 / 22,3 | 4,5 / 13,6 | 6,5 / 19,2 |
| 100 | 6,6 / 24,1 | 6,7 / 25,4 | 4,4 / 15,8 | 6,7 / 22,8 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
