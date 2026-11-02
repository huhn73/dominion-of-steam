# Standards für Kampfsystem mit Trefferpunkten

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Regeln, Wahrscheinlichkeiten und Ableitungen liegen in `packages/shared` (`game/rules.ts`, `engine/combat.ts`), nicht im Client; der Client-Fallback in `hex.ts` nutzt dieselbe Funktion.
- `sections/spielfeld/components/` ist Design-Übergabe (`.prettierignore`): nur die nötigen Einbauten, keine Umstrukturierung.
- Komponenten spielen keinen Ton; Cues gehen über `onCue`.
- Determinismus: alle Zufallswerte über `random(state)`; Tests setzen `state.rng`.
- Prettier, `pnpm lint`, `pnpm typecheck`; Vitest in shared und web.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
