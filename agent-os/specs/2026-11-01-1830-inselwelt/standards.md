# Standards für Echte Inselwelt

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Regeln und Generator liegen in `packages/shared`; eine Quelle je Stammdatum (`game/worldShapes.ts` wie `game/mapSizes.ts`).
- Determinismus: gleicher Kartencode plus gleiche Einstellungen = gleiche Welt; bestehende Kartencodes bleiben bei der Vorgabe identisch (goldene Hashes vor der ersten Generatoränderung festgeschrieben). Keine `Math.random`, keine Iteration über ungeordnete Mengen, Sortierungen mit Index-Tiebreak.
- Übergabe-Komponenten (`setup/types.ts`, `StepMap.tsx`, `StepSummary.tsx`, `Warteraum.tsx`, `MatchDialogs.tsx`, `lobby/types.ts`) nur funktional minimal anfassen, keine Formatierung.
- Neue Felder optional mit Vorgabe, damit alte Entwürfe, JSONB-Zeilen und Fixtures weiterlaufen.
- Jede Garantie bekommt einen Test (`engine/__tests__/inselwelt.test.ts`) und ein Messwerkzeug (`pnpm sim maps`); Laufzeitgrenze Imperium < 2 s.
- Prettier, `pnpm lint`, Typecheck je Paket; Vitest in shared, server, web und sim.
- Doku auf Deutsch, Code-Kommentare auf Englisch. Commits mit explizit benannten Pfaden.
