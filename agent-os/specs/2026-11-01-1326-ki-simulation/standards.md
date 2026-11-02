# Standards für KI-Simulation und Parameter-Sweep

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Regeln und KI liegen in `packages/shared`; die Simulation in `packages/sim` ändert an der Engine nur die zwei Hooks in `playAITurn` und bleibt sonst Konsument der öffentlichen Exporte (`@dos/shared/engine`, `@dos/shared/game/*`, `@dos/shared/setup/*`).
- Determinismus: feste Uhr (`NOW`), alle Zufallswerte aus `random(state)`; gleiche Konfiguration liefert gleiche Rohdaten bis auf Zeitmessungen.
- Node-Typen und Worker-Threads nur in `packages/sim` (tsconfig `types: ["node"]`), nie in `packages/shared`.
- Prettier, `pnpm lint`, `pnpm typecheck`; Vitest in `packages/sim` wie in den anderen Paketen.
- Doku und Berichte auf Deutsch, Code-Kommentare auf Englisch.
- Generierte Rohdaten (`packages/sim/results/`) werden nicht committet; Berichte unter `agent-os/product/ki-simulation/` schon.
