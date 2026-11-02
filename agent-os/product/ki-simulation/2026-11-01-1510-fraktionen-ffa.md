# KI-Simulation: fraktionen-ffa

Lauf vom 01.11.2026, 15:10, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 2 min 22 s.

Karten: large (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 20 s | 97,2 | 205,4 | 51,6 | 5,6 |

## Matchup ffa-4

200 Partien, Median 100 Runden (Mittel 97,2). Spielende: Ausschaltung 31, Rundenlimit 169.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **salzkueste** (salzkueste, normal) | 46/200 | 23 % | 18–29 % | 2,48 | 86 (Median R60) | R7,2 (200/200) | 5,9 | 26,8 | 48 ms | 201 ms |
| **eisenbund** (eisenbund, normal) | 85/200 | 43 % | 36–49 % | 2,10 | 61 (Median R70) | R6,3 (199/200) | 10,2 | 67,3 | 76 ms | 325 ms |
| **aurelia** (aurelia, normal) | 40/200 | 20 % | 15–26 % | 2,71 | 97 (Median R60) | R7,2 (200/200) | 4,8 | 21,7 | 43 ms | 189 ms |
| **nordmark** (nordmark, normal) | 29/200 | 14 % | 10–20 % | 2,73 | 105 (Median R65) | R6,7 (199/200) | 3,6 | 12,7 | 38 ms | 154 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 31 % · Sitz 2 28 % · Sitz 3 28 % · Sitz 4 14 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| salzkueste | 54,1 | 74 % | 30,3 (21,6 erfolgreich) | 5,0 | 16,6 | 16,7 | 53,5 | 18,4 | 0,1 | 40,4 / 81,6 |
| eisenbund | 72,7 | 71 % | 42,2 (28,1 erfolgreich) | 6,0 | 22,1 | 18,9 | 71,5 | 23,1 | 0,3 | 49,3 / 108,5 |
| aurelia | 48,5 | 72 % | 28,3 (19,3 erfolgreich) | 4,8 | 14,5 | 15,5 | 48,6 | 15,5 | 0,1 | 34,6 / 74,0 |
| nordmark | 46,8 | 71 % | 27,8 (18,8 erfolgreich) | 4,8 | 14,1 | 16,2 | 48,6 | 14,4 | 0,1 | 33,0 / 73,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| salzkueste | 2,7 | 38,6 | 3,7 | 24,5 | 5,3 | 0 |
| eisenbund | 3,6 | 72,2 | 4,2 | 44,8 | 7,4 | 0 |
| aurelia | 2,1 | 33,5 | 3,7 | 21,5 | 4,9 | 0 |
| nordmark | 2,3 | 29,0 | 3,5 | 17,5 | 4,6 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | salzkueste | eisenbund | aurelia | nordmark |
| --- | --- | --- | --- | --- |
| 10 | 1,9 / 1,1 | 2,2 / 1,8 | 1,9 / 1,1 | 2,0 / 1,1 |
| 20 | 3,1 / 2,8 | 3,7 / 4,1 | 3,0 / 2,7 | 3,1 / 2,8 |
| 30 | 4,2 / 4,4 | 5,1 / 6,5 | 4,1 / 4,1 | 4,1 / 4,3 |
| 40 | 5,2 / 6,2 | 6,2 / 9,8 | 4,8 / 5,8 | 4,8 / 5,6 |
| 50 | 5,8 / 9,1 | 7,6 / 14,9 | 4,8 / 7,5 | 4,8 / 7,6 |
| 60 | 6,0 / 11,7 | 8,5 / 20,8 | 4,8 / 8,7 | 4,5 / 8,7 |
| 70 | 6,2 / 14,2 | 9,4 / 28,0 | 4,8 / 10,3 | 3,9 / 8,9 |
| 80 | 5,9 / 17,9 | 9,9 / 39,2 | 4,9 / 13,3 | 3,6 / 9,4 |
| 90 | 5,9 / 22,0 | 10,1 / 52,3 | 4,9 / 17,3 | 3,6 / 10,7 |
| 100 | 5,9 / 26,8 | 10,2 / 67,3 | 4,8 / 21,7 | 3,6 / 12,7 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
