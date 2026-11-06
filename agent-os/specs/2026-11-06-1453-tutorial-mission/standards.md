# Standards für die Tutorial-Mission

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`): keine Semikolons, einfache Anführungszeichen, Zeilenbreite 100; `pnpm lint` prüft.
- TypeScript `strict`; Typecheck je Paket einzeln (`pnpm -r typecheck` stirbt mit SIGKILL).
- Die Spielfeld-Komponenten bekommen keine Einstellungen direkt; Einstellungen werden in `pages/MatchPage.tsx` bzw. `settings/BoardSettingsLayer.tsx` in Props oder CSS-Klassen übersetzt.
- Web-Tests mit Vitest und Testing Library, Server-Tests mit Vitest gegen Postgres, Engine-Tests in `packages/shared/src/game/engine/__tests__/`.
- Komponenten über dem Router abonnieren keine Spieler-Queries (Query-Cache wird beim Login geleert).
