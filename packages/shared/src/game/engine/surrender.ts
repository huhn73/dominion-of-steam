import { type GameState, participant } from './state'
import { finishMatch, leaderByScore } from './victory'

/**
 * A human participant surrenders: the participant keeps its id (cities, units, seat) but is
 * played by an AI of difficulty "Normal" from now on and renamed "KI für <Name>". The player
 * counts as defeated, placed behind everyone still active. Without active humans left the
 * match ends at once (see `endIfNoHumans`). The caller runs the AI turn if it was their turn.
 */
export function surrender(state: GameState, participantId: string, now = new Date()): GameState {
  const p = participant(state, participantId)
  if (!p || p.isAI || p.status !== 'active' || state.status !== 'running')
    throw new Error(`${participantId} kann nicht aufgeben`)
  p.surrender = {
    name: p.name,
    at: now.toISOString(),
    round: state.round,
    placement: state.participants.filter((q) => q.status === 'active').length,
    citiesCaptured: p.citiesCaptured,
    unitsBuilt: p.unitsBuilt,
  }
  p.name = `KI für ${p.name}`
  p.isAI = true
  p.aiDifficulty = 'normal'
  p.aiPersonalityId = null
  endIfNoHumans(state, now)
  return state
}

/**
 * Only AIs left (all humans surrendered or eliminated): nobody is there to play against, so the
 * match ends with the leader by points as winner. Returns true when the match is finished.
 */
export function endIfNoHumans(state: GameState, now = new Date()) {
  if (state.status !== 'running') return state.status === 'finished'
  if (state.participants.some((p) => p.status === 'active' && !p.isAI)) return false
  finishMatch(state, leaderByScore(state)?.id ?? null, now)
  return true
}
