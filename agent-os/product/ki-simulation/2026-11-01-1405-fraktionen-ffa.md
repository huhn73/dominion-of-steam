# KI-Simulation: fraktionen-ffa

Lauf vom 01.11.2026, 14:05, Modus `run`. 200 Partien gespielt, 28 Worker, Dauer 1 min 53 s.

Karten: large (Land 55 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 100, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 16 s | 98,0 | 158,8 | 40,1 | 5,1 |

## Matchup ffa-4

200 Partien, Median 100 Runden (Mittel 98,0). Spielende: Rundenlimit 181, Ausschaltung 19.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenbund** (eisenbund, normal) | 91/200 | 46 % | 39–52 % | 2,07 | 54 (Median R61) | R6,3 (199/200) | 10,5 | 84,0 | 60 ms | 246 ms |
| **aurelia** (aurelia, normal) | 37/200 | 19 % | 14–24 % | 2,65 | 91 (Median R57) | R7,3 (200/200) | 4,4 | 22,7 | 32 ms | 138 ms |
| **nordmark** (nordmark, normal) | 26/200 | 13 % | 9–18 % | 2,81 | 98 (Median R57) | R6,7 (199/200) | 3,3 | 17,2 | 28 ms | 118 ms |
| **salzkueste** (salzkueste, normal) | 46/200 | 23 % | 18–29 % | 2,48 | 72 (Median R58) | R7,3 (200/200) | 6,0 | 30,9 | 38 ms | 158 ms |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 32 % · Sitz 2 23 % · Sitz 3 25 % · Sitz 4 21 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 68,2 | 73 % | 38,5 (26,3 erfolgreich) | 5,8 | 20,4 | 16,7 | 66,8 | 23,4 | 0,0 | 46,5 / 100,1 |
| aurelia | 47,6 | 72 % | 27,1 (18,2 erfolgreich) | 4,8 | 13,4 | 14,8 | 47,5 | 16,0 | 0,0 | 32,4 / 71,9 |
| nordmark | 44,8 | 72 % | 25,1 (16,9 erfolgreich) | 4,7 | 12,1 | 14,5 | 45,3 | 15,4 | 0,0 | 32,1 / 68,5 |
| salzkueste | 50,9 | 75 % | 28,4 (20,4 erfolgreich) | 4,9 | 15,5 | 15,4 | 51,8 | 17,9 | 0,0 | 37,6 / 77,5 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- |
| eisenbund | 80,4 | 6,2 | 50,4 | 6,8 | 0 |
| aurelia | 33,1 | 4,9 | 22,6 | 4,4 | 0 |
| nordmark | 29,2 | 4,9 | 19,7 | 4,1 | 0 |
| salzkueste | 40,9 | 5,2 | 26,0 | 4,7 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenbund | aurelia | nordmark | salzkueste |
| --- | --- | --- | --- | --- |
| 10 | 2,2 / 1,8 | 1,9 / 1,1 | 2,0 / 1,1 | 1,9 / 1,1 |
| 20 | 3,7 / 4,0 | 3,1 / 2,7 | 3,2 / 2,9 | 3,2 / 2,8 |
| 30 | 5,1 / 7,6 | 4,1 / 4,4 | 4,1 / 4,7 | 4,4 / 4,7 |
| 40 | 6,7 / 11,6 | 4,8 / 6,0 | 4,7 / 6,1 | 5,3 / 6,8 |
| 50 | 8,0 / 16,1 | 5,0 / 7,5 | 4,8 / 7,2 | 5,6 / 8,5 |
| 60 | 9,2 / 23,3 | 5,0 / 9,0 | 4,2 / 7,6 | 5,6 / 10,3 |
| 70 | 10,0 / 35,5 | 4,9 / 11,1 | 3,7 / 8,4 | 5,6 / 12,8 |
| 80 | 10,3 / 50,2 | 4,7 / 14,1 | 3,5 / 10,6 | 5,8 / 17,1 |
| 90 | 10,4 / 66,2 | 4,6 / 18,4 | 3,4 / 13,5 | 5,9 / 23,3 |
| 100 | 10,5 / 84,0 | 4,4 / 22,7 | 3,3 / 17,2 | 6,0 / 30,9 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
