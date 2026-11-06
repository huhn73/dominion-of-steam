# Referenzen für Neuigkeiten

### Version in der Fußzeile

- **Ort:** `apps/web/src/version.ts`, `apps/web/src/shell/AppVersion.tsx`, `shell/MenuFooter.tsx`, `pages/anmeldung/AuthLayout.tsx`
- **Bezug:** laufende Version, Platz des Links „Neuigkeiten“.

### Einmaliger Hinweis je Spieler

- **Ort:** `apps/server/src/tutorial/service.ts` (`tutorialDismissedAt`), `routes/tutorial.ts` (`/tutorial/dismiss`), `apps/web/src/data/lobby.ts` (`dismissTutorial`), `sections/lobby/components/TutorialCard.tsx`
- **Bezug:** Spalte am Spieler, POST-Route, Data-Hook.

### Dialoge und Seiten

- **Ort:** `sections/spielfeld/components/Rundenbericht.tsx`, `pages/rechtliches/LegalPage.tsx`, `router.tsx`
- **Bezug:** Dialog-Stil, öffentliche Seite.

### Release

- **Ort:** `scripts/release.mjs`, `.github/workflows/deploy.yml`, `deploy/README.md` („Versionen und Releases“)
- **Bezug:** Versionsnummer, Pflege der Einträge beim Release.
