# KI-Simulation: fraktionen-ffa

Lauf vom 01.11.2026, 15:39, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 2 min 16 s.

Karten: large (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 19 s | 97,5 | 191,8 | 47,8 | 5,3 |

## Matchup ffa-4

200 Partien, Median 100 Runden (Mittel 97,5). Spielende: Ausschaltung 41, Rundenlimit 159.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, normal) | 44/200 | 22 % | 17–28 % | 2,67 | 103 (Median R68) | R6,8 (200/200) | 5,4 | 24,0 | 44 ms | 194 ms |
| **nordmark** (nordmark, normal) | 44/200 | 22 % | 17–28 % | 2,54 | 99 (Median R70) | R7,0 (199/200) | 5,3 | 23,9 | 42 ms | 190 ms |
| **salzkueste** (salzkueste, normal) | 54/200 | 27 % | 21–34 % | 2,42 | 84 (Median R69) | R6,7 (198/200) | 6,6 | 31,6 | 49 ms | 208 ms |
| **eisenbund** (eisenbund, normal) | 58/200 | 29 % | 23–36 % | 2,37 | 73 (Median R66) | R7,0 (200/200) | 7,3 | 41,2 | 56 ms | 245 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 30 % · Sitz 2 27 % · Sitz 3 28 % · Sitz 4 15 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 49,8 | 71 % | 30,1 (20,3 erfolgreich) | 5,1 | 15,3 | 16,0 | 50,0 | 15,2 | 0,2 | 33,8 / 75,7 |
| nordmark | 51,1 | 71 % | 30,2 (20,2 erfolgreich) | 5,0 | 15,2 | 15,8 | 51,3 | 16,3 | 0,1 | 36,2 / 78,2 |
| salzkueste | 52,5 | 74 % | 30,5 (21,8 erfolgreich) | 5,1 | 16,8 | 16,2 | 52,4 | 16,8 | 0,1 | 37,0 / 80,2 |
| eisenbund | 59,1 | 71 % | 35,0 (23,3 erfolgreich) | 5,4 | 17,8 | 17,0 | 58,8 | 18,5 | 0,3 | 40,6 / 89,9 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| aurelia | 2,1 | 36,0 | 3,6 | 22,5 | 5,1 | 0 |
| nordmark | 2,3 | 36,2 | 3,7 | 23,2 | 4,9 | 0 |
| salzkueste | 2,6 | 41,1 | 3,8 | 25,9 | 5,4 | 0 |
| eisenbund | 3,0 | 49,4 | 3,9 | 32,0 | 5,9 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | nordmark | salzkueste | eisenbund |
| --- | --- | --- | --- | --- |
| 10 | 2,0 / 1,2 | 2,0 / 1,2 | 2,0 / 1,2 | 2,0 / 1,6 |
| 20 | 3,2 / 2,9 | 3,2 / 2,9 | 3,2 / 2,8 | 3,3 / 3,4 |
| 30 | 4,2 / 4,3 | 4,1 / 4,5 | 4,3 / 4,6 | 4,6 / 5,1 |
| 40 | 4,7 / 6,1 | 5,1 / 6,3 | 5,1 / 6,6 | 5,7 / 8,0 |
| 50 | 5,0 / 7,5 | 5,5 / 8,3 | 5,9 / 9,2 | 6,6 / 10,8 |
| 60 | 5,1 / 9,4 | 5,4 / 9,8 | 6,3 / 11,7 | 7,1 / 14,5 |
| 70 | 5,0 / 11,1 | 5,4 / 11,6 | 6,3 / 14,4 | 7,6 / 19,5 |
| 80 | 5,1 / 13,5 | 5,5 / 13,8 | 6,4 / 18,5 | 7,4 / 26,0 |
| 90 | 5,3 / 18,5 | 5,3 / 18,7 | 6,5 / 24,8 | 7,4 / 33,5 |
| 100 | 5,4 / 24,0 | 5,3 / 23,9 | 6,6 / 31,6 | 7,3 / 41,2 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
