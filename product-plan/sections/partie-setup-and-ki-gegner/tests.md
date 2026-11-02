# Test-Spezifikation: Partie-Setup & KI-Gegner

## Überblick

Diese Spezifikation beschreibt das Verhalten des Assistenten `PartieSetup` aus Nutzersicht, unabhängig vom Test-Framework. Sie deckt die fünf Schritte (Modus & Regeln, Deine Fraktion, Gegner & Mitspieler, Karte, Übersicht), die Dialoge „KI-Gegner wählen“ und „Freund einladen“, die Abbruch-Bestätigung sowie alle Callbacks aus `PartieSetupProps` ab.

Wenn nicht anders angegeben, gilt als Ausgangslage `sample-data.json`:

- `you`: Björn
- `draft`: Name „Die Kohleinseln II“, Modus `async`, 24 Stunden, Siegbedingung `capitals`, Rundenlimit 100, `allowDuplicateFactions: false`, Plätze `[{ kind: 'you' }, { kind: 'empty' }]`, `fillEmptyWithAI: true`, Karte `medium` / 45 % / `normal` / `normal` / `KOHLE-4417`, `factionId: null`
- Fraktionen: Eisenbund von Valdrin (`eisenbund`), Aurelische Republik (`aurelia`), Nordmark-Kollektiv (`nordmark`), Salzküsten-Liga (`salzkueste`)
- KI-Persönlichkeiten: Admiral Kessler und Senatorin Varenne (Aurelia), Zechenmeister Brandt und Generalin Eisenhart (Eisenbund), Kapitänin Halvorsen und Ingenieur Lindqvist (Nordmark), Graf Ostrow (Salzküste)
- Freunde: Lena Hartmann (online), Mira Okonkwo (im Spiel), Jonas Vogt (online), Tobias Brenner, Selin Arslan, Paul Kretschmer-Wittenberg (offline)

Alle Callbacks werden als Mock-Funktionen übergeben.

---

## Tests der Abläufe

### Ablauf 1: Assistent durchlaufen und Solo-Partie gegen eine KI erstellen

**Szenario:** Der Spieler legt mit den Vorgabewerten eine Partie gegen einen KI-Gegner an.

#### Erfolgsfall

**Setup:** `PartieSetup` mit Beispieldaten rendern.

**Schritte:**
1. Prüfen, dass Schritt 1 „Modus & Regeln“ aktiv ist (Desktop: Schritt 1 mit `aria-current="step"`; Smartphone: „Schritt 1 von 5“).
2. Auf „Weiter“ klicken.
3. In Schritt 2 „Deine Fraktion“ die Karte „Eisenbund von Valdrin“ wählen.
4. Auf „Weiter“ klicken.
5. In Schritt 3 beim Platz 2 auf „KI“ klicken.
6. Im Dialog „KI-Gegner wählen“ auf „Admiral Kessler“ klicken.
7. In der Platzkarte von Admiral Kessler bei der Schwierigkeit „Schwer“ wählen.
8. Auf „Weiter“ klicken, in Schritt 4 „Karte“ nichts ändern, erneut „Weiter“.
9. In Schritt 5 „Übersicht“ auf „Partie erstellen“ klicken.

**Erwartete Ergebnisse:**
- [ ] Der Kopf zeigt den Kicker „Mobilmachung“, die Überschrift „Neue Partie“ und den Stempel „Die Kohleinseln II“.
- [ ] Schritt 1 hat keinen „Zurück“-Button; ab Schritt 2 ist „Zurück“ sichtbar.
- [ ] Nach Wahl der Fraktion ist die Karte „Eisenbund von Valdrin“ mit `aria-checked="true"` und Häkchen markiert.
- [ ] Im Dialog sind „Zechenmeister Brandt“ und „Generalin Eisenhart“ deaktiviert und zeigen „Eisenbund ist schon vergeben“.
- [ ] Nach der Wahl schließt der Dialog; Platz 2 zeigt „KI-Gegner“, „Admiral Kessler“, die Fraktion „Aurelia“ und die Schwierigkeit mit „Normal“ vorausgewählt.
- [ ] Platz 1 zeigt „Du“, „Björn“ und „Eisenbund“.
- [ ] Die Übersicht zeigt im Block „Gegner & Mitspieler · 2“: „Platz 1 – Björn (du)“ und „Platz 2 – Admiral Kessler · KI Schwer“.
- [ ] Die Übersicht zeigt den Hinweis „Nur KI-Gegner: Die Partie startet sofort als Solo-Partie.“
- [ ] Der Hauptbutton heißt in Schritt 5 „Partie erstellen“ statt „Weiter“.
- [ ] `onCreateMatch` wird genau einmal aufgerufen mit einem `MatchDraft`, in dem `factionId: 'eisenbund'` und `seats: [{ kind: 'you' }, { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' }]` stehen; alle übrigen Felder entsprechen dem Ausgangsentwurf.

#### Fehlerfall: Pflichtangaben fehlen

**Schritte:**
1. In Schritt 1 das Feld „Name der Partie“ leeren (oder nur Leerzeichen eingeben).
2. Auf „Weiter“ zu klicken versuchen.
3. Einen Namen eingeben, weiter zu Schritt 2, keine Fraktion wählen.

**Erwartete Ergebnisse:**
- [ ] Bei leerem Namen ist „Weiter“ deaktiviert und die Fußleiste zeigt „Gib der Partie einen Namen.“ (`role="status"`).
- [ ] Der Stempel im Kopf zeigt „Ohne Namen“.
- [ ] In Schritt 2 ohne Fraktion ist „Weiter“ deaktiviert mit „Wähle deine Fraktion.“
- [ ] Nach Auswahl einer Fraktion verschwindet der Hinweis und „Weiter“ ist aktiv.
- [ ] `onCreateMatch` wird nicht aufgerufen.

#### Validierungsfall: Platz ohne Besetzung

**Schritte:**
1. Bis Schritt 3 gehen (Fraktion gewählt), Platz 2 bleibt „Wer besetzt diesen Platz?“.
2. Den Schalter „Freie Plätze beim Start mit KI auffüllen“ ausschalten.

**Erwartete Ergebnisse:**
- [ ] „Weiter“ ist deaktiviert mit „Lege für jeden Platz fest, wer ihn besetzt, oder lass freie Plätze mit KI auffüllen.“
- [ ] Nach erneutem Einschalten des Schalters ist „Weiter“ wieder aktiv.
- [ ] In der Übersicht steht für einen solchen Platz bei eingeschaltetem Schalter „KI (Normal) beim Start“, sonst „Noch frei“.

---

### Ablauf 2: Fraktionskonflikte mit KI-Gegnern

**Szenario:** Der Spieler kehrt nach dem Aufstellen der KI zur Fraktionswahl zurück bzw. ändert die Regel für doppelte Fraktionen.

#### Erfolgsfall: Gesperrte Fraktion

**Setup:** Assistent bis Schritt 3 durchlaufen, eigene Fraktion „Eisenbund von Valdrin“, Platz 2 mit „Admiral Kessler“ (Aurelia) besetzt.

**Schritte:**
1. In der Fortschrittsleiste auf „Deine Fraktion“ klicken.

**Erwartete Ergebnisse:**
- [ ] Die Karte „Aurelische Republik“ ist deaktiviert, halbtransparent und zeigt „Geführt von Admiral Kessler, ändere die KI unter „Gegner & Mitspieler““.
- [ ] Die übrigen Fraktionen sind wählbar; die bisherige Auswahl „Eisenbund von Valdrin“ ist erhalten.
- [ ] Über die Fortschrittsleiste kann direkt wieder „Gegner & Mitspieler“ angesprungen werden (bereits besucht), „Karte“ und „Übersicht“ sind noch deaktiviert.

#### Variante: Doppelte Fraktionen erlaubt

**Schritte:**
1. In Schritt 1 den Schalter „Doppelte Fraktionen erlauben“ einschalten, dann zu Schritt 2 wechseln.

**Erwartete Ergebnisse:**
- [ ] „Aurelische Republik“ ist wählbar und zeigt „Auch Admiral Kessler führt diese Fraktion“.
- [ ] Im Dialog „KI-Gegner wählen“ sind Persönlichkeiten der eigenen Fraktion nicht mehr ausgegraut; bereits eingesetzte Persönlichkeiten bleiben deaktiviert mit „Bereits in dieser Partie“.

#### Fehlerfall: Doppelung nachträglich verboten

**Setup:** „Doppelte Fraktionen erlauben“ an, eigene Fraktion „Aurelische Republik“, drei Plätze: Platz 2 „Admiral Kessler“, Platz 3 „Senatorin Varenne“.

**Schritte:**
1. In Schritt 1 den Schalter „Doppelte Fraktionen erlauben“ ausschalten.
2. Über die Fortschrittsleiste „Gegner & Mitspieler“ öffnen.

**Erwartete Ergebnisse:**
- [ ] „Weiter“ ist deaktiviert mit „Zwei KI-Gegner führen dieselbe Fraktion. Doppelte Fraktionen sind nicht erlaubt.“
- [ ] Nachdem Platz 3 über „Ändern“ geleert und z. B. mit „Graf Ostrow“ besetzt wurde, lautet der Hinweis „Ein KI-Gegner führt deine Fraktion. Wähle eine andere KI-Persönlichkeit oder erlaube doppelte Fraktionen.“
- [ ] Erst wenn kein KI-Gegner mehr Aurelia führt, ist „Weiter“ aktiv.

---

### Ablauf 3: Mitspieler einladen

**Szenario:** Der Spieler besetzt Plätze mit einem Freund, einem Einladungslink und einem offenen Platz und teilt den Link.

#### Erfolgsfall

**Setup:** Assistent bis Schritt 3, Fraktion gewählt.

**Schritte:**
1. Zweimal „Platz hinzufügen“ klicken (4 Plätze).
2. Platz 2: „Freund“ → im Dialog „Freund einladen“ ins Suchfeld „lena“ tippen → „Lena Hartmann“ klicken.
3. Platz 3: „Einladung“ klicken.
4. Platz 4: „Offen“ klicken.
5. Beim Einladungslink auf „Kopieren“, dann auf „Teilen“ klicken.
6. In Schritt 1 den Modus „Live“ wählen, über die Fortschrittsleiste zur „Übersicht“ springen (nachdem sie einmal besucht wurde) bzw. regulär über „Weiter“ dorthin gehen.

**Erwartete Ergebnisse:**
- [ ] Die Anzeige „Anzahl Plätze“ zeigt 4.
- [ ] Die Suche filtert die Liste auf „Lena Hartmann“ mit Status „Online“ und Aktion „Einladen“.
- [ ] Platz 2 zeigt „Freund“, „Lena Hartmann“, „Wählt die Fraktion selbst“.
- [ ] Platz 3 zeigt „Einladung per Link“ und „Wer den Link hat“; Platz 4 zeigt „Offener Platz“ und „Beliebiger Spieler“.
- [ ] `onCopyInviteLink` wird mit `'https://dominion-of-steam.app/einladung/K7Q-2XM-H9P'` aufgerufen (zusätzlich `navigator.clipboard.writeText` mit demselben Link).
- [ ] `onShareInviteLink` wird mit demselben Link aufgerufen.
- [ ] Öffnet man für einen weiteren Platz den Freundes-Dialog, ist „Lena Hartmann“ deaktiviert und zeigt „Eingeladen“.
- [ ] Die Übersicht zeigt für Live mit ausstehenden Plätzen den Hinweis „Live-Partien starten erst, wenn alle Mitspieler beigetreten sind.“
- [ ] Bei ausgeschaltetem „Freie Plätze beim Start mit KI auffüllen“ erscheint zusätzlich „Die Partie wartet in der Lobby, bis alle eingeladenen und offenen Plätze besetzt sind.“

#### Fehlerfall: Suche ohne Treffer

**Schritte:**
1. Im Dialog „Freund einladen“ „xyz“ eingeben.

**Erwartete Ergebnisse:**
- [ ] Statt der Liste erscheint „Kein Freund mit „xyz“ gefunden.“
- [ ] Nach Leeren des Suchfelds sind wieder alle sechs Freunde sichtbar.

#### Grenzfall: Platzanzahl

- [ ] Bei 2 Plätzen ist „Platz entfernen“ deaktiviert, bei 6 Plätzen „Platz hinzufügen“.
- [ ] „Platz entfernen“ entfernt immer den letzten Platz, auch wenn er besetzt ist.
- [ ] „Ändern“ auf einer besetzten Platzkarte setzt den Platz auf „Wer besetzt diesen Platz?“ zurück; Platz 1 hat keinen „Ändern“-Button.

---

### Ablauf 4: Karte einstellen und Übersicht korrigieren

**Szenario:** Der Spieler stellt die Karte ein und korrigiert Werte über die „Ändern“-Links der Übersicht.

#### Erfolgsfall

**Setup:** Assistent bis Schritt 4.

**Schritte:**
1. Kartengröße „Groß“ wählen.
2. Den Regler „Landanteil in Prozent“ auf 60 stellen.
3. „Neutrale Städte“ auf „Viele“, „Gebirge und Wald“ auf „Wenig“ stellen.
4. Auf „Neu würfeln“ klicken.
5. Ins Feld „Kartencode“ „kohle 12“ tippen.
6. „Weiter“ zur Übersicht, dort im Block „Karte“ auf „Ändern“ klicken.

**Erwartete Ergebnisse:**
- [ ] Die Karte „Groß“ zeigt „26×18 Felder“ und „3–5 Spieler“ und ist mit `aria-checked="true"` ausgewählt.
- [ ] Über dem Regler steht „60 %“ zwischen „Inselwelt“ und „Kontinente“; der Regler springt in 5er-Schritten zwischen 20 und 70.
- [ ] `onRandomizeSeed` wird ohne Argumente aufgerufen; sein Rückgabewert erscheint im Feld „Kartencode“.
- [ ] Die Eingabe „kohle 12“ wird zu „KOHLE12“ (Großbuchstaben, nur A–Z, 0–9 und Bindestrich, höchstens 16 Zeichen).
- [ ] Die Übersicht zeigt „Größe: Groß · 26×18“, „Landanteil: 60 %“, „Neutrale Städte: Viele“, „Gebirge & Wald: Wenig“ und den Kartencode in Monospace.
- [ ] „Ändern“ im Block „Karte“ springt zu Schritt 4 mit allen Eingaben erhalten.

#### Fehlerfall: Zu viele Spieler für die Kartengröße

**Schritte:**
1. In Schritt 3 sechs Plätze einstellen, in Schritt 4 „Mittel“ lassen, zur Übersicht gehen.

**Erwartete Ergebnisse:**
- [ ] In Schritt 4 sind die Spielerangaben „2–3 Spieler“ (Klein), „2–4 Spieler“ (Mittel) und „3–5 Spieler“ (Groß) in Amber hervorgehoben, „4–6 Spieler“ (Riesig) nicht.
- [ ] Die Übersicht zeigt „6 Spieler sind viel für die Kartengröße „Mittel“ (empfohlen bis 4).“
- [ ] Der Hinweis blockiert nicht: „Partie erstellen“ bleibt aktiv.

#### Fehlerfall: Blockade aus früherem Schritt in der Übersicht

**Schritte:**
1. Übersicht erreichen, im Block „Modus & Regeln“ auf „Ändern“ klicken.
2. Den Namen leeren.
3. In der Fortschrittsleiste auf „Übersicht“ klicken.

**Erwartete Ergebnisse:**
- [ ] Die Übersicht ist direkt erreichbar, weil sie bereits besucht wurde.
- [ ] „Partie erstellen“ ist deaktiviert, die Fußleiste zeigt „Gib der Partie einen Namen.“
- [ ] `onCreateMatch` wird nicht aufgerufen.

---

### Ablauf 5: Abbrechen

#### Erfolgsfall: Unveränderter Entwurf

**Schritte:**
1. Direkt nach dem Öffnen auf „Abbrechen“ klicken.

**Erwartete Ergebnisse:**
- [ ] `onCancel` wird sofort aufgerufen, ohne Dialog.

#### Bestätigungsfall: Veränderter Entwurf

**Schritte:**
1. Den Namen auf „Ostfront“ ändern, auf „Abbrechen“ klicken.
2. Im Dialog „Einrichtung abbrechen?“ auf „Weiter einrichten“ klicken.
3. Erneut „Abbrechen“, dann „Verwerfen“.

**Erwartete Ergebnisse:**
- [ ] Der Dialog „Einrichtung abbrechen?“ zeigt „Deine Einstellungen für „Ostfront“ gehen verloren.“
- [ ] „Weiter einrichten“ schließt den Dialog, die Eingaben bleiben erhalten, `onCancel` wird nicht aufgerufen.
- [ ] „Verwerfen“ schließt den Dialog und ruft `onCancel` genau einmal auf.
- [ ] Wird eine Änderung manuell wieder rückgängig gemacht (Name wieder „Die Kohleinseln II“), gilt der Entwurf als unverändert und „Abbrechen“ ruft `onCancel` direkt auf.

---

## Leere Zustände

- **Startzustand ohne Fraktion:** Platz 1 zeigt „Noch keine Fraktion gewählt“, bis in Schritt 2 eine Fraktion gewählt wurde.
- **Freier Platz:** Platzkarte mit gestricheltem Rahmen, Text „Wer besetzt diesen Platz?“ und den Buttons „Freund“, „Einladung“, „Offen“, „KI“.
- **Freier Platz in der Übersicht:** „KI (Normal) beim Start“ bei aktivem Auffüllen, sonst „Noch frei“.
- **Mensch ohne Fraktion:** Freund-, Einladungs- und offene Plätze zeigen „Wählt die Fraktion selbst“.
- **Keine Fraktion in der Übersicht:** Block „Deine Fraktion“ zeigt „Fraktion: Noch nicht gewählt“ (nur erreichbar, wenn der Entwurf ohne Fraktion in die Übersicht gelangt).
- **Kein Partiename:** Stempel „Ohne Namen“; der Abbruch-Dialog spricht dann von „Neue Partie“.
- **Freundessuche ohne Treffer:** „Kein Freund mit „<Suchbegriff>“ gefunden.“
- **Keine Freunde:** Bei `friends: []` zeigt der Dialog „Freund einladen“ „Du hast noch keine Freunde. Lade Mitspieler stattdessen über den Einladungslink ein.“
- **Keine KI-Persönlichkeiten:** Bei `aiPersonalities: []` zeigt der Dialog „KI-Gegner wählen“ „Es sind keine KI-Gegner verfügbar.“
- **Keine Hinweise:** Liegen keine Warnungen vor, wird die Hinweisliste in der Übersicht gar nicht gerendert.
- **KI-Persönlichkeit ohne Spielweise:** „Ingenieur Lindqvist“ (`style: []`) zeigt keine Schlagwort-Chips, nur Titel, Fraktion und Beschreibung.
- **Fehlende Bilder:** Ohne geladenes Wappen erscheint ein SVG-Schild in Fraktionsfarbe mit Anfangsbuchstaben des Kurznamens; ohne Avatar/Porträt erscheinen Initialen (z. B. „AK“ für Admiral Kessler, „PK“ für Paul Kretschmer-Wittenberg).
- **Leer ↔ befüllt:** Eine KI-/Freund-/Einladungs-/Offen-Platzkarte wird über „Ändern“ wieder zum leeren Platz; ein leerer Platz wird durch eine der vier Optionen befüllt.

---

## Komponenten-Interaktionen

### PartieSetup
- [ ] Rendert Kopf, Fortschrittsleiste (Desktop: fünf Schritte „Modus & Regeln“, „Deine Fraktion“, „Gegner & Mitspieler“, „Karte“, „Übersicht“; Smartphone: Schrittname, „Schritt N von 5“, fünf Balken) und Fußleiste.
- [ ] Erledigte Schritte zeigen ein Häkchen; noch nicht besuchte Schritte sind deaktiviert; der aktuelle Schritt ist auf dem Desktop nicht klickbar.
- [ ] „Zurück“ geht einen Schritt zurück, ohne Eingaben zu verlieren.
- [ ] Der Entwurf wird lokal gehalten: Änderungen am `draft`-Prop nach dem ersten Rendern werden nicht übernommen.

### StepRules
- [ ] Modus „Asynchron“ zeigt „Frist pro Zug“ mit „12 Stunden“, „24 Stunden“, „48 Stunden“; „Live“ zeigt „Zeitlimit pro Zug“ mit „Aus“, „2 Minuten“, „5 Minuten“.
- [ ] Nur bei „Rundenlimit“ erscheint „Anzahl Runden“ mit 50, 100, 150.
- [ ] Das Namensfeld hat den Platzhalter „z. B. Die Kohleinseln“ und nimmt höchstens 40 Zeichen auf.

### StepFaction
- [ ] Zeigt pro Fraktion Wappen, Name, Leitspruch in Anführungszeichen und Eigenheit.
- [ ] Ein Klick wählt die Fraktion; gesperrte Karten reagieren nicht.

### StepPlayers
- [ ] Hinweis „2 bis 6 Spieler, Platz 1 bist du.“; Platzanzahl in Monospace mit `aria-live="polite"`.
- [ ] Freund und KI öffnen den jeweiligen Dialog; Einladung und Offen setzen den Platz sofort.
- [ ] Schwierigkeits-Segmente „Leicht“, „Normal“, „Schwer“ ändern nur den eigenen Platz.

### AiPicker
- [ ] Titel „KI-Gegner wählen“; jede Karte zeigt Porträt mit Wappen, Name, „<Titel> · <Kurzname>“, Spielweise-Chips und eine auf drei Zeilen gekürzte Beschreibung.
- [ ] Gewählte Persönlichkeit wird mit Schwierigkeit `normal` gesetzt.
- [ ] Beim Öffnen liegt der Fokus auf der ersten Persönlichkeitskarte (erster Button nach „Schließen“).
- [ ] Escape, Klick auf den abgedunkelten Hintergrund oder „Schließen“ schließt ohne Änderung.

### FriendPicker
- [ ] Titel „Freund einladen“; das Suchfeld „Freunde durchsuchen“ ist beim Öffnen fokussiert.
- [ ] Status „Online“ (Teal-Punkt), „Im Spiel“ (Amber-Punkt), „Offline“ (grauer Punkt) mit „· zuletzt <Datum>“, z. B. „Offline · zuletzt 29. Okt.“ für Tobias Brenner.
- [ ] Escape schließt den Dialog.

### StepMap
- [ ] Kartengrößen-Karten zeigen maßstabsgetreue Grundflächen; die größte füllt die Höhe.
- [ ] „Neutrale Städte“ zeigt „Wenige“, „Normal“, „Viele“; „Gebirge & Wald“ zeigt „Wenig“, „Normal“, „Viel“.
- [ ] Wird der Kartencode geleert, ist „Weiter“ gesperrt und die Fußleiste zeigt „Gib einen Kartencode ein oder würfle einen neuen.“; „Neu würfeln“ oder eine Eingabe hebt die Sperre auf.
- [ ] „Kopieren“ beim Kartencode schreibt den Code in die Zwischenablage (kein Callback).

### StepSummary
- [ ] Vier Blöcke „Modus & Regeln“, „Deine Fraktion“, „Gegner & Mitspieler · N“, „Karte“, jeweils mit „Ändern“, das zum passenden Schritt springt.
- [ ] Zeilen: Name, Modus („Asynchron“/„Live“), „Frist pro Zug“ bzw. „Zeitlimit pro Zug“, Siegbedingung (bei Rundenlimit „Rundenlimit · 100 Runden“), „Doppelte Fraktionen: Erlaubt / Nicht erlaubt“.
- [ ] Block „Karte“: „Neutrale Städte“ zeigt dieselben Bezeichnungen wie Schritt 4 („Wenige“, „Normal“, „Viele“).

### Abbruch-Dialog
- [ ] Escape oder Klick auf den Hintergrund entspricht „Weiter einrichten“.

---

## Grenzfälle

- [ ] **Lange Namen:** „Paul Kretschmer-Wittenberg“ wird in der Freundesliste und in der Platzkarte abgeschnitten (`truncate`), ohne das Layout zu sprengen.
- [ ] **Lange Beschreibung:** Die Beschreibung von „Zechenmeister Brandt“ (über 250 Zeichen) wird im KI-Dialog auf drei Zeilen gekürzt.
- [ ] **Langer Partiename:** 40 Zeichen passen in Stempel und Abbruch-Dialog.
- [ ] **Einladungslink** wird bei schmaler Breite abgeschnitten, „Kopieren“ und „Teilen“ bleiben bedienbar.
- [ ] **Alle Persönlichkeiten vergeben:** Ist jede Persönlichkeit gesperrt, bleibt der Dialog offen und alle Karten sind deaktiviert; der Spieler kann ihn nur schließen.
- [ ] **Doppelte Fraktionen nachträglich verboten, eigene Fraktion betroffen:** Die eigene, bereits gewählte Fraktionskarte erscheint in Schritt 2 gleichzeitig ausgewählt und gesperrt; der Blocker in Schritt 3 verhindert das Fortfahren.
- [ ] **Leerer Kartencode:** Das Feld kann geleert werden, dann blockiert Schritt 4 mit „Gib einen Kartencode ein oder würfle einen neuen.“
- [ ] **Nur KI und aufzufüllende Plätze:** Plätze `[you, empty]` mit aktivem Auffüllen zählen als Solo-Partie („Nur KI-Gegner: …“).
- [ ] **Freund und Auffüllen:** Ein Freundesplatz zählt als ausstehend; bei aktivem Auffüllen erscheint der Lobby-Hinweis nicht, der Live-Hinweis schon.

---

## Barrierefreiheit

- [ ] Fortschrittsleiste ist ein `nav` mit `aria-label="Fortschritt"`; der aktuelle Schritt hat `aria-current="step"`; die Balken auf dem Smartphone haben `aria-label="Zu Schritt N: <Name>"`.
- [ ] Optionskarten, Fraktionskarten, Kartengrößen und Segmente sind `role="radio"` mit `aria-checked` in einer `radiogroup`; Segmentgruppen haben Labels wie „Frist pro Zug“, „Zeitlimit pro Zug“, „Anzahl Runden“, „Neutrale Städte“, „Gebirge und Wald“, „Schwierigkeit Admiral Kessler“; die Fraktionswahl heißt „Deine Fraktion“.
- [ ] Schalter sind `role="switch"` mit `aria-checked`; ein Klick auf den Beschriftungstext schaltet ebenfalls um.
- [ ] Jeder Formularblock ist ein `fieldset` mit (visuell verborgener) `legend`.
- [ ] Icon-Buttons haben Labels: „Platz entfernen“, „Platz hinzufügen“, „Abbrechen“, „Schließen“; Regler „Landanteil in Prozent“, Feld „Kartencode“, Suchfeld „Freunde durchsuchen“.
- [ ] Der Blockierhinweis in der Fußleiste hat `role="status"`; die Hinweisliste der Übersicht hat `aria-label="Hinweise"`.
- [ ] Dialoge haben `role="dialog"`, `aria-modal="true"` und den Titel als `aria-label`; Escape schließt sie.
- [ ] Beim Öffnen eines Dialogs springt der Fokus hinein (erstes Formularfeld, sonst der erste Button nach „Schließen“); Tab und Umschalt+Tab bleiben im Dialog (vom letzten zum ersten Element und umgekehrt); beim Schließen kehrt der Fokus zum auslösenden Button zurück.
- [ ] Wappen haben `aria-label` bzw. `alt` „Wappen <Fraktionsname>“.
- [ ] Alle Bedienelemente sind per Tab erreichbar und haben sichtbare Fokusrahmen (Teal); Touch-Ziele sind mindestens 40–48 px hoch.

---

## Beispiel-Testdaten

```ts
import type { MatchDraft, AiPersonality, Friend, Faction } from './types'

// Startzustand (wie sample-data.json)
export const freshDraft: MatchDraft = {
  name: 'Die Kohleinseln II',
  mode: 'async',
  asyncTurnLimitHours: 24,
  liveTurnLimitMinutes: null,
  victoryCondition: 'capitals',
  roundLimit: 100,
  allowDuplicateFactions: false,
  seats: [{ kind: 'you' }, { kind: 'empty' }],
  fillEmptyWithAI: true,
  map: { size: 'medium', landShare: 45, neutralCities: 'normal', terrain: 'normal', seed: 'KOHLE-4417' },
  factionId: null,
}

// Befüllt: Live-Partie mit allen Platzarten, zu groß für "Mittel"
export const fullDraft: MatchDraft = {
  name: 'Sturm auf Nordhavn',
  mode: 'live',
  asyncTurnLimitHours: 24,
  liveTurnLimitMinutes: 5,
  victoryCondition: 'roundLimit',
  roundLimit: 150,
  allowDuplicateFactions: false,
  seats: [
    { kind: 'you' },
    { kind: 'friend', friendId: 'lena' },
    { kind: 'invite' },
    { kind: 'open' },
    { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' },
    { kind: 'ai', personalityId: 'ostrow', difficulty: 'easy' },
  ],
  fillEmptyWithAI: false,
  map: { size: 'medium', landShare: 60, neutralCities: 'high', terrain: 'low', seed: 'ZECHE-1203' },
  factionId: 'eisenbund',
}
// Erwartete Hinweise: "6 Spieler sind viel für die Kartengröße „Mittel“ (empfohlen bis 4).",
// "Die Partie wartet in der Lobby, …", "Live-Partien starten erst, …"

// Leer: ohne Name, ohne Freunde, ohne KI-Persönlichkeiten
export const emptyDraft: MatchDraft = { ...freshDraft, name: '', seats: [{ kind: 'you' }, { kind: 'empty' }], fillEmptyWithAI: false }
export const noFriends: Friend[] = []
export const noPersonalities: AiPersonality[] = []

export const factionsMinimal: Faction[] = [
  {
    id: 'aurelia',
    name: 'Aurelische Republik',
    shortName: 'Aurelia',
    color: 'rose',
    motto: 'Wer die Wellen hält, hält die Welt.',
    trait: 'Seemacht: Schiffe haben +1 Bewegung.',
    emblemUrl: null,
    heroImageUrl: null,
  },
]
```
