# Spec: Lobby & Multiplayer (Meilenstein 05)

## Kontext
Die Lobby („Lagebericht“) wird Startseite der App: eigene Partien nach Zustand, Einladungen, offene und beendete Partien, Push-Banner. Wartende Partien aus 04 bekommen den echten Warteraum mit Bereit-Status, Start durch den Ersteller und Einladungslink. Dazu kommen Benachrichtigungen (Web-Push, E-Mail), durchgesetzte Zugfristen und Aufgeben. Meilenstein 06 baut die Einstellungs-Oberfläche für die Benachrichtigungen.

## Aufgaben
1. **Spec-Dokumentation speichern** (dieser Ordner)
2. **Shared:** Datentypen der Übergabe unverändert in `packages/shared/src/lobby/types.ts`; Regeln (`REMIND_COOLDOWN_HOURS`, `remindLocked`, `startBlockers`, Mini-Karten-Auflösung) und API-Formen; `packages/shared/src/notifications/` mit `NotificationSettings`, Vorgaben und `notificationSettingsOf`; Engine: `surrender`, `endIfNoHumans`, `miniMap`, `ParticipantState.surrender`
3. **Server (Migration `0003_lobby_multiplayer`):**
   - Tabellen `reminders`, `push_subscriptions`, `app_config`, `notifications` (zugleich Outbox), Spalte `match_seats.free_kind`
   - `GET /api/lobby`, `GET /api/matches/:id/room` (Form `WaitingRoom`), Aktionen remind, surrender, accept/decline, join, invite-Link, ready, start, leave
   - Benachrichtigungsdienst (Push über `web-push`, E-Mail über `nodemailer`/`SMTP_URL`), Auslöser bei Zugwechsel, Einladung, Start, Ende, Erinnerung, Auflösen
   - Hintergrund-Sweeper (alle 15 s): abgelaufene Züge beenden, „Frist läuft bald ab“, Zustellung
   - Plätze älterer Partien beim Start ergänzen (`backfillSeats`)
4. **Web:** Komponenten unverändert in `apps/web/src/sections/lobby/components/`; Seiten Lobby (`/`), Warteraum (`/warteraum/:id`), Einladungslink (`/einladung/:token`); Polling; Push (Service Worker `public/sw.js`); Badge aus der Lobby; „Aufgeben“ im Spielmenü
5. **Docker:** Mailpit (SMTP 1025, Oberfläche http://localhost:8025)
6. **Tests:** Engine (Aufgeben, Mini-Karte), Server mit Datenbank (alle Aktionen, Sperre, Rennen um den letzten Platz, Start-Bedingung, Verlassen, Aufgeben, Sweeper, Einstellungen, verzögerte E-Mail, Push-API), Web (Abläufe aus tests.md)
7. **Prüfen:** curl mit zwei Konten, Mailpit, Screenshots hell/dunkel/Smartphone
