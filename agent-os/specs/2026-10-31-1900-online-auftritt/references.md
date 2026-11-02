# Referenzen für Online-Auftritt

### Anmelde-Rahmen

- **Ort:** `apps/web/src/pages/anmeldung/AuthLayout.tsx` (`AuthLayout`, `linkClass`), `LoginPage.tsx`
- **Bezug:** Messingkarte mit Nieten und Big-Shoulders-Überschrift; um `width`, optionales `footer` und `LegalLinks` erweitert.

### Kompendium

- **Ort:** `apps/web/src/pages/kompendium/useBack.ts`
- **Bezug:** „Zurück“ mit Verlauf oder Fallback, auch für die Rechtsseiten.

### Shell

- **Ort:** `apps/web/src/shell/AppShell.tsx` (`headerExtra` aus der Ton-Spec als Vorbild für `footer`), `shell/UserMenu.tsx`, `layouts/MenuLayout.tsx`, `layouts/GameLayout.tsx`
- **Bezug:** Minimale Eingriffe in Komponenten der Design-Übergabe, Verdrahtung in den Layouts.

### Statische Dateien und Service Worker

- **Ort:** `apps/web/vite.config.ts` (`publicDir`), `apps/server/src/app.ts` (`fastifyStatic`, Not-Found-Fallback), `public/sw.js`
- **Bezug:** Wo Icons und Manifest liegen müssen und warum `favicon.ico` echt sein muss.

### Lizenzmaterial

- **Ort:** `LICENSE` (MIT mit Ausnahme), `public/audio/credits.json`, `public/audio/CC0-1.0.txt`
- **Bezug:** Quellen der Lizenzseite.

### Tests

- **Ort:** `apps/web/src/pages/anmeldung/Anmeldung.test.tsx`, `apps/web/src/audio/ids.test.ts`
- **Bezug:** Ausgeloggte Seiten mit `renderApp('/…', { user: null })`, Dateiprüfungen relativ zu `process.cwd()`.
