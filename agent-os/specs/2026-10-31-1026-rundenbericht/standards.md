# Standards für Rundenbericht

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Prettier (`.prettierrc.json`): keine Semikolons, einfache Anführungszeichen, Zeilenbreite 100; `pnpm lint` prüft.
- TypeScript `strict`; `pnpm typecheck` über alle Pakete.
- Die Spielfeld-Komponenten bekommen keine Einstellungen direkt; Einstellungen werden in `pages/MatchPage.tsx` bzw. `settings/BoardSettingsLayer.tsx` in Props oder CSS-Klassen übersetzt.
- Web-Tests mit Vitest und Testing Library, Beispieldaten aus `product-plan/sections/spielfeld-and-zuge/sample-data.json`.
