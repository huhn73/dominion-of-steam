# Referenzen

- `apps/server/src/notifications/service.ts`: Benachrichtigungen werden ebenfalls in der Transaktion vorgemerkt und danach zugestellt (`kick`)
- `apps/server/src/matches/service.ts`, `lobby/service.ts`, `lobby/sweeper.ts`, `setup/service.ts`: Schreibstellen
- `apps/server/src/session.ts`: `requireAuth`, `loadSession`
- `apps/web/src/data/lobby.ts`, `data/match.ts`: Abfragen und Polling-Intervalle
- `apps/web/src/auth/RequireAuth.tsx`: Einbindung unterhalb des Routers (Query-Cache wird beim Login geleert)
