import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, ne, sql } from 'drizzle-orm'
import { currentParticipant, endTurn } from '@dos/shared/engine'
import type { CommandResponse, PlayerView } from '@dos/shared/game'
import type { ServerSignal } from '@dos/shared/realtime'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { matches, turns } from '../db/schema'
import { findMatch, saveMatch } from '../matches/repository'
import { BJOERN, loginAs } from '../test/helpers'
import { type AiJob, playJob } from './play'
import { createAiRunner } from './runner'

const url = process.env.TEST_DATABASE_URL

/** NOTIFY arrives asynchronously after the commit */
const settle = () => new Promise((r) => setTimeout(r, 150))

describe.skipIf(!url)('KI-Züge im Hintergrund (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({ db, dev: true })
  let bjoern: Awaited<ReturnType<typeof loginAs>>

  /** Solo match of Björn against two AIs (small map, fixed seed) */
  async function solo() {
    const res = await bjoern.request('POST', '/api/dev/matches/solo', {
      size: 'small',
      opponents: 2,
      seed: 'KOHLE-4417',
    })
    return res.json<{ matchId: string }>().matchId
  }

  /** Björn's turn ends directly in the database: the AIs are due, but nobody queued them */
  async function aiDue(matchId: string) {
    const state = (await findMatch(db, matchId))!
    const next = endTurn(structuredClone(state), new Date())
    await db.transaction((tx) => saveMatch(tx, next))
    const [row] = await db.select().from(matches).where(eq(matches.id, matchId))
    expect(row!.aiPending).toBe(true)
  }

  const stateOf = async (matchId: string) => (await findMatch(db, matchId))!

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    await app.close()
    app = buildApp({ db, dev: true, notifications: { push: null, mail: null, autoDeliver: false } })
    await ensureDevAccounts(app.accounts)
    await db.delete(matches).where(ne(matches.id, 'demo'))
    // The demo match must not hand AI turns to the runners of these tests
    await db.update(matches).set({ aiPending: false })
    bjoern = await loginAs(app, BJOERN)
  })
  afterAll(async () => {
    await app.close()
    await close()
  })

  it('Zugende kommt sofort zurück, die KIs ziehen danach mit einem Signal je Zug', async () => {
    const matchId = await solo()
    const got: ServerSignal[] = []
    const stop = await app.realtime.subscribe(bjoern.me.id, (s) => got.push(s))

    const res = await bjoern.request('POST', `/api/matches/${matchId}/commands`, {
      type: 'endTurn',
    })
    expect(res.json<CommandResponse>().view.match).toMatchObject({
      round: 1,
      phase: 'waiting',
      currentId: 'ai1',
    })
    await app.aiRunner.idle()
    await settle()
    stop()

    const view = (await bjoern.request('GET', `/api/matches/${matchId}/view`)).json<PlayerView>()
    expect(view.match).toMatchObject({ round: 2, currentId: bjoern.me.id })
    // One signal for the board after each of the two AI turns
    expect(got.flatMap((s) => s.topics).filter((t) => t === `match:${matchId}`)).toHaveLength(2)
    const recorded = await db.select().from(turns).where(eq(turns.matchId, matchId))
    expect(recorded.map((t) => t.participantId).sort()).toEqual(['ai1', 'ai2', bjoern.me.id].sort())
    const [row] = await db.select().from(matches).where(eq(matches.id, matchId))
    expect(row!.aiPending).toBe(false)
  })

  it('setzt nach einem Neustart fort, was in der Datenbank als KI-Zug offen ist', async () => {
    const matchId = await solo()
    await aiDue(matchId)
    expect(await app.aiRunner.recover()).toBe(1)
    await app.aiRunner.idle()
    const state = await stateOf(matchId)
    expect(state.round).toBe(2)
    expect(currentParticipant(state).id).toBe(bjoern.me.id)
  })

  it('verwirft das Ergebnis, wenn sich die Partie während der Rechnung ändert', async () => {
    const matchId = await solo()
    await aiDue(matchId)
    let calls = 0
    const runner = createAiRunner(db, {
      inline: true,
      play: async (job: AiJob) => {
        calls++
        // Meanwhile something else saves the match (e.g. a surrender)
        if (calls === 1)
          await db
            .update(matches)
            .set({ version: sql`${matches.version} + 1` })
            .where(eq(matches.id, matchId))
        return playJob(job)
      },
    })
    runner.schedule(matchId)
    await runner.idle()
    await runner.close()
    // ai1 was computed twice (first result discarded), then ai2 once
    expect(calls).toBe(3)
    const state = await stateOf(matchId)
    expect(state.round).toBe(2)
    expect(currentParticipant(state).id).toBe(bjoern.me.id)
    const recorded = await db.select().from(turns).where(eq(turns.matchId, matchId))
    expect(recorded.filter((t) => t.participantId === 'ai1')).toHaveLength(1)
  })

  it('ein Fehler der KI beendet nur ihren Zug', async () => {
    const matchId = await solo()
    await aiDue(matchId)
    const errors: string[] = []
    const runner = createAiRunner(db, {
      inline: true,
      play: async () => ({ ok: false, error: 'kaputt' }),
      log: (msg) => errors.push(msg),
    })
    runner.schedule(matchId)
    await runner.idle()
    await runner.close()
    expect(errors).toHaveLength(2)
    const state = await stateOf(matchId)
    expect(state.round).toBe(2)
    expect(currentParticipant(state).id).toBe(bjoern.me.id)
  })

  it('rechnet im Worker-Thread', async () => {
    const matchId = await solo()
    await aiDue(matchId)
    const runner = createAiRunner(db, { workers: 1 })
    runner.schedule(matchId)
    await runner.idle()
    await runner.close()
    const state = await stateOf(matchId)
    expect(state.round).toBe(2)
    expect(currentParticipant(state).id).toBe(bjoern.me.id)
    const recorded = await db.select().from(turns).where(eq(turns.matchId, matchId))
    expect(recorded.find((t) => t.participantId === 'ai1')!.actions.length).toBeGreaterThan(0)
  })
})
