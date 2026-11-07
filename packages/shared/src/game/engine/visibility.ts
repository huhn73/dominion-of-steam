import { decodeBits, encodeBits } from '../bits'
import { hexDistance, isWater, neighbors, sameHex } from '../hex'
import { endsMovement, sightRadius } from '../rules'
import { terrainAt as terrainOf, tileIndex } from '../mapcodec'
import type { HexCoord } from '../types'
import {
  type GameState,
  type ParticipantState,
  type Sighting,
  unitType,
  type UnitState,
} from './state'

/** Sight radius of a unit where it stands (land units see further from hills and mountains) */
export function unitSight(state: GameState, u: UnitState): number {
  return sightRadius(unitType(u.unitTypeId), terrainOf(state.map, u))
}

/** Whether entering the tile uses up the unit's remaining moves (vehicles in rough terrain) */
export function stopsAt(state: GameState, unitTypeId: string, c: HexCoord): boolean {
  const terrain = terrainOf(state.map, c)
  const city = state.cities.some((x) => sameHex(x, c))
  return !!terrain && endsMovement(unitType(unitTypeId), terrain, city)
}

/** Tile indices of all tiles the participant currently sees */
export function visibleIndices(state: GameState, participantId: string): Set<number> {
  const sources: { at: HexCoord; radius: number }[] = []
  for (const u of state.units) {
    if (u.ownerId !== participantId || u.carriedBy) continue
    sources.push({ at: u, radius: unitSight(state, u) })
  }
  for (const c of state.cities) {
    if (c.ownerId === participantId) sources.push({ at: c, radius: 1 })
  }
  const visible = new Set<number>()
  const { width, height } = state.map
  for (const { at, radius } of sources) {
    for (
      let row = Math.max(0, at.row - radius);
      row <= Math.min(height - 1, at.row + radius);
      row++
    ) {
      for (
        let col = Math.max(0, at.col - radius);
        col <= Math.min(width - 1, at.col + radius);
        col++
      ) {
        if (hexDistance(at, { col, row }) <= radius) visible.add(row * width + col)
      }
    }
  }
  return visible
}

/** hexKeys of all tiles the participant currently sees */
export function visibleTiles(state: GameState, participantId: string): Set<string> {
  const { width } = state.map
  const keys = new Set<string>()
  for (const i of visibleIndices(state, participantId)) keys.add(`${i % width},${(i / width) | 0}`)
  return keys
}

// ---------------------------------------------------------------------------
// Explored tiles: a bitset string on the participant, decoded on demand and re-encoded only
// when a bit changed. The cache follows the string, so cloned or test-built states work.
// ---------------------------------------------------------------------------

interface ExploredCache {
  source: string
  bits: Uint8Array
  dirty: boolean
}
const exploredCache = new WeakMap<ParticipantState, ExploredCache>()

function exploredBits(p: ParticipantState, n: number): ExploredCache {
  let entry = exploredCache.get(p)
  if (!entry || entry.source !== p.explored) {
    entry = { source: p.explored, bits: decodeBits(p.explored, n), dirty: false }
    exploredCache.set(p, entry)
  }
  return entry
}

export function isExplored(
  p: ParticipantState,
  map: { width: number; height: number },
  c: HexCoord,
) {
  const i = tileIndex(map, c)
  return i >= 0 && exploredBits(p, map.width * map.height).bits[i] === 1
}

function markExplored(p: ParticipantState, n: number, indices: Iterable<number>) {
  const entry = exploredBits(p, n)
  for (const i of indices) {
    if (entry.bits[i] === 0) {
      entry.bits[i] = 1
      entry.dirty = true
    }
  }
  if (entry.dirty) {
    p.explored = encodeBits(entry.bits)
    entry.source = p.explored
    entry.dirty = false
  }
}

/** Everything explored (tests, demo) */
export function markAllExplored(p: ParticipantState, map: { width: number; height: number }) {
  markExplored(
    p,
    map.width * map.height,
    Array.from({ length: map.width * map.height }, (_, i) => i),
  )
}

/** Decoded explored bits (read-only use, e.g. when projecting the view) */
export const exploredOf = (p: ParticipantState, map: { width: number; height: number }) =>
  exploredBits(p, map.width * map.height).bits

/** Add visible tiles to every participant's explored set and refresh what they know about cities */
export function updateKnowledge(state: GameState) {
  const n = state.map.width * state.map.height
  for (const p of state.participants) {
    if (p.status !== 'active') continue
    const visible = visibleIndices(state, p.id)
    markExplored(p, n, visible)
    for (const c of state.cities) {
      if (visible.has(tileIndex(state.map, c))) c.knownBy[p.id] = c.ownerId
    }
  }
}

/** What the participant knows right now: known cities with their last seen owner, visible foreign units */
export function sightingSnapshot(state: GameState, participantId: string): Sighting {
  const visible = visibleIndices(state, participantId)
  return {
    cities: Object.fromEntries(
      state.cities
        .filter((c) => participantId in c.knownBy)
        .map((c) => [c.id, c.knownBy[participantId] ?? null]),
    ),
    unitIds: state.units
      .filter((u) => seesUnit(state, participantId, u, (x) => visible.has(tileIndex(state.map, x))))
      .map((u) => u.id),
  }
}

export function tileAt(state: GameState, c: HexCoord) {
  const terrain = terrainOf(state.map, c)
  return terrain ? { col: c.col, row: c.row, terrain } : undefined
}

export function isCoastal(state: GameState, c: HexCoord) {
  return neighbors(c).some((n) => {
    const t = terrainOf(state.map, n)
    return !!t && isWater(t)
  })
}

/** Unit types that stay hidden from enemies (submarines) */
export const STEALTH_UNIT_TYPES = new Set(['tauchboot'])
/** How far a submarine detects enemy submarines */
const SONAR_RANGE = 2

/**
 * Whether a unit is hidden from the viewer even on a visible tile: an enemy submarine in deep
 * sea is only seen by a submarine of the viewer close by, or after a unit of the viewer ran
 * into it. In shallows it is always seen.
 */
export function hiddenFrom(
  state: GameState,
  viewerId: string,
  u: { ownerId: string; unitTypeId: string; col: number; row: number; revealedTo?: string[] },
): boolean {
  if (u.ownerId === viewerId || !STEALTH_UNIT_TYPES.has(u.unitTypeId)) return false
  if (u.revealedTo?.includes(viewerId)) return false
  if (terrainOf(state.map, u) === 'shallows') return false
  return !state.units.some(
    (o) =>
      o.ownerId === viewerId &&
      !o.carriedBy &&
      STEALTH_UNIT_TYPES.has(o.unitTypeId) &&
      hexDistance(o, u) <= SONAR_RANGE,
  )
}

/** Foreign units the viewer sees: on a visible tile, not carried, not a hidden submarine */
export function seesUnit(
  state: GameState,
  viewerId: string,
  u: UnitState,
  visibleAt: (u: UnitState) => boolean,
): boolean {
  return u.ownerId !== viewerId && !u.carriedBy && visibleAt(u) && !hiddenFrom(state, viewerId, u)
}
