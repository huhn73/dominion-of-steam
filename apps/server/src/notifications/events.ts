import { currentParticipant, type GameState } from '@dos/shared/engine'
import { DEADLINE_SOON_HOURS } from '@dos/shared/notifications'
import type { NotificationInput } from './service'

const deadlineFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: process.env.TZ_DISPLAY ?? 'Europe/Berlin',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/** „Sa., 31. Okt., 11:00“ (German time unless TZ_DISPLAY says otherwise) */
export const formatDeadline = (iso: string) => deadlineFormat.format(new Date(iso))

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
  const deadline = state.turnDeadline ? ` Frist: ${formatDeadline(state.turnDeadline)}.` : ''
  return {
    playerId,
    kind: 'yourTurn',
    matchId: state.id,
    round: state.round,
    title: started ? `„${state.name}“ hat begonnen` : `Du bist am Zug: ${state.name}`,
    body: `${started ? 'Die Partie läuft, und du' : 'Du'} bist in Runde ${state.round} am Zug. Deine Truppen warten auf Befehle.${deadline}`,
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
    title: `Frist läuft bald ab: ${state.name}`,
    body: `Dein Zug in „${state.name}“ endet in weniger als ${DEADLINE_SOON_HOURS} Stunden (${formatDeadline(state.turnDeadline!)}). Danach endet er automatisch.`,
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
  const deadline = state.turnDeadline ? ` Frist: ${formatDeadline(state.turnDeadline)}.` : ''
  return {
    playerId,
    kind: 'remind',
    matchId: state.id,
    round: state.round,
    title: `Erinnerung: ${state.name}`,
    body: `${fromName} wartet in „${state.name}“ auf deinen Zug (Runde ${state.round}).${deadline}`,
    url: matchPath(state.id),
    email: true,
  }
}

function endedNotification(state: GameState, playerId: string): NotificationInput {
  const p = state.participants.find((x) => x.id === playerId)!
  const winner = state.participants.find((x) => x.id === state.winnerId)
  const result =
    state.winnerId === playerId
      ? 'Sieg! Du hast die Partie gewonnen.'
      : `Du belegst Platz ${p.placement ?? state.participants.length} von ${state.participants.length}.${winner ? ` Sieger: ${winner.name}.` : ''}`
  return {
    playerId,
    kind: 'matchEnded',
    matchId: state.id,
    title: `Partie beendet: ${state.name}`,
    body: `„${state.name}“ ist nach ${state.round} Runden zu Ende. ${result}`,
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
          title: `„${after.name}“ hat begonnen`,
          body: `Die Partie läuft. ${current.name} ist zuerst am Zug; du bekommst Bescheid, wenn du dran bist.`,
          url: matchPath(after.id),
          dedupeKey: `started:${after.id}:${p.id}`,
          email: false,
        })
  return result
}
