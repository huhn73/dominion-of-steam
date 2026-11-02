# Standards für Ton

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`), `pnpm lint`; die Komponenten der Design-Übergabe (`sections/*/components`, `shell/AppShell.tsx`) stehen in `.prettierignore` und werden nur minimal angefasst (Cues, eine neue Prop).
- TypeScript `strict`; IDs als Literal-Typen, geprüft gegen `public/audio/manifest.json`.
- Komponenten spielen keinen Ton (Vorgabe `product-plan/instructions/incremental/02-spielfeld-and-zuge.md`); Sounds hängen an Callbacks und globaler Event-Delegation.
- Web-Tests mit Vitest, Testing Library und `renderApp` (liefert `audio` als `FakeEngine`).
- Doku auf Deutsch, Code-Kommentare auf Englisch.
