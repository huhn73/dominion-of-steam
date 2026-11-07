# References for Mehrsprachigkeit

## Einstellungen und Profil

- **Location:** `packages/shared/src/profile/{types.ts,index.ts}` (`Settings`, `DEFAULT_SETTINGS`, `settingsOf`, `validateSettings`), `apps/web/src/data/profile.ts`, `apps/web/src/settings/ApplyPlayerSettings.tsx`, `apps/web/src/sections/profil/components/Einstellungen.tsx`, `apps/server/src/routes/profile.ts`
- **Relevance:** Hier wird die Sprachwahl gespeichert und angewendet.
- **Key patterns:** Der Server-Wert gewinnt nach dem Login. localStorage spiegelt ihn für die Zeit vor dem Login (wie `theme/theme.ts`).

## Eigene Spalte im Spieler

- **Location:** `apps/server/src/db/schema.ts` (`newsSeenVersion`), `apps/server/drizzle/0009_neuigkeiten.sql`

## Texte heute

- **Web:** inline in `apps/web/src/{shell,layouts,pages,sections}`. Lokale Label-Maps gibt es in `sections/lobby/components/format.ts` (`DIFFICULTY_LABEL`, `timeLeft`, `timeAgo`) und `sections/profil/components/Einstellungen.tsx` (`RUBRICS`).
- **Shared:** `compendium/data.json`, `setup/data.ts` und `setup/validate.ts`, `game/engine/tutorial.ts` (`TUTORIAL_STEPS`), `news/index.ts`, `game/engine/commands.ts` (`fail(code, message)`), `addEvent` in `game/engine/state.ts` (etwa 23 Aufrufe)
- **Server:** `auth/accountMails.ts`, `notifications/{mail,service,events}.ts`, Fehlerklassen in `lobby`, `setup`, `profile` und `auth`
- **Rechtsseiten:** `apps/web/src/pages/rechtliches/*.tsx`
