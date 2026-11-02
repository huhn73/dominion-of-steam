# Referenzen für die Nutzungsübersicht

- **Auth/preHandler:** `apps/server/src/session.ts` (`requireAuth`, `notAuthenticated`)
- **Routen:** `apps/server/src/routes/profile.ts`, `routes/dev.ts`; Verdrahtung in `apps/server/src/app.ts`
- **SQL-Muster:** `apps/server/src/profile/service.ts` (Drizzle mit `sql\`count(*)::int\``)
- **Seite und Ladezustände:** `apps/web/src/pages/profil/ProfilePage.tsx`, `PageState`
- **UI-Bausteine:** `apps/web/src/sections/profil/components/ui.tsx` (`Segmented`, `Avatar`), `format.ts`
- **Menü:** `apps/web/src/shell/UserMenu.tsx`, `apps/web/src/layouts/MenuLayout.tsx`
- **Testdaten:** `apps/server/src/auth/devAccounts.ts` (`@dominion.test`), `DEMO_MATCH_ID` in `apps/server/src/matches/service.ts`
