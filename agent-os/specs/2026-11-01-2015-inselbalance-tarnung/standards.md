# Standards für Inselbalance, Träger und Tauchboot-Tarnung

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Regeln liegen in `packages/shared`; der Server liefert nur die Projektion (`projectView`), der Client erfährt von getarnten Einheiten nichts.
- Sichtregeln an einer Stelle (`engine/visibility.ts`), alle Verwender rufen sie auf.
- Jede Regel- und KI-Änderung bekommt Tests (`engine/__tests__/tarnung.test.ts`, `ai.test.ts`) und wird mit `pnpm sim` nachgemessen.
- Determinismus: keine neuen Zufallsquellen außer `random(state)`.
- Prettier, `pnpm lint`, Typecheck je Paket; Doku Deutsch, Kommentare Englisch; Commits mit expliziten Pfaden.
