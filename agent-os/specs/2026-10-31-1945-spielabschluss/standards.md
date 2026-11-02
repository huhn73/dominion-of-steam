# Standards für Spielabschluss

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`), `pnpm lint`; `sections/spielfeld/components/` steht in `.prettierignore` (Design-Übergabe). `Spielfeld.tsx` bekommt nur den Einbau (State, Overlay, Pille, Beschriftung), die Karte ist eine eigene Datei im Stil von `Rundenbericht.tsx`.
- Regeln und Ableitungen (`matchOutcome`, `participantScore`) liegen in `packages/shared`, nicht im Client.
- Komponenten spielen keinen Ton; der Abschluss-Ton bleibt in `pages/useMatchAudio.ts`.
- Web-Tests mit Vitest und Testing Library: `renderBoard` in `sections/spielfeld/Spielfeld.test.tsx`, `renderApp` + `demoView` in `pages/MatchPage.test.tsx`; Shared-Tests unter `src/game/__tests__/`.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
