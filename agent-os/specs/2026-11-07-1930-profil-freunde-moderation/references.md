# References for Konten, Profil und Freunde

- **Profil:**
  - Server: `apps/server/src/profile/service.ts` (`playedMatch` :107, `getProfile` :229, Cursor :148) und `apps/server/src/routes/profile.ts`
  - Web: `apps/web/src/data/profile.ts` (`useProfile`), `apps/web/src/pages/profil/ProfilePage.tsx`, `apps/web/src/sections/profil/components/Profil.tsx`
- **Ähnliche Logik:** `apps/server/src/lobby/service.ts` (`finishedMatch` :357)
- **Freunde:**
  - Datenbank: `apps/server/src/db/schema.ts` (`friendships`)
  - Server: `apps/server/src/auth/accounts.ts` (`listFriends`, `addFriend`, `addFriendByName`), `apps/server/src/routes/auth.ts` (`/api/friends`)
  - Web: `apps/web/src/sections/partie-setup/components/Pickers.tsx` (`FriendPicker`)
- **Benachrichtigungen:**
  - Server: `apps/server/src/notifications/service.ts` (`EVENT_OF`), `apps/server/src/notifications/events.ts`
  - Shared: `packages/shared/src/notifications/index.ts`
- **Echtzeit:** `apps/server/src/realtime/signals.ts`, `packages/shared/src/realtime/index.ts`, `apps/web/src/data/events.ts`
- **Namen:** `packages/shared/src/account/index.ts` (`validateRegistration`), `packages/shared/src/profile/index.ts` (`validateDisplayName`)
- **Muster für den Nachtrag beim Start:** die Avatar-Umrechnung in `apps/server/src/index.ts`
