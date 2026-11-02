# Referenzen für Lobby & Multiplayer

### Design-Übergabe

- **Ort:** `product-plan/sections/lobby-and-multiplayer/` (README, `components/`, `types.ts`, `sample-data.json`, `tests.md`, Screenshots), `product-plan/instructions/incremental/05-lobby-and-multiplayer.md`
- **Bezug:** Komponenten, Datentypen, Abläufe, Leerzustände, Hinweise zur Umsetzung

### Profil & Einstellungen (06)

- **Ort:** `product-plan/sections/spielerprofil-and-einstellungen/types.ts`, `product-plan/instructions/incremental/06-spielerprofil-and-einstellungen.md`
- **Bezug:** `NotificationSettings` (Anlässe × Push/E-Mail, `emailDelayHours`), Regel „E-Mail nur offline“

### Bisherige Specs

- **Ort:** `agent-os/specs/2026-10-30-2035-partie-setup/`, `2026-10-30-2030-konten-und-anmeldung/`, `2026-10-30-1917-ki-und-kartengenerator/`
- **Bezug:** Datenmodell wartender Partien, `launchMatch`, Anwesenheit (Online-Fenster 2 Minuten), KI-Züge

### Code

- **Ort:** `apps/server/src/lobby/`, `apps/server/src/notifications/`, `apps/server/src/routes/lobby.ts`, `apps/server/src/routes/push.ts`, `packages/shared/src/lobby/`, `packages/shared/src/notifications/`, `apps/web/src/pages/lobby/`, `apps/web/src/data/lobby.ts`, `apps/web/src/data/push.ts`, `public/sw.js`
