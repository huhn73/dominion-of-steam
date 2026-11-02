# Echte Inselwelt: Shaping-Notizen

## Umfang

Neue Karteneinstellung **Weltform** mit `continent` (wie heute, bleibt Vorgabe), `islands` und `archipelago` im Kartengenerator, im Partie-Setup, auf dem Server, in der Lobby und in der Simulation. Der Landanteil-Regler bleibt und steuert bei Inseln deren Größe. Demo-Partie unverändert. Zielbild: verstreute Inseln, viel Wasser, Küstenstädte.

## Fragen aus dem Shaping (Spieler, 1. November 2026)

- **Auswahl:** eigene Option „Weltform“ (gewählt). Verworfen: automatisch nach Landanteil; immer Inseln.
- **Garantien bei Inseln:** keine zwei Hauptstädte auf derselben Landmasse; Heimatinsel mit Platz für 3–5 Städte; neutrale Inseln dazwischen; ähnlich große Heimatinseln (alle gewählt).
- **Reichweite:** Setup, Simulation, Standards; Vorgabe bleibt Kontinent (gewählt). Verworfen: Inseln als Vorgabe; nur Generator und Simulation.

## Entscheidungen

- **Hybrid aus Kuppeln und Meerengen-Band.** Heimat- und Neutralinseln sind radiale Kuppeln um gesetzte Zentren (Plateau 1,3, Saum fällt auf 0,4, Meeresgrund aus Rauschen ≤ 0,2). Die Trennung garantiert ein erzwungenes Wasserband entlang der Voronoi-Grenzen der Heimatzentren: `d2 − d1 + warp·(2·coarse − 1) < strait` ⇒ Wasser. Die Bänder zerlegen das Brett in `seats` Zellen; Land auf verschiedenen Seiten kann nie benachbart sein. Damit die Meerengen nicht als gerades Gitter laufen, werden die Abstände an einer per Domain-Warp verschobenen Position berechnet (zwei niederfrequente Rauschfelder, Amplitude 12 % der Kartenseite, Zellgröße ein Fünftel der Seite); die Steigung des Warps bleibt deutlich unter 1, damit der Wasserabstand im echten Brett erhalten bleibt, und das Sicherheitsnetz prüft die Trennung ohnehin nach. Verworfen: reine Voronoi-Zellen mit Wassersaum (polygonal, teuer auf Imperium); Kuppeln mit nachträglichem Kappen von Engstellen (nicht sauber deterministisch).
- **Rangschwelle bleibt:** Nach der Höhenkarte werden wie heute die obersten `landShare %` der Innenfelder Land (ohne Bandfelder). Bei hohem Landanteil wachsen Inseln zu einem zerklüfteten Kontinent zusammen; das Band bleibt Wasser, die Hauptstädte getrennt.
- **Heimatzentren per Dart-Throwing** mit Zieldistanz `max(2·R + strait + 2·rim + 2, 0,8·L/√seats)`, bis 400 Würfe je Stufe, dann Distanz ×0,9 bis zur Untergrenze, dann Heimatinsel ×0,8 (nur Klein mit 5–6 Sitzen); Notnagel: Farthest-Point ohne Abstandsregel. Verworfen: reiner Farthest-Point (Zentren in den Ecken).
- **Neutrale Inseln** aus dem Restbudget (`Land − seats·homeTiles`): Größen gleichverteilt zwischen `neutralMin` und `min(neutralMax, Zellfläche/12)`, bis 60 Würfe, räumlicher Hash; Abstand zu Heimatzentren `R_home + r + rim + 1`, untereinander `r_a + r_b + rim + 1`, Zentrum außerhalb des Bandes (`d2 − d1 ≥ strait + warp`; eine Insel, die das Band streift, wird zwei). Ein zweiter Durchgang verteilt übriges Budget als Inselchen (6–15 Felder), damit es nicht die Heimatinseln aufbläht. Das Budget wird nur für gesetzte Inseln belastet.
- **Hauptstadt je Zelle:** auf der Landmasse des Zentrums (sonst der größten Masse der Zelle), bebaubar, mindestens zwei bebaubare Nachbarn, **an der Küste** (Seeeinheiten entstehen nur in Küstenstädten), nächster Platz zum Zentrum; Fallback-Kette bis zu einem beliebigen Landfeld der Masse; Notnagel die Kontinentregel. Sicherheitsnetz: teilen zwei Hauptstädte eine Masse, wird das Band um 1 verbreitert (bis 3×); die Tests zeigen, dass es nie greift.
- **Städte in zwei Phasen:** Jede Heimatinsel bekommt `round(Größe/35)` Städte (höchstens 4; Archipel /25, höchstens 2), jede neutrale Insel ab der Mindestgröße der Stufe eine, ab 40 Feldern zwei (Archipel 30); danach wie heute bis zur Dichte `Land / (45|30|20)`. Namen werden erst nach dem Setzen gezogen. Beim Kontinent entfällt Phase 1, der Pfad ist byte-identisch (goldene Hashes in `inselwelt.test.ts`).
- **Datenmodell:** `worldShape?: 'continent' | 'islands' | 'archipelago'`, überall optional mit Vorgabe Kontinent (Engine, Setup, Validierung, Server inklusive alter JSONB-Zeilen, Lobby-Info, Simulation). Eine Quelle `game/worldShapes.ts`. Der Kartencode erhält `:${shape}` nur bei abweichender Weltform, bestehende Kartencodes bleiben gleich.
- **Oberfläche:** `Segmented` „Weltform“ zwischen Kartengröße und Landanteil mit Erklärung; bei Inseln ein Hinweis unter dem Regler, beim Archipel der Hinweis auf 20–30 % Land (bei 35 % auf „Mittel“ passen so viele kleine Inseln nicht mehr aufs Brett, sie wachsen zu Klumpen zusammen); Regler-Endlabels „Wenig Land“/„Viel Land“ statt „Inselwelt“/„Kontinente“. Zusammenfassung, Warteraum und Partiedialog zeigen die Weltform, wenn sie nicht Kontinent ist. DevBar mit Auswahl.
- **Messwerkzeug:** `pnpm sim maps --shape … --sizes … --shares … --seats … --seeds …` vermisst Welten (Trennung, Küste, Heimatgrößen gegen Ziel, neutrale Inseln, Städte, Landanteil, ms) und ersetzt das Ad-hoc-Skript.

## Parameter

| Parameter | islands | archipelago |
|---|---|---|
| Heimatinsel: Anteil am Land je Sitz / min / max | 0,55 / 60 / 150 Felder | 0,30 / 25 / 50 |
| Neutrale Inseln | 15–50 Felder (gedeckelt auf Zellfläche/12) | 8–25 |
| Saumbreite `rim` | 1,5 | 1,2 |
| Meerenge `strait` (Klein) | 3 (2,5) | 3 (2,5) |
| Rauschanteil der Bandbreite `warp` | 1,0 | 1,0 |
| Domain-Warp der Meerengen | 12 % der Kartenseite, Zelle Seite/5 | gleich |
| Mindestinsel für eine Stadt (wenig/normal/viel) | 20 / 12 / 8 | 14 / 10 / 8 |
| Zweite Stadt ab | 40 | 30 |
| Städte je Heimatinsel | Größe/35, höchstens 4 | Größe/25, höchstens 2 |

## Messwerte (`pnpm sim maps`, 30 Seeds je Zelle)

Hauptstädte getrennt und an der Küste: 30 von 30 in allen 54 Zellen (Klein, Mittel, Groß × 20/35/50 % × 2/4/6 Sitze) für beide Weltformen, dazu Riesig und Imperium mit sechs Sitzen.

| Weltform, Stufe, Land, Sitze | Heimat min/Ø/max (Ziel) | neutrale Inseln ≥ 6 Felder | Städte | ms |
|---|---|---|---|---|
| Inseln, Mittel, 35 %, 2 | 117/150/200 (150) | 11,0 | 19 | 6 |
| Inseln, Mittel, 35 %, 4 | 61/89/143 (77) | 10,5 | 19 | 6 |
| Inseln, Mittel, 35 %, 6 | 41/77/154 (60) | 5,2 | 19 | 5 |
| Inseln, Groß, 35 %, 4 | 125/140/234 (150) | 55 | 71 | 13 |
| Inseln, Groß, 20 %, 6 | 88/97/108 (103) | 16 | 39 | 8 |
| Inseln, Riesig, 35 %, 6 | 125/139/175 (150) | 194 | 220 | 77 |
| Inseln, Imperium, 35 %, 6 | 132/155/230 (150) | 427 | 521 | 114 |
| Archipel, Mittel, 35 %, 4 | 39/79/200 (42) | 12 | 21 | 6 |
| Archipel, Groß, 20 %, 6 | 38/48/55 (50) | 51 | 59 | 9 |
| Archipel, Groß, 35 %, 4 | 46/79/253 (50) | 78 | 90 | 17 |

Grenzen: Bei 50 % Land verschmelzen die Inseln zu einem zerklüfteten Kontinent (Heimatmassen auf Groß bis 1 100 Felder), die Hauptstädte bleiben getrennt. Klein (400 Felder) hat mit vier und sechs Sitzen keine neutralen Inseln mehr und Heimatinseln von 4–57 Feldern; bei 50–70 % Land und sechs Sitzen sind nur 46–48 % Land erreichbar, weil die Meerengen ein Viertel des Bretts einnehmen.

## Kontext

- **Visuals:** `visuals/` (Screenshots der Umsetzung).
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c Punkt 3 (Nachtrag Landanteil) und Punkt 10; Festlegung des Spielers vom 1. November 2026: sinnvoller Landanteil 20–40 %, Hauptstädte zufällig verteilt.

## Angewandte Standards

Noch keine, siehe `standards.md`.
