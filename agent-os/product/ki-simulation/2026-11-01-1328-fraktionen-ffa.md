# KI-Simulation: fraktionen-ffa

Lauf vom 01.11.2026, 13:28, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 3 min 44 s.

Karten: large (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 30 s | 98,3 | 307,1 | 79,4 | 6,4 |

## Matchup ffa-4

200 Partien, Median 100 Runden (Mittel 98,3). Spielende: Rundenlimit 181, Ausschaltung 19.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 13/200 | 7 % | 4–11 % | 2,98 | 100 (Median R56) | R6,4 (199/200) | 1,8 | 11,0 | 58 ms | 236 ms |
| **nordmark** (nordmark, normal) | 17/200 | 9 % | 5–13 % | 2,95 | 104 (Median R63) | R6,6 (200/200) | 2,0 | 12,4 | 50 ms | 215 ms |
| **salzkueste** (salzkueste, normal) | 117/200 | 59 % | 52–65 % | 1,71 | 37 (Median R71) | R6,2 (200/200) | 14,2 | 81,3 | 94 ms | 380 ms |
| **eisenbund** (eisenbund, normal) | 53/200 | 27 % | 21–33 % | 2,36 | 65 (Median R63) | R5,8 (200/200) | 6,3 | 49,6 | 109 ms | 486 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 27 % · Sitz 2 22 % · Sitz 3 28 % · Sitz 4 24 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 38,4 | 74 % | 18,7 (13,1 erfolgreich) | 4,7 | 8,3 | 12,3 | 45,2 | 15,5 | 0,0 | 35,2 / 64,6 |
| nordmark | 37,5 | 73 % | 19,4 (13,2 erfolgreich) | 4,6 | 8,6 | 12,1 | 43,5 | 14,3 | 0,0 | 31,7 / 61,7 |
| salzkueste | 96,5 | 77 % | 31,6 (22,3 erfolgreich) | 5,5 | 16,8 | 9,1 | 69,7 | 52,4 | 0,0 | 79,2 / 105,9 |
| eisenbund | 59,3 | 74 % | 30,1 (20,8 erfolgreich) | 5,5 | 15,3 | 15,4 | 73,3 | 23,2 | 0,0 | 54,1 / 102,7 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| aurelia | 34,2 | 6,6 | 9,9 | 5,1 | 0 |
| nordmark | 34,2 | 6,0 | 10,2 | 4,8 | 0 |
| salzkueste | 92,4 | 13,5 | 36,9 | 7,3 | 0 |
| eisenbund | 76,4 | 9,2 | 26,7 | 8,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | nordmark | salzkueste | eisenbund |
| --- | --- | --- | --- | --- |
| 10 | 2,1 / 1,5 | 2,1 / 1,5 | 2,1 / 1,6 | 2,3 / 2,5 |
| 20 | 3,3 / 4,2 | 3,3 / 4,0 | 3,6 / 4,2 | 4,0 / 5,7 |
| 30 | 4,0 / 5,8 | 4,0 / 5,9 | 5,0 / 7,0 | 5,1 / 10,5 |
| 40 | 4,2 / 7,6 | 4,2 / 8,2 | 6,7 / 10,7 | 6,0 / 14,7 |
| 50 | 4,1 / 9,1 | 4,1 / 9,2 | 8,2 / 15,2 | 6,7 / 19,6 |
| 60 | 3,7 / 9,8 | 3,6 / 10,0 | 9,9 / 21,3 | 6,8 / 24,7 |
| 70 | 2,9 / 10,1 | 3,0 / 10,7 | 11,6 / 30,0 | 6,6 / 29,4 |
| 80 | 2,4 / 10,4 | 2,5 / 10,5 | 12,9 / 43,6 | 6,5 / 34,5 |
| 90 | 2,0 / 10,5 | 2,2 / 11,2 | 13,6 / 61,4 | 6,4 / 41,1 |
| 100 | 1,8 / 11,0 | 2,0 / 12,4 | 14,2 / 81,3 | 6,3 / 49,6 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
