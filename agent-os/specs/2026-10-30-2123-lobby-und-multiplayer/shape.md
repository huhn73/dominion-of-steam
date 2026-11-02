# Lobby & Multiplayer: Shaping-Notizen

## Umfang

Lobby mit echten Daten, Warteraum, Einladungen annehmen/ablehnen, offene Partien, Einladungslink, Bereit/Start/Verlassen, Erinnern, Aufgeben, durchgesetzte Fristen, Benachrichtigungen per Web-Push und E-Mail. Nicht enthalten (06): Oberfläche für die Benachrichtigungs-Einstellungen, Profil, Bilanz. Nicht enthalten: WebSockets/SSE (Polling genügt laut Anleitung), Musik.

## Entscheidungen

- Der Nutzer hat um selbstständige Umsetzung ohne Rückfragen gebeten; die Entscheidungen sind hier festgehalten.
- **Plätze im Warteraum:** Die Platzarten aus 04 werden auf die Union der Komponente abgebildet: `player` → `player` (bereit/beigetreten), `ai` → `ai`, `friend` → `invited`, `invite` (Link), `open` und `empty` → `open`. Alle freien Arten blockieren den Start nicht und werden bei `onStartMatch(true)` KI (Normal), bei `false` entfernt (dann mindestens 2 Teilnehmer, sonst 409 `TOO_FEW_PLAYERS`). Teilnehmer-IDs wartender KI-Plätze in der Lobby: `seat-<n>`.
- **Beitreten:** Aus der Lobby nur auf `open`-Plätze; über den Einladungslink in der Reihenfolge `invite`, `open`, `empty`; ein eingeladener Freund nimmt über Link oder Beitreten seine Einladung an. Die Zeile der Partie wird gesperrt (`FOR UPDATE`), das Rennen um den letzten Platz endet für den Zweiten mit 409 `MATCH_FULL` „Partie voll: …“. Bereits Beigetretene landen einfach im Warteraum.
- **Fraktion beim Beitreten:** Der Warteraum hat keine Fraktionswahl. Der Server gibt die erste noch freie Fraktion (Reihenfolge des Kompendiums), mit doppelten Fraktionen die am wenigsten genutzte.
- **Ablehnen:** Einladung `declined`, der Freund-Platz wird `empty` (freier Platz, beim Start KI oder über den Link besetzbar). Ein Eingeladener, der „Verlassen“ wählt, lehnt ab.
- **Verlassen:** Mitspieler geben den Platz frei; er bekommt seine frühere Art zurück (`free_kind`, Freund-Platz → Link-Platz). Der Ersteller löst die Partie auf (Zeile gelöscht); Mitspieler und offene Eingeladene erhalten „Partie aufgelöst“ (Einstellung `matchEnded`, nur Push).
- **Bereit/Start:** Der Ersteller gilt beim Anlegen als bereit und kann sich abmelden. Start nur durch den Ersteller (403 `NOT_HOST`) und wenn alle `player`-Plätze bereit sind (409 `NOT_READY` „Warte auf …“, dieselbe Regel `startBlockers` wie die Komponente). Danach `launchMatch` und KI-Züge.
- **Erinnern:** Nur laufend, asynchron, ein Mensch am Zug, nicht man selbst; die übergebene `participantId` muss der Teilnehmer am Zug sein (sonst 409 `TURN_CHANGED`). Sperre 12 Stunden je (Partie, erinnernder Spieler) in `reminders`; 429 `REMIND_COOLDOWN` mit Restzeit. `remindedAt` in der Lobby ist der letzte eigene Zeitpunkt dieser Partie.
- **Aufgeben:** Der Teilnehmer behält ID, Städte und Einheiten, wird `isAI`, Stufe Normal, ohne Persönlichkeit, umbenannt in „KI für <Name>“; `surrender` speichert Name, Zeitpunkt, Runde und Platz (hinter allen noch Aktiven). War er am Zug, spielt die KI sofort. Ohne aktive Menschen endet die Partie sofort nach Punkten (`endIfNoHumans`, gilt auch für ausgeschiedene Menschen). Befehle Aufgegebener: 409 `SURRENDERED`; zuschauen bleibt erlaubt. In der Lobby erscheint der Spieler wie im Design doppelt: aufgegeben (grau) und „KI für …“ (`ai-<id>`, spielt weiter, besitzt die Gebiete der Mini-Karte). Für den Aufgebenden steht die Partie sofort unter „Beendet“ (Stempel „Aufgegeben“, Sieger „Partie läuft noch“, solange sie läuft).
- **Mini-Lagekarte:** 24×12 Zeichen, unabhängig von der Kartengröße; jede Zelle nimmt das Feld unter ihrer Mitte. Nur erkundete Felder; Unerkundetes erscheint als `~` (die Komponente kennt kein eigenes Zeichen dafür). Land gehört der nächsten bekannten Stadt im Umkreis 3 mit dem zuletzt gesehenen Besitzer. Wartende Partien: leer.
- **Fristen in der Lobby:** `turnDeadline` nur für asynchrone Partien (Live-Zeitlimits laufen im Spielfeld, wie im Design „Live … ohne Frist, daher zuletzt“).
- **Sweeper:** Alle 15 s im Serverprozess (`createSweeper().sweep(now)`, testbar mit eigener Zeit). Abgelaufene Fristen (asynchron und Live-Zeitlimit) beenden den Zug unter Zeilensperre wie „Zug beenden“ (direkt über die Engine, auch in der Wiederholung), danach KI-Züge. „Frist läuft bald ab“ einmal je Zug (Schlüssel Partie/Runde/Platz), wenn weniger als 3 Stunden bleiben, nur asynchron.
- **Benachrichtigungen:** Tabelle `notifications` ist Protokoll und Outbox. Arten: `yourTurn`, `remind` und `matchStarted` (Einstellung `yourTurn`), `deadlineSoon`, `invitation`, `matchEnded` und `matchCancelled` (Einstellung `matchEnded`). „Du bist am Zug“ bekommt nicht, wer den Wechsel selbst ausgelöst hat. Live-Partien und Start/Auflösen: nur Push. Push geht nach dem Commit sofort raus (und sonst beim Sweep), an alle Abos des Spielers; 404/410 löschen das Abo. E-Mail: fällig nach `emailDelayHours`; gesendet nur, wenn der Spieler mindestens so lange und mindestens 2 Minuten (Online-Fenster) offline ist; abgesagt, wenn er seit der Benachrichtigung aktiv war, der Zug vorbei bzw. die Einladung nicht mehr offen ist oder E-Mails inzwischen aus sind. Einstellungen aus `players.settings.notifications` (Form aus 06), fehlende Teile mit Vorgaben: Push für alle vier Anlässe, E-Mail für „am Zug“ und Einladung, Verzögerung 1 Stunde.
- **Push:** VAPID-Schlüssel aus `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, sonst einmal erzeugt in `app_config`. Ein Abo gehört dem zuletzt angemeldeten Spieler des Browsers (Upsert per Endpoint), beim Abmelden wird es entfernt. Browser ohne Push-Unterstützung zeigen kein Banner (`pushPermission` = `granted`), damit nichts Unmögliches angeboten wird.
- **„Später“/„Ausblenden“:** pro Spieler im `localStorage` (`dos.pushBanner.<id>`), 7 Tage; dann wird `pushPermission="granted"` übergeben, weil die Komponente keine eigene Sichtbarkeits-Prop hat.
- **Links in E-Mails:** `PUBLIC_URL`, sonst Herkunft der letzten API-Anfrage.
- **Echtzeit:** Polling – Lobby alle 15 s und beim Fokus, Warteraum alle 4 s; `now` vom Server läuft im Client jede Minute weiter. Ändert der Server den eigenen Bereit-Status, wird `Warteraum` per `key` neu gemountet (nicht während eine eigene Änderung unterwegs ist).
- **Ältere Daten:** Beim Start ergänzt der Server Plätze für Partien mit Spielstand ohne `match_seats` (z. B. die Demo vor 04), damit sie in der Lobby erscheinen.
- **Dev-Leiste:** bleibt unter der Lobby (lokal und mit `VITE_DEV_TOOLS=true`), mit „Demo-Partie öffnen“.

## Kontext

- **Visuals:** `visuals/screenshot-lobby.png`, `visuals/screenshot-warteraum.png` (Vorlage); Umsetzung `visuals/umsetzung-*.png` (Lobby hell/dunkel/Smartphone/Beendet, Warteraum hell/dunkel/Smartphone). Die Mini-Karten sind wegen des Kriegsnebels in frühen Runden spärlicher als in der Vorlage.
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Mehrspieler live und asynchron, Benachrichtigungen; Grundlage für Profil & Einstellungen (06)

## Offene Punkte für 06

- Oberfläche für `NotificationSettings` (Speichern in `players.settings.notifications`; Server liest sie bereits bei jedem Versand über `notificationSettingsOf`)
- `onEnablePush` in den Einstellungen kann `usePushPermission` aus `apps/web/src/data/push.ts` nutzen
- Bilanz/Verlauf: Ergebnis aufgegebener Partien steht in `ParticipantState.surrender`

## Angewandte Standards

Noch keine.
