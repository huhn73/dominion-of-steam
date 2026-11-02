import type { City, GameMap, Terrain } from '@dos/shared/game'
import { hexKey } from '@dos/shared/game/hex'
import { terrainAt, visibilityAt } from '@dos/shared/game/mapcodec'
import { AMBIENCE_IDS, type AmbienceId } from './ids'
import {
  type Camera,
  DEFAULT_MIN_SCALE,
  MAX_SCALE,
  visibleTileRange,
} from '../sections/spielfeld/components/camera'

export type { Camera }

export interface AmbienceResult {
  /** Normalised shares, sum 1 (all 0 when nothing is visible) */
  mix: Record<AmbienceId, number>
  /** 0 = zoomed out, 1 = zoomed in */
  zoom: number
}

const TERRAIN_LOOP: Record<Terrain, AmbienceId> = {
  deepSea: 'amb-sea',
  shallows: 'amb-coast',
  plains: 'amb-plains',
  forest: 'amb-forest',
  hills: 'amb-mountains',
  mountains: 'amb-mountains',
}

export const emptyMix = (): Record<AmbienceId, number> =>
  Object.fromEntries(AMBIENCE_IDS.map((id) => [id, 0])) as Record<AmbienceId, number>

/**
 * Zoom on a logarithmic scale between the camera's bounds: halving the scale sounds like the
 * same step wherever it happens. Without bounds the default limits of the camera apply.
 */
export function zoomLevel(
  scale: number,
  bounds: { min: number; max: number } = { min: DEFAULT_MIN_SCALE, max: MAX_SCALE },
) {
  const lo = Math.log(Math.max(bounds.min, 1e-6))
  const hi = Math.log(Math.max(bounds.max, bounds.min * 1.0001, 1e-6))
  if (hi <= lo) return 1
  return Math.min(1, Math.max(0, (Math.log(Math.max(scale, 1e-6)) - lo) / (hi - lo)))
}

/**
 * Ambience loops weighted by the terrain shares in the visible part of the map (audio brief):
 * cities count as city, unexplored tiles as fog. The caller scales the result by the zoom.
 */
export function ambienceMix(input: {
  map: GameMap
  cities: readonly City[]
  camera: Camera
  viewport: { width: number; height: number }
  /** Zoom limits of the board (see scaleBounds); defaults to the fixed limits */
  bounds?: { min: number; max: number }
}): AmbienceResult {
  const { map, camera, viewport } = input
  const mix = emptyMix()
  const zoom = zoomLevel(camera.scale, input.bounds)
  if (map.width <= 0 || map.height <= 0) return { mix, zoom }
  const range = visibleTileRange(camera, viewport, map, 1)
  if (!range || range.minCol > range.maxCol || range.minRow > range.maxRow) return { mix, zoom }

  const cityAt = new Set(input.cities.map((c) => hexKey(c)))
  let total = 0
  for (let row = range.minRow; row <= range.maxRow; row++) {
    for (let col = range.minCol; col <= range.maxCol; col++) {
      const c = { col, row }
      const terrain = terrainAt(map, c)
      if (!terrain) continue
      total++
      if (visibilityAt(map, c) === 'unexplored') mix['amb-fog'] += 1
      else if (cityAt.has(hexKey(c))) mix['amb-city'] += 1
      else mix[TERRAIN_LOOP[terrain]] += 1
    }
  }
  if (total === 0) return { mix, zoom }
  for (const id of AMBIENCE_IDS) mix[id] = mix[id] / total
  return { mix, zoom }
}

/** Loudness factor by zoom: 40 % zoomed out, full when zoomed in */
export const zoomLoudness = (zoom: number) => 0.4 + 0.6 * zoom

/** True when any share moved by more than `threshold` */
export function mixChanged(
  a: Record<AmbienceId, number> | null,
  b: Record<AmbienceId, number>,
  threshold = 0.02,
) {
  if (!a) return true
  return AMBIENCE_IDS.some((id) => Math.abs(a[id] - b[id]) > threshold)
}
