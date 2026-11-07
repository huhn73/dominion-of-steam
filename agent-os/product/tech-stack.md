# Tech-Stack

## Frontend

- Vite-SPA mit React und TypeScript
- Tailwind CSS v4 mit `tw-animate-css` für die Ein-Animationen
- `lucide-react` für Icons
- Schriften gebündelt über `@fontsource` (Big Shoulders Display, Barlow, IBM Plex Mono), keine Anfragen an Google
- Web-Manifest und Icons aus `public/icon.svg` (`scripts/icons.mjs` rendert PNGs mit Headless Chrome)
- Design-Tokens und Farben (amber, teal, stone) aus `product-plan/design-system/`
- UI-Komponenten aus der Design-Übergabe (`product-plan/shell/`, `product-plan/sections/`)

## Sprachen

- Deutsch (Quelle) und Englisch, eigene Lösung ohne Bibliothek in `packages/shared/src/i18n`: Wörterbücher als JSON je Bereich (`de/*.json`, `en/*.json`), `translate(locale, key, params)` mit Platzhaltern `{name}`, Plural über `{ one, other }` und `Intl.PluralRules`, verschachtelte Texte als Parameter
- Der Typecheck verlangt jeden deutschen Schlüssel auch im Englischen; Tests prüfen Platzhalter, Übersetzung und dass im Web keine deutschen Inline-Texte entstehen (`apps/web/src/i18n/noInlineGerman.test.ts`)
- Web: `LocaleProvider` mit `useT()`, Sprache aus localStorage bzw. Browser, nach der Anmeldung aus `players.locale`; die API bekommt sie als `X-Locale`
- Server: Fehler (`LocalizedError`, `sendError`), Mails und Push in der Sprache der Anfrage bzw. des Empfängers
- Spielereignisse speichern Schlüssel und Parameter (`text`) neben dem deutschen `message`; Fraktionen und Einheiten übersetzt der Client über die ID (`compendium/data.en.json`)

## Ton

- Eigene Engine auf der Web Audio API (`apps/web/src/audio/`), ohne Bibliothek: `AudioContext` nach der ersten Interaktion, `GainNode`-Busse für Gesamt, Musik, Effekte und Umgebung, `AudioBufferSourceNode` für Schleifen und Effekte
- Spielfeldmusik als drei synchron laufende komplette Mixe, Überblendung auf Taktgrenzen (Taktlänge aus der Dateilänge im Manifest), Fraktionsthemen als Einzelstücke über abgesenkten Schichten
- Dateien als OGG/Opus unter `public/audio/`, `manifest.json` als Quelle der Pfade; Tests mit einer Attrappe der Engine

## Backend

- Node.js mit TypeScript und Fastify
- Server-Sent Events für Live-Partien und Statusaktualisierungen (statt WebSockets: nur der Weg Server → Client ist nötig, Befehle laufen weiter per POST); Signale über Postgres LISTEN/NOTIFY, Polling als Rückfall
- Der Server prüft und führt jede Spielaktion aus und setzt den Kriegsnebel durch (es werden nur sichtbare oder bekannte Daten ausgeliefert).
- Benachrichtigungen per Web-Push und E-Mail
- Eigene Anmeldung mit E-Mail und Passwort (scrypt), Sitzungen als httpOnly-Cookie (`@fastify/cookie`), in der Datenbank nur der Hash des Tokens

## Datenbank

- PostgreSQL mit Drizzle ORM
- Der vollständige Spielstand wird nach jedem Zug gespeichert und übersteht einen Neustart oder Absturz des Servers.

## Sonstiges

- pnpm-Monorepo (Frontend, Backend, gemeinsame Pakete)
- Gemeinsames TypeScript-Paket für die Spielregeln: Der Client nutzt es für die Vorschau, der Server für die maßgebliche Prüfung.

## Betrieb

- Ein Docker-Image (`Dockerfile`) mit gebauter Web-App und Server, Laufzeit `tsx`; Build-Argument `DEV_TOOLS` schaltet Dev-Konten, Demo-Partie und Dev-Leiste nur lokal ein
- Produktion auf einem netcup VPS Lite (Ubuntu 24.04, Docker Compose in `deploy/`): Caddy als Reverse-Proxy mit Let's Encrypt, Postgres 17 ohne offenen Port, Volumes für Datenbank und Uploads, `postgres-backup-local` für tägliche Dumps, Offsite-Kopie per rsync/rclone
- Deployment über GitHub Actions: Tests mit Postgres-Service, Image nach GHCR (`latest` und `sha-*`), SSH auf den Server mit `docker compose pull && up -d`; Rollback über `APP_TAG`
- Domain `dominion.huhn73.de` in Cloudflare als DNS-only; E-Mail über Mailjet SMTP-Relay mit SPF/DKIM auf `huhn73.de`
