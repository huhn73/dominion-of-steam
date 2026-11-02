# Standards für KI-Regeln je Stufe und Fraktion

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Die KI handelt nur über `applyCommand` und sieht nur ihre eigene Sicht (`knowledge`); keine Abkürzungen über den vollen Spielstand außer für die Kampfvorschau (`combatOdds`), wie bisher.
- Jede Verhaltensänderung bekommt einen Test in `engine/__tests__/ai.test.ts` und wird mit `pnpm sim` gegen die Serien in `packages/sim/configs/` nachgemessen; Vorher- und Nachher-Werte stehen in `agent-os/product/ki-balance.md`.
- Determinismus: alle Zufallswerte über `random(state)`; Tests setzen `state.rng`.
- Prettier, `pnpm lint`, `pnpm typecheck`; Vitest in shared und sim.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
