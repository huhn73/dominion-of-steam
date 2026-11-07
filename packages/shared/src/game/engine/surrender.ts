import {
  CAPITULATION_CITY_SHARE,
  CAPITULATION_LEADER_CITIES,
  CAPITULATION_MIN_ROUND,
} from '../rules'
import {
  addEvent,
  type GameState,
  msg,
  nextSeq,
  participant,
  type ParticipantState,
} from './state'
import { finishMatch, leaderByScore, ownCityOf } from './victory'

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
  finishMatch(state, leaderByScore(state)?.id ?? null, now, 'noHumans')
  return true
}

const cityCount = (state: GameState, id: string) =>
  state.cities.filter((c) => c.ownerId === id).length

/**
 * Whether an AI should give up: its starting capital is in enemy hands, the leader among the
 * others holds at least `CAPITULATION_LEADER_CITIES` cities and the AI less than
 * `CAPITULATION_CITY_SHARE` of that, from round `CAPITULATION_MIN_ROUND` on. Humans never
 * capitulate on their own; they can surrender.
 */
export function shouldCapitulate(state: GameState, p: ParticipantState) {
  if (!p.isAI || p.status !== 'active' || state.status !== 'running') return false
  if (state.round < CAPITULATION_MIN_ROUND) return false
  const capital = state.cities.find((c) => c.id === p.capitalCityId)
  if (!capital || capital.ownerId === p.id || capital.ownerId === null) return false
  const leader = Math.max(
    0,
    ...state.participants
      .filter((q) => q !== p && q.status === 'active')
      .map((q) => cityCount(state, q.id)),
  )
  if (leader < CAPITULATION_LEADER_CITIES) return false
  return cityCount(state, p.id) < leader * CAPITULATION_CITY_SHARE
}

/**
 * An AI gives up a lost match: it is out, its units (with their cargo) disappear and its cities
 * become neutral, without damage or production. Every active participant hears of it, on one of
 * their own cities (the capitulating AI's cities may lie in their fog). The caller checks the
 * victory afterwards.
 */
export function capitulate(state: GameState, participantId: string) {
  const p = participant(state, participantId)
  if (!p || p.status !== 'active') throw new Error(`${participantId} kann nicht kapitulieren`)
  state.units = state.units.filter((u) => u.ownerId !== p.id)
  for (const c of state.cities) {
    if (c.ownerId !== p.id) continue
    c.ownerId = null
    c.production = null
    c.damage = 0
    c.underFire = false
  }
  p.status = 'eliminated'
  p.eliminatedSeq = nextSeq(state)
  p.capitulatedRound = state.round
  if (state.dominance?.participantId === p.id) state.dominance = null
  for (const q of state.participants) {
    if (q.status !== 'active') continue
    const at = ownCityOf(state, q) ?? { col: 0, row: 0 }
    addEvent(
      state,
      q.id,
      'capitulation',
      at,
      msg('events.capitulation', { name: p.name }),
    )
  }
}
