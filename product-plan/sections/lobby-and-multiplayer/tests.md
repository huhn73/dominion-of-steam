# Test-Spezifikation: Lobby & Multiplayer

## Überblick

Diese Spezifikation beschreibt das Verhalten der Ansichten `Lobby` und `Warteraum` aus Nutzersicht, unabhängig vom Test-Framework. Alle Zeitangaben beziehen sich auf die Prop `now` (Beispieldaten: `2026-10-30T13:00:00Z`) und `deadlineWarningHours` (Beispiel: `3`). Tests sollten `now` fest setzen, damit Countdowns („noch 22 Std.“) und Erinnerungs-Sperren deterministisch sind.

Geprüft werden:

- Aufbau und Sortierung der Lobby, Frist-Warnung, Erinnern mit 12-Stunden-Sperre
- Partie-Details und Aufgeben mit Bestätigungsdialog
- Einladungen, offene und beendete Partien, Push-Banner in drei Zuständen
- Warteraum: Bereit-Schalter, Start-Sperre, KI-Auffüllen, Einladungslink, Verlassen-Bestätigung

---

## Tests der Abläufe

### Ablauf 1: Lobby öffnen und weiterspielen

**Szenario:** Der Spieler öffnet die App und setzt eine Partie fort, in der er am Zug ist.

#### Erfolgsfall

**Setup:** `Lobby` mit den Beispieldaten (`matches` mit 3 × `yourTurn`, 2 × `othersTurn`, 1 × `waitingForPlayers`; `you.name = 'Björn'`).

**Schritte:**
1. Lobby rendern.
2. Den Abschnitt „Du bist am Zug“ ansehen.
3. Auf der Karte „Salz und Schwefel“ „Weiterspielen“ antippen.

**Erwartete Ergebnisse:**
- [ ] Kopfzeile zeigt „Lagezentrum“, die Überschrift „Lagebericht“ und „Björn, 3 Fronten warten auf deinen Befehl.“
- [ ] Überschrift „Du bist am Zug“ mit Zähler `3`
- [ ] Reihenfolge der Karten: „Salz und Schwefel“ (Frist 14:40), „Die Kohleinseln“ (Frist morgen 11:00), „Freitagsrunde“ (Live, ohne Frist, daher zuletzt)
- [ ] Jede große Karte zeigt „Runde N“ (z. B. „Runde 31“), den Partienamen über der Mini-Lagekarte und die Moduszeile („Asynchron · 12 Stunden“ bzw. „Live · 5 Minuten pro Zug“)
- [ ] „Die Kohleinseln“ zeigt den Stempel „noch 22 Std.“; „Freitagsrunde“ zeigt keinen Frist-Stempel
- [ ] `onPlay` wird mit `'m-salz'` aufgerufen

#### Fehlerfall / Grenzwert: Frist-Warnung

**Setup:** Beispieldaten; „Salz und Schwefel“ hat `turnDeadline: '2026-10-30T14:40:00Z'` (1 Std. 40 Min. vor Ablauf).

**Erwartete Ergebnisse:**
- [ ] Die Karte „Salz und Schwefel“ hat einen roten Rahmen, der Stempel lautet „noch 1 Std. 40 Min.“ und ist rot
- [ ] „Die Kohleinseln“ (22 Std.) hat keinen roten Rahmen
- [ ] Mit `turnDeadline` vor `now` zeigt der Stempel „Frist abgelaufen“ (rot)
- [ ] Mit `deadlineWarningHours: 1` ist „Salz und Schwefel“ nicht mehr rot hervorgehoben
- [ ] Eine `othersTurn`-Partie mit Frist unter 3 Std. wird **nicht** rot hervorgehoben (Warnung nur für eigene Züge)

### Ablauf 2: Übrige Partien und Mitspieler erinnern

**Szenario:** Der Spieler sieht, wer in seinen anderen Partien am Zug ist, und erinnert einen säumigen Mitspieler.

#### Erfolgsfall

**Setup:** Beispieldaten.

**Schritte:**
1. Abschnitt „Weitere Partien“ ansehen.
2. Bei „Nordwind“ auf „Erinnern“ tippen.

**Erwartete Ergebnisse:**
- [ ] „Weitere Partien“ mit Zähler `3`: „Nordwind“, „Eisen gegen Gischt“, „Die Kohleinseln II“
- [ ] „Nordwind“ zeigt „Lena Hartmann ist am Zug“, „Asynchron · 48 Stunden“, „Runde 9“, „noch 31 Std.“
- [ ] „Die Kohleinseln II“ zeigt statt Mini-Lagekarte eine gestrichelte Fläche mit Sanduhr, den Status „Wartet auf 2 Spieler“, keine Rundenzahl, zwei gestrichelte leere Kreise in der Teilnehmerreihe und den Button „Warteraum“
- [ ] Bei „Nordwind“ ist Lena Hartmann mit pulsierendem Amber-Ring markiert
- [ ] `onRemind` wird mit `('m-nordwind', 'lena')` aufgerufen
- [ ] Wird `remindedAt` danach auf `now` gesetzt, zeigt der Button „Erinnert“ mit Häkchen und ist deaktiviert

#### Fehlerfall: Erinnern gesperrt bzw. nicht verfügbar

**Erwartete Ergebnisse:**
- [ ] „Eisen gegen Gischt“ (`remindedAt: '2026-10-30T10:05:00Z'`, knapp 3 Std. her) zeigt „Erinnert“, der Button ist `disabled`, ein Klick ruft `onRemind` nicht auf
- [ ] Mit `remindedAt` genau 12 Std. oder länger vor `now` zeigt der Button wieder „Erinnern“ und ist aktiv
- [ ] Ist ein KI-Teilnehmer am Zug, gibt es keinen Erinnern-Button; der Status lautet „<Name> (KI) ist am Zug“
- [ ] Bei Live-Partien (`rules.mode: 'live'`) mit `othersTurn` gibt es keinen Erinnern-Button
- [ ] Bei wartenden Partien gibt es keinen Erinnern-Button

### Ablauf 3: Warteraum aus der Lobby öffnen

**Schritte:**
1. Bei „Die Kohleinseln II“ auf „Warteraum“ tippen.

**Erwartete Ergebnisse:**
- [ ] `onOpenWaitingRoom` wird mit `'m-kohle2'` aufgerufen

### Ablauf 4: Partie-Details ansehen

**Setup:** Beispieldaten.

**Schritte:**
1. Auf der Karte „Die Kohleinseln“ das Menü „Weitere Aktionen“ (⋮) öffnen.
2. „Partie-Details“ wählen.

**Erwartete Ergebnisse:**
- [ ] Das Menü zeigt „Partie-Details“ und „Aufgeben“ (rot)
- [ ] `onShowDetails` wird mit `'m-kohle'` aufgerufen; das Menü schließt sich
- [ ] Ein Dialog mit dem Titel „Die Kohleinseln“ öffnet sich
- [ ] Abschnitt „Regeln“: „Modus“ = „Asynchron“, „Frist pro Zug“ = „24 Stunden“, „Siegbedingung“ = „Hauptstädte erobern“, „Doppelte Fraktionen“ = „Nicht erlaubt“
- [ ] Abschnitt „Karte“: „Größe“ = „Mittel · 18×12“, „Landanteil“ = „45 %“, „Kartencode“ = „KOHLE-4417“
- [ ] Abschnitt „Spieler“: vier Zeilen mit Wappen, Name, Kurzname der Fraktion, Status und Zahl der „Städte“; Björn mit „(du)“; Admiral Kessler mit „Aurelia · KI Schwer · Im Spiel“ und „4 Städte“; Graf Ostrow mit „· KI Normal · Ausgeschieden“, „0 Städte“ und halbtransparent
- [ ] Bei einer Live-Partie lautet die Zeile „Zeitlimit“ statt „Frist pro Zug“
- [ ] „Schließen“ (X), Escape oder ein Klick auf den abgedunkelten Hintergrund schließen den Dialog

### Ablauf 5: Partie aufgeben

**Setup:** Beispieldaten.

**Schritte:**
1. Auf „Die Kohleinseln“ das Menü „Weitere Aktionen“ öffnen.
2. „Aufgeben“ wählen.
3. Im Dialog „Partie aufgeben?“ auf „Aufgeben“ tippen.

**Erwartete Ergebnisse:**
- [ ] Der Dialog „Partie aufgeben?“ zeigt: „Du verlässt **Die Kohleinseln** in Runde 14. Eine KI auf Stufe „Normal“ übernimmt deine Fraktion, damit die Partie für die anderen ausgeglichen bleibt. Die Partie zählt für dich als Niederlage.“
- [ ] Buttons „Weiterkämpfen“ und „Aufgeben“ (rot, mit Flaggen-Icon)
- [ ] Nach „Aufgeben“ wird `onSurrender` genau einmal mit `'m-kohle'` aufgerufen und der Dialog schließt sich

#### Fehlerfall: Abbrechen

**Erwartete Ergebnisse:**
- [ ] „Weiterkämpfen“, „Schließen“, Escape oder Klick auf den Hintergrund schließen den Dialog, ohne `onSurrender` aufzurufen
- [ ] Das Öffnen des Dialogs allein ruft `onSurrender` nicht auf
- [ ] Bei wartenden Partien („Die Kohleinseln II“) enthält das Menü nur „Partie-Details“, kein „Aufgeben“

### Ablauf 6: Einladungen annehmen und ablehnen

**Setup:** Beispieldaten (`inv-1` von Jonas Vogt, `inv-2` von Selin Arslan).

**Schritte:**
1. Abschnitt „Einladungen“ ansehen.
2. Bei „Inselhüpfen“ auf „Annehmen“ tippen.
3. Bei der zweiten Einladung auf „Ablehnen“ tippen.

**Erwartete Ergebnisse:**
- [ ] „Einladungen“ mit Zähler `2`
- [ ] Erste Einladung: „**Jonas Vogt** lädt dich ein · vor 19 Min.“, Name „Inselhüpfen“, Chips „Live · 2 Minuten“, „Klein“, „2/3 Plätze“, Nachricht „„Kurze Runde heute Abend?““
- [ ] Zweite Einladung: „Selin Arslan lädt dich ein · vor 2 Tagen“, keine Nachrichtenzeile (weil `message: null`), Chips „Asynchron · 48 Stunden“, „Riesig“, „4/6 Plätze“
- [ ] „Annehmen“ ruft `onAcceptInvitation('inv-1')` auf
- [ ] „Ablehnen“ ruft `onDeclineInvitation('inv-2')` auf
- [ ] Die Komponente entfernt die Einladung nicht selbst; erst wenn `invitations` ohne den Eintrag neu übergeben wird, verschwindet die Karte und der Zähler sinkt

### Ablauf 7: Offener Partie beitreten

**Schritte:**
1. Tab „Offene Partien“ (Standard-Tab) ansehen.
2. Bei „Anfänger willkommen“ auf „Beitreten“ tippen.

**Erwartete Ergebnisse:**
- [ ] Tab „Offene Partien“ mit Zähler `5` ist aktiv (`aria-selected="true"`), „Beendet“ zeigt Zähler `5`
- [ ] Eintrag zeigt „Anfänger willkommen“, „von Kalle Rauch“, Chips „Asynchron · 24 Stunden“, „Mittel“, „Hauptstädte erobern“
- [ ] Platzanzeige: 4 Kästchen, 2 gefüllt, 2 gestrichelt in Teal, mit `aria-label` „2 von 4 Plätzen belegt“
- [ ] Darunter die Wappen der freien Fraktionen (Eisenbund, Salzküste)
- [ ] `onJoinOpenMatch` wird mit `'open-1'` aufgerufen

### Ablauf 8: Beendete Partien ansehen

**Schritte:**
1. Tab „Beendet“ antippen.

**Erwartete Ergebnisse:**
- [ ] Der Tab wechselt ohne Callback; die Liste der offenen Partien wird ausgeblendet
- [ ] „Rußige Pfade“: Wappen Eisenbund, „Platz 1 von 3 · 48 Runden · vor 3 Tagen“, „Sieger: Björn“, Stempel „Sieg“ (Teal)
- [ ] „Gegen die Republik“: Stempel „Niederlage“ (Rot), „Sieger: Admiral Kessler (KI)“
- [ ] „Testlauf“: Stempel „Aufgegeben“ (Grau)
- [ ] Ältere Partien (über 7 Tage) zeigen ein Datum statt „vor … Tagen“, z. B. „11. Okt.“ bzw. „30. Sept.“ (Format `de-DE`, `day: numeric, month: short`)

### Ablauf 9: Push-Benachrichtigungen aktivieren

**Setup:** `pushPermission: 'default'`.

**Schritte:**
1. Lobby rendern.
2. „Aktivieren“ antippen.

**Erwartete Ergebnisse:**
- [ ] Banner (Amber) mit Glocken-Icon, „Benachrichtige mich, wenn ich am Zug bin“ und „Verpasse keine Frist, auch wenn die App geschlossen ist. E-Mail-Benachrichtigungen findest du unter Profil & Einstellungen.“
- [ ] Buttons „Aktivieren“ und „Später“
- [ ] „Aktivieren“ ruft `onEnablePush()` auf; das Banner bleibt sichtbar, bis `pushPermission` auf `'granted'` wechselt

#### Variante: Später

- [ ] „Später“ ruft `onDismissPushBanner()` auf und blendet das Banner sofort aus (lokaler Zustand)

#### Variante: Berechtigung blockiert

**Setup:** `pushPermission: 'denied'`.

- [ ] Banner (grau) mit durchgestrichener Glocke, „Benachrichtigungen sind im Browser blockiert“ und „Erlaube sie über das Schloss-Symbol in der Adressleiste. E-Mail-Benachrichtigungen findest du unter Profil & Einstellungen.“
- [ ] Kein „Aktivieren“-Button; einziger Button „Ausblenden“, der `onDismissPushBanner()` aufruft und das Banner ausblendet

#### Variante: erlaubt

- [ ] Mit `pushPermission: 'granted'` wird kein Banner gerendert

### Ablauf 10: Im Warteraum bereit melden und Partie starten

**Szenario:** Der Ersteller wartet im Warteraum auf seine Mitspieler und startet die Partie.

#### Erfolgsfall

**Setup:** `Warteraum` mit `room` aus den Beispieldaten, aber alle `player`-Plätze `status: 'ready'` (Jonas Vogt bereit).

**Schritte:**
1. Warteraum rendern.
2. Checkbox „2 freie Plätze mit KI auffüllen“ prüfen (standardmäßig angehakt, aus `fillEmptyWithAI: true`).
3. „Starten“ antippen.

**Erwartete Ergebnisse:**
- [ ] Hinweis unter der Aktionsleiste: „Alle sind bereit. Die Partie kann beginnen.“
- [ ] „Starten“ ist aktiv
- [ ] `onStartMatch` wird mit `true` aufgerufen
- [ ] Wird die Checkbox vorher abgewählt, lautet der Hinweis „Freie Plätze bleiben leer, die Partie startet mit 3 Spielern.“ und `onStartMatch` wird mit `false` aufgerufen

#### Fehlerfall: Start gesperrt

**Setup:** Beispieldaten unverändert (Jonas Vogt `status: 'joined'`).

**Erwartete Ergebnisse:**
- [ ] Kopfzeile: „Warteraum“, Titel „Die Kohleinseln II“, „3 von 5 Plätzen besetzt · 2 bereit“
- [ ] Jonas Vogt hat die Status-Pille „Nicht bereit“ (Amber, Sanduhr)
- [ ] „Starten“ ist `disabled`, `title` und Hinweistext lauten „Warte auf Jonas Vogt“
- [ ] Ein Klick auf „Starten“ ruft `onStartMatch` nicht auf
- [ ] Meldet sich der Ersteller selbst ab („Bereit“ → „Bereit melden“), lautet der Hinweis „Warte auf Björn, Jonas Vogt“
- [ ] Eingeladene (`invited`) und offene Plätze blockieren den Start nicht

#### Bereit-Schalter

- [ ] Eigener Platz bereit: Button „Bereit“ (Teal gefüllt), `aria-pressed="true"`
- [ ] Antippen: Button wechselt zu „Bereit melden“, `aria-pressed="false"`, die eigene Status-Pille wechselt zu „Nicht bereit“, der Zähler zu „1 bereit“; `onToggleReady(false)` wird aufgerufen
- [ ] Erneutes Antippen ruft `onToggleReady(true)` auf

#### Nicht-Ersteller

**Setup:** `room.isHost: false`, eigener Platz `kind: 'player'`.

- [ ] Kein „Starten“-Button, keine KI-Checkbox, kein Hinweistext; „Bereit melden“ und „Verlassen“ sind vorhanden

### Ablauf 11: Einladungslink teilen

**Schritte:**
1. Im Kasten „Einladungslink“ auf „Kopieren“ tippen.
2. Auf „Teilen“ tippen.

**Erwartete Ergebnisse:**
- [ ] Der Kasten zeigt „Wer den Link öffnet, besetzt einen freien Platz.“ und den Link `https://dominion-of-steam.app/einladung/K7Q-2XM-H9P`
- [ ] „Kopieren“ schreibt den Link in die Zwischenablage (`navigator.clipboard.writeText`) und ruft `onCopyInviteLink('https://dominion-of-steam.app/einladung/K7Q-2XM-H9P')` auf
- [ ] Fehlt die Clipboard-API oder schlägt sie fehl, wird trotzdem `onCopyInviteLink` aufgerufen und es gibt keinen Absturz
- [ ] „Teilen“ ruft `onShareInviteLink` mit demselben Link auf

### Ablauf 12: Warteraum verlassen bzw. zur Lobby zurück

**Schritte:**
1. „Verlassen“ antippen.
2. Im Dialog „Warteraum verlassen?“ auf „Verlassen“ tippen.

**Erwartete Ergebnisse:**
- [ ] Als Ersteller lautet der Text: „Du hast „Die Kohleinseln II“ erstellt. Wenn du gehst, wird die Partie aufgelöst und alle Mitspieler werden benachrichtigt.“
- [ ] Als Nicht-Ersteller: „Du gibst deinen Platz in „Die Kohleinseln II“ frei.“
- [ ] Bestätigen ruft `onLeave()` auf und schließt den Dialog
- [ ] „Bleiben“, „Schließen“, Escape oder Klick auf den Hintergrund schließen den Dialog ohne `onLeave`
- [ ] Der Link „Lobby“ oben ruft `onBack()` auf, ohne Bestätigung und ohne `onLeave`

---

## Leere Zustände

### Primärer leerer Zustand: nirgends am Zug

**Setup:** `matches` ohne Einträge mit `status: 'yourTurn'`.

- [ ] Untertitel: „Björn, an allen Fronten ist es ruhig.“
- [ ] „Du bist am Zug“ mit Zähler `0`
- [ ] Gestrichelter Kasten mit „Du bist nirgends am Zug“ und „Zeit für eine neue Partie?“
- [ ] Button „Neue Partie“ (Amber) ruft `onNewMatch()` auf

### Weitere leere Zustände

- [ ] `matches` ohne `othersTurn`/`waitingForPlayers`: „Weitere Partien“ mit `0` und „Keine weiteren laufenden Partien.“
- [ ] `invitations: []`: „Einladungen“ mit `0` und „Keine offenen Einladungen.“
- [ ] `openMatches: []`: Tab „Offene Partien 0“ und „Gerade sucht niemand Mitspieler. Erstelle selbst eine offene Partie.“ (ohne Button)
- [ ] `finishedMatches: []`: Tab „Beendet 0“ und „Noch keine beendeten Partien.“
- [ ] Alles leer (neuer Spieler): alle vier Leertexte gleichzeitig, keine Fehler; „Neue Partie“ in Kopfzeile und Leerzustand funktionieren beide
- [ ] Warteraum ohne freie Plätze (keine `invited`/`open`-Sitze): keine KI-Checkbox; bei allen bereit „Alle sind bereit. Die Partie kann beginnen.“

### Übergänge

- [ ] Leer → befüllt: Kommt eine `yourTurn`-Partie hinzu, verschwindet der Leerzustand und die Karte erscheint; der Untertitel wechselt zu „Björn, 1 Front wartet auf deinen Befehl.“ (Singular)
- [ ] Befüllt → leer: Wird die letzte Einladung entfernt, erscheint „Keine offenen Einladungen.“

---

## Komponenten-Interaktionen

### Lobby

- [ ] Rendert Push-Banner (abhängig von `pushPermission`), Kopfzeile, „Du bist am Zug“, „Weitere Partien“, „Einladungen“ und die Tabs
- [ ] „Neue Partie“ in der Kopfzeile ruft `onNewMatch()` auf
- [ ] Tabwechsel ist rein lokal; beim ersten Rendern ist „Offene Partien“ aktiv
- [ ] Partien werden nur nach `status` aufgeteilt; `yourTurn` nach `turnDeadline` aufsteigend sortiert, Partien ohne Frist zuletzt; die Reihenfolge in „Weitere Partien“ entspricht der Eingabe

### MatchCard

- [ ] Variante `feature`: Mini-Lagekarte als Kopfbild, „Runde N“, Partiename, Moduszeile, Frist-Stempel (nur bei Frist), Teilnehmerreihe, „Weiterspielen“, Menü
- [ ] Variante `compact`: Vorschaubild, Name, Statuszeile in Teal, Modus/Runde/Frist, Teilnehmer, je nach Status „Warteraum“ oder „Erinnern“/„Erinnert“, Menü
- [ ] Menü „Weitere Aktionen“ öffnet/schließt per Klick (`aria-expanded` wechselt) und schließt bei Klick außerhalb sowie mit Escape
- [ ] KI-Teilnehmer tragen das Abzeichen „KI“; ausgeschiedene/aufgegebene Teilnehmer sind ausgegraut; der `title` lautet z. B. „Graf Ostrow · <Kurzname> · ausgeschieden“
- [ ] Der eigene Teilnehmer bekommt nie die Am-Zug-Markierung

### MatchDetailsSheet / SurrenderSheet / Sheet

- [ ] Escape schließt jedes Sheet
- [ ] Beim Öffnen liegt der Fokus im Dialog (erstes Formularfeld, sonst der erste Button nach „Schließen“, z. B. „Weiterkämpfen“ im Aufgeben-Dialog)
- [ ] Tab vom letzten Element springt zum ersten (Schließen-Button), Umschalt+Tab vom ersten zum letzten; der Fokus verlässt den Dialog nicht
- [ ] Nach dem Schließen liegt der Fokus wieder auf dem auslösenden Element (z. B. „Verlassen“ im Warteraum). Bei „Partie-Details“ und „Aufgeben“ aus dem Partie-Menü kehrt er auf den Menü-Button „Weitere Aktionen“ zurück.
- [ ] Klick in den Dialog schließt ihn nicht, Klick auf den Hintergrund schon
- [ ] Der Dialog-Titel steht als `aria-label` am `role="dialog"`

### Warteraum

- [ ] Platzliste nummeriert 1–5; Ersteller mit Krone (`aria-label="Ersteller"`), eigener Platz mit „(du)“
- [ ] Status-Pillen: „Bereit“ (Teal), „Nicht bereit“ (Amber), „KI · Schwer“ (Grau), „Eingeladen“, „Offen“
- [ ] Eingeladener Platz: halbtransparenter Avatar, „Hat noch nicht zugesagt“; offener Platz: „Offener Platz“, „Jeder aus der Lobby kann beitreten“
- [ ] Regeln: „Modus“, „Frist pro Zug“ (bzw. „Zeitlimit“), „Siegbedingung“, „Karte“ = „Mittel · 18×12 · 45 % Land“, „Kartencode“ = „KOHLE-5530“
- [ ] Bei asynchronen Partien: „Nach dem Start bekommt jeder Bescheid, wenn er am Zug ist.“; bei Live-Partien nicht
- [ ] Bei nur einem freien Platz lautet die Checkbox „1 freien Platz mit KI auffüllen“

---

## Grenzfälle

- [ ] Sehr langer Einladungsname („Der lange Winter der Nordmark und das Erbe der Salzküste“) wird auf zwei Zeilen begrenzt (`line-clamp-2`), Buttons bleiben sichtbar
- [ ] Lange Partienamen auf den Karten werden einzeilig abgeschnitten (`truncate`)
- [ ] Teilnehmer „KI für Selin Arslan“ zeigt die Initialen „KS“ (das Wort „für“ wird übersprungen); Selin Arslan selbst (`surrendered`) ist ausgegraut
- [ ] Offene Partie „Sechs Mächte“ mit `availableFactionIds: []` zeigt „Alle Fraktionen vergeben · doppelte erlaubt“
- [ ] Offene Partie „Feierabendpartie“ zeigt „Live · Ohne Limit“
- [ ] Frist unter 1 Stunde: „noch 25 Min.“; Frist zwischen 1 und 6 Stunden mit Minuten: „noch 1 Std. 40 Min.“; ab 6 Stunden nur Stunden: „noch 10 Std.“ („Eisen gegen Gischt“)
- [ ] Frist abgelaufen: „Frist abgelaufen“
- [ ] Einladung vor weniger als 1 Minute: „vor 1 Min.“; vor 1 Tag: „gestern“
- [ ] Faction-Wappen ohne ladbares Bild (`emblemUrl: null` oder Fehler): SVG-Schild in Fraktionsfarbe mit Anfangsbuchstaben des Kurznamens
- [ ] Avatar ohne Bild: Initialen mit Ring in Fraktionsfarbe
- [ ] `participants` mit einer `factionId`, die nicht in `factions` steht: Mini-Lagekarte färbt das Gebiet grau (`#a8a29e`), kein Absturz
- [ ] Leeres `miniMap` bei einer laufenden Partie: kein Kartenbild, kein Absturz
- [ ] Warteraum ohne eigenen `player`-Platz (z. B. reiner Zuschauer-Fall): kein Bereit-Button

---

## Barrierefreiheit

- [ ] Alle Aktionen sind echte `<button>`-Elemente und per Tab/Enter/Leertaste erreichbar
- [ ] Menü-Button hat `aria-label="Weitere Aktionen"`, `aria-haspopup="menu"` und `aria-expanded`; Einträge haben `role="menuitem"`
- [ ] Tabs haben `role="tablist"`/`role="tab"` und `aria-selected`
- [ ] Bereiche der Lobby haben `aria-label` („Du bist am Zug“, „Weitere Partien“, „Einladungen“, „Offene und beendete Partien“); der Warteraum „Plätze“
- [ ] Dialoge: `role="dialog"`, `aria-modal="true"`, `aria-label` = Titel; Schließen-Button `aria-label="Schließen"`; Escape schließt
- [ ] „Verlassen“ hat `aria-label="Verlassen"` (Text auf dem Smartphone ausgeblendet)
- [ ] Bereit-Schalter nutzt `aria-pressed`
- [ ] KI-Checkbox ist über ihr `<label>` beschriftet
- [ ] Platzanzeige offener Partien hat `aria-label` „X von Y Plätzen belegt“
- [ ] Wappen haben `aria-label`/`alt` „Wappen <Fraktionsname>“; Mini-Lagekarte ist `aria-hidden`
- [ ] Gesperrter Start-Button ist `disabled`; der Grund steht zusätzlich als sichtbarer Text („Warte auf …“)
- [ ] Touch-Ziele sind mindestens 44 px hoch
- [ ] Dialoge setzen den Fokus beim Öffnen in den Dialog, halten Tab/Umschalt+Tab darin und geben ihn beim Schließen an das auslösende Element zurück
- [ ] Escape schließt das Aktionsmenü „Weitere Aktionen“
- [ ] Hinweis für die Umsetzung (nicht in den Komponenten enthalten, aber zu prüfen): Tabs unterstützen keine Pfeiltasten-Navigation

---

## Beispiel-Testdaten

```typescript
import type { LobbyProps, Match, WaitingRoom, Faction } from './types'

const factions: Faction[] = [
  { id: 'eisenbund', name: 'Eisenbund von Valdrin', shortName: 'Eisenbund', color: 'amber', emblemUrl: null },
  { id: 'nordmark', name: 'Nordmark-Kollektiv', shortName: 'Nordmark', color: 'sky', emblemUrl: null },
  { id: 'aurelia', name: 'Aurelische Republik', shortName: 'Aurelia', color: 'rose', emblemUrl: null },
]

// Befüllt: eigene Partie mit Frist-Warnung + Partie, in der ein Mensch am Zug ist
const urgentMatch: Match = {
  id: 'm-salz',
  name: 'Salz und Schwefel',
  status: 'yourTurn',
  round: 31,
  turnDeadline: '2026-10-30T14:40:00Z', // 1 Std. 40 Min. nach now
  currentParticipantId: 'you',
  remindedAt: null,
  isHost: false,
  participants: [
    { id: 'you', name: 'Björn', avatarUrl: null, isYou: true, isAI: false, aiDifficulty: null, factionId: 'eisenbund', status: 'active', cityCount: 5 },
    { id: 'tobias', name: 'Tobias Brenner', avatarUrl: null, isYou: false, isAI: false, aiDifficulty: null, factionId: 'aurelia', status: 'active', cityCount: 4 },
  ],
  rules: { mode: 'async', turnLimitLabel: '12 Stunden', victoryCondition: 'Alle Gegner besiegen', allowDuplicateFactions: false },
  map: { sizeLabel: 'Klein', width: 14, height: 10, landShare: 50, seed: 'SALZ-0031' },
  miniMap: ['~~~~~~', '~00.1~', '~0011~', '~~~~~~'],
}

const othersTurnMatch: Match = {
  ...urgentMatch,
  id: 'm-nordwind',
  name: 'Nordwind',
  status: 'othersTurn',
  round: 9,
  turnDeadline: '2026-10-31T20:15:00Z',
  currentParticipantId: 'tobias',
  remindedAt: null, // "Erinnern" aktiv; '2026-10-30T10:05:00Z' → "Erinnert", gesperrt
}

export const populatedLobby: LobbyProps = {
  now: '2026-10-30T13:00:00Z',
  you: { id: 'you', name: 'Björn', avatarUrl: null },
  pushPermission: 'default',
  deadlineWarningHours: 3,
  factions,
  matches: [urgentMatch, othersTurnMatch],
  invitations: [
    {
      id: 'inv-1',
      matchName: 'Inselhüpfen',
      from: { id: 'jonas', name: 'Jonas Vogt', avatarUrl: null },
      mode: 'live',
      turnLimitLabel: '2 Minuten',
      mapSizeLabel: 'Klein',
      seatsTaken: 2,
      seatsTotal: 3,
      sentAt: '2026-10-30T12:41:00Z',
      message: 'Kurze Runde heute Abend?',
    },
  ],
  openMatches: [
    {
      id: 'open-3',
      name: 'Sechs Mächte',
      host: 'Ole Brandstetter',
      mode: 'async',
      turnLimitLabel: '48 Stunden',
      mapSizeLabel: 'Riesig',
      victoryCondition: 'Rundenlimit · 150 Runden',
      seatsTaken: 5,
      seatsTotal: 6,
      availableFactionIds: [],
    },
  ],
  finishedMatches: [
    { id: 'fin-1', name: 'Rußige Pfade', endedAt: '2026-10-27T21:10:00Z', result: 'victory', placement: 1, playerCount: 3, rounds: 48, winner: 'Björn', factionId: 'eisenbund' },
  ],
}

// Leer: neuer Spieler, Push bereits blockiert
export const emptyLobby: LobbyProps = {
  now: '2026-10-30T13:00:00Z',
  you: { id: 'you', name: 'Björn', avatarUrl: null },
  pushPermission: 'denied',
  deadlineWarningHours: 3,
  factions,
  matches: [],
  invitations: [],
  openMatches: [],
  finishedMatches: [],
}

// Warteraum: Start gesperrt, weil Jonas Vogt noch nicht bereit ist
export const blockedWaitingRoom: WaitingRoom = {
  matchId: 'm-kohle2',
  matchName: 'Die Kohleinseln II',
  isHost: true,
  inviteLink: 'https://dominion-of-steam.app/einladung/K7Q-2XM-H9P',
  rules: { mode: 'async', turnLimitLabel: '24 Stunden', victoryCondition: 'Hauptstädte erobern', allowDuplicateFactions: false },
  map: { sizeLabel: 'Mittel', width: 18, height: 12, landShare: 45, seed: 'KOHLE-5530' },
  fillEmptyWithAI: true,
  seats: [
    { kind: 'player', status: 'ready', name: 'Björn', avatarUrl: null, isYou: true, isHost: true, factionId: 'eisenbund' },
    { kind: 'player', status: 'joined', name: 'Jonas Vogt', avatarUrl: null, isYou: false, isHost: false, factionId: 'nordmark' },
    { kind: 'ai', status: 'ready', aiDifficulty: 'hard', name: 'Admiral Kessler', avatarUrl: null, isYou: false, isHost: false, factionId: 'aurelia' },
    { kind: 'invited', status: 'pending', name: 'Lena Hartmann', avatarUrl: null, isYou: false, isHost: false, factionId: null },
    { kind: 'open', status: 'pending', name: null, avatarUrl: null, isYou: false, isHost: false, factionId: null },
  ],
}
```
