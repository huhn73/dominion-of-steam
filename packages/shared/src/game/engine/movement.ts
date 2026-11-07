import { translateMessage, type Message } from '../../i18n'
import { UNIT_TYPES } from '../catalog'
import {
  buildIndex,
  hexDistance,
  hexKey,
  isWater,
  sameHex,
  transportAt,
  type BoardIndex,
} from '../hex'
import type { HexCoord, Unit } from '../types'
import type { PlayerView } from '../view'
import {
  addEvent,
  type GameState,
  type LogEntry,
  msg,
  nextSeq,
  placeUnit,
  unitName,
  type UnitState,
  unitType,
} from './state'
import { hiddenFrom, STEALTH_UNIT_TYPES, tileAt, visibleTiles } from './visibility'
import { projectBoard } from './view'

/** The board as the participant knows it (map, cities, units), with an index over it */
export type Knowledge = { view: Pick<PlayerView, 'map' | 'cities' | 'units'>; idx: BoardIndex }

/** The participant's knowledge of the board, as the client sees it */
export function knowledge(state: GameState, playerId: string): Knowledge {
  const view = projectBoard(state, playerId)
  return { view, idx: buildIndex(view.map, view.cities, view.units, UNIT_TYPES, playerId) }
}

export function refreshNeedsOrders(u: UnitState) {
  u.needsOrders = u.order.type === 'none' && !u.skipped && !u.carriedBy && u.movesLeft > 0
}

export const budget = (u: Unit) => Math.min(u.movesLeft, u.fuel ?? Infinity)

export function detach(state: GameState, unit: UnitState) {
  if (!unit.carriedBy) return
  const carrier = state.units.find((u) => u.id === unit.carriedBy)
  if (carrier) carrier.cargoUnitIds = carrier.cargoUnitIds.filter((id) => id !== unit.id)
  unit.carriedBy = null
}

/**
 * Move a unit step by step along a path. Hidden enemies stop the move on the last free tile.
 * Returns the tiles actually entered and whether an enemy blocked the way.
 */
export function walk(state: GameState, unit: UnitState, path: HexCoord[]) {
  const walked: HexCoord[] = []
  let blocked = false
  for (const step of path) {
    if (budget(unit) <= 0) break
    const enemy = state.units.find(
      (u) => u.ownerId !== unit.ownerId && !u.carriedBy && sameHex(u, step),
    )
    if (enemy) {
      // Running into a submarine reveals it to the mover until its owner's next turn
      if (STEALTH_UNIT_TYPES.has(enemy.unitTypeId) && !enemy.revealedTo?.includes(unit.ownerId))
        enemy.revealedTo = [...(enemy.revealedTo ?? []), unit.ownerId]
      addEvent(
        state,
        unit.ownerId,
        'enemySighted',
        step,
        msg('events.blocked', { unit: unitName(unit.unitTypeId), enemy: unitName(enemy.unitTypeId) }),
      )
      blocked = true
      break
    }
    detach(state, unit)
    placeUnit(state, unit, step)
    unit.movesLeft -= 1
    if (unit.fuel != null) unit.fuel -= 1
    walked.push(step)
  }
  return { walked, blocked }
}

/** Load the unit onto an own transport or carrier on its tile, if it ends there */
export function boardIfPossible(state: GameState, unit: UnitState, idx: BoardIndex) {
  const type = unitType(unit.unitTypeId)
  const tile = tileAt(state, unit)
  if (type.domain === 'sea' || !tile) return
  if (type.domain === 'land' && !isWater(tile.terrain)) return
  const transport = transportAt(unit, type.domain, idx)
  if (!transport || transport.id === unit.id) return
  const real = state.units.find((u) => u.id === transport.id)!
  real.cargoUnitIds.push(unit.id)
  unit.carriedBy = real.id
  if (type.domain === 'land') unit.movesLeft = 0
}

/** Record an action for the opponents' replay */
export function logAction(
  state: GameState,
  unit: UnitState,
  action: LogEntry['action'],
  path: HexCoord[],
  result: Message | null,
  seenBefore: Map<string, Set<string>>,
) {
  if (path.length < 2) return
  const seenBy: Record<string, HexCoord[]> = {}
  // Only participants with something of their own near the path can have seen it (sight ≤ 2)
  const near = (p: { id: string }) =>
    state.units.some(
      (u) => u.ownerId === p.id && !u.carriedBy && path.some((c) => hexDistance(u, c) <= 2),
    ) || state.cities.some((c) => c.ownerId === p.id && path.some((s) => hexDistance(c, s) <= 1))
  for (const p of state.participants) {
    if (p.id === unit.ownerId || p.status !== 'active' || !near(p)) continue
    // A hidden submarine leaves no trace in the opponents' replay
    if (hiddenFrom(state, p.id, unit)) continue
    const after = visibleTiles(state, p.id)
    const before = seenBefore.get(p.id) ?? new Set()
    const seen = path.filter((c) => before.has(hexKey(c)) || after.has(hexKey(c)))
    if (seen.length) seenBy[p.id] = seen
  }
  state.log.push({
    seq: nextSeq(state),
    round: state.round,
    participantId: unit.ownerId,
    action,
    unitTypeId: unit.unitTypeId,
    path,
    result: result && translateMessage('de', result),
    resultText: result,
    seenBy,
  })
}

export function snapshotVisibility(state: GameState) {
  return new Map(state.participants.map((p) => [p.id, visibleTiles(state, p.id)]))
}
