# Betrieb

Produktion läuft auf einem Linux-Server mit Docker. Caddy übernimmt https mit Let's Encrypt, die App kommt als Image aus der GitHub Container Registry (GHCR), Postgres und Uploads liegen in Docker-Volumes, ein Backup-Container schreibt täglich Dumps. Jeder Push auf `main` läuft durch `.github/workflows/deploy.yml`: Tests, Image bauen, per SSH auf dem Server aktualisieren.

```
Browser ──https──▶ caddy:443 ──▶ app:3000 ──▶ db:5432
                                   │              ▲
                                   ▼              │ pg_dump täglich
                               uploads         backup ──▶ db_backups ──▶ offsite
```

Dateien in diesem Ordner:

| Datei                | Zweck                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| `docker-compose.yml` | Dienste caddy, db, app, backup; liegt auf dem Server unter `/opt/dominion/` |
| `Caddyfile`          | Reverse-Proxy mit Zertifikat für `DOMAIN`                                   |
| `.env.example`       | Vorlage für `/opt/dominion/.env`                                            |
| `backup-uploads.sh`  | Archiviert das Upload-Volume nach `/opt/dominion/backups/`                  |
| `offsite-backup.sh`  | Kopiert Dumps und Archive per rsync oder rclone außer Haus                  |

## 1. Server

Ein kleiner VPS reicht (2 vCPU x86, 4 GB RAM, Ubuntu 24.04), mit IPv4. Vor Docker den Zugang absichern: eigener Benutzer mit SSH-Key, Passwort- und Root-Login aus, Firewall nur für 22, 80 und 443 (tcp, 443 auch udp), automatische Sicherheitsupdates, fail2ban.

Docker veröffentlicht Ports an der Firewall (ufw) vorbei. In `docker-compose.yml` hat deshalb nur Caddy ein Port-Mapping; Postgres und App sind nur im Compose-Netz erreichbar.

Docker installieren (`curl -fsSL https://get.docker.com | sudo sh`), den Benutzer in die Gruppe `docker` aufnehmen, dann den Anwendungsordner anlegen:

```bash
sudo mkdir -p /opt/dominion/backups && sudo chown -R "$USER": /opt/dominion
cd /opt/dominion
# docker-compose.yml, Caddyfile, .env.example, backup-uploads.sh, offsite-backup.sh aus deploy/ hierher kopieren
cp .env.example .env
openssl rand -hex 24     # als POSTGRES_PASSWORD eintragen
nano .env
chmod 600 .env
```

Nach dem fertigen Setup einen Snapshot beim Hoster anlegen, falls er das anbietet.

## 2. DNS

Ein `A`-Record (optional `AAAA`) für `DOMAIN` zeigt auf den Server. Caddy holt das Zertifikat selbst; ein vorgeschalteter Proxy (etwa Cloudflare mit orangener Wolke) muss dafür aus sein.

## 3. E-Mail

Der Server verschickt Mails (Bestätigung, Passwort vergessen, Benachrichtigungen) über einen beliebigen SMTP-Anbieter. Die Absender-Domain beim Anbieter verifizieren und SPF, DKIM und DMARC als DNS-Einträge anlegen, sonst landen die Mails im Spam. In `.env`:

```
SMTP_URL=smtps://BENUTZER:PASSWORT@smtp.example.org:465
MAIL_FROM=Dominion of Steam <noreply@example.org>
SUPPORT_EMAIL=kontakt@example.org
```

Sonderzeichen in Benutzer und Passwort URL-kodiert (`@` → `%40`, `#` → `%23`, `/` → `%2F`). Ohne `SMTP_URL` verschickt der Server keine Mails, der Rest läuft weiter.

## 4. GitHub Actions

1. Deploy-Key erzeugen (lokal): `ssh-keygen -t ed25519 -f dominion-deploy -C deploy@dominion -N ''`.
2. `dominion-deploy.pub` auf dem Server an `~/.ssh/authorized_keys` des Deploy-Benutzers anhängen.
3. Im Repo unter Settings → Secrets and variables → Actions drei Secrets anlegen: `DEPLOY_HOST` (IP oder Hostname), `DEPLOY_USER`, `DEPLOY_SSH_KEY` (Inhalt von `dominion-deploy`, der private Schlüssel).
4. Settings → Environments → `production` anlegen (ohne weitere Regeln; das Environment zeigt die Deploys im Repo an).
5. Ersten Lauf starten: Push auf `main` oder Actions → Deploy → „Run workflow“.
6. Das Image muss für den Server abrufbar sein: Bei einem öffentlichen Repository ist das GHCR-Paket öffentlich, sonst unter Packages → Package settings auf Public stellen oder auf dem Server `docker login ghcr.io` mit einem Token (`read:packages`).

Der Workflow baut `ghcr.io/<owner>/dominion-of-steam` mit den Tags `latest` und `sha-<kurz>` und führt auf dem Server aus:

```bash
cd /opt/dominion && docker compose pull app && docker compose up -d --remove-orphans && docker image prune -f
```

Migrationen laufen beim Start der App (`runMigrations` in `apps/server/src/index.ts`), ein separater Schritt ist nicht nötig.

## 5. Impressum und Datenschutz

Name, Anschrift und E-Mail des Anbieters stehen nicht im Repository. Der Image-Build liest sie aus Repository-Variablen (Settings → Secrets and variables → Actions → Variables), `apps/web/src/pages/rechtliches/anbieter.ts` setzt sie ein; fehlt ein Wert, zeigen Impressum und Datenschutz Platzhalter:

```bash
gh variable set ANBIETER_NAME --body 'Vorname Nachname'
gh variable set ANBIETER_STRASSE --body 'Straße Hausnummer'
gh variable set ANBIETER_ORT --body 'PLZ Ort'
gh variable set ANBIETER_LAND --body 'Deutschland'
gh variable set ANBIETER_EMAIL --body 'kontakt@example.org'
```

Lokal dieselben Werte als `VITE_ANBIETER_*` in `apps/web/.env.local` (nicht versioniert). Vor dem ersten öffentlichen Start außerdem `STAND` in `anbieter.ts` prüfen und die Datenschutzerklärung (`DatenschutzPage.tsx`) an den eigenen Betrieb anpassen: Hosting-Anbieter, Mail-Dienstleister, Backup-Fristen (`BACKUP_KEEP_*` in `docker-compose.yml`). Geänderte Variablen wirken erst mit dem nächsten Build (Actions → Deploy → „Run workflow“).

## 6. Erststart

```bash
cd /opt/dominion
docker compose up -d
docker compose logs -f app      # bis "Server listening at http://0.0.0.0:3000"
docker compose logs caddy       # "certificate obtained successfully"
curl -I https://<DOMAIN>/api/health
```

Dann im Browser registrieren. Es gibt in Produktion keine Dev-Konten und keine Demo-Partie (`DEV_TOOLS` ist aus).

Die eigene Adresse in `.env` als `ADMIN_EMAILS=…` eintragen (kommagetrennt für mehrere) und `docker compose up -d app` ausführen. Dann erscheint im Benutzermenü „Verwaltung“ mit der Nutzungsübersicht unter `/admin`: Konten, Partien, Verlauf über 7/30/90 Tage, ohne E-Mail-Adressen.

## Prüfen

- `https://<DOMAIN>` lädt mit gültigem Zertifikat, `http://` leitet um.
- Cookie `dos_session` in den Entwicklerwerkzeugen: `Secure`, `HttpOnly`, `SameSite=Lax`. Fehlt `Secure`, ist `TRUST_PROXY=true` nicht gesetzt.
- E-Mail-Adresse im Profil ändern: Die Bestätigungsmail kommt vom `MAIL_FROM`-Absender, in den Kopfzeilen `spf=pass` und `dkim=pass`.
- Push im Lobby-Banner aktivieren, Einladung von einem zweiten Konto: Benachrichtigung kommt an.
- Von außen: `nmap -p 22,80,443,5432,3000 <DOMAIN>` zeigt nur 22, 80 und 443 offen.

## Backups

**Datenbank:** Der Dienst `backup` schreibt täglich einen komprimierten Dump ins Volume `db_backups` (`/backups/daily`, `weekly`, `monthly`; 7 Tage, 4 Wochen, 6 Monate). Anzeigen:

```bash
docker compose exec backup ls -la /backups/daily
```

**Uploads und Offsite:** Cron des Deploy-Benutzers (`crontab -e`):

```
15 3 * * * /opt/dominion/backup-uploads.sh >> /opt/dominion/backups/cron.log 2>&1
30 3 * * * OFFSITE=backup@backup.example.org:/srv/dominion /opt/dominion/offsite-backup.sh >> /opt/dominion/backups/cron.log 2>&1
```

`OFFSITE` ist ein rsync-Ziel (`user@host:/pfad`, SSH-Key des Deploy-Benutzers dort hinterlegen) oder ein rclone-Remote (`remote:pfad`, `rclone config` einmal einrichten), etwa ein Speicherangebot des Hosters oder eine Storage Box.

**Snapshot:** Vor größeren Updates (Postgres-Major-Version, Ubuntu-Upgrade) einen Snapshot anlegen.

**Wiederherstellen** (Datenbank, Probe in einem Wegwerf-Container oder im Ernstfall gegen `db`):

```bash
docker compose stop app
docker compose exec backup sh -c 'zcat /backups/daily/dos-<datum>.sql.gz' > /tmp/restore.sql
docker compose exec -T db psql -U dos -c 'drop database dos; create database dos;' postgres
docker compose exec -T db psql -U dos dos < /tmp/restore.sql
docker compose start app
```

Uploads: `docker run --rm -v dominion_uploads:/data -v /opt/dominion/backups:/backup alpine tar xzf /backup/uploads-<datum>.tar.gz -C /data`.

## Versionen und Releases

Die Version steht in `package.json` (alle Pakete tragen dieselbe) und wird mit einem Skript gesetzt:

```bash
pnpm release minor        # oder patch, major, 1.0.0
git commit -am "Version 0.10.0"
```

Beim Deploy liest der Workflow die Version. Gibt es noch keinen Tag `v0.10.0`, ist dieser Build das Release: Das Image bekommt zusätzlich den Tag `v0.10.0`, und nach erfolgreichem Deploy legt der Job `release` den Git-Tag und ein GitHub-Release mit automatisch erzeugten Notizen an. Jeder weitere Deploy ohne neue Version läuft als `0.10.0+abc1234`. Das Spiel zeigt die Version klein in der Fußzeile und unter der Anmeldekarte (Commit und Build-Datum im Tooltip), `/api/health` liefert `version` und `commit`:

```bash
curl -s https://<DOMAIN>/api/health    # {"ok":true,"version":"0.10.0","commit":"…"}
```

Lokal gebaute Stände heißen `0.10.0-dev`.

## Rollback

Tags der gebauten Images stehen auf der Package-Seite in GitHub. In `.env` `APP_TAG=v0.9.0` (Release) oder `APP_TAG=sha-abc1234` setzen, dann `docker compose up -d app`. Zurück auf `latest` genauso. Migrationen laufen nur vorwärts; ein Rollback über eine Migration hinweg braucht den Datenbank-Dump von davor.

## Alltag

```bash
docker compose ps                  # Zustand, Healthchecks
docker compose logs -f app         # Server-Log (Fastify, JSON)
docker compose logs -f caddy       # Zugriffe, Zertifikate
docker compose exec db psql -U dos # SQL-Konsole
df -h / && docker system df        # Platz
```

Updates von Caddy, Postgres (Minor) und Backup-Image: `docker compose pull && docker compose up -d`. Sicherheitsupdates des Systems spielt `unattended-upgrades` ein; ein Reboot nach Kernel-Updates startet alle Container wieder (`restart: unless-stopped`).
