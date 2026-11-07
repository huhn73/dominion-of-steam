import { currentParticipant, type GameState } from '@dos/shared/engine'
import { DEADLINE_SOON_HOURS } from '@dos/shared/notifications'
import { formatDate, translate, type Locale, type MessageKey, type Params } from '@dos/shared/i18n'
import type { NotificationInput } from './service'

/** „Sa., 31. Okt., 11:00“ / „Sat 31 Oct, 11:00“ (German time unless TZ_DISPLAY says otherwise) */
export const formatDeadline = (locale: Locale, iso: string) =>
  formatDate(locale, iso, {
    timeZone: process.env.TZ_DISPLAY ?? 'Europe/Berlin',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** A text in the recipient's language, rendered when the notification is stored */
const text =
  (key: MessageKey, params: (locale: Locale) => Params = () => ({})) =>
  (locale: Locale) =>
    translate(locale, key, params(locale))

/** „ Frist: Sa., 31. Okt., 11:00.“ or nothing */
const deadlineOf = (state: GameState) => (locale: Locale) =>
  state.turnDeadline
    ? translate(locale, 'notify.deadline', { deadline: formatDeadline(locale, state.turnDeadline) })
    : ''

export const matchPath = (matchId: string) => `/partie/${matchId}`
export const roomPath = (matchId: string) => `/warteraum/${matchId}`
export const LOBBY_PATH = '/'

/** Key of a turn: one notification of a kind per turn */
const turnKey = (state: GameState) => `${state.id}:${state.round}:${state.seat}`

export function yourTurnNotification(
  state: GameState,
  playerId: string,
  { started = false } = {},
): NotificationInput {
  const deadline = deadlineOf(state)
  return {
    playerId,
    kind: 'yourTurn',
    matchId: state.id,
    round: state.round,
    title: text(started ? 'notify.started.title' : 'notify.yourTurn.title', () => ({
      name: state.name,
    })),
    body: text(started ? 'notify.yourTurn.startedBody' : 'notify.yourTurn.body', (locale) => ({
      round: state.round,
      deadline: deadline(locale),
    })),
    url: matchPath(state.id),
    dedupeKey: `yourTurn:${turnKey(state)}`,
    email: state.mode === 'async',
  }
}

export function deadlineSoonNotification(state: GameState, playerId: string): NotificationInput {
  return {
    playerId,
    kind: 'deadlineSoon',
    matchId: state.id,
    round: state.round,
    title: text('notify.deadlineSoon.title', () => ({ name: state.name })),
    body: text('notify.deadlineSoon.body', (locale) => ({
      name: state.name,
      hours: DEADLINE_SOON_HOURS,
      deadline: formatDeadline(locale, state.turnDeadline!),
    })),
    url: matchPath(state.id),
    dedupeKey: `deadlineSoon:${turnKey(state)}`,
    email: true,
  }
}

export function remindNotification(
  state: GameState,
  playerId: string,
  fromName: string,
): NotificationInput {
  const deadline = deadlineOf(state)
  return {
    playerId,
    kind: 'remind',
    matchId: state.id,
    round: state.round,
    title: text('notify.remind.title', () => ({ name: state.name })),
    body: text('notify.remind.body', (locale) => ({
      from: fromName,
      name: state.name,
      round: state.round,
      deadline: deadline(locale),
    })),
    url: matchPath(state.id),
    email: true,
  }
}

function endedNotification(state: GameState, playerId: string): NotificationInput {
  const p = state.participants.find((x) => x.id === playerId)!
  const winner = state.participants.find((x) => x.id === state.winnerId)
  const result = (locale: Locale) =>
    state.winnerId === playerId
      ? translate(locale, 'notify.ended.victory')
      : translate(locale, 'notify.ended.place', {
          place: p.placement ?? state.participants.length,
          total: state.participants.length,
        }) + (winner ? translate(locale, 'notify.ended.winner', { name: winner.name }) : '')
  return {
    playerId,
    kind: 'matchEnded',
    matchId: state.id,
    title: text('notify.ended.title', () => ({ name: state.name })),
    body: text('notify.ended.body', (locale) => ({
      name: state.name,
      rounds: state.round,
      result: result(locale),
    })),
    url: matchPath(state.id),
    dedupeKey: `matchEnded:${state.id}:${playerId}`,
    email: true,
  }
}

/**
 * Notifications after a state change: the human who is on the move now gets "yourTurn" (not the
 * player who caused the change, they are in the app), and all remaining humans get "matchEnded"
 * when the match is over. `before = null` for a match that has just started.
 */
export function turnNotifications(
  before: GameState | null,
  after: GameState,
  { actorId = null as string | null } = {},
): NotificationInput[] {
  if (after.status === 'finished') {
    if (before?.status === 'finished') return []
    return after.participants.filter((p) => !p.isAI).map((p) => endedNotification(after, p.id))
  }
  const current = currentParticipant(after)
  const turnChanged =
    !before ||
    before.status !== 'running' ||
    before.round !== after.round ||
    before.seat !== after.seat
  const result: NotificationInput[] = []
  if (turnChanged && !current.isAI && current.id !== actorId)
    result.push(yourTurnNotification(after, current.id, { started: !before }))
  if (!before)
    // Start: the other humans hear that the match runs (push only)
    for (const p of after.participants)
      if (!p.isAI && p.id !== current.id && p.id !== actorId)
        result.push({
          playerId: p.id,
          kind: 'matchStarted',
          matchId: after.id,
          title: text('notify.started.title', () => ({ name: after.name })),
          body: text('notify.matchStarted.body', () => ({ name: current.name })),
          url: matchPath(after.id),
          dedupeKey: `started:${after.id}:${p.id}`,
          email: false,
        })
  return result
}
