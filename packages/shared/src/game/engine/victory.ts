import type { Message } from '../../i18n'
import type { Dominance, EndReason } from '../types'
import { DOMINANCE_SHARE, DOMINANCE_TURNS } from '../rules'
import {
  addEvent,
  type GameState,
  msg,
  nextSeq,
  type ParticipantState,
} from './state'

/** Points for the round limit: 3 per city plus 1 per unit (same formula as `participantScore`) */
export function score(state: GameState, participantId: string) {
  const cities = state.cities.filter((c) => c.ownerId === participantId).length
  const units = state.units.filter((u) => u.ownerId === participantId).length
  return cities * 3 + units
}

/** Participants without cities and units are out; their elimination order is recorded */
export function updateEliminations(state: GameState) {
  for (const p of state.participants) {
    if (p.status !== 'active') continue
    const hasCity = state.cities.some((c) => c.ownerId === p.id)
    const hasUnit = state.units.some((u) => u.ownerId === p.id)
    if (!hasCity && !hasUnit) {
      p.status = 'eliminated'
      p.eliminatedSeq = nextSeq(state)
    }
  }
}

/**
 * Finish the match: `winnerId` gets place 1, the other remaining participants follow by points
 * (cities × 3 + units), then the eliminated ones, the earlier eliminated the worse.
 */
export function finishMatch(
  state: GameState,
  winnerId: string | null,
  now: Date,
  reason: EndReason,
) {
  const byScore = (a: ParticipantState, b: ParticipantState) =>
    score(state, b.id) - score(state, a.id) ||
    state.participants.indexOf(a) - state.participants.indexOf(b)
  const winner = state.participants.find((p) => p.id === winnerId)
  const active = state.participants.filter((p) => p.status === 'active' && p !== winner)
  const out = state.participants
    .filter((p) => p.status !== 'active' && p !== winner)
    .sort((a, b) => (b.eliminatedSeq ?? 0) - (a.eliminatedSeq ?? 0))
  const order = [...(winner ? [winner] : []), ...active.sort(byScore), ...out]
  order.forEach((p, i) => (p.placement = i + 1))
  state.status = 'finished'
  state.winnerId = winner?.id ?? null
  state.endedAt = now.toISOString()
  state.endReason = reason
  state.turnDeadline = null
  state.dominance = null
}

/** Winner by points after the last round (ties: earlier seat) */
export function leaderByScore(state: GameState) {
  return state.participants
    .filter((p) => p.status === 'active')
    .sort(
      (a, b) =>
        score(state, b.id) - score(state, a.id) ||
        state.participants.indexOf(a) - state.participants.indexOf(b),
    )[0]
}

/**
 * Check the victory conditions that can be decided at any time: last one standing (always),
 * with 'capitals' a participant holding the original capitals of all others, with 'dominance'
 * a participant who held the city share for `DOMINANCE_TURNS` own turns.
 * The round limit is checked in `endTurn`. Returns true when the match is now finished.
 */
export function checkVictory(state: GameState, now: Date): boolean {
  if (state.status === 'finished') return true
  const active = state.participants.filter((p) => p.status === 'active')
  if (active.length <= 1) {
    finishMatch(state, active[0]?.id ?? null, now, 'elimination')
    return true
  }
  if (state.rules.victoryCondition === 'capitals') {
    for (const p of active) {
      const capitals = state.participants
        .filter((q) => q !== p && q.capitalCityId)
        .map((q) => state.cities.find((c) => c.id === q.capitalCityId))
      if (capitals.length && capitals.every((c) => c?.ownerId === p.id)) {
        finishMatch(state, p.id, now, 'capitals')
        return true
      }
    }
  }
  const held = state.dominance
  if (state.rules.victoryCondition === 'dominance' && held && held.turns >= DOMINANCE_TURNS) {
    const holder = state.participants.find((p) => p.id === held.participantId)
    if (holder?.status === 'active') {
      finishMatch(state, holder.id, now, 'dominance')
      return true
    }
  }
  return false
}

/** City share the victory condition 'dominance' asks for on this match's map */
export const dominanceShare = (state: GameState) =>
  DOMINANCE_SHARE[state.map.worldShape ?? 'continent']

/** Share of all cities (neutral ones count) a participant holds, 0..1 */
export function cityShare(state: GameState, participantId: string) {
  if (!state.cities.length) return 0
  return state.cities.filter((c) => c.ownerId === participantId).length / state.cities.length
}

const percent = (share: number) => Math.floor(share * 100)

/**
 * Tell every active participant about the dominance; the holder reads it in the second person.
 * The event sits on one of the reader's own cities: the holder's cities may lie in their fog.
 */
function announceDominance(
  state: GameState,
  holder: ParticipantState,
  own: Message,
  others: Message,
) {
  for (const p of state.participants) {
    if (p.status !== 'active') continue
    const at = ownCityOf(state, p) ?? { col: 0, row: 0 }
    addEvent(state, p.id, 'dominance', at, p.id === holder.id ? own : others)
  }
}

/** The participant's capital if they still hold it, else any own city */
export function ownCityOf(state: GameState, p: ParticipantState) {
  const capital = state.cities.find((c) => c.id === p.capitalCityId && c.ownerId === p.id)
  return capital ?? state.cities.find((c) => c.ownerId === p.id)
}

/**
 * Victory condition 'dominance', at the end of `current`'s turn: a holder who fell below the
 * share loses the count; `current` holding the share counts one more own turn (or starts at 1)
 * unless someone else still holds it.
 * `checkVictory` ends the match once the count reaches `DOMINANCE_TURNS`.
 */
export function updateDominance(state: GameState, current: ParticipantState) {
  if (state.rules.victoryCondition !== 'dominance') return
  const before = state.dominance
  if (before) {
    const holder = state.participants.find((p) => p.id === before.participantId)
    const share = cityShare(state, before.participantId)
    if (!holder || holder.status !== 'active' || share < dominanceShare(state)) {
      state.dominance = null
      if (holder)
        announceDominance(
          state,
          holder,
          msg('events.dominanceBrokenOwn', { share: percent(share) }),
          msg('events.dominanceBroken', { name: holder.name, share: percent(share) }),
        )
    }
  }
  // With 50 % two participants can hold the share at once: the first keeps it until it breaks
  if (state.dominance && state.dominance.participantId !== current.id) return
  const share = cityShare(state, current.id)
  if (current.status !== 'active' || share < dominanceShare(state)) return
  const turns = state.dominance ? state.dominance.turns + 1 : 1
  state.dominance = { participantId: current.id, turns }
  const left = DOMINANCE_TURNS - turns
  if (left <= 0) return
  announceDominance(
    state,
    current,
    msg('events.dominanceOwn', { share: percent(share), count: left }),
    msg('events.dominance', { name: current.name, share: percent(share), count: left }),
  )
}

/** The dominance as the participants see it, null when nobody holds it */
export function dominanceView(state: GameState): Dominance | null {
  const d = state.dominance
  if (!d || state.status !== 'running' || state.rules.victoryCondition !== 'dominance') return null
  return {
    participantId: d.participantId,
    share: cityShare(state, d.participantId),
    turnsLeft: Math.max(0, DOMINANCE_TURNS - d.turns),
  }
}
