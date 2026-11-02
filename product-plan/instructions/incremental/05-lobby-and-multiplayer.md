# Meilenstein 5: Lobby & Multiplayer

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

Die Lobby als Startseite der App umsetzen: Der Spieler sieht auf einen Blick, wo er am Zug ist, verwaltet seine übrigen Partien, Einladungen, offene und beendete Partien und bringt wartende Partien über den Warteraum an den Start.

## Überblick

Die Lobby („Lagebericht“) ist ein Dashboard. Oben stehen als große Karten alle Partien, in denen der Spieler am Zug ist, sortiert nach der kürzesten Frist und mit roter Warnung kurz vor Ablauf. Darunter folgen „Weitere Partien“ (andere am Zug oder im Warteraum) und „Einladungen“, darunter die Tabs „Offene Partien“ und „Beendet“. Ein Banner bittet um die Erlaubnis für Push-Benachrichtigungen. Partien, die auf Mitspieler warten, haben einen eigenen Warteraum mit Platzliste, Einladungslink, Regeln, Bereit-Schalter und einem Start-Button für den Ersteller.

**Kernfunktionen:**
- Partien nach Zustand gruppiert, eigene Züge nach Frist sortiert, Frist-Warnung unter `deadlineWarningHours`
- Mitspieler in asynchronen Partien erinnern, mit 12-Stunden-Sperre
- Partie-Details und Aufgeben (KI übernimmt die Fraktion) als Dialog bzw. Bottom-Sheet
- Einladungen annehmen/ablehnen, offenen Partien beitreten, beendete Partien mit Ergebnis-Stempel
- Warteraum mit Bereit-Status, Start-Sperre, Auffüllen freier Plätze mit KI und Einladungslink
- Push-Banner für die Zug-Benachrichtigung in den Zuständen „noch nicht gefragt“ und „blockiert“

## Enthaltene Komponenten

Kopiere die Dateien aus `product-plan/sections/lobby-and-multiplayer/components/`:

- `Lobby.tsx` – Lobby-Ansicht (`Lobby`)
- `Warteraum.tsx` – Warteraum-Ansicht (`Warteraum`)
- `MatchCard.tsx` – Partie-Karte, Varianten `feature` und `compact`, mit Aktionsmenü
- `MatchDialogs.tsx` – `MatchDetailsSheet` und `SurrenderSheet`
- `shared.tsx` – `FactionEmblem`, `Avatar`, `ParticipantChip`, `MiniMap`, `Sheet`, `Chip`, `SectionHeading`
- `format.ts` – `FACTION_HEX`, `DIFFICULTY_LABEL`, `timeLeft`, `timeAgo`, `hoursSince`
- `index.ts` – Sammel-Export

Dazu `types.ts` aus `product-plan/sections/lobby-and-multiplayer/`. Die Komponenten importieren die Typen über `../types`.

## Props-Referenz

**Daten-Props:**

- `LobbyProps`: `now` (Referenzzeit für Fristen und „vor …“-Angaben), `you: Player`, `pushPermission: 'default' | 'granted' | 'denied'`, `deadlineWarningHours`, `factions: Faction[]`, `matches: Match[]` (Status `yourTurn`, `othersTurn`, `waitingForPlayers`), `invitations: Invitation[]`, `openMatches: OpenMatch[]`, `finishedMatches: FinishedMatch[]`
- `Match`: Name, Status, Runde, `turnDeadline` (nur asynchron), `currentParticipantId`, `remindedAt`, `isHost`, `participants: Participant[]`, `rules: MatchRules`, `map: MatchMapInfo`, `miniMap: string[]`, `waitingFor?`
- `WarteraumProps`: `room: WaitingRoom` (Name, `isHost`, `inviteLink`, Regeln, Karte, `fillEmptyWithAI`, `seats: WaitingSeat[]`), `factions: Faction[]`
- `WaitingSeat`: Diskriminierte Union über `kind` – `player` (`ready`/`joined`), `ai` (`ready`, mit `aiDifficulty`), `invited` (`pending`), `open` (`pending`)

**Callback-Props:**

| Callback | Ausgelöst wenn |
|---|---|
| `onPlay(matchId)` | „Weiterspielen“ auf einer Karte in „Du bist am Zug“ angetippt wird |
| `onOpenWaitingRoom(matchId)` | „Warteraum“ bei einer wartenden Partie angetippt wird |
| `onRemind(matchId, participantId)` | „Erinnern“ angetippt wird (Teilnehmer am Zug) |
| `onSurrender(matchId)` | „Aufgeben“ im Dialog „Partie aufgeben?“ bestätigt wird |
| `onShowDetails(matchId)` | „Partie-Details“ im Menü gewählt wird (Dialog öffnet die Komponente selbst) |
| `onAcceptInvitation(invitationId)` | „Annehmen“ auf einer Einladung angetippt wird |
| `onDeclineInvitation(invitationId)` | „Ablehnen“ auf einer Einladung angetippt wird |
| `onJoinOpenMatch(openMatchId)` | „Beitreten“ bei einer offenen Partie angetippt wird |
| `onEnablePush()` | „Aktivieren“ im Push-Banner angetippt wird |
| `onDismissPushBanner()` | „Später“ bzw. „Ausblenden“ im Push-Banner angetippt wird |
| `onNewMatch()` | „Neue Partie“ (Kopfzeile oder Leerzustand) angetippt wird |
| `onToggleReady(ready)` | im Warteraum „Bereit melden“ / „Bereit“ umgeschaltet wird |
| `onStartMatch(fillEmptyWithAI)` | der Ersteller „Starten“ antippt; Argument = Zustand der KI-Checkbox |
| `onLeave()` | „Verlassen“ im Dialog „Warteraum verlassen?“ bestätigt wird |
| `onCopyInviteLink(link)` | „Kopieren“ beim Einladungslink angetippt wird |
| `onShareInviteLink(link)` | „Teilen“ beim Einladungslink angetippt wird |
| `onBack()` | der Link „Lobby“ im Warteraum angetippt wird (ohne die Partie zu verlassen) |

## Erwartete Abläufe

### Ablauf 1: Weiterspielen mit Frist-Warnung

1. Der Spieler öffnet die App und landet in der Lobby („Lagebericht“, „Björn, 3 Fronten warten auf deinen Befehl.“).
2. Unter „Du bist am Zug“ steht „Salz und Schwefel“ zuerst, mit rotem Rahmen und Stempel „noch 1 Std. 40 Min.“.
3. Er tippt „Weiterspielen“.

**Ergebnis:** `onPlay('m-salz')` wird aufgerufen, die App navigiert zum Spielfeld dieser Partie (Bereich „Spielfeld & Züge“).

### Ablauf 2: Mitspieler erinnern und Partie aufgeben

1. Unter „Weitere Partien“ zeigt „Nordwind“ „Lena Hartmann ist am Zug“. Der Spieler tippt „Erinnern“.
2. Das Backend verschickt die Erinnerung und liefert `remindedAt` zurück; der Button zeigt „Erinnert“ und bleibt 12 Stunden gesperrt.
3. Bei „Die Kohleinseln“ öffnet er „Weitere Aktionen“ → „Aufgeben“ und bestätigt im Dialog „Partie aufgeben?“ mit „Aufgeben“.

**Ergebnis:** `onRemind('m-nordwind', 'lena')` bzw. `onSurrender('m-kohle')`; nach dem Aufgeben übernimmt serverseitig eine KI (Normal) die Fraktion, die Partie verschwindet aus den laufenden und erscheint unter „Beendet“ mit Stempel „Aufgegeben“.

### Ablauf 3: Einladung annehmen und im Warteraum bereit melden

1. Unter „Einladungen“ tippt der Spieler bei „Inselhüpfen“ auf „Annehmen“.
2. Die App öffnet den Warteraum der Partie. Sein Platz zeigt „Nicht bereit“.
3. Er tippt „Bereit melden“; der Button wechselt zu „Bereit“.

**Ergebnis:** `onAcceptInvitation('inv-1')`, danach Navigation in den Warteraum; `onToggleReady(true)` meldet den Bereit-Status an den Server, der ihn an alle Teilnehmer verteilt.

### Ablauf 4: Partie als Ersteller starten

1. Im Warteraum „Die Kohleinseln II“ steht „3 von 5 Plätzen besetzt · 2 bereit“; „Starten“ ist gesperrt mit dem Hinweis „Warte auf Jonas Vogt“.
2. Jonas meldet sich bereit (neue `room`-Daten vom Server); der Hinweis wechselt zu „Alle sind bereit. Die Partie kann beginnen.“
3. Die Checkbox „2 freie Plätze mit KI auffüllen“ ist angehakt. Der Ersteller tippt „Starten“.

**Ergebnis:** `onStartMatch(true)`; der Server füllt die freien Plätze mit KI-Gegnern, erzeugt die Karte, startet Runde 1 und benachrichtigt alle Teilnehmer. Die App wechselt zum Spielfeld bzw. zurück in die Lobby, wo die Partie nun als laufend erscheint.

## Leere Zustände

| Bereich | Bedingung | Anzeige |
|---|---|---|
| Du bist am Zug | keine `yourTurn`-Partie | „Du bist nirgends am Zug“ · „Zeit für eine neue Partie?“ · Button „Neue Partie“; Untertitel „<Name>, an allen Fronten ist es ruhig.“ |
| Weitere Partien | keine `othersTurn`/`waitingForPlayers`-Partie | „Keine weiteren laufenden Partien.“ |
| Einladungen | `invitations` leer | „Keine offenen Einladungen.“ |
| Offene Partien | `openMatches` leer | „Gerade sucht niemand Mitspieler. Erstelle selbst eine offene Partie.“ |
| Beendet | `finishedMatches` leer | „Noch keine beendeten Partien.“ |

Ein neuer Spieler ohne Partien sieht alle Leerzustände gleichzeitig. Ladezustände und Fehlermeldungen (z. B. Beitritt fehlgeschlagen, Partie voll, Einladung zurückgezogen) sind nicht in den Komponenten enthalten und müssen ergänzt werden.

## Tests

Die Verhaltens-Spezifikation steht in `product-plan/sections/lobby-and-multiplayer/tests.md`: Abläufe mit Erfolgs- und Fehlerfällen, Leerzustände, Komponenten-Interaktionen, Grenzfälle, Barrierefreiheit und Beispiel-Testdaten. Setze dort `now` fest, damit Countdowns und die Erinnerungs-Sperre deterministisch sind.

## Hinweise zur Umsetzung

- **Zeitbezug:** Alle Fristen und „vor …“-Angaben werden aus `now` berechnet, nicht aus der Systemzeit. Übergib `now` vom Server bzw. aktualisiere es regelmäßig (z. B. jede Minute), damit Countdowns laufen und die Frist-Warnung rechtzeitig umschaltet.
- **Regeln in den Komponenten:**
  - Frist-Warnung: nur bei `status: 'yourTurn'` und Restzeit `< deadlineWarningHours` (Beispiel `3`).
  - Sortierung „Du bist am Zug“: nach `turnDeadline` aufsteigend, Live-Partien (`turnDeadline: null`) zuletzt.
  - Erinnern: nur bei `othersTurn`, `rules.mode: 'async'` und menschlichem Teilnehmer am Zug; gesperrt, solange `remindedAt` weniger als 12 Stunden zurückliegt (`REMIND_COOLDOWN_HOURS` in `MatchCard.tsx`). Das Backend muss dieselbe Sperre durchsetzen und `remindedAt` nach dem Erinnern zurückliefern; die Komponente setzt es nicht selbst.
  - Aufgeben ist nur bei laufenden Partien im Menü, nicht bei wartenden.
  - Warteraum-Start: erlaubt, sobald der Spieler Ersteller ist und alle `player`-Plätze `ready` sind. Eingeladene und offene Plätze blockieren nicht; sie zählen als freie Plätze und werden bei `onStartMatch(true)` mit KI aufgefüllt. Prüfe dieselbe Bedingung serverseitig.
  - Textformate stehen in `format.ts` (`timeLeft`, `timeAgo`).
- **Lokaler UI-Zustand vs. Props:**
  - `Lobby`: aktiver Tab, ausgeblendetes Push-Banner, geöffneter Details- bzw. Aufgeben-Dialog sind lokal. Das Ausblenden des Banners gilt nur bis zum nächsten Mounten; soll „Später“ dauerhaft wirken, speichere es über `onDismissPushBanner` und übergib dann `pushPermission`/Sichtbarkeit entsprechend (z. B. Banner nicht rendern).
  - `MatchDetailsSheet` öffnet die Lobby selbst mit den bereits übergebenen `Match`-Daten; `onShowDetails` ist nur eine Benachrichtigung (z. B. für Analytics oder Nachladen).
  - `Warteraum`: Der eigene Bereit-Status und die KI-Checkbox werden beim ersten Rendern aus `room` übernommen und danach lokal gehalten (optimistisch). Ändert der Server den eigenen Status, muss die Komponente neu gemountet werden (z. B. `key`) oder der Zustand angepasst werden. Die Plätze der anderen kommen immer aus `room`.
  - Einladungen, Partien und `remindedAt` ändert die Komponente nicht selbst; nach jedem Callback müssen neue Props kommen.
- **Was die Vorschau simuliert hat (muss das Backend leisten):** Die Design-Vorschau hat beim Erinnern `remindedAt` lokal gesetzt, beim Aufgeben die Partie lokal nach „Beendet“ verschoben, angenommene/abgelehnte Einladungen lokal entfernt und nach „Aktivieren“ `pushPermission` sofort auf `'granted'` gesetzt. Real gehört dazu:
  - `onEnablePush`: `Notification.requestPermission()` aufrufen, Push-Abo (Service Worker, Web Push) registrieren und am Server speichern; danach `pushPermission` aus der tatsächlichen Browser-Berechtigung übergeben (auch `'denied'`).
  - `onSurrender`: Teilnehmer auf `surrendered` setzen, KI-Persönlichkeit auf Stufe „Normal“ einsetzen, Ergebnis als Niederlage verbuchen.
  - `onAcceptInvitation`: Spieler als Participant eintragen, dann zum Warteraum navigieren. `onJoinOpenMatch`: freien Platz belegen (Rennen um den letzten Platz abfangen), dann zum Warteraum.
  - `onShareInviteLink`: `navigator.share({ url: link })` aufrufen, mit Fallback auf Kopieren, wo die Web-Share-API fehlt. `onCopyInviteLink`: Die Komponente kopiert bereits per `navigator.clipboard`; nutze den Callback für eine Bestätigung (Toast).
  - `onLeave`: Als Ersteller wird die Partie aufgelöst und alle Mitspieler werden benachrichtigt (so verspricht es der Dialogtext), sonst wird nur der Platz frei.
  - Einladungslink (`inviteLink`) erzeugen und beim Öffnen einen freien Platz besetzen.
- **Echtzeit:** Der Warteraum (Beitritte, Bereit-Status) und die Lobby (wer ist am Zug, neue Einladungen) sollten per WebSocket/SSE oder Polling aktualisiert werden.
- **Benachrichtigungen:** Laut Produktübersicht werden Spieler in asynchronen Partien benachrichtigt, sobald sie am Zug sind (Push und E-Mail). Die E-Mail-Einstellungen liegen im Bereich „Spielerprofil & Einstellungen“; die Banner-Texte verweisen dorthin.
- **Dauerhafte Spielstände:** Der Server speichert jede Partie nach jedem Zug; die Lobby-Daten (Runde, Frist, Mini-Lagekarte, Teilnehmerstatus) müssen sich nach einem Server-Neustart unverändert aus dem gespeicherten Zustand ergeben.
- **Mini-Lagekarte:** `miniMap` ist ein vom Server abgeleitetes Grob-Raster (`~` Wasser, `.` neutrales Land, Ziffer = Index in `participants`). Die Auflösung ist unabhängig von der Kartengröße (Beispiel: 24×12 Zeichen bei einer 18×12-Karte). Es sollte nur Gebiete zeigen, die der Spieler sehen darf (Kriegsnebel), und für wartende Partien leer sein.
- **Abhängigkeiten zu anderen Bereichen:** `onNewMatch` → „Partie-Setup & KI-Gegner“; `onPlay` → „Spielfeld & Züge“; Fraktionsdaten und Wappen (`emblemUrl`) → „Fraktionen & Einheiten“ bzw. `product/art-brief.md`. Ohne ladbares Wappen zeigt `FactionEmblem` ein SVG-Schild in Fraktionsfarbe.
- **Audio:** Laut `product/audio-brief.md` läuft in der Lobby der Musik-Loop `menu-lobby`, im Warteraum `menu-setup`. Die Komponenten spielen keinen Ton ab; das übernimmt die App beim Routing.
- **Shell:** Beide Ansichten laufen innerhalb der Shell. Die Aktionsleiste des Warteraums klebt auf Mobilgeräten oberhalb der Tab-Leiste der Shell (`bottom-[calc(4rem+env(safe-area-inset-bottom))]`); passe den Abstand an, falls die Tab-Leiste anders hoch ist.
- **Schriften:** Big Shoulders Display, Barlow und IBM Plex Mono müssen global geladen sein (siehe Design-Tokens).
- **Abweichungen Spec ↔ Komponenten:** Der Start-Button heißt in der Komponente „Starten“ (Spec: „Partie starten“); „Erinnern“ ist ein sichtbarer Button an der Karte, das Menü enthält nur „Partie-Details“ und „Aufgeben“.

## Referenzdateien

- `product-plan/sections/lobby-and-multiplayer/README.md` – Überblick, Gestaltung, Datenformen, Callbacks
- `product-plan/sections/lobby-and-multiplayer/tests.md` – Test-Spezifikation
- `product-plan/sections/lobby-and-multiplayer/types.ts` – Daten- und Props-Interfaces
- `product-plan/sections/lobby-and-multiplayer/sample-data.json` – Beispieldaten (Lobby und `waitingRoom`)
- `product-plan/sections/lobby-and-multiplayer/screenshot-lobby.png` – Lobby
- `product-plan/sections/lobby-and-multiplayer/screenshot-warteraum.png` – Warteraum
- `product-plan/sections/lobby-and-multiplayer/components/` – `Lobby.tsx`, `Warteraum.tsx`, `MatchCard.tsx`, `MatchDialogs.tsx`, `shared.tsx`, `format.ts`, `index.ts`

## Fertig, wenn

- [ ] Lobby und Warteraum zeigen echte Daten aus dem Backend statt Beispieldaten
- [ ] Alle Leerzustände erscheinen korrekt (inkl. neuer Spieler ohne Partien)
- [ ] Lade- und Fehlerzustände sind ergänzt (Beitritt fehlgeschlagen, Partie voll, Einladung nicht mehr gültig)
- [ ] Alle 17 Callbacks sind mit Routing bzw. Geschäftslogik verbunden
- [ ] Die Abläufe Weiterspielen, Erinnern, Aufgeben, Einladung annehmen/ablehnen, Beitreten, Bereit melden, Starten und Verlassen funktionieren Ende-zu-Ende
- [ ] Die Darstellung entspricht den Screenshots (`screenshot-lobby.png`, `screenshot-warteraum.png`)
- [ ] Responsiv auf Desktop, Tablet und Smartphone (Dialoge als Bottom-Sheet, Warteraum-Leiste über der Tab-Leiste), heller und dunkler Modus
- [ ] `now` wird laufend aktualisiert; Countdowns und Frist-Warnung schalten ohne Neuladen um
- [ ] Die 12-Stunden-Sperre fürs Erinnern und die Start-Bedingung im Warteraum werden auch serverseitig geprüft
- [ ] Nach dem Aufgeben übernimmt eine KI (Normal) die Fraktion, die Partie zählt als Niederlage und erscheint unter „Beendet“
- [ ] Push-Benachrichtigungen lassen sich aktivieren; `pushPermission` spiegelt die echte Browser-Berechtigung, `'denied'` zeigt den Hilfetext
- [ ] Einladungslink kann kopiert und über das Teilen-Menü des Geräts geteilt werden; Öffnen des Links besetzt einen freien Platz
- [ ] Warteraum und Lobby aktualisieren sich bei Änderungen anderer Spieler (Beitritt, Bereit, Zugwechsel) ohne manuelles Neuladen
- [ ] Partiedaten überstehen einen Server-Neustart (dauerhafte Spielstände)
