import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { and, eq, ne } from 'drizzle-orm'
import type { ServerSignal } from '@dos/shared/realtime'
import type { MatchDraft, SetupData } from '@dos/shared/setup'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { invitations, matches, setupReservations } from '../db/schema'
import { SESSION_COOKIE } from '../session'
import { BJOERN, LENA, loginAs } from '../test/helpers'
import { signal } from './signals'

const url = process.env.TEST_DATABASE_URL

type Session = Awaited<ReturnType<typeof loginAs>>

/** Collects the signals of a player through the hub (the same path as the event stream) */
async function listen(app: ReturnType<typeof buildApp>, playerId: string) {
  const got: ServerSignal[] = []
  const stop = await app.realtime.subscribe(playerId, (s) => got.push(s))
  return { got, stop, topics: () => got.flatMap((s) => s.topics) }
}

/** NOTIFY arrives asynchronously after the commit */
const settle = () => new Promise((r) => setTimeout(r, 150))

describe.skipIf(!url)('Echtzeit-Signale (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({ db, dev: true })
  let bjoern: Session
  let lena: Session

  async function waitingMatch(seats: MatchDraft['seats']) {
    const data = (await bjoern.request('GET', '/api/setup')).json<SetupData>()
    const draft: MatchDraft = {
      ...data.draft,
      name: 'Funkspruch',
      factionId: 'eisenbund',
      mode: 'async',
      asyncTurnLimitHours: 24,
      victoryCondition: 'elimination',
      fillEmptyWithAI: true,
      seats,
      map: { ...data.draft.map, size: 'small', landShare: 50, seed: 'FUNK-4242' },
    }
    const res = await bjoern.request('POST', '/api/matches', {
      draft,
      reservationId: data.reservationId,
    })
    expect(res.statusCode).toBe(201)
    return res.json<{ matchId: string }>().matchId
  }
  const invitationOf = async (matchId: string, playerId: string) =>
    (
      await db
        .select()
        .from(invitations)
        .where(and(eq(invitations.matchId, matchId), eq(invitations.playerId, playerId)))
    )[0]!

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    await app.close()
    app = buildApp({ db, dev: true, notifications: { push: null, mail: null, autoDeliver: false } })
    await ensureDevAccounts(app.accounts)
    await db.delete(matches).where(ne(matches.id, 'demo'))
    await db.delete(setupReservations)
    bjoern = await loginAs(app, BJOERN)
    lena = await loginAs(app, LENA)
  })
  afterAll(async () => {
    await app.close()
    await close()
  })

  it('stellt Signale erst beim Commit zu, nach einem Rollback gar nicht', async () => {
    const l = await listen(app, lena.me.id)
    await db
      .transaction(async (tx) => {
        await signal(tx, [lena.me.id], ['match:verworfen'])
        throw new Error('Rollback')
      })
      .catch(() => {})
    await db.transaction((tx) => signal(tx, [lena.me.id, bjoern.me.id], ['lobby']))
    await settle()
    expect(l.topics()).toEqual(['lobby'])
    l.stop()
  })

  it('meldet Einladung, Beitritt und Start im Warteraum', async () => {
    const lb = await listen(app, lena.me.id)
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'friend', friendId: lena.me.id }])
    await settle()
    expect(lb.topics()).toEqual(['lobby'])

    const bj = await listen(app, bjoern.me.id)
    const inv = await invitationOf(id, lena.me.id)
    expect((await lena.request('POST', `/api/invitations/${inv.id}/accept`)).statusCode).toBe(200)
    expect(
      (await lena.request('POST', `/api/matches/${id}/ready`, { ready: true })).statusCode,
    ).toBe(200)
    await settle()
    expect(bj.topics()).toEqual([`room:${id}`, 'lobby', `room:${id}`, 'lobby'])

    bj.got.length = 0
    lb.got.length = 0
    const res = await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: true })
    expect(res.statusCode).toBe(200)
    await settle()
    expect(lb.topics()).toEqual(expect.arrayContaining([`room:${id}`, `match:${id}`, 'lobby']))
    bj.stop()
    lb.stop()
  })

  it('meldet einen Zug den anderen Teilnehmern, dem Handelnden nur die Lobby', async () => {
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'friend', friendId: lena.me.id }])
    const inv = await invitationOf(id, lena.me.id)
    await lena.request('POST', `/api/invitations/${inv.id}/accept`)
    await lena.request('POST', `/api/matches/${id}/ready`, { ready: true })
    await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: true })
    await settle()

    const lb = await listen(app, lena.me.id)
    const bj = await listen(app, bjoern.me.id)
    const res = await bjoern.request('POST', `/api/matches/${id}/commands`, { type: 'endTurn' })
    expect(res.statusCode).toBe(200)
    await settle()
    expect(lb.topics()).toEqual([`match:${id}`, 'lobby'])
    expect(bj.topics()).toEqual(['lobby'])
    lb.stop()
    bj.stop()
  })

  it('liefert die Signale als Server-Sent Events', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/events' })).statusCode).toBe(401)
    const address = await app.listen({ port: 0, host: '127.0.0.1' })
    const ctrl = new AbortController()
    const res = await fetch(`${address}/api/events`, {
      headers: { cookie: `${SESSION_COOKIE}=${lena.token}`, 'accept-encoding': 'gzip, br' },
      signal: ctrl.signal,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^text\/event-stream/)
    expect(res.headers.get('content-encoding')).toBeNull()
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader()
    let text = ''
    const until = async (needle: string) => {
      while (!text.includes(needle)) {
        const { value, done } = await reader.read()
        if (done) throw new Error(`Stream zu Ende ohne ${needle}: ${text}`)
        text += value
      }
    }
    await until('"ready"')
    await db.transaction((tx) => signal(tx, [lena.me.id], ['lobby']))
    await until('data: {"topics":["lobby"]}')
    expect(app.realtime.streams()).toBe(1)
    ctrl.abort()
    await settle()
    expect(app.realtime.streams()).toBe(0)
  })
})
