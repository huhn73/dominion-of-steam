# Referenzen für das Deployment

### Container-Image

- **Ort:** `Dockerfile`, `docker-compose.yml` (lokal), `.dockerignore`
- **Bezug:** Ein Image für Web und Server; Build-Argument `DEV_TOOLS`, Healthcheck auf `/api/health`.

### Start und Migrationen

- **Ort:** `apps/server/src/index.ts` (`runMigrations`, `devToolsEnabled`, Sweeper), `apps/server/src/db/client.ts`
- **Bezug:** Migrationen laufen beim Start, daher kein eigener Schritt in der Deploy-Kette; ohne `DEV_TOOLS` keine Demo-Daten.

### Reverse-Proxy und Cookie

- **Ort:** `apps/server/src/app.ts` (`Fastify({ trustProxy })`), `apps/server/src/session.ts` (`setSessionCookie`), `apps/server/src/routes/setup.ts` (`requestOrigin`), Test in `apps/server/src/auth/auth.test.ts`
- **Bezug:** `TRUST_PROXY=true` macht `req.protocol` hinter Caddy zu `https`, Cookie wird `Secure`; `requestOrigin` liest `x-forwarded-*` für Links in Mails, wenn `PUBLIC_URL` fehlt.

### Mail und Push

- **Ort:** `apps/server/src/notifications/channels.ts` (`smtpMailer`, `vapidKeys`, `webPushSender`)
- **Bezug:** `SMTP_URL` zeigt in Produktion auf Mailjet, `MAIL_FROM` auf `noreply@huhn73.de`; VAPID-Schlüssel entstehen beim ersten Bedarf in `app_config`.

### Produktion

- **Ort:** `deploy/docker-compose.yml`, `deploy/Caddyfile`, `deploy/.env.example`, `deploy/backup-uploads.sh`, `deploy/offsite-backup.sh`, `deploy/README.md`
- **Bezug:** Dienste caddy, db, app, backup; Anleitung für netcup, Cloudflare, Mailjet, GitHub-Secrets, Backups und Rollback.

### Deploy-Kette

- **Ort:** `.github/workflows/deploy.yml`
- **Bezug:** Jobs test (Postgres-Service), build (GHCR, `latest` und `sha-*`), deploy (SSH, `docker compose pull && up -d`).
