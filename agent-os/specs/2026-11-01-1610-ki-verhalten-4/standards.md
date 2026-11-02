# Standards für KI-Verhalten, vierter Block

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Neue KI-Stellschrauben sind Profilfelder (`AiProfile`), damit sie per Sweep messbar sind; `PROFILE_KEYS` im Simulationspaket wird mitgezogen.
- Jede Verhaltensänderung bekommt Szenario-Tests in `engine/__tests__/ai.test.ts` und wird mit `pnpm sim` nachgemessen; Vorher und Nachher in `agent-os/product/ki-balance.md`.
- Determinismus: alle Zufallswerte über `random(state)`.
- Prettier, `pnpm lint`, `pnpm typecheck` je Paket; Vitest in shared und sim.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
