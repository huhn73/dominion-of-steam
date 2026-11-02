import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ne } from 'drizzle-orm'
import type { Me } from '@dos/shared/account'
import type { AdminStats } from '@dos/shared/admin'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { matches } from '../db/schema'
import { SESSION_COOKIE } from '../session'
import { BJOERN, LENA, loginAs } from '../test/helpers'

const url = process.env.TEST_DATABASE_URL
const PASSWORD = 'dampfmaschine'

describe.skipIf(!url)('Nutzungsübersicht für Admins (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({
    db,
    dev: true,
    notifications: { push: null, mail: null, autoDeliver: false },
  })
  const previous = process.env.ADMIN_EMAILS

  const get = (token: string | null, path = '/api/admin/stats') =>
    app.inject({ method: 'GET', url: path, cookies: token ? { [SESSION_COOKIE]: token } : {} })

  async function statsAs(token: string, range?: number) {
    const res = await get(token, `/api/admin/stats${range ? `?range=${range}` : ''}`)
    expect(res.statusCode).toBe(200)
    return res.json<AdminStats>()
  }

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    process.env.ADMIN_EMAILS = ` Lena@Dominion.test , ${BJOERN}`
    app = buildApp({ db, dev: true, notifications: { push: null, mail: null, autoDeliver: false } })
    await ensureDevAccounts(app.accounts)
    await db.delete(matches).where(ne(matches.id, 'demo'))
  })
  afterEach(() => {
    if (previous === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = previous
  })
  afterAll(async () => {
    await close()
  })

  it('401 ohne Anmeldung, 403 ohne Admin-Recht, 200 für Admins (Liste ohne Groß-/Kleinschreibung)', async () => {
    expect((await get(null)).statusCode).toBe(401)
    const lena = await loginAs(app, LENA)
    expect((await get(lena.token)).statusCode).toBe(200)

    process.env.ADMIN_EMAILS = BJOERN
    const forbidden = await get(lena.token)
    expect(forbidden.statusCode).toBe(403)
    expect(forbidden.json()).toMatchObject({ error: { code: 'FORBIDDEN' } })

    delete process.env.ADMIN_EMAILS
    const bjoern = await loginAs(app, BJOERN)
    expect((await get(bjoern.token)).statusCode).toBe(403)
  })

  it('/api/me meldet isAdmin', async () => {
    process.env.ADMIN_EMAILS = BJOERN
    const bjoern = await loginAs(app, BJOERN)
    const lena = await loginAs(app, LENA)
    const me = (token: string) => get(token, '/api/me').then((r) => r.json<Me>())
    expect((await me(bjoern.token)).isAdmin).toBe(true)
    expect((await me(lena.token)).isAdmin).toBe(false)
  })

  it('Zeitraum: je Tag ein Eintrag bis heute, ungültiger Zeitraum → 422', async () => {
    const { token } = await loginAs(app, BJOERN)
    for (const range of [7, 30, 90]) {
      const stats = await statsAs(token, range)
      expect(stats.range).toBe(range)
      expect(stats.daily).toHaveLength(range)
      expect(new Set(stats.daily.map((d) => d.date)).size).toBe(range)
    }
    expect((await statsAs(token)).range).toBe(30)
    expect((await get(token, '/api/admin/stats?range=14')).statusCode).toBe(422)
    expect((await get(token, '/api/admin/stats?range=abc')).statusCode).toBe(422)
  })

  it('zählt echte Konten und Partien, Dev-Konten und Demo nicht; keine E-Mail-Adressen', async () => {
    const { token } = await loginAs(app, BJOERN)
    const before = await statsAs(token, 7)
    expect(before.recentPlayers.some((p) => p.name === 'Björn')).toBe(false)
    expect(before.recentMatches.some((m) => m.id === 'demo')).toBe(false)

    // A dev account plays solo: not counted
    const devSolo = await app.inject({
      method: 'POST',
      url: '/api/dev/matches/solo',
      payload: {},
      cookies: { [SESSION_COOKIE]: token },
    })
    expect(devSolo.statusCode).toBeLessThan(300)

    // A real account plays solo: counted
    const id = Date.now() % 100000
    const email = `kapitaen-${id}@example.org`
    await app.accounts.register({ displayName: `Kapitän ${id}`, email, password: PASSWORD })
    const real = await loginAs(app, email, PASSWORD)
    const solo = await app.inject({
      method: 'POST',
      url: '/api/dev/matches/solo',
      payload: {},
      cookies: { [SESSION_COOKIE]: real.token },
    })
    expect(solo.statusCode).toBeLessThan(300)

    const res = await get(token, '/api/admin/stats?range=7')
    const after = res.json<AdminStats>()
    expect(after.accounts.total - before.accounts.total).toBe(1)
    expect(after.accounts.new - before.accounts.new).toBe(1)
    expect(after.accounts.active24h - before.accounts.active24h).toBe(1)
    expect(after.matches.newInRange - before.matches.newInRange).toBe(1)
    expect(after.matches.solo - before.matches.solo).toBe(1)
    const today = (s: AdminStats) => s.daily.at(-1)!
    expect(today(after).registrations - today(before).registrations).toBe(1)
    expect(today(after).matchesStarted - today(before).matchesStarted).toBe(1)

    const row = after.recentPlayers.find((p) => p.id === real.me.id)
    expect(row).toMatchObject({ name: `Kapitän ${id}`, emailVerified: false, matches: 1 })
    expect(after.recentMatches[0]).toMatchObject({ humans: 1 })
    expect(after.recentMatches[0]!.ais).toBeGreaterThan(0)

    // No e-mail address anywhere in the answer
    expect(res.body).not.toContain('@')
  })
})
