import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { CommandResponse, PlayerView } from '@dos/shared/game'
import { buildApp } from './app'
import { createDb, runMigrations } from './db/client'
import { turns } from './db/schema'
import { eq } from 'drizzle-orm'
import { createMatch, defaultRules, seedDemo } from '@dos/shared/engine'
import { MAP_SIZES } from '@dos/shared/game'
import { findMatch, insertMatch } from './matches/repository'
import { loginAs, LENA, sessionToken } from './test/helpers'

const url = process.env.TEST_DATABASE_URL

describe('GET /api/health', () => {
  it('meldet ok', async () => {
    const app = buildApp({ db: {} as never })
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    // Without the image build's APP_VERSION the version of the package is a development build
    expect(res.json()).toMatchObject({
      ok: true,
      version: expect.stringMatching(/^\d+\.\d+\.\d+-dev$/),
      commit: null,
    })
  })
})

describe('GET /api/compendium', () => {
  it('liefert alle Fraktionen und Einheitentypen', async () => {
    const res = await buildApp({ db: {} as never }).inject({
      method: 'GET',
      url: '/api/compendium',
    })
    const data = res.json<{ factions: { id: string }[]; unitTypes: { id: string }[] }>()
    expect(data.factions.map((f) => f.id)).toEqual([
      'eisenbund',
      'aurelia',
      'nordmark',
      'salzkueste',
    ])
    expect(data.unitTypes).toHaveLength(12)
  })
})

describe.skipIf(!url)('Partie-API (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({ db, dev: true })
  let user: Awaited<ReturnType<typeof loginAs>>

  const view = async () => (await user.request('GET', '/api/matches/demo/view')).json<PlayerView>()
  const command = async (body: unknown) =>
    await user.request('POST', '/api/matches/demo/commands', body as object)

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    app = buildApp({ db, dev: true })
    await app.matches.resetDemo()
    user = await loginAs(app)
  })
  afterAll(async () => {
    await close()
  })

  it('verlangt eine Anmeldung', async () => {
    for (const [method, path] of [
      ['GET', '/api/matches/demo/view'],
      ['POST', '/api/matches/demo/commands'],
      ['POST', '/api/dev/demo/reset'],
      ['POST', '/api/dev/matches/solo'],
      ['POST', '/api/dev/matches/demo/pass'],
    ] as const) {
      const res = await app.inject({ method, url: path, payload: {} })
      expect(res.statusCode, path).toBe(401)
      expect(res.json().error.code).toBe('NOT_AUTHENTICATED')
    }
  })

  it('liefert Björn die Sicht von p1 mit Kriegsnebel', async () => {
    const v = await view()
    expect(v.match).toMatchObject({ id: 'demo', youId: user.me.id, phase: 'replay', round: 14 })
    expect(v.participants.find((p) => p.id === user.me.id)?.name).toBe('Björn')
    expect(v.units.filter((u) => u.ownerId === user.me.id).length).toBeGreaterThan(0)
    expect(v.cities.some((c) => c.name === 'Frostheim')).toBe(false)
  })

  it('liefert Lena Hartmann ihre eigene Sicht', async () => {
    const lena = await loginAs(app, LENA)
    const v = (await lena.request('GET', '/api/matches/demo/view')).json<PlayerView>()
    expect(v.match).toMatchObject({ youId: lena.me.id, phase: 'waiting' })
    expect(v.cities.find((c) => c.name === 'Frostheim')?.ownerId).toBe(lena.me.id)
  })

  it('verweigert Spielern ohne Teilnahme die Partie (403)', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        displayName: `Gast ${Date.now()}`,
        email: `gast-${Date.now()}@example.test`,
        password: 'geheim-genug',
      },
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/matches/demo/view',
      cookies: { dos_session: sessionToken(reg)! },
    })
    expect(res.statusCode).toBe(403)
  })

  it('antwortet 404 für unbekannte Partien und 400 für kaputte Befehle', async () => {
    expect((await user.request('GET', '/api/matches/nope/view')).statusCode).toBe(404)
    const res = await command({ type: 'move', unitId: 'u1' })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('BAD_COMMAND')
  })

  it('sperrt Aktionen während der Wiederholung (409) und prüft Regeln (422)', async () => {
    let res = await command({ type: 'move', unitId: 'u1', target: { col: 5, row: 3 } })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('REPLAY_ACTIVE')

    res = await command({ type: 'skipReplay' })
    expect(res.json<CommandResponse>().view.match.phase).toBe('yourTurn')

    res = await command({ type: 'move', unitId: 'u1', target: { col: 0, row: 0 } })
    expect(res.statusCode).toBe(422)
    expect(res.json().error.code).toBe('UNREACHABLE')
  })

  it('speichert jede Aktion dauerhaft, auch über einen Neustart hinweg', async () => {
    await command({ type: 'skipReplay' })
    const res = await command({ type: 'move', unitId: 'u1', target: { col: 5, row: 3 } })
    expect(res.statusCode).toBe(200)

    app = buildApp({ db, dev: true }) // „Neustart“: neue App-Instanz, gleiche Datenbank
    user = await loginAs(app)
    const u1 = (await view()).units.find((u) => u.id === 'u1')
    expect(u1).toMatchObject({ col: 5, row: 3, movesLeft: 0 })
  })

  it('lässt nach dem Zugende die KI passen und wartet dann auf Lena Hartmann', async () => {
    await command({ type: 'skipReplay' })
    let res = await command({ type: 'endTurn' })
    let v = res.json<CommandResponse>().view
    expect(v.match.phase).toBe('waiting')
    expect(v.match.round).toBe(14)

    res = await user.request('POST', '/api/dev/matches/demo/pass')
    v = res.json<PlayerView>()
    expect(v.match.round).toBe(15)
    expect(['replay', 'yourTurn']).toContain(v.match.phase)

    res = await command({ type: 'endTurn' })
    expect(res.statusCode).toBe(v.match.phase === 'replay' ? 409 : 200)
  })

  it('setzt die Demo nur neu auf, wenn sie nicht zu den Dev-Konten gehört', async () => {
    await command({ type: 'skipReplay' })
    await app.matches.ensureDemo()
    expect((await view()).match.phase).toBe('yourTurn')

    await insertMatch(db, seedDemo('demo')) // Stand vor den Konten: Teilnehmer p1
    await app.matches.ensureDemo()
    expect((await view()).match).toMatchObject({ youId: user.me.id, phase: 'replay' })
  })

  it('legt eine Solo-Partie auf einer erzeugten Karte an, in der die KI spielt', async () => {
    const created = await user.request('POST', '/api/dev/matches/solo', {
      size: 'small',
      opponents: 2,
      seed: 'KOHLE-4417',
    })
    const { matchId } = created.json<{ matchId: string }>()
    expect(matchId).toMatch(/^solo-/)

    let res = await user.request('GET', `/api/matches/${matchId}/view`)
    const start = res.json<PlayerView>()
    expect(start.match).toMatchObject({ round: 1, phase: 'yourTurn', youId: user.me.id })
    expect(start.participants.find((p) => p.id === user.me.id)).toMatchObject({
      name: 'Björn',
      factionId: 'eisenbund',
    })
    expect(start.participants.filter((p) => p.isAI)).toHaveLength(2)

    res = await user.request('POST', `/api/matches/${matchId}/commands`, { type: 'endTurn' })
    const next = res.json<CommandResponse>().view
    expect(next.match.round).toBe(2)
    expect(['replay', 'yourTurn']).toContain(next.match.phase)

    const recorded = await db.select().from(turns).where(eq(turns.matchId, matchId))
    expect(recorded.map((t) => t.participantId).sort()).toEqual(['ai1', 'ai2', user.me.id].sort())
    expect(recorded.find((t) => t.participantId === 'ai1')!.actions.length).toBeGreaterThan(0)
  })

  it('löscht alte Solo-Partien ohne Konto, aber keine neuen', async () => {
    const { matchId } = (
      await user.request('POST', '/api/dev/matches/solo', { size: 'small', opponents: 1 })
    ).json<{ matchId: string }>()
    const legacy = createMatch({
      id: 'solo-legacy',
      name: 'Alt',
      rules: defaultRules('live'),
      map: {
        ...MAP_SIZES.small,
        landShare: 50,
        neutralCities: 'normal',
        terrain: 'normal',
        seed: 'A',
      },
      participants: [
        {
          id: 'p1',
          name: 'Björn',
          factionId: 'eisenbund',
          color: 'amber',
          isAI: false,
          aiDifficulty: null,
        },
        {
          id: 'ai1',
          name: 'KI',
          factionId: 'aurelia',
          color: 'rose',
          isAI: true,
          aiDifficulty: 'easy',
        },
      ],
    })
    await insertMatch(db, legacy)
    expect(await app.matches.deleteLegacyMatches()).toBeGreaterThanOrEqual(1)
    expect(await findMatch(db, 'solo-legacy')).toBeNull()
    expect(await findMatch(db, matchId)).not.toBeNull()
    expect(await findMatch(db, 'demo')).not.toBeNull()
  })
})
