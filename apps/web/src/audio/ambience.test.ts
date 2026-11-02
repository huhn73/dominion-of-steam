import type { City, GameMap, Terrain } from '@dos/shared/game'
import { hexToPixel } from '@dos/shared/game/hex'
import { TERRAIN_CODES } from '@dos/shared/game/mapcodec'
import { ambienceMix, mixChanged, zoomLevel, zoomLoudness } from './ambience'
import { DEFAULT_MIN_SCALE, MAX_SCALE } from '../sections/spielfeld/components/camera'

function mapOf(
  width: number,
  height: number,
  terrain: (col: number, row: number) => Terrain,
): GameMap {
  let codes = ''
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) codes += TERRAIN_CODES[terrain(col, row)]
  return { width, height, seed: 'x', terrain: codes, visibility: 'v'.repeat(width * height) }
}

const whole = { camera: { x: 0, y: 0, scale: 1 }, viewport: { width: 5000, height: 5000 } }

describe('Ambiente', () => {
  it('gewichtet die Schleifen nach dem Geländeanteil', () => {
    const map = mapOf(4, 2, (col) => (col < 2 ? 'deepSea' : 'forest'))
    const { mix } = ambienceMix({ map, cities: [], ...whole })
    expect(mix['amb-sea']).toBeCloseTo(0.5)
    expect(mix['amb-forest']).toBeCloseTo(0.5)
    expect(mix['amb-city']).toBe(0)
  })

  it('zählt Städte als Stadt und unerforschte Felder als Nebel', () => {
    const map = mapOf(2, 2, () => 'plains')
    map.visibility = 'vvvu'
    const cities = [{ id: 'c', col: 0, row: 0 } as City]
    const { mix } = ambienceMix({ map, cities, ...whole })
    expect(mix['amb-city']).toBeCloseTo(0.25)
    expect(mix['amb-fog']).toBeCloseTo(0.25)
    expect(mix['amb-plains']).toBeCloseTo(0.5)
  })

  it('sieht nur den Kartenausschnitt der Kamera', () => {
    // Left half water, right half mountains; the camera looks at the far right
    const map = mapOf(40, 10, (col) => (col < 20 ? 'deepSea' : 'mountains'))
    const { x, y } = hexToPixel({ col: 36, row: 5 })
    const camera = { x: 200 - x, y: 200 - y, scale: 1 }
    const { mix } = ambienceMix({ map, cities: [], camera, viewport: { width: 400, height: 400 } })
    expect(mix['amb-mountains']).toBeCloseTo(1)
    expect(mix['amb-sea']).toBe(0)
  })

  it('leitet den Zoomfaktor aus der Skalierung ab', () => {
    const map = mapOf(1, 1, () => 'plains')
    expect(
      ambienceMix({
        map,
        cities: [],
        camera: { x: 0, y: 0, scale: DEFAULT_MIN_SCALE },
        viewport: whole.viewport,
      }).zoom,
    ).toBe(0)
    expect(
      ambienceMix({
        map,
        cities: [],
        camera: { x: 0, y: 0, scale: MAX_SCALE },
        viewport: whole.viewport,
      }).zoom,
    ).toBe(1)
    expect(zoomLoudness(0)).toBeCloseTo(0.4)
    expect(zoomLoudness(1)).toBeCloseTo(1)
  })

  it('misst den Zoom logarithmisch zwischen den Grenzen der Kamera', () => {
    const bounds = { min: 0.05, max: 0.8 }
    expect(zoomLevel(0.05, bounds)).toBe(0)
    expect(zoomLevel(0.8, bounds)).toBe(1)
    // geometric middle of the bounds is half the zoom
    expect(zoomLevel(0.2, bounds)).toBeCloseTo(0.5)
    expect(zoomLevel(0.01, bounds)).toBe(0)
    expect(zoomLevel(3, bounds)).toBe(1)
  })

  it('meldet nur spürbare Änderungen', () => {
    const map = mapOf(2, 1, () => 'plains')
    const { mix } = ambienceMix({ map, cities: [], ...whole })
    expect(mixChanged(null, mix)).toBe(true)
    expect(mixChanged(mix, { ...mix })).toBe(false)
    expect(mixChanged(mix, { ...mix, 'amb-plains': mix['amb-plains'] - 0.1 })).toBe(true)
  })
})
