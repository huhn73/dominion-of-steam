import type { HexCoord } from '../types'
import { HEX_SIZE, pixelToHex } from './hex'

/** Screen = world × scale + (x, y); world coordinates are hex pixels (see hexToPixel) */
export interface Camera {
  x: number
  y: number
  scale: number
}

export interface Viewport {
  width: number
  height: number
}

export interface TileRange {
  minCol: number
  maxCol: number
  minRow: number
  maxRow: number
}

type MapSize = { width: number; height: number }

/** Pixel size of the map in world units (same formula as mapPixelSize, for bare dimensions) */
export function mapPixels(map: MapSize) {
  return {
    width: HEX_SIZE * Math.sqrt(3) * (map.width + 0.5),
    height: HEX_SIZE * (1.5 * (map.height - 1) + 2),
  }
}

/**
 * Zoom speed for „Zoom-Empfindlichkeit“ 0–100: 50 is the board's own behaviour (1), 0 half and
 * 100 double. Mouse wheel: steps per wheel event; pinch: exponent on the finger distance ratio.
 */
export const zoomSpeed = (sensitivity: number) => 2 ** ((sensitivity - 50) / 50)

export const MAX_SCALE = 2.4
/** Smallest zoom when the whole map still would not fit at it */
export const DEFAULT_MIN_SCALE = 0.45

const hasViewport = (v: Viewport) => v.width > 0 && v.height > 0

/** Scale at which the whole map fits into the viewport (0 for an unmeasured viewport) */
export function fitScale(viewport: Viewport, map: MapSize): number {
  if (!hasViewport(viewport)) return 0
  const size = mapPixels(map)
  return Math.min(viewport.width / size.width, viewport.height / size.height)
}

/** Zoom limits: the player may always zoom out far enough to see the whole map */
export function scaleBounds(viewport: Viewport, map: MapSize): { min: number; max: number } {
  const fit = fitScale(viewport, map)
  const min = fit > 0 ? Math.min(DEFAULT_MIN_SCALE, fit) : DEFAULT_MIN_SCALE
  return { min, max: MAX_SCALE }
}

const clampNumber = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Keeps the map on screen: an edge of the map may come up to the middle of the screen, a map
 * smaller than the viewport on one axis is centred on it. Without a measured viewport (jsdom)
 * the camera is returned unchanged.
 */
export function clampCamera(cam: Camera, viewport: Viewport, map: MapSize): Camera {
  if (!hasViewport(viewport)) return cam
  const { min, max } = scaleBounds(viewport, map)
  const scale = clampNumber(cam.scale, min, max)
  const size = mapPixels(map)
  const w = size.width * scale
  const h = size.height * scale
  const x = w <= viewport.width ? (viewport.width - w) / 2 : clampNumber(cam.x, viewport.width / 2 - w, viewport.width / 2)
  const y = h <= viewport.height ? (viewport.height - h) / 2 : clampNumber(cam.y, viewport.height / 2 - h, viewport.height / 2)
  if (x === cam.x && y === cam.y && scale === cam.scale) return cam
  return { x, y, scale }
}

/** Zooms so that the world point under screen point (sx, sy) stays put, then clamps */
export function zoomAt(cam: Camera, sx: number, sy: number, nextScale: number, viewport: Viewport, map: MapSize): Camera {
  const { min, max } = scaleBounds(viewport, map)
  const scale = clampNumber(nextScale, min, max)
  const wx = (sx - cam.x) / cam.scale
  const wy = (sy - cam.y) / cam.scale
  return clampCamera({ scale, x: sx - wx * scale, y: sy - wy * scale }, viewport, map)
}

/** Whole map centred in the viewport („Karte einpassen“); unchanged camera without a viewport */
export function fitCamera(cam: Camera, viewport: Viewport, map: MapSize): Camera {
  if (!hasViewport(viewport)) return cam
  const scale = clampNumber(fitScale(viewport, map), scaleBounds(viewport, map).min, MAX_SCALE)
  const size = mapPixels(map)
  return {
    scale,
    x: (viewport.width - size.width * scale) / 2,
    y: (viewport.height - size.height * scale) / 2,
  }
}

/** Camera that centres the world point (px, py) on the screen, clamped */
export function centerCamera(cam: Camera, px: number, py: number, viewport: Viewport, map: MapSize): Camera {
  return clampCamera(
    { ...cam, x: viewport.width / 2 - px * cam.scale, y: viewport.height / 2 - py * cam.scale },
    viewport,
    map,
  )
}

/**
 * Tiles under the viewport, padded by `pad` tiles and clipped to the map. Null without a
 * measured viewport, so callers render everything (tests in jsdom); an empty range has
 * minCol > maxCol.
 */
export function visibleTileRange(cam: Camera, viewport: Viewport, map: MapSize, pad = 1): TileRange | null {
  if (!hasViewport(viewport)) return null
  const toWorld = (sx: number, sy: number): HexCoord =>
    pixelToHex((sx - cam.x) / cam.scale, (sy - cam.y) / cam.scale)
  const corners = [
    toWorld(0, 0),
    toWorld(viewport.width, 0),
    toWorld(0, viewport.height),
    toWorld(viewport.width, viewport.height),
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
    minCol: Math.max(0, minCol - pad),
    maxCol: Math.min(map.width - 1, maxCol + pad),
    minRow: Math.max(0, minRow - pad),
    maxRow: Math.min(map.height - 1, maxRow + pad),
  }
}

export const inRange = (range: TileRange | null, c: HexCoord) =>
  !range || (c.col >= range.minCol && c.col <= range.maxCol && c.row >= range.minRow && c.row <= range.maxRow)

export const cameraEquals = (a: Camera, b: Camera) => a.x === b.x && a.y === b.y && a.scale === b.scale

/** True when an edge of the range moved by at least `threshold` tiles (or null-ness changed) */
export function rangeMoved(a: TileRange | null, b: TileRange | null, threshold = 2) {
  if (!a || !b) return a !== b
  return (
    Math.abs(a.minCol - b.minCol) >= threshold ||
    Math.abs(a.maxCol - b.maxCol) >= threshold ||
    Math.abs(a.minRow - b.minRow) >= threshold ||
    Math.abs(a.maxRow - b.maxRow) >= threshold
  )
}
