# Meilenstein 4: Partie-Setup & KI-Gegner

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
