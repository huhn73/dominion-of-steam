# Konten, Teil 2: Shaping-Notizen

## Umfang

Roadmap Phase 2, Punkt „Konten“, umgesetzt in der Wartezeit auf den netcup-Server. Betroffen: gemeinsame Regeln (`packages/shared/src/account`), Server (Konto-Service, Token-Tabelle, Routen, Mail-Vorlage, Rate-Limiting, Sweeper), Web (zwei neue Seiten, Hinweis-Kasten, Einstellungen). Mailversand läuft seit der Deployment-Spec über Mailjet, lokal über Mailpit.

## Entscheidungen

- **E-Mail-Bestätigung weich:** Konto sofort nutzbar, auch im Mehrspieler. Bis zur Bestätigung gehen keine E-Mail-Benachrichtigungen raus (`deliverEmail` storniert), Push bleibt. Hinweis-Kasten in der Lobby und Badge in den Einstellungen mit „Erneut senden“. Verworfen: harte Bestätigung vor der Anmeldung (Hürde für den ersten Playtest), Bestätigung nur für Mehrspieler.
- **Passwort vergessen:** Antwort immer 200, damit niemand erfährt, ob eine Adresse registriert ist. Der Link gilt 60 Minuten und einmal. Das neue Passwort meldet auf diesem Gerät an, beendet alle anderen Sitzungen und bestätigt die Adresse mit (der Nutzer hat gerade bewiesen, dass er sie liest). Verworfen: Links nur an bestätigte Adressen (wer sich vertippt hat, wäre ausgesperrt).
- **Hinweis-Mails:** an die alte Adresse, wenn eine E-Mail-Änderung wirksam wird, und an die aktuelle Adresse nach jeder Passwortänderung. Beide mit „Wenn du das nicht warst …“, Link zu „Passwort vergessen“ und Kontaktadresse `SUPPORT_EMAIL`. Best effort: Fehler werden geloggt, die Aktion schlägt nicht fehl.
- **Eine Token-Tabelle** `account_tokens` mit `purpose` (`verify_email`, `reset_password`, `change_email`) ersetzt `email_changes`; ein offener Token je Spieler und Zweck, SHA-256 statt Klartext wie bisher. Migration kopiert offene Änderungen und markiert bestehende Spieler als bestätigt.
- **Rate-Limiting** mit `@fastify/rate-limit` je IP, Speicher im Prozess (eine Instanz): Anmeldung 20 / 15 min, Registrierung 5 / h, Passwort vergessen 5 / h, Zurücksetzen 10 / h, Erneut senden 5 / h, E-Mail und Passwort ändern 10 / h, Konto löschen 5 / h. Dazu 2 Minuten Abstand je Konto zwischen zwei Bestätigungs- oder Reset-Mails (Mailjet-Kontingent 200 am Tag). In Tests aus, ein Test schaltet es gezielt ein. Antwort 429 `RATE_LIMITED` mit deutscher Wartezeit.
- **Konto löschen** gab es schon; neu ist das Passwort im Bestätigungsdialog (`DELETE /api/account` mit `currentPassword`).
- **Mail-Vorlage:** `renderMail` ersetzt die festverdrahtete „Zur Partie“-Vorlage, `mailFor` nutzt sie. Account-Mails haben einen eigenen Footer und zeigen den Link zusätzlich als Text.
- **Aufräumen:** Der Sweeper löscht stündlich abgelaufene Tokens und Sitzungen.

## Mailtexte

- Willkommen bei Dominion of Steam (Button „E-Mail-Adresse bestätigen“, 24 Stunden)
- Bestätige deine neue E-Mail-Adresse (Button „E-Mail-Adresse bestätigen“, 24 Stunden)
- Neues Passwort für Dominion of Steam (Button „Neues Passwort festlegen“, 60 Minuten)
- Deine E-Mail-Adresse wurde geändert (an die alte Adresse, nennt die neue, Button „Passwort zurücksetzen“)
- Dein Passwort wurde geändert (Button „Passwort zurücksetzen“)

## Out of scope

Moderation von Anzeigenamen (bleibt in der Roadmap), Zwei-Faktor-Anmeldung, Anmeldung über Dritte, Rate-Limiting je Konto über mehrere Instanzen.

## Kontext

- **Visuals:** Screenshots der Umsetzung in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 2, Punkt „Konten“.

## Angewandte Standards

Noch keine, siehe `standards.md`.
