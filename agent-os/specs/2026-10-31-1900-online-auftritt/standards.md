# Standards für Online-Auftritt

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`), `pnpm lint`; `shell/AppShell.tsx` und `shell/UserMenu.tsx` stehen in `.prettierignore` (Design-Übergabe) und bekommen nur je eine optionale Prop (`footer`, `onOpenLegal`). Neue Dateien (`MenuFooter`, `pages/rechtliches/*`) sind normal formatiert.
- Öffentliche Seiten stehen in `router.tsx` vor `RequireAuth`; Pfade in `routes.ts`.
- Statische Dateien liegen in `public/` an der Repo-Wurzel (Vite `publicDir`), der Server liefert sie aus `apps/web/dist`.
- Keine Anfragen an Dritte aus dem Browser (Schriften gebündelt).
- Web-Tests mit Vitest, Testing Library und `renderApp` (`{ user: null }` für ausgeloggte Seiten); Dateiprüfungen über `process.cwd()` wie in `audio/ids.test.ts`.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
