# Dominion of Steam: Vollständige Umsetzungsanleitung

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

## Tests

Jeder Bereich hat eine `tests.md` mit Test-Spezifikationen für das UI-Verhalten. Sie sind **unabhängig vom Test-Framework**, passe sie an dein Test-Setup an.

**Für jeden Bereich:**
1. `product-plan/sections/<bereich>/tests.md` lesen
2. Tests für die wichtigsten Abläufe schreiben (Erfolgs- und Fehlerfälle)
3. Die Funktion umsetzen, bis die Tests grün sind
4. Aufräumen, Tests grün halten

---

# Dominion of Steam: Produktübersicht

## Zusammenfassung

Dominion of Steam ist ein rundenbasiertes Eroberungsspiel in einer alternativen Dieselpunk-Welt, das im Browser auf Desktop und Mobilgeräten läuft. Spieler erkunden prozedural erzeugte Kontinente unter Kriegsnebel, erobern Städte, lassen dort Einheiten zu Land, zu Wasser und in der Luft bauen und treten mit eigenständigen Fraktionen gegeneinander oder gegen KI-Gegner an.

**Probleme und Lösungen:**
- **Klassische Eroberungsstrategie wirkt veraltet:** moderne Grafik im eigenen Dieselpunk-Stil, zeitgemäße Bedienung, gleiche strategische Tiefe.
- **Gemeinsames Spielen scheitert an Terminen:** Neben Live-Sitzungen gibt es asynchrone Partien mit Benachrichtigung, wenn man am Zug ist.
- **Strategiespiele sind an den PC gebunden:** komplett im Browser, für Maus und Touch, auf dem Desktop beginnen und auf dem Smartphone fortsetzen.
- **Partien wiederholen sich:** prozedurale Karten und Fraktionen mit eigenen Stärken und Sondereinheiten.
- **Nicht immer sind Mitspieler da:** KI-Gegner in mehreren Schwierigkeitsstufen.

**Wichtige technische Anforderungen:**
- **Dauerhafte Spielstände:** Der Server speichert jede Partie nach jedem Zug, sodass laufende Partien einen Neustart oder Absturz des Servers ohne Verlust überstehen.
- **Benachrichtigungen:** Push im Browser und E-Mail, je Anlass einstellbar (siehe Bereich „Spielerprofil & Einstellungen“).
- **Klangwelt:** adaptive Musik, Fraktionsthemen und Umgebungsgeräusche, siehe `briefs/audio-brief.md`.
- **Illustrationen:** Einheiten, Fraktionsvarianten, Wappen und Kopfbilder, siehe `briefs/art-brief.md`.

## Geplante Bereiche

1. **Spielfeld & Züge:** Kartenansicht mit Kriegsnebel, Städten, Einheitenbewegung, Kampf und Rundenablauf, solo gegen eine einfache KI spielbar.
2. **Fraktionen & Einheiten:** Kompendium der Fraktionen und aller Einheitentypen mit Werten, Sondereinheiten, Fraktionsvarianten und Bauzeiten.
3. **Partie-Setup & KI-Gegner:** Assistent für neue Partien mit Regeln, eigener Fraktion, Gegnern und Mitspielern, Karteneinstellungen und KI-Persönlichkeiten.
4. **Lobby & Multiplayer:** Startseite mit eigenen Partien, Einladungen, offenen und beendeten Partien sowie Warteraum.
5. **Spielerprofil & Einstellungen:** Bilanz, Partieverlauf und Einstellungen für Benachrichtigungen, Darstellung, Ton, Steuerung und Konto.

## Produkt-Entitäten

- **Player:** registrierter Spieler mit Bilanz
- **Friendship:** Freundschaft mit Online-Status
- **PlayerSettings:** Einstellungen eines Spielers
- **Faction:** fiktive Nation mit Bonus, Sondereinheit und Bildern
- **UnitType:** Einheitenvorlage mit Werten, Ladungsart und Fraktionsvarianten
- **AiPersonality:** KI-Gegner mit fester Fraktion
- **Match:** Partie mit Regeln und Status, dauerhaft gespeichert
- **Participant:** Platz in einer Partie (Spieler, KI, Einladung, offen)
- **Invitation:** Einladung zu einer Partie
- **Map, Tile, City, Unit:** Spielwelt, Hex-Felder, Städte und Einheiten
- **Turn:** abgeschlossener Zug mit Aktionen
- **GameEvent:** Ereignis für Log und Benachrichtigungen

Details in `data-shapes/README.md` und im Original `product/data-shape/data-shape.md`.

## Design-System

**Farben (Tailwind):**
- Primär: `amber`
- Sekundär: `teal`
- Neutral: `stone`

**Schriften (Google Fonts):**
- Überschriften: Big Shoulders Display
- Fließtext: Barlow
- Zahlen und Codes: IBM Plex Mono

## Umsetzungsreihenfolge

1. **Shell:** Design-Tokens und Anwendungs-Shell mit Menü- und Spiel-Modus
2. **Spielfeld & Züge:** Kern des Spiels
3. **Fraktionen & Einheiten:** Kompendium
4. **Partie-Setup & KI-Gegner:** neue Partien anlegen
5. **Lobby & Multiplayer:** Startseite und Warteraum
6. **Spielerprofil & Einstellungen:** Profil und Einstellungen

Für jeden Meilenstein gibt es eine eigene Anleitung in `product-plan/instructions/incremental/`.

---

# Meilenstein 1: Shell

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** keine

## Ziel

Design-Tokens und Anwendungs-Shell einrichten, also den dauerhaften Rahmen um alle Bereiche, inklusive Spiel-Modus für das Spielfeld.

## Was umzusetzen ist

### 1. Design-Tokens

- Tailwind CSS v4 einrichten, dazu `tw-animate-css` für die Ein-Animationen
- Dunklen Modus über eine Klasse `.dark` an einem übergeordneten Element steuern. Die Einstellung „Farbschema“ (Hell, Dunkel, System) im Bereich Profil & Einstellungen setzt diese Klasse.
- Schriften laut `product-plan/design-system/fonts.md` laden
- Farben laut `product-plan/design-system/tailwind-colors.md`. `tokens.css` enthält die Werte als CSS-Variablen.

### 2. Anwendungs-Shell

Kopiere die Komponenten aus `product-plan/shell/components/` in dein Projekt:

- `AppShell.tsx`: Rahmen mit Menü- und Spiel-Modus
- `MainNav.tsx`: Top-Navigation bzw. mobile Tab-Leiste
- `UserMenu.tsx`: Avatar mit Dropdown

**Navigation verbinden:**

| Punkt | Ziel |
|---|---|
| Lobby | Lobby & Multiplayer (Startseite), Badge = Anzahl Partien mit „Du bist am Zug“ |
| Neue Partie | Partie-Setup & KI-Gegner |
| Fraktionen | Fraktionen & Einheiten |

Über das Benutzermenü erreichst du `onOpenProfile` (Profil) und `onOpenSettings` (Einstellungen), dazu `onLogout`.

**Spiel-Modus:** Für das Spielfeld `mode="game"` setzen und `gameHeader` füllen (Titel „<Partiename> · Runde <n>“, Status „Dein Zug · Frist …“, „Gegnerzüge“ oder „Warte auf Gegner“, `isYourTurn`). `onExitGame` führt zurück zur Lobby, `onOpenGameMenu` öffnet ein Spielmenü, das noch gestaltet werden muss (siehe unten).

**Benutzermenü:** braucht `user.name` und optional `user.avatarUrl`. Ohne Bild zeigt es Initialen.

## Offene Punkte

- **Spielmenü** (Button im Spiel-Modus): Inhalt ist noch nicht gestaltet, z. B. Partie-Details, Einstellungen, Aufgeben, zurück zur Lobby. Bis dahin genügt ein einfaches Menü mit diesen Einträgen.

## Referenzdateien

- `product-plan/design-system/`: Design-Tokens
- `product-plan/shell/README.md`: Gestaltungsabsicht der Shell
- `product-plan/shell/components/`: Shell-Komponenten
- `product-plan/shell/screenshot.png`: visuelle Referenz für den Menü-Modus

## Fertig, wenn

- [ ] Design-Tokens, Schriften und dunkler Modus sind eingerichtet
- [ ] Shell zeigt die Navigation, der aktive Punkt ist hervorgehoben
- [ ] Navigation führt zu den richtigen Routen, die Lobby ist Startseite
- [ ] Lobby-Badge zeigt die Anzahl der Partien, in denen der Spieler am Zug ist
- [ ] Benutzermenü zeigt Name bzw. Avatar und führt zu Profil, Einstellungen und Abmelden
- [ ] Spiel-Modus zeigt die kompakte Kopfleiste und lässt das Spielfeld die volle Höhe nutzen
- [ ] Auf dem Smartphone erscheint die Tab-Leiste unten, Inhalte werden nicht verdeckt

---

# Meilenstein 2: Spielfeld & Züge

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** Meilenstein 1 (Shell) abgeschlossen, dazu alle vorherigen Bereichs-Meilensteine

## Ziel

Das spielbare Herzstück von Dominion of Steam umsetzen: eine Hex-Karte mit Kriegsnebel, auf der der Spieler in seinem Zug Einheiten bewegt, Befehle gibt, angreift, Städte erobert, Produktion festlegt und den Zug beendet, inklusive Wiederholung der Gegnerzüge zu Beginn.

## Überblick

Die Komponente `Spielfeld` füllt ihren Container vollständig und wird im Spiel-Modus der Shell gerendert (`AppShell mode="game"`). Die Kopfleiste mit Partiename, Runde, Zugstatus und Frist liefert die Shell über `gameHeader`, nicht das Spielfeld. Auf der Karte liegen schwebend das Ereignis-Log, die Minikarte („Lagekarte“), die Aktionsleiste mit „Nächste Einheit“ und „Zug beenden“ sowie die Einheiten-Info und das Stadt-Panel (Desktop: Panels, Mobil: Bottom-Sheets). Bedient wird alles mit Maus oder Touch; Esc und Rechtsklick brechen stufenweise ab.

**Kernfunktionen:**
- Einheiten bewegen per Tippen (Vorschau, dann Bestätigung) oder Ziehen, Mehrrunden-Marsch für entfernte Ziele
- Stehende Befehle: Wache, Patrouille mit Wegpunkten, Aufheben, Überspringen
- Angriff auf Einheiten und Städte mit Siegchance, Kampfanimation und Ergebnis-Toast; Stadteroberung per Angriff (Tippen oder Ziehen auf die Stadt), danach zieht die Einheit ein und das Stadt-Panel öffnet sich
- Produktion im Stadt-Panel mit Fortschritt und baubaren Typen (inklusive Fraktions-Sondereinheit, See nur an der Küste), Bauzeiten mit Fraktionsbonus
- Transport: Beladen per Bewegung, Ausladen auf angrenzendes Land, Flugzeuge vom Träger starten
- Gegnerzug-Wiederholung, Ereignis-Log, Minikarte, „Nächste Einheit“ und „Zug beenden“ mit Rückfrage

## Enthaltene Komponenten

Kopiere `product-plan/sections/spielfeld-and-zuge/components/` in dein Projekt:

- `Spielfeld.tsx`: Hauptkomponente, hält den lokalen Interaktionszustand und ruft die Callbacks auf
- `HexMap.tsx`: SVG-Karte mit Gelände, Nebel, Städten, Spielsteinen, Hervorhebungen, Pfaden, Gegnerzug-Geist und Kampfanimation; Zoom, Verschieben, Ziehen, Rechtsklick
- `UnitPanel.tsx`: Einheiten-Info mit Werten, Treibstoff, Befehlsstatus, Ladung und Befehlsbuttons
- `CityPanel.tsx`: Stadt-Panel mit Produktion und Auswahl der baubaren Einheitentypen, Bauzeiten mit Fraktionsbonus
- `bonus.ts`: `withBonus()` berechnet einen Einheitenwert nach Fraktionsbonus
- `EventLog.tsx`: Ausklappbares Ereignis-Log mit Zähler „N neu“
- `MiniMap.tsx`: Übersichtskarte mit Kamera-Rahmen
- `hex.ts`: Hex-Geometrie und Bewegungsregeln
- `unitIcons.tsx`: Symbol je Einheitentyp (`UnitIcon`)
- `index.ts`: Exporte

Dazu `types.ts` (Datentypen und Props) und `sample-data.json`.

## Props-Referenz

**Daten-Props:**

| Prop | Typ | Beschreibung |
|---|---|---|
| `match` | `Match` | Partie mit `round`, `mode`, `phase` (`replay`, `yourTurn`, `waiting`), `turnDeadline` und `youId` |
| `participants` | `Participant[]` | Teilnehmer mit Fraktion, Farbe und Status |
| `factions` | `Faction[]` | Fraktionen mit `bonus` (Name in der Einheiten-Info, Fraktionsbonus für die Bauzeiten im Stadt-Panel) |
| `unitTypes` | `UnitType[]` | Alle Einheitentypen mit Werten, Bauzeit, Ladekapazität und optionaler Fraktion |
| `map` | `GameMap` | Breite, Höhe, Seed und Felder mit Gelände und Sichtbarkeit aus Sicht des Spielers |
| `cities` | `City[]` | Bekannte Städte mit Besitzer, Hauptstadt-Flag und Produktion (nur bei eigenen Städten) |
| `units` | `Unit[]` | Eigene Einheiten und sichtbare Feinde, inklusive geladener Einheiten (`carriedBy`) |
| `events` | `GameEvent[]` | Ereignisse seit dem letzten Zug mit Position und `isNew` |
| `replay` | `ReplayAction[]` | Sichtbare Gegneraktionen für die Wiederholung |
| `combatPreviews` | `CombatPreview[]` | Siegchancen je Angreifer und Ziel |
| `lastCombat` | `CombatResult \| null` | Ergebnis des zuletzt ausgeführten Angriffs (optional) |

**Callback-Props:**

| Callback | Ausgelöst wenn |
|---|---|
| `onSelectUnit(unitId)` | eine eigene Einheit ausgewählt wird (Tippen, „Nächste Einheit“, Beginn eines Ziehens, „Starten“ auf dem Träger) |
| `onMoveUnit(unitId, target)` | eine Bewegung innerhalb der Reichweite dieser Runde bestätigt wird (zweiter Tipp oder Loslassen); auch Beladen eines Transporters |
| `onSetGoto(unitId, target)` | ein Ziel außerhalb der Reichweite dieser Runde bestätigt wird |
| `onSetSentry(unitId)` | „Wache“ gedrückt wird |
| `onSetPatrol(unitId, waypoints)` | die Patrouille mit „Bestätigen“ abgeschlossen wird (erster Wegpunkt = aktuelle Position) |
| `onCancelOrder(unitId)` | „Aufheben“ gedrückt wird |
| `onSkipUnit(unitId)` | „Überspringen“ in der Einheiten-Info gedrückt wird |
| `onAttack(unitId, { unitId?, cityId? })` | im Angriffsdialog „Angreifen“ gedrückt wird |
| `onUnloadUnit(unitId, target)` | im Ausladen-Modus ein markiertes Landfeld angetippt wird (`unitId` = geladene Einheit) |
| `onSelectCity(cityId)` | das Panel einer eigenen Stadt geöffnet wird, auch automatisch nach Eroberung |
| `onSetProduction(cityId, unitTypeId)` | im Stadt-Panel ein Einheitentyp angetippt wird, der nicht bereits in Produktion ist |
| `onSelectEvent(eventId)` | ein Eintrag im Ereignis-Log angetippt wird |
| `onSkipReplay()` | „Überspringen“ in der Wiederholung gedrückt wird oder die Wiederholung von selbst endet |
| `onEndTurn()` | der Zug beendet wird („Zug beenden“ ohne offene Einheiten oder „Trotzdem beenden“) |

## Erwartete Abläufe

### Ablauf 1: Zugbeginn mit Gegnerzug-Wiederholung

1. Der Spieler öffnet die Partie, `match.phase` ist `replay`.
2. Ein Overlay zeigt „Gegnerzug · Admiral Kessler“, „Panzerkreuzer bewegt sich“ und „1/4“; ein Geist-Token läuft den Pfad ab, die Kamera folgt, bei Angriffen und Eroberungen explodiert es am Ziel.
3. Der Spieler drückt „Überspringen“ oder wartet das Ende ab.
4. `onSkipReplay()` wird aufgerufen; das Backend setzt `phase` auf `yourTurn`.
5. Das Ereignis-Log zeigt „Ereignisse“ mit „6 neu“.

**Ergebnis:** Die Aktionsleiste ist aktiv, die Kopfleiste der Shell zeigt „Dein Zug“ mit Frist.

### Ablauf 2: Einheit bewegen und Befehle geben

1. Der Spieler tippt eine eigene Einheit an (oder drückt „Nächste Einheit“). `onSelectUnit` wird aufgerufen, die Einheiten-Info öffnet sich, erreichbare Felder leuchten amber.
2. Er tippt auf ein Zielfeld: Ein Pfad mit Rundenmarkern erscheint (amber in Reichweite, teal darüber hinaus).
3. Er tippt erneut auf dasselbe Feld (oder zieht die Einheit direkt dorthin und lässt los).
4. In Reichweite wird `onMoveUnit(unitId, target)` aufgerufen, sonst `onSetGoto(unitId, target)`.
5. Alternativ: „Wache“ → `onSetSentry`; „Patrouille“, Wegpunkte antippen, „Bestätigen“ → `onSetPatrol`; „Aufheben“ → `onCancelOrder`; „Überspringen“ → `onSkipUnit` und Sprung zur nächsten offenen Einheit.

**Ergebnis:** Die aktualisierten `units` zeigen neue Position bzw. Befehl, der Zähler bei „Nächste Einheit“ sinkt.

### Ablauf 3: Angreifen und Stadt erobern

1. Der Spieler wählt eine Einheit; feindliche Einheiten und Städte in Reichweite erscheinen rot mit Siegchance (z. B. „86 %“).
2. Er tippt auf das Ziel (oder zieht die Einheit darauf und lässt los). Der Dialog „Angriff“ zeigt „Panzerwagen → **Ventil**“, den Balken und „Siegchance“.
3. Er drückt „Angreifen“. Die Explosionsanimation läuft sofort, `onAttack("u2", { cityId: "c4" })` wird aufgerufen.
4. Das Backend berechnet den Kampf und liefert `lastCombat` sowie aktualisierte `units` und `cities`.
5. Ein Toast zeigt „Sieg“ oder „Niederlage“, die Nachricht und „Schaden: eigene −X · Gegner −Y“.
6. Bei einem Sieg mit `targetCityId` öffnet sich das Stadt-Panel der eroberten Stadt und `onSelectCity` wird aufgerufen.

**Ergebnis:** Die Stadt trägt die Spielerfarbe, die angreifende Einheit steht in der Stadt, im Panel steht „Die Fabriken stehen still. Wähle unten, was gebaut werden soll.“

### Ablauf 4: Produktion festlegen und Zug beenden

1. Der Spieler tippt auf eine eigene Stadt; `onSelectCity` wird aufgerufen, das Stadt-Panel zeigt „In Produktion“ mit Typ, „noch N Runden“ und Segmentbalken. Die Liste zeigt die Bauzeiten mit Fraktionsbonus (beim Eisenbund z. B. Grenadiere mit durchgestrichener „4“ und „3“ Runden in Amber).
2. Er tippt einen anderen Typ in der Liste an; `onSetProduction(cityId, unitTypeId)` wird aufgerufen. Ein Tipp auf den laufenden Typ löst keinen Callback aus.
3. Er drückt „Zug beenden“. Haben noch Einheiten keine Befehle, erscheint „Zug beenden?“ mit „5 Einheiten haben in dieser Runde noch keine Befehle.“
4. „Zu den Einheiten“ springt zur nächsten offenen Einheit; „Trotzdem beenden“ ruft `onEndTurn()` auf.

**Ergebnis:** Das Backend setzt `phase` auf `waiting`, das Spielfeld zeigt „Warte auf Admiral Kessler & Lena Hartmann …“, alle Aktionen sind deaktiviert. Die Shell-Kopfleiste zeigt „Warte auf Gegner“.

## Leere Zustände

- **Keine Ereignisse:** Kein Badge „neu“; aufgeklappt „Keine Ereignisse seit deinem letzten Zug.“
- **Stadt ohne Produktion:** „Die Fabriken stehen still. Wähle unten, was gebaut werden soll.“
- **Leerer Frachter:** „Leer. Ziehe Landeinheiten auf den Frachter, um sie zu laden.“
- **Leerer Flugzeugträger:** „Leer. Lass Flugzeuge auf dem Träger landen, um sie aufzutanken und mitzunehmen.“
- **Fremde oder neutrale Stadt:** „Erobere die Stadt mit einer Landeinheit, um hier Einheiten zu produzieren.“
- **Keine offenen Einheiten:** „Nächste Einheit“ zeigt „0“ und ist deaktiviert; „Zug beenden“ beendet ohne Rückfrage.
- **Leere Wiederholung:** Bei `phase = "replay"` und leerem `replay` ruft die Komponente sofort `onSkipReplay()` auf.

Zusätzlich musst du selbst umsetzen: einen Ladezustand, solange der Spielstand geladen wird (die Komponente braucht vollständige Daten), und eine Fehleranzeige, wenn eine Aktion vom Server abgelehnt wird.

## Tests

Die Verhaltensspezifikation steht in `product-plan/sections/spielfeld-and-zuge/tests.md`. Sie enthält Erfolgs- und Fehlerfälle für alle Abläufe, Leerzustände, Grenzfälle, Barrierefreiheit und Beispiel-Testdaten. Schreibe die Tests mit dem Framework deines Projekts.

## Hinweise zur Umsetzung

- **Spiel-Modus der Shell:** Rendere `Spielfeld` als Kind von `AppShell mode="game"` in einem Container mit fester Höhe (Rest des Viewports). Die Shell bekommt `gameHeader = { title: "<Partiename> · Runde <n>", status, isYourTurn }`. In der Vorschau lautet `status` je nach Phase „Dein Zug · Frist So., 19:00“ (Frist nur bei `mode: "async"`), „Gegnerzüge“ oder „Warte auf Gegner“. `onExitGame` und `onOpenGameMenu` der Shell gehören zu dieser Ansicht.
- **Schriften:** Die Komponenten nutzen Big Shoulders Display, Barlow und IBM Plex Mono per `font-['…']`. Binde die Google Fonts global ein (die Vorschau lädt sie per `<link>`).
- **Regeln im Client sind nur Vorschau:** `hex.ts` berechnet erreichbare Felder, Pfade, Rundenmarker und Angriffsziele lokal: unerforschte Felder sind gesperrt, Felder mit Feinden und nicht eigene Städte sind nicht betretbar (nur angreifbar), Seeeinheiten nur auf Wasser oder in eigene Städte, Landeinheiten betreten Wasser nur als letztes Feld auf einen eigenen Frachter mit freiem Platz, Lufteinheiten überall; das Budget ist `min(movesLeft, fuel)`; jedes Feld kostet 1 (keine Geländekosten). Der Server muss jede Aktion selbst validieren und ausführen. Weichen die Serverregeln ab (z. B. Geländekosten), passe `hex.ts` an, damit Vorschau und Ergebnis übereinstimmen.
- **Siegchance:** Liefere `combatPreviews` vom Server. Fehlt ein Eintrag, schätzt `attackTargets` die Chance lokal (`Stärke × Zustand` gegen `Abwehr × Zustand`, +1 Abwehr in Städten).
- **Was die Vorschau simuliert hat und das Backend leisten muss:** Bewegung (Position, `movesLeft`, `fuel` abziehen, `needsOrders: false`, Befehl zurücksetzen), Beladen und Ausladen (`cargoUnitIds` und `carriedBy` pflegen, mitfahrende Ladung mitbewegen), Marschbefehl mit `turnsRemaining` und Ausführung über mehrere Runden, Wache (melden, wenn ein Feind in Sicht kommt), Patrouille, Kampfauflösung, Stadtwechsel bei Eroberung (Besitzer wechseln, angreifende Einheit in die Stadt ziehen, Produktion zurücksetzen), Produktion starten, Ereignisse als gelesen markieren (`isNew: false` nach `onSelectEvent`), Phasenwechsel `replay` → `yourTurn` nach `onSkipReplay` und `yourTurn` → `waiting` nach `onEndTurn`.
- **Lokaler UI-Zustand vs. Props:** Auswahl, Pfadvorschau, Patrouille- und Ausladen-Modus, Angriffsdialog, Zugende-Dialog, Kamera, Log- und Minikarten-Zustand sowie der Toast sind lokal. Spielzustand kommt ausschließlich über Props. Nach jedem Callback muss das Backend aktualisierte `units`, `cities`, `events` bzw. `match` liefern, sonst ändert sich nichts auf der Karte.
- **`lastCombat`:** Der Toast reagiert auf Änderungen der Objekt-Identität. Liefere für jeden Kampf ein neues Objekt (auch bei gleichem Inhalt). Die Kampfanimation startet lokal sofort beim Klick, das Ergebnis darf also kurz danach (in der Vorschau nach etwa 850 ms) kommen.
- **Kriegsnebel serverseitig durchsetzen:** `HexMap` blendet feindliche Einheiten außerhalb sichtbarer Felder aus. Städte auf unerforschten Feldern zeigen weder Karte noch Minikarte (auch wenn sie im Payload stehen), Städte auf erforschten, nicht sichtbaren Feldern erscheinen abgeschwächt. Die Ausblendung ist nur Darstellung: Sende trotzdem nur Städte, die der Spieler kennt, mit dem zuletzt gesehenen Besitzer, und keine Feinde außerhalb der Sicht.
- **Produktion:** Die Liste der baubaren Typen berechnet `Spielfeld` selbst (allgemeine Typen plus Sondereinheit der eigenen Fraktion, Seeeinheiten nur bei angrenzendem Wasser). Die angezeigte Bauzeit berechnet `CityPanel` mit `withBonus()` aus `productionTurns` und dem `bonus` der Besitzerfraktion (z. B. Eisenbund: Landeinheiten eine Runde schneller, mindestens 1 Runde); `Spielfeld` übergibt dafür die Fraktion als Prop `faction`. Weicht der Bonus vom Grundwert ab, steht der Grundwert durchgestrichen davor und der Bonuswert in Amber. Der Server muss denselben Bonus in `production.turnsRemaining` einrechnen, damit Liste und Fortschrittsbalken übereinstimmen. Ein Tipp auf den Typ, der bereits in Produktion ist, ruft `onSetProduction` nicht auf, der Fortschritt bleibt erhalten.
- **Wiederholung:** `onSkipReplay` dient sowohl für „Überspringen“ als auch für das automatische Ende. Liefere `replay` aus den gespeicherten Zügen (Turn) der Gegner, gefiltert auf die Sicht des Spielers.
- **Spielerprofil & Einstellungen:** Die Einstellungen „Kampfanimationen“, „Gegnerzug-Wiederholung“, „Nachfrage beim Zugende“, „rechte Maustaste“, „Ziehen“ und „Zoom-Empfindlichkeit“ aus dem Bereich Spielerprofil & Einstellungen werden von den Komponenten nicht als Props ausgewertet. Willst du sie berücksichtigen, musst du die Komponenten erweitern (z. B. Phase `replay` überspringen, wenn die Wiederholung abgeschaltet ist).
- **Asynchrone Partien:** Bei `mode: "async"` kommt die Frist aus `turnDeadline`; Zug-Benachrichtigungen gehören zum Bereich Lobby & Multiplayer.
- **Dauerhafte Spielstände:** Laut Produktübersicht speichert der Server jede Partie nach jedem Zug dauerhaft, damit laufende Partien einen Neustart oder Absturz überstehen. Speichere spätestens bei `onEndTurn` den vollständigen Zustand (Karte, Sichtbarkeit je Teilnehmer, Städte, Einheiten, Befehle, Ereignisse, Turn-Historie für die Wiederholung).
- **Audio:** `product/audio-brief.md` definiert adaptive Spielfeldmusik (`field-explore`, `field-tension`, `field-combat`) und Effekte wie `turn-start`, `turn-end`, `replay-step`, `path-preview`, `combat-*`, `city-captured`, `city-lost`, `production-done`, `fuel-low`. Die Komponenten spielen keinen Ton ab; hänge die Sounds an die passenden Callbacks und Prop-Änderungen.
- **Grafik:** Das Spielfeld nutzt Vektor-Symbole aus `unitIcons.tsx`, nicht die Illustrationen aus `product/art-brief.md` (die sind für das Kompendium). Neue Einheitentypen brauchen ein Symbol in `ICONS`, sonst greift das Rückfall-Symbol des Einsatzgebiets.
- **Nicht enthalten:** Chat und Diplomatie, Rückgängig-Funktion, Statistik- und Endbildschirm.

## Referenzdateien

- `product-plan/sections/spielfeld-and-zuge/README.md`: Überblick, Gestaltung, Datenformen, Callbacks
- `product-plan/sections/spielfeld-and-zuge/tests.md`: Test-Spezifikation
- `product-plan/sections/spielfeld-and-zuge/types.ts`: Datentypen und Props
- `product-plan/sections/spielfeld-and-zuge/sample-data.json`: Beispieldaten
- `product-plan/sections/spielfeld-and-zuge/screenshot.png`: Visuelle Referenz (Desktop)
- `product-plan/sections/spielfeld-and-zuge/components/`: `Spielfeld.tsx`, `HexMap.tsx`, `UnitPanel.tsx`, `CityPanel.tsx`, `EventLog.tsx`, `MiniMap.tsx`, `bonus.ts`, `hex.ts`, `unitIcons.tsx`, `index.ts`

## Fertig, wenn

- [ ] Das Spielfeld zeigt echte Partiedaten aus dem Backend statt der Beispieldaten
- [ ] Lade-, Fehler- und Leerzustände sind umgesetzt (inklusive der Leerzustände aus `tests.md`)
- [ ] Alle 14 Callbacks sind mit Backend-Aktionen verbunden und liefern aktualisierte Props zurück
- [ ] Die Abläufe Wiederholung → Zug → Zug beenden → Warten funktionieren durchgängig, inklusive Phasenwechsel
- [ ] Bewegung, Mehrrunden-Marsch, Wache, Patrouille, Überspringen, Angriff, Eroberung, Produktion, Beladen, Ausladen und Starten werden serverseitig validiert und ausgeführt
- [ ] `lastCombat` löst Toast und, bei eroberter Stadt, das Stadt-Panel aus
- [ ] Kriegsnebel wird serverseitig durchgesetzt (keine unbekannten Städte oder unsichtbaren Feinde im Payload)
- [ ] Die Shell-Kopfleiste zeigt Runde, Zugstatus und bei asynchronen Partien die Frist
- [ ] Der Spielstand wird nach jedem Zug dauerhaft gespeichert und übersteht einen Server-Neustart
- [ ] Die Darstellung entspricht `screenshot.png`
- [ ] Responsiv: Bottom-Sheets und einklappbare Minikarte auf Mobilgeräten, Panels auf Desktop; Tippen, Ziehen, Pinch und Mausrad funktionieren
- [ ] Esc und Rechtsklick brechen stufenweise ab

---

# Meilenstein 3: Fraktionen & Einheiten

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** Meilenstein 1 (Shell) abgeschlossen, dazu alle vorherigen Bereichs-Meilensteine

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

---

# Meilenstein 4: Partie-Setup & KI-Gegner

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** Meilenstein 1 (Shell) abgeschlossen, dazu alle vorherigen Bereichs-Meilensteine

## Ziel

Den Assistenten „Neue Partie“ umsetzen, mit dem ein Spieler eine Partie konfiguriert – Regeln, eigene Fraktion, Gegner und Mitspieler, Karte – und sie anlegt. Am Ende entsteht im Backend eine Partie mit Teilnehmern, Einladungen und Kartenparametern, die entweder sofort startet oder in der Lobby auf Mitspieler wartet.

## Überblick

Der Assistent `PartieSetup` führt in fünf Schritten von „Neue Partie“ bis „Partie erstellen“. Der Spieler wählt zuerst seine Fraktion und stellt danach die Gegner auf. Menschliche Mitspieler kommen über die Freundesliste, einen Einladungslink oder offene Plätze dazu; KI-Plätze werden mit einer Persönlichkeit (die ihre Fraktion festlegt) und einer Schwierigkeit besetzt. Freie Plätze können beim Start automatisch mit KI (Normal) aufgefüllt werden. Die Komponente hält den Entwurf selbst und übergibt ihn erst beim Erstellen vollständig per Callback.

**Kernfunktionen:**
- Schritt-Assistent mit Fortschrittsleiste, Sprung zu besuchten Schritten und Blockierhinweisen bei fehlenden Pflichtangaben
- Fraktionswahl mit Sperre von Fraktionen, die bereits ein KI-Gegner führt
- 2 bis 6 Plätze, besetzbar mit Freund, Einladung per Link, offenem Platz oder KI-Persönlichkeit samt Schwierigkeit
- Einladungslink kopieren und über das Teilen-Menü des Geräts verschicken
- Karteneinstellungen inkl. Kartencode (Seed) zum erneuten Spielen derselben Welt
- Übersicht mit „Ändern“-Links, Warnhinweisen und „Partie erstellen“

## Enthaltene Komponenten

Kopiere aus `product-plan/sections/partie-setup-and-ki-gegner/components/`:

- `PartieSetup.tsx` – Hauptkomponente (Assistent, Fußleiste, Dialoge)
- `StepRules.tsx` – Schritt 1 „Modus & Regeln“
- `StepFaction.tsx` – Schritt 2 „Deine Fraktion“
- `StepPlayers.tsx` – Schritt 3 „Gegner & Mitspieler“
- `StepMap.tsx` – Schritt 4 „Karte“
- `StepSummary.tsx` – Schritt 5 „Übersicht“
- `Pickers.tsx` – `AiPicker` („KI-Gegner wählen“) und `FriendPicker` („Freund einladen“)
- `ui.tsx` – `Avatar`, `FactionEmblem`, `Field`, `OptionCard`, `Segmented`, `Sheet`, `Toggle`
- `setup.ts` – Schrittreihenfolge, Farben, Regeln (`stepBlocker`, `summaryWarnings`, `aiFactions`, `resizeSeats`, `randomSeed`)
- `index.ts` – Exporte

Dazu `types.ts` (die Komponenten importieren aus `../types`). Benötigt werden `lucide-react` und die Schriften Big Shoulders Display, Barlow und IBM Plex Mono.

## Props-Referenz

**Daten-Props** (`PartieSetupProps`):

- `you: Player` – der angemeldete Spieler, immer Platz 1
- `factions: Faction[]` – spielbare Fraktionen (Name, Kurzname, Farbe, Leitspruch, Eigenheit, Wappen)
- `aiPersonalities: AiPersonality[]` – KI-Persönlichkeiten mit fester `factionId`
- `friends: Friend[]` – Freundesliste mit Status `online` / `inGame` / `offline` und `lastSeen`
- `options: SetupOptions` – wählbare Werte: Kartengrößen, Landanteil (min/max/step, Endbeschriftungen), Stufen, Zugfristen, Zeitlimits, Siegbedingungen, Rundenlimits
- `draft: MatchDraft` – Startwerte des Assistenten (nur beim ersten Rendern gelesen)
- `inviteLink: string` – Einladungslink der künftigen Partie

**Callback-Props:**

| Callback | Ausgelöst wenn |
|---|---|
| `onRandomizeSeed(): string` | „Neu würfeln“ beim Kartencode geklickt wird; der Rückgabewert wird zum neuen Kartencode. Ohne Callback erzeugt `randomSeed()` lokal einen Code. |
| `onCopyInviteLink(link)` | „Kopieren“ beim Einladungslink geklickt wird (die Komponente kopiert zusätzlich selbst per `navigator.clipboard`). |
| `onShareInviteLink(link)` | „Teilen“ beim Einladungslink geklickt wird. |
| `onCreateMatch(draft)` | „Partie erstellen“ in der Übersicht geklickt wird und kein Schritt blockiert; liefert den vollständigen `MatchDraft`. |
| `onCancel()` | „Abbrechen“ bei unverändertem Entwurf, oder „Verwerfen“ im Dialog „Einrichtung abbrechen?“. |

## Erwartete Abläufe

### Ablauf 1: Solo-Partie gegen KI anlegen

1. Der Spieler wählt „Neue Partie“ in der Navigation; Schritt 1 „Modus & Regeln“ erscheint mit Vorgabewerten.
2. Er prüft den Namen (Pflicht) und klickt „Weiter“.
3. In „Deine Fraktion“ wählt er z. B. „Eisenbund von Valdrin“ und klickt „Weiter“.
4. In „Gegner & Mitspieler“ klickt er bei Platz 2 auf „KI“, wählt im Dialog „KI-Gegner wählen“ „Admiral Kessler“ und stellt die Schwierigkeit auf „Schwer“.
5. „Weiter“ zur „Karte“, „Weiter“ zur „Übersicht“; dort steht „Nur KI-Gegner: Die Partie startet sofort als Solo-Partie.“
6. Er klickt „Partie erstellen“.

**Ergebnis:** `onCreateMatch` erhält den Entwurf; das Backend legt die Partie an, startet sie sofort und leitet zum Spielfeld weiter.

### Ablauf 2: Mitspieler einladen

1. In „Gegner & Mitspieler“ erhöht der Spieler mit „Platz hinzufügen“ die Anzahl.
2. Er besetzt einen Platz mit „Freund“ → Dialog „Freund einladen“ → Suche → z. B. „Lena Hartmann“.
3. Weitere Plätze setzt er auf „Einladung“ oder „Offen“.
4. Er klickt beim Einladungslink auf „Kopieren“ oder „Teilen“.
5. In der Übersicht weisen Hinweise darauf hin, dass die Partie in der Lobby wartet bzw. Live-Partien erst starten, wenn alle beigetreten sind.
6. Er klickt „Partie erstellen“.

**Ergebnis:** Das Backend legt Partie, Teilnehmer und Einladungen an; die Partie erscheint im Status „wartet auf Spieler“ im Warteraum der Lobby.

### Ablauf 3: Fraktionskonflikt auflösen

1. „Doppelte Fraktionen erlauben“ ist aus. Der Spieler hat „Aurelische Republik“ gewählt.
2. Im Dialog „KI-Gegner wählen“ sind „Admiral Kessler“ und „Senatorin Varenne“ ausgegraut mit „Aurelia ist schon vergeben“.
3. Kehrt er nach dem Aufstellen eines KI-Gegners zu „Deine Fraktion“ zurück, sind dessen Fraktionen gesperrt mit „Geführt von <Name>, ändere die KI unter „Gegner & Mitspieler““.
4. Verbietet er Doppelungen nachträglich, blockiert Schritt 3 mit „Zwei KI-Gegner führen dieselbe Fraktion. Doppelte Fraktionen sind nicht erlaubt.“ bzw. „Ein KI-Gegner führt deine Fraktion. Wähle eine andere KI-Persönlichkeit oder erlaube doppelte Fraktionen.“

**Ergebnis:** „Weiter“ bzw. „Partie erstellen“ ist erst wieder aktiv, wenn der Konflikt behoben ist.

### Ablauf 4: Abbrechen

1. Der Spieler klickt „Abbrechen“.
2. Ist der Entwurf verändert, erscheint „Einrichtung abbrechen?“ mit „Weiter einrichten“ und „Verwerfen“.

**Ergebnis:** Bei „Verwerfen“ (oder unverändertem Entwurf direkt) wird `onCancel` aufgerufen; die App navigiert zurück, z. B. in die Lobby.

## Leere Zustände

- Startzustand: Platz 1 „Noch keine Fraktion gewählt“, Platz 2 „Wer besetzt diesen Platz?“ mit „Freund“, „Einladung“, „Offen“, „KI“.
- Freie Plätze in der Übersicht: „KI (Normal) beim Start“ bzw. „Noch frei“.
- Leerer Name: Stempel „Ohne Namen“, Blocker „Gib der Partie einen Namen.“
- Freundessuche ohne Treffer: „Kein Freund mit „<Suche>“ gefunden.“
- Leere Freundesliste: „Du hast noch keine Freunde. Lade Mitspieler stattdessen über den Einladungslink ein.“
- Leere `aiPersonalities`: „Es sind keine KI-Gegner verfügbar.“ Das Backend sollte trotzdem immer Persönlichkeiten liefern.
- Leerer Kartencode: Blocker „Gib einen Kartencode ein oder würfle einen neuen.“
- Persönlichkeiten ohne `style` zeigen keine Chips; fehlende Bilder werden durch Wappen-Platzhalter bzw. Initialen ersetzt.
- Ladezustand: Die Komponente erwartet alle Daten beim ersten Rendern. Zeige vorher einen Ladezustand und rendere `PartieSetup` erst, wenn `factions`, `aiPersonalities`, `friends`, `options`, `draft` und `inviteLink` vorliegen.

## Tests

Siehe `product-plan/sections/partie-setup-and-ki-gegner/tests.md` für Abläufe, Validierungen, Leerzustände, Grenzfälle, Barrierefreiheit und Beispiel-Testdaten.

## Hinweise zur Umsetzung

- **Lokaler State:** `PartieSetup` kopiert `draft` beim ersten Rendern in seinen eigenen State und meldet Zwischenstände nicht nach außen. Ein später geändertes `draft`-Prop wird ignoriert; für einen neuen Entwurf die Komponente per `key` neu mounten. Soll der Entwurf Seitenwechsel überleben, musst du ihn selbst persistieren (die Komponente bietet dafür keinen Callback).
- **Regeln in `setup.ts` auch im Backend prüfen:** `stepBlocker` (Name nicht leer, Fraktion gewählt, jeder Platz festgelegt oder Auffüllen aktiv, Kartencode nicht leer, keine doppelten KI-Fraktionen bzw. keine KI mit der eigenen Fraktion, wenn Doppelungen verboten sind), `MIN_SEATS`/`MAX_SEATS` (2–6), Platz 0 immer `{ kind: 'you' }`. Der Server muss `onCreateMatch`-Daten validieren, nicht nur die UI.
- **Fraktionen menschlicher Mitspieler:** Freunde, Einladungs- und offene Plätze „wählen die Fraktion selbst“ – das passiert im Warteraum (Lobby & Multiplayer). Die Regel `allowDuplicateFactions` muss dort ebenfalls durchgesetzt werden, auch gegenüber der Fraktion des Erstellers und der KI.
- **Partie anlegen (`onCreateMatch`):** Daraus entstehen `Match` (Name, Modus, Zugfrist/Zeitlimit, Siegbedingung, Rundenlimit, Fraktionsregel, Status), `Participant` je Platz, `Invitation` je `friend`-Platz (Benachrichtigung an den Freund) und `Map`-Parameter (Größe, Landanteil, neutrale Städte, Gelände, Seed). Startlogik laut Spec: Live-Partien ohne ausstehende Einladungen starten sofort, sonst wartet die Partie in der Lobby. Bei `fillEmptyWithAI` ersetzt der Server beim Start freie, offene und nicht angenommene Plätze durch KI-Gegner (Schwierigkeit Normal); die Persönlichkeit wählt der Server (unter Beachtung der Fraktionsregel).
- **Vom Vorschau-Wrapper simuliert, real zu bauen:** `inviteLink` muss vom Backend vor dem Erstellen reserviert oder erzeugt werden (er wird im Assistenten schon angezeigt); er besetzt Plätze vom Typ „Einladung per Link“. `onShareInviteLink` soll die Web Share API (`navigator.share`) aufrufen, mit Kopieren als Rückfall. `onCopyInviteLink` eignet sich für eine Bestätigung („Link kopiert“), die Komponente zeigt selbst keine.
- **Kartencode:** `onRandomizeSeed` sollte einen Seed im Format des Kartengenerators liefern (die Vorschau nutzt `WORT-1234`). Die Eingabe wird auf `A–Z`, `0–9`, `-` und 16 Zeichen begrenzt; ein leerer Code sperrt Schritt 4 mit „Gib einen Kartencode ein oder würfle einen neuen.“ Der Server sollte trotzdem einen leeren Seed ablehnen. Gleicher Seed plus gleiche Einstellungen müssen dieselbe Welt erzeugen. Das „Kopieren“ beim Kartencode nutzt nur `navigator.clipboard`, ohne Callback.
- **Startwerte:** `draft` liefert der Server (Vorgabewerte, ggf. aus früheren Partien); `factionId` ist `null`, Plätze `[{ kind: 'you' }, { kind: 'empty' }]`. Die Beispieldaten haben bereits einen Namen („Die Kohleinseln II“), sodass Schritt 1 sofort gültig ist.
- **Layout:** Die Fußleiste ist `sticky` und sitzt auf dem Smartphone über der Tab-Leiste der Shell (`bottom: calc(4rem + env(safe-area-inset-bottom))`); passe den Abstand an, falls die Shell-Tab-Leiste eine andere Höhe hat. Beim Schrittwechsel scrollt die Komponente per `window.scrollTo` nach oben. Die Shell sollte den Navigationspunkt „Neue Partie“ als aktiv markieren (im Screenshot ist noch „Lobby“ hervorgehoben).
- **Dialoge:** `Sheet` schließt mit Escape und Klick auf den Hintergrund. Beim Öffnen springt der Fokus in den Dialog (erstes Formularfeld, sonst der erste Button nach „Schließen“), Tab und Umschalt+Tab bleiben im Dialog, beim Schließen kehrt der Fokus zum auslösenden Element zurück.
- **Bilder:** Wappen kommen aus `faction.emblemUrl` (`public/art/factions/<faction-id>-emblem.png`, siehe `product/art-brief.md`). KI-Porträts kommen aus `aiPersonality.portraitUrl` (`public/art/portraits/<personality-id>.webp`, 1:1); Motive und Prompts stehen im Abschnitt „KI-Persönlichkeiten“ des Art-Briefs (`product-plan/briefs/art-brief.md`). Fehlt ein Porträt, greifen die Initialen.
- **Ton:** Laut `product/audio-brief.md` läuft im Setup die Menümusik `menu-setup`; passende Effekte sind `ui-click` (Buttons, Auswahl), `ui-toggle` (Schalter, Segmente), `ui-panel-open`/`ui-panel-close` (Dialoge) und `ui-error` (gesperrte Aktion, z. B. Klick auf eine gesperrte Fraktion).
- **Persistenz:** Laut Produktübersicht speichert der Server jede Partie dauerhaft. Die Partie muss daher mit dem Erstellen persistent angelegt werden (inkl. Seed und aller Regeln), damit Warteraum und Spielfeld nach einem Server-Neustart darauf zugreifen können.

## Referenzdateien

- `product-plan/sections/partie-setup-and-ki-gegner/README.md`
- `product-plan/sections/partie-setup-and-ki-gegner/tests.md`
- `product-plan/sections/partie-setup-and-ki-gegner/types.ts`
- `product-plan/sections/partie-setup-and-ki-gegner/sample-data.json`
- `product-plan/sections/partie-setup-and-ki-gegner/screenshot.png`
- `product-plan/sections/partie-setup-and-ki-gegner/components/` (`PartieSetup.tsx`, `StepRules.tsx`, `StepFaction.tsx`, `StepPlayers.tsx`, `StepMap.tsx`, `StepSummary.tsx`, `Pickers.tsx`, `ui.tsx`, `setup.ts`, `index.ts`)

## Fertig, wenn

- [ ] `PartieSetup` mit echten Daten aus dem Backend gerendert wird (Spieler, Fraktionen, KI-Persönlichkeiten, Freundesliste, Optionen, Startentwurf, Einladungslink)
- [ ] Lade-, Fehler- und Leerzustände umgesetzt sind
- [ ] Alle Callbacks verbunden sind: `onRandomizeSeed`, `onCopyInviteLink`, `onShareInviteLink`, `onCreateMatch`, `onCancel`
- [ ] „Partie erstellen“ eine persistente Partie mit Teilnehmern, Einladungen und Kartenparametern anlegt und je nach Fall zum Spielfeld (Solo/sofortiger Start) oder in den Warteraum navigiert
- [ ] Der Server die Regeln aus `stepBlocker` (Plätze, Fraktionen, Name) erneut validiert und Fehler verständlich zurückmeldet
- [ ] Eingeladene Freunde eine Einladung erhalten und der Einladungslink Plätze vom Typ „Einladung per Link“ besetzt
- [ ] Freie Plätze bei aktivem Auffüllen beim Start durch KI (Normal) ersetzt werden
- [ ] Derselbe Kartencode mit denselben Einstellungen dieselbe Welt erzeugt
- [ ] Alle Abläufe aus `tests.md` Ende-zu-Ende funktionieren
- [ ] Die Darstellung dem Screenshot entspricht
- [ ] Desktop, Tablet und Smartphone (kompakte Fortschrittsleiste, Bottom-Sheets, Fußleiste über der Tab-Leiste) sowie heller und dunkler Modus funktionieren

---

# Meilenstein 5: Lobby & Multiplayer

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** Meilenstein 1 (Shell) abgeschlossen, dazu alle vorherigen Bereichs-Meilensteine

## Ziel

Die Lobby als Startseite der App umsetzen: Der Spieler sieht auf einen Blick, wo er am Zug ist, verwaltet seine übrigen Partien, Einladungen, offene und beendete Partien und bringt wartende Partien über den Warteraum an den Start.

## Überblick

Die Lobby („Lagebericht“) ist ein Dashboard. Oben stehen als große Karten alle Partien, in denen der Spieler am Zug ist, sortiert nach der kürzesten Frist und mit roter Warnung kurz vor Ablauf. Darunter folgen „Weitere Partien“ (andere am Zug oder im Warteraum) und „Einladungen“, darunter die Tabs „Offene Partien“ und „Beendet“. Ein Banner bittet um die Erlaubnis für Push-Benachrichtigungen. Partien, die auf Mitspieler warten, haben einen eigenen Warteraum mit Platzliste, Einladungslink, Regeln, Bereit-Schalter und einem Start-Button für den Ersteller.

**Kernfunktionen:**
- Partien nach Zustand gruppiert, eigene Züge nach Frist sortiert, Frist-Warnung unter `deadlineWarningHours`
- Mitspieler in asynchronen Partien erinnern, mit 12-Stunden-Sperre
- Partie-Details und Aufgeben (KI übernimmt die Fraktion) als Dialog bzw. Bottom-Sheet
- Einladungen annehmen/ablehnen, offenen Partien beitreten, beendete Partien mit Ergebnis-Stempel
- Warteraum mit Bereit-Status, Start-Sperre, Auffüllen freier Plätze mit KI und Einladungslink
- Push-Banner für die Zug-Benachrichtigung in den Zuständen „noch nicht gefragt“ und „blockiert“

## Enthaltene Komponenten

Kopiere die Dateien aus `product-plan/sections/lobby-and-multiplayer/components/`:

- `Lobby.tsx` – Lobby-Ansicht (`Lobby`)
- `Warteraum.tsx` – Warteraum-Ansicht (`Warteraum`)
- `MatchCard.tsx` – Partie-Karte, Varianten `feature` und `compact`, mit Aktionsmenü
- `MatchDialogs.tsx` – `MatchDetailsSheet` und `SurrenderSheet`
- `shared.tsx` – `FactionEmblem`, `Avatar`, `ParticipantChip`, `MiniMap`, `Sheet`, `Chip`, `SectionHeading`
- `format.ts` – `FACTION_HEX`, `DIFFICULTY_LABEL`, `timeLeft`, `timeAgo`, `hoursSince`
- `index.ts` – Sammel-Export

Dazu `types.ts` aus `product-plan/sections/lobby-and-multiplayer/`. Die Komponenten importieren die Typen über `../types`.

## Props-Referenz

**Daten-Props:**

- `LobbyProps`: `now` (Referenzzeit für Fristen und „vor …“-Angaben), `you: Player`, `pushPermission: 'default' | 'granted' | 'denied'`, `deadlineWarningHours`, `factions: Faction[]`, `matches: Match[]` (Status `yourTurn`, `othersTurn`, `waitingForPlayers`), `invitations: Invitation[]`, `openMatches: OpenMatch[]`, `finishedMatches: FinishedMatch[]`
- `Match`: Name, Status, Runde, `turnDeadline` (nur asynchron), `currentParticipantId`, `remindedAt`, `isHost`, `participants: Participant[]`, `rules: MatchRules`, `map: MatchMapInfo`, `miniMap: string[]`, `waitingFor?`
- `WarteraumProps`: `room: WaitingRoom` (Name, `isHost`, `inviteLink`, Regeln, Karte, `fillEmptyWithAI`, `seats: WaitingSeat[]`), `factions: Faction[]`
- `WaitingSeat`: Diskriminierte Union über `kind` – `player` (`ready`/`joined`), `ai` (`ready`, mit `aiDifficulty`), `invited` (`pending`), `open` (`pending`)

**Callback-Props:**

| Callback | Ausgelöst wenn |
|---|---|
| `onPlay(matchId)` | „Weiterspielen“ auf einer Karte in „Du bist am Zug“ angetippt wird |
| `onOpenWaitingRoom(matchId)` | „Warteraum“ bei einer wartenden Partie angetippt wird |
| `onRemind(matchId, participantId)` | „Erinnern“ angetippt wird (Teilnehmer am Zug) |
| `onSurrender(matchId)` | „Aufgeben“ im Dialog „Partie aufgeben?“ bestätigt wird |
| `onShowDetails(matchId)` | „Partie-Details“ im Menü gewählt wird (Dialog öffnet die Komponente selbst) |
| `onAcceptInvitation(invitationId)` | „Annehmen“ auf einer Einladung angetippt wird |
| `onDeclineInvitation(invitationId)` | „Ablehnen“ auf einer Einladung angetippt wird |
| `onJoinOpenMatch(openMatchId)` | „Beitreten“ bei einer offenen Partie angetippt wird |
| `onEnablePush()` | „Aktivieren“ im Push-Banner angetippt wird |
| `onDismissPushBanner()` | „Später“ bzw. „Ausblenden“ im Push-Banner angetippt wird |
| `onNewMatch()` | „Neue Partie“ (Kopfzeile oder Leerzustand) angetippt wird |
| `onToggleReady(ready)` | im Warteraum „Bereit melden“ / „Bereit“ umgeschaltet wird |
| `onStartMatch(fillEmptyWithAI)` | der Ersteller „Starten“ antippt; Argument = Zustand der KI-Checkbox |
| `onLeave()` | „Verlassen“ im Dialog „Warteraum verlassen?“ bestätigt wird |
| `onCopyInviteLink(link)` | „Kopieren“ beim Einladungslink angetippt wird |
| `onShareInviteLink(link)` | „Teilen“ beim Einladungslink angetippt wird |
| `onBack()` | der Link „Lobby“ im Warteraum angetippt wird (ohne die Partie zu verlassen) |

## Erwartete Abläufe

### Ablauf 1: Weiterspielen mit Frist-Warnung

1. Der Spieler öffnet die App und landet in der Lobby („Lagebericht“, „Björn, 3 Fronten warten auf deinen Befehl.“).
2. Unter „Du bist am Zug“ steht „Salz und Schwefel“ zuerst, mit rotem Rahmen und Stempel „noch 1 Std. 40 Min.“.
3. Er tippt „Weiterspielen“.

**Ergebnis:** `onPlay('m-salz')` wird aufgerufen, die App navigiert zum Spielfeld dieser Partie (Bereich „Spielfeld & Züge“).

### Ablauf 2: Mitspieler erinnern und Partie aufgeben

1. Unter „Weitere Partien“ zeigt „Nordwind“ „Lena Hartmann ist am Zug“. Der Spieler tippt „Erinnern“.
2. Das Backend verschickt die Erinnerung und liefert `remindedAt` zurück; der Button zeigt „Erinnert“ und bleibt 12 Stunden gesperrt.
3. Bei „Die Kohleinseln“ öffnet er „Weitere Aktionen“ → „Aufgeben“ und bestätigt im Dialog „Partie aufgeben?“ mit „Aufgeben“.

**Ergebnis:** `onRemind('m-nordwind', 'lena')` bzw. `onSurrender('m-kohle')`; nach dem Aufgeben übernimmt serverseitig eine KI (Normal) die Fraktion, die Partie verschwindet aus den laufenden und erscheint unter „Beendet“ mit Stempel „Aufgegeben“.

### Ablauf 3: Einladung annehmen und im Warteraum bereit melden

1. Unter „Einladungen“ tippt der Spieler bei „Inselhüpfen“ auf „Annehmen“.
2. Die App öffnet den Warteraum der Partie. Sein Platz zeigt „Nicht bereit“.
3. Er tippt „Bereit melden“; der Button wechselt zu „Bereit“.

**Ergebnis:** `onAcceptInvitation('inv-1')`, danach Navigation in den Warteraum; `onToggleReady(true)` meldet den Bereit-Status an den Server, der ihn an alle Teilnehmer verteilt.

### Ablauf 4: Partie als Ersteller starten

1. Im Warteraum „Die Kohleinseln II“ steht „3 von 5 Plätzen besetzt · 2 bereit“; „Starten“ ist gesperrt mit dem Hinweis „Warte auf Jonas Vogt“.
2. Jonas meldet sich bereit (neue `room`-Daten vom Server); der Hinweis wechselt zu „Alle sind bereit. Die Partie kann beginnen.“
3. Die Checkbox „2 freie Plätze mit KI auffüllen“ ist angehakt. Der Ersteller tippt „Starten“.

**Ergebnis:** `onStartMatch(true)`; der Server füllt die freien Plätze mit KI-Gegnern, erzeugt die Karte, startet Runde 1 und benachrichtigt alle Teilnehmer. Die App wechselt zum Spielfeld bzw. zurück in die Lobby, wo die Partie nun als laufend erscheint.

## Leere Zustände

| Bereich | Bedingung | Anzeige |
|---|---|---|
| Du bist am Zug | keine `yourTurn`-Partie | „Du bist nirgends am Zug“ · „Zeit für eine neue Partie?“ · Button „Neue Partie“; Untertitel „<Name>, an allen Fronten ist es ruhig.“ |
| Weitere Partien | keine `othersTurn`/`waitingForPlayers`-Partie | „Keine weiteren laufenden Partien.“ |
| Einladungen | `invitations` leer | „Keine offenen Einladungen.“ |
| Offene Partien | `openMatches` leer | „Gerade sucht niemand Mitspieler. Erstelle selbst eine offene Partie.“ |
| Beendet | `finishedMatches` leer | „Noch keine beendeten Partien.“ |

Ein neuer Spieler ohne Partien sieht alle Leerzustände gleichzeitig. Ladezustände und Fehlermeldungen (z. B. Beitritt fehlgeschlagen, Partie voll, Einladung zurückgezogen) sind nicht in den Komponenten enthalten und müssen ergänzt werden.

## Tests

Die Verhaltens-Spezifikation steht in `product-plan/sections/lobby-and-multiplayer/tests.md`: Abläufe mit Erfolgs- und Fehlerfällen, Leerzustände, Komponenten-Interaktionen, Grenzfälle, Barrierefreiheit und Beispiel-Testdaten. Setze dort `now` fest, damit Countdowns und die Erinnerungs-Sperre deterministisch sind.

## Hinweise zur Umsetzung

- **Zeitbezug:** Alle Fristen und „vor …“-Angaben werden aus `now` berechnet, nicht aus der Systemzeit. Übergib `now` vom Server bzw. aktualisiere es regelmäßig (z. B. jede Minute), damit Countdowns laufen und die Frist-Warnung rechtzeitig umschaltet.
- **Regeln in den Komponenten:**
  - Frist-Warnung: nur bei `status: 'yourTurn'` und Restzeit `< deadlineWarningHours` (Beispiel `3`).
  - Sortierung „Du bist am Zug“: nach `turnDeadline` aufsteigend, Live-Partien (`turnDeadline: null`) zuletzt.
  - Erinnern: nur bei `othersTurn`, `rules.mode: 'async'` und menschlichem Teilnehmer am Zug; gesperrt, solange `remindedAt` weniger als 12 Stunden zurückliegt (`REMIND_COOLDOWN_HOURS` in `MatchCard.tsx`). Das Backend muss dieselbe Sperre durchsetzen und `remindedAt` nach dem Erinnern zurückliefern; die Komponente setzt es nicht selbst.
  - Aufgeben ist nur bei laufenden Partien im Menü, nicht bei wartenden.
  - Warteraum-Start: erlaubt, sobald der Spieler Ersteller ist und alle `player`-Plätze `ready` sind. Eingeladene und offene Plätze blockieren nicht; sie zählen als freie Plätze und werden bei `onStartMatch(true)` mit KI aufgefüllt. Prüfe dieselbe Bedingung serverseitig.
  - Textformate stehen in `format.ts` (`timeLeft`, `timeAgo`).
- **Lokaler UI-Zustand vs. Props:**
  - `Lobby`: aktiver Tab, ausgeblendetes Push-Banner, geöffneter Details- bzw. Aufgeben-Dialog sind lokal. Das Ausblenden des Banners gilt nur bis zum nächsten Mounten; soll „Später“ dauerhaft wirken, speichere es über `onDismissPushBanner` und übergib dann `pushPermission`/Sichtbarkeit entsprechend (z. B. Banner nicht rendern).
  - `MatchDetailsSheet` öffnet die Lobby selbst mit den bereits übergebenen `Match`-Daten; `onShowDetails` ist nur eine Benachrichtigung (z. B. für Analytics oder Nachladen).
  - `Warteraum`: Der eigene Bereit-Status und die KI-Checkbox werden beim ersten Rendern aus `room` übernommen und danach lokal gehalten (optimistisch). Ändert der Server den eigenen Status, muss die Komponente neu gemountet werden (z. B. `key`) oder der Zustand angepasst werden. Die Plätze der anderen kommen immer aus `room`.
  - Einladungen, Partien und `remindedAt` ändert die Komponente nicht selbst; nach jedem Callback müssen neue Props kommen.
- **Was die Vorschau simuliert hat (muss das Backend leisten):** Die Design-Vorschau hat beim Erinnern `remindedAt` lokal gesetzt, beim Aufgeben die Partie lokal nach „Beendet“ verschoben, angenommene/abgelehnte Einladungen lokal entfernt und nach „Aktivieren“ `pushPermission` sofort auf `'granted'` gesetzt. Real gehört dazu:
  - `onEnablePush`: `Notification.requestPermission()` aufrufen, Push-Abo (Service Worker, Web Push) registrieren und am Server speichern; danach `pushPermission` aus der tatsächlichen Browser-Berechtigung übergeben (auch `'denied'`).
  - `onSurrender`: Teilnehmer auf `surrendered` setzen, KI-Persönlichkeit auf Stufe „Normal“ einsetzen, Ergebnis als Niederlage verbuchen.
  - `onAcceptInvitation`: Spieler als Participant eintragen, dann zum Warteraum navigieren. `onJoinOpenMatch`: freien Platz belegen (Rennen um den letzten Platz abfangen), dann zum Warteraum.
  - `onShareInviteLink`: `navigator.share({ url: link })` aufrufen, mit Fallback auf Kopieren, wo die Web-Share-API fehlt. `onCopyInviteLink`: Die Komponente kopiert bereits per `navigator.clipboard`; nutze den Callback für eine Bestätigung (Toast).
  - `onLeave`: Als Ersteller wird die Partie aufgelöst und alle Mitspieler werden benachrichtigt (so verspricht es der Dialogtext), sonst wird nur der Platz frei.
  - Einladungslink (`inviteLink`) erzeugen und beim Öffnen einen freien Platz besetzen.
- **Echtzeit:** Der Warteraum (Beitritte, Bereit-Status) und die Lobby (wer ist am Zug, neue Einladungen) sollten per WebSocket/SSE oder Polling aktualisiert werden.
- **Benachrichtigungen:** Laut Produktübersicht werden Spieler in asynchronen Partien benachrichtigt, sobald sie am Zug sind (Push und E-Mail). Die E-Mail-Einstellungen liegen im Bereich „Spielerprofil & Einstellungen“; die Banner-Texte verweisen dorthin.
- **Dauerhafte Spielstände:** Der Server speichert jede Partie nach jedem Zug; die Lobby-Daten (Runde, Frist, Mini-Lagekarte, Teilnehmerstatus) müssen sich nach einem Server-Neustart unverändert aus dem gespeicherten Zustand ergeben.
- **Mini-Lagekarte:** `miniMap` ist ein vom Server abgeleitetes Grob-Raster (`~` Wasser, `.` neutrales Land, Ziffer = Index in `participants`). Die Auflösung ist unabhängig von der Kartengröße (Beispiel: 24×12 Zeichen bei einer 18×12-Karte). Es sollte nur Gebiete zeigen, die der Spieler sehen darf (Kriegsnebel), und für wartende Partien leer sein.
- **Abhängigkeiten zu anderen Bereichen:** `onNewMatch` → „Partie-Setup & KI-Gegner“; `onPlay` → „Spielfeld & Züge“; Fraktionsdaten und Wappen (`emblemUrl`) → „Fraktionen & Einheiten“ bzw. `product/art-brief.md`. Ohne ladbares Wappen zeigt `FactionEmblem` ein SVG-Schild in Fraktionsfarbe.
- **Audio:** Laut `product/audio-brief.md` läuft in der Lobby der Musik-Loop `menu-lobby`, im Warteraum `menu-setup`. Die Komponenten spielen keinen Ton ab; das übernimmt die App beim Routing.
- **Shell:** Beide Ansichten laufen innerhalb der Shell. Die Aktionsleiste des Warteraums klebt auf Mobilgeräten oberhalb der Tab-Leiste der Shell (`bottom-[calc(4rem+env(safe-area-inset-bottom))]`); passe den Abstand an, falls die Tab-Leiste anders hoch ist.
- **Schriften:** Big Shoulders Display, Barlow und IBM Plex Mono müssen global geladen sein (siehe Design-Tokens).
- **Abweichungen Spec ↔ Komponenten:** Der Start-Button heißt in der Komponente „Starten“ (Spec: „Partie starten“); „Erinnern“ ist ein sichtbarer Button an der Karte, das Menü enthält nur „Partie-Details“ und „Aufgeben“.

## Referenzdateien

- `product-plan/sections/lobby-and-multiplayer/README.md` – Überblick, Gestaltung, Datenformen, Callbacks
- `product-plan/sections/lobby-and-multiplayer/tests.md` – Test-Spezifikation
- `product-plan/sections/lobby-and-multiplayer/types.ts` – Daten- und Props-Interfaces
- `product-plan/sections/lobby-and-multiplayer/sample-data.json` – Beispieldaten (Lobby und `waitingRoom`)
- `product-plan/sections/lobby-and-multiplayer/screenshot-lobby.png` – Lobby
- `product-plan/sections/lobby-and-multiplayer/screenshot-warteraum.png` – Warteraum
- `product-plan/sections/lobby-and-multiplayer/components/` – `Lobby.tsx`, `Warteraum.tsx`, `MatchCard.tsx`, `MatchDialogs.tsx`, `shared.tsx`, `format.ts`, `index.ts`

## Fertig, wenn

- [ ] Lobby und Warteraum zeigen echte Daten aus dem Backend statt Beispieldaten
- [ ] Alle Leerzustände erscheinen korrekt (inkl. neuer Spieler ohne Partien)
- [ ] Lade- und Fehlerzustände sind ergänzt (Beitritt fehlgeschlagen, Partie voll, Einladung nicht mehr gültig)
- [ ] Alle 17 Callbacks sind mit Routing bzw. Geschäftslogik verbunden
- [ ] Die Abläufe Weiterspielen, Erinnern, Aufgeben, Einladung annehmen/ablehnen, Beitreten, Bereit melden, Starten und Verlassen funktionieren Ende-zu-Ende
- [ ] Die Darstellung entspricht den Screenshots (`screenshot-lobby.png`, `screenshot-warteraum.png`)
- [ ] Responsiv auf Desktop, Tablet und Smartphone (Dialoge als Bottom-Sheet, Warteraum-Leiste über der Tab-Leiste), heller und dunkler Modus
- [ ] `now` wird laufend aktualisiert; Countdowns und Frist-Warnung schalten ohne Neuladen um
- [ ] Die 12-Stunden-Sperre fürs Erinnern und die Start-Bedingung im Warteraum werden auch serverseitig geprüft
- [ ] Nach dem Aufgeben übernimmt eine KI (Normal) die Fraktion, die Partie zählt als Niederlage und erscheint unter „Beendet“
- [ ] Push-Benachrichtigungen lassen sich aktivieren; `pushPermission` spiegelt die echte Browser-Berechtigung, `'denied'` zeigt den Hilfetext
- [ ] Einladungslink kann kopiert und über das Teilen-Menü des Geräts geteilt werden; Öffnen des Links besetzt einen freien Platz
- [ ] Warteraum und Lobby aktualisieren sich bei Änderungen anderer Spieler (Beitritt, Bereit, Zugwechsel) ohne manuelles Neuladen
- [ ] Partiedaten überstehen einen Server-Neustart (dauerhafte Spielstände)

---

# Meilenstein 6: Spielerprofil & Einstellungen

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** Meilenstein 1 (Shell) abgeschlossen, dazu alle vorherigen Bereichs-Meilensteine

## Ziel

Spieler können ihre Bilanz und ihren Partieverlauf einsehen, Anzeigename und Avatar pflegen und alle persönlichen Einstellungen (Benachrichtigungen, Darstellung, Ton, Steuerung, Konto) verwalten – einschließlich Abmelden und Kontolöschung.

## Überblick

Der Bereich besteht aus zwei Seiten, die über das Benutzermenü der Shell („Profil“ und „Einstellungen“, Callbacks `onOpenProfile` / `onOpenSettings` in `UserMenu`) erreicht werden. Das Profil ist als „Dienstakte“ in den Farben der Lieblingsfraktion gestaltet und zeigt Kennzahlen, eine Statistik je Fraktion und einen filterbaren Partieverlauf. Die Einstellungen („Maschinenraum“) sind in fünf Rubriken gegliedert, speichern jede Änderung sofort und bestätigen sie mit einem kurzen „Gespeichert“.

**Kernfunktionen:**
- Bilanz (Partien, Siege, Siegquote, Städte erobert, Einheiten gebaut, längste Partie) und Statistik je Fraktion
- Partieverlauf mit Ergebnis-Stempeln, Filtern nach Ergebnis und Fraktion und „Mehr anzeigen“
- Anzeigename (3–24 Zeichen) und Avatar ändern
- Benachrichtigungen (Push/E-Mail je Anlass, E-Mail-Verzögerung), Darstellung, Ton und Steuerung mit sofortigem Speichern
- E-Mail- und Passwortänderung, Abmelden (dieses Gerät / alle Geräte)
- Zweistufige Kontolöschung mit Eingabe des Anzeigenamens

## Enthaltene Komponenten

Aus `product-plan/sections/spielerprofil-and-einstellungen/components/` übernehmen:

- `Profil.tsx` – Profilseite inkl. Dialog „Profil bearbeiten“
- `Einstellungen.tsx` – Einstellungsseite mit Rubriken, Konto-Dialogen und Kontolöschung
- `ui.tsx` – `Avatar`, `FactionEmblem`, `Segmented`, `SettingRow`, `Sheet`, `Slider`, `Switch`, `TextInput`
- `format.ts` – `FACTION_HEX`, `RESULT_STAMP`, `formatDate`, `percent`
- `index.ts` – Exporte

Die Typen liegen in `product-plan/sections/spielerprofil-and-einstellungen/types.ts` (Komponenten importieren `../types`).

## Props-Referenz

**Daten-Props:**

- `ProfilProps`: `profile: Profile` (Anzeigename, `avatarUrl`, `memberSince`, `favoriteFactionId`), `stats: PlayerStats`, `factionStats: FactionStat[]` (`gamesPlayed: 0` = nie gespielt), `history: HistoryEntry[]` (neueste zuerst, KI-Gegner mit „(KI)“ im Namen), `hasMoreHistory: boolean`, `factions: Faction[]`.
- `EinstellungenProps`: `settings: Settings` (`notifications`, `display`, `sound`, `controls`), `account: Account` (`email`, `activeSessions`), `displayName: string` (für die Löschbestätigung), `pushPermission: 'default' | 'granted' | 'denied'`.

**Callback-Props:**

| Callback | Ausgelöst wenn |
|---|---|
| `onLoadMoreHistory()` | „Mehr anzeigen“ unter dem Partieverlauf geklickt wird (nur sichtbar bei `hasMoreHistory` und nicht leerer gefilterter Liste) |
| `onUpdateDisplayName(name)` | im Dialog „Profil bearbeiten“ „Speichern“ mit gültigem, geändertem (getrimmtem) Namen geklickt wird |
| `onUploadAvatar(file)` | über „Bild hochladen“ eine Bilddatei gewählt wird (sofort, unabhängig von „Speichern“) |
| `onRemoveAvatar()` | „Bild entfernen“ geklickt wird |
| `onChangeSettings(settings)` | irgendeine Einstellung geändert wird; übergibt das komplette neue `Settings`-Objekt |
| `onEnablePush()` | im Push-Hinweis „Erlauben“ geklickt wird |
| `onChangeEmail(email, currentPassword)` | im Dialog „E-Mail ändern“ „Speichern“ geklickt wird |
| `onChangePassword(currentPassword, newPassword)` | im Dialog „Passwort ändern“ „Speichern“ geklickt wird |
| `onLogout()` | „Abmelden“ geklickt wird |
| `onLogoutEverywhere()` | „Auf allen Geräten abmelden“ geklickt wird |
| `onDeleteAccount()` | im Dialog „Endgültig löschen“ nach korrekter Namenseingabe „Konto löschen“ geklickt wird |

## Erwartete Abläufe

### Ablauf 1: Partieverlauf durchsuchen

1. Spieler öffnet im Benutzermenü „Profil“.
2. In „Partieverlauf“ wählt er unter „Nach Ergebnis filtern“ „Siege“ und unter „Nach Fraktion filtern“ eine Fraktion.
3. Findet der Filter nichts, erscheint „Keine Partien gefunden“ mit „Filter zurücksetzen“.
4. Er klickt „Mehr anzeigen“.

**Ergebnis:** Die Liste zeigt nur passende Partien; `onLoadMoreHistory` wird aufgerufen, das Backend liefert ältere Einträge, die an `history` angehängt werden. `hasMoreHistory` wird `false`, wenn nichts mehr nachzuladen ist.

### Ablauf 2: Profil bearbeiten

1. Spieler klickt „Profil bearbeiten“.
2. Er ändert „Anzeigename“ (3 bis 24 Zeichen, sonst ist „Speichern“ deaktiviert) und/oder klickt „Bild hochladen“ bzw. „Bild entfernen“.
3. Er klickt „Speichern“.

**Ergebnis:** `onUpdateDisplayName(name)` (nur bei geändertem Namen), `onUploadAvatar(file)` bzw. `onRemoveAvatar()` werden aufgerufen; der Dialog schließt sich. Der neue Name/Avatar erscheint im Profil und in der Shell, sobald das Backend die aktualisierten Props liefert.

### Ablauf 3: Einstellung ändern

1. Spieler öffnet im Benutzermenü „Einstellungen“ (Smartphone: Rubrik aus der Liste wählen).
2. Er schaltet z. B. in „Ton“ „Stumm“ ein oder wählt in „Darstellung“ das Farbschema „Dunkel“.

**Ergebnis:** `onChangeSettings` wird mit dem vollständigen neuen `Settings`-Objekt aufgerufen, „Gespeichert“ erscheint kurz. Bei „Stumm“ werden die Regler „Gesamtlautstärke“, „Effekte“, „Musik“ und „Umgebung“ deaktiviert. Die App wendet die Einstellung sofort an (Theme, Audio).

### Ablauf 4: Konto löschen

1. Rubrik „Konto“ → „Gefahrenzone“ → „Konto löschen“.
2. Dialog „Konto löschen?“ erklärt die Folgen → „Weiter“.
3. Dialog „Endgültig löschen“: Anzeigenamen exakt eingeben → „Konto löschen“ wird aktiv → klicken.

**Ergebnis:** `onDeleteAccount()` wird aufgerufen. Das Backend löscht das Konto, übergibt laufende Partien an eine KI auf Stufe „Normal“, löscht Statistiken und Verlauf und meldet den Spieler ab.

## Leere Zustände

- **Partieverlauf ohne Partien (neuer Spieler):** Bei leerem `history` erscheint „Noch keine Partie beendet“ / „Sobald du deine erste Partie abgeschlossen hast, erscheint sie hier mit Ergebnis und Platzierung.“
- **Partieverlauf ohne Treffer:** Gibt es Partien, aber der Filter findet keine, erscheint „Keine Partien gefunden“ / „Für diesen Filter gibt es in deinem Verlauf keine Partie.“ mit „Filter zurücksetzen“.
- In beiden Fällen ist „Mehr anzeigen“ ausgeblendet, auch wenn `hasMoreHistory` `true` ist.
- **Nie gespielte Fraktion:** Balken mit „Noch nicht gespielt“ und Wert „–“.
- **Neuer Spieler:** Alle Kennzahlen 0, „Siegquote“ „0 %“; ohne `favoriteFactionId` keine Lieblingsfraktion und neutraler Kopf.
- **Ohne Avatar:** Initialen; im Dialog „Ohne Bild werden deine Initialen gezeigt.“

## Tests

Die Verhaltenstests stehen in `product-plan/sections/spielerprofil-and-einstellungen/tests.md` (Abläufe, Validierungen, Leerzustände, Barrierefreiheit, Beispiel-Testdaten).

## Hinweise zur Umsetzung

- **Bilanz serverseitig ableiten:** `PlayerStats`, `FactionStat` und `favoriteFactionId` (meistgespielte Fraktion) ergeben sich aus den beendeten Partien (**Match**/**Participant** in `product/data-shape/data-shape.md`). `history` ist paginiert (neueste zuerst); `hasMoreHistory` steuert „Mehr anzeigen“.
- **Filter sind clientseitig:** Ergebnis- und Fraktionsfilter wirken nur auf bereits geladene `history`-Einträge. Wenn ältere Partien auch beim Filtern gefunden werden sollen, Filter serverseitig nachziehen oder vor dem Filtern alles laden.
- **Siegquote:** `percent()` rundet und liefert bei 0 Partien 0. Die Gesamtbalken je Fraktion sind relativ zur meistgespielten Fraktion skaliert.
- **Anzeigename:** Validierung 3–24 Zeichen nach `trim()` nur im Client. Das Backend muss dieselbe Regel (und ggf. Eindeutigkeit/Moderation) prüfen und Fehler zurückmelden; der Dialog schließt sich direkt nach „Speichern“ und zeigt selbst keine Serverfehler.
- **Avatar:** `onUploadAvatar` erhält das rohe `File` (`accept="image/*"`). Größe, Format, Zuschnitt und Speicherung macht das Backend; danach `profile.avatarUrl` aktualisieren. Die Vorschau im Dialog zeigt erst den neuen Avatar, wenn die Props aktualisiert sind.
- **Einstellungen: lokaler Zustand.** `Einstellungen` übernimmt `settings` nur beim ersten Rendern in eigenen Zustand und meldet jede Änderung optimistisch per `onChangeSettings` (vollständiges Objekt). „Gespeichert“ erscheint unabhängig vom Serverergebnis. Speicherfehler muss die App selbst anzeigen (z. B. Toast) und die Komponente ggf. per `key` mit dem Serverstand neu mounten. Häufige Regler-Änderungen ggf. debouncen.
- **Einstellungen anwenden:** Die Komponente speichert nur. Die App muss `display.theme` (Hell/Dunkel/System) global anwenden, `reduceMotion`, `combatAnimations` und `autoplayReplay` im Spielfeld berücksichtigen und `controls` (rechte Maustaste, Nachfrage beim Zugende, Ziehen, Zoom-Empfindlichkeit) im Spielfeld-Bereich auswerten.
- **Ton:** Die Regler entsprechen den Mischpulten aus `product/audio-brief.md`: Gesamt, Effekte, Musik und **Umgebung** (die Geländeambiente-Schleifen `amb-*`, die nach Geländeanteil im Kartenausschnitt gemischt werden). `muted` schaltet alles stumm, die Reglerwerte bleiben erhalten.
- **Push:** `pushPermission` aus `Notification.permission` lesen. `onEnablePush` soll `Notification.requestPermission()` aufrufen, das Push-Abo beim Server registrieren und die neue Berechtigung als Prop zurückgeben. Bei `'denied'` gibt es keinen Button, nur den Hinweis auf das Schloss-Symbol.
- **E-Mail-Benachrichtigungen:** Der Server versendet E-Mails nur, wenn der Spieler seit `emailDelayHours` Stunden offline ist (0 = sofort); online gibt es nur Push. „Frist läuft bald ab“ ist laut Beschreibung an „weniger als 3 Stunden“ gekoppelt – das muss zur Zugfrist-Logik der Partien passen.
- **Dialoge:** `Sheet` setzt beim Öffnen den Fokus in den Dialog (erstes Formularfeld, sonst der erste Button nach „Schließen“), hält Tab und Umschalt+Tab darin und gibt den Fokus beim Schließen an das auslösende Element zurück; Escape und Klick auf den Hintergrund schließen.
- **E-Mail/Passwort:** Client prüft nur Format (`x@y.z`), nicht-leeres aktuelles Passwort und neues Passwort ≥ 8 Zeichen mit Wiederholung. Das Backend prüft das aktuelle Passwort, schickt einen Bestätigungslink an die neue Adresse („Wir schicken dir einen Bestätigungslink an die neue Adresse.“) und meldet Fehler. Die Dialoge schließen sich sofort nach „Speichern“.
- **Abmelden:** `onLogout` beendet die aktuelle Sitzung und leitet zur Anmeldung; `onLogoutEverywhere` widerruft alle Sitzungen (`account.activeSessions`). Es gibt keine Rückfrage.
- **Konto löschen:** Bestätigung erfordert exakte Übereinstimmung mit `displayName` (ohne Trim, groß-/kleinschreibungsgenau). Das Backend muss laufende Partien an eine KI auf Stufe „Normal“ übergeben (Bezug: Partie-Setup & KI-Gegner), damit diese gemäß der Anforderung **dauerhafter Spielstände** aus `product-overview.md` ohne Unterbrechung weiterlaufen.
- **Fraktionsdaten und Wappen:** `factions` stammt aus dem Bereich Fraktionen & Einheiten; Wappenbilder gemäß `product/art-brief.md`. Fehlt ein Bild oder lädt es nicht, zeigt `FactionEmblem` ein SVG-Schild in Fraktionsfarbe.
- **Shell:** Anzeigename und Avatar werden auch im Benutzermenü der Shell angezeigt – nach Änderungen dort ebenfalls aktualisieren.
- **Schriften:** Big Shoulders Display, Barlow und IBM Plex Mono müssen geladen sein (siehe Design-Tokens).

## Referenzdateien

In `product-plan/sections/spielerprofil-and-einstellungen/`:

- `README.md` – Überblick, Gestaltung, Datenformen, Callbacks
- `tests.md` – Test-Spezifikation
- `types.ts` – Daten- und Props-Typen
- `sample-data.json` – Beispieldaten
- `screenshot-profil.png` – Visuelle Referenz Profil
- `screenshot-einstellungen.png` – Visuelle Referenz Einstellungen
- `components/Profil.tsx`, `components/Einstellungen.tsx`, `components/ui.tsx`, `components/format.ts`, `components/index.ts`

## Fertig, wenn

- [ ] Profil und Einstellungen zeigen echte Daten aus dem Backend statt der Beispieldaten
- [ ] „Profil“ und „Einstellungen“ im Benutzermenü der Shell führen zu den Seiten
- [ ] Leere Zustände funktionieren (neuer Spieler, Filter ohne Treffer, nie gespielte Fraktion, ohne Avatar)
- [ ] Alle Callback-Props sind angebunden
- [ ] „Mehr anzeigen“ lädt ältere Partien nach und verschwindet, wenn nichts mehr kommt
- [ ] Anzeigename- und Avataränderungen werden gespeichert und überall (inkl. Shell) angezeigt; Serverfehler werden gemeldet
- [ ] Jede Einstellungsänderung wird dauerhaft gespeichert und sofort angewendet (Farbschema, Animationen, Ton inkl. Stumm und Umgebung, Steuerung)
- [ ] Push-Berechtigung wird korrekt erkannt, angefragt und registriert; E-Mail-Benachrichtigungen respektieren die Verzögerung
- [ ] E-Mail-Änderung mit Bestätigungslink und Passwortänderung prüfen das aktuelle Passwort serverseitig
- [ ] Abmelden und „Auf allen Geräten abmelden“ beenden die Sitzungen
- [ ] Kontolöschung übergibt laufende Partien an eine KI und entfernt Statistiken und Verlauf
- [ ] Abläufe funktionieren Ende-zu-Ende
- [ ] Darstellung entspricht `screenshot-profil.png` und `screenshot-einstellungen.png`
- [ ] Responsiv auf Desktop, Tablet und Smartphone (Rubrikenliste mit „Alle Rubriken“, Bottom-Sheets), heller und dunkler Modus
