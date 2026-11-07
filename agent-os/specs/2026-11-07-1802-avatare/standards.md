# Standards for Avatare

Im Projekt gibt es kein `agent-os/standards/`. Für diese Arbeit gelten diese Projektregeln:

- **Typecheck je Paket:** `pnpm -r typecheck` stirbt mit SIGKILL, deshalb wird jedes Paket einzeln geprüft (`@dos/shared`, `@dos/server`, `@dos/web`).
- **Content-Security-Policy** (`deploy/Caddyfile`): `img-src 'self' data: blob:` erlaubt die Vorschau über `URL.createObjectURL`. Neue Quellen müssen vorher als Report-Only getestet werden (`deploy/README.md`).
- **Fehlerantworten:** `{ error: { code, message } }` mit deutscher Meldung (`ProfileError`, `sendError` in `routes/profile.ts`).
- **Release und Neuigkeiten:** Die Neuigkeit kommt in den gesammelten NEWS-Eintrag 0.11.0. Das Datum wird erst beim Release gesetzt, und der Release kommt nur nach Rückfrage.
- **Push:** `main` deployt live, gepusht wird nur nach Rückfrage, sonst nach `main:dev`.
