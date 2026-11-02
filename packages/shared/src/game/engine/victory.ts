import { type GameState, type ParticipantState, nextSeq } from './state'

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
export function finishMatch(state: GameState, winnerId: string | null, now: Date) {
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
  state.turnDeadline = null
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
 * Check the victory conditions that can be decided at any time: last one standing (always) and,
 * with 'capitals', a participant holding the original capitals of all others.
 * The round limit is checked in `endTurn`. Returns true when the match is now finished.
 */
export function checkVictory(state: GameState, now: Date): boolean {
  if (state.status === 'finished') return true
  const active = state.participants.filter((p) => p.status === 'active')
  if (active.length <= 1) {
    finishMatch(state, active[0]?.id ?? null, now)
    return true
  }
  if (state.rules.victoryCondition === 'capitals') {
    for (const p of active) {
      const capitals = state.participants
        .filter((q) => q !== p && q.capitalCityId)
        .map((q) => state.cities.find((c) => c.id === q.capitalCityId))
      if (capitals.length && capitals.every((c) => c?.ownerId === p.id)) {
        finishMatch(state, p.id, now)
        return true
      }
    }
  }
  return false
}
