# Standards für KI-Verhalten, dritter Block

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Regeländerungen (Eisenbund-Bonus) gehören in die Stammdaten `packages/shared/src/compendium/data.json` und eine gemeinsame Funktion (`game/bonus.ts`); der Kompendium-Client (`bonusEffect`) rechnet identisch, geprüft durch `Kompendium.test.tsx` „rechnet im Kompendium genauso wie im Spiel“.
- `sections/fraktionen/components/` ist Design-Übergabe: nur die nötige Zeile in `theme.ts`.
- Jede Verhaltensänderung bekommt Szenario-Tests in `engine/__tests__/ai.test.ts` und wird mit `pnpm sim` nachgemessen; Vorher und Nachher in `agent-os/product/ki-balance.md`.
- Determinismus: alle Zufallswerte über `random(state)`.
- Prettier, `pnpm lint`, `pnpm typecheck` je Paket; Vitest in shared, web und sim.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
