# Meilenstein 2: Spielfeld & Züge

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
