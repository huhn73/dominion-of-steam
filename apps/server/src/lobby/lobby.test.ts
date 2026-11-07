import { markAllExplored } from '@dos/shared/engine'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { and, eq, ne } from 'drizzle-orm'
import { miniMap, normalizeState } from '@dos/shared/engine'
import type { LobbyData, WaitingRoomData } from '@dos/shared/lobby'
import type { MatchDraft, SetupData } from '@dos/shared/setup'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import {
  invitations,
  matches,
  matchSeats,
  notifications,
  players,
  pushSubscriptions,
  reminders,
  setupReservations,
} from '../db/schema'
import type { MailMessage, PushTarget } from '../notifications/channels'
import { SESSION_COOKIE } from '../session'
import { BJOERN, LENA, loginAs } from '../test/helpers'

const url = process.env.TEST_DATABASE_URL
const HOUR = 3600_000

type Session = Awaited<ReturnType<typeof loginAs>>

describe.skipIf(!url)('Lobby & Multiplayer (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  const mails: MailMessage[] = []
  const pushes: { target: PushTarget; payload: Record<string, string> }[] = []
  let pushFailure: number | null = null
  const push = vi.fn(async (target: PushTarget, payload: string) => {
    if (pushFailure) throw Object.assign(new Error('push'), { statusCode: pushFailure })
    pushes.push({ target, payload: JSON.parse(payload) })
  })
  let app = buildApp({ db, dev: true })
  let bjoern: Session
  let lena: Session
  let mira: Session
  let jonas: Session

  const lobbyOf = async (s: Session) => {
    const res = await s.request('GET', '/api/lobby')
    expect(res.statusCode).toBe(200)
    return res.json<LobbyData>()
  }
  const roomOf = async (s: Session, id: string) =>
    (await s.request('GET', `/api/matches/${id}/room`)).json<WaitingRoomData>()

  /** Björn creates a waiting match (async, small map) with the given seats */
  async function waitingMatch(seats: MatchDraft['seats'], patch: Partial<MatchDraft> = {}) {
    const data = (await bjoern.request('GET', '/api/setup')).json<SetupData>()
    const draft: MatchDraft = {
      ...data.draft,
      name: 'Nordwind',
      factionId: 'eisenbund',
      mode: 'async',
      asyncTurnLimitHours: 24,
      victoryCondition: 'elimination',
      fillEmptyWithAI: true,
      seats,
      map: { ...data.draft.map, size: 'small', landShare: 50, seed: 'NORD-4242' },
      ...patch,
    }
    const res = await bjoern.request('POST', '/api/matches', {
      draft,
      reservationId: data.reservationId,
    })
    expect(res.statusCode).toBe(201)
    return res.json<{ matchId: string }>().matchId
  }

  const lenaId = () => lena.me.id
  const invitationOf = async (matchId: string, playerId: string) =>
    (
      await db
        .select()
        .from(invitations)
        .where(and(eq(invitations.matchId, matchId), eq(invitations.playerId, playerId)))
    )[0]!

  /** Running async match: Björn (on the move) against Lena */
  async function runningMatch(seats: MatchDraft['seats'] = []) {
    const id = await waitingMatch([
      { kind: 'you' },
      { kind: 'friend', friendId: lenaId() },
      ...seats,
    ])
    const inv = await invitationOf(id, lenaId())
    expect((await lena.request('POST', `/api/invitations/${inv.id}/accept`)).statusCode).toBe(200)
    expect(
      (await lena.request('POST', `/api/matches/${id}/ready`, { ready: true })).statusCode,
    ).toBe(200)
    const res = await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: true })
    expect(res.statusCode).toBe(200)
    return id
  }

  const endTurn = (s: Session, id: string) =>
    s.request('POST', `/api/matches/${id}/commands`, { type: 'endTurn' })

  const notificationsOf = (playerId: string) =>
    db.select().from(notifications).where(eq(notifications.playerId, playerId))

  /** Make the player look offline since `at` */
  const lastSeen = (playerId: string, at: Date | null) =>
    db
      .update(players)
      .set({ lastSeenAt: at, lastSeenMatchId: null })
      .where(eq(players.id, playerId))

  beforeAll(async () => {
    await runMigrations(db)
  })
  beforeEach(async () => {
    mails.length = 0
    pushes.length = 0
    pushFailure = null
    push.mockClear()
    app = buildApp({
      db,
      dev: true,
      notifications: {
        push,
        mail: async (m) => {
          mails.push(m)
        },
        autoDeliver: false,
      },
    })
    await ensureDevAccounts(app.accounts)
    await db.delete(matches).where(ne(matches.id, 'demo'))
    // The demo match (seeded by other test files, Björn plays in it) must stay out of the
    // deadline sweeps: seeded shortly before, its deadline lies next to the test match's
    await db.update(matches).set({ turnDeadline: null }).where(eq(matches.id, 'demo'))
    await db.delete(notifications)
    await db.delete(pushSubscriptions)
    await db.delete(setupReservations)
    await db.update(players).set({ settings: null })
    bjoern = await loginAs(app, BJOERN)
    lena = await loginAs(app, LENA)
    mira = await loginAs(app, 'mira@dominion.test')
    jonas = await loginAs(app, 'jonas@dominion.test')
  })
  afterAll(async () => {
    await close()
  })

  it('zeigt einem neuen Spieler eine leere Lobby', async () => {
    const name = `Neu${Date.now() % 100000}`
    await app.accounts.register({
      displayName: name,
      email: `${name.toLowerCase()}@dominion.test`,
      password: 'dampfmaschine',
    })
    const neu = await loginAs(app, `${name.toLowerCase()}@dominion.test`)
    const lobby = await lobbyOf(neu)
    expect(lobby).toMatchObject({
      you: { name },
      deadlineWarningHours: 3,
      matches: [],
      invitations: [],
      openMatches: [],
      finishedMatches: [],
    })
    expect(lobby.factions.map((f) => f.shortName)).toEqual([
      'Eisenbund',
      'Aurelia',
      'Nordmark',
      'Salzküste',
    ])
    expect(Date.parse(lobby.now)).toBeGreaterThan(Date.now() - 60_000)
    expect((await app.inject({ method: 'GET', url: '/api/lobby' })).statusCode).toBe(401)
  })

  it('Einladung: erscheint in der Lobby, benachrichtigt und führt angenommen in den Warteraum', async () => {
    const id = await waitingMatch([
      { kind: 'you' },
      { kind: 'friend', friendId: lenaId() },
      { kind: 'open' },
    ])
    const lobby = await lobbyOf(lena)
    expect(lobby.invitations).toHaveLength(1)
    expect(lobby.invitations[0]).toMatchObject({
      matchName: 'Nordwind',
      from: { name: 'Björn' },
      mode: 'async',
      turnLimitLabel: { key: 'setup.hours', params: { count: 24 } },
      mapSizeLabel: { key: 'setup.size.small' },
      seatsTaken: 1,
      seatsTotal: 3,
    })
    expect(lobby.matches.find((m) => m.id === id)).toBeUndefined()
    const [note] = await notificationsOf(lenaId())
    expect(note).toMatchObject({
      kind: 'invitation',
      pushStatus: 'pending',
      emailStatus: 'pending',
    })

    // Björns Sicht: wartende Partie
    const own = (await lobbyOf(bjoern)).matches.find((m) => m.id === id)!
    expect(own).toMatchObject({
      status: 'waitingForPlayers',
      round: 0,
      isHost: true,
      waitingFor: 2,
      miniMap: [],
      turnDeadline: null,
    })

    const res = await lena.request('POST', `/api/invitations/${lobby.invitations[0]!.id}/accept`)
    expect(res.json()).toEqual({ matchId: id })
    const { room, status } = await roomOf(lena, id)
    expect(status).toBe('waiting')
    expect(room.seats.map((s) => [s.kind, s.status, s.name, s.isYou])).toEqual([
      ['player', 'ready', 'Björn', false],
      ['player', 'joined', 'Lena Hartmann', true],
      ['open', 'pending', null, false],
    ])
    // Freie Fraktion (Björn hat den Eisenbund)
    expect(room.seats[1]!.factionId).toBe('aurelia')
    expect((await lobbyOf(lena)).invitations).toEqual([])
    expect((await lobbyOf(lena)).matches.find((m) => m.id === id)?.status).toBe('waitingForPlayers')
    // Zweites Annehmen: Einladung ist verbraucht
    const again = await lena.request('POST', `/api/invitations/${lobby.invitations[0]!.id}/accept`)
    expect(again.statusCode).toBe(410)
    expect(again.json().error.code).toBe('INVITATION_INVALID')
  })

  it('Ablehnen gibt den Platz frei', async () => {
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'friend', friendId: lenaId() }])
    const inv = await invitationOf(id, lenaId())
    expect((await lena.request('POST', `/api/invitations/${inv.id}/decline`)).statusCode).toBe(200)
    expect((await invitationOf(id, lenaId())).status).toBe('declined')
    expect((await lobbyOf(lena)).invitations).toEqual([])
    expect((await roomOf(bjoern, id)).room.seats[1]).toMatchObject({ kind: 'open', name: null })
    // Lena hat keinen Zugang mehr zum Warteraum
    expect((await lena.request('GET', `/api/matches/${id}/room`)).statusCode).toBe(403)
  })

  it('offene Partien: Beitreten, „Partie voll“ und das Rennen um den letzten Platz', async () => {
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'open' }, { kind: 'open' }])
    const open = (await lobbyOf(mira)).openMatches.find((o) => o.id === id)!
    expect(open).toMatchObject({
      name: 'Nordwind',
      host: 'Björn',
      seatsTaken: 1,
      seatsTotal: 3,
      victoryCondition: { key: 'setup.victory.elimination.label' },
      availableFactionIds: ['aurelia', 'nordmark', 'salzkueste'],
    })
    // Nicht in den offenen Partien des Erstellers
    expect((await lobbyOf(bjoern)).openMatches.find((o) => o.id === id)).toBeUndefined()

    expect((await mira.request('POST', `/api/matches/${id}/join`)).statusCode).toBe(200)
    // Erneutes Beitreten ist harmlos
    expect((await mira.request('POST', `/api/matches/${id}/join`)).statusCode).toBe(200)
    expect((await lobbyOf(mira)).openMatches.find((o) => o.id === id)).toBeUndefined()

    // Zwei Spieler gleichzeitig um den letzten Platz
    const results = await Promise.all([
      jonas.request('POST', `/api/matches/${id}/join`),
      lena.request('POST', `/api/matches/${id}/join`),
    ])
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409])
    const loser = results.find((r) => r.statusCode === 409)!
    expect(loser.json().error).toEqual({
      code: 'MATCH_FULL',
      message: 'Partie voll: Alle freien Plätze sind schon besetzt.',
    })
    const seats = await db.select().from(matchSeats).where(eq(matchSeats.matchId, id))
    expect(seats.filter((s) => s.kind === 'player')).toHaveLength(3)
    expect(new Set(seats.map((s) => s.factionId)).size).toBe(3)
  })

  it('Einladungslink besetzt einen freien Platz; ungültig und nach dem Start abgelaufen', async () => {
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'invite' }])
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    const token = row!.inviteToken!
    expect((await mira.request('POST', `/api/invite/${token}`)).json()).toEqual({ matchId: id })
    expect((await roomOf(mira, id)).room.seats[1]).toMatchObject({ kind: 'player', isYou: true })
    // Wer schon drin ist, landet einfach im Warteraum
    expect((await mira.request('POST', `/api/invite/${token}`)).statusCode).toBe(200)
    const full = await jonas.request('POST', `/api/invite/${token}`)
    expect(full.statusCode).toBe(409)
    expect(full.json().error.code).toBe('MATCH_FULL')
    const invalid = await jonas.request('POST', '/api/invite/AAA-BBB-CCC')
    expect(invalid.statusCode).toBe(404)
    expect(invalid.json().error.message).toBe('Dieser Einladungslink ist ungültig oder abgelaufen.')

    await mira.request('POST', `/api/matches/${id}/ready`, { ready: true })
    expect(
      (await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: false }))
        .statusCode,
    ).toBe(200)
    expect((await jonas.request('POST', `/api/invite/${token}`)).statusCode).toBe(410)
  })

  it('Bereit und Start: nur der Ersteller, erst wenn alle bereit sind; ohne Auffüllen fallen freie Plätze weg', async () => {
    const id = await waitingMatch([
      { kind: 'you' },
      { kind: 'friend', friendId: lenaId() },
      { kind: 'open' },
    ])
    const inv = await invitationOf(id, lenaId())
    await lena.request('POST', `/api/invitations/${inv.id}/accept`)

    const blocked = await bjoern.request('POST', `/api/matches/${id}/start`, {
      fillEmptyWithAI: true,
    })
    expect(blocked.statusCode).toBe(409)
    expect(blocked.json().error).toEqual({ code: 'NOT_READY', message: 'Warte auf Lena Hartmann' })
    const notHost = await lena.request('POST', `/api/matches/${id}/start`, {
      fillEmptyWithAI: true,
    })
    expect(notHost.statusCode).toBe(403)
    expect((await bjoern.request('POST', `/api/matches/${id}/start`, {})).statusCode).toBe(422)

    expect(
      (await lena.request('POST', `/api/matches/${id}/ready`, { ready: true })).statusCode,
    ).toBe(200)
    expect((await roomOf(bjoern, id)).room.seats[1]!.status).toBe('ready')
    // Der Ersteller meldet sich ab: wieder gesperrt
    await bjoern.request('POST', `/api/matches/${id}/ready`, { ready: false })
    expect(
      (await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: true })).json()
        .error.message,
    ).toBe('Warte auf Björn')
    await bjoern.request('POST', `/api/matches/${id}/ready`, { ready: true })

    const res = await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: false })
    expect(res.json()).toEqual({ matchId: id })
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    expect(row!.status).toBe('running')
    expect(row!.state!.participants.map((p) => [p.name, p.isAI])).toEqual([
      ['Björn', false],
      ['Lena Hartmann', false],
    ])
    expect((await roomOf(lena, id)).status).toBe('running')
    // Lena erfährt vom Start (nur Push)
    const notes = await notificationsOf(lenaId())
    expect(notes.find((n) => n.kind === 'matchStarted')).toMatchObject({
      event: 'yourTurn',
      pushStatus: 'pending',
      emailStatus: 'skipped',
    })
    // Zweiter Start
    expect(
      (await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: false }))
        .statusCode,
    ).toBe(409)
  })

  it('braucht ohne Auffüllen mindestens zwei Teilnehmer und füllt sonst mit KI auf', async () => {
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'open' }, { kind: 'invite' }])
    const res = await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: false })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('TOO_FEW_PLAYERS')
    expect(
      (await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: true }))
        .statusCode,
    ).toBe(200)
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    expect(row!.state!.participants.map((p) => [p.isAI, p.aiDifficulty])).toEqual([
      [false, null],
      [true, 'normal'],
      [true, 'normal'],
    ])
  })

  it('Verlassen: Mitspieler geben den Platz frei, der Ersteller löst die Partie auf', async () => {
    const id = await waitingMatch([
      { kind: 'you' },
      { kind: 'friend', friendId: lenaId() },
      { kind: 'open' },
    ])
    await mira.request('POST', `/api/matches/${id}/join`)
    expect((await mira.request('POST', `/api/matches/${id}/leave`)).json()).toEqual({
      dissolved: false,
    })
    expect((await roomOf(bjoern, id)).room.seats[2]).toMatchObject({ kind: 'open', name: null })
    const [seat] = await db
      .select()
      .from(matchSeats)
      .where(and(eq(matchSeats.matchId, id), eq(matchSeats.seat, 2)))
    expect(seat).toMatchObject({ kind: 'open', playerId: null, factionId: null, ready: false })
    expect((await mira.request('POST', `/api/matches/${id}/leave`)).statusCode).toBe(403)

    const inv = await invitationOf(id, lenaId())
    await lena.request('POST', `/api/invitations/${inv.id}/accept`)
    await db.delete(notifications)
    expect((await bjoern.request('POST', `/api/matches/${id}/leave`)).json()).toEqual({
      dissolved: true,
    })
    expect(await db.select().from(matches).where(eq(matches.id, id))).toEqual([])
    expect((await notificationsOf(lenaId()))[0]).toMatchObject({
      kind: 'matchCancelled',
      event: 'matchEnded',
      title: 'Partie aufgelöst: Nordwind',
    })
    expect((await lena.request('GET', `/api/matches/${id}/room`)).statusCode).toBe(404)
  })

  it('Lobby einer laufenden Partie: am Zug, Teilnehmer und Mini-Lagekarte mit Kriegsnebel', async () => {
    const id = await runningMatch([{ kind: 'ai', personalityId: 'kessler', difficulty: 'hard' }])
    const mine = (await lobbyOf(bjoern)).matches.find((m) => m.id === id)!
    expect(mine).toMatchObject({
      status: 'yourTurn',
      round: 1,
      currentParticipantId: bjoern.me.id,
      remindedAt: null,
      isHost: true,
      rules: {
        mode: 'async',
        turnLimitLabel: { key: 'setup.hours', params: { count: 24 } },
        victoryCondition: { key: 'setup.victory.elimination.label' },
        allowDuplicateFactions: false,
      },
      map: { sizeLabel: { key: 'setup.size.small' }, width: 20, height: 20, landShare: 50, seed: 'NORD-4242' },
    })
    expect(Date.parse(mine.turnDeadline!)).toBeGreaterThan(Date.now() + 23 * HOUR)
    expect(mine.participants.map((p) => [p.name, p.isYou, p.isAI, p.status])).toEqual([
      ['Björn', true, false, 'active'],
      ['Lena Hartmann', false, false, 'active'],
      ['Admiral Kessler', false, true, 'active'],
    ])
    expect(mine.participants[2]!.aiDifficulty).toBe('hard')
    expect(mine.participants[0]!.cityCount).toBeGreaterThan(0)

    expect(mine.miniMap).toHaveLength(12)
    expect(mine.miniMap.every((r) => /^[~.0-2]{24}$/.test(r))).toBe(true)
    expect(mine.miniMap.join('')).toContain('0')
    // Kriegsnebel: mit voller Sicht wäre mehr Land zu sehen
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    const state = normalizeState(row!.state!)
    const land = (rows: string[]) => rows.join('').replace(/~/g, '').length
    markAllExplored(state.participants[0]!, state.map)
    const index = (pid: string) => state.participants.findIndex((p) => p.id === pid)
    expect(land(mine.miniMap)).toBeLessThan(land(miniMap(state, bjoern.me.id, index, 24, 12)))

    const theirs = (await lobbyOf(lena)).matches.find((m) => m.id === id)!
    expect(theirs).toMatchObject({ status: 'othersTurn', isHost: false })
  })

  it('ergänzt beim Start fehlende Plätze älterer Partien, damit sie in der Lobby erscheinen', async () => {
    const id = await runningMatch()
    await db.delete(matchSeats).where(eq(matchSeats.matchId, id))
    expect((await lobbyOf(lena)).matches.find((m) => m.id === id)).toBeUndefined()
    expect(await app.matches.backfillSeats()).toBeGreaterThanOrEqual(1)
    expect((await lobbyOf(lena)).matches.find((m) => m.id === id)?.status).toBe('othersTurn')
  })

  it('Erinnern: nur beim Menschen am Zug, 12 Stunden Sperre, mit Benachrichtigung', async () => {
    const id = await runningMatch()
    // Björn ist selbst am Zug
    const self = await bjoern.request('POST', `/api/matches/${id}/remind`, {
      participantId: bjoern.me.id,
    })
    expect(self.statusCode).toBe(422)

    expect((await endTurn(bjoern, id)).statusCode).toBe(200)
    // Lena ist jetzt am Zug und bekommt „Du bist am Zug“
    expect((await notificationsOf(lenaId())).map((n) => n.kind)).toContain('yourTurn')
    const wrong = await bjoern.request('POST', `/api/matches/${id}/remind`, {
      participantId: 'jemand',
    })
    expect(wrong.statusCode).toBe(409)

    const before = Date.now()
    const res = await bjoern.request('POST', `/api/matches/${id}/remind`, {
      participantId: lenaId(),
    })
    expect(res.statusCode).toBe(200)
    const { remindedAt } = res.json<{ remindedAt: string }>()
    expect(Date.parse(remindedAt)).toBeGreaterThanOrEqual(before - 1000)
    expect((await lobbyOf(bjoern)).matches.find((m) => m.id === id)!.remindedAt).toBe(remindedAt)
    const note = (await notificationsOf(lenaId())).find((n) => n.kind === 'remind')!
    expect(note).toMatchObject({ event: 'yourTurn', title: 'Erinnerung: Nordwind' })
    expect(note.body).toContain('Björn wartet in „Nordwind“ auf deinen Zug')

    const again = await bjoern.request('POST', `/api/matches/${id}/remind`, {
      participantId: lenaId(),
    })
    expect(again.statusCode).toBe(429)
    expect(again.json().error.code).toBe('REMIND_COOLDOWN')
    expect(again.json().error.message).toMatch(/in 12 Std\.$/)

    // Nach 12 Stunden wieder möglich
    await db
      .update(reminders)
      .set({ remindedAt: new Date(Date.now() - 12 * HOUR - 1000) })
      .where(eq(reminders.matchId, id))
    expect(
      (await bjoern.request('POST', `/api/matches/${id}/remind`, { participantId: lenaId() }))
        .statusCode,
    ).toBe(200)
  })

  it('Erinnern geht nicht in Live-Partien', async () => {
    const id = await waitingMatch([{ kind: 'you' }, { kind: 'friend', friendId: lenaId() }], {
      mode: 'live',
      liveTurnLimitMinutes: 5,
    })
    const inv = await invitationOf(id, lenaId())
    await lena.request('POST', `/api/invitations/${inv.id}/accept`)
    await lena.request('POST', `/api/matches/${id}/ready`, { ready: true })
    await bjoern.request('POST', `/api/matches/${id}/start`, { fillEmptyWithAI: false })
    await endTurn(bjoern, id)
    const res = await bjoern.request('POST', `/api/matches/${id}/remind`, {
      participantId: lenaId(),
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().error.code).toBe('REMIND_NOT_AVAILABLE')
    // Live: „Du bist am Zug“ nur per Push
    expect((await notificationsOf(lenaId())).find((n) => n.kind === 'yourTurn')).toMatchObject({
      emailStatus: 'skipped',
    })
  })

  it('Aufgeben: KI (Normal) übernimmt, zählt als Niederlage und steht unter „Beendet“', async () => {
    const id = await runningMatch()
    await endTurn(bjoern, id)
    // Lena gibt in ihrem Zug auf: die KI spielt ihn, danach ist Björn am Zug
    expect((await lena.request('POST', `/api/matches/${id}/surrender`)).json()).toEqual({
      ok: true,
    })
    await app.aiRunner.idle()
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    const state = row!.state!
    expect(state.status).toBe('running')
    expect(state.participants[1]).toMatchObject({
      id: lenaId(),
      name: 'KI für Lena Hartmann',
      isAI: true,
      aiDifficulty: 'normal',
      status: 'active',
    })
    expect(state.participants[state.seat]!.id).toBe(bjoern.me.id)
    expect(state.round).toBe(2)

    const lenaLobby = await lobbyOf(lena)
    expect(lenaLobby.matches.find((m) => m.id === id)).toBeUndefined()
    expect(lenaLobby.finishedMatches.find((m) => m.id === id)).toMatchObject({
      name: 'Nordwind',
      result: 'surrendered',
      placement: 2,
      playerCount: 2,
      rounds: 1,
      winner: 'Partie läuft noch',
      factionId: 'aurelia',
    })
    const bjoernMatch = (await lobbyOf(bjoern)).matches.find((m) => m.id === id)!
    expect(bjoernMatch.participants.map((p) => [p.id, p.name, p.isAI, p.status])).toEqual([
      [bjoern.me.id, 'Björn', false, 'active'],
      [lenaId(), 'Lena Hartmann', false, 'surrendered'],
      [`ai-${lenaId()}`, 'KI für Lena Hartmann', true, 'active'],
    ])
    // Befehle der Aufgebenden werden abgelehnt, zweimal aufgeben geht nicht
    expect((await endTurn(lena, id)).statusCode).toBe(409)
    expect((await lena.request('POST', `/api/matches/${id}/surrender`)).statusCode).toBe(409)
    // Björn bekam „Du bist am Zug“
    expect((await notificationsOf(bjoern.me.id)).map((n) => n.kind)).toContain('yourTurn')

    // Gibt auch Björn auf, endet die Partie (keine Menschen mehr)
    await bjoern.request('POST', `/api/matches/${id}/surrender`)
    const finished = (await lobbyOf(bjoern)).finishedMatches.find((m) => m.id === id)!
    expect(finished).toMatchObject({ result: 'surrendered', placement: 2 })
    expect(finished.winner).toMatch(/^KI für /)
    const [after] = await db.select().from(matches).where(eq(matches.id, id))
    expect(after!.status).toBe('finished')
    expect((await lena.request('POST', `/api/matches/${id}/surrender`)).json().error.code).toBe(
      'MATCH_FINISHED',
    )
  })

  it('Fristen: abgelaufene Züge enden automatisch, „Frist läuft bald ab“ kommt einmal', async () => {
    const id = await runningMatch()
    const [row] = await db.select().from(matches).where(eq(matches.id, id))
    const deadline = row!.turnDeadline!.getTime()

    // 2 Stunden vor Ablauf: Warnung genau einmal
    await app.sweeper.sweep(new Date(deadline - 2 * HOUR))
    await app.sweeper.sweep(new Date(deadline - 1 * HOUR))
    const soon = (await notificationsOf(bjoern.me.id)).filter((n) => n.kind === 'deadlineSoon')
    expect(soon).toHaveLength(1)
    expect(soon[0]!.title).toBe('Frist läuft bald ab: Nordwind')
    // Vor Ablauf passiert nichts
    expect((await app.sweeper.sweep(new Date(deadline - 1000))).ended).toEqual([])

    const { ended } = await app.sweeper.sweep(new Date(deadline + 1000))
    expect(ended).toEqual([id])
    const [after] = await db.select().from(matches).where(eq(matches.id, id))
    const state = after!.state!
    expect(state.participants[state.seat]!.id).toBe(lenaId())
    expect(after!.turnDeadline!.getTime()).toBe(deadline + 1000 + 24 * HOUR)
    expect((await notificationsOf(lenaId())).map((n) => n.kind)).toContain('yourTurn')
    // Wieder Björns Zug nicht erneut beendet
    expect((await app.sweeper.sweep(new Date(deadline + 2000))).ended).toEqual([])
  })

  it('Benachrichtigungen folgen den Einstellungen: Push, E-Mail sofort und abgemeldete Abos', async () => {
    const id = await runningMatch()
    await db
      .update(players)
      .set({
        settings: {
          notifications: {
            yourTurn: { push: false, email: true },
            emailDelayHours: 0,
          },
        },
      })
      .where(eq(players.id, lenaId()))
    const sub = await lena.request('POST', '/api/push/subscribe', {
      endpoint: 'https://push.example/lena',
      keys: { p256dh: 'p', auth: 'a' },
    })
    expect(sub.statusCode).toBe(201)
    await lastSeen(lenaId(), new Date(Date.now() - 10 * 60_000))
    await db.delete(notifications)

    await endTurn(bjoern, id)
    const [note] = await notificationsOf(lenaId())
    expect(note).toMatchObject({ kind: 'yourTurn', pushStatus: 'skipped', emailStatus: 'pending' })
    await app.notifier.deliver()
    expect(push).not.toHaveBeenCalled()
    expect(mails).toHaveLength(1)
    expect(mails[0]!.to).toBe(LENA)
    expect(mails[0]!.subject).toBe('Du bist am Zug: Nordwind')
    expect(mails[0]!.text).toContain(`/partie/${id}`)
    expect(mails[0]!.html).toContain('Zur Partie')

    // Standard-Einstellungen: Push an alle Abos; 410 entfernt das Abo
    await db.update(players).set({ settings: null }).where(eq(players.id, lenaId()))
    await bjoern.request('POST', `/api/matches/${id}/remind`, { participantId: lenaId() })
    await app.notifier.deliverPush()
    expect(pushes).toHaveLength(1)
    expect(pushes[0]!.target.endpoint).toBe('https://push.example/lena')
    expect(pushes[0]!.payload).toMatchObject({
      title: 'Erinnerung: Nordwind',
      url: `/partie/${id}`,
      tag: `match-${id}`,
    })
    pushFailure = 410
    await bjoern.request('POST', `/api/matches/${id}/surrender`)
    await db.update(reminders).set({ remindedAt: new Date(0) })
    await app.notifier.enqueue(db, [
      { playerId: lenaId(), kind: 'invitation', title: 'T', body: 'B', url: '/' },
    ])
    await app.notifier.deliverPush()
    expect(await db.select().from(pushSubscriptions)).toEqual([])
  })

  it('verzögerte E-Mail: erst nach der Offline-Zeit, abgesagt wenn der Spieler wieder da war', async () => {
    const id = await runningMatch()
    const now = Date.now()
    await lastSeen(lenaId(), new Date(now - 10 * 60_000))
    await endTurn(bjoern, id)
    const [note] = (await notificationsOf(lenaId())).filter((n) => n.kind === 'yourTurn')
    // Standard: 1 Stunde Verzögerung
    expect(note!.emailDueAt!.getTime()).toBeGreaterThanOrEqual(note!.createdAt.getTime() + HOUR)

    await app.notifier.deliverEmail(new Date(now + 30 * 60_000))
    expect(mails).toHaveLength(0)
    await app.notifier.deliverEmail(new Date(now + 2 * HOUR))
    expect(mails).toHaveLength(1)
    expect(mails[0]!.subject).toBe('Du bist am Zug: Nordwind')

    // Zweiter Fall: Lena war nach der Benachrichtigung online → keine E-Mail
    await lena.request('POST', `/api/matches/${id}/commands`, { type: 'endTurn' })
    await bjoern.request('POST', `/api/matches/${id}/commands`, { type: 'endTurn' })
    await lastSeen(lenaId(), new Date(Date.now() + 60_000))
    await app.notifier.deliverEmail(new Date(Date.now() + 3 * HOUR))
    expect(mails).toHaveLength(1)
    const statuses = (await notificationsOf(lenaId()))
      .filter((n) => n.kind === 'yourTurn')
      .map((n) => n.emailStatus)
      .sort()
    expect(statuses).toEqual(['cancelled', 'sent'])
  })

  it('keine E-Mail an unbestätigte Adressen', async () => {
    const name = `Unbest${Date.now() % 100000}`
    const player = await app.accounts.register({
      displayName: name,
      email: `${name.toLowerCase()}@dominion.test`,
      password: 'dampfmaschine',
    })
    expect(player.emailVerifiedAt).toBeNull()
    const now = Date.now()
    await lastSeen(player.id, new Date(now - 3 * HOUR))
    await app.notifier.enqueue(db, [
      { playerId: player.id, kind: 'invitation', title: 'T', body: 'B', url: '/' },
    ])
    await app.notifier.deliverEmail(new Date(now + 3 * HOUR))
    expect(mails).toHaveLength(0)
    expect((await notificationsOf(player.id)).map((n) => n.emailStatus)).toEqual(['cancelled'])
  })

  it('Push-API: Schlüssel, Anmelden und Abmelden eines Abos', async () => {
    const key = await app.inject({ method: 'GET', url: '/api/push/key' })
    expect(key.json().publicKey).toMatch(/^[\w-]{80,}$/)
    // Gleicher Schlüssel beim zweiten Mal (gespeichert)
    expect((await app.inject({ method: 'GET', url: '/api/push/key' })).json().publicKey).toBe(
      key.json().publicKey,
    )
    expect(
      (await lena.request('POST', '/api/push/subscribe', { endpoint: 'http://unsicher' }))
        .statusCode,
    ).toBe(422)
    const body = { endpoint: 'https://push.example/x', keys: { p256dh: 'p', auth: 'a' } }
    await lena.request('POST', '/api/push/subscribe', body)
    // Gleicher Browser, anderes Konto: das Abo wechselt den Besitzer
    await mira.request('POST', '/api/push/subscribe', body)
    const subs = await db.select().from(pushSubscriptions)
    expect(subs.map((s) => s.playerId)).toEqual([mira.me.id])
    const del = await app.inject({
      method: 'DELETE',
      url: '/api/push/subscribe',
      payload: { endpoint: body.endpoint },
      cookies: { [SESSION_COOKIE]: mira.token },
    })
    expect(del.statusCode).toBe(200)
    expect(await db.select().from(pushSubscriptions)).toEqual([])
  })
})
