# References for Avatare

## Upload heute

- **Location:** `apps/server/src/routes/profile.ts` (`POST/DELETE /api/profile/avatar`), `apps/server/src/profile/service.ts` (`sniffImage`, `setAvatar`, `removeAvatar`, `deleteAvatarFile`, `deleteAccount`, `AVATAR_PATH`), `apps/server/src/app.ts` (Multipart-Limit, statische Auslieferung `/uploads/` mit Dauer-Cache)
- **Relevance:** Hier kommen Zuschnitt und Umrechnung hinein.
- **Key patterns:** Jeder Upload bekommt einen neuen Dateinamen (Cache-Busting), danach wird die alte Datei gelöscht.

## Tests

- **Location:** `apps/server/src/profile/profile.test.ts` (Avatar-Test mit Multipart-Helfer `upload`), `apps/web/src/pages/profil/Profil.test.tsx`, `apps/web/src/test/mockApi.ts`

## UI

- **Location:** `apps/web/src/sections/profil/components/ui.tsx` (`Sheet`, `Avatar`), `Profil.tsx` (Bearbeiten-Sheet mit Dateiauswahl), `apps/web/src/data/profile.ts` (`uploadAvatar`), `apps/web/src/pages/profil/ProfilePage.tsx`
- **Key patterns:** `Sheet` mit Escape und Fokusfalle (`useDialogFocus`), Toasts über `run(...)` in der ProfilePage

## Serverstart

- **Location:** `apps/server/src/index.ts` (Sweeper-Start, `listen`)
