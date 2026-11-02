# Test-Spezifikation: Spielfeld & Züge

Diese Spezifikation beschreibt das Verhalten der Oberfläche aus Nutzersicht. Sie ist unabhängig vom Test-Framework (React Testing Library, Playwright, Cypress o. Ä.). Die Beispiele beziehen sich auf `sample-data.json` (Partie „Die Kohleinseln“, Runde 14, Spieler „Björn“ mit `youId: "p1"`).

## Überblick

Getestet wird die Komponente `Spielfeld` mit ihren Teilkomponenten `HexMap`, `UnitPanel`, `CityPanel`, `EventLog` und `MiniMap`. Schwerpunkte:

- Auswahl, Bewegung (Tippen und Ziehen) und Mehrrunden-Marsch
- Stehende Befehle (Wache, Patrouille, Aufheben, Überspringen)
- Angriff mit Siegchance, Kampfergebnis-Toast und Stadteroberung
- Produktion im Stadt-Panel (inklusive Bauzeiten mit Fraktionsbonus)
- Transport (Ausladen, Starten)
- Gegnerzug-Wiederholung, Ereignis-Log, Minikarte, „Nächste Einheit“, „Zug beenden“
- Stufenweises Abbrechen mit Esc und Rechtsklick
- Verhalten in den Phasen `replay`, `yourTurn` und `waiting`

Hinweis: Die Karte ist ein SVG mit `role="application"` und `aria-label="Spielkarte"`. Klicks auf Felder lassen sich über Pointer-Events auf Bildschirmkoordinaten auslösen (Umrechnung mit `hexToPixel` und der Kamera) oder über einen Test-Helfer, der `onTap(hex)` der `HexMap` direkt aufruft.

---

## Tests der Abläufe

### Ablauf 1: Einheit per Tippen bewegen

**Szenario:** Der Spieler wählt die Grenadiere `u1` (Feld 4,3, `movesLeft: 1`) und bewegt sie auf ein Nachbarfeld.

#### Erfolgsfall

**Setup:** Beispieldaten, `match.phase = "yourTurn"`.

**Schritte:**
1. Auf das Feld 4,3 tippen.
2. Auf ein hervorgehobenes Nachbarfeld (z. B. 5,3) tippen.
3. Erneut auf dasselbe Feld tippen.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 1 wird `onSelectUnit("u1")` aufgerufen.
- [ ] Die Einheiten-Info `section[aria-label="Einheit Grenadiere"]` erscheint mit Überschrift „Grenadiere“ und Unterzeile „Björn · Eisenbund von Valdrin“.
- [ ] Die Kacheln zeigen „Stärke 2“, „Abwehr 2“, „Bewegung 1/1“, „Zustand 100%“, der Befehlsstatus lautet „Kein Befehl“.
- [ ] Erreichbare Nachbarfelder sind amber hervorgehoben.
- [ ] Nach Schritt 2 ist ein amber gestrichelter Pfad mit Rundenmarker „1“ sichtbar, es wird noch kein Bewegungs-Callback aufgerufen.
- [ ] Nach Schritt 3 wird `onMoveUnit("u1", { col: 5, row: 3 })` genau einmal aufgerufen und die Pfadvorschau verschwindet.
- [ ] Der Hinweis „Ziel antippen oder Einheit ziehen. Ziele außerhalb der Reichweite werden zum Mehrrunden-Marsch.“ ist sichtbar (auf Desktop zusätzlich „Rechtsklick oder Esc bricht ab.“).

#### Fehlerfall: Ziel nicht betretbar

**Schritte:** `u1` auswählen, auf ein unerforschtes Feld oder ein Feld mit feindlicher Einheit tippen, die nicht angreifbar ist.

**Erwartete Ergebnisse:**
- [ ] Es erscheint keine Pfadvorschau (kein Pfad gefunden).
- [ ] `onMoveUnit` und `onSetGoto` werden nicht aufgerufen.
- [ ] Ist das Feld leer, wird die Auswahl aufgehoben und die Einheiten-Info schließt sich.

### Ablauf 2: Einheit per Ziehen bewegen

**Szenario:** Der Spieler zieht den Dampfkoloss `u9` (Feld 4,5) auf ein Nachbarfeld.

#### Erfolgsfall

**Schritte:**
1. Pointer auf Feld 4,5 drücken, mehr als 6 px bewegen und über einem erreichbaren Nachbarfeld halten.
2. Pointer loslassen.

**Erwartete Ergebnisse:**
- [ ] Beim Ziehen wird `onSelectUnit("u9")` aufgerufen, die Einheiten-Info zeigt „Dampfkoloss“ mit Badge „Sondereinheit“ und „Zustand 60%“.
- [ ] Während des Ziehens folgt die Pfadvorschau dem Pointer.
- [ ] Nach dem Loslassen wird `onMoveUnit("u9", <Zielfeld>)` aufgerufen.

#### Fehlerfall: Ziehen auf leerem Gelände

**Schritte:** Auf einem Feld ohne eigene Einheit drücken und ziehen.

**Erwartete Ergebnisse:**
- [ ] Die Karte verschiebt sich (Kamera), es wird kein Callback aufgerufen.

#### Fehlerfall: Ziehen außerhalb des eigenen Zugs

**Setup:** `match.phase = "waiting"`.

**Erwartete Ergebnisse:**
- [ ] Ziehen auf einer eigenen Einheit verschiebt nur die Karte, `onMoveUnit` wird nicht aufgerufen.

### Ablauf 3: Mehrrunden-Marsch

**Szenario:** `u1` soll ein Feld erreichen, das mehr als ein Feld entfernt ist.

**Schritte:**
1. `u1` auswählen.
2. Auf ein erreichbares, aber nicht hervorgehobenes Landfeld drei Felder entfernt tippen.
3. Erneut auf dasselbe Feld tippen.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 2 erscheint ein teal gestrichelter Pfad mit Rundenmarkern („1“, „2“, „3“ am jeweils letzten Feld einer Runde).
- [ ] Nach Schritt 3 wird `onSetGoto("u1", <Zielfeld>)` aufgerufen, nicht `onMoveUnit`.
- [ ] Bei einer Einheit mit Befehl `goto` (z. B. `u2`) zeigt die Einheiten-Info „Marschiert · noch 3 Runden bis zum Ziel“ und auf dem Spielstein ein Fahnen-Abzeichen.

### Ablauf 4: Wache, Patrouille, Aufheben, Überspringen

#### Erfolgsfall: Wache

**Schritte:** `u1` auswählen, „Wache“ drücken.

**Erwartete Ergebnisse:**
- [ ] `onSetSentry("u1")` wird aufgerufen.
- [ ] Bei `order.type = "sentry"` (z. B. `u3`) ist „Wache“ aktiv (teal) und der Status lautet „Auf Wache“.

#### Erfolgsfall: Patrouille

**Schritte:**
1. `u1` auswählen, „Patrouille“ drücken.
2. Auf der Karte zwei Felder antippen (z. B. 5,2 und 6,3).
3. „Bestätigen“ drücken.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 1 ersetzt ein teal Kasten die Befehlsbuttons: „Tippe auf der Karte die Wegpunkte der Patrouille an (0 gesetzt).“ mit „Abbrechen“ und „Bestätigen“.
- [ ] Erreichbare Felder werden im Patrouille-Modus nicht hervorgehoben.
- [ ] Jeder Tipp erhöht den Zähler („(1 gesetzt)“, „(2 gesetzt)“), die Wegpunkte erscheinen nummeriert, beginnend bei der Einheit mit „1“.
- [ ] Nach Schritt 3 wird `onSetPatrol("u1", [{ col: 4, row: 3 }, { col: 5, row: 2 }, { col: 6, row: 3 }])` aufgerufen; der erste Wegpunkt ist die aktuelle Position.
- [ ] Danach sind wieder die normalen Befehlsbuttons sichtbar.
- [ ] Bei `u4` (Patrouille) lautet der Status „Patrouille · 2 Wegpunkte“, „Patrouille“ ist aktiv.

#### Validierungsfall: Patrouille ohne Wegpunkte

**Erwartete Ergebnisse:**
- [ ] Solange „(0 gesetzt)“ angezeigt wird, ist „Bestätigen“ deaktiviert.
- [ ] „Abbrechen“ verlässt den Modus ohne Callback.

#### Erfolgsfall: Aufheben

**Schritte:** `u2` (Befehl `goto`) auswählen, „Aufheben“ drücken.

**Erwartete Ergebnisse:**
- [ ] `onCancelOrder("u2")` wird aufgerufen.
- [ ] Bei einer Einheit mit `order.type = "none"` (z. B. `u1`) ist „Aufheben“ deaktiviert.

#### Erfolgsfall: Überspringen

**Schritte:** `u1` auswählen, „Überspringen“ drücken.

**Erwartete Ergebnisse:**
- [ ] `onSkipUnit("u1")` wird aufgerufen.
- [ ] Die Auswahl springt zur nächsten Einheit, die Befehle braucht (Reihenfolge der `units`: `u1`, `u5`, `u8`, `u9`, `u10`), die Karte zentriert sich darauf.
- [ ] Bei `needsOrders: false` (z. B. `u2`) ist „Überspringen“ deaktiviert.

### Ablauf 5: Angriff

**Szenario:** Der Doppeldecker `u8` (Feld 8,3) greift den Wolkenkreuzer `e3` (Feld 11,3) an.

#### Erfolgsfall

**Schritte:**
1. `u8` auswählen.
2. Auf das rot markierte Feld 11,3 tippen.
3. Im Dialog „Angreifen“ drücken.
4. Die Prop `lastCombat` mit dem Ergebnis setzen.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 1 ist Feld 11,3 rot gestrichelt markiert mit dem Schild „31 %“ (aus `combatPreviews`).
- [ ] Nach Schritt 2 erscheint der Dialog mit Kopf „Angriff“, Text „Doppeldecker → **Wolkenkreuzer**“, Balken, „31 %“ und Beschriftung „Siegchance“, Buttons „Abbrechen“ und „Angreifen“.
- [ ] Nach Schritt 3 wird `onAttack("u8", { unitId: "e3", cityId: undefined })` aufgerufen, der Dialog schließt sich und auf Feld 11,3 läuft die Explosionsanimation.
- [ ] Nach Schritt 4 erscheint ein Toast (`role="status"`) mit „Niederlage“, „Dein Doppeldecker wurde vom Wolkenkreuzer abgeschossen.“ und „Schaden: eigene −100 · Gegner −25“.
- [ ] Der Toast verschwindet nach etwa 4,5 Sekunden oder über den Button „Schließen“.
- [ ] Bei `outcome: "victory"` zeigt der Toast „Sieg“ mit teal Rand und Pokal-Symbol.

#### Fehlerfall: Angriff abbrechen

**Erwartete Ergebnisse:**
- [ ] „Abbrechen“ im Dialog, Esc oder Rechtsklick schließen den Dialog, `onAttack` wird nicht aufgerufen, die Einheit bleibt ausgewählt.

#### Grenzfall: Siegchance ohne Vorschau

**Erwartete Ergebnisse:**
- [ ] Gibt es keinen passenden Eintrag in `combatPreviews`, wird die Siegchance lokal aus Stärke, Abwehr und Zustand geschätzt und trotzdem angezeigt.

### Ablauf 6: Stadt erobern

**Szenario:** Der Panzerwagen `u2` (Feld 7,4) greift die neutrale Stadt Ventil (`c4`, Feld 8,4) an.

**Schritte:**
1. `u2` auswählen, auf Ventil tippen.
2. „Angreifen“ drücken.
3. `lastCombat = { attackerUnitId: "u2", defenderUnitId: null, targetCityId: "c4", outcome: "victory", ... }` setzen und `cities` mit `c4.ownerId = "p1"` aktualisieren.

**Erwartete Ergebnisse:**
- [ ] Der Dialog zeigt „Panzerwagen → **Ventil**“ und „86 %“.
- [ ] `onAttack("u2", { unitId: undefined, cityId: "c4" })` wird aufgerufen.
- [ ] Nach Schritt 3 erscheint der Toast „Sieg“, das Stadt-Panel von Ventil öffnet sich automatisch und `onSelectCity("c4")` wird aufgerufen.
- [ ] Liefert das Backend `u2` auf Feld 8,4, steht die Einheit danach in der eroberten Stadt.
- [ ] Eine eigene Einheit kann eine nicht eigene Stadt nicht per Bewegung betreten (keine Pfadvorschau dorthin), nur per Angriff.

#### Erfolgsfall: Einheit auf die Stadt ziehen

**Schritte:** `u2` auf Ventil ziehen und loslassen.

**Erwartete Ergebnisse:**
- [ ] Statt einer Bewegung öffnet sich derselbe Angriffsdialog „Panzerwagen → **Ventil**“ mit „86 %“; `onMoveUnit` wird nicht aufgerufen.
- [ ] „Angreifen“ ruft `onAttack("u2", { unitId: undefined, cityId: "c4" })` auf.

### Ablauf 7: Produktion festlegen

**Szenario:** Der Spieler legt in Rußbrück (`c3`, Feld 6,6, ohne Produktion) eine Produktion fest.

#### Erfolgsfall

**Schritte:**
1. Auf Rußbrück tippen.
2. In der Liste „Grenadiere“ antippen.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 1 wird `onSelectCity("c3")` aufgerufen, das Panel `section[aria-label="Stadt Rußbrück"]` zeigt „Stadt · Björn“ und die Überschrift „Rußbrück“.
- [ ] Unter „In Produktion“ steht „Die Fabriken stehen still. Wähle unten, was gebaut werden soll.“
- [ ] Die Liste enthält alle allgemeinen Einheitentypen und „Dampfkoloss“ mit Badge „Sonder“, aber nicht „Blitzkorvette“ und „Wolkenkreuzer“ (fremde Sondereinheiten).
- [ ] Jede Zeile zeigt Werte im Format „Land · ST 2 · AB 2 · BW 1“, bei Lufteinheiten zusätzlich „· RW 12“, bei Transportern „· LD 6“, rechts die Bauzeit mit „Runden“.
- [ ] Die Bauzeiten berücksichtigen den Fraktionsbonus des Besitzers (Eisenbund: Landeinheiten eine Runde schneller): „Grenadiere“ zeigt die „4“ durchgestrichen und daneben „3“ in Amber, „Dampfkoloss“ „12“ durchgestrichen und „11“; See- und Lufteinheiten zeigen nur ihren Grundwert (z. B. „Kanonenboot“ „6“).
- [ ] Nach Schritt 2 wird `onSetProduction("c3", "grenadiere")` aufgerufen.

#### Erfolgsfall: laufende Produktion

**Erwartete Ergebnisse:**
- [ ] Eisenhafen (`c1`) zeigt „Hauptstadt · Björn“ mit Krone, unter „In Produktion“ „Dampfkoloss“ und „noch 7 Runden“, einen Balken mit 12 Segmenten, davon 5 gefüllt (`aria-label="Fortschritt 5 von 12"`).
- [ ] Die Zeile „Dampfkoloss“ ist hervorgehoben und hat `aria-pressed="true"`.
- [ ] Bei `turnsRemaining: 1` steht „noch 1 Runde“.
- [ ] Ein Tipp auf die hervorgehobene Zeile „Dampfkoloss“ ruft `onSetProduction` nicht auf; Fortschritt und Restrunden bleiben unverändert.

#### Validierungsfall: Seeeinheiten nur an der Küste

**Erwartete Ergebnisse:**
- [ ] In einer Stadt ohne angrenzendes Wasserfeld fehlen alle Einheitentypen mit `domain: "sea"` in der Liste.

#### Fehlerfall: fremde oder neutrale Stadt

**Schritte:** Auf Ventil (`c4`) oder Port Aurel (`c7`) tippen.

**Erwartete Ergebnisse:**
- [ ] `onSelectCity` wird nicht aufgerufen.
- [ ] Das Panel zeigt „Stadt · Neutral“ bzw. „Hauptstadt · Admiral Kessler“ und den Text „Erobere die Stadt mit einer Landeinheit, um hier Einheiten zu produzieren.“, keine Produktionsliste.

### Ablauf 8: Transport

#### Erfolgsfall: Ausladen

**Szenario:** Der Transportfrachter `u5` (Feld 7,8) trägt `u6` und `u7`.

**Schritte:**
1. `u5` auswählen.
2. Bei der ersten Ladung „Ausladen“ drücken.
3. Auf ein teal pulsierendes Landfeld neben dem Frachter tippen.

**Erwartete Ergebnisse:**
- [ ] Die Einheiten-Info zeigt „Ladung“ mit „2/6“ und zwei Zeilen „Grenadiere 100 %“ und „Grenadiere 90 %“, jeweils mit „Ausladen“.
- [ ] Der Spielstein trägt ein Abzeichen mit „2“.
- [ ] Nach Schritt 2 erscheint „Tippe auf ein markiertes Landfeld zum Ausladen.“ mit „Abbrechen“, angrenzende betretbare Landfelder pulsieren teal.
- [ ] Nach Schritt 3 wird `onUnloadUnit("u6", <Landfeld>)` aufgerufen und der Modus endet.

#### Fehlerfall: falsches Feld beim Ausladen

**Erwartete Ergebnisse:**
- [ ] Ein Tipp auf ein nicht markiertes Feld beendet den Ausladen-Modus ohne Callback.

#### Erfolgsfall: Flugzeug starten

**Schritte:** Flugzeugträger `u10` auswählen, bei „Doppeldecker“ „Starten“ drücken.

**Erwartete Ergebnisse:**
- [ ] Die Ladung zeigt „1/4“.
- [ ] Nach dem Drücken ist `u11` ausgewählt (`onSelectUnit("u11")`), die Einheiten-Info zeigt „Doppeldecker“ mit Treibstoff „12/12“, und eine Bewegung löst `onMoveUnit("u11", …)` aus.

#### Erfolgsfall: Beladen

**Erwartete Ergebnisse:**
- [ ] Eine Landeinheit kann ein Wasserfeld nur als letztes Feld betreten, wenn dort ein eigener Frachter mit freiem Platz steht; die Bewegung löst `onMoveUnit` mit dem Feld des Frachters aus.

### Ablauf 9: Nächste Einheit und Zug beenden

#### Erfolgsfall: Nächste Einheit

**Schritte:** „Nächste Einheit“ mehrfach drücken.

**Erwartete Ergebnisse:**
- [ ] Der Zähler zeigt „5“ (`u1`, `u5`, `u8`, `u9`, `u10`; geladene Einheiten zählen nicht).
- [ ] Jeder Druck wählt die nächste dieser Einheiten aus, ruft `onSelectUnit` auf und zentriert die Karte; nach der letzten folgt wieder die erste.
- [ ] Bei 0 offenen Einheiten ist der Button deaktiviert.

#### Erfolgsfall: Zug beenden ohne offene Einheiten

**Setup:** Alle eigenen Einheiten mit `needsOrders: false`.

**Erwartete Ergebnisse:**
- [ ] „Zug beenden“ ruft `onEndTurn()` sofort auf, ohne Dialog, und hebt jede Auswahl auf.

#### Bestätigungsfall: offene Einheiten

**Schritte:** Mit Beispieldaten „Zug beenden“ drücken.

**Erwartete Ergebnisse:**
- [ ] Ein Dialog (`role="alertdialog"`) erscheint mit Überschrift „Zug beenden?“ und Text „5 Einheiten haben in dieser Runde noch keine Befehle.“ (bei einer Einheit: „1 Einheit hat in dieser Runde noch keine Befehle.“).
- [ ] „Zu den Einheiten“ schließt den Dialog und wählt die nächste offene Einheit aus, `onEndTurn` wird nicht aufgerufen.
- [ ] „Trotzdem beenden“ ruft `onEndTurn()` auf.
- [ ] Esc schließt den Dialog ohne Callback.

### Ablauf 10: Gegnerzug-Wiederholung

**Setup:** `match.phase = "replay"`, `replay` aus den Beispieldaten.

**Erwartete Ergebnisse:**
- [ ] Ein Overlay zeigt „Gegnerzug · Admiral Kessler“ (Name in Teilnehmerfarbe), „Panzerkreuzer bewegt sich“ und „1/4“.
- [ ] Ein Geist-Token läuft Schritt für Schritt den Pfad entlang (etwa 500 ms pro Schritt), die Kamera folgt.
- [ ] Bei Aktion `r2` steht „Tauchboot greift an · Kanonenboot versenkt“, am Ende des Pfads läuft die Explosionsanimation.
- [ ] Bei `r3` steht „Grenadiere erobert · Südwacht erobert“.
- [ ] „Überspringen“ ruft `onSkipReplay()` auf.
- [ ] Nach der letzten Aktion ruft die Komponente `onSkipReplay()` selbst auf.
- [ ] Während der Wiederholung sind „Nächste Einheit“ und „Zug beenden“ deaktiviert.

### Ablauf 11: Ereignis-Log

**Schritte:**
1. Auf „Ereignisse“ tippen.
2. Auf „Südwacht wurde von Admiral Kessler erobert.“ tippen.

**Erwartete Ergebnisse:**
- [ ] Der Button zeigt „Ereignisse“ und das Badge „6 neu“.
- [ ] Nach Schritt 1 ist `aria-expanded="true"`, die Liste zeigt 7 Einträge mit Symbol, Text und Runde („R14“, „R13“); der alte Eintrag „Dein Kanonenboot hat ein Tauchboot versenkt.“ ist abgeblendet.
- [ ] Nach Schritt 2 wird `onSelectEvent("ev1")` aufgerufen und die Karte zentriert sich auf Feld 10,9.
- [ ] Auf schmalen Bildschirmen (unter 768 px) schließt sich das Log nach dem Tipp.

### Ablauf 12: Minikarte

**Erwartete Ergebnisse:**
- [ ] Die Minikarte mit Kopf „Lagekarte“ zeigt Gelände, unerforschte Felder dunkel, Städte als Quadrate in Besitzerfarbe und den Kamera-Ausschnitt als amber Rahmen.
- [ ] Städte auf unerforschten Feldern erscheinen nicht auf der Minikarte, auch wenn sie in `cities` enthalten sind.
- [ ] Ein Klick auf die Minikarte zentriert die Hauptkarte auf diese Stelle; es wird kein Callback aufgerufen.
- [ ] Auf Mobilgeräten ist die Minikarte zunächst ausgeblendet und wird über den Button „Minikarte ein- oder ausblenden“ (`aria-pressed`) eingeblendet.

### Ablauf 13: Stufenweises Abbrechen

**Setup:** `u1` ausgewählt, Pfadvorschau aktiv, Ereignis-Log offen.

**Erwartete Ergebnisse:**
- [ ] Esc (bzw. Rechtsklick auf die Karte) entfernt zuerst die Pfadvorschau, dann die Auswahl der Einheit, dann schließt sich das Log.
- [ ] Die volle Reihenfolge ist: Zugende-Dialog → Angriffsdialog → Patrouille- bzw. Ausladen-Modus → Pfadvorschau → Einheiten-Auswahl → Stadt-Panel → Ereignis-Log.
- [ ] Rechtsklick öffnet kein Browser-Kontextmenü.
- [ ] Auf Feld 3,4 (Eisenhafen mit `u3` auf Wache): erster Tipp wählt `u3`, zweiter Tipp öffnet das Stadt-Panel Eisenhafen, dritter Tipp schließt es.

---

## Leere Zustände

- [ ] **Ereignis-Log ohne Einträge:** Bei `events = []` fehlt das Badge „neu“; aufgeklappt zeigt die Liste „Keine Ereignisse seit deinem letzten Zug.“
- [ ] **Stadt ohne Produktion:** „Die Fabriken stehen still. Wähle unten, was gebaut werden soll.“ in einem amber gestrichelten Kasten.
- [ ] **Leerer Frachter:** „Ladung 0/6“ und „Leer. Ziehe Landeinheiten auf den Frachter, um sie zu laden.“
- [ ] **Leerer Flugzeugträger:** „Ladung 0/4“ und „Leer. Lass Flugzeuge auf dem Träger landen, um sie aufzutanken und mitzunehmen.“
- [ ] **Keine offenen Einheiten:** „Nächste Einheit“ zeigt „0“ und ist deaktiviert, „Zug beenden“ beendet ohne Rückfrage.
- [ ] **Keine Auswahl:** Weder Einheiten-Info noch Stadt-Panel sichtbar, die Aktionsleiste ist auch auf Mobilgeräten sichtbar.
- [ ] **Leere Wiederholung:** Bei `phase = "replay"` und `replay = []` erscheint kein Overlay, `onSkipReplay()` wird sofort aufgerufen.
- [ ] **Kein Kampf:** Bei `lastCombat = null` erscheint kein Toast.

---

## Komponenten-Interaktionen

### Spielfeld

- [ ] Füllt den Container vollständig; die Startkamera zentriert auf die erste Einheit mit offenen Befehlen, sonst auf die eigene Hauptstadt, sonst auf die Kartenmitte.
- [ ] In der Phase `waiting` erscheint das Banner „Warte auf Admiral Kessler & Lena Hartmann …“ (ausgeschiedene Teilnehmer wie „Graf Ostrow“ fehlen).
- [ ] Außerhalb von `yourTurn` werden keine erreichbaren Felder oder Angriffsziele angezeigt, Befehlsbuttons, Produktionsliste, „Nächste Einheit“ und „Zug beenden“ sind deaktiviert.
- [ ] Verschwindet die ausgewählte Einheit aus `units` (zerstört oder geladen), wird die Auswahl aufgehoben. Flugzeuge auf einem Träger bleiben auswählbar.
- [ ] Esc löst `cancelStep` aus (siehe Ablauf 13).

### HexMap

- [ ] Feinde werden nur auf Feldern mit `visibility: "visible"` gezeigt, eigene Einheiten immer; geladene Einheiten erscheinen nicht als eigener Spielstein.
- [ ] Städte auf erforschten, nicht sichtbaren Feldern erscheinen abgeschwächt; Städte auf unerforschten Feldern werden gar nicht gezeichnet, auch wenn sie in `cities` enthalten sind.
- [ ] Mausrad zoomt um den Mauszeiger (Faktor 1,12, Grenzen 0,45 bis 2,4), Pinch zoomt mit zwei Fingern, Ziehen auf leerem Gelände verschiebt.
- [ ] Ein Tipp gilt erst als Ziehen ab mehr als 6 px Bewegung.
- [ ] Nur die primäre Maustaste wählt aus und bewegt; Rechtsklick ruft `onCancel` auf.
- [ ] Eigene Einheiten mit `needsOrders` haben einen pulsierenden Amber-Ring.

### UnitPanel

- [ ] Fremde Einheit (z. B. `e1` nach Tipp auf Feld 10,4): Kopf „Panzerkreuzer“, „Admiral Kessler · Aurelische Republik“, „Bewegung“ zeigt den Grundwert ohne „/…“, keine Befehlsbuttons, kein Befehlsstatus, `onSelectUnit` wird nicht aufgerufen.
- [ ] Lufteinheit: Treibstoffbalken mit „6/12“ (bei `u8`); bei Treibstoff höchstens halber Reichweite sind Symbol und Balken rot, sonst teal.
- [ ] „Schließen“ hebt die Auswahl auf.

### CityPanel

- [ ] „Schließen“ schließt das Panel ohne Callback.
- [ ] Erneutes Antippen des aktiven Einheitentyps ruft `onSetProduction` nicht auf (kein Zurücksetzen des Fortschritts).
- [ ] Ohne Prop `faction` (oder bei einem Bonus, der den Typ nicht betrifft) zeigt jede Zeile nur `productionTurns` ohne Durchstreichung.

### EventLog

- [ ] Der Umschalter hat `aria-expanded`; jedes Ereignis zeigt das Symbol seines Typs (Fernglas, gekreuzte Schwerter, Warndreieck, Fahne, Hammer, Totenkopf, Kanister).

---

## Grenzfälle

- [ ] **Lange Namen:** Lange Einheiten-, Fraktions- und Teilnehmernamen werden in der Einheiten-Info und im Stadt-Panel abgeschnitten (`truncate`), z. B. „Admiral Kessler · Aurelische Republik“. Lange Ereignistexte (ev4: „Ein Wolkenkreuzer des Nordmark-Kollektivs kreist über der Meerenge. Lena Hartmann hat bisher nicht angegriffen.“) brechen um.
- [ ] **Stadtnamen auf der Karte** werden in Versalien gezeigt (`toUpperCase()`, z. B. „Rußbrück“ → „RUSSBRÜCK“).
- [ ] **Einheit in Stadt:** `u3` auf Eisenhafen wird kleiner und versetzt dargestellt, Stadt und Einheit bleiben antippbar.
- [ ] **Treibstoff begrenzt Reichweite:** Bei Lufteinheiten gilt das Minimum aus `movesLeft` und `fuel`.
- [ ] **Bewegung verbraucht:** Einheit mit `movesLeft: 0` hat keine erreichbaren Felder und keine Angriffsziele.
- [ ] **Ausgeschiedener Teilnehmer:** `p4` erscheint nicht im Warte-Banner.
- [ ] **Leer ↔ gefüllt:** Wird `events` von leer auf gefüllt aktualisiert, erscheint das Badge „N neu“; wird ein Ereignis mit `isNew: false` zurückgeliefert, sinkt der Zähler.
- [ ] **Stadt wechselt Besitzer:** Nach Update von `cities` zeigt die Karte die neue Besitzerfarbe, das Panel die Produktionsliste statt des Schloss-Hinweises.
- [ ] **Produktion eines nicht mehr baubaren Typs:** Liegt `production.unitTypeId` nicht in der Liste der baubaren Typen, zeigt das Panel den Leerzustand „Die Fabriken stehen still. …“.
- [ ] **Phasenwechsel:** `replay` → `yourTurn` blendet das Overlay aus und aktiviert die Aktionsleiste; `yourTurn` → `waiting` zeigt das Warte-Banner.
- [ ] **Mobil:** Unter `md` sind Einheiten-Info und Stadt-Panel Bottom-Sheets (Stadt-Panel max. 70 % Höhe, scrollbar), die Aktionsleiste ist bei offenem Sheet ausgeblendet; unter 640 px startet die Kamera mit Zoom 0,85 und der Button zeigt nur „Nächste“.

---

## Barrierefreiheit

- [ ] Karte: `role="application"`, `aria-label="Spielkarte"`.
- [ ] Minikarte: `role="img"`, `aria-label="Minikarte, antippen zum Springen"`; Umschalter mit `aria-label="Minikarte ein- oder ausblenden"` und `aria-pressed`.
- [ ] Einheiten-Info: `section` mit `aria-label="Einheit <Typname>"`; Stadt-Panel: `aria-label="Stadt <Name>"`.
- [ ] Schließen-Buttons in Panels und Toast haben `aria-label="Schließen"`.
- [ ] Produktionsbuttons haben `aria-pressed` für den aktiven Typ; der Fortschritt hat `aria-label="Fortschritt X von Y"`.
- [ ] Ereignis-Log-Umschalter hat `aria-expanded`.
- [ ] Kampf-Toast hat `role="status"`.
- [ ] Zugende-Dialog hat `role="alertdialog"` und `aria-labelledby` auf die Überschrift „Zug beenden?“.
- [ ] Alle Buttons sind echte `<button type="button">` und per Tab erreichbar; Befehlsbuttons haben einen sichtbaren teal Fokusrahmen (`focus-visible`).
- [ ] Esc funktioniert global (Listener auf `window`).
- [ ] Alle Bedienelemente sind mindestens 44 px groß (Ausnahme: Ladungs-Buttons `min-h-9`, Toast-Schließen `size-9`).
- [ ] Bekannte Lücke: Die Hex-Felder selbst sind nicht per Tastatur fokussierbar; Bewegungen erfordern Maus oder Touch.

---

## Beispiel-Testdaten

```typescript
import type {
  CombatResult,
  GameMap,
  Match,
  Participant,
  SpielfeldUndZuegeProps,
  Unit,
  UnitType,
} from './types'

// Kleine, gefüllte Partie: eine eigene Einheit, ein Feind, eine eigene und eine neutrale Stadt
const tiles: GameMap['tiles'] = Array.from({ length: 5 * 4 }, (_, i) => ({
  col: i % 5,
  row: Math.floor(i / 5),
  terrain: i % 5 === 4 ? 'shallows' : 'plains',
  visibility: 'visible',
}))

const grenadiere: UnitType = {
  id: 'grenadiere', name: 'Grenadiere', domain: 'land',
  strength: 2, defense: 2, movement: 1, range: null,
  capacity: 0, cargoDomain: null, productionTurns: 4,
  factionId: null, canCaptureCities: true,
}

const participants: Participant[] = [
  { id: 'p1', name: 'Björn', isYou: true, isAI: false, aiDifficulty: null, factionId: 'eisenbund', color: 'amber', status: 'active', cityCount: 1, unitCount: 1 },
  { id: 'p2', name: 'Admiral Kessler', isYou: false, isAI: true, aiDifficulty: 'hard', factionId: 'aurelia', color: 'rose', status: 'active', cityCount: 0, unitCount: 1 },
]

export const populatedProps: SpielfeldUndZuegeProps = {
  match: { id: 'm1', name: 'Testpartie', round: 3, mode: 'live', phase: 'yourTurn', turnDeadline: null, youId: 'p1' },
  participants,
  factions: [
    { id: 'eisenbund', name: 'Eisenbund von Valdrin', trait: 'Schwerindustrie', description: '', specialUnitTypeId: null,
      bonus: { label: 'Schwerindustrie', domain: 'land', stat: 'productionTurns', modifier: -1, mode: 'add' } },
    { id: 'aurelia', name: 'Aurelische Republik', trait: 'Flotte', description: '', specialUnitTypeId: null,
      bonus: { label: 'Seemacht', domain: 'sea', stat: 'movement', modifier: 1, mode: 'add' } },
  ],
  unitTypes: [grenadiere],
  map: { width: 5, height: 4, seed: 'test-1', tiles },
  cities: [
    { id: 'c1', name: 'Eisenhafen', col: 1, row: 1, ownerId: 'p1', isCapital: true, production: { unitTypeId: 'grenadiere', progress: 1, turnsRemaining: 3 } },
    { id: 'c2', name: 'Ventil', col: 3, row: 1, ownerId: null, isCapital: false, production: null },
  ],
  units: [
    { id: 'u1', unitTypeId: 'grenadiere', ownerId: 'p1', col: 2, row: 1, health: 100, movesLeft: 1, fuel: null, order: { type: 'none' }, cargoUnitIds: [], carriedBy: null, needsOrders: true },
    { id: 'e1', unitTypeId: 'grenadiere', ownerId: 'p2', col: 2, row: 2, health: 40, movesLeft: 0, fuel: null, order: { type: 'none' }, cargoUnitIds: [], carriedBy: null, needsOrders: false },
  ],
  events: [
    { id: 'ev1', round: 3, type: 'enemySighted', message: 'Aurelische Grenadiere wurden südlich gesichtet.', col: 2, row: 2, isNew: true },
  ],
  replay: [],
  combatPreviews: [{ attackerUnitId: 'u1', targetUnitId: 'e1', targetCityId: null, winChance: 0.72 }],
  lastCombat: null,
}

// Leere Variante: keine Einheiten, keine Ereignisse, Stadt ohne Produktion
export const emptyProps: SpielfeldUndZuegeProps = {
  ...populatedProps,
  cities: [{ id: 'c1', name: 'Eisenhafen', col: 1, row: 1, ownerId: 'p1', isCapital: true, production: null }],
  units: [] as Unit[],
  events: [],
  combatPreviews: [],
}

// Wartephase nach einem gewonnenen Stadtangriff
export const waitingAfterCapture: Partial<SpielfeldUndZuegeProps> & { match: Match; lastCombat: CombatResult } = {
  match: { ...populatedProps.match, phase: 'waiting' },
  lastCombat: {
    attackerUnitId: 'u1',
    defenderUnitId: null,
    targetCityId: 'c2',
    outcome: 'victory',
    attackerDamage: 20,
    defenderDamage: 100,
    message: 'Grenadiere haben Ventil erobert.',
  },
}
```
