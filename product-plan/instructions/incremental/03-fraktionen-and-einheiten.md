# Meilenstein 3: Fraktionen & Einheiten

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** Meilenstein 1 (Shell) abgeschlossen, dazu alle vorherigen Bereichs-Meilensteine

---

## Über diese Übergabe

**Was du bekommst:**
- Fertige UI-Designs (React-Komponenten mit vollständigem Styling)
- Produktanforderungen und Ablaufbeschreibungen
- Design-Tokens (Farben, Schriften)
- Beispieldaten, die die Datenform der Komponenten zeigen
- Test-Spezifikationen für das Verhalten aus Nutzersicht

**Deine Aufgabe:**
- Die Komponenten in deine Anwendung integrieren
- Die Callback-Props mit Routing und Geschäftslogik verbinden
- Beispieldaten durch echte Daten aus dem Backend ersetzen
- Lade-, Fehler- und Leerzustände umsetzen

Die Komponenten sind props-basiert: Sie bekommen Daten und lösen Callbacks aus. Wie Backend, Datenschicht und Geschäftslogik aufgebaut werden, entscheidest du.

---

## Ziel

Das Nachschlagewerk „Fraktionen & Einheiten“ (Navigationspunkt „Fraktionen“) umsetzen: ein Kompendium aller Fraktionen und Einheitentypen mit Detailansichten für jede Fraktion und jede Einheit.

## Überblick

Spieler lesen hier vor und während einer Partie nach, welche Fraktion welche Eigenheit hat, wie stark eine Einheit ist und wie man sie einsetzt. Die Übersicht zeigt Fraktionskarten und eine filterbare Einheitenliste. Die Fraktionsansicht erzählt die Geschichte, erklärt den Bonus und zeigt alle baubaren Einheiten mit den Werten, die der Bonus verändert. Die Einheitenansicht zeigt Illustration, Typenschild (mit Fraktionsbonus) und Taktik-Tipps und lässt bei allgemeinen Einheiten zwischen den Ausführungen der Fraktionen wechseln. Der Bereich ist rein lesend.

**Kernfunktionen:**
- Fraktionskarten mit Wappen, Leitspruch, Eigenheit und Spielstil-Schlagworten
- Einheitenliste mit Filtern nach Einsatzgebiet (Alle, Land, See, Luft) und Herkunft, Trefferzähler und leerem Zustand
- Fraktionsansicht mit Sondereinheit (oder Hinweis „Keine Sondereinheit“) und Markierung der durch den Fraktionsbonus veränderten Werte
- Einheitenansicht mit Typenschild (Balken relativ zum Höchstwert aller Einheiten, Fraktionsbonus markiert), Eroberungsfähigkeit und nummerierten Taktik-Tipps
- Ausführungs-Umschalter für allgemeine Einheiten, Vorauswahl der Fraktion, aus der man kommt; der Bonus der gewählten Ausführung wird angewendet
- Bild-Rückfallkette: Fraktionsvariante → neutrales Bild → gezeichneter Platzhalter

## Enthaltene Komponenten

Kopiere die Komponenten aus `product-plan/sections/fraktionen-and-einheiten/components/`:

- `FraktionenUndEinheiten.tsx` – Übersicht („Kompendium“)
- `FraktionDetail.tsx` – Fraktionsansicht
- `EinheitDetail.tsx` – Einheitenansicht
- `UnitRow.tsx` – Einheitenzeile mit Kennzahlen und optionaler Bonusmarkierung (bei Reichweitenbonus zusätzliches Kästchen „RW“)
- `FactionEmblem.tsx` – Wappen bzw. SVG-Schild-Platzhalter
- `unitIcons.tsx` – `UnitIcon`, Linien-Symbole je Einheitentyp
- `theme.ts` – `FACTION_HEX`, `DOMAIN_LABEL`, `bonusEffect()`
- `useImageLoaded.ts` – `useFirstLoadedImage`, `useImageLoaded`
- `index.ts` – Exporte

Die Typen liegen in `product-plan/sections/fraktionen-and-einheiten/types.ts`.

## Props-Referenz

**Daten-Props:**

- `FraktionenUndEinheitenProps`: `factions: Faction[]`, `unitTypes: UnitType[]`
- `FraktionDetailProps`: `faction: Faction`, `unitTypes: UnitType[]` (alle; die Ansicht wählt Sondereinheit und allgemeine Einheiten selbst aus)
- `EinheitDetailProps`: `unitType: UnitType`, `faction: Faction | null` (nur bei Sondereinheiten gesetzt), `factions: Faction[]` (für den Ausführungs-Umschalter), `initialVariantFactionId?: string | null`, `unitTypes: UnitType[]` (für die Skalierung der Balken)

`Faction` enthält Name, Kurzname, Leitspruch, `color`, `emblemUrl`, `heroImageUrl`, `trait`, `bonus` (`FactionBonus`: `label`, `description`, `domain`, `stat`, `modifier`, `mode`), `playstyle`, `playstyleSummary`, `history` und `specialUnitTypeId`. `UnitType` enthält Einsatzgebiet, Werte, `range` (nur Luft), `capacity`/`cargoDomain`, `productionTurns`, `factionId`, `canCaptureCities`, `description`, `tactics`, `illustrationUrl` und `variantIllustrationUrls`.

**Callback-Props:**

| Callback | Ausgelöst wenn |
|---|---|
| `FraktionenUndEinheiten.onSelectFaction(factionId)` | Eine Fraktionskarte angetippt wird |
| `FraktionenUndEinheiten.onSelectUnitType(unitTypeId)` | Eine Einheitenzeile in der Übersicht angetippt wird |
| `FraktionDetail.onSelectUnitType(unitTypeId, factionId)` | Die Sondereinheit-Karte oder eine allgemeine Einheit in der Fraktionsansicht angetippt wird; `factionId` ist die angezeigte Fraktion |
| `FraktionDetail.onBack()` | „Zurück“ im Kopfbereich angetippt wird |
| `EinheitDetail.onSelectFaction(factionId)` | Bei einer Sondereinheit „Sondereinheit von <Fraktion>“ angetippt wird |
| `EinheitDetail.onBack()` | „Zurück“ angetippt wird |

## Erwartete Abläufe

### Ablauf 1: Fraktion nachschlagen

1. Der Spieler wählt „Fraktionen“ in der Navigation.
2. Er sieht „Fraktionen & Einheiten“ mit vier Fraktionskarten und tippt „Aurelische Republik“ an.
3. Die Fraktionsansicht zeigt Leitspruch, „Geschichte“, „Eigenheit“ („Seemacht“, „Wirkt auf Seeeinheiten · Bewegung“), „Spielstil“ und „Einheiten“ mit der Sondereinheit Blitzkorvette.
4. „Zurück“ führt zurück.

**Ergebnis:** Die Fraktionsansicht ist direkt adressierbar (z. B. `/fraktionen/aurelia`), und „Zurück“ kehrt zur vorherigen Ansicht zurück.

### Ablauf 2: Einheiten filtern

1. In der Übersicht wählt der Spieler unter „Einsatzgebiet“ „Luft“.
2. Der Zähler zeigt „3 von 12 Typen“.
3. Unter „Herkunft“ wählt er „Sondereinheiten: Eisenbund von Valdrin“.
4. Es erscheint „Keine Einheiten gefunden“; er tippt „Filter zurücksetzen“.

**Ergebnis:** Beide Filter stehen wieder auf „Alle“, alle 12 Einheitentypen sind sichtbar.

### Ablauf 3: Einheit aus einer Fraktion öffnen und Ausführungen vergleichen

1. In der Fraktionsansicht des Eisenbunds sieht der Spieler bei Grenadiere „BAU 4 → 3“ und die Legende „Durch „Schwerindustrie“ veränderter Wert“.
2. Er tippt Grenadiere an; `onSelectUnitType("grenadiere", "eisenbund")` wird ausgelöst.
3. Die Einheitenansicht öffnet mit vorausgewählter Ausführung „Eisenbund“; die Kachel „Bauzeit“ zeigt „4“ durchgestrichen und „3“ in Amber, darunter „Hervorgehoben: durch „Schwerindustrie“ (Eisenbund) veränderter Wert.“
4. Er wechselt auf „Nordmark“; Bild und Akzentfarbe wechseln, und weil der Nordmark-Bonus nur Lufteinheiten betrifft, zeigt „Bauzeit“ wieder den Grundwert 4.
5. „Zurück“ führt zur Fraktionsansicht.

**Ergebnis:** Die gewählte Ausführung ist lokaler Zustand; die Rückkehr landet in der Fraktion, aus der er kam.

### Ablauf 4: Von der Sondereinheit zur Fraktion

1. In der Übersicht tippt der Spieler „Wolkenkreuzer“ (Stempel „Sondereinheit · Nordmark“) an.
2. Die Einheitenansicht zeigt keinen Ausführungs-Umschalter, aber „Sondereinheit von Nordmark-Kollektiv“.
3. Ein Tipp darauf löst `onSelectFaction("nordmark")` aus.

**Ergebnis:** Die Fraktionsansicht des Nordmark-Kollektivs öffnet sich.

## Leere Zustände

- **Filter ohne Treffer:** „Keine Einheiten gefunden“ / „Für diese Kombination aus Einsatzgebiet und Herkunft gibt es keinen Einheitentyp.“ mit Button „Filter zurücksetzen“. Tritt mit den Beispieldaten z. B. bei „Sondereinheiten: Salzküsten-Liga“ immer auf.
- **Fraktion ohne Sondereinheit:** Kasten „Keine Sondereinheit“ mit „Die Stärke der <Name> liegt nicht in einer besonderen Einheit. <trait>“.
- **Einheit ohne Taktik-Tipps:** Abschnitt „Taktik“ wird ausgeblendet.
- **Einheit ohne Varianten:** kein Ausführungs-Umschalter.
- **Fehlende Bilder:** SVG-Wappen, Farbverlauf statt Kopfbild, Symbol-Siegel bzw. Blaupause statt Illustration.
- **Laden/Fehler:** Die Komponenten haben keinen eigenen Lade- oder Fehlerzustand. Solange Fraktionen und Einheitentypen laden, einen eigenen Zustand zeigen (leere Arrays würden „0 Mächte …“ und „Keine Einheiten gefunden“ anzeigen). Unbekannte IDs in der URL (`/fraktionen/xyz`) brauchen eine eigene Nicht-gefunden-Ansicht.

## Tests

Siehe `product-plan/sections/fraktionen-and-einheiten/tests.md` für die Test-Spezifikation: Abläufe mit Erfolgs- und Sonderfällen, leere Zustände, Bonusberechnung, Grenzfälle, Barrierefreiheit und Beispiel-Testdaten.

## Hinweise zur Umsetzung

- **Navigation und Routing:** Die Vorschau (`Uebersicht.tsx` in Design OS) hat die Navigation nur mit einem lokalen Ansichten-Stapel simuliert. In der App sollten alle drei Ansichten eigene Routen haben, z. B. `/fraktionen`, `/fraktionen/:factionId`, `/einheiten/:unitTypeId?ausfuehrung=<factionId>`. `onBack` sollte zur vorherigen Ansicht zurückkehren (Verlauf), mit sinnvollem Ziel bei Direktaufruf (z. B. Kompendium). Beide Detailansichten beschriften den Link mit „Zurück“.
- **Zuordnung beim Öffnen einer Einheit:** Für `EinheitDetail.faction` die Fraktion aus `unitType.factionId` auflösen (sonst `null`). Den zweiten Parameter von `FraktionDetail.onSelectUnitType` als `initialVariantFactionId` weitergeben.
- **Neu mounten:** `EinheitDetail` liest `initialVariantFactionId` nur beim ersten Rendern in `useState`. Bei Wechsel der Einheit oder Vorauswahl ohne Unmount (gleiche Route, neue Parameter) einen `key` aus Einheit und Fraktion setzen, wie es die Vorschau mit `` key={`${id}-${factionId}`} `` tut.
- **Bonusregel in `theme.ts`:** `bonusEffect(unit, faction)` wendet den Bonus an, wenn `stat` gesetzt ist und `domain` passt (oder `null` ist); `add` addiert, `multiply` multipliziert und rundet; Bauzeit sinkt nie unter 1; unveränderte Werte werden nicht markiert. Diese Regel muss mit der Spiellogik auf dem Spielfeld (Bauzeit in Städten, Bewegung, Treibstoff) übereinstimmen. Am besten die Spiel-Engine und das Kompendium dieselbe Funktion bzw. dieselben Daten nutzen lassen. Boni ohne `stat` (Salzküsten-Liga: Städte +1 Verteidigung) wirken nur in der Spiellogik.
- **Reichweiten-Bonus:** `UnitRow` zeigt ST/AB/BW/BAU als Kennzahlen; verändert der Bonus `range` (Nordmark, ×1,5), kommt ein Kästchen „RW“ mit „Grundwert → neuer Wert“ hinzu (z. B. Doppeldecker 12 → 18). Die Unterzeile „Reichweite …“ zeigt weiterhin den Grundwert.
- **Bonus in der Einheitenansicht:** `EinheitDetail` wendet `bonusEffect` an – bei Sondereinheiten mit der eigenen Fraktion (Blitzkorvette: Bewegung 6 → 7), bei allgemeinen Einheiten mit der Fraktion der gewählten Ausführung (Panzerkreuzer in der Ausführung Aurelia: Bewegung 3 → 4). Die veränderte Kachel hat einen Amber-Rahmen und zeigt den Grundwert durchgestrichen; unter dem Raster steht „Hervorgehoben: durch „<Bonus>“ (<Kurzname>) veränderter Wert.“ Ohne Fraktion und Ausführung bleiben es Grundwerte. Der Umschalter ist mit „Ausführung · eigenes Aussehen, Werte mit Fraktionsbonus“ beschriftet.
- **Lokaler UI-Zustand:** Filter (Einsatzgebiet, Herkunft) und die gewählte Ausführung sind `useState` in den Komponenten und gehen beim Verlassen verloren. Optional in die URL heben, falls der Filter beim Zurückkehren erhalten bleiben soll.
- **Bilder (`product/art-brief.md`):** Wappen `public/art/factions/<id>-emblem.png` (8:9, transparent), Kopfbilder `public/art/factions/<id>-hero.webp` (21:9, Motiv rechts), Einheiten `public/art/units/<id>.webp` und Varianten `public/art/units/<faction-id>/<id>.webp` (4:3). `useFirstLoadedImage` lädt alle Kandidaten per `new Image()` vor und zeigt den ersten geladenen in Präferenzreihenfolge; fehlende Dateien bleiben einfach Platzhalter. Die Übersicht nutzt nur `illustrationUrl`, die Fraktionsansicht Variante → neutral. Die Sondereinheit-Karte der Fraktionsansicht zeigt immer das Symbol, nie die Illustration.
- **Einheitensymbole:** `UnitIcon` hat Symbole für die IDs der Beispieldaten. Neue Einheitentypen fallen auf das Symbol ihres Einsatzgebiets zurück (Grenadiere, Kanonenboot, Doppeldecker); für eigene Symbole `ICONS` in `unitIcons.tsx` ergänzen.
- **Daten:** Fraktionen und Einheitentypen sind Stammdaten, die sich selten ändern. Sie können statisch ausgeliefert oder vom Server geladen und gecacht werden; dieselben Daten brauchen Partie-Setup (Fraktionswahl) und Spielfeld (Produktion, Werte). `history` trennt Absätze durch Leerzeilen. Fraktions-IDs müssen mit den Schlüsseln in `variantIllustrationUrls` übereinstimmen.
- **Styling:** Die Komponenten setzen Tailwind CSS v4 voraus (z. B. `text-(color:--cap)` für die Initiale) sowie die `animate-in`-/`fade-in`-Utilities (z. B. `tw-animate-css`) und `lucide-react`. Die Schriften Big Shoulders Display, Barlow und IBM Plex Mono müssen geladen sein (die Shell lädt sie bereits, sonst Google Fonts).
- **Audio:** `product/audio-brief.md` sieht Leitmotive je Fraktion vor (`<fraktion>-theme`). Das Kompendium spielt in den Designs keine Töne ab; ein optionales Anspielen in der Fraktionsansicht wäre eine Erweiterung.
- **Nicht enthalten:** sortierbare Tabelle, Direktvergleich mehrerer Einheiten, Stärken-und-Schwächen-Matrix, Auswahl einer Fraktion für eine Partie.

## Referenzdateien

- `product-plan/sections/fraktionen-and-einheiten/README.md` – Überblick, Gestaltung, Komponenten, Callbacks
- `product-plan/sections/fraktionen-and-einheiten/tests.md` – Test-Spezifikation
- `product-plan/sections/fraktionen-and-einheiten/components/` – React-Komponenten
- `product-plan/sections/fraktionen-and-einheiten/types.ts` – TypeScript-Interfaces
- `product-plan/sections/fraktionen-and-einheiten/sample-data.json` – Beispieldaten (4 Fraktionen, 12 Einheitentypen)
- `product-plan/sections/fraktionen-and-einheiten/screenshot-uebersicht.png` – Kompendium
- `product-plan/sections/fraktionen-and-einheiten/screenshot-fraktion-detail.png` – Fraktionsansicht
- `product-plan/sections/fraktionen-and-einheiten/screenshot-einheit-detail.png` – Einheitenansicht

## Fertig, wenn

- [ ] Fraktionen und Einheitentypen kommen aus echten Daten statt aus `sample-data.json`
- [ ] Lade-, Fehler- und Nicht-gefunden-Zustände sowie alle leeren Zustände sind umgesetzt
- [ ] Alle Callbacks sind mit Routing verbunden (`onSelectFaction`, `onSelectUnitType`, `onBack` in allen drei Ansichten)
- [ ] Alle vier Abläufe funktionieren Ende-zu-Ende, inklusive Direktaufruf per URL
- [ ] Die Ansichten entsprechen den Screenshots, im hellen und dunklen Modus
- [ ] Responsiv auf Desktop, Tablet und Smartphone (Fraktionsraster 4/2/1 Spalten, kein horizontales Scrollen)
- [ ] „Fraktionen“ in der Shell-Navigation öffnet das Kompendium und ist dort aktiv markiert
- [ ] Bonusmarkierungen stimmen mit der Spiellogik überein (gleiche Regel wie `bonusEffect`)
- [ ] Die gewählte Ausführung wird beim Öffnen aus einer Fraktion vorausgewählt und beim Wechsel der Einheit zurückgesetzt
- [ ] Vorhandene Bilder aus `public/art/` erscheinen, fehlende fallen sauber auf Platzhalter zurück
