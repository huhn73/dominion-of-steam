# Referenzen für Spielabschluss

### Rundenbericht

- **Ort:** `apps/web/src/sections/spielfeld/components/Rundenbericht.tsx`, Einbau in `Spielfeld.tsx` (State `report`, Overlay-Wrapper)
- **Bezug:** Karte mit Kopf, scrollbarem Körper und Fußzeile (`primary`/`secondary`), Platzierung als Bottom-Sheet bzw. Desktop-Karte.

### Lobby „Beendet“

- **Ort:** `apps/web/src/sections/lobby/components/Lobby.tsx` (`RESULT_STAMP`, Karte der beendeten Partie), `packages/shared/src/lobby/types.ts` (`FinishedMatch`)
- **Bezug:** Stempel-Klassen und Wortwahl (Sieg, Niederlage, Aufgegeben), Platz-Angabe.

### Regel-Engine

- **Ort:** `packages/shared/src/game/engine/victory.ts` (`finishMatch`, `score`), `engine/view.ts` (Projektion von `result`, Phase `waiting` für beendete Partien), `engine/surrender.ts`
- **Bezug:** Reihenfolge der Platzierungen, Punkteformel, Kennzeichnung aufgegebener Sitze.

### Kopfzeile und Daten

- **Ort:** `apps/web/src/data/match.ts` (`gameHeaderFor`, `useMatchView` mit `refetchInterval`), `layouts/GameLayout.tsx`
- **Bezug:** Status in der Spiel-Kopfzeile, Polling, Aufgeben nur ohne Ergebnis.

### Tests

- **Ort:** `apps/web/src/sections/spielfeld/Spielfeld.test.tsx` (`renderBoard`, `sample-data.json` mit vier Teilnehmern, einer ausgeschieden), `apps/web/src/pages/MatchPage.test.tsx` (`demoView`, Sieg-Ton)
- **Bezug:** Muster für Spielfeld- und Seiten-Tests.
