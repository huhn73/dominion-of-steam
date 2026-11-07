import type { ParamValue } from '../../i18n'
import { UNIT_TYPES } from '../catalog'
import { airBases, returnDistance } from '../fuel'
import { findPath, frontierNear, hexDistance, hexKey } from '../hex'
import type { HexCoord } from '../types'
import { budget, knowledge, logAction, snapshotVisibility, walk } from './movement'
import {
  addEvent,
  type GameState,
  msg,
  participant,
  unitName,
  type UnitState,
  unitType,
} from './state'
import { seesUnit, updateKnowledge, visibleTiles } from './visibility'

/** Frontier tiles considered per step; the nearest ones by air distance */
const CANDIDATES = 12

/**
 * One round of an exploring aircraft: fly tile by tile towards the nearest edge of the fog that
 * still leaves fuel for the way back to a base; without such a target head home and wait for the
 * refuel. Stops (order cleared, orders needed) as soon as an enemy unit or an unknown foreign city
 * comes into sight, or when a hidden enemy blocks the way. Ends the order when no fog is reachable
 * even with a full tank.
 */
export function exploreTurn(state: GameState, unit: UnitState) {
  const owner = unit.ownerId
  const type = unitType(unit.unitTypeId)
  const before = snapshotVisibility(state)
  const start = { col: unit.col, row: unit.row }
  const walked: HexCoord[] = []
  const name = (id: string | null): ParamValue | null =>
    id ? (participant(state, id)?.name ?? { key: 'events.unknown' }) : null

  const seenEnemies = new Set(
    (() => {
      const visible = visibleTiles(state, owner)
      return state.units
        .filter((u) => seesUnit(state, owner, u, (x) => visible.has(hexKey(x))))
        .map((u) => u.id)
    })(),
  )
  const knownCities = new Set(state.cities.filter((c) => owner in c.knownBy).map((c) => c.id))

  const stop = () => {
    unit.order = { type: 'none' }
    unit.needsOrders = true
  }

  /** Fly one tile; returns false when the round or the exploration is over */
  const step = (to: HexCoord): boolean => {
    const { walked: w, blocked } = walk(state, unit, [to])
    walked.push(...w)
    if (blocked) {
      stop()
      return false
    }
    if (!w.length) return false
    updateKnowledge(state)
    const visible = visibleTiles(state, owner)
    const enemy = state.units.find(
      (u) => seesUnit(state, owner, u, (x) => visible.has(hexKey(x))) && !seenEnemies.has(u.id),
    )
    if (enemy) {
      addEvent(
        state,
        owner,
        'enemySighted',
        enemy,
        msg('events.exploreEnemy', {
          unit: unitName(enemy.unitTypeId),
          owner: name(enemy.ownerId) ?? '',
          col: enemy.col,
          row: enemy.row,
        }),
      )
      stop()
      return false
    }
    const city = state.cities.find(
      (c) => c.ownerId !== owner && owner in c.knownBy && !knownCities.has(c.id),
    )
    if (city) {
      const holder = name(city.ownerId)
      addEvent(
        state,
        owner,
        'cityDiscovered',
        city,
        holder
          ? msg('events.exploreCity', { city: city.name, owner: holder })
          : msg('events.exploreCityFree', { city: city.name }),
      )
      stop()
      return false
    }
    return true
  }

  while (budget(unit) > 0) {
    const { view, idx } = knowledge(state, owner)
    const viewUnit = view.units.find((u) => u.id === unit.id)!
    const bases = airBases(view.cities, view.units, UNIT_TYPES, owner)
    const frontier = frontierNear(idx, unit, unit.fuel ?? type.range ?? 12, CANDIDATES)
    const reachable = (fuel: number) => {
      for (const t of frontier) {
        const path = findPath(viewUnit, t, idx)
        if (path && fuel - path.length >= returnDistance(t, bases)) return path
      }
      return null
    }

    const path = reachable(unit.fuel ?? Infinity)
    if (path) {
      if (!step(path[0]!)) break
      continue
    }

    // No safe target from here: refuel first, or give up when even a full tank is not enough
    if (returnDistance(unit, bases) === 0) {
      if (!reachable(type.range ?? 0)) {
        stop()
        addEvent(state, owner, 'exploration', unit, msg('events.exploreDone'))
      }
      break
    }
    const home = [...bases]
      .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
      .map((b) => findPath(viewUnit, b, idx))
      .find((p) => p)
    if (!home) {
      stop()
      addEvent(state, owner, 'exploration', unit, msg('events.exploreAborted'))
      break
    }
    if (!step(home[0]!)) break
  }

  logAction(state, unit, 'move', [start, ...walked], null, before)
  updateKnowledge(state)
}
