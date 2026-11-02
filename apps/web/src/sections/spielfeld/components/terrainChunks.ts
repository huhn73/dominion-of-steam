import type { HexCoord, Terrain } from '../types'
import type { Camera, TileRange, Viewport } from './camera'
import { HEX_SIZE, hexToPixel, pixelToHex } from './hex'
import { TERRAIN_OF_CODE } from '@dos/shared/game/mapcodec'

/**
 * Terrain and fog are painted on a canvas in square chunks of CHUNK_PX device pixels, one
 * pyramid level per power-of-two zoom. Everything here is pure geometry and drawing so the
 * canvas component only manages the cache and the frame budget.
 */
export const CHUNK_PX = 512
/** Extra device pixels around a chunk so scaled chunks do not show seams */
export const CHUNK_PAD = 2
export const MIN_LEVEL = 1 / 16
export const MAX_LEVEL = 2

const SQRT3 = Math.sqrt(3)
/** Half width and height of a hex in world units (the SVG drew hexes slightly oversized) */
const HEX_HALF_W = (HEX_SIZE + 0.6) * (SQRT3 / 2)
const HEX_HALF_H = HEX_SIZE + 0.6

export interface ChunkCoord {
  cx: number
  cy: number
}

export interface WorldRect {
  x: number
  y: number
  width: number
  height: number
}

type MapSize = { width: number; height: number }

/** Device pixels per world unit of the chunk level nearest to the camera's zoom */
export function levelFor(scale: number, dpr: number): number {
  const wanted = Math.max(scale, 1e-6) * Math.max(dpr, 1e-6)
  const level = Math.pow(2, Math.round(Math.log2(wanted)))
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level))
}

/** World units covered by one chunk at this level */
export const chunkWorldSize = (level: number) => CHUNK_PX / level

export function chunkRect(level: number, chunk: ChunkCoord): WorldRect {
  const size = chunkWorldSize(level)
  return { x: chunk.cx * size, y: chunk.cy * size, width: size, height: size }
}

/** Number of chunks the map needs along each axis at this level */
export function chunkGrid(level: number, mapPixels: { width: number; height: number }) {
  const size = chunkWorldSize(level)
  return { cols: Math.ceil(mapPixels.width / size), rows: Math.ceil(mapPixels.height / size) }
}

/** Chunks under the viewport at this level, clipped to the map, nearest to the centre first */
export function chunksInView(
  cam: Camera,
  viewport: Viewport,
  level: number,
  mapPixels: { width: number; height: number },
): ChunkCoord[] {
  if (viewport.width <= 0 || viewport.height <= 0) return []
  const size = chunkWorldSize(level)
  const grid = chunkGrid(level, mapPixels)
  const wx0 = -cam.x / cam.scale
  const wy0 = -cam.y / cam.scale
  const wx1 = (viewport.width - cam.x) / cam.scale
  const wy1 = (viewport.height - cam.y) / cam.scale
  const cx0 = Math.max(0, Math.floor(wx0 / size))
  const cx1 = Math.min(grid.cols - 1, Math.floor(wx1 / size))
  const cy0 = Math.max(0, Math.floor(wy0 / size))
  const cy1 = Math.min(grid.rows - 1, Math.floor(wy1 / size))
  const out: ChunkCoord[] = []
  const mx = (wx0 + wx1) / 2
  const my = (wy0 + wy1) / 2
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) out.push({ cx, cy })
  const dist = (c: ChunkCoord) => Math.hypot((c.cx + 0.5) * size - mx, (c.cy + 0.5) * size - my)
  return out.sort((a, b) => dist(a) - dist(b))
}

/** Tiles whose hex may touch the world rect (one tile of margin), clipped to the map */
export function tileRangeForWorldRect(rect: WorldRect, map: MapSize, margin = 1): TileRange {
  const corners = [
    pixelToHex(rect.x, rect.y),
    pixelToHex(rect.x + rect.width, rect.y),
    pixelToHex(rect.x, rect.y + rect.height),
    pixelToHex(rect.x + rect.width, rect.y + rect.height),
  ]
  let minCol = Infinity
  let maxCol = -Infinity
  let minRow = Infinity
  let maxRow = -Infinity
  for (const c of corners) {
    minCol = Math.min(minCol, c.col)
    maxCol = Math.max(maxCol, c.col)
    minRow = Math.min(minRow, c.row)
    maxRow = Math.max(maxRow, c.row)
  }
  return {
    minCol: Math.max(0, minCol - margin),
    maxCol: Math.min(map.width - 1, maxCol + margin),
    minRow: Math.max(0, minRow - margin),
    maxRow: Math.min(map.height - 1, maxRow + margin),
  }
}

/** Chunks at this level that the hex of a tile touches (one to four) */
export function chunksForTile(level: number, c: HexCoord): ChunkCoord[] {
  const size = chunkWorldSize(level)
  const { x, y } = hexToPixel(c)
  const cx0 = Math.floor((x - HEX_HALF_W) / size)
  const cx1 = Math.floor((x + HEX_HALF_W) / size)
  const cy0 = Math.floor((y - HEX_HALF_H) / size)
  const cy1 = Math.floor((y + HEX_HALF_H) / size)
  const out: ChunkCoord[] = []
  for (let cy = Math.max(0, cy0); cy <= cy1; cy++)
    for (let cx = Math.max(0, cx0); cx <= cx1; cx++) out.push({ cx, cy })
  return out
}

/** Indices whose visibility code changed between two map strings */
export function diffVisibility(prev: string, next: string): number[] {
  const out: number[] = []
  if (prev.length !== next.length) {
    for (let i = 0; i < next.length; i++) out.push(i)
    return out
  }
  for (let i = 0; i < next.length; i++) if (prev.charCodeAt(i) !== next.charCodeAt(i)) out.push(i)
  return out
}

export interface Detail {
  /** Below six device pixels per hex a rectangle is enough */
  shape: 'rect' | 'hex'
  /** Hex outline from ten pixels */
  stroke: boolean
  /** Forest, hills, mountains and waves from twenty pixels */
  glyphs: boolean
}

export function detailFor(level: number): Detail {
  const hexPx = HEX_SIZE * SQRT3 * level
  return { shape: hexPx < 6 ? 'rect' : 'hex', stroke: hexPx >= 10, glyphs: hexPx >= 20 }
}

export interface Palette {
  fill: Record<Terrain, string>
  stroke: string
  unexplored: string
  hatch: string
  explored: string
  forest: string
  hills: string
  mountainLeft: string
  mountainSnow: string
  mountainRight: string
  wave: string
}

/** Colours of the former SVG terrain layer: parchment chart in light, soot and brass in dark */
export const PALETTE: Record<'light' | 'dark', Palette> = {
  light: {
    fill: {
      deepSea: '#5f8f8b',
      shallows: '#8fbab0',
      plains: '#ead9ae',
      forest: '#b6b97f',
      hills: '#d9b77c',
      mountains: '#a89a88',
    },
    stroke: 'rgba(74,63,51,0.15)',
    unexplored: '#3b3530',
    hatch: 'rgba(168,162,158,0.12)',
    explored: 'rgba(43,36,32,0.45)',
    forest: '#6f7a45',
    hills: '#9c7840',
    mountainLeft: '#7a6e62',
    mountainSnow: '#f5f0e6',
    mountainRight: '#8b7f72',
    wave: 'rgba(230,240,234,0.35)',
  },
  dark: {
    fill: {
      deepSea: '#0f2e33',
      shallows: '#1f4f50',
      plains: '#5d5541',
      forest: '#3e4a2f',
      hills: '#6b5434',
      mountains: '#4a443d',
    },
    stroke: 'rgba(0,0,0,0.3)',
    unexplored: '#0c0a09',
    hatch: 'rgba(168,162,158,0.12)',
    explored: 'rgba(0,0,0,0.55)',
    forest: '#25301b',
    hills: '#3d2f1c',
    mountainLeft: '#2d2925',
    mountainSnow: '#8b847a',
    mountainRight: '#38332e',
    wave: 'rgba(94,234,212,0.15)',
  },
}

/** Path2D objects for the hex and the glyphs (built once; Path2D is missing in jsdom) */
export interface TerrainPaths {
  hex: Path2D
  forest: Path2D
  hills: Path2D
  mountainLeft: Path2D
  mountainSnow: Path2D
  mountainRight: Path2D
  wave: Path2D
}

let cachedPaths: TerrainPaths | null = null

export function terrainPaths(): TerrainPaths | null {
  if (cachedPaths) return cachedPaths
  if (typeof Path2D === 'undefined') return null
  const hex = new Path2D()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    const px = (HEX_SIZE + 0.6) * Math.cos(a)
    const py = (HEX_SIZE + 0.6) * Math.sin(a)
    if (i === 0) hex.moveTo(px, py)
    else hex.lineTo(px, py)
  }
  hex.closePath()
  cachedPaths = {
    hex,
    forest: new Path2D('M-15 7 l6 -13 l6 13 z M-3 3 l7 -15 l7 15 z M5 13 l5 -11 l5 11 z'),
    hills: new Path2D('M-16 6 q8 -12 16 0 M-2 12 q7 -10 14 0'),
    mountainLeft: new Path2D('M-17 12 L-5 -10 L7 12 Z'),
    mountainSnow: new Path2D('M-5 -10 L-1 -3 L-6 -1 L-9 -3 Z'),
    mountainRight: new Path2D('M1 12 L10 -3 L19 12 Z'),
    wave: new Path2D('M-11 2 q3 -4 6 0 t6 0 t6 0'),
  }
  return cachedPaths
}

/** Diagonal hatch for unexplored tiles, like the former `#dos-hatch` SVG pattern (8 px period) */
export function makeHatch(ctx: CanvasRenderingContext2D, color: string): CanvasPattern | null {
  const doc = typeof document !== 'undefined' ? document : null
  if (!doc) return null
  const tile = doc.createElement('canvas')
  tile.width = 8
  tile.height = 8
  const c = tile.getContext('2d')
  if (!c) return null
  c.strokeStyle = color
  c.lineWidth = 2
  c.beginPath()
  // one diagonal line per period, drawn across the corners so the tiles join seamlessly
  c.moveTo(-2, 6)
  c.lineTo(6, -2)
  c.moveTo(2, 10)
  c.lineTo(10, 2)
  c.stroke()
  return ctx.createPattern(tile, 'repeat')
}

export interface TileStyle {
  palette: Palette
  hatch: CanvasPattern | null
  paths: TerrainPaths | null
  detail: Detail
}

/**
 * Draws one tile at its world position on a context whose transform already maps world units
 * to the chunk. Terrain fill, glyph, and fog on top (dark hatch when unexplored, a dim veil
 * when only explored).
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  c: HexCoord,
  terrainCode: string,
  visibilityCode: string,
  style: TileStyle,
) {
  const { palette, paths, detail } = style
  const terrain = TERRAIN_OF_CODE[terrainCode] ?? 'deepSea'
  const { x, y } = hexToPixel(c)
  const unexplored = visibilityCode === 'u'
  const fill = unexplored ? palette.unexplored : palette.fill[terrain]

  if (detail.shape === 'rect' || !paths) {
    ctx.fillStyle = fill
    ctx.fillRect(x - HEX_HALF_W, y - HEX_HALF_H * 0.75, HEX_HALF_W * 2, HEX_HALF_H * 1.5)
    if (visibilityCode === 'e') {
      ctx.fillStyle = palette.explored
      ctx.fillRect(x - HEX_HALF_W, y - HEX_HALF_H * 0.75, HEX_HALF_W * 2, HEX_HALF_H * 1.5)
    }
    return
  }

  ctx.translate(x, y)
  ctx.fillStyle = fill
  ctx.fill(paths.hex)
  if (unexplored) {
    if (style.hatch) {
      ctx.fillStyle = style.hatch
      ctx.fill(paths.hex)
    }
  } else {
    if (detail.stroke) {
      ctx.strokeStyle = palette.stroke
      ctx.lineWidth = 1
      ctx.stroke(paths.hex)
    }
    if (detail.glyphs) drawGlyph(ctx, terrain, c, palette, paths)
    if (visibilityCode === 'e') {
      ctx.fillStyle = palette.explored
      ctx.fill(paths.hex)
    }
  }
  ctx.translate(-x, -y)
}

function drawGlyph(ctx: CanvasRenderingContext2D, terrain: Terrain, c: HexCoord, palette: Palette, paths: TerrainPaths) {
  switch (terrain) {
    case 'forest':
      ctx.fillStyle = palette.forest
      ctx.fill(paths.forest)
      return
    case 'hills':
      ctx.strokeStyle = palette.hills
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.stroke(paths.hills)
      return
    case 'mountains':
      ctx.fillStyle = palette.mountainLeft
      ctx.fill(paths.mountainLeft)
      ctx.fillStyle = palette.mountainSnow
      ctx.fill(paths.mountainSnow)
      ctx.fillStyle = palette.mountainRight
      ctx.fill(paths.mountainRight)
      return
    case 'deepSea':
      // Every third tile shows a wave, same seed as the SVG had
      if ((c.col * 7 + c.row * 13) % 3 === 0) {
        ctx.strokeStyle = palette.wave
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        ctx.stroke(paths.wave)
      }
      return
    default:
      return
  }
}

/** Paints every tile of the map that touches the chunk onto a chunk context (world transform set) */
export function drawChunkTiles(
  ctx: CanvasRenderingContext2D,
  map: { width: number; height: number; terrain: string; visibility: string },
  level: number,
  chunk: ChunkCoord,
  style: TileStyle,
) {
  const range = tileRangeForWorldRect(chunkRect(level, chunk), map)
  for (let row = range.minRow; row <= range.maxRow; row++) {
    const base = row * map.width
    for (let col = range.minCol; col <= range.maxCol; col++) {
      const i = base + col
      drawTile(ctx, { col, row }, map.terrain[i]!, map.visibility[i]!, style)
    }
  }
}
