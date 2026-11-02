# Deployment: Shaping-Notizen

## Umfang

Erste Spec aus Phase 2 der Roadmap, Punkt „Betrieb“. Das Spiel soll öffentlich unter `dominion.huhn73.de` laufen, mit echtem Mailversand und einer Deployment-Kette von `main` bis zum Server. Betroffen: `Dockerfile`, lokales `docker-compose.yml`, Server (`trustProxy`, Cookie), neues Verzeichnis `deploy/` mit Produktions-Compose und Anleitung, GitHub Actions. Der Ton (Audio-Assets) kommt später über `public/` ins Image und braucht keine Infrastruktur-Änderung.

## Entscheidungen

- **Hoster:** netcup VPS Lite 1 G12.5s (2 vCPU x86, 4 GB RAM, 80 GB SSD, ca. 6 €/Monat, 6 Monate Mindestlaufzeit), Ubuntu 24.04, Standort Nürnberg oder Wien, Netzwerkoption IPv4 und IPv6. Ursprünglich war Hetzner Cloud CX23 geplant, dort war der Server nicht bestellbar. Verworfen: Heimnetz hinter DynDNS (Abhängigkeit vom Heimanschluss, Spieler auf dem eigenen Anschluss); VPS nano mit 2 GB RAM (zu eng, sobald Postgres Cache bekommt).
- **Domain:** `dominion.huhn73.de` als A-Record in Cloudflare, **DNS only**. Der Server holt das Zertifikat selbst (Caddy, Let's Encrypt). Verworfen: Cloudflare-Proxy davor (zweite TLS-Ebene, Header-Umschreibungen, bringt für ein Rundenspiel nichts). Alternativen `dampf.` und `dos.` verworfen.
- **Mail:** Mailjet SMTP-Relay (200 Mails/Tag kostenlos, EU-Anbieter, SMTP sofort nutzbar), Absender `noreply@huhn73.de` mit SPF, DKIM und DMARC in Cloudflare; Domain-Verifizierung nur per DNS, kein Postfach nötig. Nutzt `SMTP_URL`/`MAIL_FROM` unverändert. Zuerst war Brevo gewählt, dort schaltet der Support SMTP erst nach Prüfung frei. Verworfen: Resend (US), vorhandenes Postfach (keins), ohne Mail.
- **Deploy-Kette:** GitHub Actions bei Push auf `main`: Tests mit Postgres-Service → Image nach GHCR (`latest`, `sha-*`) → SSH auf den Server, `docker compose pull && up -d`. Migrationen laufen beim App-Start. Rollback über `APP_TAG` in `.env`. GHCR-Paket öffentlich, damit der Server kein Login braucht. Verworfen: Coolify (weiteres Werkzeug mit ca. 2 GB RAM-Bedarf), manuelles `git pull` und Bauen auf dem Server.
- **Reverse-Proxy:** Caddy statt nginx/Traefik, weil Zertifikate ohne Zusatzkonfiguration laufen. Nur Caddy hat Host-Ports (80, 443); Postgres und App sind nur im Compose-Netz erreichbar.
- **Cookie:** `secure` hängt jetzt nur noch an `req.protocol === 'https'`; hinter dem Proxy liefert `trustProxy` (Option `TRUST_PROXY=true`) das richtige Protokoll. Die Bedingung `NODE_ENV === 'production'` entfällt, weil sie den Test unnötig schwer machte und über http sowieso nichts erzwang.
- **Dev-Werkzeuge:** Build-Argument `DEV_TOOLS` (Vorgabe `false`) steuert `VITE_DEV_TOOLS` und `DEV_TOOLS` im Image. Das lokale Compose baut mit `true`, Produktion ohne. Verworfen: zwei Dockerfiles.
- **Backups:** netcup hat keine automatischen Backups. Drei Ebenen: `postgres-backup-local` mit täglichen Dumps (7 Tage, 4 Wochen, 6 Monate) im Volume, Host-Cron mit Upload-Archiv und Offsite-Kopie per rsync/rclone, manueller Snapshot im SCP vor größeren Updates.
- **Sicherheit auf dem Server:** ufw (22, 80, 443), SSH nur mit Key, kein Root-Login, fail2ban, unattended-upgrades. Alles in `deploy/README.md` als Schrittfolge.

## Out of scope

Echtzeit per WebSockets, Multi-Stage-Image, Staging-Umgebung, mehrere App-Instanzen, CDN, Rate-Limiting (bleibt bei „Konten“ in Phase 2), Sound.

## Kontext

- **Visuals:** keine.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 2, Punkt „Betrieb“.

## Angewandte Standards

Noch keine, siehe `standards.md`.
