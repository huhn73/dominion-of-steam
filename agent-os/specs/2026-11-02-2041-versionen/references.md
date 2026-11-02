# Referenzen für Versionen

- **Fußzeilen:** `apps/web/src/shell/MenuFooter.tsx`, `apps/web/src/pages/anmeldung/AuthLayout.tsx` (Rechtslinks, daneben die Version)
- **Build-Werte:** Anbieterdaten als Muster: Repo-Variablen → `build-args` in `.github/workflows/deploy.yml` → `ARG` im `Dockerfile` → `import.meta.env.VITE_*` in `apps/web/src/pages/rechtliches/anbieter.ts`
- **Image-Tags:** `docker/metadata-action` in `deploy.yml` (`latest`, `sha-…`)
- **Health-Check:** `apps/server/src/app.ts` (`/api/health`), Test in `apps/server/src/app.test.ts`
