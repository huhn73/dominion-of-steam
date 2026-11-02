import { useEffect, useState, useSyncExternalStore } from 'react'
import { type Camera, cameraEquals, rangeMoved, type TileRange, type Viewport, visibleTileRange } from './camera'

/**
 * The camera lives outside React: pan and zoom update the SVG transform, the terrain canvas and
 * the minimap through subscriptions, without re-rendering the board on every pointer move.
 */
export interface CameraStore {
  get(): Camera
  /** Sets the camera at once (stops a running animation) and notifies subscribers on change */
  set(cam: Camera): void
  subscribe(listener: (cam: Camera) => void): () => void
  /** Eased tween to `target` on requestAnimationFrame, so canvas and SVG move together */
  animateTo(target: Camera, ms?: number): void
  /** Stops a running animation where it is */
  stop(): void
}

export const CAMERA_TWEEN_MS = 450

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const raf = (cb: (ts: number) => void): number | null =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : null

export function createCameraStore(initial: Camera = { x: 0, y: 0, scale: 1 }): CameraStore {
  let cam = initial
  const listeners = new Set<(cam: Camera) => void>()
  let frame: number | null = null

  const emit = () => {
    for (const l of listeners) l(cam)
  }
  const stop = () => {
    if (frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    frame = null
  }
  const assign = (next: Camera) => {
    if (cameraEquals(cam, next)) return
    cam = next
    emit()
  }

  return {
    get: () => cam,
    set(next) {
      stop()
      assign(next)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    animateTo(target, ms = CAMERA_TWEEN_MS) {
      stop()
      if (cameraEquals(cam, target)) return
      const from = cam
      let start: number | null = null
      const step = (ts: number) => {
        if (start === null) start = ts
        const t = ms > 0 ? Math.min(1, (ts - start) / ms) : 1
        const k = easeInOut(t)
        assign({
          x: from.x + (target.x - from.x) * k,
          y: from.y + (target.y - from.y) * k,
          scale: from.scale + (target.scale - from.scale) * k,
        })
        if (t < 1) frame = raf(step)
        else frame = null
      }
      frame = raf(step)
      // Without requestAnimationFrame (jsdom without pretendToBeVisual) jump to the target
      if (frame === null) assign(target)
    },
    stop,
  }
}

/** Current camera as React state (re-renders on every change; use sparingly) */
export function useCameraValue(store: CameraStore): Camera {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

/**
 * Tile range under the viewport for culling. React state changes only when an edge of the
 * range moved by two tiles or more; `pad` keeps the overlays ahead of that. Null without a
 * measured viewport.
 */
export function useCameraRange(
  store: CameraStore,
  viewport: Viewport,
  map: { width: number; height: number },
  pad = 3,
): TileRange | null {
  const [range, setRange] = useState<TileRange | null>(() => visibleTileRange(store.get(), viewport, map, pad))
  useEffect(() => {
    let current: TileRange | null = null
    const update = (cam: Camera) => {
      const next = visibleTileRange(cam, viewport, map, pad)
      if (!rangeMoved(current, next)) return
      current = next
      setRange(next)
    }
    // The committed state may be stale after a viewport or map change: recompute once
    current = visibleTileRange(store.get(), viewport, map, pad)
    setRange((prev) => (rangeMoved(prev, current, 1) ? current : prev))
    return store.subscribe(update)
  }, [store, viewport, map.width, map.height, pad])
  return range
}
