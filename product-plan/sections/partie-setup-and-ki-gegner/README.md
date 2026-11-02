# Partie-Setup & KI-Gegner

## Überblick

Das Partie-Setup führt den Spieler in einem Schritt-Assistenten von „Neue Partie“ bis zum Start: Regeln, eigene Fraktion, Gegner und Mitspieler, Karte und eine abschließende Übersicht. Der Spieler entscheidet zuerst, wen er spielt, und stellt danach seine Gegner auf. Menschliche Mitspieler kommen über Einladungslink, Freundesliste oder offene Plätze dazu. Freie Plätze können mit KI-Persönlichkeiten in eigener Schwierigkeit besetzt oder beim Start automatisch mit KI aufgefüllt werden.

## Abläufe

- **Assistent starten:** „Neue Partie“ in der Navigation öffnet Schritt 1 von 5. Der Assistent startet mit dem übergebenen `draft` (Vorgabewerte für Regeln und Karte, keine Fraktion, neben dem eigenen ein freier Platz). Vor- und Zurückgehen ist jederzeit möglich, bereits besuchte Schritte sind über die Fortschrittsleiste direkt anspringbar, Eingaben bleiben erhalten.
- **Schritt 1 – Modus & Regeln:** Name der Partie, Modus „Asynchron“ (Frist pro Zug: 12 / 24 / 48 Stunden) oder „Live“ (Zeitlimit pro Zug: Aus / 2 / 5 Minuten), Siegbedingung (bei „Rundenlimit“ zusätzlich die Rundenzahl 50 / 100 / 150) und der Schalter „Doppelte Fraktionen erlauben“.
- **Schritt 2 – Deine Fraktion:** Auswahl aus Fraktionskarten (Wappen, Name, Leitspruch, Eigenheit). Fraktionen, die bereits ein KI-Gegner führt, werden markiert und bei verbotenen Doppelungen gesperrt.
- **Schritt 3 – Gegner & Mitspieler:** 2 bis 6 Plätze, Platz 1 ist der Spieler selbst. Jeder weitere Platz wird mit „Freund“, „Einladung“, „Offen“ oder „KI“ besetzt. KI-Plätze bekommen eine Schwierigkeit (Leicht / Normal / Schwer). Einladungslink kopieren oder teilen. Schalter „Freie Plätze beim Start mit KI auffüllen“.
- **KI-Gegner wählen:** Dialog bzw. Bottom-Sheet mit Persönlichkeitskarten (Porträt, Name, Titel, Fraktion, Spielweise, Beschreibung). Die Fraktion ergibt sich aus der Persönlichkeit. Bereits eingesetzte Persönlichkeiten und – ohne erlaubte Doppelungen – Persönlichkeiten vergebener Fraktionen sind ausgegraut. Ohne Persönlichkeiten steht dort „Es sind keine KI-Gegner verfügbar.“
- **Freunde einladen:** Dialog „Freund einladen“ mit Suchfeld, Avatar, Name und Online-Status. Hat der Spieler keine Freunde, steht dort „Du hast noch keine Freunde. Lade Mitspieler stattdessen über den Einladungslink ein.“
- **Schritt 4 – Karte:** Kartengröße (Klein, Mittel, Groß, Riesig mit Feldanzahl und empfohlener Spielerzahl), Landanteil als Schieberegler (Inselwelt bis Kontinente), neutrale Städte, Gebirge & Wald und Kartencode (Seed) mit „Neu würfeln“ und „Kopieren“. Ein leerer Kartencode sperrt „Weiter“ mit „Gib einen Kartencode ein oder würfle einen neuen.“
- **Schritt 5 – Übersicht:** Alle Einstellungen gruppiert mit „Ändern“-Links, Warnhinweise in Amber, „Partie erstellen“ übergibt den fertigen Entwurf.
- **Abbrechen:** Jederzeit möglich. Wurde der Entwurf verändert, fragt der Dialog „Einrichtung abbrechen?“ nach.

## Gestaltungsentscheidungen

- **Kopfbereich:** Kicker „Mobilmachung“ (IBM Plex Mono, Teal, mit Linie) über der großen Überschrift „Neue Partie“ (Big Shoulders Display, Versalien). Rechts ein schräg gestellter, doppelt umrandeter Amber-Stempel mit dem Partienamen bzw. „Ohne Namen“.
- **Fortschrittsleiste:** Auf Desktop (`md`) fünf nummerierte Schritte mit farbiger Oberkante – aktueller Schritt Amber, erledigte Schritte Teal mit Häkchen, offene Schritte Stone. Auf dem Smartphone kompakt: Schrittname, „Schritt N von 5“ und fünf Balkensegmente.
- **Fixierte Fußleiste** mit doppelter Oberkante: „Abbrechen“ links (auf dem Smartphone nur als X-Symbol), rechts „Zurück“ (Rahmen-Button) und der Amber-Verlaufsbutton „Weiter“ bzw. „Partie erstellen“ (mit Schwert-Symbol). Der Hinweis, warum „Weiter“ gesperrt ist, steht in Amber in der Fußleiste. Auf dem Smartphone sitzt die Leiste oberhalb der Tab-Leiste der Shell (`bottom: calc(4rem + env(safe-area-inset-bottom))`).
- **Eingaben ohne Dropdowns:** große Optionskarten (`OptionCard`) für Modus und Siegbedingung, Segment-Buttons (`Segmented`) für Zugzeiten, Rundenzahl, Schwierigkeit, neutrale Städte und Gelände, Schalter (`Toggle`) für Ja/Nein-Optionen. Ausgewählte Optionen: Amber-Rahmen und -Füllung; ausgewählte Segmente: Stone-900 mit Amber-Schrift (dunkel: Amber mit dunkler Schrift).
- **Formularblöcke** (`Field`) mit gestempelter Überschrift in Big Shoulders Display und gestrichelten Trennlinien.
- **Fraktionskarten** mit Farbverlauf in der Fraktionsfarbe (`FACTION_HEX`), überlappendem Wappen, Leitspruch kursiv und Eigenheit; gesperrte Karten sind halbtransparent und entsättigt.
- **Platzkarten** mit nummeriertem Plakettenkreis; leere Plätze haben einen gestrichelten Rahmen und vier Auswahl-Buttons, Einladung/Offen werden mit einem gestrichelten Teal-Kreis statt Avatar dargestellt.
- **Kartengrößen** zeigen eine maßstabsgetreue Grundfläche; die empfohlene Spielerzahl wird Amber, wenn mehr Plätze gewählt sind als empfohlen.
- **Landanteil-Regler** mit Teal-zu-Sand-Verlauf, Endbeschriftungen „Inselwelt“ (Teal) und „Kontinente“ (Amber), Prozentwert in IBM Plex Mono.
- **Kartencode und Einladungslink** in IBM Plex Mono.
- **Dialoge** (`Sheet`): auf dem Desktop zentrierter Dialog, auf dem Smartphone Bottom-Sheet mit Griff; Kopf mit doppelter Unterkante. Beim Öffnen springt der Fokus in den Dialog (erstes Formularfeld, sonst der erste Button nach „Schließen“), Tab und Umschalt+Tab bleiben im Dialog, beim Schließen kehrt der Fokus zum auslösenden Element zurück; Escape schließt.
- **Platzhalter für Bilder:** `FactionEmblem` zeigt ein SVG-Schild in Fraktionsfarbe mit Anfangsbuchstaben, solange kein Wappen geladen ist; `Avatar` zeigt Initialen (z. B. solange ein KI-Porträt `/art/portraits/<id>.webp` fehlt).
- **Schriften:** Big Shoulders Display (Überschriften, Buttons), Barlow (Fließtext), IBM Plex Mono (Zahlen, Codes). **Farben:** Amber (primär), Teal (sekundär), Stone (neutral), Rose nur für „Verwerfen“. Heller und dunkler Modus über `dark:`-Varianten.

## Datenformen

Interfaces aus `types.ts`:

| Interface | Bedeutung | Globale Entität (`product/data-shape/data-shape.md`) |
|---|---|---|
| `Player` | Der angemeldete Spieler (immer Platz 1) | Player |
| `Faction` | Spielbare Fraktion mit Name, Kurzname, Farbe, Leitspruch, Eigenheit, Wappen | Faction |
| `AiPersonality` | KI-Persönlichkeit mit fester `factionId`, Titel, Porträt, Spielweise | AiPersonality |
| `Friend` | Freund mit Online-Status (`online`, `inGame`, `offline` + `lastSeen`) | Friendship (+ Player) |
| `MapSizeOption`, `SetupOptions` | Wählbare Werte (Kartengrößen, Landanteil, Stufen, Zugzeiten, Siegbedingungen, Rundenlimits) | Konfiguration, keine eigene Entität |
| `Seat` | Ein Platz: `you`, `friend`, `invite`, `open`, `ai` (mit Schwierigkeit) oder `empty` | Participant bzw. Invitation (für `friend`) |
| `MapSettings` | Größe, Landanteil, neutrale Städte, Gelände, Kartencode | Map |
| `MatchDraft` | Der gesamte Entwurf, den „Partie erstellen“ übergibt | Match (+ Participant, Map, Invitation) |

Beziehungen: Eine `AiPersonality` gehört fest zu einer `Faction`. Ein `Seat` verweist je nach Art auf einen `Friend` (`friendId`) oder eine `AiPersonality` (`personalityId`). `draft.factionId` ist die Fraktion des Spielers, KI-Plätze übernehmen die Fraktion ihrer Persönlichkeit. `draft.map.size` verweist auf `options.mapSizes`.

## Visuelle Referenz

- `screenshot.png` – Schritt 1 „Modus & Regeln“ auf dem Desktop mit Beispieldaten (Partie „Die Kohleinseln II“, Asynchron, 24 Stunden, „Hauptstädte erobern“).

## Enthaltene Komponenten

Exportiert über `components/index.ts`:

- `PartieSetup` – Hauptkomponente: Assistent mit Kopf, Fortschrittsleiste, Schrittinhalt, Fußleiste, KI-/Freundesauswahl und Abbruch-Bestätigung; hält den Entwurf als lokalen State.
- `StepRules` – Schritt 1: Name, Modus, Zugzeit, Siegbedingung, Rundenzahl, doppelte Fraktionen.
- `StepFaction` – Schritt 2: Fraktionskarten als Radiogruppe mit KI-Markierung und Sperre.
- `StepPlayers` – Schritt 3: Anzahl Plätze, Platzkarten, Einladungslink, Schalter zum Auffüllen mit KI.
- `StepMap` – Schritt 4: Kartengröße, Landanteil, neutrale Städte, Gebirge & Wald, Kartencode.
- `StepSummary` – Schritt 5: gruppierte Übersicht mit „Ändern“-Links und Warnhinweisen.
- `AiPicker` – Dialog „KI-Gegner wählen“ mit Persönlichkeitskarten.
- `FriendPicker` – Dialog „Freund einladen“ mit Suche und Online-Status.
- `Avatar`, `FactionEmblem`, `Field`, `OptionCard`, `Segmented`, `Sheet`, `Toggle` – UI-Bausteine (`ui.tsx`).
- `setup.ts` – Konstanten und Regeln: `STEPS`, `STEP`, `FACTION_HEX`, `DIFFICULTY_LABEL`, `MIN_SEATS`/`MAX_SEATS`, `resizeSeats`, `aiFactions`, `stepBlocker`, `summaryWarnings`, `randomSeed`.

## Callback-Props

`PartieSetupProps`:

| Callback | Ausgelöst wenn |
|---|---|
| `onRandomizeSeed(): string` | Der Spieler in Schritt 4 auf „Neu würfeln“ tippt. Der zurückgegebene String wird als neuer Kartencode gesetzt; fehlt der Callback, erzeugt `randomSeed()` lokal einen Code (z. B. `KESSEL-4821`). |
| `onCopyInviteLink(link)` | Der Spieler in Schritt 3 beim Einladungslink auf „Kopieren“ tippt (die Komponente schreibt den Link zusätzlich selbst per `navigator.clipboard` in die Zwischenablage). |
| `onShareInviteLink(link)` | Der Spieler in Schritt 3 auf „Teilen“ tippt; der Callback soll das Teilen-Menü des Geräts öffnen. |
| `onCreateMatch(draft)` | Der Spieler in Schritt 5 auf „Partie erstellen“ tippt und kein Schritt blockiert; übergibt den vollständigen `MatchDraft`. |
| `onCancel()` | Der Spieler „Abbrechen“ wählt und der Entwurf unverändert ist, oder er im Dialog „Einrichtung abbrechen?“ auf „Verwerfen“ tippt. |
