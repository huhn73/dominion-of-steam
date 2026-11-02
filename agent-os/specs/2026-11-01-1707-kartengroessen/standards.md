# Standards für Kartengrößen

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Eine Quelle je Stammdatum: Kartenstufen nur in `packages/shared/src/game/mapSizes.ts`; Setup, Server, Lobby, DevBar und Tests lesen von dort.
- Regeln und Codierung liegen in `packages/shared` (`bits.ts`, `mapcodec.ts`, `hex.ts`), Client und Server bauen keine eigenen Feldlisten.
- Determinismus: Zufall nur über `random(state)` bzw. den Generator-Seed; Zeitlimits nur als Ventil außerhalb der Tests.
- `sections/spielfeld/components/` ist Design-Übergabe (`.prettierignore`): nur funktionale Einbauten.
- Prettier, `pnpm lint`, `pnpm typecheck`; Vitest in shared, server, sim und web. Lange Simulationen hinter Timeout-Angaben.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
