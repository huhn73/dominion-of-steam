import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, ne } from 'drizzle-orm'
import {
  createMatch,
  defaultRules,
  finishMatch,
  type GameState,
  surrender,
} from '@dos/shared/engine'
import { MAP_SIZES } from '@dos/shared/game/catalog'
import type { Me } from '@dos/shared/account'
import { DEFAULT_SETTINGS, type ProfileData, type SettingsData } from '@dos/shared/profile'
import type { MatchDraft, SetupData } from '@dos/shared/setup'
import { buildApp } from '../app'
import { ensureDevAccounts } from '../auth/devAccounts'
import { createDb, runMigrations } from '../db/client'
import { accountTokens, matches, matchSeats, notifications, players, sessions } from '../db/schema'
import { insertMatch } from '../matches/repository'
import type { MailMessage } from '../notifications/channels'
import { SESSION_COOKIE } from '../session'
import { BJOERN, LENA, loginAs } from '../test/helpers'

const url = process.env.TEST_DATABASE_URL
const PASSWORD = 'dampfmaschine'
// 1×1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

type Session = Awaited<ReturnType<typeof loginAs>>

function multipart(filename: string, type: string, data: Buffer) {
  const boundary = `----dos${Date.now()}`
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`,
    ),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}

describe.skipIf(!url)('Profil & Einstellungen (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  const mails: MailMessage[] = []
  let uploadsDir = ''
  let app = buildApp({ db, dev: true })
  let counter = 0

  /** Register a throwaway player and log in */
  async function newPlayer(prefix = 'Neu') {
    const name = `${prefix}${Date.now() % 100000}${counter++}`
    const email = `${name.toLowerCase()}@dominion.test`
    await app.accounts.register({ displayName: name, email, password: PASSWORD })
    return { ...(await loginAs(app, email, PASSWORD)), name, email }
  }

  const send = (
    s: { token: string },
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    payload?: object,
  ) => app.inject({ method, url, payload, cookies: { [SESSION_COOKIE]: s.token } })

  const profileOf = async (s: Session, query = '') => {
    const res = await send(s, 'GET', `/api/profile${query}`)
    expect(res.statusCode).toBe(200)
    return res.json<ProfileData>()
  }

  /** Finished match (or still running with `finish: false`) between the given humans and an AI */
  async function playedMatch(
    id: string,
    humans: { id: string; name: string; factionId: string }[],
    {
      endedAt,
      winner,
      round = 20,
      finish = true,
      surrenderBy,
      stats = {},
    }: {
      endedAt: string
      winner?: string | null
      round?: number
      finish?: boolean
      surrenderBy?: string
      stats?: Record<string, { citiesCaptured: number; unitsBuilt: number }>
    },
  ) {
    const colors = ['amber', 'rose', 'sky', 'lime'] as const
    const factions = ['eisenbund', 'aurelia', 'nordmark', 'salzkueste']
    const used = new Set(humans.map((h) => h.factionId))
    const aiFaction = factions.find((f) => !used.has(f))!
    const state: GameState = createMatch(
      {
        id,
        name: `Partie ${id}`,
        rules: defaultRules('async'),
        map: {
          ...MAP_SIZES.small,
          landShare: 50,
          neutralCities: 'normal',
          terrain: 'normal',
          seed: `PROFIL-${id}`,
        },
        participants: [
          ...humans.map((h) => ({
            ...h,
            color: colors[factions.indexOf(h.factionId)]!,
            isAI: false,
            aiDifficulty: null,
          })),
          {
            id: 'ai1',
            name: 'Admiral Kessler',
            factionId: aiFaction,
            color: colors[factions.indexOf(aiFaction)]!,
            isAI: true,
            aiDifficulty: 'normal' as const,
          },
        ],
      },
      new Date('2026-10-01T10:00:00Z'),
    )
    state.round = round
    for (const p of state.participants) Object.assign(p, stats[p.id] ?? {})
    if (surrenderBy) surrender(state, surrenderBy, new Date(endedAt))
    if (finish) finishMatch(state, winner ?? null, new Date(endedAt), 'elimination')
    await insertMatch(db, state)
    return state
  }

  beforeAll(async () => {
    await runMigrations(db)
    uploadsDir = await mkdtemp(path.join(tmpdir(), 'dos-uploads-'))
  })
  beforeEach(async () => {
    mails.length = 0
    app = buildApp({
      db,
      dev: true,
      uploadsDir,
      notifications: {
        push: null,
        mail: async (m) => {
          mails.push(m)
        },
        autoDeliver: false,
      },
    })
    await ensureDevAccounts(app.accounts)
    await db.delete(matches).where(ne(matches.id, 'demo'))
    await db.delete(notifications)
  })
  afterAll(async () => {
    await close()
    await rm(uploadsDir, { recursive: true, force: true })
  })

  it('neuer Spieler: leere Bilanz, alle Fraktionen ungespielt, Vorgaben der Einstellungen', async () => {
    const neu = await newPlayer()
    const profile = await profileOf(neu)
    expect(profile.profile).toMatchObject({
      id: neu.me.id,
      displayName: neu.name,
      avatarUrl: null,
      favoriteFactionId: null,
    })
    expect(Date.parse(profile.profile.memberSince)).toBeGreaterThan(Date.now() - 60_000)
    expect(profile.stats).toEqual({
      gamesPlayed: 0,
      wins: 0,
      citiesCaptured: 0,
      unitsBuilt: 0,
      longestGameRounds: 0,
    })
    expect(profile.factionStats).toEqual(
      ['eisenbund', 'aurelia', 'nordmark', 'salzkueste'].map((factionId) => ({
        factionId,
        gamesPlayed: 0,
        wins: 0,
      })),
    )
    expect(profile).toMatchObject({ history: [], hasMoreHistory: false, nextCursor: null })
    expect(profile.factions.map((f) => f.shortName)).toEqual([
      'Eisenbund',
      'Aurelia',
      'Nordmark',
      'Salzküste',
    ])

    const settings = (await send(neu, 'GET', '/api/settings')).json<SettingsData>()
    expect(settings).toEqual({
      settings: DEFAULT_SETTINGS,
      account: { email: neu.email, emailVerified: false, activeSessions: 1 },
      displayName: neu.name,
    })
    expect((await app.inject({ method: 'GET', url: '/api/profile' })).statusCode).toBe(401)
    expect((await app.inject({ method: 'GET', url: '/api/settings' })).statusCode).toBe(401)
  })

  it('Bilanz und Verlauf aus beendeten und aufgegebenen Partien, mit Seiten', async () => {
    const a = await newPlayer('Bilanz')
    const b = await newPlayer('Gegner')
    const A = { id: a.me.id, name: a.name }
    const B = { id: b.me.id, name: b.name }
    // Sieg mit Eisenbund (älteste), Niederlage mit Nordmark, aufgegeben mit Eisenbund, laufend
    await playedMatch(
      'p-sieg',
      [
        { ...A, factionId: 'eisenbund' },
        { ...B, factionId: 'aurelia' },
      ],
      {
        endedAt: '2026-10-10T10:00:00Z',
        winner: A.id,
        round: 48,
        stats: { [A.id]: { citiesCaptured: 5, unitsBuilt: 20 } },
      },
    )
    await playedMatch('p-nieder', [{ ...A, factionId: 'nordmark' }], {
      endedAt: '2026-10-12T10:00:00Z',
      winner: 'ai1',
      round: 63,
      stats: { [A.id]: { citiesCaptured: 2, unitsBuilt: 9 } },
    })
    await playedMatch(
      'p-auf',
      [
        { ...A, factionId: 'eisenbund' },
        { ...B, factionId: 'aurelia' },
      ],
      {
        endedAt: '2026-10-14T10:00:00Z',
        round: 7,
        finish: false,
        surrenderBy: A.id,
        stats: { [A.id]: { citiesCaptured: 1, unitsBuilt: 3 } },
      },
    )
    await playedMatch('p-laeuft', [{ ...A, factionId: 'salzkueste' }], {
      endedAt: '2026-10-20T10:00:00Z',
      finish: false,
    })

    const profile = await profileOf(a)
    expect(profile.stats).toEqual({
      gamesPlayed: 3,
      wins: 1,
      citiesCaptured: 8,
      unitsBuilt: 32,
      longestGameRounds: 63,
    })
    expect(profile.profile.favoriteFactionId).toBe('eisenbund')
    expect(profile.factionStats).toEqual([
      { factionId: 'eisenbund', gamesPlayed: 2, wins: 1 },
      { factionId: 'aurelia', gamesPlayed: 0, wins: 0 },
      { factionId: 'nordmark', gamesPlayed: 1, wins: 0 },
      { factionId: 'salzkueste', gamesPlayed: 0, wins: 0 },
    ])
    expect(profile.history.map((h) => [h.id, h.result, h.placement, h.rounds])).toEqual([
      ['p-auf', 'surrendered', 3, 7],
      ['p-nieder', 'defeat', 2, 63],
      ['p-sieg', 'victory', 1, 48],
    ])
    expect(profile.history[0]).toMatchObject({
      name: 'Partie p-auf',
      endedAt: '2026-10-14T10:00:00.000Z',
      playerCount: 3,
      factionId: 'eisenbund',
      opponents: [B.name, 'Admiral Kessler (KI)'],
    })

    // Seiten zu je 2 Einträgen
    const first = await profileOf(a, '?limit=2')
    expect(first.history.map((h) => h.id)).toEqual(['p-auf', 'p-nieder'])
    expect(first.hasMoreHistory).toBe(true)
    const second = await profileOf(a, `?limit=2&cursor=${first.nextCursor}`)
    expect(second.history.map((h) => h.id)).toEqual(['p-sieg'])
    expect(second).toMatchObject({ hasMoreHistory: false, nextCursor: null })
    expect((await send(a, 'GET', '/api/profile?cursor=kaputt')).statusCode).toBe(422)

    // Der Gegner sieht den Aufgebenden mit seinem Namen; die laufende Partie zählt bei ihm nicht
    const other = await profileOf(b)
    expect(other.history.map((h) => [h.id, h.result])).toEqual([['p-sieg', 'defeat']])
    expect(other.history[0]!.opponents).toEqual([A.name, 'Admiral Kessler (KI)'])
  })

  it('Anzeigename: 3–24 Zeichen, eindeutig ohne Groß-/Kleinschreibung, danach in /api/me', async () => {
    const neu = await newPlayer()
    const patch = (displayName: unknown) =>
      send(neu, 'PATCH', '/api/profile', { displayName } as object)
    expect((await patch('Bj')).json().error).toEqual({
      code: 'INVALID_INPUT',
      message: 'Der Name muss 3 bis 24 Zeichen lang sein.',
    })
    expect((await patch('   ')).statusCode).toBe(422)
    expect((await patch('x'.repeat(25))).statusCode).toBe(422)
    const taken = await patch('lena hartmann')
    expect(taken.statusCode).toBe(409)
    expect(taken.json().error.message).toBe('Dieser Name ist bereits vergeben.')

    const res = await patch(`  ${neu.name}-Neu  `)
    expect(res.statusCode).toBe(200)
    expect(res.json<Me>().name).toBe(`${neu.name}-Neu`)
    expect((await send(neu, 'GET', '/api/me')).json<Me>().name).toBe(`${neu.name}-Neu`)
    // Nur die Schreibweise des eigenen Namens ändern geht
    expect((await patch(`${neu.name}-NEU`)).statusCode).toBe(200)
  })

  it('Avatar: hochladen, ausliefern, ersetzen (alte Datei weg), falsches Format, zu groß, entfernen', async () => {
    const neu = await newPlayer()
    const upload = (filename: string, type: string, data: Buffer) =>
      app.inject({
        method: 'POST',
        url: '/api/profile/avatar',
        cookies: { [SESSION_COOKIE]: neu.token },
        ...multipart(filename, type, data),
      })
    const res = await upload('ich.png', 'image/png', PNG)
    expect(res.statusCode).toBe(200)
    const first = res.json<Me>().avatarUrl!
    expect(first).toMatch(new RegExp(`^/uploads/avatars/${neu.me.id}-[0-9a-f]{12}\\.png$`))
    const file = await app.inject({ method: 'GET', url: first })
    expect(file.statusCode).toBe(200)
    expect(file.headers['content-type']).toBe('image/png')
    expect(file.headers['cache-control']).toContain('immutable')
    expect((await send(neu, 'GET', '/api/me')).json<Me>().avatarUrl).toBe(first)

    // Neues Bild: neuer Dateiname, alte Datei gelöscht
    const second = (await upload('ich2.png', 'image/png', PNG)).json<Me>().avatarUrl!
    expect(second).not.toBe(first)
    const files = await readdir(path.join(uploadsDir, 'avatars'))
    expect(files).toContain(path.basename(second))
    expect(files).not.toContain(path.basename(first))

    // Kein Bild (der angegebene Typ zählt nicht), zu groß, kein Multipart
    const text = await upload('bild.png', 'image/png', Buffer.from('kein Bild'))
    expect(text.statusCode).toBe(415)
    expect(text.json().error.message).toBe(
      'Bitte wähle ein Bild im Format PNG, JPEG, WebP oder GIF.',
    )
    const big = await upload('gross.png', 'image/png', Buffer.alloc(2 * 1024 * 1024 + 10, 1))
    expect(big.statusCode).toBe(413)
    expect(big.json().error.message).toBe('Das Bild ist zu groß (höchstens 2 MB).')
    expect((await send(neu, 'POST', '/api/profile/avatar', {})).statusCode).toBe(422)

    const removed = await send(neu, 'DELETE', '/api/profile/avatar')
    expect(removed.json<Me>().avatarUrl).toBeNull()
    expect(await readdir(path.join(uploadsDir, 'avatars'))).not.toContain(path.basename(second))
    expect((await app.inject({ method: 'GET', url: second })).statusCode).toBe(404)
  })

  it('Einstellungen: vollständige Form prüfen, speichern, laden; E-Mail-Schalter wirkt beim Versand', async () => {
    const neu = await newPlayer()
    const put = (settings: unknown) => send(neu, 'PUT', '/api/settings', settings as object)
    const changed = structuredClone(DEFAULT_SETTINGS)
    changed.notifications.yourTurn.email = false
    changed.notifications.emailDelayHours = 0
    changed.display.theme = 'dark'
    changed.sound = { muted: true, master: 35, effects: 0, music: 100, ambience: 55 }
    changed.controls.rightClick = 'contextMenu'

    const invalid = [
      { ...changed, sound: { ...changed.sound, master: 101 } },
      { ...changed, display: { ...changed.display, theme: 'blau' } },
      { ...changed, display: { ...changed.display, turnReport: 'ja' } },
      { ...changed, notifications: { ...changed.notifications, emailDelayHours: 2 } },
      { ...changed, controls: undefined },
      [],
    ]
    for (const s of invalid) {
      const res = await put(s)
      expect(res.statusCode).toBe(422)
      expect(res.json().error.code).toBe('INVALID_SETTINGS')
    }
    const res = await put({ ...changed, extra: true })
    expect(res.statusCode).toBe(200)
    expect(res.json<SettingsData>().settings).toEqual(changed)
    expect((await send(neu, 'GET', '/api/settings')).json<SettingsData>().settings).toEqual(changed)
    const [row] = await db.select().from(players).where(eq(players.id, neu.me.id))
    expect(row!.settings).toEqual(changed)

    // „Du bist am Zug“ per E-Mail aus: keine E-Mail, Push bleibt an
    await db.transaction((tx) =>
      app.notifier.enqueue(tx, [
        { playerId: neu.me.id, kind: 'yourTurn', title: 'Am Zug', body: 'Los', url: '/' },
        { playerId: neu.me.id, kind: 'invitation', title: 'Einladung', body: 'Komm', url: '/' },
      ]),
    )
    const rows = await db.select().from(notifications).where(eq(notifications.playerId, neu.me.id))
    expect(Object.fromEntries(rows.map((n) => [n.kind, n.emailStatus]))).toEqual({
      yourTurn: 'skipped',
      invitation: 'pending',
    })
  })

  it('E-Mail ändern: Passwort prüfen, Link an die neue Adresse, Bestätigung übernimmt sie', async () => {
    const neu = await newPlayer()
    const change = (email: string, currentPassword: string) =>
      send(neu, 'POST', '/api/account/email', { email, currentPassword })
    const newEmail = `neu-${neu.email}`

    expect((await change(newEmail, 'falsch')).statusCode).toBe(403)
    expect((await change(newEmail, 'falsch')).json().error.message).toBe(
      'Das aktuelle Passwort ist falsch.',
    )
    expect((await change('neu@example', PASSWORD)).statusCode).toBe(422)
    expect((await change(neu.email, PASSWORD)).statusCode).toBe(422)
    expect((await change(LENA, PASSWORD)).statusCode).toBe(409)
    expect(mails).toEqual([])

    const res = await change(newEmail.toUpperCase(), PASSWORD)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true, pendingEmail: newEmail })
    expect(mails).toHaveLength(1)
    expect(mails[0]!.to).toBe(newEmail)
    expect(mails[0]!.subject).toBe('Bestätige deine neue E-Mail-Adresse')
    const link = /http\S+\/api\/account\/email\/confirm\?token=[\w-]+/.exec(mails[0]!.text)![0]
    const confirmPath = link.slice(link.indexOf('/api/'))
    // Noch nicht bestätigt: alte Adresse gilt
    expect((await send(neu, 'GET', '/api/me')).json<Me>().email).toBe(neu.email)

    const confirmed = await app.inject({ method: 'GET', url: confirmPath })
    expect(confirmed.statusCode).toBe(303)
    expect(confirmed.headers.location).toBe('/einstellungen?email=bestaetigt')
    expect((await send(neu, 'GET', '/api/me')).json<Me>()).toMatchObject({
      email: newEmail,
      emailVerified: true,
    })
    await loginAs(app, newEmail, PASSWORD)
    // Die alte Adresse bekommt einen Hinweis
    expect(mails).toHaveLength(2)
    expect(mails[1]).toMatchObject({
      to: neu.email,
      subject: 'Deine E-Mail-Adresse wurde geändert',
    })
    expect(mails[1]!.text).toContain(newEmail)
    expect(mails[1]!.text).toContain('/passwort-vergessen')
    // Ein Link gilt nur einmal; abgelaufene und unbekannte Links
    expect((await app.inject({ method: 'GET', url: confirmPath })).headers.location).toBe(
      '/einstellungen?email=ungueltig',
    )
    await change(`zwei-${neu.email}`, PASSWORD)
    await db.update(accountTokens).set({ expiresAt: new Date(Date.now() - 1000) })
    const token2 = /token=([\w-]+)/.exec(mails[2]!.text)![1]
    expect(
      (await app.inject({ method: 'GET', url: `/api/account/email/confirm?token=${token2}` }))
        .headers.location,
    ).toBe('/einstellungen?email=ungueltig')
  })

  it('Passwort ändern: aktuelles Passwort nötig, andere Geräte werden abgemeldet', async () => {
    const neu = await newPlayer()
    const other = await loginAs(app, neu.email, PASSWORD)
    expect((await send(neu, 'GET', '/api/settings')).json<SettingsData>().account).toMatchObject({
      activeSessions: 2,
    })
    const change = (currentPassword: string, newPassword: string) =>
      send(neu, 'POST', '/api/account/password', { currentPassword, newPassword })
    expect((await change('falsch', 'neuesPasswort')).statusCode).toBe(403)
    expect((await change(PASSWORD, 'kurz')).statusCode).toBe(422)
    expect((await send(other, 'GET', '/api/me')).statusCode).toBe(200)

    const res = await change(PASSWORD, 'neuesPasswort')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true, activeSessions: 1 })
    expect(mails).toHaveLength(1)
    expect(mails[0]).toMatchObject({ to: neu.email, subject: 'Dein Passwort wurde geändert' })
    expect((await send(neu, 'GET', '/api/me')).statusCode).toBe(200)
    expect((await send(other, 'GET', '/api/me')).statusCode).toBe(401)
    const old = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: neu.email, password: PASSWORD },
    })
    expect(old.statusCode).toBe(401)
    await loginAs(app, neu.email, 'neuesPasswort')
  })

  it('Konto löschen: KI übernimmt laufende Partien, Warteräume werden verlassen, alles weg', async () => {
    const bjoern = await loginAs(app, BJOERN)
    const neu = await newPlayer('Weg')
    await app.accounts.addFriend(neu.me.id, bjoern.me.id)
    // Laufende Partie, der Gelöschte ist am Zug
    await playedMatch(
      'p-del',
      [
        { id: neu.me.id, name: neu.name, factionId: 'eisenbund' },
        { id: bjoern.me.id, name: 'Björn', factionId: 'aurelia' },
      ],
      { endedAt: '2026-10-14T10:00:00Z', finish: false },
    )
    // Beendete Partie bleibt mit seinem Namen erhalten
    await playedMatch(
      'p-alt',
      [
        { id: neu.me.id, name: neu.name, factionId: 'eisenbund' },
        { id: bjoern.me.id, name: 'Björn', factionId: 'aurelia' },
      ],
      { endedAt: '2026-10-01T10:00:00Z', winner: bjoern.me.id },
    )
    // Björns Warteraum, dem er beigetreten ist, und sein eigener Warteraum
    const setup = (await bjoern.request('GET', '/api/setup')).json<SetupData>()
    const draft: MatchDraft = {
      ...setup.draft,
      name: 'Warten',
      factionId: 'eisenbund',
      mode: 'async',
      fillEmptyWithAI: true,
      seats: [{ kind: 'you' }, { kind: 'open' }],
      map: { ...setup.draft.map, size: 'small', seed: 'WARTEN-1' },
    }
    const created = await bjoern.request('POST', '/api/matches', {
      draft,
      reservationId: setup.reservationId,
    })
    const waitingId = created.json<{ matchId: string }>().matchId
    expect((await send(neu, 'POST', `/api/matches/${waitingId}/join`)).statusCode).toBe(200)
    const ownSetup = (await send(neu, 'GET', '/api/setup')).json<SetupData>()
    const own = await send(neu, 'POST', '/api/matches', {
      draft: { ...draft, name: 'Eigene', map: { ...draft.map, seed: 'WARTEN-2' } },
      reservationId: ownSetup.reservationId,
    })
    expect(own.statusCode).toBe(201)
    const ownId = own.json<{ matchId: string }>().matchId

    // Nur mit dem aktuellen Passwort
    expect((await send(neu, 'DELETE', '/api/account')).statusCode).toBe(403)
    expect(
      (await send(neu, 'DELETE', '/api/account', { currentPassword: 'falsch' })).statusCode,
    ).toBe(403)
    expect(await db.select().from(players).where(eq(players.id, neu.me.id))).toHaveLength(1)
    const res = await send(neu, 'DELETE', '/api/account', { currentPassword: PASSWORD })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true, matchesTakenOver: 1, matchesLeft: 2 })
    expect(res.cookies.find((c) => c.name === SESSION_COOKIE)?.value).toBe('')

    expect(await db.select().from(players).where(eq(players.id, neu.me.id))).toEqual([])
    expect(await db.select().from(sessions).where(eq(sessions.playerId, neu.me.id))).toEqual([])
    expect((await send(neu, 'GET', '/api/me')).statusCode).toBe(401)
    // Laufende Partie: KI (Normal) spielt die Fraktion, Björn ist jetzt am Zug
    const [running] = await db.select().from(matches).where(eq(matches.id, 'p-del'))
    const state = running!.state!
    expect(state.status).toBe('running')
    expect(state.participants[0]).toMatchObject({
      id: neu.me.id,
      name: `KI für ${neu.name}`,
      isAI: true,
      aiDifficulty: 'normal',
    })
    expect(state.participants[state.seat]!.id).toBe(bjoern.me.id)
    const seats = await db.select().from(matchSeats).where(eq(matchSeats.matchId, 'p-del'))
    expect(seats.find((s) => s.participantId === neu.me.id)).toMatchObject({
      kind: 'ai',
      playerId: null,
    })
    // Beendete Partie: Name bleibt im Spielstand, Björns Verlauf zeigt ihn weiter
    const bjoernProfile = await profileOf(bjoern)
    expect(bjoernProfile.history.find((h) => h.id === 'p-alt')!.opponents).toContain(neu.name)
    // Warteräume: eigener aufgelöst, in Björns ist der Platz wieder frei
    expect(await db.select().from(matches).where(eq(matches.id, ownId))).toEqual([])
    const waitingSeats = await db.select().from(matchSeats).where(eq(matchSeats.matchId, waitingId))
    expect(waitingSeats.map((s) => [s.kind, s.playerId])).toEqual([
      ['player', bjoern.me.id],
      ['open', null],
    ])
  })
})
