# Online-Auftritt: Shaping-Notizen

## Umfang

Vor dem ersten öffentlichen Deploy: Impressum, Datenschutzerklärung und Lizenzseite als öffentliche Routen, Lesezeichen-Icons mit Web-Manifest, Schriften ohne Google. Betroffen: `apps/web/src/pages/rechtliches/`, `AuthLayout`, Shell (`UserMenu`, `AppShell`, neuer `MenuFooter`), beide Layouts, `index.html`, `styles/index.css`, `public/` (Icons, Manifest, Service Worker), `scripts/icons.mjs`.

## Entscheidungen

- **Anbieterdaten als Platzhalter** in `pages/rechtliches/anbieter.ts` (`ANBIETER`, `STAND`). Im Dev-Modus zeigt das Impressum einen gelben Hinweis, solange der Name noch „Vorname Nachname“ ist; in Produktion keine Laufzeitprüfung. Verworfen: `VITE_*`-Variablen (die Daten sind öffentlich, ein Build-Geheimnis bringt nichts).
- **Datenschutzerklärung aus den tatsächlichen Verarbeitungen**: Hosting netcup (Nürnberg) mit Server-Logs, Konto (E-Mail, Anzeigename, scrypt-Hash, optionales Profilbild, Einstellungen, Partiedaten, Freunde), ein Cookie `dos_session` (30 Tage gleitend, § 25 Abs. 2 Nr. 2 TDDDG, kein Banner), E-Mail über Mailjet SAS als Auftragsverarbeiter mit abgeschaltetem Tracking, Web-Push nur nach Opt-in, Backups 7 Tage / 4 Wochen / 6 Monate, Löschung über „Konto löschen“ (Partien führt eine KI weiter, Namen bleiben im Verlauf), Betroffenenrechte. Sie-Form wie bei Rechtstexten üblich.
- **Lizenzen**: MIT-Text per `import … from 'LICENSE?raw'` (eine Quelle, Ausnahmeabsatz wird auf der Seite erklärt), CC0-Quellen aus `public/audio/credits.json` per JSON-Import, Schriften (SIL OFL 1.1), Lucide (ISC), Hinweis auf die `package.json`-Dateien. Verworfen: generierte Paketliste beim Build.
- **Icon** vom Nutzer geliefert (`dominion-of-steam-logo.svg`, 1024², Zahnrad mit Kessel in `#E9A52B` auf `#171C22`). `public/icon.svg` als Favicon für aktuelle Browser, PNGs 32/180/192/512 und `favicon.ico` (PNG-in-ICO) aus `scripts/icons.mjs` (Headless Chrome über Playwright aus dem npx-Cache). Das Motiv liegt im sicheren Bereich, deshalb `purpose: "any maskable"`. Echte `.ico`, weil der Server für unbekannte Pfade `index.html` liefert. Service Worker nutzt `/icon-192.png` statt des Eisenbund-Wappens.
- **Schriften selbst hosten** über `@fontsource/*` 5.3.0 mit denselben Schnitten wie der frühere Google-Link (Barlow 400–700, Big Shoulders Display 700–900, IBM Plex Mono 400/600). Import ohne `.css`-Suffix, weil `big-shoulders-display` nur das `./*`-Muster exportiert. Die Datenschutzerklärung braucht so keinen Google-Absatz.
- **Verlinkung**: `LegalLinks` (`nav[aria-label="Rechtliches"]`, aktuelle Seite als Text) unter jeder Anmeldekarte und in der Fußzeile der Menüseiten (`MenuFooter` über `AppShell.footer`), Menüpunkt „Rechtliches“ im Benutzermenü beider Modi (`onOpenLegal`), keine Fußzeile im Spielfeld. Die Shell-Komponenten der Design-Übergabe bekommen je eine optionale Prop; das Tab-Leisten-Polster wandert von `<main>` auf einen Wrapper, damit die Fußzeile über der Tab-Leiste bleibt.
- **Rahmen**: `AuthLayout` mit `width="2xl"` und optionalem `footer`; „Zurück“ über `useBack(routes.lobby)` (eingeloggt zur Lobby, sonst über `RequireAuth` zur Anmeldung).

## Checkliste für den Betreiber

1. `apps/web/src/pages/rechtliches/anbieter.ts` ausfüllen (Name, Anschrift, E-Mail, Repository-Link) und `STAND` setzen.
2. Datenschutzerklärung gegenlesen: Hosting-Anbieter und Standort, Backup-Fristen (`deploy/docker-compose.yml`), Mailjet, Push.
3. Repository-Link prüfen: Die Lizenzseite verweist auf `ANBIETER.repo`; ist das Repository privat, Link entfernen oder Repo öffentlich machen.
4. Bei neuem Logo: `public/icon.svg` ersetzen, `node scripts/icons.mjs` ausführen.

## Kontext

- **Visuals:** `visuals/umsetzung-impressum.png`, `umsetzung-datenschutz.png`, `umsetzung-lizenzen.png`, `umsetzung-anmeldung-links.png`, `umsetzung-lobby-fusszeile.png`, `umsetzung-lobby-mobil.png`, `umsetzung-benutzermenue.png`, `umsetzung-icons.png`
- **References:** siehe `references.md`
- **Product alignment:** Roadmap Phase 2 hatte keinen Punkt dazu; nachgetragen als „Online-Auftritt“. Tech-Stack: Schriften lokal statt Google Fonts.

## Standards Applied

Keine formalen Standards in `agent-os/standards/`; Repo-Konventionen in `standards.md`.

> **Nachtrag 2. November 2026:** „Zurück“ führt jetzt fest zur Lobby bzw. Anmeldung, die Stummschaltung bleibt beim Öffnen erhalten (`agent-os/specs/2026-11-02-1905-rechtsseiten-ton-und-zurueck/`).
