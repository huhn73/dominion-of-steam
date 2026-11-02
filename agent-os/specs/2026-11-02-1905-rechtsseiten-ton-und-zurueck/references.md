# Referenzen für Rechtsseiten: Ton und Zurück-Link

### SignedInAudio

- **Ort:** `apps/web/src/audio/AudioProvider.tsx`
- **Bezug:** Lautstärken aus den Einstellungen, Menümusik je nach Route, Aufräumen beim Verlassen des angemeldeten Bereichs (Abmelden, Rechtsseiten)

### RequireAuth und useMe

- **Ort:** `apps/web/src/auth/RequireAuth.tsx`, `apps/web/src/data/session.ts`
- **Bezug:** `SignedInAudio` hängt in `RequireAuth`. `useMe()` liefert `null`, wenn niemand angemeldet ist, und entscheidet damit über das Ziel des Links.

### LegalPage und useBack

- **Ort:** `apps/web/src/pages/rechtliches/LegalPage.tsx`, `apps/web/src/pages/kompendium/useBack.ts`
- **Bezug:** Bisher `navigate(-1)` mit der Lobby als Rückfallziel. Das Kompendium nutzt `useBack` weiter.
