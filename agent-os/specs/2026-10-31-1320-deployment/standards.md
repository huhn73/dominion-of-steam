# Standards für das Deployment

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`): keine Semikolons, einfache Anführungszeichen, Zeilenbreite 100; `pnpm lint` prüft auch YAML und Markdown.
- TypeScript `strict`; `pnpm typecheck` über alle Pakete.
- Konfiguration über Umgebungsvariablen mit Vorgaben im Code; Vorlagen in `apps/server/.env.example` (lokal) und `deploy/.env.example` (Produktion). Keine Geheimnisse im Repo, `.env` ist in `.gitignore`.
- Server-Tests mit Vitest gegen `TEST_DATABASE_URL`, übersprungen ohne Datenbank.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
