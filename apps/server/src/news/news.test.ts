import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Me } from '@dos/shared/account'
import { latestNewsVersion } from '@dos/shared/news'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { players } from '../db/schema'
import { BJOERN, loginAs } from '../test/helpers'
import { runningVersion } from '../version'

const url = process.env.TEST_DATABASE_URL

describe.skipIf(!url)('Neuigkeiten (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  // Registration sends a verification mail; drop it instead of using SMTP
  const stubMail = { notifications: { push: null, mail: async () => {} } }
  let app = buildApp({ db, dev: true, ...stubMail })

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    app = buildApp({ db, dev: true, ...stubMail })
    await ensureDevAccounts(app.accounts)
    await db.update(players).set({ newsSeenVersion: '0.9.0' }).where(eq(players.email, BJOERN))
  })
  afterAll(async () => {
    await close()
  })

  it('liefert die gesehene Version mit /api/me', async () => {
    const bjoern = await loginAs(app)
    const me = (await bjoern.request('GET', '/api/me')).json<Me>()
    expect(me.newsSeenVersion).toBe('0.9.0')
  })

  it('merkt sich eine neuere Version, aber nie eine ältere', async () => {
    const bjoern = await loginAs(app)
    const up = await bjoern.request('POST', '/api/news/seen', { version: '0.10.1' })
    expect(up.statusCode).toBe(200)
    expect(up.json<Me>().newsSeenVersion).toBe('0.10.1')
    const down = await bjoern.request('POST', '/api/news/seen', { version: '0.10.0' })
    expect(down.json<Me>().newsSeenVersion).toBe('0.10.1')
  })

  it('lehnt unbekannte Versionen ab und verlangt eine Anmeldung', async () => {
    const bjoern = await loginAs(app)
    expect((await bjoern.request('POST', '/api/news/seen', { version: '9.9.9' })).statusCode).toBe(
      422,
    )
    const anonymous = await app.inject({
      method: 'POST',
      url: '/api/news/seen',
      payload: { version: '0.10.1' },
    })
    expect(anonymous.statusCode).toBe(401)
  })

  it('neue Spieler haben die aktuellen Neuigkeiten schon gesehen', async () => {
    const name = `Neu${Math.random().toString(36).slice(2, 8)}`
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { displayName: name, email: `${name}@dominion.test`, password: 'geheim123!' },
    })
    expect(res.statusCode, res.body).toBe(201)
    expect(res.json<Me>().newsSeenVersion).toBe(latestNewsVersion(runningVersion()))
    await db.delete(players).where(eq(players.displayName, name))
  })
})
