# Spec: Spielerprofil & Einstellungen (Meilenstein 06)

## Kontext
Letzter Meilenstein der Design-Übergabe. Das Profil („Dienstakte“) zeigt Bilanz, Statistik je Fraktion und den Partieverlauf aus den gespeicherten Ergebnissen beendeter Partien; Anzeigename und Avatar sind änderbar. Die Einstellungen („Maschinenraum“) speichern Benachrichtigungen, Darstellung, Ton und Steuerung in `players.settings` und bündeln die Kontoverwaltung (E-Mail mit Bestätigungslink, Passwort, Abmelden, Konto löschen). Beide Seiten sind über das Benutzermenü der Shell erreichbar.

## Aufgaben
1. **Spec-Dokumentation speichern** (dieser Ordner)
2. **Shared:**
   - `packages/shared/src/profile/types.ts`: Datentypen der Übergabe unverändert
   - `packages/shared/src/profile/index.ts`: API-Formen (`ProfileData`, `SettingsData`, Anfragen), `DEFAULT_SETTINGS` (Benachrichtigungen aus `notifications`, Darstellung/Ton/Steuerung aus den Beispieldaten), `settingsOf` (mit Vorgaben zusammenführen), `validateSettings` (vollständige Form), `validateDisplayName`
   - Engine: `SurrenderInfo` merkt sich `citiesCaptured`/`unitsBuilt` beim Aufgeben (Bilanz zählt nur bis dahin)
3. **Server (Migration `0004_profil_einstellungen`):**
   - Tabelle `email_changes` (Token-Hash, neue Adresse, Ablauf 24 h)
   - `GET /api/profile?limit&cursor`, `PATCH /api/profile`, `POST|DELETE /api/profile/avatar` (`@fastify/multipart`, PNG/JPEG/WebP/GIF bis 2 MB, Ordner `UPLOADS_DIR`, ausgeliefert unter `/uploads/avatars/<datei>`)
   - `GET|PUT /api/settings`
   - `POST /api/account/email`, `GET /api/account/email/confirm?token=`, `POST /api/account/password`, `DELETE /api/account`
4. **Web:**
   - Komponenten unverändert in `apps/web/src/sections/profil/components/`, `types.ts` mit Re-Export und Props der Übergabe
   - Seiten `/profil` (Infinite Query für den Verlauf) und `/einstellungen` (entprellt speichern, Fehler als Toast und Neu-Mounten per `key`), alle Callbacks
   - Einstellungen anwenden: Farbschema (Server gewinnt, `localStorage` bleibt synchron), „Animationen reduzieren“ global, Kampfanimationen und Steuerung (rechte Maustaste, Zoom-Empfindlichkeit) über eine dünne Hülle um das Spielfeld, „Gegnerzüge automatisch abspielen“ aus → Wiederholung wird übersprungen
5. **Docker:** benanntes Volume `dos-uploads` unter `/app/uploads`
6. **Tests:** Server mit Datenbank (Bilanz, Verlauf mit Seiten, Name, Avatar, Einstellungen, E-Mail-Wechsel, Passwort, Konto löschen), Web (Abläufe aus tests.md, Anwenden der Einstellungen)
7. **Prüfen:** curl als Björn, Mailpit, Wegwerfkonto löschen, Screenshots hell/dunkel/Smartphone; README und Roadmap aktualisieren
