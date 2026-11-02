# Meilenstein 6: Spielerprofil & Einstellungen

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
