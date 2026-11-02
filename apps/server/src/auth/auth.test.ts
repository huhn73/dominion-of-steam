import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import type { Friend, Me } from '@dos/shared/account'
import { buildApp } from '../app'
import { createDb, runMigrations } from '../db/client'
import { accountTokens, players, sessions } from '../db/schema'
import type { MailMessage } from '../notifications/channels'
import { BJOERN, loginAs, sessionToken } from '../test/helpers'
import { hashPassword, verifyPassword } from './password'
import { presenceOf } from './presence'
import { DEV_ACCOUNTS, DEV_PASSWORD, ensureDevAccounts } from './devAccounts'

const url = process.env.TEST_DATABASE_URL

describe('Passwörter', () => {
  it('prüft gegen den gespeicherten scrypt-Hash mit Salz', async () => {
    const a = await hashPassword('dampfmaschine')
    const b = await hashPassword('dampfmaschine')
    expect(a).toMatch(/^scrypt\$/)
    expect(a).not.toBe(b)
    expect(await verifyPassword('dampfmaschine', a)).toBe(true)
    expect(await verifyPassword('Dampfmaschine', a)).toBe(false)
    expect(await verifyPassword('dampfmaschine', 'kaputt')).toBe(false)
  })
})

describe('Anwesenheit', () => {
  const now = new Date('2026-10-30T12:00:00Z')
  const ago = (s: number) => new Date(now.getTime() - s * 1000)
  it('unterscheidet online, im Spiel und offline', () => {
    expect(presenceOf({ lastSeenAt: ago(30), lastSeenMatchId: null }, now)).toEqual({
      status: 'online',
      lastSeen: null,
    })
    expect(presenceOf({ lastSeenAt: ago(30), lastSeenMatchId: 'demo' }, now).status).toBe('inGame')
    expect(presenceOf({ lastSeenAt: ago(180), lastSeenMatchId: 'demo' }, now)).toEqual({
      status: 'offline',
      lastSeen: ago(180).toISOString(),
    })
    expect(presenceOf({ lastSeenAt: null, lastSeenMatchId: null }, now)).toEqual({
      status: 'offline',
      lastSeen: null,
    })
  })
})

describe.skipIf(!url)('Konten-API (Datenbank)', () => {
  const { db, close } = createDb(url ?? '')
  const mails: MailMessage[] = []
  const stubMail = {
    notifications: { push: null, mail: async (m: MailMessage) => void mails.push(m) },
  }
  let app = buildApp({ db, dev: true, ...stubMail })
  const unique = () => Math.random().toString(36).slice(2, 8)
  const linkOf = (mail: MailMessage, path: string) =>
    new RegExp(`http\\S+${path.replace(/[/?]/g, '\\$&')}token=[\\w-]+`).exec(mail.text)![0]
  const tokenOf = (mail: MailMessage) => /token=([\w-]+)/.exec(mail.text)![1]!
  const register = (payload: object) =>
    app.inject({ method: 'POST', url: '/api/auth/register', payload })
  const me = (token?: string) =>
    app.inject({
      method: 'GET',
      url: '/api/me',
      cookies: token ? { dos_session: token } : {},
    })

  beforeAll(async () => {
    await runMigrations(db)
    await ensureDevAccounts(app.accounts)
  })
  beforeEach(() => {
    mails.length = 0
    app = buildApp({ db, dev: true, ...stubMail })
  })
  afterAll(async () => {
    await close()
  })

  it('registriert, meldet an und setzt ein httpOnly-Cookie', async () => {
    const id = unique()
    const res = await register({
      displayName: `  Käpt'n ${id} `,
      email: `Kapitaen-${id}@Example.test`,
      password: 'sehr-geheim',
    })
    expect(res.statusCode).toBe(201)
    const created = res.json<Me>()
    expect(created).toMatchObject({
      name: `Käpt'n ${id}`,
      email: `kapitaen-${id}@example.test`,
      avatarUrl: null,
    })
    const cookie = res.cookies.find((c) => c.name === 'dos_session')!
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 2592000 })
    expect(cookie.secure).toBeFalsy()

    expect((await me(cookie.value)).json<Me>()).toEqual(created)
    // Nur der Hash des Tokens liegt in der Datenbank
    const [row] = await db.select().from(sessions).where(eq(sessions.playerId, created.id))
    expect(row!.id).not.toBe(cookie.value)
    expect(row!.id).toMatch(/^[0-9a-f]{64}$/)
  })

  it('setzt Secure hinter einem https-Proxy, dem der Server vertraut', async () => {
    const payload = {
      displayName: `Proxy ${unique()}`,
      email: `proxy-${unique()}@example.test`,
      password: 'sehr-geheim',
    }
    const headers = { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'dominion.example' }
    const trusted = await buildApp({ db, dev: true, trustProxy: true, ...stubMail }).inject({
      method: 'POST',
      url: '/api/auth/register',
      payload,
      headers,
    })
    expect(trusted.statusCode).toBe(201)
    expect(trusted.cookies.find((c) => c.name === 'dos_session')!.secure).toBe(true)

    // Without trustProxy the headers are ignored (plain http stays insecure)
    const plain = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        ...payload,
        displayName: `Plain ${unique()}`,
        email: `plain-${unique()}@example.test`,
      },
      headers,
    })
    expect(plain.statusCode).toBe(201)
    expect(plain.cookies.find((c) => c.name === 'dos_session')!.secure).toBeFalsy()
  })

  it('prüft die Eingaben bei der Registrierung', async () => {
    const id = unique()
    const ok = { displayName: `Name ${id}`, email: `n-${id}@example.test`, password: '12345678' }
    for (const payload of [
      { ...ok, displayName: ' ab ' },
      { ...ok, displayName: 'x'.repeat(25) },
      { ...ok, email: 'keine-adresse' },
      { ...ok, password: '1234567' },
      {},
    ]) {
      const res = await register(payload)
      expect(res.statusCode).toBe(422)
      expect(res.json().error.code).toBe('INVALID_INPUT')
    }
  })

  it('lehnt doppelte E-Mail-Adressen und Namen ab (ohne Groß-/Kleinschreibung)', async () => {
    let res = await register({
      displayName: `Neu ${unique()}`,
      email: 'BJOERN@dominion.test',
      password: '12345678',
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toEqual({
      code: 'EMAIL_TAKEN',
      message: 'Diese E-Mail-Adresse ist bereits registriert.',
    })
    res = await register({
      displayName: 'björn',
      email: `x-${unique()}@example.test`,
      password: '12345678',
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('NAME_TAKEN')
  })

  it('meldet mit falschem Passwort oder unbekannter Adresse dieselbe Fehlermeldung', async () => {
    for (const payload of [
      { email: BJOERN, password: 'falsch-falsch' },
      { email: 'niemand@dominion.test', password: DEV_PASSWORD },
    ]) {
      const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload })
      expect(res.statusCode).toBe(401)
      expect(res.json().error.code).toBe('INVALID_CREDENTIALS')
      expect(sessionToken(res)).toBeUndefined()
    }
  })

  it('antwortet ohne oder mit ungültiger Sitzung 401 auf /api/me', async () => {
    expect((await me()).statusCode).toBe(401)
    const res = await me('erfunden')
    expect(res.statusCode).toBe(401)
    expect(res.json().error.code).toBe('NOT_AUTHENTICATED')
  })

  it('meldet die aktuelle Sitzung ab, andere bleiben bestehen', async () => {
    const a = await loginAs(app, BJOERN)
    const b = await loginAs(app, BJOERN)
    const res = await a.request('POST', '/api/auth/logout')
    expect(res.statusCode).toBe(200)
    expect(res.cookies.find((c) => c.name === 'dos_session')?.value).toBe('')
    expect((await me(a.token)).statusCode).toBe(401)
    expect((await me(b.token)).statusCode).toBe(200)
  })

  it('meldet auf allen Geräten ab', async () => {
    const a = await loginAs(app, BJOERN)
    const b = await loginAs(app, BJOERN)
    expect((await a.request('POST', '/api/auth/logout-all')).statusCode).toBe(200)
    expect((await me(a.token)).statusCode).toBe(401)
    expect((await me(b.token)).statusCode).toBe(401)
  })

  it('verwirft Sitzungen, die 30 Tage nicht benutzt wurden', async () => {
    const a = await loginAs(app, BJOERN)
    await db
      .update(sessions)
      .set({ lastUsedAt: new Date(Date.now() - 31 * 24 * 3600_000) })
      .where(sql`${sessions.playerId} = ${a.me.id}`)
    expect((await me(a.token)).statusCode).toBe(401)
  })

  it('schickt nach der Registrierung eine Bestätigungsmail; der Link bestätigt die Adresse', async () => {
    const id = unique()
    const email = `best-${id}@example.test`
    const res = await register({ displayName: `Best ${id}`, email, password: 'sehr-geheim' })
    expect(res.statusCode).toBe(201)
    expect(res.json<Me>().emailVerified).toBe(false)
    expect(mails).toHaveLength(1)
    expect(mails[0]).toMatchObject({ to: email, subject: 'Willkommen bei Dominion of Steam' })
    expect(mails[0]!.html).toContain('E-Mail-Adresse bestätigen')
    const link = linkOf(mails[0]!, '/api/account/verify?')
    const verifyPath = link.slice(link.indexOf('/api/'))

    const ok = await app.inject({ method: 'GET', url: verifyPath })
    expect(ok.statusCode).toBe(303)
    expect(ok.headers.location).toBe('/einstellungen?email=verifiziert')
    const token = sessionToken(res)!
    expect((await me(token)).json<Me>().emailVerified).toBe(true)
    // Ein Link gilt nur einmal
    expect((await app.inject({ method: 'GET', url: verifyPath })).headers.location).toBe(
      '/einstellungen?email=ungueltig',
    )
  })

  it('„Erneut senden“: Abstand von 2 Minuten, bestätigte Konten brauchen nichts', async () => {
    const id = unique()
    const res = await register({
      displayName: `Nochmal ${id}`,
      email: `nochmal-${id}@example.test`,
      password: 'sehr-geheim',
    })
    const token = sessionToken(res)!
    const resend = () =>
      app.inject({
        method: 'POST',
        url: '/api/account/verify/resend',
        cookies: { dos_session: token },
      })
    const again = await resend()
    expect(again.statusCode).toBe(429)
    expect(again.json().error.code).toBe('RESEND_COOLDOWN')
    expect(mails).toHaveLength(1)
    // Zwei Minuten später
    await db
      .update(accountTokens)
      .set({ createdAt: new Date(Date.now() - 3 * 60_000) })
      .where(eq(accountTokens.playerId, res.json<Me>().id))
    expect((await resend()).json()).toEqual({ ok: true, alreadyVerified: false })
    expect(mails).toHaveLength(2)
    // Der neue Link gilt, der alte nicht mehr
    const oldToken = tokenOf(mails[0]!)
    expect(
      (await app.inject({ method: 'GET', url: `/api/account/verify?token=${oldToken}` })).headers
        .location,
    ).toBe('/einstellungen?email=ungueltig')
    const link = linkOf(mails[1]!, '/api/account/verify?')
    await app.inject({ method: 'GET', url: link.slice(link.indexOf('/api/')) })
    expect((await resend()).json()).toEqual({ ok: true, alreadyVerified: true })
    expect(mails).toHaveLength(2)
  })

  it('Passwort vergessen: Link per Mail, neues Passwort meldet an und beendet andere Sitzungen', async () => {
    const id = unique()
    const email = `vergessen-${id}@example.test`
    const created = await register({ displayName: `Vergessen ${id}`, email, password: 'altes-pw' })
    const other = sessionToken(created)!
    mails.length = 0
    const forgot = (email: string) =>
      app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email } })
    // Unbekannte Adresse: gleiche Antwort, keine Mail
    expect((await forgot('niemand@example.test')).json()).toEqual({ ok: true })
    expect((await forgot('keine-adresse')).statusCode).toBe(422)
    expect(mails).toEqual([])

    expect((await forgot(email.toUpperCase())).json()).toEqual({ ok: true })
    expect(mails).toHaveLength(1)
    expect(mails[0]).toMatchObject({ to: email, subject: 'Neues Passwort für Dominion of Steam' })
    expect(mails[0]!.text).toContain('/passwort-zuruecksetzen?token=')
    // Abstand: die zweite Anfrage verschickt nichts
    expect((await forgot(email)).json()).toEqual({ ok: true })
    expect(mails).toHaveLength(1)
    const token = tokenOf(mails[0]!)
    const reset = (token: string, password: string) =>
      app.inject({ method: 'POST', url: '/api/auth/reset', payload: { token, password } })

    expect((await reset(token, 'kurz')).statusCode).toBe(422)
    const bad = await reset('erfunden', 'neues-passwort')
    expect(bad.statusCode).toBe(422)
    expect(bad.json().error.code).toBe('INVALID_TOKEN')
    expect((await me(other)).statusCode).toBe(200)

    const ok = await reset(token, 'neues-passwort')
    expect(ok.statusCode).toBe(200)
    expect(ok.json<Me>()).toMatchObject({ email, emailVerified: true })
    const mine = sessionToken(ok)!
    expect((await me(mine)).statusCode).toBe(200)
    expect((await me(other)).statusCode).toBe(401)
    // Hinweis-Mail über die Änderung
    expect(mails[1]).toMatchObject({ to: email, subject: 'Dein Passwort wurde geändert' })
    // Nur das neue Passwort gilt, der Link ist verbraucht
    await loginAs(app, email, 'neues-passwort')
    const old = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'altes-pw' },
    })
    expect(old.statusCode).toBe(401)
    expect((await reset(token, 'noch-ein-passwort')).json().error.code).toBe('INVALID_TOKEN')
  })

  it('Passwort vergessen: abgelaufene Links gelten nicht', async () => {
    const id = unique()
    const email = `ablauf-${id}@example.test`
    const created = await register({ displayName: `Ablauf ${id}`, email, password: 'altes-pw' })
    mails.length = 0
    await app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email } })
    await db
      .update(accountTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(accountTokens.playerId, created.json<Me>().id))
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset',
      payload: { token: tokenOf(mails[0]!), password: 'neues-passwort' },
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().error.code).toBe('INVALID_TOKEN')
  })

  it('begrenzt Anmeldeversuche je IP', async () => {
    const limited = buildApp({ db, dev: true, rateLimit: true, ...stubMail })
    const attempt = () =>
      limited.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: BJOERN, password: 'falsch-falsch' },
        remoteAddress: '203.0.113.7',
      })
    for (let i = 0; i < 20; i++) expect((await attempt()).statusCode).toBe(401)
    const blocked = await attempt()
    expect(blocked.statusCode).toBe(429)
    expect(blocked.json().error).toEqual({
      code: 'RATE_LIMITED',
      message: 'Zu viele Versuche. Bitte warte 15 Minuten.',
    })
    expect(blocked.headers['retry-after']).toBeDefined()
    // Eine andere IP ist nicht betroffen
    const otherIp = await limited.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: BJOERN, password: DEV_PASSWORD },
      remoteAddress: '203.0.113.8',
    })
    expect(otherIp.statusCode).toBe(200)
  })

  it('legt die Dev-Konten idempotent an; Björn ist mit allen befreundet', async () => {
    await ensureDevAccounts(app.accounts)
    const emails = DEV_ACCOUNTS.map((a) => a.email)
    const rows = await db
      .select()
      .from(players)
      .where(sql`${players.email} like '%@dominion.test'`)
    expect(rows.filter((r) => emails.includes(r.email as never))).toHaveLength(emails.length)

    const bjoern = await loginAs(app, BJOERN)
    const friends = (await bjoern.request('GET', '/api/friends')).json<Friend[]>()
    expect(friends.map((f) => f.name).sort()).toEqual(
      DEV_ACCOUNTS.slice(1)
        .map((a) => a.displayName)
        .sort(),
    )
    expect(friends.find((f) => f.name === 'Tobias Brenner')).toMatchObject({
      status: 'offline',
      lastSeen: '2026-10-29T21:14:00.000Z',
    })
  })

  it('zeigt Freunde mit Anwesenheit: online, im Spiel, offline', async () => {
    const bjoern = await loginAs(app, BJOERN)
    const lena = await loginAs(app, 'lena@dominion.test')
    const mira = await loginAs(app, 'mira@dominion.test')
    await app.matches.resetDemo()
    await lena.request('GET', '/api/matches/demo/view') // Lena öffnet die Partie
    await mira.request('GET', '/api/me') // Mira ist in der Lobby
    // Jonas war vor 5 Minuten zuletzt aktiv
    await db
      .update(players)
      .set({ lastSeenAt: new Date(Date.now() - 5 * 60_000), lastSeenMatchId: null })
      .where(eq(players.email, 'jonas@dominion.test'))

    const friends = (await bjoern.request('GET', '/api/friends')).json<Friend[]>()
    const byName = (n: string) => friends.find((f) => f.name === n)!
    expect(byName('Lena Hartmann')).toMatchObject({ status: 'inGame', lastSeen: null })
    expect(byName('Mira Okonkwo')).toMatchObject({ status: 'online', lastSeen: null })
    expect(byName('Jonas Vogt').status).toBe('offline')
    expect(byName('Jonas Vogt').lastSeen).not.toBeNull()
    expect(Object.keys(byName('Lena Hartmann')).sort()).toEqual(
      ['avatarUrl', 'id', 'lastSeen', 'name', 'status'].sort(),
    )
  })

  it('fügt Freunde per Name hinzu, in beide Richtungen', async () => {
    const id = unique()
    const reg = await register({
      displayName: `Neuling ${id}`,
      email: `neu-${id}@example.test`,
      password: '12345678',
    })
    const token = sessionToken(reg)!
    const add = (name: string) =>
      app.inject({
        method: 'POST',
        url: '/api/friends',
        payload: { name },
        cookies: { dos_session: token },
      })
    let res = await add('lena hartmann')
    expect(res.statusCode).toBe(201)
    expect(res.json<Friend>().name).toBe('Lena Hartmann')
    expect((await add('Lena Hartmann')).statusCode).toBe(201) // schon befreundet: kein Fehler
    expect((await add('Niemand Bekanntes')).json().error.code).toBe('PLAYER_NOT_FOUND')
    expect((await add(`neuling ${id}`)).json().error.code).toBe('CANNOT_FRIEND_SELF')

    const lena = await loginAs(app, 'lena@dominion.test')
    const lenasFriends = (await lena.request('GET', '/api/friends')).json<Friend[]>()
    expect(lenasFriends.map((f) => f.name)).toContain(`Neuling ${id}`)
    res = await app.inject({ method: 'GET', url: '/api/friends' })
    expect(res.statusCode).toBe(401)
  })
})
