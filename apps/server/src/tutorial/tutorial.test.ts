import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, ne } from 'drizzle-orm'
import { updateKnowledge } from '@dos/shared/engine'
import type { PlayerView } from '@dos/shared/game'
import type { LobbyData } from '@dos/shared/lobby'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { matches, notifications, players } from '../db/schema'
import { findMatch, insertMatch } from '../matches/repository'
import { BJOERN, loginAs } from '../test/helpers'

const url = process.env.TEST_DATABASE_URL

type Session = Awaited<ReturnType<typeof loginAs>>

describe.skipIf(!url)('Tutorial (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({ db, dev: true })
  let bjoern: Session

  const lobby = async () => (await bjoern.request('GET', '/api/lobby')).json<LobbyData>()
  const start = async (query = '') => {
    const res = await bjoern.request('POST', `/api/tutorial${query}`)
    expect(res.statusCode).toBe(200)
    return res.json<{ matchId: string }>().matchId
  }
  const command = (id: string, cmd: object) =>
    bjoern.request('POST', `/api/matches/${id}/commands`, cmd)

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    app = buildApp({ db, dev: true })
    await ensureDevAccounts(app.accounts)
    await db.delete(matches).where(ne(matches.id, 'demo'))
    await db.delete(notifications)
    await db.update(players).set({ tutorialCompletedAt: null, tutorialDismissedAt: null })
    bjoern = await loginAs(app, BJOERN)
  })
  afterAll(async () => {
    await close()
  })

  it('offers the tutorial in the lobby, starts and continues it', async () => {
    expect((await lobby()).tutorial).toMatchObject({
      matchId: null,
      completed: false,
      dismissed: false,
    })
    const id = await start()
    expect(id).toBe(`tutorial-${bjoern.me.id}`)
    const view = (await bjoern.request('GET', `/api/matches/${id}/view`)).json<PlayerView>()
    expect(view.tutorial?.current?.id).toBe('welcome')

    expect((await command(id, { type: 'tutorialNext' })).statusCode).toBe(200)
    expect(await start()).toBe(id)
    const data = await lobby()
    expect(data.tutorial).toMatchObject({ matchId: id, status: 'running', step: 1 })
    // Not part of the match lists
    expect(data.matches.map((m) => m.id)).not.toContain(id)

    await start('?neu=1')
    expect((await lobby()).tutorial.step).toBe(0)
  })

  it('remembers „Später“', async () => {
    expect((await bjoern.request('POST', '/api/tutorial/dismiss')).statusCode).toBe(200)
    expect((await lobby()).tutorial.dismissed).toBe(true)
  })

  it('marks the tutorial completed after the victory, without notifications or profile entry', async () => {
    const id = await start()
    // Shortcut: the enemy fortress is empty and five tanks stand next to it
    const state = (await findMatch(db, id))!
    state.units = state.units.filter((u) => u.ownerId === bjoern.me.id)
    const tank = state.units.find((u) => u.unitTypeId === 'panzerwagen')!
    for (let i = 0; i < 5; i++) state.units.push({ ...tank, id: `extra${i}`, col: 13, row: 4 })
    updateKnowledge(state)
    await insertMatch(db, state)
    let won = false
    for (let i = 0; i < 5 && !won; i++) {
      const res = await command(id, {
        type: 'attack',
        unitId: `extra${i}`,
        target: { cityId: 'tc3' },
      })
      expect(res.statusCode, res.body).toBe(200)
      won = res.json<{ view: PlayerView }>().view.result?.winnerId === bjoern.me.id
    }
    expect(won).toBe(true)
    const [row] = await db.select().from(players).where(eq(players.id, bjoern.me.id))
    expect(row!.tutorialCompletedAt).not.toBeNull()
    // No turn notifications from the tutorial; only the badge „Rekrut“ may be announced
    const kinds = (await db.select().from(notifications)).map((n) => n.kind)
    expect(kinds.filter((k) => k !== 'badge')).toEqual([])
    const data = await lobby()
    expect(data.tutorial).toMatchObject({ completed: true, status: 'finished' })
    expect(data.finishedMatches.map((m) => m.id)).not.toContain(id)
    const profile = (await bjoern.request('GET', '/api/profile')).body
    expect(profile).not.toContain(id)
  })
})
