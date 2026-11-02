# Spielerprofil & Einstellungen

## Überblick

Dieser Bereich besteht aus zwei Ansichten, die über das Benutzermenü der Shell („Profil“ und „Einstellungen“) erreichbar sind. Das **Profil** zeigt die Bilanz des Spielers (Statistiken insgesamt und je Fraktion) und seinen Partieverlauf und erlaubt, Anzeigename und Avatar zu ändern. Die **Einstellungen** bündeln Benachrichtigungen, Darstellung, Ton, Steuerung und Konto in Rubriken. Jede Einstellungsänderung wird sofort gespeichert und kurz mit „Gespeichert“ bestätigt.

Nicht enthalten: Freundesverwaltung, Erfolge bzw. Abzeichen, öffentliche Profile anderer Spieler, Sprachwahl.

## Abläufe

- **Profil öffnen:** Kopfbereich („Dienstakte“) mit Avatar, Anzeigename, „Mitglied seit <Monat Jahr>“ und „Lieblingsfraktion“ samt Wappen; darunter die Rubrik „Bilanz“ mit sechs Kennzahlen (Partien, Siege, Siegquote, Städte erobert, Einheiten gebaut, Längste Partie in Runden).
- **Statistik je Fraktion:** Rubrik „Nach Fraktion“ mit einem Balken je Fraktion (Partien gesamt hell, Siege kräftig in Fraktionsfarbe) und Text „<n> Partien · <q> % Siege“. Nie gespielte Fraktionen zeigen „Noch nicht gespielt“.
- **Partieverlauf:** Liste beendeter Partien mit Ergebnis-Stempel (Sieg / Niederlage / Aufgegeben), Platz, Runden, Datum und Mitspielern. Filter nach Ergebnis (Segment-Buttons) und Fraktion (Auswahl), „Mehr anzeigen“ lädt ältere Partien nach (ausgeblendet, solange die gefilterte Liste leer ist). Ein neuer Spieler ohne beendete Partie sieht „Noch keine Partie beendet“; findet nur der Filter nichts, erscheint „Keine Partien gefunden“ mit „Filter zurücksetzen“.
- **Profil bearbeiten:** „Profil bearbeiten“ öffnet einen Dialog mit Anzeigename (3 bis 24 Zeichen), „Bild hochladen“ und – falls ein Avatar existiert – „Bild entfernen“. Ohne Avatar werden Initialen gezeigt.
- **Einstellungen öffnen:** Rubriken Benachrichtigungen, Darstellung, Ton, Steuerung, Konto. Desktop: Navigation links, Inhalt rechts. Smartphone: Rubrikenliste, die in die Rubrik führt („Alle Rubriken“ führt zurück).
- **Benachrichtigungen:** Tabelle mit Push- und E-Mail-Schalter für „Du bist am Zug“, „Frist läuft bald ab“, „Einladung erhalten“, „Partie beendet“; E-Mail-Verzögerung „Sofort / 1 Std. / 6 Std. / 24 Std.“; Hinweis mit „Erlauben“, solange Push im Browser nicht erlaubt ist.
- **Darstellung:** Farbschema (Hell, Dunkel, System), Animationen reduzieren, Kampfanimationen, Gegnerzüge automatisch abspielen.
- **Ton:** Stumm-Schalter sowie Regler für Gesamtlautstärke, Effekte, Musik und Umgebung (in Prozent). Stumm deaktiviert alle Regler.
- **Steuerung:** Rechte Maustaste (Abbrechen / Kontextmenü), Nachfrage beim Zugende, Einheiten ziehen, Zoom-Empfindlichkeit.
- **Konto:** E-Mail-Adresse und Passwort jeweils über „Ändern“ in einem Dialog (aktuelles Passwort zur Bestätigung); „Abmelden“ und „Auf allen Geräten abmelden“.
- **Konto löschen:** Gefahrenzone am Ende der Rubrik Konto. Zwei Schritte: Dialog „Konto löschen?“ mit Erklärung → „Weiter“ → Dialog „Endgültig löschen“, in dem der Anzeigename exakt eingegeben werden muss, bevor „Konto löschen“ freigegeben wird.

## Gestaltungsentscheidungen

- **Dossier-Kopf im Profil:** Der Kopfbereich ist als „Dienstakte“ gestaltet: Verlauf von der dunklen Tönung der Lieblingsfraktion (`FACTION_HEX[color].deep`) nach Stone-900, darüber feine diagonale Schraffur. Der Avatar-Ring nutzt die Grundfarbe der Lieblingsfraktion; ohne Lieblingsfraktion wird neutrales Stone verwendet.
- **Schriften:** Big Shoulders Display (Überschriften, Namen, Stempel, alles in Versalien), Barlow (Fließtext), IBM Plex Mono (Kennzahlen, Prozentwerte, Kicker „Dienstakte“ / „Maschinenraum“).
- **Farben:** Amber für Primäraktionen (Speichern, Erlauben, Filter zurücksetzen) und aktive Schalter/Regler; Teal für positive Werte (Siegquote-Balken, Stempel „Sieg“, „Gespeichert“-Hinweis, Hover); Rose für Niederlage und Gefahrenzone; Stone für Neutrales und „Aufgegeben“.
- **Ergebnis-Stempel:** Doppelt umrandete, um −6° gedrehte Stempel in Big Shoulders Display (Sieg Teal, Niederlage Rot, Aufgegeben Grau).
- **Rubriken-Überschriften:** doppelte Unterstreichung (`border-double`) wie in den übrigen Bereichen.
- **Fraktionsbalken:** Gesamtbalken in Fraktionsfarbe mit 33 % Deckkraft, relativ zur meistgespielten Fraktion; darin der Siegesanteil in voller Fraktionsfarbe. Legende „Siege“ / „Partien gesamt“. Nie gespielte Fraktionen: gestrichelter Rahmen mit „Noch nicht gespielt“.
- **Einstellungen-Kopf „Maschinenraum“:** Teal-Kicker in IBM Plex Mono über der Überschrift „Einstellungen“.
- **Bedienelemente:** Schalter, Segment-Buttons und Schieberegler im Stil des Partie-Setups (in `ui.tsx` gespiegelt, damit der Bereich eigenständig exportierbar ist). Regler in 5er-Schritten mit Prozentanzeige.
- **Dialoge als Sheets:** Auf dem Desktop zentrierter Dialog, auf dem Smartphone Bottom-Sheet mit Griff. Schließen über „Schließen“-X, Escape, Klick auf den Hintergrund oder „Abbrechen“. Beim Öffnen springt der Fokus in den Dialog (erstes Formularfeld, sonst der erste Button nach „Schließen“), Tab und Umschalt+Tab bleiben im Dialog, beim Schließen kehrt der Fokus zum auslösenden Element zurück.
- **„Gespeichert“:** kleiner Pill-Hinweis unten mittig (auf Smartphones oberhalb der unteren Navigation), verschwindet nach 1,6 s.
- **Touch-Ziele:** Buttons mindestens 44 px hoch (`min-h-11`), Listeneinträge der Rubriken auf Smartphones 56 px.
- Heller und dunkler Modus über `dark:`-Varianten.

## Datenformen

Aus `types.ts`:

| Interface | Bedeutung | Globale Entität (`product/data-shape/data-shape.md`) |
|---|---|---|
| `Profile` | Anzeigename, Avatar, Mitglied seit, Lieblingsfraktion | **Player** |
| `PlayerStats` | Gesamtbilanz (Partien, Siege, eroberte Städte, gebaute Einheiten, längste Partie) | aus **Player** abgeleitet (Bilanz aus beendeten Partien) |
| `FactionStat` | Partien und Siege je Fraktion (`gamesPlayed: 0` = nie gespielt) | abgeleitet aus **Match** / **Participant** je **Faction** |
| `HistoryEntry` | Eine beendete Partie aus Sicht des Spielers | **Match** + eigener **Participant** (Ergebnis, Platzierung, Fraktion), Mitspieler aus den übrigen Participants (KI mit „(KI)“) |
| `Faction` | Name, Kurzname, Farbe, Wappen | **Faction** |
| `Settings` (`NotificationSettings`, `DisplaySettings`, `SoundSettings`, `ControlSettings`) | Alle Einstellungen | **PlayerSettings** |
| `Account` | E-Mail-Adresse, Anzahl aktiver Sitzungen | **Player** (E-Mail) plus Sitzungsverwaltung des Auth-Systems |
| `PushPermission` | Browser-Berechtigung `'default' \| 'granted' \| 'denied'` | keine Entität, Laufzeitzustand des Browsers |

## Visuelle Referenz

- `screenshot-profil.png` – Profil mit Dienstakte, Bilanz, Fraktionsstatistik und Partieverlauf
- `screenshot-einstellungen.png` – Einstellungen mit Rubriken-Navigation und geöffneter Rubrik

## Enthaltene Komponenten

Exportiert über `components/index.ts`:

- `Profil` – Profilseite: Dienstakte-Kopf, Bilanz, Statistik nach Fraktion, filterbarer Partieverlauf und Dialog „Profil bearbeiten“.
- `Einstellungen` – Einstellungsseite mit fünf Rubriken, sofortigem Speichern, Konto-Dialogen und zweistufiger Kontolöschung.
- `Avatar` – Rundes Avatarbild mit farbigem Ring; ohne (ladbares) Bild bis zu zwei Initialen.
- `FactionEmblem` – Fraktionswappen als Bild, Fallback als SVG-Schild in Fraktionsfarbe mit Anfangsbuchstaben.
- `Segmented` – Segment-Buttons als `radiogroup`.
- `SettingRow` – Zeile mit Titel, optionaler Beschreibung und Bedienelement rechts.
- `Sheet` – Dialog (Desktop) bzw. Bottom-Sheet (Smartphone) mit Titel, Schließen-Button und optionaler Fußzeile.
- `Slider` – Schieberegler 0–100 in 5er-Schritten mit Prozentanzeige.
- `Switch` – Ein/Aus-Schalter mit `role="switch"`.
- `TextInput` – Beschriftetes Eingabefeld mit optionalem Hinweistext.
- `format.ts` – `FACTION_HEX`, `RESULT_STAMP`, `formatDate` (de-DE), `percent`.

## Callback-Props

**`Profil` (`ProfilProps`)**

| Callback | Ausgelöst wenn |
|---|---|
| `onLoadMoreHistory()` | der Spieler unter dem Partieverlauf „Mehr anzeigen“ klickt (nur sichtbar bei `hasMoreHistory` und nicht leerer gefilterter Liste) |
| `onUpdateDisplayName(name)` | der Spieler im Dialog „Profil bearbeiten“ auf „Speichern“ klickt und der (getrimmte) Name sich vom bisherigen unterscheidet |
| `onUploadAvatar(file)` | der Spieler über „Bild hochladen“ eine Bilddatei auswählt (sofort, nicht erst beim Speichern) |
| `onRemoveAvatar()` | der Spieler „Bild entfernen“ klickt (nur sichtbar, wenn ein Avatar gesetzt ist) |

**`Einstellungen` (`EinstellungenProps`)**

| Callback | Ausgelöst wenn |
|---|---|
| `onChangeSettings(settings)` | irgendein Schalter, Segment-Button oder Regler geändert wird; übergibt das vollständige neue `Settings`-Objekt |
| `onEnablePush()` | der Spieler im Push-Hinweis „Erlauben“ klickt (nur bei `pushPermission === 'default'`) |
| `onChangeEmail(email, currentPassword)` | der Spieler im Dialog „E-Mail ändern“ mit gültiger Adresse und Passwort auf „Speichern“ klickt |
| `onChangePassword(currentPassword, newPassword)` | der Spieler im Dialog „Passwort ändern“ mit gültigen Eingaben auf „Speichern“ klickt |
| `onLogout()` | der Spieler in der Rubrik Konto „Abmelden“ klickt |
| `onLogoutEverywhere()` | der Spieler „Auf allen Geräten abmelden“ klickt |
| `onDeleteAccount()` | der Spieler im zweiten Dialog „Endgültig löschen“ nach korrekter Namenseingabe „Konto löschen“ klickt |
