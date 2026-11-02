import type { City, HexCoord, Unit } from '@dos/shared/game'
import { hexDistance } from '@dos/shared/game/hex'
import type { FieldLayer } from './ids'

export type FieldState = 'explore' | 'tension' | 'combat'

export interface FieldInput {
  round: number
  /** An enemy unit is in sight or one of your cities is threatened */
  threat: boolean
  /** An attack of yours runs right now, or the opponents' replay contains attacks */
  combat: boolean
}

export interface FieldMemory {
  state: FieldState
  /** Round of the last combat, for the fall-back to tension */
  lastCombatRound: number | null
  /** Round of the last threat, for the fall-back to explore */
  lastThreatRound: number | null
}

export const INITIAL_FIELD: FieldMemory = {
  state: 'explore',
  lastCombatRound: null,
  lastThreatRound: null,
}

/**
 * Adaptive field music (audio brief): combat while fighting and until a whole turn passed
 * without a fight; tension while an enemy is in sight or a city is threatened and until two
 * turns passed without; otherwise explore.
 */
export function nextField(prev: FieldMemory, input: FieldInput): FieldMemory {
  const { round } = input
  const lastCombatRound = input.combat ? round : prev.lastCombatRound
  const lastThreatRound = input.threat || input.combat ? round : prev.lastThreatRound
  let state: FieldState = 'explore'
  if (lastCombatRound !== null && round - lastCombatRound <= 1) state = 'combat'
  else if (lastThreatRound !== null && round - lastThreatRound <= 2) state = 'tension'
  return { state, lastCombatRound, lastThreatRound }
}

export const LAYER_OF: Record<FieldState, FieldLayer> = {
  explore: 'field-explore',
  tension: 'field-tension',
  combat: 'field-combat',
}

/** Enemy in sight: the view only contains visible foreign units */
export const enemyVisible = (units: readonly Unit[], youId: string) =>
  units.some((u) => u.ownerId !== youId)

/** One of your cities has a visible enemy within two hexes */
export function cityThreatened(
  cities: readonly City[],
  units: readonly Unit[],
  youId: string,
  radius = 2,
) {
  const own = cities.filter((c) => c.ownerId === youId)
  if (own.length === 0) return false
  const enemies: HexCoord[] = units.filter((u) => u.ownerId !== youId && !u.carriedBy)
  return enemies.some((e) => own.some((c) => hexDistance(c, e) <= radius))
}
