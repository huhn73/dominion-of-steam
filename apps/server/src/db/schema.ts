import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { GameRules, GameState, LogEntry } from '@dos/shared/engine'
import type { NotificationEvent } from '@dos/shared/notifications'
import type { MapSettings, SeatKind } from '@dos/shared/setup'

/** Settings from the setup wizard that are needed to start a waiting match */
export interface MatchSetup {
  rules: GameRules
  map: MapSettings
  fillEmptyWithAI: boolean
}

/**
 * One row per match. Waiting matches (`status = 'waiting'`, round 0) have no `state` yet; it is
 * created when the match starts and then holds the full authoritative game state.
 */
export const matches = pgTable(
  'matches',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    mode: text('mode', { enum: ['live', 'async'] }).notNull(),
    status: text('status', { enum: ['waiting', 'running', 'finished'] }).notNull(),
    round: integer('round').notNull(),
    seed: text('seed').notNull(),
    turnDeadline: timestamp('turn_deadline', { withTimezone: true }),
    state: jsonb('state').$type<GameState>(),
    /** Player who created the match in the setup wizard (null for the demo) */
    hostId: text('host_id').references(() => players.id, { onDelete: 'set null' }),
    /** Rules, map settings and the fill rule from the wizard (null for the demo) */
    setup: jsonb('setup').$type<MatchSetup>(),
    /** Token of the invite link `/einladung/<token>` */
    inviteToken: text('invite_token'),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    /** An AI is on the move: the AI runner still has to play its turn (see `ai/runner.ts`) */
    aiPending: boolean('ai_pending').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('matches_invite_token_unique').on(t.inviteToken),
    index('matches_host_idx').on(t.hostId),
    index('matches_status_idx').on(t.status),
    index('matches_ai_pending_idx')
      .on(t.id)
      .where(sql`${t.aiPending}`),
  ],
)

/**
 * Seats of a match in seat order. While waiting: `player` (joined, with ready flag and faction),
 * `ai` (personality and difficulty), `friend` (invited friend, see `invitations`), `invite`
 * (free for whoever has the invite link), `open` (free for anyone from the lobby) and `empty`
 * (filled with AI at the start). Once the match runs only `player` and `ai` remain, and
 * `participant_id` links the seat to the participant in the game state.
 */
export const matchSeats = pgTable(
  'match_seats',
  {
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    seat: integer('seat').notNull(),
    kind: text('kind').$type<SeatKind>().notNull(),
    /** Joined player (`player`) or invited friend (`friend`) */
    playerId: text('player_id').references(() => players.id, { onDelete: 'set null' }),
    /** Participant id in the game state once the match runs (player id or `ai1`…) */
    participantId: text('participant_id'),
    factionId: text('faction_id'),
    aiPersonalityId: text('ai_personality_id'),
    aiDifficulty: text('ai_difficulty', { enum: ['easy', 'normal', 'hard'] }),
    ready: boolean('ready').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    /** Kind the seat had before a player joined; it returns to it when the player leaves */
    freeKind: text('free_kind').$type<SeatKind>(),
  },
  (t) => [
    primaryKey({ columns: [t.matchId, t.seat] }),
    index('match_seats_player_idx').on(t.playerId),
  ],
)

/** Invitations of friends to a waiting match (one per friend seat) */
export const invitations = pgTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    fromId: text('from_id').references(() => players.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['pending', 'accepted', 'declined'] })
      .notNull()
      .default('pending'),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('invitations_match_player_unique').on(t.matchId, t.playerId),
    index('invitations_player_idx').on(t.playerId, t.status),
  ],
)

/**
 * Match id and invite token reserved for the wizard of a player (one per player), so the
 * invite link can be shown before the match exists. Consumed when the match is created.
 */
export const setupReservations = pgTable(
  'setup_reservations',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    inviteToken: text('invite_token').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('setup_reservations_player_unique').on(t.playerId),
    uniqueIndex('setup_reservations_token_unique').on(t.inviteToken),
  ],
)

/** Completed turns with their actions (history and source for replays) */
export const turns = pgTable(
  'turns',
  {
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    round: integer('round').notNull(),
    participantId: text('participant_id').notNull(),
    actions: jsonb('actions').$type<LogEntry[]>().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.round, t.participantId] })],
)

/** Player accounts; the id is also the participant id in matches */
export const players = pgTable(
  'players',
  {
    id: text('id').primaryKey(),
    displayName: text('display_name').notNull(),
    /** Always stored lowercased */
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    /** Set when the player opened a verification link (registration, e-mail change, reset) */
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    avatarUrl: text('avatar_url'),
    /** Player settings (milestone 06) */
    settings: jsonb('settings').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    /** Match whose view or commands were requested last (for the presence "inGame") */
    lastSeenMatchId: text('last_seen_match_id'),
    /** The player won the tutorial match */
    tutorialCompletedAt: timestamp('tutorial_completed_at', { withTimezone: true }),
    /** The player declined the tutorial offer in the lobby („Später“) */
    tutorialDismissedAt: timestamp('tutorial_dismissed_at', { withTimezone: true }),
    /** Newest version whose news („Neuigkeiten“) the player has seen; null shows none */
    newsSeenVersion: text('news_seen_version'),
    /** Language of the game, e-mails and notifications ('de' | 'en') */
    locale: text('locale').notNull().default('de'),
  },
  (t) => [
    uniqueIndex('players_email_unique').on(t.email),
    uniqueIndex('players_display_name_unique').on(sql`lower(${t.displayName})`),
  ],
)

/** Login sessions; `id` is the SHA-256 hash of the token in the cookie */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
  },
  (t) => [index('sessions_player_idx').on(t.playerId)],
)

/** Friendships, stored in both directions */
export const friendships = pgTable(
  'friendships',
  {
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    friendId: text('friend_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.friendId] })],
)

/** Last reminder per match and reminding player (12-hour cooldown, `REMIND_COOLDOWN_HOURS`) */
export const reminders = pgTable(
  'reminders',
  {
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    /** Participant who was on the move and got reminded */
    targetId: text('target_id').notNull(),
    remindedAt: timestamp('reminded_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.playerId] })],
)

/** Web push subscriptions of a player's browsers (removed when the push service answers 404/410) */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('push_subscriptions_endpoint_unique').on(t.endpoint),
    index('push_subscriptions_player_idx').on(t.playerId),
  ],
)

/** Server-wide settings generated once, e.g. the VAPID keys for web push */
export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type NotificationKind = NotificationEvent | 'remind' | 'matchStarted' | 'matchCancelled'
export type DeliveryStatus = 'pending' | 'sent' | 'skipped' | 'cancelled' | 'failed'

/**
 * Notifications to players, also the outbox for push and e-mail. Push is sent right after the
 * transaction that created the row; e-mails wait until `email_due_at` (the player's
 * `emailDelayHours` offline) and are cancelled when the player came online or the turn is over.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    /** Setting that decides the channels (`remind`, `matchStarted` → yourTurn; `matchCancelled` → matchEnded) */
    event: text('event').$type<NotificationEvent>().notNull(),
    kind: text('kind').$type<NotificationKind>().notNull(),
    /** No foreign key: a dissolved match is deleted, its notification stays */
    matchId: text('match_id'),
    /** Round of the turn for yourTurn/deadlineSoon (stale once the turn is over) */
    round: integer('round'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** Path within the app, e.g. `/partie/<id>` */
    url: text('url').notNull(),
    /** Prevents sending the same notification twice (e.g. deadlineSoon once per turn) */
    dedupeKey: text('dedupe_key'),
    pushStatus: text('push_status').$type<DeliveryStatus>().notNull(),
    emailStatus: text('email_status').$type<DeliveryStatus>().notNull(),
    emailDueAt: timestamp('email_due_at', { withTimezone: true }),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('notifications_dedupe_unique').on(t.dedupeKey),
    index('notifications_push_idx').on(t.pushStatus),
    index('notifications_email_idx').on(t.emailStatus, t.emailDueAt),
    index('notifications_player_idx').on(t.playerId),
  ],
)

/** What a one-time link is for */
export const ACCOUNT_TOKEN_PURPOSES = ['verify_email', 'reset_password', 'change_email'] as const
export type AccountTokenPurpose = (typeof ACCOUNT_TOKEN_PURPOSES)[number]

/**
 * One-time links sent by e-mail: verification after registration, password reset and e-mail
 * change. `id` is the SHA-256 hash of the token in the link, `email` the address the link was
 * sent to (the new address for a change). One open token per player and purpose; a new
 * request replaces the older one.
 */
export const accountTokens = pgTable(
  'account_tokens',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    purpose: text('purpose').$type<AccountTokenPurpose>().notNull(),
    /** Lowercased */
    email: text('email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex('account_tokens_player_purpose_unique').on(t.playerId, t.purpose)],
)
