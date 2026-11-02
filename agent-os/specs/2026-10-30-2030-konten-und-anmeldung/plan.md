# Spec: Konten & Anmeldung

## Kontext
Die Meilensteine 04 (Partie-Setup mit Freunden und Einladungen), 05 (Lobby & Multiplayer mit Warteraum) und 06 (Profil & Einstellungen mit E-Mail- und Passwortwechsel, „Überall abmelden“, Konto löschen) brauchen echte Spielerkonten. Bisher ist jede Anfrage der feste Dev-Spieler `p1` (`currentPlayer(req)` in `apps/server/src/session.ts`). Dieser Zwischenmeilenstein führt Konten, Sitzungen und Freundschaften ein. Für die Anmeldung gibt es kein Design in der Übergabe; die Seiten folgen dem Stil der Shell.

## Aufgaben
1. **Spec-Dokumentation speichern** (dieser Ordner)
2. **Datenbank (Drizzle, Migration `0001_konten`):**
   - `players`: id (UUID), display_name (eindeutig ohne Groß-/Kleinschreibung), email (eindeutig, klein geschrieben), password_hash, avatar_url, settings (jsonb, für 06), created_at, last_seen_at, last_seen_match_id
   - `sessions`: id = SHA-256 des Tokens, player_id (Cascade), created_at, last_used_at, user_agent
   - `friendships`: player_id, friend_id (beide Cascade), created_at; beide Richtungen gespeichert
3. **Server:**
   - Passwörter mit `crypto.scrypt` (Salz, zeitkonstanter Vergleich)
   - `POST /api/auth/register|login|logout|logout-all`, `GET /api/me`, `GET /api/friends`, `POST /api/friends { name }`
   - Cookie `dos_session` (httpOnly, SameSite=Lax, Pfad `/`, 30 Tage, `secure` nur in Produktion über https)
   - `currentPlayer(req)` liest die Sitzung (async); alle Partie- und Dev-Routen verlangen eine Anmeldung (401 `NOT_AUTHENTICATED`)
   - Aktivität (`last_seen_at`, `last_seen_match_id`) und Anwesenheit (`online`, `inGame`, `offline`)
   - Dev-Konten beim Start (idempotent), Björn mit allen befreundet
   - Demo-Partie mit den Spieler-IDs von Björn (`p1`) und Lena (`p3`); Solo-Partien mit dem angemeldeten Spieler
4. **Engine:** `seedDemo(id, now, mapping)` mit `remapParticipants` für alle Verweise auf Teilnehmer
5. **Web:**
   - Seiten `/anmelden` und `/registrieren` außerhalb der Shell, mit Prüfung der Eingaben und Serverfehlern, danach Weiterleitung zu `?weiter=`
   - Zugangsschutz `RequireAuth` um alle übrigen Routen; `useCurrentUser()` aus `GET /api/me`
   - Jede 401-Antwort führt zur Anmeldung; Abmelden über das Benutzermenü
6. **Tests:** Engine (Umschlüsselung), Server (Konten, Sitzungen, Freunde, Anwesenheit, Demo aus Sicht von Björn und Lena, 401 ohne Sitzung), Web (Formulare, Weiterleitung, Zugangsschutz, Abmelden)
7. **Prüfen:** Docker neu bauen, Ablauf mit curl, Screenshots der Anmeldung hell, dunkel und auf dem Smartphone
