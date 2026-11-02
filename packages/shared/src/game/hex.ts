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
  CombatOdds,
  Visibility,
} from './types'
import { canAttack, CITY_DEFENSE, cityAttackOdds, exchangeOdds, terrainDefense } from './rules'
import { TERRAIN_OF_CODE, tileIndex, VISIBILITY_OF_CODE } from './mapcodec'

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
  /** Builds a tile object; the engine's hot paths use `terrainAt`/`visibilityAt` instead */
  tileAt: (c: HexCoord) => Tile | undefined
  terrainAt: (c: HexCoord) => Terrain | undefined
  visibilityAt: (c: HexCoord) => Visibility | undefined
  cityAt: (c: HexCoord) => City | undefined
  /** Units on the map, without carried cargo */
  unitsAt: (c: HexCoord) => Unit[]
  unitType: (id: string) => UnitType | undefined
  /** Search budget shared by every `findPath` on this index (the AI sets it, the client never) */
  pathBudget?: PathBudget
}

export function buildIndex(
  map: GameMap,
  cities: City[],
  units: Unit[],
  unitTypes: UnitType[],
  youId: string,
): BoardIndex {
  const cityMap = new Map(cities.map((c) => [hexKey(c), c]))
  const unitMap = new Map<string, Unit[]>()
  for (const u of units) {
    if (u.carriedBy) continue
    const k = hexKey(u)
    unitMap.set(k, [...(unitMap.get(k) ?? []), u])
  }
  const types = new Map(unitTypes.map((t) => [t.id, t]))
  const terrainAt = (c: HexCoord) => {
    const i = tileIndex(map, c)
    return i < 0 ? undefined : TERRAIN_OF_CODE[map.terrain[i]!]
  }
  const visibilityAt = (c: HexCoord) => {
    const i = tileIndex(map, c)
    return i < 0 ? undefined : VISIBILITY_OF_CODE[map.visibility[i]!]
  }
  return {
    map,
    youId,
    tileAt: (c) => {
      const terrain = terrainAt(c)
      const visibility = visibilityAt(c)
      return terrain && visibility ? { col: c.col, row: c.row, terrain, visibility } : undefined
    },
    terrainAt,
    visibilityAt,
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
  const terrain = idx.terrainAt(c)
  if (!terrain || idx.visibilityAt(c) === 'unexplored') return false
  if (idx.unitsAt(c).some((u) => u.ownerId !== idx.youId)) return false
  const city = idx.cityAt(c)
  if (city && city.ownerId !== idx.youId) return false
  if (type.domain === 'air') return true
  if (type.domain === 'sea') return isWater(terrain) || city?.ownerId === idx.youId
  if (!isWater(terrain)) return true
  return isFinal && !!transportAt(c, 'land', idx)
}

/** Tiles of the board within `radius` of `center`, nearest first (bounding-box scan) */
export function tilesNear(
  map: { width: number; height: number },
  center: HexCoord,
  radius: number,
): HexCoord[] {
  const out: { c: HexCoord; d: number }[] = []
  for (let row = Math.max(0, center.row - radius); row <= Math.min(map.height - 1, center.row + radius); row++)
    for (let col = Math.max(0, center.col - radius); col <= Math.min(map.width - 1, center.col + radius); col++) {
      const c = { col, row }
      const d = hexDistance(center, c)
      if (d <= radius) out.push({ c, d })
    }
  return out.sort((a, b) => a.d - b.d).map((x) => x.c)
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

/**
 * Known tiles next to unexplored ones, nearest to `from` first: within `radius` first, and
 * across the whole board when nothing is found there. `fits` filters by domain.
 */
export function frontierNear(
  idx: BoardIndex,
  from: HexCoord,
  radius: number,
  limit: number,
  fits: (c: HexCoord) => boolean = () => true,
): HexCoord[] {
  const isFrontier = (c: HexCoord) =>
    idx.visibilityAt(c) !== 'unexplored' &&
    !sameHex(c, from) &&
    fits(c) &&
    neighbors(c).some((n) => idx.visibilityAt(n) === 'unexplored')
  const near = tilesNear(idx.map, from, radius).filter(isFrontier).slice(0, limit)
  if (near.length) return near
  const all: HexCoord[] = []
  for (let row = 0; row < idx.map.height; row++)
    for (let col = 0; col < idx.map.width; col++) {
      const c = { col, row }
      if (isFrontier(c)) all.push(c)
    }
  return all.sort((a, b) => hexDistance(a, from) - hexDistance(b, from)).slice(0, limit)
}

/** Shared, mutable search budget: `used` counts expanded nodes across several searches */
export interface PathBudget {
  maxNodes: number
  used: number
}

/**
 * Shortest path from the unit to target (excluding start), or null. Breadth-first over tile
 * indices; a budget stops the search (null) once `used` reaches `maxNodes`.
 */
export function findPath(
  unit: Unit,
  target: HexCoord,
  idx: BoardIndex,
  budget?: PathBudget,
): HexCoord[] | null {
  const type = idx.unitType(unit.unitTypeId)
  if (!type || sameHex(unit, target) || !canEnter(type, target, idx, true)) return null
  budget ??= idx.pathBudget
  const { width, height } = idx.map
  const n = width * height
  const start = tileIndex(idx.map, unit)
  const goal = tileIndex(idx.map, target)
  if (start < 0 || goal < 0) return null
  // prev[i] = index of the tile we came from, -1 for the start, -2 for unseen
  const prev = new Int32Array(n).fill(-2)
  prev[start] = -1
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0
  queue[tail++] = start
  const coordOf = (i: number): HexCoord => ({ col: i % width, row: (i / width) | 0 })
  while (head < tail) {
    if (budget && budget.used >= budget.maxNodes) return null
    const ci = queue[head++]!
    if (budget) budget.used++
    const c = coordOf(ci)
    for (const nb of neighbors(c)) {
      const ni = tileIndex(idx.map, nb)
      if (ni < 0 || prev[ni] !== -2) continue
      if (ni === goal) {
        const path: HexCoord[] = [nb]
        let p = ci
        while (p !== start) {
          path.push(coordOf(p))
          p = prev[p]!
        }
        return path.reverse()
      }
      if (!canEnter(type, nb, idx, false)) continue
      prev[ni] = ci
      queue[tail++] = ni
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
  odds: CombatOdds
  attacker: { hp: number; damage: number }
  /** null for a city without defenders */
  defender: { hp: number; damage: number } | null
}

export function attackTargets(
  unit: Unit,
  idx: BoardIndex,
  units: Unit[],
  cities: City[],
  previews: CombatPreview[],
): AttackTarget[] {
  const type = idx.unitType(unit.unitTypeId)
  if (!type || type.strength === 0 || moveBudget(unit) <= 0) return []
  const reach = reachableTiles(unit, idx)
  const origins: HexCoord[] = [
    unit,
    ...[...reach.values()].filter((r) => r.dist < unit.movesLeft).map((r) => r.coord),
  ]
  const inRange = (c: HexCoord) => origins.some((o) => hexDistance(o, c) === 1)
  const coastal = (c: HexCoord) =>
    neighbors(c).some((n) => {
      const t = idx.tileAt(n)
      return !!t && isWater(t.terrain)
    })
  const legal = (enemy: Unit) => {
    const tile = idx.tileAt(enemy)
    const et = idx.unitType(enemy.unitTypeId)
    return !!tile && !!et && canAttack(type, et.domain, tile.terrain, coastal(enemy))
  }
  // Fallback without faction bonuses; the server previews (same formula with bonuses) win
  const attack = type.strength
  const attacker = { hp: unit.hp, damage: type.damage }

  const targets: AttackTarget[] = []
  for (const enemy of units) {
    if (enemy.ownerId === idx.youId || enemy.carriedBy || !inRange(enemy) || !legal(enemy)) continue
    const preview = previews.find((p) => p.attackerUnitId === unit.id && p.targetUnitId === enemy.id)
    const et = idx.unitType(enemy.unitTypeId)!
    const terrain = idx.tileAt(enemy)!.terrain
    const defense = et.defense + terrainDefense(et, terrain) + (idx.cityAt(enemy) ? CITY_DEFENSE : 0)
    const defender = { hp: enemy.hp, damage: et.damage }
    const odds =
      preview?.odds ??
      exchangeOdds(attack, defense, attacker.hp, attacker.damage, defender.hp, defender.damage)
    targets.push({ coord: enemy, unitId: enemy.id, odds, attacker, defender })
  }
  if (type.canCaptureCities) {
    for (const city of cities) {
      if (city.ownerId === idx.youId || !inRange(city)) continue
      if (targets.some((t) => sameHex(t.coord, city))) continue
      const preview = previews.find((p) => p.attackerUnitId === unit.id && p.targetCityId === city.id)
      const odds = preview?.odds ?? cityAttackOdds(attack / (attack + CITY_DEFENSE), attacker.hp)
      targets.push({ coord: city, cityId: city.id, odds, attacker, defender: null })
    }
  }
  return targets
}
