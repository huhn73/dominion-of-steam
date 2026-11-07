# Standards for Konten, Profil und Freunde

Im Projekt gibt es kein `agent-os/standards/`. Diese Projektregeln gelten:

- **Typecheck je Paket:** `pnpm -r typecheck` stirbt mit SIGKILL. Geprüft wird deshalb einzeln: shared, sim, server, web.
- **Fehler:** `LocalizedError` / `sendError` (`apps/server/src/locale.ts`) mit Schlüsseln aus `packages/shared/src/i18n/{de,en}/errors.json`.
- **Texte:**
  - Jeder Text für Spieler steht in beiden Sprachen in den Wörterbüchern.
  - Der Wächtertest `apps/web/src/i18n/noInlineGerman.test.ts` verbietet Inline-Texte.
- **Formatierung:** Die CI prüft mit `prettier --check .`.
- **Migrationen:** `pnpm db:generate` erzeugt `apps/server/drizzle/NNNN_<name>.sql`.
- **Release und Push:**
  - Neuigkeiten kommen in den gesammelten Eintrag 0.11.0, das Datum wird erst beim Release gesetzt.
  - Gepusht wird nur nach Rückfrage.
