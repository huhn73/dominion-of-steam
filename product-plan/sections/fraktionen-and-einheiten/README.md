# Fraktionen & Einheiten

## Überblick

Fraktionen & Einheiten ist das Nachschlagewerk von Dominion of Steam. Spieler stöbern hier durch die Fraktionen der Dieselpunk-Welt und alle Einheitentypen, um vor und während einer Partie Stärken, Werte und Spielweisen nachzulesen. Eine Übersicht („Kompendium“) führt zu Detailansichten für jede Fraktion und jede Einheit. Der Bereich ist reine Ansicht: Es wird nichts gespeichert oder verändert, und es gibt keine Fraktionswahl für eine Partie.

## Abläufe

- **Übersicht:** Über „Fraktionen“ in der Navigation öffnet der Spieler das Kompendium. Oben stehen alle Fraktionen als Karten (Wappen, Name, Leitspruch, Eigenheit, Spielstil-Schlagworte), darunter die Liste aller Einheitentypen.
- **Einheiten filtern:** Segment-Buttons für das Einsatzgebiet (Alle, Land, See, Luft) und eine Auswahl für die Herkunft (Alle Herkünfte, Allgemeine Einheiten, Sondereinheiten je Fraktion). Ein Zähler zeigt „X von Y Typen“; passt nichts, erscheint ein leerer Zustand mit „Filter zurücksetzen“.
- **Fraktion ansehen:** Ein Tipp auf eine Fraktionskarte öffnet die Fraktionsansicht mit Kopfbereich in der Fraktionsfarbe, Geschichte, Eigenheit, Spielstil und Einheiten.
- **Einheiten einer Fraktion:** Die Sondereinheit steht hervorgehoben oben (oder ein Hinweis „Keine Sondereinheit“), darunter alle allgemeinen Einheiten. Werte, die der Fraktionsbonus verändert, werden als „Grundwert → neuer Wert“ markiert. Verändert der Bonus die Reichweite (Nordmark), bekommt die Zeile ein zusätzliches Kennzahl-Kästchen „RW“.
- **Einheit ansehen:** Ein Tipp auf eine Einheit öffnet die Einheitenansicht mit großer Illustration, Beschreibung, Typenschild (Werte mit Balken), Eroberungsfähigkeit und Taktik-Tipps. Das Typenschild wendet den Fraktionsbonus an: bei Sondereinheiten den ihrer Fraktion, bei allgemeinen Einheiten den der gewählten Ausführung. Sondereinheiten verlinken auf ihre Fraktion.
- **Ausführungen vergleichen:** Bei allgemeinen Einheiten wechselt ein Umschalter unter der Illustration zwischen den Ausführungen der Fraktionen. Aus einer Fraktion heraus geöffnet, ist deren Ausführung vorausgewählt. Mit der Ausführung wechselt auch der angewendete Bonus (z. B. Panzerkreuzer in der Ausführung Aurelia: Bewegung 3 → 4).
- **Zurück:** Jede Detailansicht hat einen Zurück-Link „Zurück“, der zur vorherigen Ansicht führt.

## Gestaltungsentscheidungen

- **Typografie:** Überschriften in Big Shoulders Display (schwarz, Versalien, weite Laufweite), Fließtext in Barlow, alle Zahlen und Kennungen in IBM Plex Mono.
- **Farben:** Amber als Akzent (Bonus-Markierung, Wertebalken, „&“ im Titel, Reset-Button), Teal für Sekundäres (Eyebrow „Kompendium“, Spielstil-Chips, Taktik-Karten, Fokus- und Hover-Rahmen), Stone als Neutralfarbe. Jede Fraktion hat zusätzlich eine eigene Farbe (`FactionColor`), deren Hex-Werte `FACTION_HEX` in `theme.ts` als `base`/`deep`/`light` liefert.
- **Fraktionskarten:** Raster mit 1 / 2 / 4 Spalten (Mobil / `sm` / `lg`). Farbband im Verlauf der Fraktionsfarbe mit Nietenleiste, darin das Kopfbild (sobald vorhanden) und das überlappende Wappen. Karten heben sich beim Hover an, das Wappen dreht leicht, unten wächst ein Farbstrich ein. Gestaffeltes Einblenden (70 ms pro Karte).
- **Wappen-Platzhalter:** `FactionEmblem` zeichnet ein Schild mit Messingrand, Chevron, Nieten, Zahnradring und dem Anfangsbuchstaben des ersten Wortes mit mehr als drei Zeichen, bis das echte Wappen-PNG geladen ist.
- **Einheitenzeilen:** kompakte Zeilen mit rundem Symbol-Siegel (oder Vorschaubild 4:3), Name, Stempel „Sondereinheit · <Kurzname>“ in der Fraktionsfarbe, Einsatzgebiet samt Ladung/Reichweite und vier Kennzahl-Kästchen ST / AB / BW / BAU, bei einem Reichweitenbonus zusätzlich RW. Ab `xl` zweispaltig.
- **Fraktions-Kopfbereich:** Verlauf in der Fraktionsfarbe mit Schraffur und gestricheltem Zahnrad-Kreis; mit Kopfbild wird das Bild rechts gezeigt und links für den Titel in die Fraktionsfarbe abgedunkelt. Die Geschichte beginnt mit einer Initiale in der Fraktionsfarbe.
- **Sondereinheit-Karte:** dunkle Karte mit Raster in Fraktionsfarbe, großem Symbol-Siegel, das sich beim Hover dreht.
- **Einheiten-Platzhalter:** Blaupause (dunkles Teal mit Raster, Zeichenkreis, Maßlinie „<Bewegung> FELD/RUNDE“ und Schriftfeld „Bauplan Nr. …“), bis eine Illustration geladen ist.
- **Typenschild:** sechs Kennzahl-Kacheln mit Amber-Balken im Verhältnis zum Höchstwert aller Einheitentypen. Eine durch den Fraktionsbonus veränderte Kachel hat einen Amber-Rahmen, zeigt den Grundwert durchgestrichen vor dem Bonuswert in Amber, und unter dem Raster steht „Hervorgehoben: durch „<Bonus>“ (<Kurzname>) veränderter Wert.“ Taktik-Tipps als nummerierte Teal-Karten („01“, „02“ …).
- **Trennlinien:** doppelte Unterstreichungen (`border-double`) unter Abschnittsüberschriften im Stil technischer Druckwerke.
- Heller und dunkler Modus über `dark:`-Varianten, Touch-Ziele mindestens 44 px (`min-h-11`).

## Datenformen

Die Komponenten nutzen diese Interfaces aus `types.ts`:

| Interface | Inhalt | Globale Entität (`product/data-shape/data-shape.md`) |
|---|---|---|
| `Faction` | Name, Kurzname, Leitspruch, Farbe, Wappen- und Kopfbild-URL, Eigenheit, Bonus, Spielstil-Schlagworte und -Zusammenfassung, Geschichte (Absätze durch Leerzeilen), `specialUnitTypeId` | **Faction** |
| `FactionBonus` | Bezeichnung, Beschreibung, Einsatzgebiet, betroffener Wert (`stat`), `modifier`, `mode` (`add`/`multiply`) | Teil von **Faction** |
| `UnitType` | Einsatzgebiet, Stärke, Abwehr, Bewegung, Reichweite (nur Luft), Ladekapazität und Ladungsart, Bauzeit, `factionId` (nur Sondereinheiten), Eroberungsfähigkeit, Beschreibung, Taktik-Tipps, neutrales Bild, Fraktionsvarianten-Bilder | **UnitType** |
| `UnitDomain`, `FactionColor`, `BonusStat` | Hilfstypen | – |

Beziehungen: Eine Faction hat höchstens eine Sondereinheit (`specialUnitTypeId`, in den Beispieldaten hat die Salzküsten-Liga keine). Ein UnitType mit `factionId` gehört exklusiv dieser Fraktion; UnitTypes ohne `factionId` kann jede Fraktion bauen und haben in `variantIllustrationUrls` je Fraktion ein eigenes Bild.

## Visuelle Referenz

- `screenshot-uebersicht.png` – Kompendium mit Fraktionskarten und Einheitenliste
- `screenshot-fraktion-detail.png` – Fraktionsansicht (Eisenbund von Valdrin)
- `screenshot-einheit-detail.png` – Einheitenansicht (Grenadiere, Ausführung Eisenbund)

## Enthaltene Komponenten

| Komponente | Beschreibung |
|---|---|
| `FraktionenUndEinheiten` | Übersicht („Kompendium“): Fraktionskarten und filterbare Einheitenliste |
| `FraktionDetail` | Fraktionsansicht mit Kopfbereich, Geschichte, Eigenheit, Spielstil, Sondereinheit und allgemeinen Einheiten mit Bonusmarkierung |
| `EinheitDetail` | Einheitenansicht mit Illustration bzw. Blaupause, Ausführungs-Umschalter, Typenschild mit Fraktionsbonus und Taktik |
| `FactionEmblem` | Wappen einer Fraktion; zeigt das PNG, sonst einen SVG-Schild in der Fraktionsfarbe |
| `UnitRow` | Zeile eines Einheitentyps (Bild/Symbol, Name, Sondereinheit-Stempel, Kennzahlen, optional Bonusmarkierung inklusive „RW“-Kästchen bei Reichweitenbonus) |
| `UnitIcon` (`unitIcons.tsx`) | Eigenes Linien-Symbol je Einheitentyp, mit Rückfall auf ein Symbol je Einsatzgebiet |
| `theme.ts` | `FACTION_HEX`, `DOMAIN_LABEL` und `bonusEffect()` (Bonusberechnung) |
| `useImageLoaded.ts` | Hooks `useFirstLoadedImage` / `useImageLoaded` für die Bild-Rückfallkette (intern, nicht über `index.ts` exportiert) |

## Callback-Props

| Callback | Komponente | Ausgelöst wenn |
|---|---|---|
| `onSelectFaction(factionId)` | `FraktionenUndEinheiten` | Der Spieler eine Fraktionskarte antippt |
| `onSelectUnitType(unitTypeId)` | `FraktionenUndEinheiten` | Der Spieler eine Einheitenzeile in der Übersicht antippt |
| `onSelectUnitType(unitTypeId, factionId)` | `FraktionDetail` | Der Spieler die Sondereinheit-Karte oder eine allgemeine Einheit in der Fraktionsansicht antippt; `factionId` ist die angezeigte Fraktion (deren Ausführung soll vorausgewählt werden) |
| `onBack()` | `FraktionDetail` | Der Spieler „Zurück“ im Kopfbereich antippt |
| `onSelectFaction(factionId)` | `EinheitDetail` | Der Spieler bei einer Sondereinheit die Schaltfläche „Sondereinheit von <Fraktion>“ antippt |
| `onBack()` | `EinheitDetail` | Der Spieler „Zurück“ antippt |

Filter (Einsatzgebiet, Herkunft) und die gewählte Ausführung sind lokaler UI-Zustand und lösen keine Callbacks aus.
