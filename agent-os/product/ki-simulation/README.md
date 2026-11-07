# KI-Simulation: Berichte

Stand: 1. November 2026. Werkzeug und Entscheidungen: `agent-os/specs/2026-11-01-1326-ki-simulation/`. Befunde und Maßnahmen je Stufe und Fraktion: `../ki-balance.md`.

## Aufruf

```bash
pnpm sim --config packages/sim/configs/<serie>.json [--seeds n] [--workers n] [--dry-run]
pnpm sim sweep --config packages/sim/configs/sweep-normal.json
pnpm sim bench
```

Jeder Lauf schreibt `games.jsonl` (eine Zeile je Partie) und `summary.json` nach `packages/sim/results/<datum>-<name>/` (nicht im Git) und einen Bericht `<datum>-<name>.md` in diesen Ordner. Rohdaten lassen sich mit jedem JSON-Werkzeug nachrechnen; `summary.json` enthält auch die vollständigen Kurven je Runde.

## Serien

Alle Serien: Karte „Mittel“ 18×12, Land 55 %, neutrale Städte und Gelände normal (Serie A zusätzlich „Klein“, FFA auf „Groß“), Sitzreihenfolge rotiert, Rundenlimit 100, Siegbedingung Rundenlimit (Punkte: Städte × 3 + Einheiten).

| Serie | Config | Matchups | Partien | Ziel |
|---|---|---|---|---|
| A Stufen | `stufen.json` | Spiegel Eisenbund ohne Persönlichkeit: hard–normal, normal–easy, hard–easy | 100 Seeds × 2 Sitze × 2 Karten = 400 je Matchup | hard gegen normal ≥ 65 % (untere Intervallgrenze > 55 %), normal gegen easy ≥ 65 %, hard gegen easy ≥ 80 %; weniger als die Hälfte der Partien endet am Rundenlimit |
| B Fraktionen | `fraktionen.json`, `fraktionen-ffa.json` | normal ohne Persönlichkeit, alle 6 Paarungen; 4er-FFA aller Fraktionen | 50 × 2 = 100 je Paar; FFA 50 × 4 = 200 | Paarungen 40–60 %, FFA je Fraktion 15–35 %, Sitzvorteil innerhalb ±10 % |
| C Persönlichkeiten | `persoenlichkeiten.json` | jede der 7 Persönlichkeiten (normal, eigene Fraktion) gegen normal ohne Persönlichkeit derselben Fraktion | 50 × 2 = 100 je Matchup | keine Persönlichkeit unter 35 % oder über 65 % |
| D Sweep normal | `sweep-normal.json` | `attackThreshold` 0,45/0,55/0,65 × `neutralBias` 0/3 × `shipShare` 0/0,35 × `garrison` aus/an gegen normal ohne Override, Spiegel Eisenbund | 24 Punkte + Basis, je 30 × 2 = 60 | Rangliste der Parameter; Grundlage für die Spreizung der Stufen |
| F Inseln | `inseln.json`, `inseln-ohne.json` | schwer gegen normal und Aurelia gegen Eisenbund auf „Mittel“, Weltform Inseln, 35 % Land, 150 Runden, einmal mit und einmal ohne Transporte und Flugzeuge | 50 × 2 = 100 je Matchup | Transporte erhöhen Ausschaltungen und feindliche Eroberungen |
| H Inselwelt | `inselwelt.json`, `archipel.json` | schwer gegen normal, Aurelia gegen Eisenbund und ein Vierer mit Varenne, Kessler, Brandt, Ostrow auf Inseln (35 %, 150 Runden); Archipel schwer gegen normal | 50 × 2 bzw. 50 × 4; Archipel 30 × 2 | KI kommt mit echten Inseln zurecht: Ausschaltungen ≥ 40 %, Frachter und Landungen bei jedem Label, Aurelia 40–60 % |
| G Sparring | `sparring.json` | jede Stufe (Eisenbund) gegen fünf Gegner mit festem Verhalten: „passiv“ (greift kaum an, keine Belagerung), „expander“ (nimmt neutrale Städte zuerst, belagert nicht), „rusher“ (Schwelle 0,35, belagert 1:1, kaum Panzer), „turtle“ (Garnison überall, Stadtverteidigung, keine Belagerung), „navy“ (zwei Frachter, Schiffe, Bomber, Tauchboote) | 50 × 2 = 100 je Matchup | beschreibt, wie eine Stufe auf typische Spielweisen reagiert; leicht soll gegen alle verlieren, schwer gegen alle gewinnen |
| E Sweeps schwer und leicht | `sweep-hard.json`, `sweep-easy.json` | „schwer“ bzw. „leicht“ mit Overrides gegen normal ohne Override, Spiegel Eisenbund | 24 + 1 bzw. 9 + 1 Punkte, je 60 | Parameterwerte, mit denen „schwer“ ≥ 65 % und „leicht“ 15–30 % erreicht |

## Ergebnisse

Erste Läufe am 1. November 2026: Serie A `2026-11-01-1326-stufen.md`, B `2026-11-01-1327-fraktionen.md` und `2026-11-01-1328-fraktionen-ffa.md`, C `2026-11-01-1332-persoenlichkeiten.md`, D `2026-11-01-1334-sweep-normal.md`, E `2026-11-01-1340-sweep-hard.md` und `2026-11-01-1346-sweep-easy.md`. Befunde und Maßnahmen: `../ki-balance.md`.

Nachmessung nach der Spec „KI-Regeln je Stufe und Fraktion“ (`agent-os/specs/2026-11-01-1358-ki-regeln/`) am selben Tag: `2026-11-01-1359-stufen.md`, `2026-11-01-1405-fraktionen.md`, `2026-11-01-1405-fraktionen-ffa.md`, `2026-11-01-1411-persoenlichkeiten.md` (`2026-11-01-1407-persoenlichkeiten.md` ist der Zwischenstand mit Garnison in allen Städten). Vorher und Nachher nebeneinander in `../ki-balance.md`, Abschnitt „Nachmessung“.

Zweiter Block (`agent-os/specs/2026-11-01-1430-ki-verhalten-2/`): Zwischenstände `2026-11-01-1440-stufen.md` (Belagerung ohne Übermacht), `2026-11-01-1446-stufen.md` und `2026-11-01-1454-stufen.md` (mit Aufklärern für alle), Sweeps `2026-11-01-1451-sweep-hard-2.md`, `2026-11-01-1503-sweep-hard-3.md`, `2026-11-01-1505-sweep-hard-4.md`, Inseln `2026-11-01-1449-inseln.md`, `2026-11-01-1451-inseln-ohne.md`; Endstand `2026-11-01-1515-stufen.md`, `2026-11-01-1509-fraktionen.md`, `2026-11-01-1510-fraktionen-ffa.md`, `2026-11-01-1514-persoenlichkeiten.md`, `2026-11-01-1513-inseln.md`. Auswertung in `../ki-balance.md`, Abschnitt „Nachmessung 2“.

Dritter Block (`agent-os/specs/2026-11-01-1530-ki-verhalten-3/`): Zwischenstände `2026-11-01-1544-stufen.md` (Reparatur ohne Sondereinheiten), `2026-11-01-1556-stufen.md`, `2026-11-01-1547-sparring.md` und `2026-11-01-1558-sparring.md`; Sweeps `2026-11-01-1552-sweep-hard-5.md`, `2026-11-01-1554-sweep-easy-2.md`; Endstand `2026-11-01-1601-stufen.md`, `2026-11-01-1538-fraktionen.md`, `2026-11-01-1550-fraktionen-ffa.md`, `2026-11-01-1554-persoenlichkeiten.md`, `2026-11-01-1602-inseln.md`, `2026-11-01-1603-sparring.md`. Auswertung in `../ki-balance.md`, Abschnitt „Nachmessung 3“.

Vierter Block (`agent-os/specs/2026-11-01-1610-ki-verhalten-4/`): Sweep `2026-11-01-1659-sweep-hard-6.md`; Endstand `2026-11-01-1700-stufen.md`, `2026-11-01-1701-inseln.md`, `2026-11-01-1701-sparring.md`. Auswertung in `../ki-balance.md`, Abschnitt „Nachmessung 4“.

## Kartengrößen

Berichte bis `2026-11-01-1701-*` stammen von den alten Stufen (Mittel 18×12). Seit der Kartengrößen-Spec heißt Mittel 40×40 und Klein 20×20; `2026-11-01-1743-stufen.md` ist der erste Lauf auf den neuen Größen (Befund in `../ki-balance.md`, Abschnitt „Prüfung nach der Kartengrößen-Spec“). `inseln.json` und `inseln-ohne.json` laufen jetzt auf Mittel mit 30 % Land, weil Groß (75×75) für Serien zu lange rechnet. Faustregel für Laufzeiten: Mittel rund 10 s je 100-Runden-Partie, Klein 2 s.

Inselwelt-Spec (`agent-os/specs/2026-11-01-1830-inselwelt/`): erste Läufe auf echten Inseln `2026-11-01-1901-inselwelt.md`, `2026-11-01-1910-inseln.md`, `2026-11-01-1913-inseln-ohne.md`, `2026-11-01-1914-archipel.md`; nach der Seeaufklärer-Regel `2026-11-01-1936-stufen.md` (Kontinent-Gegenprobe), `2026-11-01-1942-inseln.md`, `2026-11-01-1946-inselwelt.md`. Auswertung in `../ki-balance.md`, Abschnitt „Nachmessung Inselwelt“.

Inselbalance und Tarnung (`agent-os/specs/2026-11-01-2015-inselbalance-tarnung/`): Sweeps `2026-11-01-2109-sweep-transporte-hard.md`, `2026-11-01-2113-sweep-transporte-normal.md`; Endstand `2026-11-01-2116-inseln.md`, `2026-11-01-2118-inselwelt.md`, `2026-11-01-2126-stufen.md`, `2026-11-01-2132-fraktionen.md`. Auswertung in `../ki-balance.md`, Abschnitt „Nachmessung Inselbalance“.

## Welten vermessen

`pnpm sim maps --shape islands|archipelago|continent --sizes small,medium,large --shares 20,35,50 --seats 2,4,6 --seeds 30` erzeugt Welten und zählt je Zelle: Hauptstädte auf getrennten Landmassen, Hauptstädte an der Küste, Heimatmasse min/Ø/max gegen das Ziel aus `islandTargets`, neutrale Inseln ab 6 Feldern, Städte gegen die Dichte, erreichter Landanteil, ms je Welt. Messwerte der Inselwelt-Spec in `agent-os/specs/2026-11-01-1830-inselwelt/shape.md`.

## Kataloge rastern

Spielwerte lassen sich ohne Änderung an `compendium/data.json` überschreiben. Die Schlüssel sind Pfade, die Werte Zahlen:

```json
"catalog": { "units.panzerwagen.productionTurns": 8, "factions.nordmark.modifier": 2 }
```

- `units.<id>.<wert>` mit `strength`, `defense`, `hitPoints`, `damage`, `movement`, `range`, `capacity`, `productionTurns`; `factions.<id>.<feld>` mit `modifier` und `minBase` des Fraktionsbonus.
- `catalog` gilt auf oberster Ebene für alle Matchups und im Matchup nur für dieses. Der Worker patcht die Werte je Partie an Ort und Stelle (`packages/sim/src/catalogOverride.ts`) und setzt sie danach zurück.
- Katalog-Sweep: `"sweep": { "catalogGrid": { "<pfad>": [werte], … } }` zusammen mit normalen `matchups`. Jeder Rasterpunkt spielt alle Matchups, `sweep-0` ist die Basis. Der Bericht sortiert nach der größten Abweichung einer Siegquote vom gleichen Anteil (1 / Sitze) über alle Zellen (Matchup × Karte) und zeigt eine Quotentabelle je Zelle. Beispiele: `sweep-katalog-1.json`, `sweep-katalog-2.json`.
- Seeds werden aus dem Config-Namen gebildet. Zwei Sweeps mit verschiedenen Namen spielen also verschiedene Welten, und ihre Basis ist nicht vergleichbar. Innerhalb eines Sweeps spielen alle Punkte dieselben Welten.
- Genauigkeit: Die Sitzrotationen eines Seeds spielen auf derselben Welt. Effektiv zählt eine Zelle so viele Stichproben wie Seeds, bei 20 Seeds also etwa ±10 Punkte im Vierer.

Der Vierer `fraktionen-ffa.json` läuft seit dem 7. November 2026 auf „Mittel“, Kontinent und Inseln mit 35 % Land, „normal“ und „schwer“ als eigene Matchups, 150 Runden, Siegbedingung Rundenlimit. Eine Partie dauert etwa 60 s, 800 Partien mit 30 Workern rund 25 Minuten. Auswertung in `../ki-balance.md`, Abschnitt „Nachmessung Werte“.

## Lesart der Berichte

- **Quote und 95 %-Intervall:** Siegquote mit Wilson-Intervall. Überlappen sich die Intervalle zweier Seiten deutlich, ist der Unterschied nicht belegt. Rotationen desselben Seeds sind korreliert, die Intervalle also etwas zu eng.
- **Sitzvorteil:** Siegquote je Sitz über alle Partien eines Matchups. Weicht Sitz 1 deutlich ab, hat der Startspieler einen Vorteil, unabhängig von Stufe oder Fraktion.
- **Ø 1. Eroberung:** mittlere Runde der ersten eigenen Eroberung und Anteil der Partien mit mindestens einer Eroberung. Spätere Eroberungen bei gleicher Stufe deuten auf Karten- oder Startnachteile.
- **Kämpfe:** „gewonnen“ ist der Anteil der Angriffe, die den Verteidiger vernichtet oder die Stadt erobert haben. Bei Stadtangriffen wird die angreifende Einheit immer verbraucht und zählt unter „Einheiten verloren“.
- **Produktion und Befehle je Zug:** Was die Städte fertigstellen und wie viele Befehle die KI je Zug erteilt. Wenige Befehle bei vielen Einheiten heißt: Einheiten stehen auf Wache oder Dauerbefehl und werden nicht neu geplant.
- **Verlauf:** Städte und Einheiten im Mittel alle zehn Runden; zeigt, wann sich eine Partie entscheidet und ob die Expansion stockt.

## Laufzeit (Bench, 1. November 2026)

Drei KIs auf „Mittel“, Rundenlimit 100, Hauptthread: 8–25 ms je Runde, 2,6–10,7 ms je KI-Zug, 3–6 Befehle je Zug, längster Zug 87 ms, Spielstand nach 100 Runden rund 350 KiB mit 173 Einheiten und 1 160 Ereignissen. Eine 100-Runden-Partie dauert rund 3 s; 1 000 Partien laufen mit 28 Workern in wenigen Minuten.
