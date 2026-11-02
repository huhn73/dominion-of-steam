# Spec: Deployment auf dominion.huhn73.de

## Context

Alle zwölf Specs sind umgesetzt, das Spiel läuft bisher nur lokal (`docker compose` mit Postgres, Mailpit und App auf Port 8080). Der Nutzer will es jetzt ins Netz stellen; parallel arbeitet er am Ton, der später als Assets in `public/` dazukommt und keine Infrastruktur-Änderung braucht. Entscheidungen aus dem Shaping:

- **Hoster:** netcup VPS Lite 1 G12.5s (2 vCPU x86, 4 GB RAM, 80 GB SSD, 5,86 €/Monat, 6 Monate Mindestlaufzeit), Ubuntu 24.04 mit Docker, Standort Nürnberg oder Wien, Netzwerkoption **IPv4 und IPv6** (nicht „nur IPv6“). Hetzner war nicht verfügbar. netcup hat keine Cloud-Firewall und keine automatischen Backups, dafür Snapshots im Server Control Panel (SCP); Firewall und Backups laufen deshalb auf dem Server selbst. Lite-Tarife haben reduzierte Bandbreite, für ein Rundenspiel mit kleinen JSON-Antworten unerheblich.
- **Domain:** `dominion.huhn73.de`, A-Record in Cloudflare als DNS-only (graue Wolke), Zertifikat per Let's Encrypt direkt auf dem Server
- **Mail:** Mailjet SMTP-Relay (ursprünglich Brevo, dort SMTP-Freischaltung erst nach Support-Prüfung), Absender `noreply@huhn73.de`, SPF/DKIM in Cloudflare
- **Deploy-Kette:** GitHub Actions → Tests → Image in die GitHub Container Registry (GHCR) → per SSH `docker compose pull && up -d` auf dem Server

Was das Repo heute schon mitbringt und wiederverwendet wird:

- `Dockerfile`: baut Web und Server in einen Container, aber mit `VITE_DEV_TOOLS=true` und `DEV_TOOLS=true` fest verdrahtet, Laufzeit `tsx src/index.ts`
- `apps/server/src/index.ts`: führt Migrationen beim Start aus (`runMigrations`), kein separater Migrationsschritt nötig
- `GET /api/health` existiert (getestet in `apps/server/src/app.test.ts`)
- Mail: `smtpMailer()` in `apps/server/src/notifications/channels.ts` liest `SMTP_URL` und `MAIL_FROM`; ohne `SMTP_URL` kein Versand
- Web-Push: VAPID-Schlüssel werden einmal erzeugt und in `app_config` gespeichert, `VAPID_SUBJECT` optional
- Links in Mails: `PUBLIC_URL` (`requestOrigin` in `apps/server/src/routes/setup.ts` wertet sonst `x-forwarded-*` aus)
- `devToolsEnabled()` in `apps/server/src/app.ts`: in Produktion ohne `DEV_TOOLS=true` keine Demo-Konten, keine Dev-Endpunkte

**Lücke im Code:** `apps/server/src/session.ts:18` setzt das Cookie nur `secure`, wenn `req.protocol === 'https'`. Hinter dem Reverse-Proxy sieht Fastify http, solange `trustProxy` nicht gesetzt ist. Ohne diese Änderung läuft das Sitzungs-Cookie in Produktion ohne Secure-Flag.

## Task 1: Spec-Dokumentation ablegen

`agent-os/specs/2026-10-31-HHMM-deployment/` nach dem Muster der anderen Specs: `plan.md` (dieser Plan), `shape.md` (Entscheidungen oben, Out of scope: Echtzeit/WebSockets, Multi-Instanz, CDN, Staging-Umgebung, Sound), `standards.md`, `references.md` (Dockerfile, `channels.ts`, `session.ts`, `setup.ts requestOrigin`, `index.ts` Startreihenfolge). Keine Visuals nötig.

## Task 2: Code-Änderungen im Repo

### 2a `Dockerfile` produktionsfähig machen

- Build-Argument `ARG DEV_TOOLS=false`; `ENV VITE_DEV_TOOLS=$DEV_TOOLS` vor dem Web-Build, `ENV DEV_TOOLS=$DEV_TOOLS` zur Laufzeit. Das lokale `docker-compose.yml` bekommt `build: { context: ., args: { DEV_TOOLS: 'true' } }`, damit das lokale Verhalten gleich bleibt.
- `HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1` (busybox-wget ist in alpine da), Intervall 30 s, Startphase 20 s.
- Laufzeit bleibt `tsx` (funktioniert, Server importiert `@dos/shared` als TypeScript-Quelle). Multi-Stage/Image-Verkleinerung ist Phase 2.

### 2b `trustProxy` für den Reverse-Proxy

`apps/server/src/app.ts:56`: `Fastify({ logger, trustProxy: process.env.TRUST_PROXY === 'true' })`. In `deploy/.env.example` steht `TRUST_PROXY=true`. Damit wird `req.protocol` hinter Caddy `https` und das Cookie `secure`. Bestehender Test `auth.test.ts:86` (secure falsy ohne Proxy) bleibt gültig; neuer Test in `app.test.ts`: mit `TRUST_PROXY=true` und Header `x-forwarded-proto: https` ist das Cookie `Secure`.

### 2c Produktions-Compose unter `deploy/`

- `deploy/docker-compose.yml` mit vier Diensten:
  - `caddy` (Image `caddy:2-alpine`), Ports 80/443, Volumes `caddy_data`, `caddy_config`, Datei `deploy/Caddyfile`:
    ```
    dominion.huhn73.de {
      encode zstd gzip
      reverse_proxy app:3000
    }
    ```
    Caddy holt und erneuert das Let's Encrypt-Zertifikat selbst.
  - `db` (`postgres:17-alpine`), **kein** Port nach außen, Volume `db_data`, Passwort aus `.env`, Healthcheck wie lokal. Kein `db-init` (keine Test-DB in Produktion).
  - `app` (`image: ghcr.io/huhn73/dominion-of-steam:latest`), `env_file: .env`, Volume `uploads:/app/uploads`, `depends_on db healthy`, `restart: unless-stopped`. Kein Port nach außen, nur Caddy spricht mit ihm.
  - `backup` (`prodrigestivill/postgres-backup-local`), täglicher `pg_dump` in Volume `db_backups`, Aufbewahrung 7 Tage / 4 Wochen / 6 Monate.
- `deploy/.env.example` mit allen Variablen und Kommentaren:
  ```
  POSTGRES_PASSWORD=          # openssl rand -hex 24
  DATABASE_URL=postgres://dos:${POSTGRES_PASSWORD}@db:5432/dos
  PUBLIC_URL=https://dominion.huhn73.de
  TRUST_PROXY=true
  UPLOADS_DIR=/app/uploads
  SMTP_URL=smtps://LOGIN:SMTP-KEY@smtp-relay.brevo.com:465   # Passwort URL-kodiert
  MAIL_FROM=Dominion of Steam <noreply@huhn73.de>
  VAPID_SUBJECT=mailto:noreply@huhn73.de
  ```
  `NODE_ENV=production` und `STATIC_DIR` kommen aus dem Image. `DEV_TOOLS` bleibt ungesetzt.
- `deploy/backup-uploads.sh`: `tar` des Upload-Volumes nach `/opt/dominion/backups/`, per Host-Cron täglich. Zweite Ebene: `deploy/offsite-backup.sh` kopiert DB-Dumps und Upload-Archiv per `rsync` oder `rclone` an einen Ort außerhalb des Servers (z. B. netcup Storage Space, Hetzner Storage Box oder dein Heimnetz über den DynDNS-Eintrag). Dazu vor größeren Updates ein manueller Snapshot im netcup SCP, in der README beschrieben.

### 2d GitHub Actions `.github/workflows/deploy.yml`

Trigger: `push` auf `main` (plus `workflow_dispatch`). Drei Jobs:

1. **test:** `actions/setup-node` mit Node 24 und pnpm über corepack, Service-Container `postgres:17` mit DB `dos_test`, `TEST_DATABASE_URL` gesetzt; `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
2. **build:** nur nach erfolgreichem test, `docker/login-action` gegen `ghcr.io` mit `GITHUB_TOKEN` (`permissions: packages: write`), `docker/build-push-action` mit Tags `latest` und `sha-<kurz>`, Build-Cache über `type=gha`. Plattform `linux/amd64` (VPS Lite ist x86).
3. **deploy:** `appleboy/ssh-action` mit Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`; Skript:
   ```
   cd /opt/dominion && docker compose pull app && docker compose up -d && docker image prune -f
   ```
   Migrationen laufen beim Containerstart. Rollback: in `.env` oder Compose das Tag `sha-…` eintragen und `up -d`.

GHCR-Paket auf **öffentlich** stellen (Repo ist MIT), dann braucht der Server kein `docker login`.

### 2e Dokumentation

- `README.md`: Abschnitt „Betrieb“ mit Verweis auf `deploy/README.md`.
- `deploy/README.md`: Schritt-für-Schritt-Anleitung aus Task 3, Variablenliste, Rollback, Backups wiederherstellen, Logs (`docker compose logs -f app`).
- `agent-os/product/roadmap.md`: Phase 2 „Betrieb“ als umgesetzt markieren (https, Backups, Dev-Werkzeuge aus), Rest bleibt.
- `agent-os/product/tech-stack.md`: Abschnitt „Betrieb“ ergänzen (netcup VPS, Caddy, GHCR, Brevo).

## Task 3: Einrichtung außerhalb des Repos (Handarbeit des Nutzers, in `deploy/README.md` beschrieben)

1. **netcup:** VPS Lite 1 G12.5s mit IPv4 und IPv6 bestellen, im SCP Ubuntu 24.04 (minimal) als Image installieren. netcup liefert zunächst ein Root-Passwort: als Erstes SSH-Key hinterlegen, Nutzer `deploy` mit sudo und Docker-Gruppe anlegen, danach in `sshd_config` `PasswordAuthentication no` und `PermitRootLogin no`. Es gibt keine vorgeschaltete Firewall, deshalb `ufw` mit nur 22/80/443 eingehend **vor** dem Start der Container (Docker öffnet Ports sonst an ufw vorbei; in der Compose-Datei haben nur Caddy-Ports ein Host-Mapping, Postgres und App keines). Dann `apt update && apt upgrade`, Docker per `get.docker.com`, `unattended-upgrades`, `fail2ban` für sshd, `/opt/dominion/` anlegen, `docker-compose.yml`, `Caddyfile`, `.env` (aus `.env.example`) dorthin kopieren. Nach fertiger Einrichtung einen Snapshot im SCP anlegen.
2. **Cloudflare DNS:** A-Record `dominion` → Server-IPv4, Proxy-Status **DNS only**; optional AAAA für IPv6. Der bestehende DynDNS-Eintrag für die Hauptdomain bleibt unberührt.
3. **Brevo:** Konto anlegen, Absender-Domain `huhn73.de` hinzufügen. Brevo zeigt die DNS-Einträge: Brevo-Code-TXT, DKIM (zwei CNAME oder TXT `mail._domainkey`), SPF `v=spf1 include:spf.brevo.com ~all` (bestehendes SPF ggf. erweitern), DMARC `v=DMARC1; p=none; rua=mailto:…`. Dann unter „SMTP & API“ einen SMTP-Schlüssel erzeugen; Login ist die Brevo-Konto-E-Mail. In `.env` als `SMTP_URL` eintragen, Sonderzeichen URL-kodiert.
4. **GitHub:** Deploy-Schlüssel erzeugen (`ssh-keygen -t ed25519`), Public Key in `~deploy/.ssh/authorized_keys` auf dem Server, Private Key als Secret `DEPLOY_SSH_KEY`, dazu `DEPLOY_HOST` und `DEPLOY_USER`. Nach dem ersten Workflow-Lauf das GHCR-Paket auf öffentlich stellen.
5. **Erststart:** `docker compose up -d` auf dem Server, `docker compose logs -f app` bis „Server listening“, Caddy-Log auf Zertifikatsausstellung prüfen.

## Verifikation

- **Lokal:** `docker compose up -d --build` läuft wie bisher mit Dev-Leiste (Build-Arg `DEV_TOOLS=true`); `pnpm test` grün inklusive neuem trustProxy-Test; `docker build .` ohne Arg ergibt ein Image ohne Dev-Werkzeuge (Lobby ohne Dev-Leiste, `/api/dev/*` liefert 404).
- **CI:** Push auf `main` → Workflow test → build → deploy grün; Image unter `ghcr.io/huhn73/dominion-of-steam` sichtbar.
- **Server:** `https://dominion.huhn73.de` lädt mit gültigem Zertifikat, `http://` leitet auf `https://` um; `/api/health` antwortet.
- **Cookies:** Nach Registrierung zeigt der Browser das Cookie `dos_session` mit `Secure`, `HttpOnly`, `SameSite=Lax`.
- **Mail:** Testkonto mit echter Adresse registrieren, E-Mail-Adresse ändern → Bestätigungsmail kommt von `noreply@huhn73.de` an; Header zeigen `spf=pass` und `dkim=pass`.
- **Push:** Benachrichtigungen im Browser erlauben, Einladung durch zweites Konto → Push kommt an (braucht https, daher erst hier testbar).
- **Backups:** Nach dem ersten Nachtlauf liegt ein Dump im Volume `db_backups` und eine Kopie am Offsite-Ziel; Restore-Probe mit `psql` in einen Wegwerf-Container laut `deploy/README.md`.
- **Firewall:** `nmap` oder `ss` von außen zeigt nur 22, 80 und 443 offen; Port 5432 ist nicht erreichbar.
- **Rollback:** Tag `sha-…` in Compose eintragen, `up -d`, Seite läuft weiter.

## Nicht in diesem Plan

- Sound-Assets: kommen später über `public/` ins Image, keine Infrastruktur nötig.
- Echtzeit per WebSockets, Multi-Stage-Image, Staging-Umgebung, Cloudflare-Proxy vor dem Server, Rate-Limiting für die Anmeldung (bleibt Phase 2 in der Roadmap).
