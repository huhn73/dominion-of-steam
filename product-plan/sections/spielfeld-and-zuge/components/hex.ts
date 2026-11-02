import type {
  City,
  CombatPreview,
  GameMap,
  HexCoord,
  ParticipantColor,
  Terrain,
  Tile,
  Unit,
  UnitType,
} from '../types'

// Pointy-top hexes in odd-r offset coordinates (odd rows shifted right)

export const HEX_SIZE = 40
const SQRT3 = Math.sqrt(3)

export const hexKey = (c: HexCoord) => `${c.col},${c.row}`
export const sameHex = (a?: HexCoord | null, b?: HexCoord | null) =>
  !!a && !!b && a.col === b.col && a.row === b.row

export function hexToPixel({ col, row }: HexCoord, size = HEX_SIZE) {
  return {
    x: size * SQRT3 * (col + 0.5 * (row & 1)) + (size * SQRT3) / 2,
    y: size * 1.5 * row + size,
  }
}

export function pixelToHex(x: number, y: number, size = HEX_SIZE): HexCoord {
  const px = x - (size * SQRT3) / 2
  const py = y - size
  const q = ((SQRT3 / 3) * px - py / 3) / size
  const r = ((2 / 3) * py) / size
  // cube rounding
  let rx = Math.round(q)
  let rz = Math.round(r)
  const ry = Math.round(-q - r)
  const dx = Math.abs(rx - q)
  const dy = Math.abs(ry - (-q - r))
  const dz = Math.abs(rz - r)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dy <= dz) rz = -rx - ry
  return { col: rx + (rz - (rz & 1)) / 2, row: rz }
}

export function hexPoints(cx: number, cy: number, size = HEX_SIZE) {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + size * Math.cos(a)).toFixed(2)},${(cy + size * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export function mapPixelSize(map: GameMap, size = HEX_SIZE) {
  return {
    width: size * SQRT3 * (map.width + 0.5),
    height: size * (1.5 * (map.height - 1) + 2),
  }
}

const EVEN_DIRS = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]]
const ODD_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]

export function neighbors({ col, row }: HexCoord): HexCoord[] {
  return (row & 1 ? ODD_DIRS : EVEN_DIRS).map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
}

function toCube({ col, row }: HexCoord) {
  const x = col - (row - (row & 1)) / 2
  return { x, y: -x - row, z: row }
}

export function hexDistance(a: HexCoord, b: HexCoord) {
  const ac = toCube(a)
  const bc = toCube(b)
  return Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y), Math.abs(ac.z - bc.z))
}

export const isWater = (t: Terrain) => t === 'deepSea' || t === 'shallows'

export const PARTICIPANT_HEX: Record<ParticipantColor, { base: string; deep: string }> = {
  amber: { base: '#f59e0b', deep: '#92400e' },
  rose: { base: '#f43f5e', deep: '#9f1239' },
  sky: { base: '#0ea5e9', deep: '#075985' },
  lime: { base: '#84cc16', deep: '#3f6212' },
  violet: { base: '#8b5cf6', deep: '#5b21b6' },
  orange: { base: '#f97316', deep: '#9a3412' },
}

// =============================================================================
// Board index & movement rules
// =============================================================================

export interface BoardIndex {
  map: GameMap
  youId: string
  tileAt: (c: HexCoord) => Tile | undefined
  cityAt: (c: HexCoord) => City | undefined
  /** Units on the map, without carried cargo */
  unitsAt: (c: HexCoord) => Unit[]
  unitType: (id: string) => UnitType | undefined
}

export function buildIndex(
  map: GameMap,
  cities: City[],
  units: Unit[],
  unitTypes: UnitType[],
  youId: string,
): BoardIndex {
  const tiles = new Map(map.tiles.map((t) => [hexKey(t), t]))
  const cityMap = new Map(cities.map((c) => [hexKey(c), c]))
  const unitMap = new Map<string, Unit[]>()
  for (const u of units) {
    if (u.carriedBy) continue
    const k = hexKey(u)
    unitMap.set(k, [...(unitMap.get(k) ?? []), u])
  }
  const types = new Map(unitTypes.map((t) => [t.id, t]))
  return {
    map,
    youId,
    tileAt: (c) => tiles.get(hexKey(c)),
    cityAt: (c) => cityMap.get(hexKey(c)),
    unitsAt: (c) => unitMap.get(hexKey(c)) ?? [],
    unitType: (id) => types.get(id),
  }
}

/** Own transport or carrier on this tile that can take a unit of the given domain */
export function transportAt(c: HexCoord, domain: UnitType['domain'], idx: BoardIndex) {
  return idx.unitsAt(c).find((u) => {
    const t = idx.unitType(u.unitTypeId)
    return u.ownerId === idx.youId && !!t && t.cargoDomain === domain && t.capacity > u.cargoUnitIds.length
  })
}

function canEnter(type: UnitType, c: HexCoord, idx: BoardIndex, isFinal: boolean) {
  const tile = idx.tileAt(c)
  if (!tile || tile.visibility === 'unexplored') return false
  if (idx.unitsAt(c).some((u) => u.ownerId !== idx.youId)) return false
  const city = idx.cityAt(c)
  if (city && city.ownerId !== idx.youId) return false
  if (type.domain === 'air') return true
  if (type.domain === 'sea') return isWater(tile.terrain) || city?.ownerId === idx.youId
  if (!isWater(tile.terrain)) return true
  return isFinal && !!transportAt(c, 'land', idx)
}

const moveBudget = (unit: Unit) => Math.min(unit.movesLeft, unit.fuel ?? Infinity)

/** Tiles the unit can reach this round, with their distance */
export function reachableTiles(unit: Unit, idx: BoardIndex) {
  const type = idx.unitType(unit.unitTypeId)
  const result = new Map<string, { coord: HexCoord; dist: number }>()
  if (!type) return result
  const budget = moveBudget(unit)
  const seen = new Set([hexKey(unit)])
  let frontier: HexCoord[] = [unit]
  for (let d = 1; d <= budget && frontier.length; d++) {
    const next: HexCoord[] = []
    for (const c of frontier) {
      for (const n of neighbors(c)) {
        const k = hexKey(n)
        if (seen.has(k)) continue
        seen.add(k)
        if (canEnter(type, n, idx, true)) result.set(k, { coord: n, dist: d })
        // land units may end on a transport but not pass through water
        if (canEnter(type, n, idx, false)) next.push(n)
      }
    }
    frontier = next
  }
  return result
}

/** Shortest path from the unit to target (excluding start), or null */
export function findPath(unit: Unit, target: HexCoord, idx: BoardIndex): HexCoord[] | null {
  const type = idx.unitType(unit.unitTypeId)
  if (!type || sameHex(unit, target) || !canEnter(type, target, idx, true)) return null
  const prev = new Map<string, HexCoord | null>([[hexKey(unit), null]])
  const queue: HexCoord[] = [unit]
  while (queue.length) {
    const c = queue.shift()!
    for (const n of neighbors(c)) {
      const k = hexKey(n)
      if (prev.has(k)) continue
      if (sameHex(n, target)) {
        const path = [n]
        let p: HexCoord | null = c
        while (p && !sameHex(p, unit)) {
          path.unshift(p)
          p = prev.get(hexKey(p)) ?? null
        }
        return path
      }
      if (!canEnter(type, n, idx, false)) continue
      prev.set(k, c)
      queue.push(n)
    }
  }
  return null
}

/** Round number (1 = this round) in which the unit reaches each step of the path */
export function pathTurns(unit: Unit, type: UnitType, length: number) {
  const budget = moveBudget(unit)
  return Array.from({ length }, (_, i) =>
    i < budget ? 1 : 1 + Math.ceil((i + 1 - budget) / type.movement),
  )
}

export interface AttackTarget {
  coord: HexCoord
  unitId?: string
  cityId?: string
  winChance: number
}

export function attackTargets(
  unit: Unit,
  idx: BoardIndex,
  units: Unit[],
  cities: City[],
  previews: CombatPreview[],
): AttackTarget[] {
  const type = idx.unitType(unit.unitTypeId)
  if (!type || type.strength === 0 || unit.movesLeft === 0) return []
  const reach = reachableTiles(unit, idx)
  const origins: HexCoord[] = [
    unit,
    ...[...reach.values()].filter((r) => r.dist < unit.movesLeft).map((r) => r.coord),
  ]
  const inRange = (c: HexCoord) => origins.some((o) => hexDistance(o, c) === 1)
  const fitsDomain = (c: HexCoord) => {
    const tile = idx.tileAt(c)
    if (!tile) return false
    if (type.domain === 'air') return true
    if (type.domain === 'land') return !isWater(tile.terrain)
    return isWater(tile.terrain) || neighbors(c).some((n) => {
      const t = idx.tileAt(n)
      return !!t && isWater(t.terrain)
    })
  }
  const attack = type.strength * (unit.health / 100)

  const targets: AttackTarget[] = []
  for (const enemy of units) {
    if (enemy.ownerId === idx.youId || enemy.carriedBy || !inRange(enemy) || !fitsDomain(enemy)) continue
    const preview = previews.find((p) => p.attackerUnitId === unit.id && p.targetUnitId === enemy.id)
    const et = idx.unitType(enemy.unitTypeId)
    const defense = (et?.defense ?? 1) * (enemy.health / 100) + (idx.cityAt(enemy) ? 1 : 0)
    targets.push({ coord: enemy, unitId: enemy.id, winChance: preview?.winChance ?? attack / (attack + defense) })
  }
  if (type.canCaptureCities) {
    for (const city of cities) {
      if (city.ownerId === idx.youId || !inRange(city)) continue
      if (targets.some((t) => sameHex(t.coord, city))) continue
      const preview = previews.find((p) => p.attackerUnitId === unit.id && p.targetCityId === city.id)
      targets.push({ coord: city, cityId: city.id, winChance: preview?.winChance ?? attack / (attack + 1) })
    }
  }
  return targets
}
