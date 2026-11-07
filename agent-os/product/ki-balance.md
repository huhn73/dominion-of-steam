# KI-Balance: Befunde und Maßnahmen

Stand: 1. November 2026, erste Serien der KI-Simulation (`agent-os/specs/2026-11-01-1326-ki-simulation/`). Berichte mit allen Tabellen in `ki-simulation/`, Rohdaten in `packages/sim/results/` (nicht im Git). Alle Partien KI gegen KI, Karte „Mittel“ 18×12 (Serie A auch „Klein“, FFA „Groß“), Rundenlimit 100, Sitzreihenfolge rotiert. Siegquoten mit 95 %-Wilson-Intervall.

Die Maßnahmen unten sind Vorschläge für die Folge-Spec „KI-Regeln je Stufe und Fraktion“ (Roadmap 1c Punkt 6). Jede Maßnahme wird nach der Umsetzung mit derselben Serie nachgemessen.

## Kurzfassung

1. **„Leicht“ greift nie an.** 0 Angriffe in 800 Partien, 0 % Siege, keine einzige Eroberung. Ursache: Schwelle 0,7 liegt über der Eroberungschance von Grenadieren gegen eine neutrale Stadt (2/(2+1) = 0,67) und über jedem Duell gleicher Einheiten (0,5). Die leichte KI baut nur Grenadiere und fährt mit ihnen zwischen Städten hin und her (85 % ihrer Befehle sind `goto`).
2. **„Schwer“ ist schwächer als „normal“** (45 % gegen 55 %, Intervall 40–50 %). Ursache: Schwelle 0,45 lässt Münzwurf-Duelle zu (Grenadiere gegen Grenadiere 0,5), die Dampfkolosse (12 Runden Bauzeit) kommen zu spät, und die Kanonenboote bringen nichts, weil die KI weder Transporte noch Landungen kennt. Im Sweep gewinnt „schwer“ mit Schwelle 0,55 ohne Sondereinheiten, Schiffe und Garnison 65 % (52–76 %) gegen „normal“; die heutige Einstellung 52 %.
3. **Fraktionen sind stark unausgeglichen.** Salzküste gewinnt 74–92 % der Duelle und 59 % der Vierer-Partien, Aurelia und Nordmark verlieren fast alles (7–9 % im FFA). Ursache ist dieselbe Schwelle: +1 Stadtabwehr drückt die Eroberungschance mit Grenadieren auf 0,5, die normale KI (0,55) greift Salzküste-Städte mit Grenadieren also nie an. Umgekehrt nutzt die KI die Boni von Aurelia (Schiffe) und Nordmark (Flugzeuge) nicht, weil sie weder Flugzeuge noch Transporte baut und Sondereinheiten nur auf „schwer“.
4. **Persönlichkeiten wirken kaum, eine ist kaputt.** Sechs von sieben liegen bei 46–50 % gegen die Referenz ohne Persönlichkeit (Lindqvist ohne Tags ist exakt die Referenz). Ostrow (Defensiv, Befestigung, Salzküste) verliert 100 %: Schwelle 0,55 + 0,1 + 0,1 = 0,75, dieselbe Starre wie „leicht“.
5. **Zahlenparameter entscheiden wenig, Verhalten viel.** Im Sweep „normal gegen normal“ liegen alle 24 Rasterpunkte zwischen 42 und 53 %, alle Intervalle überlappen. Was fehlt, sind Verhaltensbausteine: Einheiten auf Wache werden nie neu geplant (29–64 % der Befehle sind `sentry`, am Ende stehen 25–65 Einheiten bei 5–9 Städten herum), es gibt keine Transporte, keine Flugzeuge, keine Reaktion auf bedrohte Städte. Die Hälfte bis zwei Drittel der Duelle endet deshalb am Rundenlimit statt durch Ausschaltung.

## Serie A: Stufen (`ki-simulation/2026-11-01-1326-stufen.md`, 1 200 Partien)

| Matchup | Ist | Ziel | Befund |
|---|---|---|---|
| hard gegen normal | **45 %** (40–50 %), Median 59 Runden, 150 von 400 am Rundenlimit | ≥ 65 %, untere Grenze > 55 % | „schwer“ greift mehr an (36,7 gegen 26,6 je Partie) und gewinnt davon weniger (69 % gegen 74 %), verliert 30,6 Einheiten zu 32,8 bei weniger Produktion (Dampfkoloss statt Grenadiere). Gleich auf beiden Karten (medium 93:107, small 88:112). |
| normal gegen easy | **100 %** | ≥ 65 % | „leicht“: 0 Angriffe, 0 Eroberungen, 1,0 Städte verloren, ausgeschieden im Median in Runde 42. |
| hard gegen easy | **100 %** | ≥ 80 % | wie oben. |

**Maßnahmen Stufen**

- **Leicht (A1):** Schwelle von 0,7 auf 0,6 senken, Aussetzer-Anteil 0,3 behalten. Sweep: so verliert „leicht“ 83 % (17 %, Intervall 9–28 %) gegen „normal“, greift aber an und erobert neutrale Städte. Mit Schwelle 0,5 und ohne Aussetzer wären es 40 %, das ist zu nah an „normal“. Zusätzlich sollte „leicht“ Städte nur mit Grenadieren angreifen und keine Verteidiger in Städten angreifen, damit ein Anfänger seine Städte halten kann. Ziel nach Umsetzung: 15–30 % gegen „normal“, mindestens eine Eroberung in 90 % der Partien.
- **Schwer (A2):** Schwelle auf 0,55 wie „normal“ (kein Münzwurf), Dampfkoloss-Anteil 0,2 auf 0 bis die KI Sondereinheiten sinnvoll einsetzt, Schiffsanteil 0 bis Transporte existieren. Das allein bringt 62–65 % gegen „normal“ im Sweep. Darüber hinaus braucht „schwer“ Verhalten, das „normal“ nicht hat (siehe Serie D): Neuplanung von Wache-Einheiten, Stadtverteidigung, Nachrücken in eroberte Städte, Produktion nach Lage. Ziel: ≥ 65 % mit unterer Grenze > 55 %.
- **Normal (A3):** Schwelle 0,55 behalten; Garnison und Schiffe nicht einschalten (im Sweep je −3 bis −8 Punkte).

## Serie B: Fraktionen (`2026-11-01-1327-fraktionen.md`, `2026-11-01-1328-fraktionen-ffa.md`, 800 Partien)

Duelle „normal“ ohne Persönlichkeit, Siegquote der Zeile gegen die Spalte:

| | Eisenbund | Aurelia | Nordmark | Salzküste |
|---|---|---|---|---|
| **Eisenbund** | – | 75 % | 77 % | 26 % |
| **Aurelia** | 25 % | – | 43 % | 8 % |
| **Nordmark** | 23 % | 57 % | – | 9 % |
| **Salzküste** | 74 % | 92 % | 91 % | – |

Vierer-FFA auf „Groß“ (200 Partien): Salzküste 59 % (52–65 %), Eisenbund 27 %, Nordmark 9 %, Aurelia 7 %; Ziel war 15–35 % je Fraktion. Sitzvorteil unauffällig (22–28 % je Sitz; Duelle 43–57 %). 181 von 200 FFA-Partien enden am Rundenlimit.

**Befund:** Die Rangfolge folgt exakt der Frage, ob der Bonus im heutigen KI-Verhalten vorkommt. Salzküste (+1 Stadtabwehr) wirkt in jedem Stadtangriff und schiebt die Grenadiere der Gegner unter die Schwelle; Eisenbund (Landeinheiten −1 Bauzeit) baut ein Viertel mehr Grenadiere (Grenadiere 3 statt 4 Runden); Aurelia (Schiffe +1 Bewegung) und Nordmark (Flugzeugreichweite ×1,5) haben keinen Effekt, weil die KI höchstens zwei Kanonenboote und nie Flugzeuge baut. Produktion „normal“ in allen Fraktionen: nur Grenadiere, Panzerwagen, Kanonenboot; Sondereinheiten nur auf „schwer“ (`specialShare`).

**Maßnahmen Fraktionen**

- **B1 Angriffsbewertung statt Schwelle:** Städte nicht nach `killChance ≥ Schwelle` filtern, sondern nach erwartetem Ertrag (Stadt wert 3 Punkte plus Produktion gegen verbrauchte Grenadiere). Dann lohnt ein Angriff mit 0,5 Chance auf eine Salzküste-Stadt weiterhin, und die Stadtabwehr bleibt ein Vorteil statt eines Schutzschilds. Alternativ Panzerwagen gezielt für Stadtangriffe auf Salzküste reservieren (0,67 statt 0,5).
- **B2 Fraktionsprofil in der Produktion:** Aurelia baut Blitzkorvetten und Kanonenboote nur, wenn Küsten-Ziele erreichbar sind; Nordmark baut Doppeldecker zum Aufklären und Wolkenkreuzer gegen Schiffe; beides erst sinnvoll mit B4/B5. Kurzfristig: Sondereinheiten-Anteil auch auf „normal“ > 0 (heute 0), damit die Fraktionen sich überhaupt unterscheiden.
- **B3 Eisenbund-Bonus prüfen:** −1 Bauzeit bei Grenadieren ist −25 %, bei Panzerwagen −14 %. Falls die Regel bleiben soll, ist das als Spielerbonus vertretbar; in KI-Duellen entscheidet er 75:25.
- **B4 Transporte und Landungen:** ohne Frachter und `unload` bleibt jede Fraktion auf ihrer Insel; das erklärt die vielen Rundenlimit-Enden (50–68 % der Duelle) und macht Seeboni wertlos. Größter einzelner Hebel für Aurelia, zugleich Voraussetzung für größere Karten (Roadmap 1c Punkt 3).
- **B5 Flugzeuge:** Doppeldecker zur Aufklärung (Nebelrand, Küstenlinie des Gegners), Schwerbomber gegen Stapel; nötig, damit der Nordmark-Bonus zählt.

## Serie C: Persönlichkeiten (`2026-11-01-1332-persoenlichkeiten.md`, 700 Partien)

| Persönlichkeit (Fraktion, Tags) | Quote gegen Referenz | Befund |
|---|---|---|
| Kessler (Aurelia, Aggressiv, Seekrieg) | 50 % (40–60 %) | Schwelle 0,45, bis vier Schiffe: kein Effekt |
| Varenne (Aurelia, Expansiv, Wirtschaft) | 46 % (37–56 %) | `neutralBias` 3: kein messbarer Effekt |
| Brandt (Eisenbund, Defensiv, Landkrieg) | 46 % (37–56 %) | Schwelle 0,65, Garnison; erste Eroberung erst Runde 8,5 statt 6,2 |
| Eisenhart (Eisenbund, Offensiv, Landkrieg) | 50 % (40–60 %) | schnellere Partien (Median 63 Runden), gleiche Quote |
| Halvorsen (Nordmark, Aufklärung, Luftkrieg) | 50 % (40–60 %) | baut Wolkenkreuzer (`specialShare` 0,15), „Aufklärung“ wird nicht ausgewertet |
| Lindqvist (Nordmark, keine Tags) | 50 % | identisch mit der Referenz, Kontrollwert |
| **Ostrow (Salzküste, Defensiv, Befestigung)** | **0 %** (0–4 %) | Schwelle 0,75: greift nie an, wie „leicht“ |

**Maßnahmen Persönlichkeiten**

- **C1 Ostrow:** Defensiv und Befestigung dürfen die Schwelle zusammen höchstens um 0,1 heben, oder die Schwelle wird bei 0,65 gedeckelt (heute 0,85). Mit B1 entfällt das Problem ganz.
- **C2 Tags mit Verhalten hinterlegen:** „Aufklärung“ (mehr Erkunden, Doppeldecker), „Seekrieg“ (Transporte, Küstenziele), „Expansiv“ (neutrale Städte zuerst, Garnison erst spät), „Befestigung“ (Garnison nur in Grenzstädten). Heute sind die Tags Zahlentweaks, die im Rauschen verschwinden.

## Serie D: Sweeps (`2026-11-01-1334-sweep-normal.md`, `2026-11-01-1340-sweep-hard.md`, `2026-11-01-1346-sweep-easy.md`, 3 540 Partien)

- **Normal gegen normal** (24 Punkte, je 60 Partien): 42–53 %, Basis 50 %. Tendenzen: Garnison kostet (Mittel der Punkte mit Garnison 45 %, ohne 49 %), Schwelle 0,45 kostet, `neutralBias` und `shipShare` ohne Effekt. Kein Rasterpunkt ist signifikant besser als die Basis.
- **Schwer gegen normal:** Basis 52 %; beste Punkte 65 % (0,55, keine Sondereinheiten, keine Schiffe, keine Garnison), 62 % (0,45 oder 0,65, sonst gleich). Jede Zutat Dampfkoloss, Kanonenboot oder Garnison senkt die Quote um 5–15 Punkte, weil sie Grenadiere kostet, die Städte erobern.
- **Leicht gegen normal:** Basis 0 %; Schwelle 0,6 mit Aussetzern 0,3 ergibt 17 %, ohne Aussetzer 32 %, Schwelle 0,5 ohne Aussetzer 40 %.

## Nachmessung nach der Spec „KI-Regeln je Stufe und Fraktion“ (1. November 2026)

Umgesetzt in `agent-os/specs/2026-11-01-1358-ki-regeln/`: A1, A2, A3, B1, C1, Neuplanung von Wache-Einheiten und Stadtverteidigung für „schwer“, Produktion wird bei jedem Neustart neu gewürfelt, defensive Tags verteidigen bedrohte Städte statt überall Garnison zu halten. Dieselben Serien, neue Berichte `2026-11-01-1359-stufen.md`, `2026-11-01-1405-fraktionen.md`, `2026-11-01-1405-fraktionen-ffa.md`, `2026-11-01-1411-persoenlichkeiten.md`.

| Messung | Vorher | Nachher | Ziel | |
|---|---|---|---|---|
| schwer gegen normal | 45 % (40–50 %) | **67 %** (62–71 %) | ≥ 65 %, untere Grenze > 55 % | erreicht |
| leicht gegen normal | 0 % | **21 %** (17–25 %), erste Eroberung in 399 von 400 Partien | 15–30 %, Eroberung in 90 % | erreicht |
| leicht gegen schwer | 0 % | 1 % | – | |
| Salzküste in Duellen | 74 / 92 / 91 % | **35 / 52 / 58 %** | < 65 % | erreicht |
| Eisenbund in Duellen | 75 / 77 / 26 % | 70 / 75 / 65 % | 40–60 % | offen (B3) |
| Aurelia gegen Nordmark | 43 % | 55 % | 40–60 % | erreicht |
| FFA Eisenbund / Aurelia / Nordmark / Salzküste | 27 / 7 / 9 / 59 % | 46 / 19 / 13 / 23 % | je 15–35 % | Nordmark knapp darunter, Eisenbund darüber (B3) |
| Ostrow gegen Referenz | 0 % | **52 %** | 35–65 % | erreicht |
| Brandt gegen Referenz | 46 % | 61 % | 35–65 % | erreicht |
| übrige Persönlichkeiten | 46–50 % | 41–55 % | 35–65 % | erreicht |
| Sitzvorteil | unauffällig | unauffällig (47–53 %, FFA 21–32 %) | ±10 % | erreicht |

**Was sich sonst geändert hat**

- „Schwer“ nutzt seine Einheiten: 7,9 Befehle je Zug statt 3,4, 72 Einheiten und 6,8 Städte am Ende gegen 29 und 3,0 bei „normal“. Keine Schiffe, keine Dampfkolosse mehr.
- „Leicht“ erobert jetzt neutrale Städte (erste im Mittel Runde 7,9) und baut weiter nur Grenadiere; gegen „normal“ verliert es drei von vier Partien, besetzte Städte greift es nicht an.
- Mehr Partien enden am Rundenlimit (schwer gegen normal 272 von 400 statt 150): Wer vorne liegt, hält seine Städte, der Rest ist ohne Transporte nicht erreichbar. Mit einem Menschen am Tisch ist das kein Patt, aber B4 (Transporte) bleibt der nächste große Hebel.
- Zugdauer: „schwer“ im Mittel 43 ms, p95 192 ms; mit 140 Einheiten (schwer gegen leicht) 107 ms und p95 410 ms. Unkritisch, aber die Neuplanung aller Wache-Einheiten skaliert mit der Einheitenzahl; vor größeren Karten erneut messen.
- Der frühere Befund „schwer plant `goto`-Einheiten neu“ war ein Irrtum im Code: Die innere Schleife brach bei jedem Dauerbefehl ab. Jetzt planen normal (`goto`) und schwer (`goto` und Wache) tatsächlich neu.

**Offen nach dieser Spec:** B2 (Sondereinheiten je Fraktion), B3 (Eisenbund-Bonus: −1 Bauzeit ist bei Grenadieren −25 %, er entscheidet die Duelle 65–75 %), B4 (Transporte und Landungen), B5 (Flugzeuge), C2 (Verhalten hinter den Tags: Seekrieg, Aufklärung, Expansiv), Sparringsgegner. Roadmap Phase 1c Punkt 7.

## Nachmessung 2 nach der Spec „KI-Verhalten, zweiter Block“ (1. November 2026)

Umgesetzt in `agent-os/specs/2026-11-01-1430-ki-verhalten-2/`: Belagerung verteidigter Städte nach Ertrag mit Übermacht, Verfolgung versprengter Feinde, Panzeranteil 0,8 für „schwer“, Schwerbomber für „schwer“ und „Luftkrieg“, Frachter mit Landungen für normal und schwer, Grenzgarnison und Panzerwagen für „Befestigung“ (Ostrow), ein Aufklärer für „Aufklärung“ (Halvorsen). Berichte `2026-11-01-1515-stufen.md`, `2026-11-01-1509-fraktionen.md`, `2026-11-01-1510-fraktionen-ffa.md`, `2026-11-01-1514-persoenlichkeiten.md`, `2026-11-01-1513-inseln.md` (Vergleich ohne Transporte und Flugzeuge: `2026-11-01-1451-inseln-ohne.md`).

| Messung | Nach Spec 1358 | Jetzt | Ziel | |
|---|---|---|---|---|
| schwer gegen normal | 67 % (62–71 %), 272 von 400 am Rundenlimit | **62 %** (57–67 %), 112 von 400 am Rundenlimit | ≥ 65 %, untere Grenze > 55 % | knapp verfehlt, dafür entschiedene Partien |
| schwer gegen leicht | 100 %, 294 von 400 am Rundenlimit | 99 %, 33 von 400 am Rundenlimit, Median 41 Runden | – | Patts beseitigt |
| leicht gegen normal | 21 % | 17 % (14–21 %), erste Eroberung in 399 von 400 | 15–30 % | erreicht |
| Salzküste in Duellen | 35 / 52 / 58 % | 36 / 60 / 64 % | < 65 % | erreicht |
| Eisenbund in Duellen | 70 / 75 / 65 % | 67 / 76 / 64 % | 40–60 % | offen (B3, Regelfrage) |
| Aurelia gegen Nordmark | 55 % | 51 % | 40–60 % | erreicht |
| FFA Eisenbund / Aurelia / Nordmark / Salzküste | 46 / 19 / 13 / 23 % | 43 / 20 / 14 / 23 % | je 15–35 % | Eisenbund darüber, Nordmark knapp darunter |
| Ostrow gegen Referenz | 52 % | 38 % (29–48 %), hält Grenzstädte mit Panzerwagen | 35–65 % | erreicht, spielt erkennbar defensiv |
| Halvorsen gegen Referenz | 50 % | 37 % (28–47 %) mit einem Aufklärer | 35–65 % | erreicht, Aufklärung kostet |
| übrige Persönlichkeiten | 41–61 % | 42–58 % | 35–65 % | erreicht |
| Inseln (Groß, 30 % Land), schwer gegen normal | – | 67 % mit Transporten, 50 % ohne | – | |
| Inseln, Ausschaltungen je 100 Partien | – | 38 und 36 mit Transporten, 41 und 22 ohne; feindliche Eroberungen 7,9 statt 5,6 je Partie | | Landungen finden statt |

**Was die Sweeps gezeigt haben** (`2026-11-01-1451-sweep-hard-2.md`, `-hard-3`, `-hard-4`)

- Aufklärer für alle Stufen waren ein Fehler: „schwer“ fiel mit zwei Doppeldeckern von 70 auf 40–53 %, weil sie nachgebaut werden, solange irgendwo Nebel bleibt, und nichts erobern. Jetzt fliegt nur Halvorsen einen, bis Runde 30.
- Sobald „normal“ belagert und verfolgt, verschwand der Vorsprung von „schwer“ aus Neuplanung und Stadtverteidigung (alle Rasterpunkte 47–52 %). Zurück brachte ihn der Panzeranteil: 0,6–0,8 statt 0,4 sind +7 bis +9 Punkte, weil Panzerwagen Verteidiger in Städten mit 0,82 statt 0,4 schlagen. Belagerungsverhältnis, Bomber und Transporte liegen im Rauschen.
- Garnisonen in Grenzstädten kosten „schwer“ 5 bis 15 Punkte und bleiben der Befestigungs-Persönlichkeit vorbehalten.
- Der Kartengenerator erzeugt bei 55 % Land praktisch eine Landmasse; Transporte zahlen sich erst auf „Groß“ mit 30 % Land aus (13 von 30 Karten mit getrennten Hauptstädten). Mit den geplanten größeren Karten gewinnt der Baustein an Gewicht.

**Offen:** B3 Eisenbund-Bonus (Regel), Sondereinheiten je Fraktion mit Verhalten, Träger als Flugbasis, Geleitschutz für Transporte, Sparringsgegner; „schwer“ fehlen noch 3 Punkte zum Ziel, Kandidaten sind Produktion nach Bedrohungslage und Reparaturpausen beschädigter Panzerwagen.

## Nachmessung 3 nach der Spec „KI-Verhalten, dritter Block“ (1. November 2026)

Umgesetzt in `agent-os/specs/2026-11-01-1530-ki-verhalten-3/`: Eisenbund-Bonus nur noch ab fünf Runden Bauzeit (Regel), Reparaturpausen für „schwer“, Sondereinheiten je Fraktion (Dampfkoloss ab Runde 15 und sechs Städten, Wolkenkreuzer statt Schwerbomber, Blitzkorvette als Geleitschutz), Kriegsschiffe als Geleit und Schiffsjäger, „leicht“ mit 15 % Aussetzern und 10 % Panzern, Sparringsgegner. Berichte `2026-11-01-1601-stufen.md`, `2026-11-01-1538-fraktionen.md`, `2026-11-01-1550-fraktionen-ffa.md`, `2026-11-01-1554-persoenlichkeiten.md`, `2026-11-01-1602-inseln.md`, `2026-11-01-1603-sparring.md`.

| Messung | Nach Block 2 | Jetzt | Ziel | |
|---|---|---|---|---|
| schwer gegen normal | 62 % (57–67 %) | **63 %** (58–68 %), 115 von 400 am Rundenlimit | ≥ 65 %, untere Grenze > 55 % | untere Grenze erreicht, Punktwert knapp darunter |
| leicht gegen normal | 17 % | **20 %** (16–24 %) | 15–30 % | erreicht |
| schwer gegen leicht | 99 % | 95 % | – | |
| Eisenbund in Duellen | 67 / 76 / 64 % | **63 / 59 / 52 %** | 40–60 % | zwei von drei erreicht |
| Salzküste in Duellen | 36 / 60 / 64 % | 48 / 56 / 57 % | < 65 % | erreicht |
| Aurelia gegen Nordmark | 51 % | 54 % | 40–60 % | erreicht |
| FFA Eisenbund / Aurelia / Nordmark / Salzküste | 43 / 20 / 14 / 23 % | **26 / 30 / 18 / 27 %** | je 15–35 % | erreicht |
| Persönlichkeiten gegen Referenz | 37–58 % | 37–52 % (Halvorsen und Ostrow 37 %) | 35–65 % | erreicht |
| Inseln, schwer gegen normal | 67 % | 73 % (63–81 %) | – | Geleitschutz und Reparatur wirken |
| Inseln, Aurelia gegen Eisenbund | 33 % | **55 %** (45–64 %) | 40–60 % | Seebonus zählt erstmals (Blitzkorvetten als Geleit) |
| Sparring leicht gegen passiv / expander / rusher | – | 25 / 24 / 34 % | verliert gegen alle | erreicht |
| Sparring normal | – | 48 / 50 / 53 % | um 50 % | erreicht |
| Sparring schwer | – | 75 / 71 / 81 % | gewinnt gegen alle | erreicht |

**Was die Sweeps gezeigt haben** (`2026-11-01-1552-sweep-hard-5.md`, `2026-11-01-1554-sweep-easy-2.md`)

- Jedes Zehntel Dampfkoloss-Anteil an den Panzer-Bauten kostet „schwer“ rund 3 Punkte (0 → 58 %, 0,1 → 55 %, 0,3 → 48 %). Deshalb 0,15 und nur ab sechs Städten: Die Sondereinheit kommt vor, ohne die Expansion zu bremsen. Mit Reparatur und ohne Sondereinheiten lag „schwer“ bei 65 % (`2026-11-01-1544-stufen.md`).
- Für „leicht“ bewegen Aussetzer und Schwelle nichts mehr (8–10 % in allen Rasterpunkten), erst Panzerwagen helfen: 25 % Panzer ergaben 36 %, 10 % Panzer 20 %.
- Der Eisenbund-Bonus auf Grenadiere (−25 % Bauzeit) war der größte Einzelfaktor der Fraktionsbalance: Ohne ihn fällt Eisenbund im Vierer von 43 auf 26 %.

**Offen:** „schwer“ fehlen noch zwei Punkte zum Ziel (Kandidat: Produktion nach Bedrohungslage), Eisenbund gegen Aurelia 63 % (Luftlinie Seebonus auf Inselkarten dreht es auf 45 %), Träger als Flugbasis, Tauchboote, Sparringsgegner „Turtle mit Flugzeugen“.

## Nachmessung 4 nach der Spec „KI-Verhalten, vierter Block“ (1. November 2026)

Umgesetzt in `agent-os/specs/2026-11-01-1610-ki-verhalten-4/`: Garnisonsziel 2 für bedrohte Städte von „schwer“ (Grenadiere nur bis zwei Verteidiger, dann wieder Panzer), Tauchboote als Schiffsjäger für „schwer“ und „Seekrieg“, Sparringsgegner „turtle“ und „navy“. Berichte `2026-11-01-1700-stufen.md`, `2026-11-01-1701-inseln.md`, `2026-11-01-1701-sparring.md`, Sweep `2026-11-01-1659-sweep-hard-6.md`.

| Messung | Nach Block 3 | Jetzt | Ziel | |
|---|---|---|---|---|
| schwer gegen normal | 63 % (58–68 %) | **66 %** (61–70 %), 60 von 400 am Rundenlimit | ≥ 65 %, untere Grenze > 55 % | **erreicht** |
| leicht gegen normal | 20 % | 20 % (16–24 %) | 15–30 % | erreicht |
| schwer gegen leicht | 95 % | 95 %, Median 41 Runden | – | |
| Inseln, schwer gegen normal | 73 % | 71 % | – | |
| Inseln, Aurelia gegen Eisenbund | 55 % | 55 % | 40–60 % | erreicht |
| Sparring leicht gegen passiv / expander / rusher / turtle / navy | 25 / 24 / 34 % | 25 / 24 / 34 / 6 / 43 % | verliert gegen alle | erreicht |
| Sparring normal | 48 / 50 / 53 % | 48 / 50 / 53 / 78 / 64 % | um 50 %, knackt Turtle | erreicht |
| Sparring schwer | 75 / 71 / 81 % | 81 / 76 / 82 / 93 / 81 % | gewinnt gegen alle | erreicht |

**Befund:** Das Garnisonsziel liegt im Sweep mit 77–78 % knapp vor „unbegrenzt“ (75 %) und bringt in der vollen Serie die letzten drei Punkte; mehr als zwei Grenadiere in einer bedrohten Stadt standen nur herum. Die Turtle (Garnison überall, keine Belagerung) verliert gegen „normal“ 78 % und gegen „schwer“ 93 %: Belagerung mit Übermacht und Panzer knacken befestigte Städte. Die Marine-Gegnerin verliert gegen „normal“ 64 %, weil Schiffe, Bomber und Tauchboote auf einer Landmasse keine Städte erobern.

Damit sind alle Zielwerte der ersten Auswertung erreicht oder knapp erreicht: Stufen gespreizt (leicht 20 %, schwer 66 %), Fraktionen im Vierer 18–30 %, Persönlichkeiten 37–52 %, Patts am Rundenlimit bei 15 % der Duelle.

**Offen:** Träger als Flugbasis, Sichtbarkeit von Tauchbooten (Regel), Sparringsgegner mit Skript statt Profil, Serien auf den neuen Kartengrößen mit kleinem Landanteil (Roadmap 1c Punkt 3).

## Prüfung nach der Kartengrößen-Spec (1. November 2026, Commit „Kartengrößen: fünf Stufen bis 200×200“)

Alle Messungen oben stammen von den alten Stufen (Mittel 18×12, Klein 14×10, Groß 26×18, 12 Landfelder je Stadt). Seit `agent-os/specs/2026-11-01-1707-kartengroessen/` heißt Mittel 40×40, Klein 20×20, Groß 75×75, mit 30 Landfeldern je Stadt und einem deterministischen Arbeitsbudget der KI (Kandidaten 8 → 4, Annäherungsfelder 3, Pfadsuche 3 000 Knoten, 60 000 Arbeitseinheiten je Zug, Wanduhr-Ventil nur im Server). Geprüft wurde, ob die KI-Arbeit dieser Sitzung dazu passt:

- **Hooks und Simulation:** `AiTurnOptions.profile` und `onCommand` sind erhalten, das neue `deadline` setzt nur der Server. Die Simulation bleibt deterministisch (1 und 4 Worker liefern identische Rohdaten); `roundLimit: null` wird in der Siegart berücksichtigt. Alle Profilfelder und Configs laufen unverändert.
- **Laufzeit:** Mittel 40×40 mit drei KIs 5–14 s je 100-Runden-Partie, Zugdauer im Mittel 64–107 ms, p95 bis 0,56 s; die Stufen-Serie (1 200 Partien) dauert 9,5 min statt 2.
- **Balance auf den neuen Größen** (`2026-11-01-1743-stufen.md`): schwer gegen normal 76 % (72–80 %), normal gegen easy 80 %, schwer gegen easy 97 %. Die Spreizung hält, „schwer“ gewinnt sogar deutlicher, weil es auf großen Karten mehr Städte nimmt (10,8 gegen 5,5 am Ende).
- **Aber:** Auf Mittel 40×40 mit Rundenlimit 100 enden 191 von 200 Duellen am Rundenlimit (9 Ausschaltungen); auf Klein 20×20 noch 66 von 200. Die erste Eroberung liegt bei Runde 10–11 statt 6–7. Das Setup schlägt für Mittel 100 Runden vor; eine Partie wird dann fast immer nach Punkten entschieden. Entweder Vorgabe für Mittel auf 150–200 anheben oder das als gewollt dokumentieren.
- **Inseln:** Der neue Generator erzeugt mehr Landmassen (Mittel 4–6, Groß 13–20), setzt die Hauptstädte aber auf die größte Masse: bei 55 % Land liegen sie nie getrennt, bei 30 % auf Mittel in 6 von 20 Karten, auf Groß in 2 von 20. Die Vorgabe im Setup ist jetzt 45 %. Für Inselpartien bräuchte der Generator eine Regel, die Hauptstädte auf verschiedene Massen verteilt, oder der Landanteil muss unter 35 % liegen. Die Serie `inseln.json` misst jetzt auf Mittel mit 30 % Land.

Fazit: Kein Widerspruch zur KI-Arbeit; die Zielwerte gelten auch auf den neuen Größen.

**Nachtrag:** Rundenlimit Mittel auf 150, Hauptstädte zufällig über die Landmassen, Landanteil-Vorgabe 35 % (Nachtrag in `agent-os/specs/2026-11-01-1707-kartengroessen/shape.md`). Nachmessung mit 35 % Land (`2026-11-01-1806-rundenlimit-klein.md`, `2026-11-01-1807-rundenlimit-mittel.md`): Mittel mit 150 Runden 55 % Ausschaltungen, schwer gegen normal 89 %, normal gegen leicht 84 %; Klein mit 75 Runden 56 % Ausschaltungen, schwer gegen normal 69 %. Zugdauer auf Mittel im späten Spiel mit 125 Einheiten im Mittel 0,24 s, p95 rund 1 s.

## Nachmessung Inselwelt (1. November 2026, Spec `2026-11-01-1830-inselwelt`)

Erstmals echte Inseln: Weltform `islands` auf Mittel, 35 % Land, 150 Runden, jede Hauptstadt auf eigener Küsteninsel. Berichte `2026-11-01-1942-inseln.md`, `2026-11-01-1946-inselwelt.md`, Vergleich ohne Transporte und Flugzeuge `2026-11-01-1913-inseln-ohne.md`, Archipel `2026-11-01-1914-archipel.md`, Kontinent-Gegenprobe `2026-11-01-1936-stufen.md`.

| Messung | erster Lauf auf Inseln | nach Seeaufklärer-Regel | Kontinent (Mittel) |
|---|---|---|---|
| schwer gegen normal | **10 %** | **68 %** (58–76 %) | 66 % |
| Aurelia gegen Eisenbund | 90 % | 80–88 % | 37 % |
| Vierer Varenne / Kessler / Brandt / Ostrow (Aurelia, Aurelia, Eisenbund, Salzküste) | 48 / 30 / 10 / 13 % | 48 / 28 / 12 / 13 % | – |
| Spielende | 99 von 100 am Rundenlimit | 99 von 100 am Rundenlimit | 270 von 400 |
| normal gegen leicht (Kontinent) | – | 69 % | Ziel 70–85 % |

**Befunde**

- **Ohne Seeaufklärung blieb „schwer“ zu Hause.** Beim ersten Lauf baute „schwer“ 2,4 Frachter je Partie und eroberte 4,3 neutrale Städte, „normal“ 10,5 Frachter und 9,5 Städte. Ursache: Frachter entstehen erst, wenn fremde Städte auf anderen Landmassen *bekannt* sind, und „schwer“ hatte keine Kanonenboote (`shipShare` 0), die das Meer erkunden. Neue Regel für alle Stufen mit Transporten: Solange Nebel bleibt und kein Kriegsschiff fährt, baut eine Küstenstadt ab drei Landeinheiten ein Kanonenboot. Danach 68 % für „schwer“, auf dem Kontinent unverändert 66 %.
- **Inselpartien enden nach Punkten.** 99 von 100 Duellen erreichen das Rundenlimit; Ausschaltung über See gelingt der KI praktisch nie. Die Partie entscheidet sich über Städte und Einheitenzahl.
- **Aurelia dominiert Inselwelten.** Schiffe +1 Bewegung und die Blitzkorvette als Geleitschutz (11 je Partie gebaut, Stärke 3, 8 Trefferpunkte, Bewegung 6) versenken Frachter samt Ladung (Eisenbund verliert 82 Einheiten je Partie, 9 davon als Ladung) und tragen die Expansion: 13 Städte gegen 5,5. Thematisch richtig, aber 80–88 % und im Vierer 48 % gegen 12–13 % für Eisenbund und Salzküste sind zu viel. Kandidaten: Blitzkorvette nur als Sondereinheit mit Anteil statt als Standard-Geleit (Kanonenboot für alle, Korvette ab `specialShare`), Bauzeit oder Werte der Korvette prüfen, Geleitschutz auch mit zwei Schiffen je Frachter. Das ist eine Regel- und KI-Frage für den nächsten Block.
- **Leicht am oberen Rand:** Mit der Kartengrößen-Umstellung (Mittel 40×40, 100 Runden) liegt „leicht“ auf dem Kontinent bei 31 % statt 20 %; Ziel 15–30 %. Die größeren Karten geben dem passiven Spiel mehr Zeit. Beobachten, gegebenenfalls Aussetzer wieder auf 0,2.

## Nachmessung Inselbalance (1. November 2026, Spec `2026-11-01-2015-inselbalance-tarnung`)

Kanonenboot als Standard-Geleit (Blitzkorvette nur als Sondereinheit), „leicht“ mit 20 % Aussetzern, gleichzeitige Bauaufträge mitgezählt, Frachter normal 2 und schwer 3, Träger für den vollen Bomberverband, Tauchboot-Tarnung. Berichte `2026-11-01-2116-inseln.md`, `2026-11-01-2118-inselwelt.md`, `2026-11-01-2126-stufen.md`, `2026-11-01-2132-fraktionen.md`, Sweeps `2026-11-01-2109-sweep-transporte-hard.md`, `2026-11-01-2113-sweep-transporte-normal.md`.

| Messung | vorher | jetzt | Ziel |
|---|---|---|---|
| Aurelia gegen Eisenbund, Inseln | 80–88 % | **45–54 %** | 40–60 % |
| Vierer auf Inseln (Varenne, Kessler, Brandt, Ostrow) | 48 / 28 / 12 / 13 % | **26 / 22 / 27 / 27 %** | je 15–35 % |
| schwer gegen normal, Inseln | 68 % | **74–75 %** | ≥ 65 % |
| schwer gegen normal, Kontinent | 66 % | 63 % (58–68 %) | ≥ 65 %, untere Grenze > 55 % |
| leicht gegen normal, Kontinent | 31 % | **26 %** | 15–30 % |
| Fraktionsduelle, Kontinent | 40–60 % | 37–63 % | 40–60 % |
| Träger je Partie (schwer, Inseln) | 7,5 | 1,0 | – |
| Frachter je Partie (Inseln) | 7,6 / 9,0 | 5,9 / 6,0 | – |
| Inselpartien am Rundenlimit | 99 % | 89–98 % | – |

**Befunde:** Der Doppelauftrag-Fehler verdeckte, dass eine Obergrenze von einem Frachter auf Inseln zu wenig ist; mit sauberer Zählung entscheidet die Frachterzahl die Inselduelle (Sweep: +16 bis +34 Punkte). Aurelia ist ohne Korvetten-Geleit ausgeglichen, Eisenbund gegen Nordmark auf dem Kontinent mit 63 % am Rand. Inselpartien enden weiter fast immer nach Punkten (Folgefrage Siegbedingung, Roadmap).

## Nachmessung Enden (2. November 2026, Spec `2026-11-02-1952-enden-inselwelten`)

Neue Siegbedingung Vorherrschaft (Mehrheit der Städte fünf eigene Runden lang: 60 % auf dem Kontinent, 50 % auf Inseln und Archipel) und Kapitulation der KI (Hauptstadt verloren, weniger als ein Viertel der Städte des Führenden, der mindestens 6 hat, ab Runde 20). Bericht `2026-11-02-2017-inseln-vorherrschaft.md`, je Matchup und Weltform 60 Partien auf „Mittel“ (Inseln 35 %, Archipel 30 %, Kontinent 35 % Land), Rundendeckel 150. Die Simulation trennt Karten jetzt nach Größe, Weltform und Landanteil (vorher fielen Inseln und Kontinent gleicher Größe in eine Karten-ID).

| Matchup | Weltform | Ende vor Runde 150 | davon Vorherrschaft / Kapitulation | Ø Ende | Siege |
|---|---|---|---|---|---|
| schwer gegen normal | Kontinent | **86 %** | 35 / 15 (+2 Ausschaltung) | R91 | schwer 35, normal 17 |
| schwer gegen normal | Inseln | **71 %** | 36 / 7 | R97 | schwer 39, normal 4 |
| schwer gegen normal | Archipel | **60 %** | 25 / 11 | R115 | schwer 32, normal 4 |
| Aurelia gegen Eisenbund | Kontinent | **91 %** | 38 / 17 | R98 | 26 : 29 |
| Aurelia gegen Eisenbund | Inseln | **53 %** | 27 / 5 | R96 | 17 : 15 |
| Aurelia gegen Eisenbund | Archipel | 21 % | 12 / 1 | R111 | 9 : 4 |

**Befunde:** Mit einheitlich 60 % endeten Inselpartien nur zu 25–43 % vor dem Deckel, Archipel zu 6–30 % (erste Messung, verworfen); erst die Schwelle von 50 % für Inselwelten bringt Inseln über das Ziel von 50 %. Kapitulationen kommen spät (Mittel R75–108, frühestens R34), „schwer“ gewinnt die entschiedenen Partien deutlich (Inseln 39:4, Kontinent 35:17). Offen bleibt der Archipel im ausgeglichenen Fraktionsduell (21 %): Die KI erobert neutrale Inseln zu zögerlich, um die Mehrheit zu erreichen; Folge-Spec in der Roadmap.

## Nachmessung neutrale Inseln (2. November 2026, Spec `2026-11-02-2209-ki-neutrale-inseln`)

Änderungen an der KI:
- **Zielwahl:** Frachter wählen ihr Ziel nach Ertrag statt nach Entfernung: Wert der Stadt, weitere Städte auf derselben Insel, sichtbare Verteidiger, Fahrstrecke.
- **Abfahrt:** Gegen eine unverteidigte neutrale Stadt legen sie schon mit 2 Einheiten ab.
- **Landung:** Ladung geht auch auf Inseln mit eigener Stadt an Land, wenn eine fremde Stadt näher liegt. Vorher blieb sie dort an Bord.
- **Geleit:** Je Frachter begleitet ihn ein Kriegsschiff, die übrigen jagen oder erkunden. Erkundet werden bis zu `scoutShips` Kanonenboote (normal 1, schwer 2).
- **Vorherrschaft:** Mit der Vorherrschaft in Reichweite (`dominanceDrive`, normal und schwer) baut die KI einen Frachter mehr, legt mit 2 Einheiten ab und bevorzugt neutrale Städte. Als Halter bewacht sie bedrohte Städte. Städte eines anderen Halters zieht sie vor.

Die Simulation zählt jetzt Landungen und beladen wartende Frachter und zeigt die Spielenden je Karte. Bericht `2026-11-02-2216-inseln-neutral.md` (Konfiguration `inseln-vorherrschaft.json`), Raster `2026-11-02-2220-archipel-raster.md`.

| Matchup | Weltform | entschieden vorher | nachher | Siege nachher |
|---|---|---|---|---|
| schwer gegen normal | Kontinent | 87 % | 93 % | schwer 43, normal 13 |
| schwer gegen normal | Inseln | 72 % | **93 %** | schwer 50, normal 6 |
| schwer gegen normal | Archipel | 60 % | **95 %** | schwer 54, normal 3 |
| Aurelia gegen Eisenbund | Kontinent | 92 % | 97 % | 28 : 30 |
| Aurelia gegen Eisenbund | Inseln | 53 % | **70 %** | 22 : 20 |
| Aurelia gegen Eisenbund | Archipel | 22 % | **48 %** (Raster mit 80 Partien: 57 %, zusammen 54 %) | 17 : 12 |

**Befunde:**
- Der Archipel erreicht im ausgeglichenen Duell das Ziel von 50 %. Beladen wartende Frachter-Züge sinken bei „schwer“ von 31 auf 12 %, bei „normal“ bleiben sie bei 23–28 %.
- „Schwer“ gewinnt die entschiedenen Inselpartien jetzt fast immer (Archipel 54:3).
- Im Raster für „normal“ auf dem Archipel bringt `maxTransports` 3 den höchsten Wert (62 %). `departAt` 2 und `scoutShips` 2 bleiben im Rauschen. Die Frachterzahl bleibt bei 2, weil sie aus der Inselbalance stammt.
- Kontrolle auf dem Kontinent (Siegbedingung Hauptstädte):
  - `stufen`: schwer gegen normal 62 % (vorher 63), normal gegen leicht 76 % (74), schwer gegen leicht 90 % (91)
  - `fraktionen`: 38–62 %, Eisenbund gegen Aurelia 62:38 (vorher 56:44, Intervall 52–71 %)
  - Ø KI-Zug 29–90 ms, Budget nie erschöpft

## Nachmessung 5 (6. November 2026, Spec `2026-11-06-1851-ki-verhalten-5`)

Änderungen an der KI (normal und schwer, „leicht“ ohne):
- **Schwerpunkt (`strike`):** Vor der Einzelplanung sucht die KI Verteidiger in Sicht, die zwei oder mehr freie Einheiten in diesem Zug erreichen, die aber keine allein angreifen würde. Die Kette wird über die Verteilung der Rest-Trefferpunkte bewertet (`chainOdds` in `rules.ts`), auf die wenigsten Angreifer gekürzt, die sich lohnen, und nach jedem Kampf neu bewertet. Eroberer gehen zuletzt.
- **Gedächtnis (`memoryRounds` 5):** Fremde Einheiten, die aus der Sicht verschwinden, bleiben bis zu 5 Runden an ihrem letzten Ort gespeichert (`ParticipantState.aiMemory`, geht nicht an Clients). Sie zählen für Stadtbedrohung und Grenze, Verfolgung, Verteidiger an Frachterzielen, Belagerung und die Wahl des Marschziels (ein erinnerter Verteidiger macht eine Stadt 2 Felder „weiter“).

Neue Kennzahl im Bericht: **Mehrfachangriffe** (Ziele, die in einem Zug von zwei oder mehr eigenen Einheiten angegriffen wurden, und davon gefallen).

| Serie | Matchup | vorher | nachher |
|---|---|---|---|
| `stufen` | schwer gegen normal | 62 % | 62 % |
| `stufen` | normal gegen leicht | 76 % | 75 % |
| `stufen` | schwer gegen leicht | 90 % | 90 % |
| `fraktionen` | Spanne der Duelle | 38–62 % | 37–63 % |
| `inseln-vorherrschaft` | schwer gegen normal | 82 %, entschieden 93–95 % | 82 %, entschieden 93–98 % |
| `inseln-vorherrschaft` | Aurelia gegen Eisenbund, Archipel entschieden | 48 % | 62 % (60 Partien, Rauschen) |
| `archipel` | schwer gegen normal | 82 % | 82 % |

Sweeps (Berichte `2026-11-06-1935-sweep-ki5-*` mit 60 Partien je Punkt, `2026-11-06-1945-sweep-ki5-*-2` mit 200):

| Subjekt gegen Referenz | ohne beides | nur Gedächtnis | nur Schwerpunkt | beides |
|---|---|---|---|---|
| normal gegen normal alt | 50 % | 52 % | 51 % | 52 % |
| schwer gegen normal | 61 % | 63 % | 64 % | 63 % |

**Befunde:**
- Beide Bausteine bewegen KI-gegen-KI-Quoten nicht messbar; alle Unterschiede liegen im 95-%-Intervall von ±7 Punkten.
- Der Schwerpunkt löst selten aus: In 20 Partien „schwer gegen normal“ 100 Ketten mit 111 Angriffen, das sind 5 % aller Angriffe. Mehrfachangriffe steigen bei „normal“ von 5,5 auf 5,8 je Partie. Die Einzelplanung greift schon nacheinander dasselbe Ziel an (der zweite Angreifer sieht den angeschlagenen Verteidiger), Panzerwagen nehmen ihre Ziele meist allein, und die Belagerung mit Übermacht deckt Städte ab.
- Das Gedächtnis wirkt vor allem gegen Einheiten, die sich in den Nebel zurückziehen. KI-Gegner tun das kaum, Menschen schon; die Simulation kann diesen Fall nicht messen.
- Zugdauer unverändert (Stufen mit 12 Workern: schwer Ø 26 → 25 ms, p95 118 → 117 ms), Budget nie erschöpft. „Schwer“ auf dem Archipel lag schon vorher bei Ø 100 ms (p95 335 ms).
- **Entscheidung:** Beide bleiben für normal und schwer eingeschaltet. Sie kosten nichts, verschlechtern keine Quote, und sie richten sich gegen Spielweisen von Menschen. Der eigentliche Hebel für Schwerpunkte wäre das Sammeln vor dem Angriff: Einheiten laufen heute einzeln an eine verteidigte Stadt heran.

## Nachmessung 6 (6. November 2026, Spec `2026-11-06-2027-ki-sammeln`)

Baustein: **Sammeln vor dem Angriff (`musterDistance`).** Eroberungseinheiten warten im Abstand `musterDistance` vor einer verteidigten fremden Stadt, bis mehr als `siegeRatio` × Verteidiger versammelt sind, und rücken dann gemeinsam an. Gewartet wird mit `skip` statt Wache, damit „normal“ die Einheit nächste Runde neu plant. Nicht gewartet wird, wenn auf der Landmasse nicht genug eigene Kampfeinheiten stehen.

Neue Kennzahl: **Verluste vor Städten** (eigene Einheiten, die im Abstand ≤ 2 einer fremden Stadt im Kampf fallen; Stadtangriffe ausgenommen). Nullmessung: „schwer“ 4,7, „normal“ 8,9 je Partie im Duell; Fraktionsduelle 6–9; Inseln 9–12.

Sweeps mit 200 Partien je Punkt (Berichte `2026-11-06-2100-sweep-ki6-*`):

| Subjekt gegen Referenz | aus | 2 | 3 | 4 |
|---|---|---|---|---|
| normal gegen normal ohne Sammeln | 50 % | 52 % | 49 % | 49 % |
| schwer gegen normal | 62 % | 61 % | 62 % | 64 % |
| Verluste vor Städten, schwer | 5,8 | 5,8 | 5,6 | 5,6 |

**Befunde:**
- Erster Durchlauf: Das Sammeln löste fast nie aus (weniger als ein Warten je Partie bei „schwer“). Landeinheiten sehen aus dem Sammelabstand nicht in die Stadt, also galt jede feindliche Stadt als unverteidigt. Korrektur: Eine feindliche Stadt außer Sicht zählt mit mindestens einem Verteidiger, eine neutrale mit keinem.
- Auch danach wartet „schwer“ nur etwa zweimal je Partie, „normal“ sechs- bis achtmal, bei rund 92 Zügen. Quoten, Angriffe, Mehrfachangriffe und Verluste vor Städten bleiben im Rauschen. Die Einheiten laufen meist auf verschiedene Ziele zu (nächste Stadt je Einheit); an einem Sammelpunkt kommen selten genug zusammen.
- **Entscheidung:** `musterDistance` steht für alle Stufen auf 0 (aus). Code und Tests bleiben als Option für Sweeps. Kontrolle: `stufen` mit Vorgabe 0 reproduziert die Nullmessung exakt (62 / 75 / 90 %).
- Zwei Blöcke in Folge ohne messbaren Effekt in KI-gegen-KI-Partien: Die Simulation stößt an ihre Grenze. Weitere Verhaltensarbeit sollte sich an echten Partien gegen Menschen ausrichten.

## Nachmessung Werte (7. November 2026, Spec `2026-11-07-1551-balance-fraktionen-einheiten`)

Ziel: Die Fraktionen sollen nur über Werte ausbalanciert werden (Fraktionsboni, Sondereinheiten, allgemeine Einheiten). Gemessen wird am Vierer aller Fraktionen auf „Mittel“, Kontinent und Inseln mit je 35 % Land, „normal“ und „schwer“, 150 Runden, Siegbedingung Rundenlimit. Mit Vorherrschaft bleiben viele Vierer am Deckel ohne Sieger. Das Ziel ist 20–30 % je Fraktion in allen vier Zellen.

Neues Werkzeug: **Katalog-Überschreibungen** in der Simulation (`catalog` in der Config, `sweep.catalogGrid`). Jeder Rasterpunkt spielt alle Matchups, die Rangliste sortiert nach der größten Abweichung vom gleichen Anteil. Details in `ki-simulation/README.md`.

**Nullmessung** (`2026-11-07-1557-fraktionen-ffa.md`, 800 Partien, 50 Seeds):

| Zelle | Eisenbund | Aurelia | Nordmark | Salzküste |
|---|---|---|---|---|
| normal, Kontinent | 28 % | 25 % | 22 % | 26 % |
| normal, Inseln | 30 % | 24 % | 24 % | 23 % |
| schwer, Kontinent | 30 % | 26 % | **18 %** | 28 % |
| schwer, Inseln | 30 % | 26 % | 22 % | 22 % |

**Sweeps** (je Punkt 320 Partien, 20 Seeds):

| Sweep | Rasterpunkt | größte Abweichung | Befund |
|---|---|---|---|
| `2026-11-07-1623-sweep-katalog-1` | Basis | 8,8 Pkt. | |
| | Eisenbund-Bonus nur für den Dampfkoloss (`minBase` 8) | 13,8–15,0 Pkt. | Eisenbund fällt mit „schwer“ auf Inseln auf 10–13 %, Aurelia steigt auf 38–39 % |
| | Wolkenkreuzer 10 statt 12 Runden | 7,5 Pkt. | wirkt nur auf „schwer“, Nordmark unverändert (24/21 %), der Rest ist Rauschen |
| `2026-11-07-1712-sweep-katalog-2` | Basis | 13,8 Pkt. | |
| | Panzerwagen 8 Runden, Stärke 5 | 10,0 Pkt. | Aurelia mit „normal“ 15–16 % |
| | Panzerwagen 9 Runden, Stärke 4 | 10,0 Pkt. | Aurelia mit „schwer“ auf Inseln 35 % |
| | Panzerwagen 8 Runden, Stärke 4 / 9 Runden, Stärke 5 | 12,5 / 13,8 Pkt. | |

**Befunde:**
- **Das Rauschen ist so groß wie die Unterschiede.** Die Basis beider Sweeps ist dieselbe Konfiguration mit anderen Seeds. Trotzdem kommt Eisenbund mit „normal“ auf dem Kontinent einmal auf 23 % und einmal auf 39 %. Die vier Sitzrotationen eines Seeds spielen auf derselben Welt, also hat eine Zelle mit 20 Seeds effektiv 20 Stichproben (±10 Punkte), mit 50 Seeds etwa ±6. Ein Sweep mit 20 Seeds kann Unterschiede von 5 Punkten nicht auflösen.
- **Die Werte geben kaum feine Stufen her.** Bauzeiten sind ganze Runden. Beim Eisenbund-Bonus gibt es praktisch nur zwei Stufen, mit Panzerwagen (7 → 6) oder ohne, und ohne kippen die Inseln zu Aurelia.
- **Der Nordmark-Bonus wirkt bei der KI auf „normal“ nicht.** „normal“ baut keine Flugzeuge, also lässt sich Nordmark dort über Luftwerte nicht anheben. Das ist eine Frage des KI-Verhaltens.
- Die Simulation ist deterministisch: Ein Rasterpunkt mit den Basiswerten ergibt exakt dieselben Partien wie die Basis, und die Überschreibung wird sauber zurückgesetzt.

**Entscheidung:** Es werden keine Werte geändert. Der Ist-Stand liegt mit 18–30 % je Fraktion im Rahmen dessen, was die Simulation unterscheiden kann. Der Katalog-Sweep bleibt als Werkzeug für künftige Regeländerungen. Feinere Balance braucht entweder deutlich mehr Seeds je Punkt (100+, etwa eine Stunde je Punkt) oder Daten aus echten Partien.

## Nachmessung Gelände (7. November 2026, Spec `2026-11-07-2050-gelaenderegeln`)

Regeländerung, keine KI-Änderung: Wald, Hügel und Gebirge beenden die Bewegung von Panzerwagen und Dampfkoloss (nicht in Städten), ihre Wegsuche weicht rauem Gelände aus; Fahrzeuge bekommen nur auf Hügeln +1 Abwehr; Landeinheiten sehen von Hügeln und Gebirge 2 Felder; Tauchboote sind im Flachwasser sichtbar. Die KI nutzt die neuen Regeln über `findPath`, `reachableTiles` und `attackTargets` ohne eigene Anpassung.

| Serie | Matchup | vorher | nachher |
|---|---|---|---|
| `stufen` | schwer gegen normal | 62 % | 58 % |
| `stufen` | normal gegen leicht | 75 % | 75 % |
| `stufen` | schwer gegen leicht | 90 % | 92 % |
| `fraktionen` | Spanne der Duelle | 37–63 % | 41–59 % |
| `inseln-vorherrschaft` | schwer gegen normal | 82 %, entschieden 93–98 % | 77 %, entschieden 88–92 % |
| `inseln-vorherrschaft` | Aurelia gegen Eisenbund | 37 : 37 % | 32 : 35 % |

Vierer (`2026-11-07-2116-fraktionen-ffa.md`, 800 Partien, dieselben 50 Seeds wie die Nullmessung):

| Zelle | Eisenbund | Aurelia | Nordmark | Salzküste |
|---|---|---|---|---|
| normal, Kontinent | 31 % (28) | 25 % (25) | 20 % (22) | 25 % (26) |
| normal, Inseln | 31 % (30) | 25 % (24) | 22 % (24) | 23 % (23) |
| schwer, Kontinent | 32 % (30) | 23 % (26) | 20 % (18) | 26 % (28) |
| schwer, Inseln | 26 % (30) | 31 % (26) | 23 % (22) | 22 % (22) |

**Befunde:**
- Alle Verschiebungen liegen im Rauschen (±5 Punkte in den Duellen, ±6 je Vierer-Zelle). Die Fraktionsduelle sind enger als vorher; Nordmark auf „schwer“, Kontinent ist von 18 auf 20 % gestiegen.
- „schwer“ verliert gegen „normal“ etwas (62 → 58 % auf dem Kontinent, 82 → 77 % mit Vorherrschaft), Partien bleiben etwas häufiger am Rundendeckel hängen (entschieden 88–92 statt 93–98 %). Plausibel: Die Panzerwagen-Offensive von „schwer“ kommt im Gelände langsamer voran, und Verteidiger auf Höhen sehen sie früher.
- Zugdauer gestiegen (Stufen Ø 41 → 56 ms je KI-Zug, Inseln „schwer“ p95 289 → 408 ms), weit unter dem Budget von 10 s, nie erschöpft. Die Stufen-Serie lief teilweise parallel zu Dev-Server und Browser, der Anstieg ist also eine Obergrenze; Ursache sonst die gewichtete Wegsuche für Fahrzeuge.
- **Entscheidung:** Keine Nachjustierung. Die Regeln verschieben keine Quote über das Rauschen hinaus; was sie für Menschen ändern (Routenwahl, Höhen besetzen, Tauchboote an Küsten), misst die Simulation nicht.

## Was die Simulation noch nicht misst

- Spielspaß und Druck auf einen Menschen: KI gegen KI misst nur relative Stärke. Nächster Schritt sind Sparringsgegner mit festem Verhalten (passiv, reiner Expandierer, Rusher), gegen die jede Stufe eine Zielquote hat.
- Verhalten mit Transporten und Flugzeugen, weil die KI beides nicht nutzt; sobald B4/B5 umgesetzt sind, braucht die Serie Karten mit mehreren Inseln.
- Die Zugdauer bleibt unkritisch (Ø 10–30 ms, p95 bis 0,5 s bei 80 Einheiten auf „Groß“), ist aber mit `turnMs` je Zug in den Rohdaten für größere Karten (Roadmap 1c Punkt 3) vorbereitet.

## Vorschlag für die Folge-Spec

Reihenfolge nach Wirkung je Aufwand: A1 und A2 (Parameter, eine Stunde, sofort messbar), C1, dann B1 (Ertragsbewertung statt Schwelle, löst Salzküste und Ostrow), dann Neuplanung von Wache-Einheiten und Stadtverteidigung als Bausteine für „schwer“, zuletzt B4/B5 (Transporte, Flugzeuge) als eigener Block. Nach jedem Schritt: `pnpm sim --config packages/sim/configs/stufen.json` und `fraktionen.json`, Ziele wie in `ki-simulation/README.md`.
