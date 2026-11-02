import { randomUUID } from 'node:crypto'
import { eq, lt, sql } from 'drizzle-orm'
import type { Friend, Me } from '@dos/shared/account'
import {
  ACCOUNT_MAIL_COOLDOWN_MINUTES,
  EMAIL_VERIFY_TTL_HOURS,
  normalizeEmail,
  PASSWORD_RESET_TTL_MINUTES,
} from '@dos/shared/account'
import type { Db } from '../db/client'
import { friendships, players, sessions } from '../db/schema'
import type { Mailer } from '../notifications/channels'
import { sendPasswordChanged, sendPasswordReset, sendVerification } from './accountMails'
import { hashPassword, verifyPassword } from './password'
import { presenceOf } from './presence'
import { consumeToken, hashToken, issueToken, newToken, recentlyIssued } from './tokens'
import { isAdminEmail } from '../admin/access'

/** Sessions expire after 30 days without use */
export const SESSION_TTL_MS = 30 * 24 * 3600_000
/** last_seen_at and last_used_at are written at most once per minute */
export const TOUCH_INTERVAL_MS = 60_000

export type Player = typeof players.$inferSelect

export class AccountError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export const toMe = (p: Player): Me => ({
  id: p.id,
  name: p.displayName,
  avatarUrl: p.avatarUrl,
  email: p.email,
  emailVerified: p.emailVerifiedAt !== null,
  isAdmin: isAdminEmail(p.email),
})

export const mailUnavailable = () =>
  new AccountError(
    503,
    'MAIL_UNAVAILABLE',
    'E-Mails können gerade nicht verschickt werden. Versuche es später noch einmal.',
  )

const COOLDOWN_MS = ACCOUNT_MAIL_COOLDOWN_MINUTES * 60_000

function toFriend(p: Player, now: Date): Friend {
  return { id: p.id, name: p.displayName, avatarUrl: p.avatarUrl, ...presenceOf(p, now) }
}

const isUniqueViolation = (err: unknown, constraint: string) => {
  const e = (err as { cause?: unknown })?.cause ?? err
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as { code?: string }).code === '23505' &&
    (e as { constraint_name?: string }).constraint_name === constraint
  )
}

export interface SessionInfo {
  sessionId: string
  player: Player
  lastUsedAt: Date
}

export interface AccountServiceOptions {
  /** Sends verification and reset links; null when SMTP_URL is not set */
  mail?: Mailer | null
  log?: (msg: string, err: unknown) => void
}

export function createAccountService(db: Db, { mail = null, log }: AccountServiceOptions = {}) {
  /** Notices (password changed) must not fail the action */
  const notify = (what: string, send: Promise<void>) =>
    send.catch((err: unknown) => log?.(`Hinweis-Mail „${what}“ fehlgeschlagen`, err))

  async function nameTaken(displayName: string) {
    const [row] = await db
      .select({ id: players.id })
      .from(players)
      .where(sql`lower(${players.displayName}) = lower(${displayName})`)
    return !!row
  }

  async function emailTaken(email: string) {
    const [row] = await db.select({ id: players.id }).from(players).where(eq(players.email, email))
    return !!row
  }

  /** Create a player; the caller has validated the input */
  async function register(input: {
    displayName: string
    email: string
    password: string
    lastSeenAt?: Date | null
    /** Dev accounts and tests skip the verification */
    emailVerifiedAt?: Date | null
  }) {
    const displayName = input.displayName.trim()
    const email = normalizeEmail(input.email)
    if (await emailTaken(email))
      throw new AccountError(409, 'EMAIL_TAKEN', 'Diese E-Mail-Adresse ist bereits registriert.')
    if (await nameTaken(displayName))
      throw new AccountError(409, 'NAME_TAKEN', 'Dieser Name ist bereits vergeben.')
    const passwordHash = await hashPassword(input.password)
    try {
      const [player] = await db
        .insert(players)
        .values({
          id: randomUUID(),
          displayName,
          email,
          passwordHash,
          lastSeenAt: input.lastSeenAt ?? null,
          emailVerifiedAt: input.emailVerifiedAt ?? null,
        })
        .returning()
      return player!
    } catch (err) {
      // Race between the check above and the insert
      if (isUniqueViolation(err, 'players_email_unique'))
        throw new AccountError(409, 'EMAIL_TAKEN', 'Diese E-Mail-Adresse ist bereits registriert.')
      if (isUniqueViolation(err, 'players_display_name_unique'))
        throw new AccountError(409, 'NAME_TAKEN', 'Dieser Name ist bereits vergeben.')
      throw err
    }
  }

  async function login(email: string, password: string) {
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.email, normalizeEmail(email)))
    // Same message for unknown email and wrong password
    if (!player || !(await verifyPassword(password, player.passwordHash)))
      throw new AccountError(401, 'INVALID_CREDENTIALS', 'E-Mail-Adresse oder Passwort ist falsch.')
    return player
  }

  /** New session; returns the token for the cookie (only its hash is stored) */
  async function createSession(playerId: string, userAgent: string | undefined) {
    const token = newToken()
    await db
      .insert(sessions)
      .values({ id: hashToken(token), playerId, userAgent: userAgent?.slice(0, 500) ?? null })
    return token
  }

  async function findSession(token: string, now = new Date()): Promise<SessionInfo | null> {
    const [row] = await db
      .select()
      .from(sessions)
      .innerJoin(players, eq(players.id, sessions.playerId))
      .where(eq(sessions.id, hashToken(token)))
    if (!row) return null
    if (now.getTime() - row.sessions.lastUsedAt.getTime() > SESSION_TTL_MS) {
      await db.delete(sessions).where(eq(sessions.id, row.sessions.id))
      return null
    }
    return { sessionId: row.sessions.id, player: row.players, lastUsedAt: row.sessions.lastUsedAt }
  }

  /**
   * Record activity, throttled: at most once per minute, except when a match request
   * changes the match the player is in (presence "inGame").
   */
  async function touch(info: SessionInfo, matchId: string | null, now = new Date()) {
    const { player } = info
    const due =
      !player.lastSeenAt || now.getTime() - player.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS
    const enteredMatch = matchId !== null && matchId !== player.lastSeenMatchId
    if (due || enteredMatch) {
      await db
        .update(players)
        .set({ lastSeenAt: now, lastSeenMatchId: matchId })
        .where(eq(players.id, player.id))
      player.lastSeenAt = now
      player.lastSeenMatchId = matchId
    }
    const sessionDue = now.getTime() - info.lastUsedAt.getTime() >= TOUCH_INTERVAL_MS
    if (sessionDue) {
      await db.update(sessions).set({ lastUsedAt: now }).where(eq(sessions.id, info.sessionId))
      info.lastUsedAt = now
    }
    return sessionDue
  }

  async function deleteSession(sessionId: string) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  async function deleteAllSessions(playerId: string) {
    await db.delete(sessions).where(eq(sessions.playerId, playerId))
  }

  async function deleteExpiredSessions(now = new Date()) {
    await db
      .delete(sessions)
      .where(lt(sessions.lastUsedAt, new Date(now.getTime() - SESSION_TTL_MS)))
  }

  // ---------------------------------------------------------------------------
  // E-Mail-Bestätigung und Passwort vergessen
  // ---------------------------------------------------------------------------

  /** Send the verification link after registration; silently nothing without a mailer */
  async function sendVerificationMail(player: Player, origin: string, now = new Date()) {
    if (!mail) return false
    const token = await issueToken(db, {
      playerId: player.id,
      purpose: 'verify_email',
      email: player.email,
      ttlMs: EMAIL_VERIFY_TTL_HOURS * 3600_000,
      now,
    })
    await sendVerification(mail, origin, player, token)
    return true
  }

  /** „Erneut senden“: at most one verification mail per cooldown */
  async function resendVerification(playerId: string, origin: string, now = new Date()) {
    const [player] = await db.select().from(players).where(eq(players.id, playerId))
    if (!player) throw new AccountError(404, 'PLAYER_NOT_FOUND', 'Konto nicht gefunden.')
    if (player.emailVerifiedAt) return { ok: true as const, alreadyVerified: true }
    if (!mail) throw mailUnavailable()
    if (await recentlyIssued(db, playerId, 'verify_email', COOLDOWN_MS, now))
      throw new AccountError(
        429,
        'RESEND_COOLDOWN',
        'Wir haben dir gerade erst eine E-Mail geschickt. Warte kurz und sieh auch im Spam-Ordner nach.',
      )
    await sendVerificationMail(player, origin, now)
    return { ok: true as const, alreadyVerified: false }
  }

  /** Link from the verification mail; false when unknown, expired or for an old address */
  async function verifyEmail(token: string, now = new Date()) {
    const t = await consumeToken(db, token, 'verify_email', now)
    if (!t) return false
    const [player] = await db.select().from(players).where(eq(players.id, t.playerId))
    if (!player || player.email !== t.email) return false
    if (!player.emailVerifiedAt)
      await db.update(players).set({ emailVerifiedAt: now }).where(eq(players.id, player.id))
    return true
  }

  /**
   * „Passwort vergessen“: sends a reset link when the address belongs to a player. The caller
   * answers the same way either way, so the request does not tell whether an account exists.
   */
  async function requestPasswordReset(email: string, origin: string, now = new Date()) {
    if (!mail) throw mailUnavailable()
    const player = await findByEmail(email)
    if (!player) return
    if (await recentlyIssued(db, player.id, 'reset_password', COOLDOWN_MS, now)) return
    const token = await issueToken(db, {
      playerId: player.id,
      purpose: 'reset_password',
      email: player.email,
      ttlMs: PASSWORD_RESET_TTL_MINUTES * 60_000,
      now,
    })
    await sendPasswordReset(mail, origin, player, token)
  }

  /**
   * Set a new password from a reset link: all sessions end, the address counts as verified
   * (the player just proved to read it). Returns the player for the new session.
   */
  async function resetPassword(token: string, password: string, origin: string, now = new Date()) {
    const t = await consumeToken(db, token, 'reset_password', now)
    const invalid = () =>
      new AccountError(
        422,
        'INVALID_TOKEN',
        'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.',
      )
    if (!t) throw invalid()
    const [player] = await db.select().from(players).where(eq(players.id, t.playerId))
    if (!player) throw invalid()
    const passwordHash = await hashPassword(password)
    const verified = player.emailVerifiedAt ?? (player.email === t.email ? now : null)
    await db.transaction(async (tx) => {
      await tx
        .update(players)
        .set({ passwordHash, emailVerifiedAt: verified })
        .where(eq(players.id, player.id))
      await tx.delete(sessions).where(eq(sessions.playerId, player.id))
    })
    if (mail) void notify('Passwort geändert', sendPasswordChanged(mail, origin, player))
    return { ...player, passwordHash, emailVerifiedAt: verified }
  }

  /** Notice after a password change in the settings */
  function notifyPasswordChanged(player: Player, origin: string) {
    if (mail) void notify('Passwort geändert', sendPasswordChanged(mail, origin, player))
  }

  async function findByEmail(email: string) {
    const [p] = await db
      .select()
      .from(players)
      .where(eq(players.email, normalizeEmail(email)))
    return p ?? null
  }

  async function findByName(name: string) {
    const [p] = await db
      .select()
      .from(players)
      .where(sql`lower(${players.displayName}) = lower(${name.trim()})`)
    return p ?? null
  }

  async function listFriends(playerId: string, now = new Date()): Promise<Friend[]> {
    const rows = await db
      .select({ friend: players })
      .from(friendships)
      .innerJoin(players, eq(players.id, friendships.friendId))
      .where(eq(friendships.playerId, playerId))
      .orderBy(players.displayName)
    return rows.map((r) => toFriend(r.friend, now))
  }

  /** Friendship in both directions; adding an existing friend is fine */
  async function addFriend(playerId: string, friendId: string) {
    await db
      .insert(friendships)
      .values([
        { playerId, friendId },
        { playerId: friendId, friendId: playerId },
      ])
      .onConflictDoNothing()
  }

  async function addFriendByName(playerId: string, name: string, now = new Date()) {
    const friend = await findByName(name)
    if (!friend)
      throw new AccountError(404, 'PLAYER_NOT_FOUND', 'Es gibt keinen Spieler mit diesem Namen.')
    if (friend.id === playerId)
      throw new AccountError(422, 'CANNOT_FRIEND_SELF', 'Du kannst dich nicht selbst hinzufügen.')
    await addFriend(playerId, friend.id)
    return toFriend(friend, now)
  }

  return {
    register,
    login,
    createSession,
    findSession,
    touch,
    deleteSession,
    deleteAllSessions,
    deleteExpiredSessions,
    sendVerificationMail,
    resendVerification,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    notifyPasswordChanged,
    hasMail: mail !== null,
    findByEmail,
    findByName,
    listFriends,
    addFriend,
    addFriendByName,
  }
}

export type AccountService = ReturnType<typeof createAccountService>
