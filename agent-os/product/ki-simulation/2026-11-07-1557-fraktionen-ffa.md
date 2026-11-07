# KI-Simulation: fraktionen-ffa

Lauf vom 07.11.2026, 15:57, Modus `run`. 800 Partien gespielt, 30 Worker, Dauer 25 min 14 s.

Karten: medium-continent-35 (Welt continent, Land 35 %, Städte normal, Gelände normal); medium-islands-35 (Welt islands, Land 35 %, Städte normal, Gelände normal). Seeds je Matchup und Karte: 50, Sitzreihenfolge rotiert. Rundenlimit 150, Siegbedingung Rundenlimit.

**Laufzeit der Engine**

| Ø Partie | Ø Runden | ms je Runde | ms je KI-Zug | Befehle je KI-Zug |
| --- | --- | --- | --- | --- |
| 61 s | 142,6 | 425,3 | 120,8 | 6,8 |

## Matchup ffa-normal

400 Partien, Median 150 Runden (Mittel 144,2). Spielende: Ausschaltung 8, Kapitulation 59, Rundenlimit 333.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **nordmark** (nordmark, normal) | 90/400 | 23 % | 19–27 % | 2,58 | 167 (Median R75) | R13,0 (397/400) | 5,0 | 42,5 | 110 ms | 410 ms |
| **salzkueste** (salzkueste, normal) | 97/400 | 24 % | 20–29 % | 2,48 | 142 (Median R79) | R12,8 (396/400) | 5,3 | 44,8 | 113 ms | 437 ms |
| **eisenbund** (eisenbund, normal) | 116/400 | 29 % | 25–34 % | 2,40 | 156 (Median R76) | R12,3 (397/400) | 5,3 | 49,9 | 124 ms | 471 ms |
| **aurelia** (aurelia, normal) | 97/400 | 24 % | 20–29 % | 2,54 | 164 (Median R79) | R12,6 (396/400) | 5,3 | 43,6 | 116 ms | 437 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-continent-35 | 200 | 34 % | R138 | Ausschaltung 8, Kapitulation 59, Rundenlimit 133 | nordmark 43 : salzkueste 51 : eisenbund 56 : aurelia 50 |
| medium-islands-35 | 200 | 0 % | R150 | Rundenlimit 200 | nordmark 47 : salzkueste 46 : eisenbund 60 : aurelia 47 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 28 % · Sitz 2 23 % · Sitz 3 33 % · Sitz 4 17 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe | Verluste vor Städten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| nordmark | 54,7 | 73 % | 18,4 (12,9 erfolgreich) | 4,5 | 8,4 | 8,5 | 55,4 | 26,9 | 5,2 | 65,5 / 92,5 | 6,4 (5,2 gefallen) | 14,1 |
| salzkueste | 60,3 | 74 % | 19,1 (13,8 erfolgreich) | 4,7 | 9,1 | 9,0 | 59,3 | 30,7 | 5,3 | 72,6 / 99,1 | 7,3 (5,8 gefallen) | 14,7 |
| eisenbund | 61,0 | 72 % | 20,6 (14,0 erfolgreich) | 4,8 | 9,2 | 9,3 | 61,7 | 29,9 | 5,6 | 70,8 / 102,1 | 7,4 (5,9 gefallen) | 15,3 |
| aurelia | 60,9 | 72 % | 20,2 (14,1 erfolgreich) | 4,8 | 9,3 | 9,3 | 60,5 | 29,9 | 5,6 | 71,4 / 101,6 | 7,1 (5,6 gefallen) | 15,7 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| nordmark | 7,1 | 61,8 | 19,5 (31 %) | 0,9 |
| salzkueste | 8,1 | 63,6 | 17,3 (27 %) | 1,0 |
| eisenbund | 7,9 | 66,8 | 19,6 (29 %) | 1,1 |
| aurelia | 8,0 | 63,7 | 20,9 (33 %) | 1,1 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- |
| nordmark | 3,9 | 51,4 | 7,0 | 33,1 | 6,0 | 0 |
| salzkueste | 4,1 | 54,6 | 7,3 | 35,3 | 6,1 | 0 |
| eisenbund | 4,1 | 58,9 | 7,0 | 38,7 | 6,4 | 0 |
| aurelia | 4,1 | 54,4 | 7,7 | 35,3 | 6,3 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | nordmark | salzkueste | eisenbund | aurelia |
| --- | --- | --- | --- | --- |
| 10 | 1,5 / 1,8 | 1,5 / 1,8 | 1,5 / 2,1 | 1,5 / 1,8 |
| 20 | 2,2 / 3,8 | 2,2 / 3,7 | 2,3 / 4,2 | 2,3 / 3,7 |
| 30 | 3,0 / 6,0 | 3,1 / 6,0 | 3,1 / 6,7 | 3,1 / 6,1 |
| 40 | 3,6 / 9,2 | 3,6 / 9,3 | 3,6 / 10,2 | 3,6 / 9,2 |
| 50 | 3,9 / 12,3 | 4,1 / 12,7 | 4,1 / 14,1 | 4,0 / 12,5 |
| 60 | 4,3 / 15,4 | 4,4 / 15,8 | 4,5 / 17,8 | 4,5 / 15,5 |
| 70 | 4,5 / 18,3 | 4,7 / 18,9 | 4,8 / 21,6 | 4,7 / 18,7 |
| 80 | 4,6 / 21,3 | 4,9 / 22,2 | 5,0 / 25,1 | 4,9 / 21,3 |
| 90 | 4,6 / 24,1 | 5,1 / 25,3 | 5,0 / 28,9 | 5,1 / 24,6 |
| 100 | 4,7 / 27,1 | 5,2 / 28,5 | 5,1 / 32,5 | 5,1 / 27,4 |
| 110 | 4,8 / 29,9 | 5,3 / 31,6 | 5,2 / 35,6 | 5,2 / 30,7 |
| 120 | 4,8 / 33,0 | 5,3 / 34,8 | 5,1 / 38,9 | 5,2 / 33,4 |
| 130 | 4,9 / 35,7 | 5,4 / 38,1 | 5,2 / 42,6 | 5,3 / 37,1 |
| 140 | 4,9 / 38,7 | 5,3 / 41,5 | 5,3 / 46,1 | 5,3 / 40,5 |
| 150 | 5,0 / 42,5 | 5,3 / 44,8 | 5,3 / 49,9 | 5,3 / 43,6 |


## Matchup ffa-hard

400 Partien, Median 150 Runden (Mittel 141,1). Spielende: Ausschaltung 11, Kapitulation 105, Rundenlimit 284.

| Teilnehmer | Siege | Quote | 95 %-Intervall | Ø Platz | Ausgeschieden | Ø 1. Eroberung | Ø Städte | Ø Einheiten | Ø Zug | p95 Zug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **aurelia** (aurelia, hard) | 102/400 | 26 % | 21–30 % | 2,51 | 200 (Median R81) | R12,1 (398/400) | 5,7 | 25,4 | 127 ms | 494 ms |
| **nordmark** (nordmark, hard) | 79/400 | 20 % | 16–24 % | 2,63 | 230 (Median R85) | R11,5 (396/400) | 4,2 | 20,7 | 116 ms | 460 ms |
| **salzkueste** (salzkueste, hard) | 100/400 | 25 % | 21–29 % | 2,46 | 214 (Median R89) | R11,5 (393/400) | 5,2 | 26,0 | 125 ms | 494 ms |
| **eisenbund** (eisenbund, hard) | 119/400 | 30 % | 25–34 % | 2,40 | 191 (Median R78) | R11,8 (396/400) | 5,9 | 32,1 | 136 ms | 530 ms |

**Spielende je Karte**

| Karte | Partien | entschieden | Ø Ende | Spielende | Siege |
| --- | --- | --- | --- | --- | --- |
| medium-continent-35 | 200 | 47 % | R134 | Ausschaltung 11, Kapitulation 82, Rundenlimit 107 | aurelia 51 : nordmark 35 : salzkueste 55 : eisenbund 59 |
| medium-islands-35 | 200 | 12 % | R148 | Rundenlimit 177, Kapitulation 23 | aurelia 51 : nordmark 44 : salzkueste 45 : eisenbund 60 |

**Sitzvorteil** (Siegquote je Sitz): Sitz 1 30 % · Sitz 2 24 % · Sitz 3 30 % · Sitz 4 16 %

**Kämpfe und Eroberungen je Partie**

| Teilnehmer | Angriffe | gewonnen | Stadtangriffe | erobert neutral | erobert feindlich | Städte verloren | Einheiten verloren | vernichtet | sonstige Verluste | Schaden +/− | Mehrfachangriffe | Verluste vor Städten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 61,7 | 74 % | 19,2 (14,0 erfolgreich) | 5,0 | 9,0 | 8,8 | 58,9 | 31,4 | 7,0 | 87,4 / 117,2 | 8,0 (6,8 gefallen) | 15,7 |
| nordmark | 53,5 | 73 % | 17,1 (12,6 erfolgreich) | 4,9 | 7,7 | 8,6 | 55,3 | 26,4 | 8,0 | 76,7 / 109,5 | 6,9 (5,8 gefallen) | 14,0 |
| salzkueste | 54,6 | 74 % | 17,4 (13,2 erfolgreich) | 4,8 | 8,4 | 8,3 | 56,8 | 27,1 | 8,6 | 81,9 / 112,0 | 6,9 (6,0 gefallen) | 13,5 |
| eisenbund | 61,3 | 74 % | 19,1 (14,1 erfolgreich) | 5,1 | 9,0 | 8,6 | 60,1 | 31,1 | 8,5 | 87,5 / 119,7 | 8,1 (6,7 gefallen) | 14,4 |

**Seetransporte je Partie**

| Teilnehmer | Landungen | Züge beladen | davon wartend | neutral über See erobert |
| --- | --- | --- | --- | --- |
| aurelia | 10,9 | 73,1 | 14,5 (20 %) | 1,2 |
| nordmark | 9,5 | 69,1 | 12,2 (18 %) | 1,2 |
| salzkueste | 8,9 | 68,8 | 11,8 (17 %) | 1,1 |
| eisenbund | 10,9 | 79,8 | 16,5 (21 %) | 1,3 |

**Produktion je Partie** (fertiggestellte Einheiten)

| Teilnehmer | Blitzkorvette | Dampfkoloss | Flugzeugträger | Transportfrachter | Grenadiere | Kanonenboot | Panzerwagen | Schwerbomber | Tauchboot | Wolkenkreuzer | Befehle/Zug | Budget erschöpft |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aurelia | 0,5 | 0,0 | 0,6 | 5,8 | 16,9 | 6,1 | 45,5 | 2,3 | 2,3 | 0,0 | 7,7 | 0 |
| nordmark | 0,0 | 0,0 | 0,5 | 5,6 | 15,7 | 6,5 | 41,3 | 0,0 | 2,1 | 2,0 | 7,1 | 0 |
| salzkueste | 0,0 | 0,0 | 0,5 | 6,0 | 17,6 | 6,8 | 45,1 | 2,2 | 2,3 | 0,0 | 7,3 | 0 |
| eisenbund | 0,0 | 4,8 | 0,7 | 6,2 | 18,8 | 6,7 | 46,9 | 2,4 | 2,6 | 0,0 | 7,8 | 0 |

**Verlauf** (Mittel über alle Partien, Städte / Einheiten)

| Runde | aurelia | nordmark | salzkueste | eisenbund |
| --- | --- | --- | --- | --- |
| 10 | 1,5 / 1,5 | 1,6 / 1,5 | 1,5 / 1,5 | 1,5 / 2,1 |
| 20 | 2,4 / 3,4 | 2,4 / 3,4 | 2,4 / 3,4 | 2,5 / 3,9 |
| 30 | 3,2 / 5,9 | 3,2 / 5,8 | 3,2 / 5,9 | 3,3 / 6,6 |
| 40 | 3,7 / 8,6 | 3,7 / 8,4 | 3,8 / 8,7 | 3,9 / 9,7 |
| 50 | 4,3 / 10,4 | 4,1 / 10,7 | 4,3 / 11,2 | 4,4 / 12,2 |
| 60 | 4,5 / 12,0 | 4,4 / 12,1 | 4,7 / 13,0 | 4,7 / 14,1 |
| 70 | 4,8 / 13,5 | 4,6 / 13,0 | 4,9 / 14,4 | 4,8 / 15,5 |
| 80 | 5,1 / 15,0 | 4,6 / 14,2 | 5,0 / 15,9 | 5,0 / 17,0 |
| 90 | 5,3 / 16,9 | 4,6 / 15,0 | 5,2 / 17,3 | 5,2 / 18,8 |
| 100 | 5,5 / 18,3 | 4,5 / 15,6 | 5,2 / 18,8 | 5,4 / 21,0 |
| 110 | 5,5 / 20,0 | 4,5 / 16,7 | 5,3 / 20,5 | 5,5 / 23,5 |
| 120 | 5,5 / 21,4 | 4,5 / 17,8 | 5,2 / 21,8 | 5,7 / 25,7 |
| 130 | 5,6 / 22,8 | 4,4 / 18,8 | 5,2 / 23,2 | 5,8 / 28,0 |
| 140 | 5,7 / 24,0 | 4,3 / 19,5 | 5,2 / 24,5 | 5,8 / 30,1 |
| 150 | 5,7 / 25,4 | 4,2 / 20,7 | 5,2 / 26,0 | 5,9 / 32,1 |


## Lesehinweise

- Das 95 %-Intervall ist das Wilson-Intervall der Siegquote. Rotationen desselben Seeds sind nicht unabhängig, das Intervall ist deshalb etwas zu eng.
- „Ausgeschieden“ zählt Partien, in denen der Teilnehmer keine Stadt und keine Einheit mehr hatte.
- „Sonstige Verluste“ sind Abstürze ohne Treibstoff und Ladung, die mit dem Transporter unterging.
- „Entschieden“ heißt vor dem Rundenlimit beendet. „Davon wartend“ zählt Züge, die ein beladener Frachter mit derselben Ladung auf demselben Feld beendet wie im Zug davor.
- Bei Stadtangriffen wird die angreifende Einheit immer verbraucht; sie zählt unter „Einheiten verloren“, aber nicht als verlorener Kampf, wenn die Stadt fiel.
- Rohdaten (`games.jsonl`, `summary.json`) liegen im Laufordner unter `packages/sim/results/`.
