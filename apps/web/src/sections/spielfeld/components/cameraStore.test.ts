import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCameraStore, useCameraRange, useCameraValue } from './cameraStore'

/** requestAnimationFrame stand-in: frames run when the test calls `tick(ts)` */
function fakeFrames() {
  const queue: ((ts: number) => void)[] = []
  vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
    queue.push(cb)
    return queue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => queue.splice(0))
  return {
    tick(ts: number) {
      const cbs = queue.splice(0)
      for (const cb of cbs) cb(ts)
    },
    pending: () => queue.length,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('Kamera-Store', () => {
  it('meldet Änderungen, aber keine gleichen Kameras', () => {
    const store = createCameraStore({ x: 0, y: 0, scale: 1 })
    const seen = vi.fn()
    const off = store.subscribe(seen)
    store.set({ x: 0, y: 0, scale: 1 })
    expect(seen).not.toHaveBeenCalled()
    store.set({ x: 10, y: 0, scale: 1 })
    expect(seen).toHaveBeenCalledWith({ x: 10, y: 0, scale: 1 })
    expect(store.get()).toEqual({ x: 10, y: 0, scale: 1 })
    off()
    store.set({ x: 20, y: 0, scale: 1 })
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('tweent auf requestAnimationFrame und landet genau am Ziel', () => {
    const frames = fakeFrames()
    const store = createCameraStore({ x: 0, y: 0, scale: 1 })
    const seen = vi.fn()
    store.subscribe(seen)
    store.animateTo({ x: 100, y: 200, scale: 2 }, 400)
    expect(frames.pending()).toBe(1)
    frames.tick(1000) // first frame sets the start time
    frames.tick(1200) // halfway: eased, strictly between start and target
    const mid = store.get()
    expect(mid.x).toBeGreaterThan(0)
    expect(mid.x).toBeLessThan(100)
    expect(mid.scale).toBeGreaterThan(1)
    frames.tick(1400)
    expect(store.get()).toEqual({ x: 100, y: 200, scale: 2 })
    expect(frames.pending()).toBe(0)
    expect(seen).toHaveBeenCalled()
  })

  it('bricht die Animation ab, wenn die Kamera direkt gesetzt wird', () => {
    const frames = fakeFrames()
    const store = createCameraStore({ x: 0, y: 0, scale: 1 })
    store.animateTo({ x: 100, y: 0, scale: 1 }, 400)
    frames.tick(1000)
    frames.tick(1100)
    store.set({ x: -50, y: 0, scale: 1 })
    expect(frames.pending()).toBe(0)
    frames.tick(1400)
    expect(store.get()).toEqual({ x: -50, y: 0, scale: 1 })
  })

  it('springt ohne requestAnimationFrame sofort ans Ziel', () => {
    vi.stubGlobal('requestAnimationFrame', undefined)
    const store = createCameraStore({ x: 0, y: 0, scale: 1 })
    store.animateTo({ x: 100, y: 0, scale: 1 })
    expect(store.get()).toEqual({ x: 100, y: 0, scale: 1 })
  })

  it('liefert den Wert als React-State', () => {
    const store = createCameraStore({ x: 1, y: 2, scale: 3 })
    const { result } = renderHook(() => useCameraValue(store))
    expect(result.current).toEqual({ x: 1, y: 2, scale: 3 })
    act(() => store.set({ x: 4, y: 5, scale: 6 }))
    expect(result.current).toEqual({ x: 4, y: 5, scale: 6 })
  })

  it('aktualisiert den Feldbereich erst ab zwei Feldern Verschiebung', () => {
    const store = createCameraStore({ x: 0, y: 0, scale: 1 })
    const map = { width: 100, height: 100 }
    const viewport = { width: 1280, height: 720 }
    const { result } = renderHook(() => useCameraRange(store, viewport, map, 3))
    const first = result.current!
    expect(first.minCol).toBe(0)
    expect(first.maxCol).toBeGreaterThan(15)
    // less than a column (69 px) to the left: same state object
    act(() => store.set({ x: -60, y: 0, scale: 1 }))
    expect(result.current).toBe(first)
    // three columns: a new range
    act(() => store.set({ x: -210, y: 0, scale: 1 }))
    expect(result.current).not.toBe(first)
    expect(result.current!.maxCol).toBeGreaterThan(first.maxCol)
  })

  it('kennt ohne Viewport keinen Bereich (jsdom rendert alles)', () => {
    const store = createCameraStore()
    const { result } = renderHook(() => useCameraRange(store, { width: 0, height: 0 }, { width: 10, height: 10 }))
    expect(result.current).toBeNull()
    act(() => store.set({ x: -500, y: -500, scale: 2 }))
    expect(result.current).toBeNull()
  })
})
