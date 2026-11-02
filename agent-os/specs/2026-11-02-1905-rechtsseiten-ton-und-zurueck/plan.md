# Rechtsseiten: Tonfehler und Zurück-Link

## Context
Zwei Fehler auf Impressum, Datenschutz und Lizenzen, beide vom Nutzer gemeldet:

1. **Tonfehler:** Ton stumm, dann eine Rechtsseite öffnen. Die Musik klingt kurz auf und verstummt wieder.
   - Ursache: Die Rechtsseiten liegen außerhalb von `RequireAuth`. Beim Wechsel dorthin wird `SignedInAudio` (`apps/web/src/audio/AudioProvider.tsx`) abgebaut.
   - Die Aufräumfunktion ruft `engine.stopAll()` auf. Das blendet die Musik über `DEFAULT_FADE_MS` aus.
   - Direkt danach setzt sie `engine.setVolumes(DEFAULT_SETTINGS.sound)`. Damit ist die Stummschaltung während des Ausblendens aufgehoben.
   - Beim Abmelden passiert dasselbe.
   - Verwandt: Nach dem Anmelden ist der Query-Cache leer. `SignedInAudio` setzt deshalb erst die Standardlautstärken und startet die Menümusik, bevor die Einstellungen geladen sind. Auch hier ist eine stumme Spielerin kurz zu hören.
2. **Zurück-Link:** `LegalPage` nutzt `useBack` (`pages/kompendium/useBack.ts`), also `navigate(-1)`. Wer von der Lobby zum Impressum und dann zum Datenschutz geht, landet beim Zurück wieder im Impressum statt in der Lobby. Abgemeldet geht es ebenfalls nicht direkt zur Anmeldung.

Entscheidungen des Nutzers:
- Die Rechtsseiten bleiben still.
- Der Link nennt sein Ziel: „Zur Lobby“, wenn angemeldet, sonst „Zur Anmeldung“.

## Task 1: Spec-Dokumentation speichern
`agent-os/specs/2026-11-02-1905-rechtsseiten-ton-und-zurueck/`:
- `plan.md`: dieser Plan
- `shape.md`: Umfang, Ursache, Entscheidungen; Produktbezug Online-Auftritt (`2026-10-31-1900-online-auftritt`) und Ton (`2026-11-01-1139-ton-beim-wechsel`)
- `references.md`: `SignedInAudio`, `useBack`, `LegalPage`, `RequireAuth`, `useMe`
- `standards.md`: Es gibt keinen Ordner `agent-os/standards/`, daher nur ein Vermerk „keine Standards hinterlegt“.
- Keine Visuals.

## Task 2: Stummschaltung beim Verlassen bleibt erhalten
In `apps/web/src/audio/AudioProvider.tsx`, Funktion `SignedInAudio`:
- Die Aufräumfunktion ruft nur noch `engine.stopAll()` auf, ohne `setVolumes(DEFAULT_SETTINGS.sound)`. Die Lautstärken setzt ohnehin der Volume-Effekt beim nächsten Mount, also nach dem nächsten Login oder bei der Rückkehr von der Rechtsseite.
- Musik startet erst mit geladenen Einstellungen: Der Musik-Effekt spielt `music` nur, wenn `data` da ist. Der Volume-Effekt ist früher deklariert und läuft daher zuerst. So klingt nach dem Login keine Musik mehr kurz an, bevor die Stummschaltung greift. Bei der Rückkehr von einer Rechtsseite sind die Daten noch im Cache, dort gibt es also keine Verzögerung.
- Den Kommentar über der Aufräumfunktion („back to the default volumes“) anpassen.

## Task 3: Zurück-Link mit festem Ziel
- `apps/web/src/pages/rechtliches/LegalPage.tsx`: `useBack` entfällt. Stattdessen `useMe()` aus `data/session`:
  - Ist `me === null`, zeigt der Link „Zur Anmeldung“ und führt zu `routes.login`.
  - Sonst zeigt er „Zur Lobby“ und führt zu `routes.lobby`. Während des Ladens ist das ebenfalls das Ziel; `RequireAuth` leitet notfalls zur Anmeldung weiter.
- Es wird ein `<Link>` statt eines Buttons, mit `linkClass` aus `AuthLayout`. Ein echter Link lässt sich auch in einem neuen Tab öffnen.
- `useBack` bleibt für das Kompendium unverändert.

## Task 4: Tests
- `apps/web/src/pages/rechtliches/Rechtliches.test.tsx`:
  - Den Test „Zurück ohne Verlauf …“ ersetzen: Abgemeldet führt „Zur Anmeldung“ zur Anmeldeseite.
  - Neu: Angemeldet geht es Lobby → Impressum → Datenschutz, dann führt „Zur Lobby“ direkt zur Lobby.
  - Den Menü-Test (Zeile 83 f.) auf „Zur Lobby“ umstellen.
- `apps/web/src/audio/AudioProvider.test.tsx`:
  - Neu: Stumm in der Lobby, dann eine Rechtsseite öffnen. `stopAll` wird aufgerufen, die zuletzt gesetzten Lautstärken bleiben `muted: true`, und nach `stopAll` folgt kein `setVolumes` mit Standardwerten.
  - Neu: Vor dem Laden der Einstellungen startet keine Musik. Dazu die Settings-Antwort im `mockApi` verzögern.
  - Den bestehenden Abmelde-Test (Zeile 101) prüfen und anpassen.

## Verification
- `pnpm lint`. `typecheck` je Paket (`apps/web`); `pnpm -r` stirbt mit SIGKILL. `pnpm vitest run src/audio src/pages/rechtliches` in `apps/web`.
- Im Container prüfen: `docker compose up -d --build`, dann im Browser http://localhost:8080. Ton stumm, über das Benutzermenü „Rechtliches“ öffnen: kein Ton. Danach zum Datenschutz, dann „Zur Lobby“: Man landet direkt in der Lobby, die Musik bleibt stumm. Nach dem Abmelden zeigt das Impressum „Zur Anmeldung“.
- Roadmap und README nicht nötig, eine kleine Korrektur. Die Spec wird nur im `shape.md` der Online-Auftritt-Spec querverwiesen.
- Commit, dann `git push origin main:dev`.
