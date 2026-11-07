import { buildApp, devToolsEnabled } from './app'
import { createDb, runMigrations } from './db/client'

const port = Number(process.env.PORT ?? 3000)
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL fehlt (siehe apps/server/.env.example)')
  process.exit(1)
}

const { db } = createDb(url)
await runMigrations(db)
const app = buildApp({ db, logger: true, staticDir: process.env.STATIC_DIR })
if (devToolsEnabled()) {
  // Dev accounts and demo match (reset when it still has the old participant ids)
  await app.matches.ensureDemo()
  const deleted = await app.matches.deleteLegacyMatches()
  if (deleted) app.log.info(`${deleted} alte Solo-Partien ohne Konto gelöscht`)
}
await app.accounts.deleteExpiredSessions()
const fixed = await app.matches.backfillSeats()
if (fixed) app.log.info(`Plätze für ${fixed} ältere Partien ergänzt`)
// AIs that were on the move when the server stopped carry on
const pending = await app.aiRunner.recover()
if (pending) app.log.info(`KI-Züge in ${pending} Partien fortgesetzt`)
// Expired turns, "Frist läuft bald ab" and delayed e-mails
app.sweeper.start((msg, err) => app.log.error({ err }, msg))

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

// Avatars from before the WebP conversion and orphaned files; in the background, start is not delayed
void app.profile
  .maintainAvatars()
  .then(({ converted, cleared, deleted }) => {
    if (converted || cleared || deleted)
      app.log.info(
        `Avatare: ${converted} umgerechnet, ${cleared} ohne Datei entfernt, ${deleted} verwaiste Dateien gelöscht`,
      )
  })
  .catch((err: unknown) => app.log.error({ err }, 'Avatare aufräumen fehlgeschlagen'))
