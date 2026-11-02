import { hexDistance } from '../hex'
import { isWaterCode, tileIndex } from '../mapcodec'
import type { GameState } from './state'
import { exploredOf, visibleIndices } from './visibility'

/** A land tile belongs to the nearest known city within this distance */
const TERRITORY_RADIUS = 3

/**
 * Coarse ownership map of what `viewerId` knows (fog of war), one string per row: `~` water or
 * unexplored, `.` neutral land, a digit = `indexOf(ownerId)` (only 0–9, otherwise neutral).
 * The resolution `cols × rows` is independent of the map size; each cell samples the tile under
 * its centre. Territory = land around a city the viewer knows, with the owner as last seen.
 */
export function miniMap(
  state: GameState,
  viewerId: string,
  indexOf: (participantId: string) => number,
  cols: number,
  rows: number,
): string[] {
  const viewer = state.participants.find((p) => p.id === viewerId)
  if (!viewer) return []
  const explored = exploredOf(viewer, state.map)
  const visible = visibleIndices(state, viewerId)
  const cities = state.cities
    .filter((c) => viewerId in c.knownBy && explored[tileIndex(state.map, c)] === 1)
    .map((c) => ({
      col: c.col,
      row: c.row,
      ownerId: visible.has(tileIndex(state.map, c)) ? c.ownerId : (c.knownBy[viewerId] ?? null),
    }))
  const { width, height } = state.map

  const result: string[] = []
  for (let y = 0; y < rows; y++) {
    let line = ''
    for (let x = 0; x < cols; x++) {
      const col = Math.min(width - 1, Math.floor(((x + 0.5) * width) / cols))
      const row = Math.min(height - 1, Math.floor(((y + 0.5) * height) / rows))
      const tile = { col, row }
      const i = row * width + col
      if (explored[i] !== 1 || isWaterCode(state.map.terrain[i])) {
        line += '~'
        continue
      }
      let best: (typeof cities)[number] | null = null
      let bestDist = Infinity
      for (const c of cities) {
        const d = hexDistance(c, tile)
        if (d <= TERRITORY_RADIUS && d < bestDist) {
          best = c
          bestDist = d
        }
      }
      const index = best?.ownerId ? indexOf(best.ownerId) : -1
      line += index >= 0 && index <= 9 ? String(index) : '.'
    }
    result.push(line)
  }
  return result
}
