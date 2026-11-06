# Referenzen für KI-Züge als Hintergrundjob

### Worker-Pool der Simulation
- **Ort:** `packages/sim/src/pool.ts`, `packages/sim/src/worker.ts`, `packages/sim/src/__tests__/worker.test.ts`
- **Relevanz:** Worker-Threads mit `tsx`-Loader, Nachricht rein, Ergebnis oder Fehlertext raus.

### KI-Züge heute
- **Ort:** `apps/server/src/matches/service.ts` (`runAITurns`, `finishTurn`, `AI_TURN_BUDGET_MS`)
- **Relevanz:** Diese Schleife wandert in den Runner; Zughistorie und Fehlerverhalten bleiben.

### Sweeper
- **Ort:** `apps/server/src/lobby/sweeper.ts`
- **Relevanz:** Intervall-Hintergrundarbeit, Fristablauf ruft heute `runAITurns`; künftig `recover()`.

### Signale und Notifier
- **Ort:** `apps/server/src/realtime/signals.ts` (`signalMatch`), `apps/server/src/notifications/service.ts` (`enqueue`, `kick`)
- **Relevanz:** Signal und Benachrichtigung in der Transaktion, Zustellung nach dem Commit.

### Client-Kopfzeile
- **Ort:** `apps/web/src/data/match.ts` (`gameHeaderFor`, `useMatchView`)
