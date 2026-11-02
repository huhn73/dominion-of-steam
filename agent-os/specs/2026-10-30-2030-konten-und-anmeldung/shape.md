# Konten & Anmeldung: Shaping-Notizen

## Umfang

Spielerkonten mit E-Mail und Passwort, Sitzungen per Cookie, Freundesliste mit Anwesenheit und eine schlichte Anmelde- und Registrierungsseite. Nicht enthalten: Passwort vergessen, E-Mail-Bestätigung, Profil- und Kontoverwaltung (06), Oberfläche zum Hinzufügen von Freunden (kommt mit 04/05), Rate-Limiting.

## Entscheidungen

- Der Nutzer hat um selbstständige Umsetzung ohne Rückfragen gebeten; die Entscheidungen sind hier festgehalten.
- **Spieler-ID = Teilnehmer-ID:** Menschliche Teilnehmer einer Partie tragen die Spieler-ID (UUID). `currentPlayer(req)` liefert sie direkt; die Engine bleibt unverändert. KI-Teilnehmer behalten IDs wie `ai1` bzw. `p2`/`p4` in der Demo.
- **Sitzungen:** Zufälliges Token (32 Byte) im Cookie, in der Datenbank nur sein SHA-256-Hash. Ablauf nach 30 Tagen ohne Nutzung (gleitend): `last_used_at` und das Cookie werden höchstens einmal pro Minute erneuert. Abgelaufene Sitzungen werden beim Zugriff und beim Serverstart gelöscht.
- **Cookie:** `secure` nur bei `NODE_ENV=production` und https-Anfrage, damit das Docker-Setup (http auf localhost) funktioniert. Ohne `trustProxy` gilt hinter einem TLS-Proxy die Anfrage als http; das ist beim Deployment nachzuziehen.
- **Passwörter:** scrypt (N=16384, r=8, p=1, 64 Byte, 16 Byte Salz), gespeichert als `scrypt$<N>$<salt>$<hash>`, damit die Kosten später erhöht werden können.
- **Fehler:** Falsche E-Mail und falsches Passwort ergeben dieselbe Meldung (`INVALID_CREDENTIALS`). Vergebene E-Mail (`EMAIL_TAKEN`) und Name (`NAME_TAKEN`) antworten 409 und erscheinen im Formular am Feld. Eingabefehler: 422 `INVALID_INPUT`. Die Prüfregeln liegen in `@dos/shared/account` und gelten in Client und Server.
- **Anwesenheit:** `online` = letzte Anfrage vor weniger als 2 Minuten, `inGame` = online und die Anfrage galt einer Partie (Sicht oder Befehl unter `/api/matches/:id/`), sonst `offline` mit `lastSeen`. Geschrieben wird höchstens einmal pro Minute, sofort aber beim Wechsel in eine Partie. Beim Verlassen einer Partie springt der Status deshalb bis zu einer Minute später auf `online`.
- **Freunde:** Beidseitig ohne Anfrage/Bestätigung; `POST /api/friends { name }` sucht nach dem Anzeigenamen (ohne Groß-/Kleinschreibung) und ist idempotent. Anfragen und Bestätigungen kommen bei Bedarf mit 04/05.
- **Dev-Konten:** Nur mit Dev-Werkzeugen, beim Start und beim Zurücksetzen der Demo angelegt (idempotent): Björn, Lena Hartmann und die Freunde aus den Beispieldaten von 04, alle mit Passwort `dampfmaschine`. Offline-Freunde erhalten ihr „zuletzt gesehen“ aus den Beispieldaten.
- **Demo-Partie:** `seedDemo(id, now, { p1: björn, p3: lena })`. Beim Start wird die Demo neu aufgesetzt, wenn Björn nicht Teilnehmer ist (alte Daten mit `p1` oder neu angelegte Konten). Alte Solo-Partien mit dem menschlichen Teilnehmer `p1` werden beim Start in der Entwicklung gelöscht, da sie keinem Konto mehr gehören.
- **Dev-Routen:** verlangen ebenfalls eine Anmeldung. „Mitspieler ziehen lassen“ beendet die Züge anderer Menschen, bis der angemeldete Spieler wieder am Zug ist.
- **Fremde Partien:** Angemeldete Spieler ohne Teilnahme erhalten 403; die Partieseite zeigt dann den Hinweis ohne „Erneut versuchen“. Neu registrierte Spieler sehen die Demo-Partie deshalb nicht.
- **Web:** Der Anmeldestatus ist die Query `['me']` (`null` = abgemeldet). Jede 401-Antwort einer Abfrage oder Mutation setzt sie auf `null`; `RequireAuth` leitet dann zu `/anmelden?weiter=<Pfad>`. `weiter` akzeptiert nur Pfade innerhalb der App. Nach dem Anmelden wird der Cache geleert, damit keine Daten eines anderen Kontos sichtbar bleiben.
- **Gestaltung:** Vollbild mit warmem Messinglicht und feiner Schraffur, Zahnrad-Medaillon und Wortmarke wie im Shell-Kopf, Karte mit Nieten und doppelter Trennlinie, Eingaben und Knöpfe 44 px hoch, Passwort ein-/ausblendbar.
- **Lobby-Badge:** `useYourTurnCount` bleibt ein Platzhalter bis zur Lobby (05).

## Kontext

- **Visuals:** keine Vorlage in der Übergabe; Screenshots der Umsetzung in `visuals/` (Anmeldung hell, dunkel, Smartphone; Registrierung Smartphone dunkel)
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Grundlage für Freunde, Einladungen, Mehrspieler und Profil in 04–06

## Angewandte Standards

Noch keine.
