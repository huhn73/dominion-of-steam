# Betrieb: dominion.huhn73.de

Produktion läuft auf einem netcup VPS Lite 1 G12.5s (2 vCPU x86, 4 GB RAM, Ubuntu 24.04) mit Docker. Caddy übernimmt https mit Let's Encrypt, die App kommt als Image aus der GitHub Container Registry (GHCR), Postgres und Uploads liegen in Docker-Volumes, ein Backup-Container schreibt täglich Dumps. Jeder Push auf `main` läuft durch `.github/workflows/deploy.yml`: Tests, Image bauen, per SSH auf dem Server aktualisieren.

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

## 1. Server bei netcup

1. VPS Lite 1 G12.5s bestellen, Netzwerkoption **IPv4 und IPv6** (nicht „nur IPv6“), Standort Nürnberg oder Wien.
2. Im Server Control Panel (SCP) das Image **Ubuntu 24.04 minimal** installieren. netcup zeigt ein Root-Passwort an.
3. Als root anmelden und zuerst den Zugang absichern:

```bash
apt update && apt upgrade -y
adduser --disabled-password --gecos '' deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
# eigenen öffentlichen SSH-Key eintragen (später kommt der Deploy-Key dazu)
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys && chown -R deploy:deploy /home/deploy/.ssh
echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy
# Passwort- und Root-Login abschalten
printf 'PasswordAuthentication no\nPermitRootLogin no\n' > /etc/ssh/sshd_config.d/hardening.conf
systemctl restart ssh
```

In einem zweiten Terminal als `deploy` per Key anmelden, erst dann das Root-Terminal schließen.

4. Firewall, Updates, fail2ban (netcup hat keine vorgeschaltete Firewall):

```bash
sudo apt install -y ufw unattended-upgrades fail2ban
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
sudo ufw enable
sudo dpkg-reconfigure -plow unattended-upgrades
sudo systemctl enable --now fail2ban
```

Docker veröffentlicht Ports an ufw vorbei. In `docker-compose.yml` hat deshalb nur Caddy ein Port-Mapping; Postgres und App sind nur im Compose-Netz erreichbar.

5. Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
# neu anmelden, dann:
docker compose version
```

6. Anwendungsordner:

```bash
sudo mkdir -p /opt/dominion/backups && sudo chown -R deploy:deploy /opt/dominion
cd /opt/dominion
# docker-compose.yml, Caddyfile, .env.example, backup-uploads.sh, offsite-backup.sh aus deploy/ hierher kopieren (scp)
cp .env.example .env
openssl rand -hex 24     # als POSTGRES_PASSWORD eintragen
nano .env
chmod 600 .env
```

Nach dem fertigen Setup im SCP einen Snapshot anlegen.

## 2. DNS in Cloudflare

- `A`-Record `dominion` → IPv4 des Servers, Proxy-Status **DNS only** (graue Wolke). Caddy holt das Zertifikat selbst; mit orangener Wolke würde Cloudflare davor sitzen.
- Optional `AAAA`-Record `dominion` → IPv6 des Servers.
- Der DynDNS-Eintrag der Hauptdomain bleibt unberührt.

## 3. E-Mail über Mailjet

Kostenloser Tarif: 200 Mails am Tag, 6000 im Monat, SMTP enthalten, keine Kreditkarte. Die Domain wird allein über DNS-Einträge verifiziert; ein Postfach unter `huhn73.de` ist nicht nötig.

1. Konto bei [mailjet.com](https://www.mailjet.com) mit einer bestehenden E-Mail-Adresse anlegen und diese per Link bestätigen.
2. Unter „Absender & Domains“ die Domain `huhn73.de` hinzufügen, Verifizierung per **DNS**: den angezeigten `TXT`-Record (`mailjet._<code>`) in Cloudflare anlegen (DNS only).
3. Zustellbarkeit einrichten, Mailjet zeigt die Werte an: SPF als `TXT` auf `huhn73.de` mit `v=spf1 include:spf.mailjet.com ~all` (es darf nur einen SPF-Record geben; wer zusätzlich über Strato sendet, ergänzt `include:_spf.strato.com`), DKIM als `TXT` auf `mailjet._domainkey`. DMARC als `TXT` auf `_dmarc`: `v=DMARC1; p=none; rua=mailto:postmaster@huhn73.de` (Berichte landen im Strato-Postfach).
4. In Mailjet „Prüfen“ klicken, bis Domain, SPF und DKIM grün sind. Danach darf jede Adresse `@huhn73.de` senden, auch `noreply@huhn73.de` ohne Postfach.
5. Unter „Kontoeinstellungen → SMTP- und SEND-API-Einstellungen“ API-Key und Secret-Key ablesen (oder einen eigenen Key anlegen). In `.env`:

```
SMTP_URL=smtps://API-KEY:SECRET-KEY@in-v3.mailjet.com:465
MAIL_FROM=Dominion of Steam <noreply@huhn73.de>
SUPPORT_EMAIL=postmaster@huhn73.de
```

Benutzername ist der API-Key, Passwort der Secret-Key; Sonderzeichen URL-kodiert (`@` → `%40`, `#` → `%23`, `/` → `%2F`). Ohne `SMTP_URL` verschickt der Server keine Mails, der Rest läuft weiter.

**Empfang:** Mails an `@huhn73.de` nimmt weiterhin Strato an (MX `smtpin.rzone.de`, Postfach `postmaster@huhn73.de`, Weiterleitung oder Abruf per POP3/IMAP in der Strato-E-Mail-Verwaltung). Diesen MX-Eintrag nicht löschen und Cloudflare Email Routing nicht aktivieren, es würde den Strato-Empfang ersetzen. Versand (Mailjet, SPF/DKIM) und Empfang (Strato, MX) sind getrennte Einträge und stören sich nicht.

## 4. GitHub Actions

1. Deploy-Key erzeugen (lokal): `ssh-keygen -t ed25519 -f dominion-deploy -C deploy@dominion -N ''`.
2. `dominion-deploy.pub` auf dem Server an `/home/deploy/.ssh/authorized_keys` anhängen.
3. Im Repo unter Settings → Secrets and variables → Actions drei Secrets anlegen: `DEPLOY_HOST` (IPv4 oder `dominion.huhn73.de`), `DEPLOY_USER` (`deploy`), `DEPLOY_SSH_KEY` (Inhalt von `dominion-deploy`, der private Schlüssel).
4. Settings → Environments → `production` anlegen (ohne weitere Regeln; das Environment zeigt die Deploys im Repo an).
5. Ersten Lauf starten: Push auf `main` oder Actions → Deploy → „Run workflow“. Der Deploy-Job schlägt beim ersten Mal fehl, solange der Server das Image nicht ziehen kann, siehe nächster Schritt.
6. Nach dem ersten Build das Paket öffentlich machen: GitHub-Profil → Packages → `dominion-of-steam` → Package settings → Change visibility → Public. Danach braucht der Server kein `docker login`.

Der Workflow baut `ghcr.io/huhn73/dominion-of-steam` mit den Tags `latest` und `sha-<kurz>` und führt auf dem Server aus:

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
gh variable set ANBIETER_EMAIL --body 'postmaster@huhn73.de'
```

Lokal dieselben Werte als `VITE_ANBIETER_*` in `apps/web/.env.local` (nicht versioniert). Vor dem ersten öffentlichen Start außerdem `STAND` in `anbieter.ts` prüfen und die Datenschutzerklärung (`DatenschutzPage.tsx`) gegenlesen: Hosting-Anbieter, Backup-Fristen (`BACKUP_KEEP_*` in `docker-compose.yml`), Mailjet. Geänderte Variablen wirken erst mit dem nächsten Build (Actions → Deploy → „Run workflow“).

## 6. Erststart

```bash
cd /opt/dominion
docker compose up -d
docker compose logs -f app      # bis "Server listening at http://0.0.0.0:3000"
docker compose logs caddy       # "certificate obtained successfully"
curl -I https://dominion.huhn73.de/api/health
```

Dann im Browser registrieren. Es gibt in Produktion keine Dev-Konten und keine Demo-Partie (`DEV_TOOLS` ist aus).

## Prüfen

- `https://dominion.huhn73.de` lädt mit gültigem Zertifikat, `http://` leitet um.
- Cookie `dos_session` in den Entwicklerwerkzeugen: `Secure`, `HttpOnly`, `SameSite=Lax`. Fehlt `Secure`, ist `TRUST_PROXY=true` nicht gesetzt.
- E-Mail-Adresse im Profil ändern: Bestätigungsmail kommt von `noreply@huhn73.de` (Mailjet), in den Kopfzeilen `spf=pass` und `dkim=pass`.
- Push im Lobby-Banner aktivieren, Einladung von einem zweiten Konto: Benachrichtigung kommt an.
- Von außen: `nmap -p 22,80,443,5432,3000 dominion.huhn73.de` zeigt nur 22, 80 und 443 offen.

## Backups

**Datenbank:** Der Dienst `backup` schreibt täglich einen komprimierten Dump ins Volume `db_backups` (`/backups/daily`, `weekly`, `monthly`; 7 Tage, 4 Wochen, 6 Monate). Anzeigen:

```bash
docker compose exec backup ls -la /backups/daily
```

**Uploads und Offsite:** Cron des Nutzers `deploy` (`crontab -e`):

```
15 3 * * * /opt/dominion/backup-uploads.sh >> /opt/dominion/backups/cron.log 2>&1
30 3 * * * OFFSITE=backup@home.example:/srv/dominion /opt/dominion/offsite-backup.sh >> /opt/dominion/backups/cron.log 2>&1
```

`OFFSITE` ist ein rsync-Ziel (`user@host:/pfad`, SSH-Key des Nutzers `deploy` dort hinterlegen) oder ein rclone-Remote (`remote:pfad`, `rclone config` einmal einrichten), zum Beispiel netcup Storage Space, eine Storage Box oder das Heimnetz über den DynDNS-Eintrag.

**Snapshot:** Vor größeren Updates (Postgres-Major-Version, Ubuntu-Upgrade) im SCP einen Snapshot anlegen.

**Wiederherstellen** (Datenbank, Probe in einem Wegwerf-Container oder im Ernstfall gegen `db`):

```bash
docker compose stop app
docker compose exec backup sh -c 'zcat /backups/daily/dos-<datum>.sql.gz' > /tmp/restore.sql
docker compose exec -T db psql -U dos -c 'drop database dos; create database dos;' postgres
docker compose exec -T db psql -U dos dos < /tmp/restore.sql
docker compose start app
```

Uploads: `docker run --rm -v dominion_uploads:/data -v /opt/dominion/backups:/backup alpine tar xzf /backup/uploads-<datum>.tar.gz -C /data`.

## Rollback

Tags der gebauten Images stehen auf der Package-Seite in GitHub. In `.env` `APP_TAG=sha-abc1234` setzen, dann `docker compose up -d app`. Zurück auf `latest` genauso. Migrationen laufen nur vorwärts; ein Rollback über eine Migration hinweg braucht den Datenbank-Dump von davor.

## Alltag

```bash
docker compose ps                  # Zustand, Healthchecks
docker compose logs -f app         # Server-Log (Fastify, JSON)
docker compose logs -f caddy       # Zugriffe, Zertifikate
docker compose exec db psql -U dos # SQL-Konsole
df -h / && docker system df        # Platz
```

Updates von Caddy, Postgres (Minor) und Backup-Image: `docker compose pull && docker compose up -d`. Ubuntu-Sicherheitsupdates spielt `unattended-upgrades` ein; ein Reboot nach Kernel-Updates startet alle Container wieder (`restart: unless-stopped`).
