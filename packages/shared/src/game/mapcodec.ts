import type { GameMap, HexCoord, Terrain, Tile, Visibility } from './types'

/**
 * Compact map encoding shared by the engine, the server and the client: one character per
 * tile, row-major (`row * width + col`). Terrain codes match the ASCII maps of the engine
 * tests, visibility codes are u/e/v.
 */
export const TERRAIN_CODES: Record<Terrain, string> = {
  deepSea: '~',
  shallows: 's',
  plains: '.',
  forest: 'f',
  hills: 'h',
  mountains: 'm',
}
export const TERRAIN_OF_CODE: Record<string, Terrain> = Object.fromEntries(
  Object.entries(TERRAIN_CODES).map(([t, c]) => [c, t as Terrain]),
)
export const VISIBILITY_CODES: Record<Visibility, string> = {
  unexplored: 'u',
  explored: 'e',
  visible: 'v',
}
export const VISIBILITY_OF_CODE: Record<string, Visibility> = {
  u: 'unexplored',
  e: 'explored',
  v: 'visible',
}

export interface CompactMap {
  width: number
  height: number
  terrain: string
}

/** Index of a tile in the strings, -1 outside the map */
export const tileIndex = (map: { width: number; height: number }, c: HexCoord) =>
  c.col >= 0 && c.row >= 0 && c.col < map.width && c.row < map.height
    ? c.row * map.width + c.col
    : -1

export function terrainAt(map: CompactMap, c: HexCoord): Terrain | undefined {
  const i = tileIndex(map, c)
  return i < 0 ? undefined : TERRAIN_OF_CODE[map.terrain[i]!]
}

export function visibilityAt(
  map: { width: number; height: number; visibility: string },
  c: HexCoord,
): Visibility | undefined {
  const i = tileIndex(map, c)
  return i < 0 ? undefined : VISIBILITY_OF_CODE[map.visibility[i]!]
}

export const isWaterCode = (ch: string | undefined) => ch === '~' || ch === 's'

/** Terrain string from a tile list (any order; missing tiles become deep sea) */
export function encodeTerrain(
  tiles: readonly (HexCoord & { terrain: Terrain })[],
  width: number,
  height: number,
): string {
  const codes = new Array<string>(width * height).fill('~')
  for (const t of tiles) {
    const i = tileIndex({ width, height }, t)
    if (i >= 0) codes[i] = TERRAIN_CODES[t.terrain]
  }
  return codes.join('')
}

export function encodeVisibility(
  tiles: readonly (HexCoord & { visibility: Visibility })[],
  width: number,
  height: number,
): string {
  const codes = new Array<string>(width * height).fill('u')
  for (const t of tiles) {
    const i = tileIndex({ width, height }, t)
    if (i >= 0) codes[i] = VISIBILITY_CODES[t.visibility]
  }
  return codes.join('')
}

/** Compact map from the old tile-list shape (sample data, stored states) */
export function packMap(map: {
  width: number
  height: number
  seed: string
  tiles: Tile[]
}): GameMap {
  return {
    width: map.width,
    height: map.height,
    seed: map.seed,
    terrain: encodeTerrain(map.tiles, map.width, map.height),
    visibility: encodeVisibility(map.tiles, map.width, map.height),
  }
}

/** Tile objects in row-major order (for consumers that need the old shape) */
export function expandMap(map: GameMap): Tile[] {
  const tiles = new Array<Tile>(map.width * map.height)
  for (let row = 0; row < map.height; row++)
    for (let col = 0; col < map.width; col++) {
      const i = row * map.width + col
      tiles[i] = {
        col,
        row,
        terrain: TERRAIN_OF_CODE[map.terrain[i]!] ?? 'deepSea',
        visibility: VISIBILITY_OF_CODE[map.visibility[i]!] ?? 'unexplored',
      }
    }
  return tiles
}
