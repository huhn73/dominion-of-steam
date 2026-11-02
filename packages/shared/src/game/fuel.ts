import { hexDistance, hexKey } from './hex'
import type { City, HexCoord, Unit, UnitType } from './types'

// Fuel rules for aircraft, shared by the engine (explore order) and the client (range display,
// „Kein Rückweg“ confirmation, end-turn warning). A base is an own city or an own carrier.

export const isAircraft = (unit: Unit, type: UnitType | undefined) =>
  type?.domain === 'air' && unit.fuel != null

/** Own cities and own carriers (not carried themselves) where an aircraft can land and refuel */
export function airBases(
  cities: City[],
  units: Unit[],
  unitTypes: UnitType[],
  ownerId: string,
): HexCoord[] {
  const carriers = new Set(unitTypes.filter((t) => t.cargoDomain === 'air').map((t) => t.id))
  return [
    ...cities.filter((c) => c.ownerId === ownerId).map((c) => ({ col: c.col, row: c.row })),
    ...units
      .filter((u) => u.ownerId === ownerId && !u.carriedBy && carriers.has(u.unitTypeId))
      .map((u) => ({ col: u.col, row: u.row })),
  ]
}

/** Distance to the nearest base, Infinity without one */
export function returnDistance(at: HexCoord, bases: HexCoord[]) {
  return bases.reduce((min, b) => Math.min(min, hexDistance(at, b)), Infinity)
}

export const canReturn = (fuelAfter: number, at: HexCoord, bases: HexCoord[]) =>
  fuelAfter >= returnDistance(at, bases)

/** Tiles of this round's reach from which the aircraft could not get back to a base */
export function unsafeTiles(
  unit: Unit,
  type: UnitType | undefined,
  reach: Map<string, { coord: HexCoord; dist: number }>,
  bases: HexCoord[],
): Set<string> {
  const unsafe = new Set<string>()
  if (!isAircraft(unit, type)) return unsafe
  for (const { coord, dist } of reach.values())
    if (!canReturn(unit.fuel! - dist, coord, bases)) unsafe.add(hexKey(coord))
  return unsafe
}

export interface MoveSafety {
  /** Fuel left after flying the whole path (negative: the target is out of range) */
  fuelAfter: number
  returnDist: number
  safe: boolean
}

/** Whether a move or goto of `pathLength` tiles leaves enough fuel to reach a base again */
export function moveSafety(
  unit: Unit,
  type: UnitType | undefined,
  target: HexCoord,
  pathLength: number,
  bases: HexCoord[],
): MoveSafety {
  if (!isAircraft(unit, type)) return { fuelAfter: Infinity, returnDist: 0, safe: true }
  const fuelAfter = unit.fuel! - pathLength
  const returnDist = returnDistance(target, bases)
  return { fuelAfter, returnDist, safe: fuelAfter >= 0 && fuelAfter >= returnDist }
}

/** Own aircraft outside a base whose fuel no longer reaches one */
export function strandedAircraft(
  units: Unit[],
  unitTypes: UnitType[],
  bases: HexCoord[],
  ownerId: string,
) {
  const types = new Map(unitTypes.map((t) => [t.id, t]))
  return units
    .filter((u) => u.ownerId === ownerId && !u.carriedBy && isAircraft(u, types.get(u.unitTypeId)))
    .map((u) => ({ unit: u, returnDist: returnDistance(u, bases) }))
    .filter(({ unit, returnDist }) => returnDist > 0 && unit.fuel! < returnDist)
}
