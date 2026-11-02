# Plan: Online-Auftritt – Impressum, Datenschutz, Lizenzen, Lesezeichen-Icon

## Context

Vor dem ersten öffentlichen Deploy auf `dominion.huhn73.de` fehlen die Pflichtangaben eines deutschen Online-Angebots mit Konten (Impressum nach § 5 DDG, Datenschutzerklärung nach Art. 13 DSGVO), eine Lizenzseite (MIT-Lizenz mit Ausnahme für Art und Audio, CC0-Nachweise der Effekte) und die Icons für Lesezeichen, Homescreen und Tab (`apps/web/index.html` hat weder Favicon noch Manifest noch `theme-color`). Shaping-Entscheidungen:

- **Impressum mit Platzhaltern**: Anbieterdaten liegen in einer Datei (`anbieter.ts`), die der Betreiber vor dem Deploy ausfüllt. Keine Build-Variablen, die Daten sind ohnehin öffentlich.
- **Datenschutzerklärung ja**, ehrlich und knapp, aus den tatsächlichen Verarbeitungen: Konto (E-Mail, Anzeigename, scrypt-Hash, optionaler Avatar, Einstellungen, Partiedaten), Sitzungs-Cookie `dos_session` (technisch notwendig, kein Banner), Mails über Mailjet SAS (Paris, EU), Hosting netcup GmbH (Nürnberg) mit Server-Logs (IP, Zeit, URL, User-Agent), Web-Push freiwillig über den Browseranbieter, Backups 7 Tage täglich / 4 Wochen / 6 Monate (`deploy/docker-compose.yml:61`), Löschung über „Konto löschen“ in den Einstellungen, keine Analyse- oder Werbe-Tools, Betroffenenrechte.
- **Lizenzen**: Projektlizenz (MIT, mit Ausnahme), CC0-Nachweise aus `public/audio/credits.json`, Schriften (SIL OFL 1.1) und Icons (lucide, ISC) als Kurzliste, Hinweis auf Open-Source-Bibliotheken im Repository. Keine generierte Paketliste.
- **Icon vom Nutzer**: `dominion-of-steam-logo.svg`, heute `public/icon.svg` (reines Vektor-SVG, 1024², Zahnrad `#E9A52B` auf `#171C22`, Motiv innerhalb 18 % Rand → maskable-tauglich). PNGs werden daraus mit Headless Chrome gerendert.
- **Verlinkung**: Zeile unter der Anmeldekarte (alle Anmeldeseiten), Eintrag „Rechtliches“ im Benutzermenü, schmale Fußzeile unter den Menüseiten. Nicht im Spielfeld.
- **Google Fonts raus**: Die drei Schriften kommen bisher von `fonts.googleapis.com` (IP-Weitergabe an Google, in Deutschland abmahngefährdet). Selbst hosten über `@fontsource/*` 5.3.0; dann braucht die Datenschutzerklärung keinen Google-Absatz und der Auftritt lädt nichts von Dritten.
- **Stil**: Textseiten im Rahmen der Anmeldekarte (`AuthLayout`: Messinglicht, Nieten, Big-Shoulders-Überschrift), nur breiter.

Erkenntnisse aus der Erkundung:

- Routen: `apps/web/src/routes.ts` (Konstanten) und `apps/web/src/router.tsx` (öffentliche Routen oben, alles andere unter `RequireAuth`; `*` innerhalb `RequireAuth` schickt Ausgeloggte zur Anmeldung → neue Seiten müssen auf oberster Ebene stehen).
- `pages/anmeldung/AuthLayout.tsx` (`{title, children, footer}`, `max-w-md`, exportiert `linkClass`) ist nicht in `.prettierignore` und darf erweitert werden. `shell/AppShell.tsx` und `shell/UserMenu.tsx` sind Design-Übergabe (`.prettierignore`), werden wie in der Ton-Spec nur minimal angefasst (eine Prop je Komponente).
- Statische Dateien: Vite `publicDir: '../../public'` (Repo-Wurzel), Server `fastifyStatic` auf `STATIC_DIR=/app/apps/web/dist`, Not-Found-Fallback liefert `index.html` für alle GETs außerhalb `/api` und `/uploads/` → ein fehlendes `/favicon.ico` würde HTML liefern, also eine echte `.ico` liefern.
- `public/sw.js` nutzt `/art/factions/eisenbund-emblem.png` als Benachrichtigungs-Icon → auf das neue Icon umstellen.
- Tests: `renderApp(path, { user: null })` für ausgeloggte Seiten (`pages/anmeldung/Anmeldung.test.tsx`), `mockApi({})`, `afterEach(() => vi.unstubAllGlobals())`.
- Kein Logo-Asset im Code; `AppShell` zeigt lucide `Cog` im Messingring. Bleibt so (Kopfzeile ist nicht Teil der Spec).
- Werkzeuge: kein `rsvg-convert`/ImageMagick/sharp; Playwright aus dem npx-Cache mit `/usr/bin/google-chrome` (Memory-Notiz) rendert SVG → PNG. `.ico` als PNG-Container per kleinem Node-Skript (alle aktuellen Browser lesen PNG-in-ICO).

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-10-31-HHMM-online-auftritt/`: `plan.md` (dieser Plan), `shape.md` (Entscheidungen, Inhalt der drei Seiten, Icon-Größen, Pflichtangaben-Checkliste für den Betreiber), `standards.md` (Repo-Konventionen wie in der Ton-Spec, keine formalen Standards vorhanden), `references.md` (AuthLayout, Anmeldung.test, Kompendium-Seiten, Ton-Spec als Vorbild für minimale Eingriffe in die Shell), `visuals/` (Screenshots nach der Umsetzung: Impressum, Anmeldeseite mit Fußzeile, Benutzermenü, Menü-Fußzeile; Icon-Vorschau 32/180/512).

## Task 2: Icons und Web-Manifest

- `public/icon.svg`: Kopie des gelieferten SVG (Favicon für aktuelle Browser, skaliert verlustfrei).
- `scripts/icons.mjs` (Repo-Wurzel, einmalig und bei Icon-Wechsel): öffnet `public/icon.svg` in Headless Chrome (Playwright aus dem npx-Cache, `executablePath: '/usr/bin/google-chrome'`), rendert `public/favicon-32.png`, `public/apple-touch-icon.png` (180, Hintergrund bereits im SVG, keine Transparenz nötig), `public/icon-192.png`, `public/icon-512.png`; baut `public/favicon.ico` als ICO-Container mit dem 32er-PNG (6-Byte-Header + 16-Byte-Eintrag + PNG-Bytes). Aufruf im README dokumentiert; falls Playwright nicht auffindbar, bricht das Skript mit Hinweis ab.
- `public/manifest.webmanifest`: `name` „Dominion of Steam“, `short_name` „DoS“, `description`, `lang: de`, `start_url: /`, `display: standalone`, `background_color`/`theme_color: #171C22`, `icons` 192 und 512 mit `purpose: "any maskable"` (solider Hintergrund, Motiv im sicheren Bereich).
- `apps/web/index.html`: `<link rel="icon" href="/favicon.ico" sizes="32x32">`, `<link rel="icon" href="/icon.svg" type="image/svg+xml">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#171C22">`, `<meta name="description" content="Rundenbasiertes Strategiespiel im Dieselzeitalter – Städte erobern, Einheiten bauen, Freunde herausfordern.">`.
- `public/sw.js`: Benachrichtigungs-`icon` → `/icon-192.png` (kein `badge`, das bräuchte ein monochromes Bild).
- Test `apps/web/src/pages/rechtliches/manifest.test.ts`: liest `public/manifest.webmanifest` (wie `audio/ids.test.ts` über `process.cwd()`), prüft, dass jede referenzierte Icon-Datei existiert und `index.html` Manifest, Favicon und `theme-color` verlinkt.

## Task 3: Schriften selbst hosten

- `apps/web/package.json`: `@fontsource/barlow`, `@fontsource/big-shoulders-display`, `@fontsource/ibm-plex-mono` (5.3.0).
- `apps/web/src/styles/index.css`: `@import '@fontsource/barlow/400.css'` … 500/600/700; `big-shoulders-display` 700/800/900; `ibm-plex-mono` 400/600 (dieselben Schnitte wie bisher aus dem Google-Link). Familiennamen sind identisch (`Barlow`, `Big Shoulders Display`, `IBM Plex Mono`), die 184 Tailwind-Klassen `font-['…']` bleiben unverändert.
- `apps/web/index.html`: Preconnects und Stylesheet-Link zu Google entfernen.
- Prüfung: `pnpm --filter web build`, in `dist/assets` liegen `.woff2`-Dateien; im Browser keine Anfrage an `googleapis`/`gstatic` (Netzwerk-Mitschnitt im Playwright-Check).

## Task 4: Rechtliche Seiten (`apps/web/src/pages/rechtliches/`)

- `routes.ts`: `imprint: '/impressum'`, `privacy: '/datenschutz'`, `licenses: '/lizenzen'`. `router.tsx`: drei öffentliche Einträge auf oberster Ebene (vor `RequireAuth`).
- `anbieter.ts`: `export const ANBIETER = { name: 'Vorname Nachname', strasse: 'Straße Hausnummer', ort: 'PLZ Ort', land: 'Deutschland', email: 'postmaster@huhn73.de', repo: 'https://github.com/huhn73/dominion-of-steam' }` mit Kommentar „vor dem ersten Deploy ausfüllen“. `istPlatzhalter()` = Name noch „Vorname Nachname“ → im Dev-Modus (`import.meta.env.DEV`) zeigt das Impressum einen gelben Hinweis; in Produktion nichts (keine Lauf­zeit­prüfung, dafür ein Punkt in `deploy/README.md`).
- `AuthLayout.tsx`: neue optionale Prop `width?: 'md' | '2xl'` (`max-w-md` bzw. `max-w-2xl`), `footer` optional; darunter immer `<LegalLinks />` (kleine Zeile „Impressum · Datenschutz · Lizenzen“, `text-xs`, auf der jeweils aktuellen Seite ohne Link). Damit erscheinen die Links auf Anmelden, Registrieren, Passwort vergessen/zurücksetzen und den drei Rechtsseiten selbst.
- `LegalLinks.tsx`: `<nav aria-label="Rechtliches">` mit drei `Link`s (`linkClass`-Variante klein), Prop `current?: 'imprint' | 'privacy' | 'licenses'`.
- `LegalPage.tsx`: Rahmen für alle drei Seiten = `AuthLayout` mit `width="2xl"`, Prose-Klassen (`space-y-4 text-sm leading-relaxed`, `h2` in Big Shoulders, Listen `list-disc pl-5`), `footer` = Zurück-Link: `useBack(routes.lobby)` (Kompendium-Muster; `routes.lobby` schickt Ausgeloggte über `RequireAuth` zur Anmeldung).
- `ImpressumPage.tsx`: Überschrift „Impressum“, „Angaben gemäß § 5 DDG“ (Name, Anschrift, Land), Kontakt (E-Mail als `mailto:`), „Verantwortlich für den Inhalt“ (= Anbieter), Haftungshinweis für Inhalte und Links (kurz, ohne Boilerplate-Roman), Hinweis auf nicht gewerbliches, privates Angebot.
- `DatenschutzPage.tsx`: Abschnitte Verantwortlicher (aus `ANBIETER`), Hosting und Server-Logs (netcup GmbH, Nürnberg; Caddy/Fastify-Logs mit IP, Zeit, URL, Browser; Zweck Betrieb und Sicherheit), Konto (welche Daten, Zweck, Rechtsgrundlage Art. 6 Abs. 1 lit. b; Passwort nur als Hash; Avatar optional; E-Mail-Bestätigung; Partiedaten und Partieverlauf für Mitspieler sichtbar: Anzeigename, Avatar, Fraktion), Cookie `dos_session` (notwendig, 30 Tage gleitend — Wert aus `session.ts` übernehmen, kein Tracking, keine Einwilligung nötig), E-Mail-Versand (Mailjet SAS, Paris, Auftragsverarbeiter; welche Mails: Bestätigung, Passwort zurücksetzen, Hinweise, Benachrichtigungen laut Einstellungen; Tracking deaktiviert), Push-Benachrichtigungen (nur nach Opt-in, Endpunkt des Browseranbieters, abschaltbar in den Einstellungen), Backups (Aufbewahrung laut Compose: 7 Tage / 4 Wochen / 6 Monate; gelöschte Daten verschwinden spätestens danach), Löschung (Einstellungen → Konto löschen; Partien bleiben anonymisiert), keine Analyse-, Werbe- oder Social-Media-Einbindungen, Schriften lokal, Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit, Beschwerde bei einer Aufsichtsbehörde), Stand-Datum. Neutrale Sie-Form wie bei Rechtstexten üblich; der Rest der App bleibt beim Du.
- `LizenzenPage.tsx`: „Spiel und Quellcode“ (MIT, Jahr und Name aus dem Lizenztext, Text per `import license from '../../../../LICENSE?raw'`, in `<pre>` eingeklappt über `<details>`), „Illustrationen, Wappen, Musik und Ambiente“ (alle Rechte vorbehalten; Musik und Ambiente mit Suno erstellt — Satz aus `credits.json.music_and_ambience`), „Soundeffekte“ (Tabelle aus `credits.json.sfx_source_recordings`: Titel, Urheber mit Link auf Quelle, Lizenz mit Link; Satz `sfx_note`; Link `/audio/CC0-1.0.txt`), „Schriften“ (Barlow, Big Shoulders Display, IBM Plex Mono: SIL Open Font License 1.1), „Symbole“ (lucide, ISC), „Bibliotheken“ (Open Source; Liste in `package.json` des Repositories, Link `ANBIETER.repo`). `credits.json` per JSON-Import aus `public/audio/` (Vite bündelt es, ~3 KB; Typ `Credits` in der Seite). `tsconfig` ggf. `resolveJsonModule` prüfen.

## Task 5: Verlinkung in der Shell

- `shell/UserMenu.tsx` (Design-Übergabe, minimal): optionale Prop `onOpenLegal?: () => void`; bei gesetzter Prop ein Menüpunkt „Rechtliches“ (lucide `Scale`) im zweiten Block unter „Einstellungen“. `shell/AppShell.tsx`: Props `onOpenLegal?` durchreichen und `footer?: ReactNode` (Menü-Variante: nach `<main>` gerendert; das untere Polster für die Tab-Leiste wandert von `<main>` auf einen Wrapper um `main` + `footer`, damit die Fußzeile über der Tab-Leiste bleibt). `shell/index.ts` exportiert ggf. nichts Neues.
- `layouts/MenuLayout.tsx`: `onOpenLegal={() => navigate(routes.imprint)}` und `footer={<MenuFooter />}`.
- `shell/MenuFooter.tsx` (nicht Design-Übergabe, normal formatiert): `<footer>` mit `border-t border-stone-200`, `max-w-7xl`, `text-xs text-stone-500`, links „© 2026 Dominion of Steam“, rechts `<LegalLinks />`. Gleiche Komponente wie unter der Anmeldekarte.
- `layouts/GameLayout.tsx`: `onOpenLegal` ebenfalls durchreichen (das Benutzermenü gibt es auch im Spielmodus), keine Fußzeile.

## Task 6: Tests

- `pages/rechtliches/Rechtliches.test.tsx`:
  - `/impressum` ausgeloggt: Überschrift „Impressum“, E-Mail aus `ANBIETER`, Links „Datenschutz“ und „Lizenzen“ wechseln die Route; Zurück-Link führt zu `/` → Anmeldung (Router-Pfad `/anmelden`).
  - `/datenschutz`: Überschrift, Abschnitt „Cookie“ nennt `dos_session`.
  - `/lizenzen`: „MIT“, ein Urheber aus `credits.json` (dynamisch aus dem Import, nicht hart kodiert), Link auf `/audio/CC0-1.0.txt`.
  - Eingeloggt auf `/`: Fußzeile mit `nav[aria-label="Rechtliches"]`; Benutzermenü öffnen → „Rechtliches“ → Pfad `/impressum`.
  - Anmeldeseite `/anmelden` zeigt die Links.
- `pages/rechtliches/manifest.test.ts` (Task 2).
- Bestehende Tests: `Anmeldung.test.tsx` könnte durch zusätzliche Links `getByRole('link')`-Treffer bekommen — prüfen, Selektoren ggf. mit Namen präzisieren.

## Task 7: Dokumentation

- `README.md`: Abschnitt „Rechtliches & Auftritt“ (Seiten, `anbieter.ts` ausfüllen, Icon-Skript, Schriften lokal, Manifest).
- `deploy/README.md`: Schritt vor dem ersten Deploy: `apps/web/src/pages/rechtliches/anbieter.ts` ausfüllen, Datenschutzerklärung gegenlesen (Hosting-Anbieter, Backup-Fristen), Repository-Link prüfen (öffentlich?).
- `agent-os/product/roadmap.md`: Phase 2 neuer Punkt ~~Online-Auftritt~~ umgesetzt; `tech-stack.md`: Schriften via `@fontsource`, keine externen Ressourcen, Web-Manifest.
- Memory-Notiz ergänzen: Icon-Skript-Aufruf (Playwright aus dem npx-Cache).

## Verifikation

- `pnpm lint`, `pnpm typecheck`, `pnpm test` grün; `pnpm --filter web build` legt `.woff2` in `dist/assets` ab und kopiert `public/` (Icons, Manifest) nach `dist/`.
- Headless Chrome gegen `pnpm dev` (`localhost:5173`): Anfragen an `/favicon.ico`, `/icon.svg`, `/apple-touch-icon.png`, `/manifest.webmanifest` liefern 200 mit passendem Content-Type; keine Anfrage an `googleapis`/`gstatic`; Schriften werden aus `/node_modules/@fontsource/…` (dev) geladen. Ausgeloggt `/impressum`, `/datenschutz`, `/lizenzen` erreichbar, `/anmelden` zeigt die Links. Eingeloggt: Fußzeile in der Lobby, Menüpunkt „Rechtliches“ öffnet das Impressum, Spielfeld ohne Fußzeile.
- Screenshots nach `visuals/`: Impressum (Dev-Hinweis sichtbar), Lizenzen, Anmeldung mit Fußzeile, Benutzermenü, Lobby-Fußzeile (Desktop und mobil), Icon-Montage.
- Checkliste für den Betreiber in `shape.md`: Anbieterdaten eintragen, Datenschutzerklärung gegenlesen, Repository-Link, Icon-Skript bei neuem Logo erneut ausführen.
