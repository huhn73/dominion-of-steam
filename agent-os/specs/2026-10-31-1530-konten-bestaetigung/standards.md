# Standards für Konten, Teil 2

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`): keine Semikolons, einfache Anführungszeichen, Zeilenbreite 100; `pnpm lint` prüft.
- TypeScript `strict`; `pnpm typecheck` über alle Pakete.
- Prüfregeln und Texte für Client und Server einmal in `packages/shared` (`validatePassword`, TTLs).
- API-Fehler als `{ error: { code, message } }` mit deutschem Text; Routen ohne Login dürfen nichts über fremde Konten verraten.
- Tokens nur als SHA-256 in der Datenbank, Links einmal nutzbar.
- Server-Tests mit Vitest gegen `TEST_DATABASE_URL`, Mailer als Stub über `buildApp({ notifications })`; Web-Tests mit Testing Library und `mockApi`.
- Seiten der Design-Übergabe (`sections/*/components`) bleiben möglichst unverändert; neue Oberfläche in `pages/`.
