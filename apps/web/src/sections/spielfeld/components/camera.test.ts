import { describe, expect, it } from 'vitest'
import {
  cameraEquals,
  centerCamera,
  clampCamera,
  DEFAULT_MIN_SCALE,
  fitCamera,
  fitScale,
  inRange,
  mapPixels,
  MAX_SCALE,
  rangeMoved,
  scaleBounds,
  visibleTileRange,
  zoomAt,
} from './camera'

const viewport = { width: 1280, height: 720 }
const empire = { width: 200, height: 200 }
const small = { width: 10, height: 8 }

describe('Kamera', () => {
  it('passt Imperium auf 1280×720 bei etwa 0,058 ein und begrenzt den Zoom darauf', () => {
    expect(fitScale(viewport, empire)).toBeCloseTo(0.06, 2)
    expect(scaleBounds(viewport, empire)).toEqual({ min: fitScale(viewport, empire), max: MAX_SCALE })
    // a small map never allows zooming out below the default
    expect(scaleBounds(viewport, small).min).toBe(DEFAULT_MIN_SCALE)
    // unmeasured viewport: default limits
    expect(scaleBounds({ width: 0, height: 0 }, empire)).toEqual({ min: DEFAULT_MIN_SCALE, max: MAX_SCALE })
  })

  it('lässt die Kamera ohne gemessenen Viewport unverändert (jsdom)', () => {
    const cam = { x: -5000, y: 9999, scale: 7 }
    expect(clampCamera(cam, { width: 0, height: 0 }, small)).toBe(cam)
    expect(visibleTileRange(cam, { width: 0, height: 0 }, small)).toBeNull()
    expect(fitCamera(cam, { width: 0, height: 0 }, small)).toBe(cam)
  })

  it('lässt den Kartenrand höchstens bis zur Bildschirmmitte', () => {
    const size = mapPixels(empire)
    // far right/bottom beyond the map: the right edge stops at the centre of the screen
    const right = clampCamera({ x: -1e6, y: -1e6, scale: 1 }, viewport, empire)
    expect(right.x).toBeCloseTo(viewport.width / 2 - size.width)
    expect(right.y).toBeCloseTo(viewport.height / 2 - size.height)
    // far left/top: the left edge stops at the centre
    const left = clampCamera({ x: 1e6, y: 1e6, scale: 1 }, viewport, empire)
    expect(left.x).toBe(viewport.width / 2)
    expect(left.y).toBe(viewport.height / 2)
    // inside the band nothing changes (same object)
    const ok = { x: -300, y: -200, scale: 1 }
    expect(clampCamera(ok, viewport, empire)).toBe(ok)
    // scale is clamped to the bounds
    expect(clampCamera({ x: 0, y: 0, scale: 99 }, viewport, empire).scale).toBe(MAX_SCALE)
  })

  it('zentriert Karten, die kleiner als der Viewport sind', () => {
    const size = mapPixels(small)
    const cam = clampCamera({ x: -999, y: 777, scale: 0.5 }, viewport, small)
    expect(cam.x).toBeCloseTo((viewport.width - size.width * 0.5) / 2)
    expect(cam.y).toBeCloseTo((viewport.height - size.height * 0.5) / 2)
  })

  it('zoomt um den Punkt unter dem Zeiger', () => {
    const cam = { x: -2000, y: -2000, scale: 1 }
    const sx = 400
    const sy = 300
    const worldBefore = { x: (sx - cam.x) / cam.scale, y: (sy - cam.y) / cam.scale }
    const next = zoomAt(cam, sx, sy, 2, viewport, empire)
    expect(next.scale).toBe(2)
    expect((sx - next.x) / next.scale).toBeCloseTo(worldBefore.x)
    expect((sy - next.y) / next.scale).toBeCloseTo(worldBefore.y)
    // never beyond the limits
    expect(zoomAt(cam, sx, sy, 100, viewport, empire).scale).toBe(MAX_SCALE)
    expect(zoomAt(cam, sx, sy, 0.0001, viewport, empire).scale).toBeCloseTo(fitScale(viewport, empire))
  })

  it('passt die ganze Karte zentriert ein', () => {
    const cam = fitCamera({ x: 0, y: 0, scale: 1 }, viewport, empire)
    const size = mapPixels(empire)
    expect(cam.scale).toBeCloseTo(fitScale(viewport, empire))
    expect(cam.x + (size.width * cam.scale) / 2).toBeCloseTo(viewport.width / 2)
    expect(cam.y + (size.height * cam.scale) / 2).toBeCloseTo(viewport.height / 2)
    // small maps are not blown up beyond the maximum zoom
    expect(fitCamera({ x: 0, y: 0, scale: 1 }, viewport, { width: 2, height: 2 }).scale).toBe(MAX_SCALE)
  })

  it('zentriert einen Weltpunkt mit Clamping', () => {
    const cam = centerCamera({ x: 0, y: 0, scale: 1 }, 5000, 5000, viewport, empire)
    expect(cam.x).toBeCloseTo(viewport.width / 2 - 5000)
    expect(cam.y).toBeCloseTo(viewport.height / 2 - 5000)
    // a point outside the map still keeps the map edge at the screen centre
    const edge = centerCamera({ x: 0, y: 0, scale: 1 }, -5000, -5000, viewport, empire)
    expect(edge.x).toBe(viewport.width / 2)
  })

  it('liefert den sichtbaren Feldbereich, auf die Karte beschnitten', () => {
    const whole = visibleTileRange({ x: 0, y: 0, scale: 1 }, viewport, empire, 0)!
    expect(whole.minCol).toBe(0)
    expect(whole.minRow).toBe(0)
    // 1280 px at 69 px per column ≈ 18 columns, 720 px at 60 px per row ≈ 12 rows
    expect(whole.maxCol).toBeGreaterThanOrEqual(17)
    expect(whole.maxCol).toBeLessThanOrEqual(20)
    expect(whole.maxRow).toBeGreaterThanOrEqual(11)
    expect(whole.maxRow).toBeLessThanOrEqual(13)
    // padding widens the range, the map edge stops it
    const padded = visibleTileRange({ x: 0, y: 0, scale: 1 }, viewport, empire, 2)!
    expect(padded.maxCol).toBe(whole.maxCol + 2)
    expect(padded.minCol).toBe(0)
    // zoomed out the whole map fits
    const far = visibleTileRange(fitCamera({ x: 0, y: 0, scale: 1 }, viewport, empire), viewport, empire)!
    expect(far).toEqual({ minCol: 0, maxCol: 199, minRow: 0, maxRow: 199 })
    expect(inRange(far, { col: 199, row: 0 })).toBe(true)
    expect(inRange(whole, { col: 150, row: 150 })).toBe(false)
    expect(inRange(null, { col: 150, row: 150 })).toBe(true)
  })

  it('vergleicht Kameras und Bereiche', () => {
    expect(cameraEquals({ x: 1, y: 2, scale: 3 }, { x: 1, y: 2, scale: 3 })).toBe(true)
    expect(cameraEquals({ x: 1, y: 2, scale: 3 }, { x: 1, y: 2, scale: 3.1 })).toBe(false)
    const a = { minCol: 0, maxCol: 10, minRow: 0, maxRow: 10 }
    expect(rangeMoved(a, { ...a, maxCol: 11 })).toBe(false)
    expect(rangeMoved(a, { ...a, maxCol: 12 })).toBe(true)
    expect(rangeMoved(a, null)).toBe(true)
    expect(rangeMoved(null, null)).toBe(false)
  })
})
