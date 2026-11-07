import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { and, eq, inArray } from 'drizzle-orm'
import type { FriendsData } from '@dos/shared/account'
import type { ProfileData } from '@dos/shared/profile'
import { buildApp } from '../app'
import { createDb, runMigrations } from '../db/client'
import { notifications } from '../db/schema'
import { DEV_PASSWORD } from '../auth/devAccounts'
import { loginAs } from '../test/helpers'

const url = process.env.TEST_DATABASE_URL

describe.skipIf(!url)('Freunde mit Anfragen (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({
    db,
    dev: true,
    notifications: { push: null, mail: null, autoDeliver: false },
  })
  let counter = 0

  async function newPlayer(prefix: string) {
    const name = `${prefix} ${Date.now() % 100000}${counter++}`
    const email = `${prefix.toLowerCase()}-${Date.now()}${counter}@example.test`
    await app.accounts.register({ displayName: name, email, password: DEV_PASSWORD })
    return { ...(await loginAs(app, email, DEV_PASSWORD)), name }
  }
  const data = (res: { json: <T>() => T }) => res.json<FriendsData>()

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(() => {
    app = buildApp({ db, dev: true, notifications: { push: null, mail: null, autoDeliver: false } })
  })
  afterAll(async () => {
    await close()
  })

  it('Anfrage, Annahme mit Benachrichtigung und Entfernen in beide Richtungen', async () => {
    const a = await newPlayer('Anna')
    const b = await newPlayer('Bert')

    const sent = await a.request('POST', '/api/friends/requests', { name: b.name.toLowerCase() })
    expect(sent.statusCode).toBe(201)
    expect(data(sent).outgoing.map((r) => r.name)).toEqual([b.name])
    expect(data(await b.request('GET', '/api/friends')).incoming.map((r) => r.id)).toEqual([
      a.me.id,
    ])
    expect(
      (await a.request('POST', '/api/friends/requests', { playerId: b.me.id })).json().error.code,
    ).toBe('REQUEST_EXISTS')

    // Das Profil zeigt den Stand der Freundschaft
    const profile = (await b.request('GET', `/api/players/${a.me.id}/profile`)).json<ProfileData>()
    expect(profile.friendship).toBe('incoming')

    const accepted = data(await b.request('POST', `/api/friends/requests/${a.me.id}/accept`))
    expect(accepted.friends.map((f) => f.id)).toEqual([a.me.id])
    expect(accepted.incoming).toEqual([])
    expect(data(await a.request('GET', '/api/friends')).friends.map((f) => f.id)).toEqual([b.me.id])
    expect(
      (await a.request('POST', '/api/friends/requests', { playerId: b.me.id })).json().error.code,
    ).toBe('ALREADY_FRIENDS')

    const notes = await db
      .select({
        playerId: notifications.playerId,
        kind: notifications.kind,
        title: notifications.title,
      })
      .from(notifications)
      .where(inArray(notifications.playerId, [a.me.id, b.me.id]))
    expect(notes).toEqual(
      expect.arrayContaining([
        { playerId: b.me.id, kind: 'friendRequest', title: `Freundschaftsanfrage von ${a.name}` },
        { playerId: a.me.id, kind: 'friendAccepted', title: `${b.name} ist jetzt dein Freund` },
      ]),
    )

    const removed = data(await a.request('DELETE', `/api/friends/${b.me.id}`))
    expect(removed.friends).toEqual([])
    expect(data(await b.request('GET', '/api/friends')).friends).toEqual([])
  })

  it('gegenseitige Anfrage nimmt an; ablehnen und zurückziehen; Fehler', async () => {
    const a = await newPlayer('Cleo')
    const b = await newPlayer('Dora')
    const c = await newPlayer('Emil')
    await a.request('POST', '/api/friends/requests', { playerId: b.me.id })
    const mutual = data(await b.request('POST', '/api/friends/requests', { playerId: a.me.id }))
    expect(mutual.friends.map((f) => f.id)).toEqual([a.me.id])
    expect(mutual.outgoing).toEqual([])

    await c.request('POST', '/api/friends/requests', { playerId: a.me.id })
    const declined = data(await a.request('POST', `/api/friends/requests/${c.me.id}/decline`))
    expect(declined.incoming).toEqual([])
    await c.request('POST', '/api/friends/requests', { playerId: b.me.id })
    expect(data(await c.request('DELETE', `/api/friends/requests/${b.me.id}`)).outgoing).toEqual([])
    expect(
      (await c.request('POST', `/api/friends/requests/${b.me.id}/accept`)).json().error.code,
    ).toBe('REQUEST_NOT_FOUND')
    expect(
      (await a.request('POST', '/api/friends/requests', { name: 'Gibt Es Nicht' })).json().error
        .code,
    ).toBe('PLAYER_NOT_FOUND')
    expect(
      (await a.request('POST', '/api/friends/requests', { playerId: a.me.id })).json().error.code,
    ).toBe('CANNOT_FRIEND_SELF')
    const declinedNote = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.playerId, c.me.id), eq(notifications.kind, 'friendAccepted')))
    expect(declinedNote).toEqual([])
  })
})
