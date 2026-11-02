import type { City, HexCoord, Unit } from '../types'
import type { BoardIndex } from './hex'

/** Own units standing on a tile (cargo is not part of the stack), in `units` order */
export function ownUnitsAt(idx: BoardIndex, c: HexCoord, youId: string): Unit[] {
  return idx.unitsAt(c).filter((u) => u.ownerId === youId && !u.carriedBy)
}

export type TapSelection = { unitId: string } | { cityId: string } | null

/**
 * What a tap on a tile selects next: unit 1 → unit 2 → … → city → nothing. Without a selection
 * on this tile the first unit that needs orders comes first.
 */
export function nextTapSelection({
  ownUnits,
  city,
  selectedUnitId,
  selectedCityId,
}: {
  ownUnits: Unit[]
  city: City | null | undefined
  selectedUnitId: string | null
  selectedCityId: string | null
}): TapSelection {
  if (city && selectedCityId === city.id) return null
  const i = ownUnits.findIndex((u) => u.id === selectedUnitId)
  if (i >= 0) {
    const next = ownUnits[i + 1]
    if (next) return { unitId: next.id }
    return city ? { cityId: city.id } : null
  }
  const first = ownUnits.find((u) => u.needsOrders) ?? ownUnits[0]
  if (first) return { unitId: first.id }
  return city ? { cityId: city.id } : null
}

/**
 * The next own unit that still needs orders after `cursor` (index of the last selected unit in
 * `units`), wrapping around to the start.
 */
export function nextPendingUnit(units: Unit[], youId: string, cursor: number): Unit | undefined {
  const pending = (u: Unit) => u.ownerId === youId && u.needsOrders && !u.carriedBy
  return units.find((u, i) => i > cursor && pending(u)) ?? units.find(pending)
}

export interface ProductionOverview {
  /** Per unit type: units owned (cargo included) and the cities building it */
  byType: Map<string, { owned: number; building: string[] }>
  owned: number
  building: number
}

/** Realm-wide stock and builds, with the current city listed first as „hier“ */
export function productionOverview(
  units: Unit[],
  cities: City[],
  youId: string,
  cityId: string,
): ProductionOverview {
  const byType = new Map<string, { owned: number; building: string[] }>()
  const entry = (typeId: string) => {
    let e = byType.get(typeId)
    if (!e) {
      e = { owned: 0, building: [] }
      byType.set(typeId, e)
    }
    return e
  }
  let owned = 0
  let building = 0
  for (const u of units) {
    if (u.ownerId !== youId) continue
    entry(u.unitTypeId).owned += 1
    owned += 1
  }
  const producing = cities.filter((c) => c.ownerId === youId && c.production)
  for (const c of [...producing.filter((c) => c.id === cityId), ...producing.filter((c) => c.id !== cityId)]) {
    entry(c.production!.unitTypeId).building.push(c.id === cityId ? 'hier' : c.name)
    building += 1
  }
  return { byType, owned, building }
}

export interface CombatTimeline {
  /** Muzzle flash at the attacker (ms from start) */
  muzzle: number
  /** Explosion on the target */
  blast: number
  /** Loser fades, winner advances */
  resolve: number
  /** Toast and new state */
  end: number
}

/** Phase times of the combat sequence for a total duration; null means no animation */
export function combatTimeline(ms: number): CombatTimeline | null {
  if (ms <= 0) return null
  return { muzzle: ms * 0.2, blast: ms * 0.4, resolve: ms * 0.7, end: ms }
}
