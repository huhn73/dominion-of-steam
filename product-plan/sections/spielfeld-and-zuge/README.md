# Spielfeld & Züge

## Überblick

Das Spielfeld ist der Kern von Dominion of Steam: eine Hex-Karte mit Kriegsnebel, auf der der Spieler in seinem Zug Einheiten bewegt, angreift, Städte erobert und deren Produktion festlegt. Es läuft im Vollbild mit der Kopfleiste des Spiel-Modus und wird mit Maus wie Touch gleichermaßen bedient. Zu Beginn eines Zugs sieht der Spieler, was die Gegner in seinem Sichtbereich getan haben.

Die Komponente `Spielfeld` füllt ihren Container vollständig (`size-full`). In der Vorschau steckt sie im Spiel-Modus der Shell (`AppShell mode="game"`), die Kopfleiste mit Partiename, Runde, Zugstatus und Frist kommt also aus der Shell, nicht aus dieser Sektion.

## Abläufe

- **Zugbeginn:** In der Phase `replay` läuft eine automatische Wiederholung der sichtbaren Gegneraktionen als Overlay („Gegnerzug · <Name>“, Fortschritt `1/4`, Button „Überspringen“). Danach zeigt das Ereignis-Log einen Zähler „N neu“.
- **Einheit bewegen (Tippen):** Eigene Einheit antippen, erreichbare Felder werden amber hervorgehoben, Tipp auf ein Zielfeld zeigt den Pfad, zweiter Tipp auf dasselbe Feld bestätigt.
- **Einheit bewegen (Ziehen):** Einheit mit Maus oder Finger auf ein Feld ziehen, der Pfad mit Rundenmarkierungen folgt live, Loslassen führt die Bewegung aus.
- **Mehrrunden-Befehl:** Ziele außerhalb der Reichweite dieser Runde werden als teal gestrichelter Pfad mit Rundenzahlen angezeigt und nach Bestätigung zum Marschbefehl.
- **Wache und Patrouille:** Über die Einheiten-Info („Wache“, „Patrouille“, „Aufheben“) werden stehende Befehle gesetzt oder aufgehoben. Für eine Patrouille tippt der Spieler Wegpunkte auf der Karte an und bestätigt.
- **Angriff:** Feindliche Einheiten und Städte in Reichweite erscheinen rot mit Siegchance. Ein Tipp öffnet den Angriffsdialog, nach „Angreifen“ läuft eine Explosionsanimation, das Ergebnis meldet ein Toast („Sieg“ / „Niederlage“).
- **Stadt erobern:** Tippt oder zieht der Spieler eine Einheit, die Städte erobern kann (Landeinheiten), auf eine neutrale oder feindliche Stadt in Reichweite, öffnet sich der Angriffsdialog mit Siegchance. Bei einem Sieg wechselt die Stadt den Besitzer, die Einheit zieht hinein und das Stadt-Panel der eroberten Stadt öffnet sich automatisch.
- **Produktion festlegen:** Tipp auf eine eigene Stadt öffnet das Stadt-Panel mit aktueller Produktion, Fortschritt, Restrunden und der Liste baubarer Einheitentypen (inklusive Sondereinheit der eigenen Fraktion, Seeeinheiten nur in Küstenstädten). Die Bauzeiten berücksichtigen den Fraktionsbonus des Besitzers. Ein erneuter Tipp auf die laufende Produktion ändert nichts.
- **Transport:** Landeinheiten ziehen auf einen eigenen Frachter auf See, Flugzeuge landen auf einem Träger. Die Einheiten-Info des Transporters listet die Ladung mit „Ausladen“ (Frachter) bzw. „Starten“ (Träger).
- **Nächste Einheit:** Der Button springt reihum zu jeder eigenen Einheit, die noch Befehle braucht, und zeigt deren Anzahl. „Überspringen“ in der Einheiten-Info nimmt eine Einheit für diese Runde aus der Liste.
- **Ereignis-Log:** Ausklappbare Liste der Ereignisse seit dem letzten Zug. Ein Tipp auf einen Eintrag zentriert die Karte darauf.
- **Minikarte:** Zeigt die ganze Welt mit Kriegsnebel, Städten auf erforschten Feldern und Kamera-Ausschnitt, ein Tipp springt dorthin.
- **Abbrechen:** Esc und Rechtsklick nehmen stufenweise den innersten Schritt zurück. Wiederholte Tipps auf ein Feld mit eigener Einheit und Stadt wechseln zwischen Einheit, Stadt und keiner Auswahl.
- **Zug beenden:** „Zug beenden“ beendet den Zug. Haben noch Einheiten keine Befehle, fragt der Dialog „Zug beenden?“ nach. Danach steht die Partie in der Phase `waiting`.

## Gestaltungsentscheidungen

- **Vollbild-Karte mit schwebenden Bedienelementen:** Ereignis-Log oben links, Minikarte („Lagekarte“) unten rechts, Aktionsleiste unten mittig, Einheiten-Info unten links (Desktop, `md:w-96`), Stadt-Panel als rechte Seitenleiste (Desktop). Auf Mobilgeräten werden beide Panels zu Bottom-Sheets mit Griff-Leiste, die Aktionsleiste wird dann ausgeblendet, und die Minikarte ist über einen Kartenbutton oben rechts einklappbar.
- **Karte:** Pointy-top-Hexfelder (odd-r Offset), gezeichnet als SVG. Hell: Pergament-Seekarte, dunkel: Ruß und Messing. Unerforschte Felder sind dunkel schraffiert, erforschte abgedunkelt, sichtbare voll. Städte auf unerforschten Feldern werden weder auf der Karte noch auf der Minikarte gezeigt, Städte auf erforschten, aber nicht sichtbaren Feldern abgeschwächt. Vignette und feines Rauschen liegen als Atmosphäre darüber.
- **Farben:** Amber (primär) für Auswahl, erreichbare Felder, Pfade dieser Runde, Produktion und den Hauptbutton „Zug beenden“. Teal (sekundär) für Mehrrunden-Pfade, Patrouille, Ausladeziele, stehende Befehle und Sieg. Rose für Angriffsziele, Angriffsdialog, Niederlage und Gegnerzug. Stone für Panels und neutrale Flächen. Teilnehmerfarben (`amber`, `rose`, `sky`, `lime`, `violet`, `orange`) färben Spielsteine und Städte (Hex-Werte in `PARTICIPANT_HEX`).
- **Schriften:** Big Shoulders Display (Überschriften, Stadtnamen, Buttons in Versalien mit weiter Laufweite), Barlow (UI-Text), IBM Plex Mono (Zahlen: Werte, Zähler, Siegchance, Rundenmarker).
- **Spielsteine:** Runde Token in Teilnehmerfarbe mit Typ-Symbol (`UnitIcon`), Lebensleiste (grün/amber/rot nach Zustand), pulsierender Amber-Ring bei „braucht Befehle“, kleines Abzeichen oben links für Wache (Auge), Patrouille (Pfeile) oder Marsch (Fahne) und oben rechts für die Ladungsanzahl. Die Auswahl ist ein rotierender gestrichelter Ring. Einheiten in Städten werden kleiner und versetzt dargestellt.
- **Städte:** Silhouette in Besitzerfarbe, Namensschild in Versalien, Krone für Hauptstädte, Fortschrittsring für laufende Produktion.
- **Panels:** Doppelte Trennlinie unter dem Kopf (`border-double`), Werte als kleine Kacheln, Badges „Sondereinheit“ (amber) bzw. „Sonder“ (teal). Produktionsfortschritt als segmentierter Balken (ein Segment pro Runde). Verkürzt der Fraktionsbonus eine Bauzeit, steht der Grundwert durchgestrichen davor und der Bonuswert in Amber.
- **Animationen:** Gegnerzug als „Geist“-Token mit Spur, Pfade als laufende Strichlinie, Kampf als Explosion mit Mündungsblitz, Kamerafahrten mit 450 ms Übergang.
- **Touch-Ziele:** Alle Buttons mindestens 44 px (`min-h-11`, `size-11`), Kartenbedienung über Pointer-Events (Tippen, Ziehen, Pinch, Mausrad).

## Datenformen

Alle Typen stehen in `types.ts`.

| Interface | Inhalt | Globale Entität (`product/data-shape/data-shape.md`) |
|---|---|---|
| `Match` | Partie mit Runde, Modus, Phase aus Spielersicht (`replay`, `yourTurn`, `waiting`), Frist und `youId` | Match |
| `Participant` | Platz in der Partie mit Fraktion, Farbe, KI-Stufe, Status | Participant |
| `Faction`, `FactionBonus` | Fraktion mit Eigenheit, Bonus (`bonus`: betroffener Wert, Einsatzgebiet, `modifier`, `mode`) und Sondereinheit | Faction |
| `UnitType` | Werte, Einsatzgebiet, Reichweite, Ladekapazität und -art, Bauzeit, Fraktion | UnitType |
| `GameMap`, `Tile` | Kartengröße, Seed und Felder mit Gelände und Sichtbarkeit aus Spielersicht | Map, Tile |
| `City`, `Production` | Stadt mit Besitzer, Hauptstadt-Flag und Produktion | City |
| `Unit`, `UnitOrder` | Einheit mit Position, Zustand, Bewegung, Treibstoff, Befehl, Ladung, `needsOrders` | Unit |
| `GameEvent` | Ereignis mit Position, Runde, Typ, Text und `isNew` | GameEvent |
| `ReplayAction` | Sichtbare Gegneraktion (Bewegung, Angriff, Eroberung) mit Pfad | abgeleitet aus Turn |
| `CombatPreview` | Siegchance eines Angreifers gegen eine Einheit oder Stadt | berechnet (keine eigene Entität) |
| `CombatResult` | Ergebnis des letzten Kampfs für Toast und Stadt-Panel | abgeleitet aus Turn bzw. GameEvent |
| `HexCoord` | Offset-Koordinate `col`/`row` | Position von Tile, City, Unit, GameEvent |

## Visuelle Referenz

- `screenshot.png`: Desktop-Ansicht in Runde 14 („Die Kohleinseln“), Grenadiere ausgewählt mit hervorgehobenen erreichbaren Feldern, Einheiten-Info unten links, Ereignis-Log mit „6 neu“, Aktionsleiste mit „Nächste Einheit 5“ und „Zug beenden“, Lagekarte unten rechts.

## Enthaltene Komponenten

Exportiert über `components/index.ts`:

- `Spielfeld`: Hauptkomponente der Sektion. Hält den lokalen Interaktionszustand (Auswahl, Pfadvorschau, Modi, Kamera, Dialoge) und verbindet alle Teilkomponenten mit den Callback-Props.
- `HexMap` (mit Typen `Camera`, `Ghost`, `PathMarker`): SVG-Karte mit Gelände, Kriegsnebel, Städten, Einheiten, Hervorhebungen, Pfaden, Gegnerzug-Geist und Kampfanimation; verarbeitet Tippen, Ziehen, Pinch, Mausrad und Rechtsklick.
- `UnitPanel`: Einheiten-Info (Panel bzw. Bottom-Sheet) mit Werten, Treibstoff, Befehlsstatus, Ladung und Befehlsbuttons.
- `CityPanel`: Stadt-Panel (Seitenleiste bzw. Bottom-Sheet) mit Produktion, Fortschritt und baubaren Einheitentypen; optionale Prop `faction` (Fraktion des Besitzers) für Bauzeiten mit Fraktionsbonus.
- `bonus.ts`: `withBonus(type, faction, stat)` liefert einen Einheitenwert nach Fraktionsbonus bzw. den Grundwert, wenn der Bonus nicht greift (Bauzeit mindestens 1).
- `EventLog`: Ausklappbares Ereignis-Log mit Zähler für neue Einträge.
- `MiniMap`: Übersichtskarte mit Kriegsnebel, Städten und Kamera-Rahmen.
- `hex.ts` (alle Exporte): Hex-Geometrie und Bewegungsregeln (`hexToPixel`, `pixelToHex`, `neighbors`, `hexDistance`, `buildIndex`, `reachableTiles`, `findPath`, `pathTurns`, `attackTargets`, `transportAt`, `PARTICIPANT_HEX` u. a.).
- `UnitIcon`: Symbol je Einheitentyp mit Rückfall auf ein Symbol des Einsatzgebiets.

## Callback-Props

| Callback | Ausgelöst wenn |
|---|---|
| `onSelectUnit(unitId)` | der Spieler eine eigene Einheit auswählt (Tippen, „Nächste Einheit“, Beginn eines Ziehens, „Starten“ eines Flugzeugs auf dem Träger); nicht bei feindlichen Einheiten |
| `onMoveUnit(unitId, target)` | eine Bewegung innerhalb der Reichweite dieser Runde bestätigt wird (zweiter Tipp oder Loslassen nach Ziehen); auch zum Beladen eines Transporters |
| `onSetGoto(unitId, target)` | ein Ziel außerhalb der Reichweite dieser Runde bestätigt wird (Mehrrunden-Marsch) |
| `onSetSentry(unitId)` | der Spieler „Wache“ drückt |
| `onSetPatrol(unitId, waypoints)` | der Spieler die Patrouille mit „Bestätigen“ abschließt; `waypoints` beginnt mit der aktuellen Position der Einheit |
| `onCancelOrder(unitId)` | der Spieler „Aufheben“ drückt |
| `onSkipUnit(unitId)` | der Spieler „Überspringen“ in der Einheiten-Info drückt |
| `onAttack(unitId, { unitId?, cityId? })` | der Spieler im Angriffsdialog „Angreifen“ drückt |
| `onUnloadUnit(unitId, target)` | im Ausladen-Modus ein markiertes Landfeld angetippt wird; `unitId` ist die geladene Einheit |
| `onSelectCity(cityId)` | das Panel einer eigenen Stadt geöffnet wird (auch automatisch nach einer Eroberung) |
| `onSetProduction(cityId, unitTypeId)` | der Spieler im Stadt-Panel einen Einheitentyp antippt, der nicht bereits in Produktion ist |
| `onSelectEvent(eventId)` | der Spieler einen Eintrag im Ereignis-Log antippt |
| `onSkipReplay()` | der Spieler „Überspringen“ in der Gegnerzug-Wiederholung drückt oder die Wiederholung von selbst endet |
| `onEndTurn()` | der Zug beendet wird („Zug beenden“ ohne offene Einheiten oder „Trotzdem beenden“ im Bestätigungsdialog) |
