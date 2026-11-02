# Standards für Kampfregeln

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`): keine Semikolons, einfache Anführungszeichen, Zeilenbreite 100; `pnpm lint` prüft.
- TypeScript `strict` (`tsconfig.base.json`); `pnpm typecheck` über alle Pakete.
- Regeln liegen ausschließlich im gemeinsamen Paket `packages/shared/src/game/`, der Server prüft maßgeblich, der Client nutzt dieselben Funktionen für Vorschau und Anzeige (`agent-os/product/tech-stack.md`).
- Engine-Tests mit Vitest in `engine/__tests__/`, deterministisch über `state.rng`.
