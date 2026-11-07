import { randomUUID } from 'node:crypto'
import { DEFAULT_LOCALE, isLocale, translate, type Locale } from '@dos/shared/i18n'
import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import { currentParticipant, normalizeState } from '@dos/shared/engine'
import {
  type NotificationEvent,
  notificationSettingsOf,
  type PushPayload,
} from '@dos/shared/notifications'
import { ONLINE_WINDOW_MS } from '../auth/presence'
import type { Db } from '../db/client'
import {
  invitations,
  matches,
  type NotificationKind,
  notifications,
  players,
  pushSubscriptions,
} from '../db/schema'
import type { Tx } from '../matches/repository'
import type { Mailer, PushSender } from './channels'
import { renderMail } from './mail'

const HOUR = 3600_000

/** Setting (event) that decides the channels of each kind */
export const EVENT_OF: Record<NotificationKind, NotificationEvent> = {
  yourTurn: 'yourTurn',
  remind: 'yourTurn',
  matchStarted: 'yourTurn',
  deadlineSoon: 'deadlineSoon',
  invitation: 'invitation',
  matchEnded: 'matchEnded',
  matchCancelled: 'matchEnded',
}

/** Kinds that are about a turn: void once the player is no longer on the move */
const TURN_KINDS = new Set<NotificationKind>(['yourTurn', 'remind', 'deadlineSoon'])

/** A text, or a function giving it in the recipient's language */
export type Localizable = string | ((locale: Locale) => string)

const inLocale = (text: Localizable, locale: Locale) =>
  typeof text === 'string' ? text : text(locale)

export interface NotificationInput {
  playerId: string
  kind: NotificationKind
  matchId?: string | null
  /** Round of the turn (turn kinds) */
  round?: number | null
  /** Fixed text or rendered in the recipient's language when the notification is stored */
  title: Localizable
  body: Localizable
  /** Path within the app */
  url: string
  /** Same key → only one notification (e.g. deadlineSoon once per turn) */
  dedupeKey?: string
  /** false: push only (live matches, where a late e-mail is of no use) */
  email?: boolean
}

export interface NotifierOptions {
  push?: PushSender | null
  mail?: Mailer | null
  /** Origin for links in e-mails */
  publicUrl: () => string
  /** Deliver push and due e-mails right after the transaction (off in tests) */
  autoDeliver?: boolean
  log?: (msg: string, err?: unknown) => void
}

type Row = typeof notifications.$inferSelect

/** Plain text and simple HTML for a notification e-mail */
export function mailFor(
  n: Pick<Row, 'title' | 'body' | 'url'>,
  name: string,
  origin: string,
  locale: Locale = DEFAULT_LOCALE,
) {
  return renderMail({
    title: n.title,
    name,
    body: [n.body],
    cta: { label: translate(locale, 'mail.toMatch'), url: `${origin}${n.url}` },
    footer: translate(locale, 'mail.notificationFooter'),
    locale,
  })
}

export function createNotifier(db: Db, opts: NotifierOptions) {
  const log = opts.log ?? ((msg, err) => console.error(msg, err))
  let running: Promise<void> | null = null
  let again = false

  /**
   * Store notifications inside the caller's transaction; the channels follow the player's
   * settings at this moment. Players without an account (old dev participants) are skipped.
   */
  async function enqueue(tx: Tx | Db, items: NotificationInput[], now = new Date()) {
    if (!items.length) return
    const ids = [...new Set(items.map((i) => i.playerId))]
    const known = new Map(
      (
        await tx
          .select({ id: players.id, settings: players.settings, locale: players.locale })
          .from(players)
          .where(inArray(players.id, ids))
      ).map((p) => [
        p.id,
        {
          ...notificationSettingsOf(p.settings),
          locale: isLocale(p.locale) ? p.locale : DEFAULT_LOCALE,
        },
      ]),
    )
    const rows = items.flatMap((i) => {
      const settings = known.get(i.playerId)
      if (!settings) return []
      const channel = settings[EVENT_OF[i.kind]]
      const email = channel.email && i.email !== false && !!opts.mail
      return [
        {
          id: randomUUID(),
          playerId: i.playerId,
          event: EVENT_OF[i.kind],
          kind: i.kind,
          matchId: i.matchId ?? null,
          round: i.round ?? null,
          title: inLocale(i.title, settings.locale),
          body: inLocale(i.body, settings.locale),
          url: i.url,
          dedupeKey: i.dedupeKey ?? null,
          pushStatus: channel.push ? ('pending' as const) : ('skipped' as const),
          emailStatus: email ? ('pending' as const) : ('skipped' as const),
          emailDueAt: email ? new Date(now.getTime() + settings.emailDelayHours * HOUR) : null,
          createdAt: now,
        },
      ]
    })
    if (rows.length) await tx.insert(notifications).values(rows).onConflictDoNothing()
  }

  /** Send pending push messages to all subscriptions of the players */
  async function deliverPush() {
    const claimed = await db
      .update(notifications)
      .set({ pushStatus: 'sent' })
      .where(
        sql`${notifications.id} in (select id from ${notifications} where ${notifications.pushStatus} = 'pending' order by ${notifications.createdAt} limit 200 for update skip locked)`,
      )
      .returning()
    if (!claimed.length) return
    if (!opts.push) return
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        inArray(
          pushSubscriptions.playerId,
          claimed.map((n) => n.playerId),
        ),
      )
    for (const n of claimed) {
      const payload: PushPayload = {
        title: n.title,
        body: n.body,
        url: n.url,
        tag: n.matchId ? `match-${n.matchId}` : n.kind,
      }
      for (const sub of subs.filter((s) => s.playerId === n.playerId)) {
        try {
          await opts.push(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          )
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode
          // Subscription expired or revoked by the browser
          if (status === 404 || status === 410)
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
          else log(`Push an ${n.playerId} fehlgeschlagen`, err)
        }
      }
    }
  }

  /** Turn notifications only while the player is on that turn, invitations while pending */
  async function stillRelevant(n: Row) {
    if (!n.matchId) return true
    if (n.kind === 'invitation') {
      const [inv] = await db
        .select({ status: invitations.status })
        .from(invitations)
        .where(and(eq(invitations.matchId, n.matchId), eq(invitations.playerId, n.playerId)))
      return inv?.status === 'pending'
    }
    if (!TURN_KINDS.has(n.kind)) return true
    const [m] = await db.select().from(matches).where(eq(matches.id, n.matchId))
    if (!m?.state || m.status !== 'running') return false
    const state = normalizeState(m.state)
    return currentParticipant(state).id === n.playerId && state.round === n.round
  }

  /**
   * Send due e-mails. An e-mail goes out only while the player has been offline for their
   * `emailDelayHours` (and at least the online window); it is cancelled when the player has
   * been active since the notification, the turn is over, or e-mails were switched off.
   */
  async function deliverEmail(now = new Date()) {
    if (!opts.mail) return
    await db.transaction(async (tx) => {
      const due = await tx
        .select()
        .from(notifications)
        .where(and(eq(notifications.emailStatus, 'pending'), lte(notifications.emailDueAt, now)))
        .orderBy(notifications.createdAt)
        .limit(100)
        .for('update', { skipLocked: true })
      for (const n of due) {
        const [p] = await tx.select().from(players).where(eq(players.id, n.playerId))
        const settings = notificationSettingsOf(p?.settings)
        const set = (values: Partial<Row>) =>
          tx.update(notifications).set(values).where(eq(notifications.id, n.id))
        // No e-mails to unverified addresses (typos, strangers' addresses)
        if (!p || !p.emailVerifiedAt || !settings[n.event].email) {
          await set({ emailStatus: 'cancelled' })
          continue
        }
        if ((p.lastSeenAt && p.lastSeenAt > n.createdAt) || !(await stillRelevant(n))) {
          await set({ emailStatus: 'cancelled' })
          continue
        }
        const offlineSince = p.lastSeenAt?.getTime() ?? 0
        const needed = Math.max(settings.emailDelayHours * HOUR, ONLINE_WINDOW_MS)
        if (now.getTime() - offlineSince < needed) {
          await set({ emailDueAt: new Date(offlineSince + needed) })
          continue
        }
        try {
          await opts.mail!({ to: p.email, ...mailFor(n, p.displayName, opts.publicUrl(), isLocale(p.locale) ? p.locale : DEFAULT_LOCALE) })
          await set({ emailStatus: 'sent', emailSentAt: now })
        } catch (err) {
          log(`E-Mail an ${p.email} fehlgeschlagen`, err)
          await set({ emailStatus: 'failed' })
        }
      }
    })
  }

  async function deliver(now = new Date()) {
    await deliverPush()
    await deliverEmail(now)
  }

  /** Deliver in the background after a transaction committed (coalesces concurrent calls) */
  function kick() {
    if (!opts.autoDeliver) return
    if (running) {
      again = true
      return
    }
    running = (async () => {
      do {
        again = false
        await deliver().catch((err) =>
          log('Benachrichtigungen konnten nicht zugestellt werden', err),
        )
      } while (again)
      running = null
    })()
  }

  return { enqueue, deliver, deliverPush, deliverEmail, kick, hasMail: !!opts.mail }
}

export type Notifier = ReturnType<typeof createNotifier>
