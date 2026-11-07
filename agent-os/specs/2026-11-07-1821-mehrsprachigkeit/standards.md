# Standards for Mehrsprachigkeit

Im Projekt gibt es kein `agent-os/standards/`. Für diese Arbeit gelten diese Projektregeln:

- **Typecheck je Paket:** `pnpm -r typecheck` stirbt mit SIGKILL, deshalb wird jedes Paket einzeln geprüft (`@dos/shared`, `@dos/server`, `@dos/web`).
- **Fehlerantworten:** Das Format bleibt `{ error: { code, message } }`. Die Meldung wird künftig in der Sprache der Anfrage gesendet, der `code` bleibt stabil.
- **Migrationen:** `apps/server/drizzle/NNNN_<name>.sql` werden mit `pnpm db:generate` erzeugt, Backfills kommen bei Bedarf von Hand dazu (wie in `0009_neuigkeiten.sql`).
- **Query-Cache:** Komponenten über dem Router abonnieren keine Spieler-Queries, weil der Cache beim Login geleert wird. Der `LocaleProvider` hält deshalb nur lokalen Zustand.
- **Release und Neuigkeiten:** Die Neuigkeit kommt in den gesammelten NEWS-Eintrag 0.11.0. Das Datum wird erst beim Release gesetzt, und der Release kommt nur nach Rückfrage.
- **Push:** `main` deployt live, gepusht wird nur nach Rückfrage, sonst nach `main:dev`.
