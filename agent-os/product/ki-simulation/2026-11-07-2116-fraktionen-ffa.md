# KI-Simulation: fraktionen-ffa

Lauf vom 07.11.2026, 21:16, Modus `run`. 800 Partien gespielt, 32 Worker, Dauer 30 min 9 s.

Karten: medium-continent-35 (Welt continent, Land 35 %, Städte normal, Gelände normal); medium-islands-35 (Welt islands, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 77 s | 144,0 | 537,3 | 152,6 | 6,8 |

## Matchup ffa-normal

400 Partien, Median 150 Runden (Mittel 144,8). Spielende: Kapitulation 58, Rundenlimit 340, Ausschaltung 2.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **nordmark** (nordmark, normal) | 83/400 | 21 % | 17–25 % | 2,63 | 172 (Median R78) | R12,5 (395/400) | 4,7 | 40,9 | 132 ms | 509 ms |
| **salzkueste** (salzkueste, normal) | 95/400 | 24 % | 20–28 % | 2,51 | 145 (Median R80) | R12,5 (396/400) | 5,3 | 45,4 | 143 ms | 545 ms |
| **eisenbund** (eisenbund, normal) | 123/400 | 31 % | 26–35 % | 2,33 | 135 (Median R82) | R12,3 (396/400) | 5,8 | 55,0 | 160 ms | 620 ms |
| **aurelia** (aurelia, normal) | 99/400 | 25 % | 21–29 % | 2,53 | 165 (Median R77) | R12,9 (396/400) | 5,1 | 42,0 | 136 ms | 523 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-continent-35 | 200 | 30 % | R140 | Kapitulation 58, Rundenlimit 140, Ausschaltung 2 | nordmark 40 : salzkueste 50 : eisenbund 61 : aurelia 49 |
| medium-islands-35 | 200 | 0 % | R150 | Rundenlimit 200 | nordmark 43 : salzkueste 45 : eisenbund 62 : aurelia 50 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 26 % · Sitz 2 27 % · Sitz 3 28 % · Sitz 4 20 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe | Verluste vor Städten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| nordmark | 54,9 | 73 % | 18,2 (12,8 erfolgreich) | 4,5 | 8,3 | 8,6 | 56,0 | 27,3 | 6,1 | 66,9 / 93,3 | 6,5 (5,3 gefallen) | 14,1 |
| salzkueste | 59,0 | 74 % | 18,4 (13,6 erfolgreich) | 4,6 | 9,0 | 8,9 | 58,7 | 30,1 | 5,3 | 71,5 / 98,2 | 7,0 (5,6 gefallen) | 15,1 |
| eisenbund | 64,1 | 73 % | 21,1 (14,5 erfolgreich) | 4,9 | 9,6 | 9,3 | 62,8 | 32,0 | 5,2 | 74,9 / 104,9 | 8,0 (6,4 gefallen) | 14,9 |
| aurelia | 58,2 | 72 % | 20,2 (13,8 erfolgreich) | 4,8 | 9,0 | 9,2 | 58,7 | 28,2 | 5,5 | 68,0 / 98,4 | 6,9 (5,5 gefallen) | 15,3 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| nordmark | 7,5 | 63,9 | 20,0 (31 %) | 0,9 |
| salzkueste | 8,0 | 65,1 | 19,7 (30 %) | 1,0 |
| eisenbund | 8,4 | 69,3 | 21,1 (30 %) | 1,2 |
| aurelia | 8,7 | 62,7 | 21,0 (34 %) | 1,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| nordmark | 4,0 | 51,8 | 6,9 | 32,9 | 5,9 | 0 |
| salzkueste | 4,2 | 54,7 | 7,2 | 35,4 | 6,0 | 0 |
| eisenbund | 4,4 | 61,9 | 7,3 | 40,9 | 6,4 | 0 |
| aurelia | 4,1 | 52,6 | 7,5 | 34,0 | 6,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | nordmark | salzkueste | eisenbund | aurelia |
| --- | --- | --- | --- | --- |
| 10 | 1,5 / 1,8 | 1,5 / 1,8 | 1,5 / 2,1 | 1,5 / 1,8 |
| 20 | 2,2 / 3,6 | 2,2 / 3,7 | 2,3 / 4,0 | 2,2 / 3,6 |
| 30 | 3,1 / 5,9 | 3,1 / 6,0 | 3,2 / 6,5 | 3,1 / 5,9 |
| 40 | 3,6 / 9,2 | 3,6 / 9,3 | 3,7 / 10,1 | 3,6 / 9,0 |
| 50 | 3,9 / 12,8 | 4,1 / 13,0 | 4,2 / 14,4 | 4,1 / 12,3 |
| 60 | 4,4 / 16,0 | 4,4 / 16,2 | 4,6 / 18,1 | 4,4 / 15,0 |
| 70 | 4,5 / 19,0 | 4,8 / 19,1 | 4,9 / 21,6 | 4,6 / 17,9 |
| 80 | 4,5 / 21,4 | 4,8 / 22,7 | 5,2 / 25,2 | 4,8 / 20,6 |
| 90 | 4,7 / 24,1 | 4,9 / 25,5 | 5,3 / 28,8 | 4,9 / 23,8 |
| 100 | 4,6 / 26,9 | 5,1 / 28,3 | 5,5 / 32,7 | 4,9 / 26,4 |
| 110 | 4,7 / 29,5 | 5,2 / 31,6 | 5,5 / 36,7 | 5,0 / 29,6 |
| 120 | 4,7 / 32,2 | 5,2 / 34,7 | 5,6 / 41,2 | 5,0 / 32,3 |
| 130 | 4,6 / 35,0 | 5,3 / 38,0 | 5,7 / 45,9 | 5,1 / 35,6 |
| 140 | 4,7 / 38,0 | 5,3 / 41,9 | 5,7 / 50,4 | 5,1 / 38,8 |
| 150 | 4,7 / 40,9 | 5,3 / 45,4 | 5,8 / 55,0 | 5,1 / 42,0 |


## Matchup ffa-hard

400 Partien, Median 150 Runden (Mittel 143,1). Spielende: Ausschaltung 8, Kapitulation 104, Rundenlimit 288.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **eisenbund** (eisenbund, hard) | 114/400 | 28 % | 24–33 % | 2,40 | 194 (Median R90) | R11,6 (394/400) | 5,8 | 30,8 | 174 ms | 704 ms |
| **aurelia** (aurelia, hard) | 107/400 | 27 % | 23–31 % | 2,53 | 216 (Median R84) | R11,8 (395/400) | 5,5 | 26,9 | 165 ms | 679 ms |
| **nordmark** (nordmark, hard) | 84/400 | 21 % | 17–25 % | 2,57 | 211 (Median R84) | R11,9 (397/400) | 4,8 | 23,6 | 157 ms | 634 ms |
| **salzkueste** (salzkueste, hard) | 95/400 | 24 % | 20–28 % | 2,50 | 210 (Median R87) | R11,8 (396/400) | 5,0 | 24,5 | 155 ms | 618 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-continent-35 | 200 | 46 % | R138 | Ausschaltung 8, Kapitulation 84, Rundenlimit 108 | eisenbund 63 : aurelia 46 : nordmark 39 : salzkueste 52 |
| medium-islands-35 | 200 | 10 % | R149 | Kapitulation 20, Rundenlimit 180 | eisenbund 51 : aurelia 61 : nordmark 45 : salzkueste 43 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 26 % · Sitz 2 26 % · Sitz 3 30 % · Sitz 4 19 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe | Verluste vor Städten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 64,5 | 74 % | 18,8 (13,8 erfolgreich) | 5,1 | 8,7 | 8,4 | 62,7 | 33,7 | 8,4 | 94,6 / 124,7 | 8,4 (7,0 gefallen) | 15,9 |
| aurelia | 60,9 | 73 % | 19,0 (13,7 erfolgreich) | 5,0 | 8,6 | 8,4 | 58,9 | 30,8 | 6,7 | 86,6 / 117,4 | 8,0 (6,7 gefallen) | 15,3 |
| nordmark | 56,7 | 73 % | 17,4 (12,7 erfolgreich) | 4,8 | 7,9 | 8,3 | 57,7 | 28,8 | 7,1 | 83,3 / 114,1 | 7,5 (6,4 gefallen) | 14,8 |
| salzkueste | 54,9 | 73 % | 16,7 (12,7 erfolgreich) | 4,9 | 7,8 | 7,9 | 57,7 | 27,6 | 8,1 | 82,7 / 113,2 | 7,1 (6,1 gefallen) | 14,4 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| eisenbund | 10,4 | 78,0 | 14,3 (18 %) | 1,2 |
| aurelia | 11,4 | 69,6 | 13,3 (19 %) | 1,3 |
| nordmark | 9,4 | 69,7 | 12,6 (18 %) | 1,2 |
| salzkueste | 9,2 | 70,2 | 11,7 (17 %) | 1,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Blitzkorvette | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Wolkenkreuzer | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| eisenbund | 0,0 | 4,7 | 0,7 | 6,3 | 19,3 | 7,1 | 46,9 | 2,6 | 3,0 | 0,0 | 7,7 | 0 |
| aurelia | 0,5 | 0,0 | 0,6 | 5,5 | 17,7 | 6,3 | 46,0 | 2,1 | 2,8 | 0,0 | 7,7 | 0 |
| nordmark | 0,0 | 0,0 | 0,6 | 5,7 | 17,0 | 6,5 | 43,8 | 0,0 | 2,6 | 2,1 | 7,2 | 0 |
| salzkueste | 0,0 | 0,0 | 0,5 | 5,8 | 17,3 | 6,9 | 44,5 | 2,2 | 2,8 | 0,0 | 7,2 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | eisenbund | aurelia | nordmark | salzkueste |
| --- | --- | --- | --- | --- |
| 10 | 1,5 / 2,1 | 1,5 / 1,5 | 1,5 / 1,5 | 1,5 / 1,5 |
| 20 | 2,5 / 3,8 | 2,4 / 3,4 | 2,4 / 3,4 | 2,4 / 3,4 |
| 30 | 3,3 / 6,6 | 3,2 / 5,8 | 3,2 / 5,8 | 3,2 / 5,9 |
| 40 | 3,9 / 9,8 | 3,6 / 8,4 | 3,7 / 8,7 | 3,8 / 8,8 |
| 50 | 4,5 / 12,7 | 4,2 / 10,7 | 4,1 / 10,8 | 4,3 / 11,3 |
| 60 | 4,8 / 14,4 | 4,5 / 12,0 | 4,4 / 12,4 | 4,6 / 12,8 |
| 70 | 5,1 / 15,8 | 4,8 / 13,5 | 4,6 / 13,7 | 4,8 / 14,4 |
| 80 | 5,3 / 17,4 | 4,9 / 14,7 | 4,7 / 15,0 | 4,9 / 15,7 |
| 90 | 5,4 / 19,2 | 5,0 / 16,2 | 4,9 / 16,6 | 5,1 / 17,2 |
| 100 | 5,5 / 21,1 | 5,2 / 17,9 | 4,9 / 17,6 | 5,1 / 18,7 |
| 110 | 5,5 / 22,8 | 5,3 / 19,8 | 5,0 / 18,9 | 5,2 / 20,4 |
| 120 | 5,5 / 24,5 | 5,4 / 22,0 | 5,0 / 20,2 | 5,2 / 21,4 |
| 130 | 5,6 / 26,7 | 5,5 / 23,8 | 4,9 / 21,7 | 5,2 / 22,6 |
| 140 | 5,7 / 28,9 | 5,5 / 25,3 | 4,9 / 22,7 | 5,1 / 23,3 |
| 150 | 5,8 / 30,8 | 5,5 / 26,9 | 4,8 / 23,6 | 5,0 / 24,5 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
