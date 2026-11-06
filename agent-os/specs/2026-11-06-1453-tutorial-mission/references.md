# Referenzen für die Tutorial-Mission

### Demo-Partie „Die Kohleinseln“
- **Ort:** `packages/shared/src/game/engine/demo.ts`, `packages/shared/src/game/demo-data.json`, `apps/server/src/matches/service.ts` (`DEMO_MATCH_ID`, `resetDemo`)
- **Relevanz:** handgebauter `GameState` mit Städten, Einheiten, Sicht; Muster für `seedTutorial`.

### Solo-Partie gegen KI
- **Ort:** `apps/server/src/setup/service.ts#createSolo`, `apps/server/src/routes/dev.ts`
- **Relevanz:** wie eine Partie samt Sitzen für einen Spieler angelegt wird.

### KI-Züge
- **Ort:** `apps/server/src/matches/service.ts#runAITurns`, `packages/shared/src/game/engine/ai.ts#playAITurn`
- **Relevanz:** Einstieg für die passive Tutorial-KI.

### Ausschluss aus Statistiken
- **Ort:** `apps/server/src/admin/service.ts` (`realMatch`), `apps/server/src/profile/`, `apps/server/src/lobby/`
- **Relevanz:** Tutorial-Partien wie die Demo herausfiltern.

### Spielfeld und Dialoge
- **Ort:** `apps/web/src/sections/spielfeld/components/Spielfeld.tsx`, `HexMap.tsx`, `Partieabschluss.tsx`, `apps/web/src/sections/lobby/components/shared.tsx` (Sheet), `apps/web/src/pages/shared/toast.tsx`
- **Relevanz:** Einbau des Tutorial-Panels, Feld-Hervorhebung, Abschlusskarte, Erstangebot.
