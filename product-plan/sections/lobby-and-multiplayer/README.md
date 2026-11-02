# Lobby & Multiplayer

## Überblick

Die Lobby ist die Startseite von Dominion of Steam. Sie zeigt als Dashboard zuerst die Partien, in denen der Spieler am Zug ist, darunter seine übrigen Partien und erhaltene Einladungen, und in Tabs offene Partien anderer Spieler sowie beendete Partien. Partien, die noch auf Mitspieler warten, haben einen eigenen Warteraum, von dem aus der Ersteller die Partie startet.

Der Bereich besteht aus zwei Ansichten:

- **Lobby** („Lagebericht“): Dashboard mit Push-Banner, „Du bist am Zug“, „Weitere Partien“, „Einladungen“ und den Tabs „Offene Partien“ / „Beendet“.
- **Warteraum**: Platzliste einer wartenden Partie mit Bereit-Schalter, Einladungslink, Regelübersicht, „Starten“ (nur Ersteller) und „Verlassen“.

## Abläufe

- **Lobby öffnen:** Nach dem App-Start landet der Spieler in der Lobby. Partien mit `status: 'yourTurn'` stehen oben als große Karten, sortiert nach der kürzesten verbleibenden Frist (Live-Partien ohne Frist zuletzt). Gibt es keine, erscheint „Du bist nirgends am Zug“ mit „Neue Partie“.
- **Weiterspielen:** „Weiterspielen“ öffnet die Partie im Spielfeld.
- **Übrige Partien:** Laufende Partien, in denen andere am Zug sind („Lena Hartmann ist am Zug“), und Partien im Warteraum („Wartet auf 2 Spieler“) stehen unter „Weitere Partien“.
- **Frist-Warnung:** Läuft die Frist des eigenen Zugs in weniger als `deadlineWarningHours` (Beispiel: 3) Stunden ab, bekommt die Karte einen roten Rahmen und einen roten Frist-Stempel („noch 1 Std. 40 Min.“).
- **Mitspieler erinnern:** In asynchronen Partien, in denen ein Mensch am Zug ist, gibt es „Erinnern“. Danach zeigt der Button 12 Stunden lang „Erinnert“ und ist gesperrt.
- **Partie-Details:** Über das Menü („Weitere Aktionen“) → „Partie-Details“ öffnet sich ein Dialog mit Regeln, Karte und Spielerliste. Das Menü schließt bei Klick außerhalb und mit Escape.
- **Aufgeben:** Menü → „Aufgeben“ öffnet die Bestätigung „Partie aufgeben?“. Eine KI auf Stufe „Normal“ übernimmt die Fraktion, die Partie zählt als Niederlage.
- **Einladungen:** „Annehmen“ führt in den Warteraum, „Ablehnen“ entfernt die Einladung.
- **Offene Partien:** Im Tab „Offene Partien“ tritt der Spieler mit „Beitreten“ einer öffentlichen Partie bei und landet im Warteraum.
- **Beendete Partien:** Im Tab „Beendet“ stehen die letzten Partien mit Ergebnis-Stempel, Platzierung, Rundenzahl, Sieger und eigener Fraktion.
- **Warteraum:** Zeigt alle Plätze mit Status, den Einladungslink („Kopieren“, „Teilen“) und die Regeln. Jeder beigetretene Spieler kann sich „Bereit melden“ oder den Warteraum „Verlassen“.
- **Partie starten:** Der Ersteller startet mit „Starten“, sobald alle beigetretenen Spieler bereit sind. Freie Plätze kann er per Checkbox mit KI auffüllen lassen („2 freie Plätze mit KI auffüllen“, bei einem Platz „1 freien Platz mit KI auffüllen“).
- **Push aktivieren:** Solange Push nicht erlaubt ist, zeigt die Lobby oben ein Banner mit „Aktivieren“ und „Später“; bei blockierter Berechtigung erklärt es, wie man sie im Browser wieder erlaubt („Ausblenden“). E-Mail-Benachrichtigungen liegen in „Spielerprofil & Einstellungen“.

## Gestaltungsentscheidungen

- **Typografie:** Big Shoulders Display (schwer, Versalien) für Überschriften, Partienamen, Buttons und Stempel; Barlow für Fließtext; IBM Plex Mono für Zahlen, Rundenzähler, Zähler in Überschriften, Kartencodes und den Einladungslink.
- **Farben:** Amber für Hauptaktionen („Weiterspielen“, „Annehmen“, „Starten“ als Amber-Verlauf, „Aktivieren“) und für den „am Zug“-Puls; Teal für sekundäre, positive Aktionen und Zustände („Beitreten“, „Teilen“, „Erinnern“, „Bereit“, Sieg-Stempel, offene Plätze); Rot (rose) für Frist-Warnung, Niederlage, „Aufgeben“ und „Verlassen“; Stone als neutrale Grundfarbe (Aufgegeben-Stempel grau). Fraktionsfarben (`amber`, `rose`, `sky`, `lime`, `violet`, `orange`) kommen aus `FACTION_HEX` in `format.ts`.
- **Militärisches Lagezentrum:** Kopfzeile „Lagezentrum“ / „Lagebericht“ mit persönlicher Lagemeldung („Björn, 3 Fronten warten auf deinen Befehl.“). Abschnittsüberschriften mit doppelter Unterlinie (`border-double`) und Zähler.
- **Stempel:** Frist-Countdown auf der großen Karte und Ergebnisse beendeter Partien als leicht gedrehte Stempel mit Rahmen (Sieg Teal, Niederlage Rot, Aufgegeben Grau).
- **Mini-Lagekarte:** Stilisierte Pixelkarte (SVG) aus `match.miniMap`: dunkles Teal als Wasser mit vereinzelten Wellenstrichen, Sandton für neutrales Land, Teilnehmergebiete in Fraktionsfarbe. Auf der großen Karte als Kopfbild mit Verlauf, Rundenzahl und Partiename; kompakt als kleines Vorschaubild. Wartende Partien zeigen stattdessen eine gestrichelte Fläche mit Sanduhr.
- **Teilnehmerreihe:** Avatare (Initialen als Fallback) mit Ring in Fraktionsfarbe, „KI“-Abzeichen für KI-Gegner, pulsierender Amber-Ring für den Teilnehmer am Zug, ausgegraute Avatare für ausgeschiedene/aufgegebene Teilnehmer, gestrichelte Kreise für freie Plätze.
- **Einladungskarten:** Kompakte Karten mit Amber/Teal-gestreiftem linkem Rand, Chips für Modus, Kartengröße und Plätze, optionale Nachricht kursiv in Anführungszeichen.
- **Dialoge:** `Sheet` ist auf Desktop ein zentrierter Dialog, auf dem Smartphone ein Bottom-Sheet mit Griffleiste. Beim Öffnen springt der Fokus in den Dialog (erstes Formularfeld, sonst der erste Button nach „Schließen“), Tab und Umschalt+Tab bleiben im Dialog, beim Schließen kehrt der Fokus zum auslösenden Element zurück; Escape schließt.
- **Warteraum:** Nummerierte Platzliste mit Status-Pillen; offene Plätze gestrichelt in Teal. Aktionsleiste unten klebend (`sticky`), auf Mobilgeräten oberhalb der Tab-Leiste der Shell.
- **Layout:** „Du bist am Zug“ mit bis zu 3 Karten nebeneinander (`md:` 2, `xl:` 3); „Weitere Partien“ und „Einladungen“ ab `lg:` nebeneinander (Einladungen 24rem breit); auf dem Smartphone alles untereinander. Touch-Ziele mindestens 44 px (`min-h-11`). Heller und dunkler Modus über `dark:`-Varianten.

## Datenformen

Alle Typen stehen in `types.ts`.

| Interface | Bedeutung | Globale Entität (`product/data-shape/data-shape.md`) |
|---|---|---|
| `Player` | Angemeldeter Spieler bzw. Absender einer Einladung | Player |
| `Faction` | Fraktion mit Kurzname, Farbe und Wappen | Faction |
| `Participant` | Teilnehmer einer laufenden Partie (Mensch oder KI) mit Fraktion, Status, Städtezahl | Participant (mit Player bzw. AiPersonality) |
| `MatchRules` | Modus, Zugfrist/Zeitlimit, Siegbedingung, doppelte Fraktionen | Teil von Match |
| `MatchMapInfo` | Größe, Abmessungen, Landanteil, Kartencode | Map |
| `Match` | Eigene Partie (`yourTurn`, `othersTurn`, `waitingForPlayers`) mit Teilnehmern, Frist, Mini-Lagekarte | Match (+ abgeleitete Daten aus Turn, Tile, City) |
| `Invitation` | Erhaltene Einladung mit Absender, Modus, Kartengröße, Plätzen, Nachricht | Invitation |
| `OpenMatch` | Öffentliche Partie eines anderen Spielers mit freien Plätzen | Match im Status „wartet auf Spieler“ |
| `FinishedMatch` | Beendete Partie aus Sicht des Spielers mit Ergebnis und Platzierung | Match (beendet) + Participant (Ergebnis, Platzierung) |
| `WaitingSeat` | Platz im Warteraum: `player`, `ai`, `invited` oder `open` | Participant (beigetreten/bereit, KI, Einladung, offener Platz) |
| `WaitingRoom` | Warteraum einer Partie mit Einladungslink, Regeln, Karte, Plätzen | Match + Participant + Einladungslink |

Hinweise zu den Daten:

- `now` ist die Referenzzeit für alle Fristen, Countdowns und „vor … “-Angaben (Beispiel: `2026-10-30T13:00:00Z`).
- `Match.miniMap` ist ein grobes Raster, eine Zeichenkette pro Zeile: `~` Wasser, `.` neutrales Land, Ziffern = Index in `participants`. Leer, solange die Partie wartet. Die Auflösung ist unabhängig von `map.width`/`map.height`.
- `turnDeadline` ist nur bei asynchronen Partien gesetzt; Live-Partien und Warteräume haben `null`.
- `remindedAt` steuert die 12-Stunden-Sperre von „Erinnern“.

## Visuelle Referenz

- `screenshot-lobby.png` – Lobby mit Push-Banner, drei Partien „Du bist am Zug“ (eine mit Frist-Warnung), weiteren Partien, Einladungen und Tab „Offene Partien“
- `screenshot-warteraum.png` – Warteraum „Die Kohleinseln II“ aus Sicht des Erstellers, Start gesperrt („Warte auf Jonas Vogt“)

## Enthaltene Komponenten

Export über `components/index.ts`:

- `Lobby` – Dashboard-Ansicht mit Push-Banner, Partien, Einladungen, Tabs und den Dialogen für Details und Aufgeben.
- `Warteraum` – Ansicht einer wartenden Partie mit Platzliste, Einladungslink, Regeln, Bereit-Schalter, Start und Verlassen-Bestätigung.
- `MatchCard` – Partie-Karte in den Varianten `feature` („Du bist am Zug“) und `compact` („Weitere Partien“), inkl. Menü „Weitere Aktionen“.
- `MatchDetailsSheet` – Dialog/Bottom-Sheet mit Regeln, Karte und Spielerliste einer Partie.
- `SurrenderSheet` – Bestätigungsdialog „Partie aufgeben?“.
- aus `shared.tsx`: `FactionEmblem` (Wappen mit SVG-Fallback), `Avatar` (Bild oder Initialen), `ParticipantChip` (Avatar mit Fraktionsring, KI-Abzeichen, Am-Zug-Markierung), `MiniMap` (Pixel-Lagekarte), `Sheet` (Dialog/Bottom-Sheet), `Chip`, `SectionHeading`.
- aus `format.ts`: `FACTION_HEX`, `DIFFICULTY_LABEL`, `timeLeft` („noch 22 Std.“, „Frist abgelaufen“), `timeAgo` („vor 19 Min.“, „gestern“, „vor 2 Tagen“, Datum), `hoursSince`.

## Callback-Props

**`LobbyProps`**

| Callback | Ausgelöst wenn |
|---|---|
| `onPlay(matchId)` | „Weiterspielen“ auf einer Karte in „Du bist am Zug“ angetippt wird |
| `onOpenWaitingRoom(matchId)` | „Warteraum“ auf einer wartenden Partie in „Weitere Partien“ angetippt wird |
| `onRemind(matchId, participantId)` | „Erinnern“ angetippt wird; `participantId` ist der Teilnehmer am Zug |
| `onSurrender(matchId)` | im Dialog „Partie aufgeben?“ der Button „Aufgeben“ bestätigt wird |
| `onShowDetails(matchId)` | im Menü „Partie-Details“ gewählt wird (der Dialog öffnet die Komponente selbst) |
| `onAcceptInvitation(invitationId)` | „Annehmen“ auf einer Einladung angetippt wird |
| `onDeclineInvitation(invitationId)` | „Ablehnen“ auf einer Einladung angetippt wird |
| `onJoinOpenMatch(openMatchId)` | „Beitreten“ in „Offene Partien“ angetippt wird |
| `onEnablePush()` | „Aktivieren“ im Push-Banner angetippt wird |
| `onDismissPushBanner()` | „Später“ bzw. „Ausblenden“ im Push-Banner angetippt wird |
| `onNewMatch()` | „Neue Partie“ in der Kopfzeile oder im leeren Zustand „Du bist nirgends am Zug“ angetippt wird |

**`WarteraumProps`**

| Callback | Ausgelöst wenn |
|---|---|
| `onToggleReady(ready)` | „Bereit melden“ / „Bereit“ umgeschaltet wird; `ready` ist der neue Zustand |
| `onStartMatch(fillEmptyWithAI)` | der Ersteller „Starten“ antippt; Argument = Zustand der Checkbox „… mit KI auffüllen“ |
| `onLeave()` | im Dialog „Warteraum verlassen?“ der Button „Verlassen“ bestätigt wird |
| `onCopyInviteLink(link)` | „Kopieren“ angetippt wird (die Komponente schreibt zusätzlich in die Zwischenablage) |
| `onShareInviteLink(link)` | „Teilen“ angetippt wird |
| `onBack()` | „Lobby“ (Zurück-Link oben) angetippt wird, ohne die Partie zu verlassen |
