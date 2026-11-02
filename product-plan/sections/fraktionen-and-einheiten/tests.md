# Test-Spezifikation: Fraktionen & Einheiten

## Überblick

Diese Spezifikation beschreibt das Verhalten des Bereichs aus Nutzersicht, unabhängig vom Test-Framework (z. B. React Testing Library, Playwright, Cypress). Geprüft werden drei Ansichten:

- `FraktionenUndEinheiten` – Kompendium mit Fraktionskarten und filterbarer Einheitenliste
- `FraktionDetail` – Fraktionsansicht
- `EinheitDetail` – Einheitenansicht

Die Beispielwerte stammen aus `sample-data.json` (4 Fraktionen, 12 Einheitentypen, davon 3 Sondereinheiten). Bilder, die nicht laden, werden durch Platzhalter ersetzt; in Testumgebungen ohne Bilddateien ist daher immer der Platzhalter sichtbar.

---

## Tests der Abläufe

### Ablauf 1: Kompendium öffnen und Fraktion auswählen

**Szenario:** Der Spieler öffnet „Fraktionen“ und tippt eine Fraktionskarte an.

#### Erfolgsfall

**Setup:** `FraktionenUndEinheiten` mit allen 4 Fraktionen und 12 Einheitentypen, `onSelectFaction` als Mock.

**Schritte:**
1. Ansicht rendern.
2. Auf die Karte „Eisenbund von Valdrin“ klicken.

**Erwartete Ergebnisse:**
- [ ] Eyebrow „Kompendium“ und Überschrift „Fraktionen & Einheiten“ sind sichtbar
- [ ] Einleitung lautet „4 Mächte ringen um die Kohleinseln. Lerne ihre Eigenheiten kennen, bevor du ihnen auf der Karte begegnest.“
- [ ] Vier Fraktionskarten sind sichtbar, jede mit Wappen, Name, Leitspruch in „…“, Eigenheit (`trait`), Bonus-Bezeichnung im Farbband (z. B. „Schwerindustrie“) und Spielstil-Chips (z. B. „Defensiv“, „Landkrieg“, „Langsamer Aufbau“)
- [ ] `onSelectFaction` wird genau einmal mit `"eisenbund"` aufgerufen

### Ablauf 2: Einheiten filtern

**Szenario:** Der Spieler schränkt die Einheitenliste nach Einsatzgebiet und Herkunft ein.

#### Erfolgsfall

**Setup:** wie Ablauf 1.

**Schritte:**
1. Ausgangszustand prüfen.
2. In der Gruppe „Einsatzgebiet“ auf „See“ klicken.
3. In der Auswahl „Herkunft“ „Allgemeine Einheiten“ wählen.
4. Auf den Textlink „Filter zurücksetzen“ unter der Liste klicken.

**Erwartete Ergebnisse:**
- [ ] Ausgangszustand: „Alle“ ist gewählt (`aria-checked="true"`), Herkunft „Alle Herkünfte“, Zähler „12 von 12 Typen“, kein „Filter zurücksetzen“ sichtbar
- [ ] Nach „See“: Zähler „6 von 12 Typen“; Liste zeigt Kanonenboot, Panzerkreuzer, Tauchboot, Transportfrachter, Flugzeugträger, Blitzkorvette
- [ ] Nach „Allgemeine Einheiten“: Zähler „5 von 12 Typen“; Blitzkorvette ist nicht mehr enthalten
- [ ] Solange ein Filter aktiv ist und Treffer vorhanden sind, steht unter der Liste der Textlink „Filter zurücksetzen“
- [ ] Nach dem Zurücksetzen: „Alle“ und „Alle Herkünfte“ gewählt, „12 von 12 Typen“, der Link verschwindet
- [ ] Kein Callback wird durch das Filtern ausgelöst

#### Fehlerfall: Kombination ohne Treffer

**Schritte:**
1. „Land“ wählen.
2. Herkunft „Sondereinheiten: Aurelische Republik“ wählen.
3. Im leeren Zustand auf „Filter zurücksetzen“ klicken.

**Erwartete Ergebnisse:**
- [ ] Zähler „0 von 12 Typen“
- [ ] Leerer Zustand mit „Keine Einheiten gefunden“ und „Für diese Kombination aus Einsatzgebiet und Herkunft gibt es keinen Einheitentyp.“
- [ ] Der Textlink unter der Liste wird nicht zusätzlich angezeigt, nur der Amber-Button „Filter zurücksetzen“
- [ ] Nach Klick: beide Filter auf „Alle“, alle 12 Einheiten sichtbar

### Ablauf 3: Einheit aus der Übersicht öffnen

**Szenario:** Der Spieler tippt eine Einheit in der Liste an.

**Setup:** wie Ablauf 1, `onSelectUnitType` als Mock.

**Schritte:**
1. Auf die Zeile „Wolkenkreuzer“ klicken.

**Erwartete Ergebnisse:**
- [ ] Die Zeile zeigt den Stempel „Sondereinheit · Nordmark“, die Unterzeile „Luft · Reichweite 30“ und die Kennzahlen ST 3, AB 3, BW 3, BAU 12
- [ ] `onSelectUnitType` wird mit `"wolkenkreuzer"` (ein Argument) aufgerufen

### Ablauf 4: Fraktion ansehen mit Bonusmarkierung

**Szenario:** Der Spieler liest die Fraktionsansicht des Eisenbunds.

**Setup:** `FraktionDetail` mit `faction` = Eisenbund, allen Einheitentypen, `onSelectUnitType` und `onBack` als Mock.

**Schritte:**
1. Ansicht rendern.
2. Die Sondereinheit-Karte „Dampfkoloss“ anklicken.
3. Die Zeile „Panzerwagen“ anklicken.
4. „Zurück“ anklicken.

**Erwartete Ergebnisse:**
- [ ] Kopfbereich mit Wappen, Eyebrow „Fraktion“, Überschrift „Eisenbund von Valdrin“ und Leitspruch „„Aus Kohle Stahl, aus Stahl Gewissheit.““
- [ ] Abschnitt „Geschichte“ mit einem Absatz je durch Leerzeile getrenntem Textblock
- [ ] Kasten „Eigenheit“ mit „Schwerindustrie“, „Landeinheiten werden eine Runde schneller gebaut.“ und „Wirkt auf Landeinheiten · Bauzeit“
- [ ] Kasten „Spielstil“ mit den drei Chips und `playstyleSummary`
- [ ] Abschnitt „Einheiten“: Sondereinheit-Karte mit „Sondereinheit · Land“, Name „Dampfkoloss“, Beschreibung und BAU als „12“ durchgestrichen und „11“ hervorgehoben
- [ ] Unterüberschrift „Allgemeine Einheiten“ mit Legende „Durch „Schwerindustrie“ veränderter Wert“
- [ ] Genau 9 allgemeine Einheiten; Grenadiere zeigen BAU „4 → 3“, Panzerwagen „7 → 6“; See- und Lufteinheiten zeigen keine Markierung
- [ ] Klick auf Dampfkoloss: `onSelectUnitType("dampfkoloss", "eisenbund")`
- [ ] Klick auf Panzerwagen: `onSelectUnitType("panzerwagen", "eisenbund")`
- [ ] Kopfbereich zeigt den Zurück-Link „Zurück“ (nicht „Kompendium“)
- [ ] Klick auf „Zurück“: `onBack()` einmal aufgerufen

#### Sonderfall: Fraktion ohne Sondereinheit und ohne Einheitenbonus

**Setup:** `faction` = Salzküsten-Liga (`specialUnitTypeId: null`, `bonus.stat: null`).

**Erwartete Ergebnisse:**
- [ ] Statt der Sondereinheit-Karte erscheint ein gestrichelter Kasten „Keine Sondereinheit“ mit „Die Stärke der Salzküsten-Liga liegt nicht in einer besonderen Einheit. Befestigung: Städte erhalten +1 Verteidigung.“
- [ ] Eigenheit zeigt „Wirkt auf Städte, nicht auf Einheiten“
- [ ] Die Legende „Durch „…“ veränderter Wert“ fehlt, keine Zeile ist markiert

#### Sonderfall: Additiver Bonus auf Bewegung

**Setup:** `faction` = Aurelische Republik (Seemacht, +1 Bewegung für See).

**Erwartete Ergebnisse:**
- [ ] Eigenheit zeigt „Wirkt auf Seeeinheiten · Bewegung“
- [ ] Kanonenboot BW „4 → 5“, Sondereinheit Blitzkorvette BW „6“ durchgestrichen, „7“ hervorgehoben

### Ablauf 5: Einheit ansehen und Ausführungen vergleichen

**Szenario:** Der Spieler öffnet eine allgemeine Einheit aus der Fraktion Eisenbund und wechselt die Ausführung.

**Setup:** `EinheitDetail` mit `unitType` = Grenadiere, `faction: null`, allen Fraktionen, `initialVariantFactionId: "eisenbund"`, allen Einheitentypen, `onBack` als Mock.

**Schritte:**
1. Ansicht rendern.
2. Im Umschalter „Ausführung nach Fraktion“ auf „Aurelia“ klicken.
3. „Zurück“ klicken.

**Erwartete Ergebnisse:**
- [ ] Eyebrow „Landeinheit“, Überschrift „Grenadiere“, Chip „Allgemeine Einheit · alle Fraktionen“
- [ ] Beschreibung und „Kann Städte erobern“ sind sichtbar
- [ ] Über dem Umschalter steht „Ausführung · eigenes Aussehen, Werte mit Fraktionsbonus“; vier Tabs „Eisenbund“, „Aurelia“, „Nordmark“, „Salzküste“; „Eisenbund“ hat `aria-selected="true"`
- [ ] Ohne geladene Bilder zeigt die Illustration die Blaupause mit `aria-label` „Bauplan Grenadiere (Platzhalter)“, Schriftfeld „Bauplan Nr. GREN-04“ / „Land“ und Maßlinie „1 FELD/RUNDE“
- [ ] Mit geladenem Variantenbild hat das Bild den Alternativtext „Grenadiere in der Ausführung von Eisenbund von Valdrin“
- [ ] Abschnitt „Typenschild“ (Ausführung Eisenbund): Stärke 2, Abwehr 2, Bewegung 1 „Felder“, Reichweite „–“ mit Hinweis „Nur Lufteinheiten“, Ladung 0 „Einheiten“; die Kachel „Bauzeit“ hat einen Amber-Rahmen und zeigt „4“ durchgestrichen und „3“ in Amber „Runden“; darunter „Balken im Verhältnis zum höchsten Wert aller Einheitentypen. Hervorgehoben: durch „Schwerindustrie“ (Eisenbund) veränderter Wert.“
- [ ] Nach Klick auf „Aurelia“: Tab „Aurelia“ ausgewählt, Akzentfarbe wechselt zu Rose; da Aurelias Bonus nur Seeeinheiten betrifft, zeigt „Bauzeit“ wieder 4 ohne Markierung und der Satz „Hervorgehoben: …“ entfällt; kein Callback
- [ ] Abschnitt „Taktik“ mit zwei nummerierten Tipps „01“, „02“
- [ ] Klick auf „Zurück“: `onBack()` einmal aufgerufen

#### Sonderfall: Sondereinheit mit Fraktionslink

**Setup:** `unitType` = Blitzkorvette, `faction` = Aurelische Republik, `onSelectFaction` als Mock.

**Erwartete Ergebnisse:**
- [ ] Kein Ausführungs-Umschalter (`variantIllustrationUrls` ist leer)
- [ ] Schaltfläche mit „Sondereinheit von“ und „Aurelische Republik“; Klick ruft `onSelectFaction("aurelia")` auf
- [ ] „Kann keine Städte erobern“ wird angezeigt
- [ ] Typenschild wendet den Bonus der eigenen Fraktion an: Kachel „Bewegung“ mit Amber-Rahmen, „6“ durchgestrichen, „7“ in Amber; darunter „Hervorgehoben: durch „Seemacht“ (Aurelia) veränderter Wert.“
- [ ] Der Abschnitt „Taktik“ fehlt vollständig (keine Tipps)

#### Sonderfall: allgemeine Einheit mit Bonus der gewählten Ausführung

**Setup:** `unitType` = Panzerkreuzer, `faction: null`, alle Fraktionen, `initialVariantFactionId: "aurelia"`.

**Erwartete Ergebnisse:**
- [ ] Die Kachel „Bewegung“ zeigt „3“ durchgestrichen und „4“ in Amber, mit Amber-Rahmen und dem Satz „Hervorgehoben: durch „Seemacht“ (Aurelia) veränderter Wert.“
- [ ] Nach Wechsel auf die Ausführung „Eisenbund“ zeigt „Bewegung“ wieder 3 ohne Markierung

#### Fehlerfall: ungültige Vorauswahl

**Setup:** Grenadiere mit `initialVariantFactionId: "unbekannt"` (oder `null`).

**Erwartete Ergebnisse:**
- [ ] Die erste Fraktion mit Variantenbild („Eisenbund“) ist ausgewählt, es tritt kein Fehler auf

---

## Leere Zustände

### Primärer leerer Zustand: Filter ohne Treffer
- [ ] Überschrift „Keine Einheiten gefunden“
- [ ] Text „Für diese Kombination aus Einsatzgebiet und Herkunft gibt es keinen Einheitentyp.“
- [ ] Button „Filter zurücksetzen“ setzt beide Filter auf „Alle“
- [ ] Tritt in den Beispieldaten immer bei Herkunft „Sondereinheiten: Salzküsten-Liga“ auf

### Keine Sondereinheit (Fraktionsansicht)
- [ ] Kasten „Keine Sondereinheit“ mit „Die Stärke der <Fraktionsname> liegt nicht in einer besonderen Einheit. <trait>“

### Keine Taktik-Tipps (Einheitenansicht)
- [ ] Bei `tactics: []` wird der gesamte Abschnitt „Taktik“ samt Überschrift ausgeblendet

### Keine Varianten (Einheitenansicht)
- [ ] Bei leerem `variantIllustrationUrls` fehlt der Umschalter samt Hinweistext

### Fehlende Bilder
- [ ] Fehlendes Wappen: SVG-Schild in Fraktionsfarbe mit Anfangsbuchstaben (z. B. „E“ für „Eisenbund von Valdrin“, „A“ für „Aurelische Republik“, „N“ für „Nordmark-Kollektiv“, „S“ für „Salzküsten-Liga“)
- [ ] Fehlendes Kopfbild: Farbband bzw. Kopfbereich nur mit Verlauf, Schraffur und Zahnrad-Kreis
- [ ] Fehlende Einheitenbilder: Symbol-Siegel in der Zeile, Blaupause in der Einheitenansicht

### Leere Listen
- [ ] `factions: []` und `unitTypes: []`: Einleitung „0 Mächte …“, Zähler „0 von 0 Typen“, leerer Zustand „Keine Einheiten gefunden“ (Hinweis: Der Text spricht dann von der Filterkombination; für den echten Ladefall einen eigenen Zustand vorsehen)

---

## Komponenten-Interaktionen

### FraktionenUndEinheiten
- [ ] Rendert eine Karte je Fraktion und eine `UnitRow` je gefiltertem Einheitentyp
- [ ] Herkunfts-Auswahl enthält „Alle Herkünfte“, „Allgemeine Einheiten“ und je Fraktion „Sondereinheiten: <Name>“
- [ ] Zeilen der Übersicht zeigen nur das neutrale Bild (`illustrationUrl`), keine Fraktionsvariante, und keine Bonusmarkierung
- [ ] Transporter zeigen „See · Ladung 6 Landeinheiten“ (Transportfrachter) bzw. „See · Ladung 4 Flugzeuge“ (Flugzeugträger)

### FraktionDetail
- [ ] Zeilen nutzen die Bildkette Fraktionsvariante → neutrales Bild → Symbol
- [ ] Nordmark: Eigenheit „Wirkt auf Lufteinheiten · Reichweite“; Legende „Durch „Luftschifffahrt“ veränderter Wert“; Lufteinheiten bekommen ein zusätzliches Kennzahl-Kästchen „RW“ (Titel „Reichweite“) mit Markierung, z. B. Doppeldecker „12 → 18“, Schwerbomber „16 → 24“; ST/AB/BW/BAU bleiben unmarkiert, die Unterzeile zeigt weiterhin den Grundwert („Reichweite 12“)
- [ ] Fraktionen ohne Reichweitenbonus zeigen kein „RW“-Kästchen

### EinheitDetail
- [ ] Werte-Balken: Breite = Wert / Höchstwert aller Einheitentypen (z. B. Bauzeit 4 von 16 = 25 %)
- [ ] Ladung >0 zeigt „Landeinheiten“ bzw. „Flugzeuge“ statt „Einheiten“
- [ ] Bei einer Sondereinheit ist die Akzentfarbe (Rahmen Fraktionslink, Punkt in der Blaupause) die Fraktionsfarbe; bei allgemeinen Einheiten die Farbe der gewählten Ausführung; ohne beides Amber `#f59e0b`
- [ ] Die Werte der Einheitenansicht berücksichtigen den Fraktionsbonus: bei Sondereinheiten den der eigenen Fraktion, bei allgemeinen Einheiten den der gewählten Ausführung; ohne Fraktion und Ausführung Grundwerte
- [ ] Die Balkenbreite richtet sich nach dem angezeigten Wert (mit Bonus)

### Tastatur
- [ ] Alle Karten, Zeilen, Filter, Tabs und Zurück-Links sind native `<button>`s und per Tab erreichbar, mit Enter/Leertaste auslösbar
- [ ] Die Herkunft ist ein natives `<select>` und per Pfeiltasten bedienbar
- [ ] Es gibt keine Dialoge; Escape hat keine Funktion

---

## Grenzfälle

- [ ] Lange Fraktionsnamen („Eisenbund von Valdrin“) umbrechen in Karte und Kopfbereich, ohne horizontales Scrollen auf 320 px Breite
- [ ] Lange Einheitennamen („Transportfrachter“, „Flugzeugträger“) und der Stempel „Sondereinheit · …“ umbrechen in der Zeile; die Kennzahlen rutschen auf Mobil in eine eigene Zeile
- [ ] `productionTurns`-Bonus kann den Wert nie unter 1 senken (`bonusEffect` begrenzt auf mindestens 1)
- [ ] `multiply`-Bonus wird gerundet (Nordmark: Doppeldecker Reichweite 12 → 18, Schwerbomber 16 → 24, Wolkenkreuzer 30 → 45 laut `bonusEffect`)
- [ ] Ein Bonus, der den Wert nicht verändert, wird nicht markiert
- [ ] Wechsel zwischen leerem und gefülltem Zustand: Aus „0 von 12 Typen“ führt ein Wechsel auf „Alle“ sofort wieder zu Treffern, ohne Neuladen
- [ ] Wird `EinheitDetail` für eine andere Einheit oder Vorauswahl wiederverwendet, muss es neu gemountet werden (z. B. `key`), sonst bleibt die alte Ausführung gewählt
- [ ] Nachträglich geladene Bilder ersetzen den Platzhalter mit Einblend-Animation; nicht existierende Dateien lassen dauerhaft den Platzhalter stehen

---

## Barrierefreiheit

- [ ] Einsatzgebiet-Filter: `role="radiogroup"` mit `aria-label="Einsatzgebiet"`, Buttons mit `role="radio"` und `aria-checked`
- [ ] Herkunfts-Auswahl hat das versteckte Label „Herkunft“
- [ ] Trefferzähler „X von Y Typen“ ist eine `aria-live="polite"`-Region
- [ ] Fraktionsabschnitt hat eine versteckte Überschrift „Fraktionen“; Abschnitte sind über `aria-labelledby` benannt
- [ ] Ausführungs-Umschalter: `role="tablist"` mit `aria-label="Ausführung nach Fraktion"`, Tabs mit `aria-selected`
- [ ] Wappen haben `aria-label` bzw. `alt` „Wappen <Fraktionsname>“; Blaupause `aria-label` „Bauplan <Name> (Platzhalter)“; dekorative Bilder und Einheitensymbole sind `alt=""` / `aria-hidden`
- [ ] Kennzahl-Kästchen ST/AB/BW/BAU haben ein `title` mit dem ausgeschriebenen Namen („Stärke“, „Abwehr“, „Bewegung“, „Bauzeit in Runden“)
- [ ] Typenschild ist eine Definitionsliste (`dl`/`dt`/`dd`); Taktik eine geordnete Liste (`ol`)
- [ ] Sichtbarer Fokusrahmen (Teal) auf Karten, Zeilen und Sondereinheit-Karte
- [ ] Touch-Ziele mindestens 44 px hoch (Filter 40 px innerhalb einer 48 px hohen Gruppe)

---

## Beispiel-Testdaten

```typescript
import type { Faction, UnitType, FraktionDetailProps, EinheitDetailProps } from './types'

export const eisenbund: Faction = {
  id: 'eisenbund',
  name: 'Eisenbund von Valdrin',
  shortName: 'Eisenbund',
  motto: 'Aus Kohle Stahl, aus Stahl Gewissheit.',
  color: 'amber',
  emblemUrl: '/art/factions/eisenbund-emblem.png',
  heroImageUrl: '/art/factions/eisenbund-hero.webp',
  trait: 'Schwerindustrie: Landeinheiten werden eine Runde schneller gebaut.',
  bonus: {
    label: 'Schwerindustrie',
    description: 'Landeinheiten werden eine Runde schneller gebaut.',
    domain: 'land',
    stat: 'productionTurns',
    modifier: -1,
    mode: 'add',
  },
  playstyle: ['Defensiv', 'Landkrieg', 'Langsamer Aufbau'],
  playstyleSummary: 'Baut langsam eine erdrückende Landmacht auf.',
  history: 'Erster Absatz der Geschichte.\n\nZweiter Absatz der Geschichte.',
  specialUnitTypeId: 'dampfkoloss',
}

export const grenadiere: UnitType = {
  id: 'grenadiere',
  name: 'Grenadiere',
  domain: 'land',
  strength: 2,
  defense: 2,
  movement: 1,
  range: null,
  capacity: 0,
  cargoDomain: null,
  productionTurns: 4,
  factionId: null,
  canCaptureCities: true,
  description: 'Die Grundlage jeder Armee: Fußtruppen mit Gasmasken und Gewehrgranaten.',
  tactics: [
    'Lass in jeder eroberten Stadt eine Einheit Grenadiere auf Wache zurück.',
    'Auf Hügeln und in Wäldern sind Grenadiere schwer zu vertreiben.',
  ],
  illustrationUrl: '/art/units/grenadiere.webp',
  variantIllustrationUrls: { eisenbund: '/art/units/eisenbund/grenadiere.webp' },
}

// Fraktion ohne Sondereinheit, Bonus wirkt nur auf Städte
export const salzkuesteProps: FraktionDetailProps = {
  faction: {
    ...eisenbund,
    id: 'salzkueste',
    name: 'Salzküsten-Liga',
    shortName: 'Salzküste',
    motto: 'Unsere Mauern stehen länger als eure Geduld.',
    color: 'lime',
    emblemUrl: null,
    heroImageUrl: null,
    trait: 'Befestigung: Städte erhalten +1 Verteidigung.',
    bonus: { label: 'Befestigung', description: 'Städte erhalten +1 Verteidigung.', domain: null, stat: null, modifier: 1, mode: 'add' },
    playstyle: ['Befestigung', 'Verteidigung'],
    specialUnitTypeId: null,
  },
  unitTypes: [grenadiere],
}

// Leerer Zustand: Einheit ohne Taktik, ohne Bilder, ohne Varianten
export const leereEinheitProps: EinheitDetailProps = {
  unitType: { ...grenadiere, id: 'test', tactics: [], illustrationUrl: null, variantIllustrationUrls: {} },
  faction: null,
  factions: [],
  initialVariantFactionId: null,
  unitTypes: [grenadiere],
}
```
