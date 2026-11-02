# Referenzen für Spielerprofil & Einstellungen

### Design-Übergabe

- **Ort:** `product-plan/sections/spielerprofil-and-einstellungen/` (README, `components/`, `types.ts`, `sample-data.json`, `tests.md`, Screenshots), `product-plan/instructions/incremental/06-spielerprofil-and-einstellungen.md`
- **Bezug:** Komponenten, Datentypen, Abläufe, Leerzustände, Hinweise zur Umsetzung
- **Ort:** `product-plan/briefs/audio-brief.md`
- **Bezug:** Bedeutung der Regler Gesamt/Effekte/Musik/Umgebung (Ton wird noch nirgends abgespielt)

### Bisherige Specs

- **Ort:** `agent-os/specs/2026-10-30-2030-konten-und-anmeldung/`
- **Bezug:** Konten, Sitzungen (`dos_session`), scrypt-Passwörter, Abmelden/Überall abmelden
- **Ort:** `agent-os/specs/2026-10-30-2035-partie-setup/`
- **Bezug:** Ergebnisse der Engine (`winnerId`, `placement`, `citiesCaptured`, `unitsBuilt`)
- **Ort:** `agent-os/specs/2026-10-30-2123-lobby-und-multiplayer/`
- **Bezug:** Benachrichtigungs-Einstellungen (`notificationSettingsOf`), Push (`usePushPermission`), E-Mail über SMTP/Mailpit, Aufgeben (`ParticipantState.surrender`), Verlassen/Auflösen wartender Partien

### Code

- **Ort:** `apps/server/src/profile/`, `apps/server/src/routes/profile.ts`, `apps/server/src/auth/accounts.ts`, `apps/server/src/lobby/service.ts` (`takeOver`, `leave`), `packages/shared/src/profile/`, `apps/web/src/pages/profil/`, `apps/web/src/data/profile.ts`, `apps/web/src/settings/`
