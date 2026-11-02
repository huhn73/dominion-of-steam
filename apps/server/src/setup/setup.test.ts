import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import type { PlayerView } from '@dos/shared/game'
import type { CreateMatchResponse, MatchDraft, SetupData } from '@dos/shared/setup'
import type { WaitingRoomData } from '@dos/shared/lobby'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { invitations, matches, matchSeats, setupReservations } from '../db/schema'
import { findMatch } from '../matches/repository'
import { loginAs, LENA } from '../test/helpers'
import { SESSION_COOKIE } from '../session'
import { inviteToken, launchMatch, participantsFor, pickPersonality } from './service'

const url = process.env.TEST_DATABASE_URL

describe('Platzvergabe beim Start', () => {
  const seat = (s: number, kind: string, extra: object = {}) =>
    ({
      matchId: 'm',
      seat: s,
      kind,
      playerId: null,
      participantId: null,
      factionId: null,
      aiPersonalityId: null,
      aiDifficulty: null,
      ready: false,
      joinedAt: null,
      ...extra,
    }) as Parameters<typeof participantsFor>[0][number]
  const rules = {
    mode: 'async' as const,
    asyncTurnLimitHours: 24,
    liveTurnLimitMinutes: null,
    victoryCondition: 'elimination' as const,
    roundLimit: 100,
    allowDuplicateFactions: false,
  }

  it('füllt freie Plätze mit KI (Normal) und beachtet die Fraktionsregel', () => {
    const { participants } = participantsFor(
      [
        seat(0, 'player', { playerId: 'host', factionId: 'aurelia' }),
        seat(1, 'ai', { aiPersonalityId: 'brandt', aiDifficulty: 'hard', factionId: 'eisenbund' }),
        seat(2, 'friend', { playerId: 'lena' }),
        seat(3, 'empty'),
      ],
      new Map([['host', 'Björn']]),
      rules,
      true,
    )
    expect(participants.map((p) => [p.id, p.isAI, p.aiDifficulty])).toEqual([
      ['host', false, null],
      ['ai1', true, 'hard'],
      ['ai2', true, 'normal'],
      ['ai3', true, 'normal'],
    ])
    const factions = participants.map((p) => p.factionId)
    expect(new Set(factions).size).toBe(4)
    expect(new Set(participants.map((p) => p.color)).size).toBe(4)
  })

  it('verlangt ohne Auffüllen besetzte Plätze', () => {
    expect(() =>
      participantsFor(
        [seat(0, 'player', { playerId: 'host', factionId: 'aurelia' }), seat(1, 'open')],
        new Map(),
        rules,
        false,
      ),
    ).toThrow('Nicht alle Plätze sind besetzt')
  })

  it('gibt bei doppelten Fraktionen eigene Farben', () => {
    const { participants } = participantsFor(
      [
        seat(0, 'player', { playerId: 'host', factionId: 'aurelia' }),
        seat(1, 'ai', { aiPersonalityId: 'kessler', aiDifficulty: 'easy' }),
      ],
      new Map(),
      { ...rules, allowDuplicateFactions: true },
      false,
    )
    expect(participants.map((p) => [p.factionId, p.color])).toEqual([
      ['aurelia', 'rose'],
      ['aurelia', 'amber'],
    ])
  })

  it('findet ohne passende Persönlichkeit keine', () => {
    const all = new Set(['eisenbund', 'aurelia', 'nordmark', 'salzkueste'])
    expect(pickPersonality(new Set(), all, false)).toBeNull()
    expect(pickPersonality(new Set(), all, true)).not.toBeNull()
  })

  it('erzeugt Einladungs-Tokens im Format XXX-XXX-XXX', () => {
    expect(inviteToken()).toMatch(/^[2-9A-Z]{3}-[2-9A-Z]{3}-[2-9A-Z]{3}$/)
  })
})

describe.skipIf(!url)('Partie-Setup-API (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  let app = buildApp({ db, dev: true })
  let user: Awaited<ReturnType<typeof loginAs>>
  let lenaId: string

  const setup = async () => (await user.request('GET', '/api/setup')).json<SetupData>()
  const create = (draft: MatchDraft, reservationId: string) =>
    user.request('POST', '/api/matches', { draft, reservationId })
  const soloDraft = (data: SetupData, patch: Partial<MatchDraft> = {}): MatchDraft => ({
    ...data.draft,
    name: 'Gegen die Admiralität',
    factionId: 'eisenbund',
    mode: 'async',
    asyncTurnLimitHours: 12,
    victoryCondition: 'capitals',
    allowDuplicateFactions: false,
    fillEmptyWithAI: true,
    seats: [
      { kind: 'you' },
      { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' },
      { kind: 'ai', personalityId: 'ostrow', difficulty: 'easy' },
    ],
    map: { ...data.draft.map, size: 'small', seed: 'KOHLE-4417' },
    ...patch,
  })

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    app = buildApp({ db, dev: true })
    ;({ lenaId } = await ensureDevAccounts(app.accounts))
    user = await loginAs(app)
    await db.delete(setupReservations)
  })
  afterAll(async () => {
    await close()
  })

  it('liefert Stammdaten, Freunde, Startentwurf und einen reservierten Einladungslink', async () => {
    const data = await setup()
    expect(data.you).toMatchObject({ id: user.me.id, name: 'Björn' })
    expect(data.factions.map((f) => f.shortName)).toEqual([
      'Eisenbund',
      'Aurelia',
      'Nordmark',
      'Salzküste',
    ])
    expect(data.aiPersonalities.map((p) => p.id)).toEqual([
      'kessler',
      'varenne',
      'brandt',
      'eisenhart',
      'halvorsen',
      'lindqvist',
      'ostrow',
    ])
    expect(data.friends.map((f) => f.name)).toContain('Lena Hartmann')
    expect(data.options.mapSizes).toHaveLength(5)
    expect(data.draft).toMatchObject({
      factionId: null,
      seats: [{ kind: 'you' }, { kind: 'empty' }],
    })
    expect(data.draft.name).not.toBe('')
    expect(data.draft.map.seed).toMatch(/^[A-Z]+-\d{4}$/)
    expect(data.inviteLink).toMatch(/^http:\/\/localhost(:80)?\/einladung\/\w{3}-\w{3}-\w{3}$/)
    // Neu laden behält Reservierung und Link
    const again = await setup()
    expect(again.inviteLink).toBe(data.inviteLink)
    expect(again.reservationId).toBe(data.reservationId)

    const proxied = await app.inject({
      method: 'GET',
      url: '/api/setup',
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'dominion.example' },
      cookies: { [SESSION_COOKIE]: user.token },
    })
    expect(proxied.json<SetupData>().inviteLink).toMatch(
      /^https:\/\/dominion\.example\/einladung\//,
    )
  })

  it('Ablauf 1: startet eine Solo-Partie gegen zwei KI-Persönlichkeiten sofort', async () => {
    const data = await setup()
    const res = await create(soloDraft(data), data.reservationId)
    expect(res.statusCode).toBe(201)
    const { matchId, started } = res.json<CreateMatchResponse>()
    expect(started).toBe(true)
    expect(matchId).toBe(data.reservationId)

    const view = (await user.request('GET', `/api/matches/${matchId}/view`)).json<PlayerView>()
    expect(view.match).toMatchObject({ name: 'Gegen die Admiralität', mode: 'async', round: 1 })
    expect(view.rules).toMatchObject({ asyncTurnLimitHours: 12, victoryCondition: 'capitals' })
    const hours = (Date.parse(view.match.turnDeadline!) - Date.now()) / 3600_000
    expect(hours).toBeGreaterThan(11.9)
    expect(hours).toBeLessThanOrEqual(12)
    expect(view.participants.map((p) => [p.name, p.factionId, p.aiDifficulty])).toEqual([
      ['Björn', 'eisenbund', null],
      ['Admiral Kessler', 'aurelia', 'hard'],
      ['Graf Ostrow', 'salzkueste', 'easy'],
    ])

    const [row] = await db.select().from(matches).where(eq(matches.id, matchId))
    expect(row).toMatchObject({
      status: 'running',
      hostId: user.me.id,
      seed: 'KOHLE-4417',
      inviteToken: data.inviteLink.split('/').at(-1),
    })
    expect(row!.setup).toMatchObject({ fillEmptyWithAI: true, map: { size: 'small' } })
    const seats = await db.select().from(matchSeats).where(eq(matchSeats.matchId, matchId))
    expect(seats.sort((a, b) => a.seat - b.seat).map((s) => [s.kind, s.participantId])).toEqual([
      ['player', user.me.id],
      ['ai', 'ai1'],
      ['ai', 'ai2'],
    ])
    const state = await findMatch(db, matchId)
    expect(state!.participants[1]!.aiPersonalityId).toBe('kessler')
    // Die Reservierung ist verbraucht, die nächste Einrichtung bekommt einen neuen Link
    expect((await create(soloDraft(data), data.reservationId)).statusCode).toBe(409)
    const next = await setup()
    expect(next.inviteLink).not.toBe(data.inviteLink)
    expect(next.draft).toMatchObject({ asyncTurnLimitHours: 12, map: { size: 'small' } })
  })

  it('füllt bei [du, frei] den freien Platz mit einer KI und startet', async () => {
    const data = await setup()
    const res = await create(
      { ...data.draft, factionId: 'aurelia', mode: 'live', liveTurnLimitMinutes: 5 },
      data.reservationId,
    )
    const { matchId, started } = res.json<CreateMatchResponse>()
    expect(started).toBe(true)
    const view = (await user.request('GET', `/api/matches/${matchId}/view`)).json<PlayerView>()
    expect(view.participants).toHaveLength(2)
    expect(view.participants[1]).toMatchObject({ isAI: true, aiDifficulty: 'normal' })
    expect(view.participants[1]!.factionId).not.toBe('aurelia')
    expect(view.match.turnDeadline).not.toBeNull()
  })

  it('Ablauf 2: legt eine wartende Partie mit Einladung, Link- und offenem Platz an', async () => {
    const data = await setup()
    const draft = soloDraft(data, {
      name: 'Inselhüpfen',
      seats: [
        { kind: 'you' },
        { kind: 'friend', friendId: lenaId },
        { kind: 'invite' },
        { kind: 'open' },
      ],
    })
    const res = await create(draft, data.reservationId)
    expect(res.statusCode).toBe(201)
    const { matchId, started } = res.json<CreateMatchResponse>()
    expect(started).toBe(false)

    const [row] = await db.select().from(matches).where(eq(matches.id, matchId))
    expect(row).toMatchObject({ status: 'waiting', round: 0, state: null, hostId: user.me.id })
    const invites = await db.select().from(invitations).where(eq(invitations.matchId, matchId))
    expect(invites).toHaveLength(1)
    expect(invites[0]).toMatchObject({ playerId: lenaId, fromId: user.me.id, status: 'pending' })

    const view = await user.request('GET', `/api/matches/${matchId}/view`)
    expect(view.statusCode).toBe(409)
    expect(view.json().error.code).toBe('MATCH_WAITING')

    const lena = await loginAs(app, LENA)
    const { room, status } = (
      await lena.request('GET', `/api/matches/${matchId}/room`)
    ).json<WaitingRoomData>()
    expect(status).toBe('waiting')
    expect(room).toMatchObject({ matchName: 'Inselhüpfen', isHost: false })
    expect(room.inviteLink).toBe(data.inviteLink)
    expect(room.seats.map((s) => [s.kind, s.name, s.status])).toEqual([
      ['player', 'Björn', 'ready'],
      ['invited', 'Lena Hartmann', 'pending'],
      ['open', null, 'pending'],
      ['open', null, 'pending'],
    ])
    expect(room.seats[1]!.isYou).toBe(true)

    const mira = await loginAs(app, 'mira@dominion.test')
    expect((await mira.request('GET', `/api/matches/${matchId}/room`)).statusCode).toBe(403)

    // Start durch den Ersteller (Meilenstein 05): freie Plätze werden KI
    const state = await db.transaction((tx) => launchMatch(tx, matchId))
    expect(state.participants.map((p) => p.isAI)).toEqual([false, true, true, true])
    expect(state.participants.every((p) => p.aiDifficulty !== 'hard' || !p.isAI)).toBe(true)
    expect(await db.select().from(invitations).where(eq(invitations.matchId, matchId))).toEqual([])
  })

  it('prüft den Entwurf auf dem Server und antwortet mit verständlichen Meldungen', async () => {
    const data = await setup()
    const expect422 = async (draft: MatchDraft, message: string | RegExp) => {
      const res = await create(draft, data.reservationId)
      expect(res.statusCode).toBe(422)
      expect(res.json().error.code).toBe('INVALID_SETUP')
      expect(res.json().error.message).toMatch(message)
    }
    await expect422(soloDraft(data, { name: '  ' }), 'Gib der Partie einen Namen.')
    await expect422(
      soloDraft(data, { factionId: 'aurelia' }),
      'Ein KI-Gegner führt deine Fraktion. Wähle eine andere KI-Persönlichkeit oder erlaube doppelte Fraktionen.',
    )
    await expect422(
      soloDraft(data, { seats: [{ kind: 'you' }, { kind: 'friend', friendId: 'fremd' }] }),
      'Du kannst nur Spieler aus deiner Freundesliste einladen.',
    )
    await expect422(
      soloDraft(data, { map: { ...data.draft.map, seed: '' } }),
      'Gib einen Kartencode ein oder würfle einen neuen.',
    )
    const missing = await user.request('POST', '/api/matches', { draft: soloDraft(data) })
    expect(missing.statusCode).toBe(422)
    // Nichts wurde angelegt, die Reservierung gilt weiter
    expect((await create(soloDraft(data), data.reservationId)).statusCode).toBe(201)
  })

  it('erzeugt mit demselben Kartencode und denselben Einstellungen dieselbe Welt', async () => {
    const ids: string[] = []
    for (let i = 0; i < 2; i++) {
      const data = await setup()
      ids.push(
        (await create(soloDraft(data), data.reservationId)).json<CreateMatchResponse>().matchId,
      )
    }
    const [a, b] = await Promise.all(ids.map((id) => findMatch(db, id)))
    expect(a!.map.terrain).toEqual(b!.map.terrain)
    expect(a!.cities.map((c) => [c.col, c.row])).toEqual(b!.cities.map((c) => [c.col, c.row]))
  })

  it('verlangt eine Anmeldung', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/setup' })).statusCode).toBe(401)
    expect(
      (await app.inject({ method: 'POST', url: '/api/matches', payload: {} })).statusCode,
    ).toBe(401)
  })
})
