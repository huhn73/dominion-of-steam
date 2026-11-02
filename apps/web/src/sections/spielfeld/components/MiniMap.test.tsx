import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { City, GameMap, Participant } from '../types'
import { createCameraStore } from './cameraStore'
import { MiniMap, visibleCities } from './MiniMap'
import { PARTICIPANT_HEX, mapPixelSize } from './hex'
import { TerrainCanvas } from './TerrainCanvas'

const map: GameMap = {
  width: 4,
  height: 3,
  seed: 's',
  terrain: '~~..' + 'ffhh' + 'mm..',
  // first row visible, second explored, third unexplored
  visibility: 'vvvv' + 'eeee' + 'uuuu',
}
const city = (id: string, col: number, row: number, ownerId: string | null = null): City => ({
  id,
  name: id,
  col,
  row,
  ownerId,
  isCapital: false,
  damage: 0,
  production: null,
})
const cities = [city('seen', 0, 0, 'p1'), city('fogged', 1, 1), city('hidden', 2, 2, 'p1')]
const participants = [{ id: 'p1', color: 'rose' } as Participant]

/** 2D context stand-in that records fill colours and drawing calls */
function fakeContext() {
  const styles: string[] = []
  const calls: string[] = []
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, name: string) => {
      if (name === 'styles') return styles
      if (name === 'calls') return calls
      return () => calls.push(name)
    },
    set: (_, name: string, value) => {
      if (name === 'fillStyle') styles.push(String(value))
      return true
    },
  })
  return ctx as unknown as CanvasRenderingContext2D & { styles: string[]; calls: string[] }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Minikarte', () => {
  it('zählt Städte auf unerforschten Feldern nicht', () => {
    expect(visibleCities(map, cities).map((c) => c.id)).toEqual(['seen', 'fogged'])
  })

  it('rendert ohne 2D-Kontext (jsdom) und springt beim Antippen', () => {
    const onJump = vi.fn()
    render(
      <MiniMap map={map} cities={cities} participants={participants} store={createCameraStore()} viewport={{ width: 0, height: 0 }} onJump={onJump} />,
    )
    const img = screen.getByRole('img', { name: 'Minikarte, antippen zum Springen' })
    expect(img.tagName).toBe('CANVAS')
    const size = mapPixelSize(map)
    vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 50 } as DOMRect)
    fireEvent.click(img, { clientX: 50, clientY: 25 })
    expect(onJump).toHaveBeenCalledWith(size.width / 2, size.height / 2)
  })

  it('zeichnet nur entdeckte Städte und den Kameraausschnitt', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
      cb(0)
      return 1
    })
    const ctx = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx)
    render(
      <MiniMap
        map={map}
        cities={cities}
        participants={participants}
        store={createCameraStore({ x: 0, y: 0, scale: 1 })}
        viewport={{ width: 1280, height: 720 }}
        onJump={() => {}}
      />,
    )
    // one owned city in the owner's colour, one neutral city, the hidden one not at all
    expect(ctx.styles.filter((s) => s === PARTICIPANT_HEX.rose.base)).toHaveLength(1)
    expect(ctx.styles.filter((s) => s === '#e7e5e4')).toHaveLength(1)
    expect(ctx.calls).toContain('drawImage')
    expect(ctx.calls).toContain('strokeRect')
  })
})

describe('Geländekarte', () => {
  it('rendert ohne 2D-Kontext (jsdom) eine leere Leinwand', () => {
    const store = createCameraStore()
    render(<TerrainCanvas map={map} store={store} viewport={{ width: 0, height: 0 }} />)
    expect(screen.getByTestId('terrain-canvas').tagName).toBe('CANVAS')
    // camera changes must not throw without a context
    store.set({ x: -10, y: -10, scale: 2 })
  })
})
