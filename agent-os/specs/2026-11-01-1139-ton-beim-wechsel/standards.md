# Standards für Ton beim Wechsel

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`), `pnpm lint`, `pnpm typecheck`.
- Komponenten spielen keinen Ton; die Audio-Logik liegt in `apps/web/src/audio/` und `pages/useMatchAudio.ts`. Die Engine setzt Regeln wie „höchstens ein Musikstück“ selbst durch.
- Jede Methode des `AudioEngine`-Interfaces bekommt ein Gegenstück im `FakeEngine` (`audio/fakeEngine.ts`), damit App-Tests Aufrufe prüfen können.
- Web-Tests mit Vitest und Testing Library: Engine-Tests gegen den `FakeContext` in `audio/engine.test.ts`, App-Tests mit `renderApp` (`test/renderApp.tsx`) und `mockApi`.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
