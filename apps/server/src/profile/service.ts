import { LocalizedError } from '../locale'
import { randomBytes } from 'node:crypto'
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { and, eq, gt, ne, notLike, sql } from 'drizzle-orm'
import {
  EMAIL_VERIFY_TTL_HOURS,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from '@dos/shared/account'
import type { ParticipantState } from '@dos/shared/engine'
import {
  HISTORY_PAGE_MAX,
  HISTORY_PAGE_SIZE,
  type FactionStat,
  type HistoryEntry,
  type ProfileData,
  type Settings,
  type SettingsData,
  settingsOf,
  validateDisplayName,
} from '@dos/shared/profile'
import type { Db } from '../db/client'
import { matches, matchSeats, players, sessions } from '../db/schema'
import { AvatarImageError, renderAvatar, type AvatarCrop } from './avatarImage'
import { isTutorialMatchId, TUTORIAL_LIKE, tutorialMatchId } from '../tutorial/service'
import { SESSION_TTL_MS, type Player } from '../auth/accounts'
import {
  sendEmailChangeConfirmation,
  sendEmailChanged,
  sendPasswordChanged,
} from '../auth/accountMails'
import { hashPassword, verifyPassword } from '../auth/password'
import { consumeToken, issueToken } from '../auth/tokens'
import { LOBBY_FACTIONS, type LobbyService } from '../lobby/service'
import type { Mailer } from '../notifications/channels'

/** German message for the client with HTTP status and code */
export class ProfileError extends LocalizedError {}

/** Default folder for uploads (avatars): `apps/server/uploads`; Docker sets `UPLOADS_DIR` */
export const defaultUploadsDir = () =>
  process.env.UPLOADS_DIR ?? fileURLToPath(new URL('../../uploads', import.meta.url))

/** Public path of uploaded avatars (served from `<uploadsDir>/avatars`) */
export const AVATAR_PATH = '/uploads/avatars/'

const isUniqueViolation = (err: unknown, constraint: string) => {
  const e = (err as { cause?: unknown })?.cause ?? err
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as { code?: string }).code === '23505' &&
    (e as { constraint_name?: string }).constraint_name === constraint
  )
}

const nameTaken = () => new ProfileError(409, 'NAME_TAKEN', { key: 'errors.nameTaken' })
const emailTaken = () =>
  new ProfileError(409, 'EMAIL_TAKEN', { key: 'errors.emailTaken' })
const wrongPassword = () =>
  new ProfileError(403, 'WRONG_PASSWORD', { key: 'errors.wrongPassword' })

/** Image type by its first bytes (the declared type of an upload is not trusted) */
export function sniffImage(buf: Buffer): { type: string; ext: string } | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
    return { type: 'image/png', ext: 'png' }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { type: 'image/jpeg', ext: 'jpg' }
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString('latin1')))
    return { type: 'image/gif', ext: 'gif' }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return { type: 'image/webp', ext: 'webp' }
  return null
}

// =============================================================================
// Bilanz und Verlauf
// =============================================================================

/** One finished (or surrendered) match from the player's point of view */
interface Played {
  entry: HistoryEntry
  citiesCaptured: number
  unitsBuilt: number
}

interface MatchSummary {
  id: string
  name: string
  status: 'running' | 'finished'
  round: number
  endedAt: string | null
  winnerId: string | null
  participants: ParticipantState[]
}

/** Opponent names as the history shows them: AI with "(KI)", surrendered players by name */
const opponentName = (q: ParticipantState) =>
  q.surrender ? q.surrender.name : q.isAI ? `${q.name} (KI)` : q.name

/** The match from the player's view; null while the player still plays it */
export function playedMatch(m: MatchSummary, me: string): Played | null {
  const p = m.participants.find((x) => x.id === me)
  if (!p) return null
  const opponents = m.participants.filter((q) => q !== p).map(opponentName)
  const base = {
    id: m.id,
    name: m.name,
    playerCount: m.participants.length,
    factionId: p.factionId,
    opponents,
  }
  if (p.surrender)
    return {
      entry: {
        ...base,
        endedAt: p.surrender.at,
        result: 'surrendered',
        placement: p.surrender.placement,
        rounds: p.surrender.round,
      },
      citiesCaptured: p.surrender.citiesCaptured ?? p.citiesCaptured ?? 0,
      unitsBuilt: p.surrender.unitsBuilt ?? p.unitsBuilt ?? 0,
    }
  if (m.status !== 'finished') return null
  return {
    entry: {
      ...base,
      endedAt: m.endedAt ?? new Date(0).toISOString(),
      result: m.winnerId === me ? 'victory' : 'defeat',
      placement: p.placement ?? m.participants.length,
      rounds: m.round,
    },
    citiesCaptured: p.citiesCaptured ?? 0,
    unitsBuilt: p.unitsBuilt ?? 0,
  }
}

/** Newest first; same end time: by id, so the cursor is unambiguous */
const newestFirst = (a: HistoryEntry, b: HistoryEntry) =>
  b.endedAt.localeCompare(a.endedAt) || b.id.localeCompare(a.id)

const encodeCursor = (e: HistoryEntry) =>
  Buffer.from(JSON.stringify([e.endedAt, e.id])).toString('base64url')

function decodeCursor(cursor: string): [string, string] | null {
  try {
    const v: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (Array.isArray(v) && typeof v[0] === 'string' && typeof v[1] === 'string')
      return [v[0], v[1]]
  } catch {
    // invalid cursor
  }
  return null
}

export interface ProfileServiceOptions {
  lobby: LobbyService
  mail: Mailer | null
  uploadsDir?: string
  log?: (msg: string, err: unknown) => void
}

export function createProfileService(
  db: Db,
  { lobby, mail, uploadsDir = defaultUploadsDir(), log }: ProfileServiceOptions,
) {
  const avatarDir = path.join(uploadsDir, 'avatars')
  /** Notices (address or password changed) must not fail the action */
  const notify = (what: string, send: Promise<void>) =>
    send.catch((err: unknown) => log?.(`Hinweis-Mail „${what}“ fehlgeschlagen`, err))

  async function loadPlayer(id: string) {
    const [p] = await db.select().from(players).where(eq(players.id, id))
    if (!p) throw new ProfileError(404, 'PLAYER_NOT_FOUND', { key: 'errors.playerNotFound' })
    return p
  }

  /**
   * All matches the player finished or surrendered. Only the parts of the stored state needed
   * here are read (not the map), straight from the jsonb column.
   */
  async function playedMatches(me: string): Promise<Played[]> {
    const rows = await db
      .select({
        id: matches.id,
        name: matches.name,
        status: matches.status,
        round: matches.round,
        participants: sql<ParticipantState[]>`${matches.state}->'participants'`,
        winnerId: sql<string | null>`${matches.state}->>'winnerId'`,
        endedAt: sql<string | null>`${matches.state}->>'endedAt'`,
        participantId: matchSeats.participantId,
      })
      .from(matchSeats)
      .innerJoin(matches, eq(matches.id, matchSeats.matchId))
      .where(
        and(
          eq(matchSeats.playerId, me),
          ne(matches.status, 'waiting'),
          notLike(matches.id, TUTORIAL_LIKE),
        ),
      )
    const played: Played[] = []
    for (const r of rows) {
      if (!r.participants || r.status === 'waiting') continue
      const p = playedMatch(
        {
          id: r.id,
          name: r.name,
          status: r.status,
          round: r.round,
          endedAt: r.endedAt,
          winnerId: r.winnerId,
          participants: r.participants,
        },
        r.participantId ?? me,
      )
      if (p) played.push(p)
    }
    return played
  }

  async function getProfile(
    me: string,
    { limit = HISTORY_PAGE_SIZE, cursor }: { limit?: number; cursor?: string | null } = {},
  ): Promise<ProfileData> {
    const player = await loadPlayer(me)
    const played = await playedMatches(me)
    const history = played.map((p) => p.entry).sort(newestFirst)

    const factionStats: FactionStat[] = LOBBY_FACTIONS.map((f) => {
      const games = history.filter((e) => e.factionId === f.id)
      return {
        factionId: f.id,
        gamesPlayed: games.length,
        wins: games.filter((e) => e.result === 'victory').length,
      }
    })
    // Most played faction; a tie goes to more wins, then to the order of the compendium
    const favorite = [...factionStats]
      .filter((s) => s.gamesPlayed > 0)
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed || b.wins - a.wins)[0]

    let start = 0
    if (cursor) {
      const after = decodeCursor(cursor)
      if (!after) throw new ProfileError(422, 'INVALID_CURSOR', { key: 'errors.invalidCursor' })
      const [endedAt, id] = after
      start = history.findIndex((e) => newestFirst(e, { endedAt, id } as HistoryEntry) > 0)
      if (start < 0) start = history.length
    }
    const size = Math.min(Math.max(1, Math.floor(limit) || HISTORY_PAGE_SIZE), HISTORY_PAGE_MAX)
    const page = history.slice(start, start + size)
    const hasMore = start + size < history.length

    return {
      profile: {
        id: player.id,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        memberSince: player.createdAt.toISOString(),
        favoriteFactionId: favorite?.factionId ?? null,
      },
      stats: {
        gamesPlayed: history.length,
        wins: history.filter((e) => e.result === 'victory').length,
        citiesCaptured: played.reduce((n, p) => n + p.citiesCaptured, 0),
        unitsBuilt: played.reduce((n, p) => n + p.unitsBuilt, 0),
        longestGameRounds: history.reduce((n, e) => Math.max(n, e.rounds), 0),
      },
      factionStats,
      history: page,
      hasMoreHistory: hasMore,
      nextCursor: hasMore ? encodeCursor(page[page.length - 1]!) : null,
      factions: LOBBY_FACTIONS,
    }
  }

  // ===========================================================================
  // Name und Avatar
  // ===========================================================================

  async function updateDisplayName(me: string, input: string) {
    const error = validateDisplayName(input)
    if (error) throw new ProfileError(422, 'INVALID_INPUT', error)
    const displayName = input.trim()
    // Unique without case; the player may change the case of the own name
    const [other] = await db
      .select({ id: players.id })
      .from(players)
      .where(and(sql`lower(${players.displayName}) = lower(${displayName})`, ne(players.id, me)))
    if (other) throw nameTaken()
    try {
      await db.update(players).set({ displayName }).where(eq(players.id, me))
    } catch (err) {
      if (isUniqueViolation(err, 'players_display_name_unique')) throw nameTaken()
      throw err
    }
    return loadPlayer(me)
  }

  /** Delete an uploaded avatar file (ignored for other URLs or when it is already gone) */
  async function deleteAvatarFile(url: string | null) {
    if (!url?.startsWith(AVATAR_PATH)) return
    const name = path.basename(url)
    await unlink(path.join(avatarDir, name)).catch(() => undefined)
  }

  const unsupportedImage = () =>
    new ProfileError(
      415,
      'UNSUPPORTED_IMAGE',
      { key: 'errors.imageFormat' },
    )

  /** Write a rendered avatar under a new name (cache busting) and return its public URL */
  async function storeAvatar(me: string, webp: Buffer) {
    await mkdir(avatarDir, { recursive: true })
    const file = `${me}-${randomBytes(6).toString('hex')}.webp`
    await writeFile(path.join(avatarDir, file), webp)
    return `${AVATAR_PATH}${file}`
  }

  /**
   * Store a new avatar: cut to the square (the centre without a crop), scaled to 256×256 WebP.
   * The file name changes with every upload (cache busting); the old file is deleted afterwards.
   */
  async function setAvatar(me: string, data: Buffer, crop?: AvatarCrop) {
    if (!sniffImage(data)) throw unsupportedImage()
    let webp: Buffer
    try {
      webp = await renderAvatar(data, crop)
    } catch (err) {
      if (err instanceof AvatarImageError && err.kind === 'invalidCrop')
        throw new ProfileError(422, 'INVALID_CROP', { key: 'errors.invalidCrop' })
      if (err instanceof AvatarImageError) throw unsupportedImage()
      throw err
    }
    const player = await loadPlayer(me)
    const avatarUrl = await storeAvatar(me, webp)
    await db.update(players).set({ avatarUrl }).where(eq(players.id, me))
    await deleteAvatarFile(player.avatarUrl)
    return loadPlayer(me)
  }

  /**
   * Runs once at server start: converts avatars from before the WebP conversion (centred square)
   * and deletes files no account points to. Fresh files (younger than `graceMs`) are left alone,
   * they may belong to an upload in progress.
   */
  async function maintainAvatars(now = new Date(), graceMs = 60 * 60 * 1000) {
    let converted = 0
    let cleared = 0
    let deleted = 0
    const rows = await db
      .select({ id: players.id, avatarUrl: players.avatarUrl })
      .from(players)
      .where(sql`${players.avatarUrl} like ${AVATAR_PATH + '%'}`)
    for (const row of rows) {
      const url = row.avatarUrl!
      if (url.endsWith('.webp')) continue
      let data: Buffer
      try {
        data = await readFile(path.join(avatarDir, path.basename(url)))
      } catch {
        // The file is gone: show the initials instead of a broken image
        await db.update(players).set({ avatarUrl: null }).where(eq(players.id, row.id))
        cleared++
        continue
      }
      try {
        const avatarUrl = await storeAvatar(row.id, await renderAvatar(data))
        await db.update(players).set({ avatarUrl }).where(eq(players.id, row.id))
        await deleteAvatarFile(url)
        converted++
      } catch (err) {
        log?.(`Avatar ${url} konnte nicht umgerechnet werden`, err)
      }
    }
    const [refs, files] = await Promise.all([
      db
        .select({ avatarUrl: players.avatarUrl })
        .from(players)
        .where(sql`${players.avatarUrl} like ${AVATAR_PATH + '%'}`),
      readdir(avatarDir).catch(() => [] as string[]),
    ])
    const used = new Set(refs.map((r) => path.basename(r.avatarUrl!)))
    for (const name of files) {
      if (used.has(name)) continue
      const file = path.join(avatarDir, name)
      const info = await stat(file).catch(() => null)
      if (!info?.isFile() || now.getTime() - info.mtimeMs < graceMs) continue
      await unlink(file).catch(() => undefined)
      deleted++
    }
    return { converted, cleared, deleted }
  }

  async function removeAvatar(me: string) {
    const player = await loadPlayer(me)
    await db.update(players).set({ avatarUrl: null }).where(eq(players.id, me))
    await deleteAvatarFile(player.avatarUrl)
    return loadPlayer(me)
  }

  // ===========================================================================
  // Einstellungen
  // ===========================================================================

  async function activeSessions(me: string, now = new Date()) {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          eq(sessions.playerId, me),
          gt(sessions.lastUsedAt, new Date(now.getTime() - SESSION_TTL_MS)),
        ),
      )
    return row?.n ?? 0
  }

  async function getSettings(me: string): Promise<SettingsData> {
    const player = await loadPlayer(me)
    return {
      settings: settingsOf(player.settings),
      account: {
        email: player.email,
        emailVerified: player.emailVerifiedAt !== null,
        activeSessions: await activeSessions(me),
      },
      displayName: player.displayName,
    }
  }

  /** The caller has validated the settings (`validateSettings`) */
  async function saveSettings(me: string, settings: Settings) {
    await db
      .update(players)
      .set({ settings: settings as unknown as Record<string, unknown> })
      .where(eq(players.id, me))
    return getSettings(me)
  }

  // ===========================================================================
  // Konto: E-Mail, Passwort, Löschen
  // ===========================================================================

  async function checkPassword(player: Player, password: string) {
    if (!password || !(await verifyPassword(password, player.passwordHash))) throw wrongPassword()
  }

  /**
   * Request an e-mail change: checks the password and sends a confirmation link to the new
   * address. The address changes only when the link is opened.
   */
  async function requestEmailChange(
    me: string,
    input: { email: string; currentPassword: string },
    origin: string,
    now = new Date(),
  ) {
    const invalid = validateEmail(input.email)
    if (invalid) throw new ProfileError(422, 'INVALID_INPUT', invalid)
    const player = await loadPlayer(me)
    await checkPassword(player, input.currentPassword)
    const email = normalizeEmail(input.email)
    if (email === player.email)
      throw new ProfileError(422, 'SAME_EMAIL', { key: 'errors.sameEmail' })
    const [taken] = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.email, email))
    if (taken) throw emailTaken()
    if (!mail)
      throw new ProfileError(
        503,
        'MAIL_UNAVAILABLE',
        { key: 'errors.mailUnavailable' },
      )
    const token = await issueToken(db, {
      playerId: me,
      purpose: 'change_email',
      email,
      ttlMs: EMAIL_VERIFY_TTL_HOURS * 3600_000,
      now,
    })
    await sendEmailChangeConfirmation(
      mail,
      origin,
      { displayName: player.displayName, email },
      token,
    )
    return { ok: true as const, pendingEmail: email }
  }

  /**
   * Apply an e-mail change from the link; returns the result for the redirect. The new address
   * counts as verified, the old one gets a notice.
   */
  async function confirmEmailChange(
    token: string,
    origin: string,
    now = new Date(),
  ): Promise<'confirmed' | 'invalid' | 'taken'> {
    const change = await consumeToken(db, token, 'change_email', now)
    if (!change) return 'invalid'
    const [player] = await db.select().from(players).where(eq(players.id, change.playerId))
    if (!player) return 'invalid'
    try {
      await db
        .update(players)
        .set({ email: change.email, emailVerifiedAt: now })
        .where(eq(players.id, change.playerId))
    } catch (err) {
      if (isUniqueViolation(err, 'players_email_unique')) return 'taken'
      throw err
    }
    if (mail) void notify('E-Mail geändert', sendEmailChanged(mail, origin, player, change.email))
    return 'confirmed'
  }

  /**
   * Change the password. The current session stays logged in, all other sessions (devices)
   * are ended, since a password change usually means another device should lose access.
   */
  async function changePassword(
    me: string,
    sessionId: string,
    input: { currentPassword: string; newPassword: string },
    origin: string,
  ) {
    const player = await loadPlayer(me)
    const invalid = validatePassword(input.newPassword)
    if (invalid)
      throw new ProfileError(
        422,
        'INVALID_INPUT',
        {
          ...invalid,
          key:
            invalid.key === 'account.passwordShort'
              ? 'account.newPasswordShort'
              : 'account.newPasswordLong',
        },
      )
    await checkPassword(player, input.currentPassword)
    const passwordHash = await hashPassword(input.newPassword)
    await db.update(players).set({ passwordHash }).where(eq(players.id, me))
    await db.delete(sessions).where(and(eq(sessions.playerId, me), ne(sessions.id, sessionId)))
    if (mail) void notify('Passwort geändert', sendPasswordChanged(mail, origin, player))
    return { ok: true as const, activeSessions: await activeSessions(me) }
  }

  /**
   * Delete the account: running matches go to an AI (Normal) like after surrendering, waiting
   * matches are left (hosted ones dissolved, invitations declined). Then the player row is
   * deleted; sessions, friendships, invitations, reminders, push subscriptions, notifications
   * and pending e-mail changes go with it (foreign keys with cascade), seats keep the
   * participant without a player. Finished matches keep the names in their stored state; the
   * player's statistics and history are derived from those matches and disappear with the
   * account.
   */
  async function deleteAccount(me: string, currentPassword: string, now = new Date()) {
    const player = await loadPlayer(me)
    await checkPassword(player, currentPassword)
    const seats = await db
      .select({ matchId: matchSeats.matchId, status: matches.status })
      .from(matchSeats)
      .innerJoin(matches, eq(matches.id, matchSeats.matchId))
      .where(eq(matchSeats.playerId, me))
    const hosted = await db
      .select({ matchId: matches.id, status: matches.status })
      .from(matches)
      .where(and(eq(matches.hostId, me), eq(matches.status, 'waiting')))
    // The tutorial goes with the account; nobody would take it over
    await db.delete(matches).where(eq(matches.id, tutorialMatchId(me)))
    let tookOver = 0
    for (const s of seats.filter((x) => x.status === 'running' && !isTutorialMatchId(x.matchId)))
      if (await lobby.takeOver(s.matchId, me, now)) tookOver++
    const waiting = new Set(
      [...seats, ...hosted].filter((x) => x.status === 'waiting').map((x) => x.matchId),
    )
    for (const matchId of waiting) {
      try {
        await lobby.leave(matchId, { id: me, displayName: player.displayName }, now)
      } catch {
        // started or dissolved in the meantime: nothing left to leave
      }
    }
    await db.delete(players).where(eq(players.id, me))
    await deleteAvatarFile(player.avatarUrl)
    return { ok: true as const, matchesTakenOver: tookOver, matchesLeft: waiting.size }
  }

  return {
    getProfile,
    updateDisplayName,
    setAvatar,
    removeAvatar,
    maintainAvatars,
    getSettings,
    saveSettings,
    requestEmailChange,
    confirmEmailChange,
    changePassword,
    deleteAccount,
    avatarDir,
    uploadsDir,
  }
}

export type ProfileService = ReturnType<typeof createProfileService>
