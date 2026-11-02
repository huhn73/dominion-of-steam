import { afterEach, describe, expect, it, vi } from 'vitest'
import { HEX_SIZE, hexToPixel } from './hex'
import {
  CHUNK_PX,
  chunkRect,
  chunksForTile,
  chunksInView,
  chunkWorldSize,
  detailFor,
  diffVisibility,
  drawChunkTiles,
  drawTile,
  levelFor,
  MAX_LEVEL,
  MIN_LEVEL,
  PALETTE,
  tileRangeForWorldRect,
  type TileStyle,
} from './terrainChunks'
import { mapPixels } from './camera'

/** Records the drawing calls of a 2D context */
function fakeContext() {
  const calls: { name: string; args: unknown[] }[] = []
  const styles: string[] = []
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, name: string) => {
      if (name === 'calls') return calls
      if (name === 'styles') return styles
      return (...args: unknown[]) => calls.push({ name, args })
    },
    set: (_, name: string, value) => {
      if (name === 'fillStyle') styles.push(String(value))
      return true
    },
  })
  return ctx as unknown as CanvasRenderingContext2D & { calls: typeof calls; styles: string[] }
}

class FakePath2D {
  constructor(public d = '') {}
  moveTo() {}
  lineTo() {}
  closePath() {}
}

afterEach(() => vi.unstubAllGlobals())

describe('Geländestufen', () => {
  it('wählt die Zweierpotenz nächst am Zoom, zwischen 1/16 und 2', () => {
    expect(levelFor(1, 1)).toBe(1)
    expect(levelFor(1.1, 1)).toBe(1)
    expect(levelFor(1.5, 1)).toBe(2)
    expect(levelFor(2.4, 1)).toBe(MAX_LEVEL)
    expect(levelFor(1, 2)).toBe(2)
    expect(levelFor(0.45, 1)).toBe(0.5)
    expect(levelFor(0.058, 1)).toBe(MIN_LEVEL)
    expect(levelFor(0.001, 1)).toBe(MIN_LEVEL)
    expect(chunkWorldSize(1)).toBe(CHUNK_PX)
    expect(chunkWorldSize(0.5)).toBe(CHUNK_PX * 2)
    expect(chunkRect(0.5, { cx: 1, cy: 2 })).toEqual({ x: 1024, y: 2048, width: 1024, height: 1024 })
  })

  it('bestimmt die Chunks unter dem Viewport, nächste zuerst und auf die Karte beschnitten', () => {
    const map = mapPixels({ width: 200, height: 200 })
    const viewport = { width: 1280, height: 720 }
    const chunks = chunksInView({ x: 0, y: 0, scale: 1 }, viewport, 1, map)
    // 1280/512 → columns 0..2, 720/512 → rows 0..1
    expect(chunks).toHaveLength(6)
    expect(chunks[0]).toEqual({ cx: 1, cy: 0 })
    expect(chunks.some((c) => c.cx === 2 && c.cy === 1)).toBe(true)
    // the far corner of a small map: nothing beyond the map's chunks
    const small = mapPixels({ width: 10, height: 10 })
    expect(chunksInView({ x: -5000, y: -5000, scale: 1 }, viewport, 1, small)).toEqual([])
    expect(chunksInView({ x: 0, y: 0, scale: 1 }, { width: 0, height: 0 }, 1, map)).toEqual([])
  })

  it('liefert die Felder eines Weltrechtecks mit Rand', () => {
    const range = tileRangeForWorldRect({ x: 0, y: 0, width: 512, height: 512 }, { width: 100, height: 100 })
    expect(range.minCol).toBe(0)
    expect(range.minRow).toBe(0)
    // 512 px / 69 px per column ≈ 7 columns plus one of margin
    expect(range.maxCol).toBeGreaterThanOrEqual(8)
    expect(range.maxCol).toBeLessThanOrEqual(9)
    // 512 px / 60 px per row ≈ 8 rows plus margin
    expect(range.maxRow).toBeGreaterThanOrEqual(9)
    expect(range.maxRow).toBeLessThanOrEqual(10)
    const clipped = tileRangeForWorldRect({ x: 0, y: 0, width: 1e6, height: 1e6 }, { width: 5, height: 5 })
    expect(clipped).toEqual({ minCol: 0, maxCol: 4, minRow: 0, maxRow: 4 })
  })

  it('kennt die Chunks, die ein Feld berührt', () => {
    expect(chunksForTile(1, { col: 0, row: 0 })).toEqual([{ cx: 0, cy: 0 }])
    // a tile on a chunk border touches both chunks
    const { x } = hexToPixel({ col: 7, row: 0 })
    expect(Math.abs(x - 512)).toBeLessThan(HEX_SIZE)
    const both = chunksForTile(1, { col: 7, row: 0 })
    expect(both.length).toBeGreaterThanOrEqual(2)
    expect(both).toContainEqual({ cx: 0, cy: 0 })
    expect(both).toContainEqual({ cx: 1, cy: 0 })
    // coarse levels: everything near the origin is in chunk 0/0
    expect(chunksForTile(MIN_LEVEL, { col: 50, row: 50 })).toEqual([{ cx: 0, cy: 0 }])
  })

  it('findet die geänderten Sichtfelder', () => {
    expect(diffVisibility('uuvv', 'uvvv')).toEqual([1])
    expect(diffVisibility('uuvv', 'uuvv')).toEqual([])
    expect(diffVisibility('uu', 'uuvv')).toEqual([0, 1, 2, 3])
  })

  it('staffelt die Details nach Pixeln je Hex', () => {
    expect(detailFor(1)).toEqual({ shape: 'hex', stroke: true, glyphs: true })
    expect(detailFor(0.25)).toEqual({ shape: 'hex', stroke: true, glyphs: false })
    expect(detailFor(0.125)).toEqual({ shape: 'hex', stroke: false, glyphs: false })
    expect(detailFor(MIN_LEVEL)).toEqual({ shape: 'rect', stroke: false, glyphs: false })
  })

  it('zeichnet Gelände, Glyphen und Nebel je Sichtbarkeit', () => {
    vi.stubGlobal('Path2D', FakePath2D)
    const paths = {
      hex: new FakePath2D('hex'),
      forest: new FakePath2D('forest'),
      hills: new FakePath2D('hills'),
      mountainLeft: new FakePath2D('ml'),
      mountainSnow: new FakePath2D('ms'),
      mountainRight: new FakePath2D('mr'),
      wave: new FakePath2D('wave'),
    } as unknown as TileStyle['paths']
    const style = (detail: TileStyle['detail']): TileStyle => ({
      palette: PALETTE.light,
      hatch: 'HATCH' as unknown as CanvasPattern,
      paths,
      detail,
    })
    const full = { shape: 'hex' as const, stroke: true, glyphs: true }

    // visible forest: fill, outline, glyph, no veil
    let ctx = fakeContext()
    drawTile(ctx, { col: 1, row: 1 }, 'f', 'v', style(full))
    expect(ctx.styles).toEqual([PALETTE.light.fill.forest, PALETTE.light.forest])
    expect(ctx.calls.filter((c) => c.name === 'stroke')).toHaveLength(1)
    expect(ctx.calls.filter((c) => c.name === 'fill').map((c) => (c.args[0] as FakePath2D).d)).toEqual(['hex', 'forest'])

    // explored plains: fill then the dim veil
    ctx = fakeContext()
    drawTile(ctx, { col: 1, row: 1 }, '.', 'e', style(full))
    expect(ctx.styles).toEqual([PALETTE.light.fill.plains, PALETTE.light.explored])

    // unexplored: dark fill plus hatch, no outline or glyph
    ctx = fakeContext()
    drawTile(ctx, { col: 1, row: 1 }, 'm', 'u', style(full))
    expect(ctx.styles).toEqual([PALETTE.light.unexplored, 'HATCH'])
    expect(ctx.calls.filter((c) => c.name === 'stroke')).toHaveLength(0)

    // mountains without glyphs: only the hex and its outline
    ctx = fakeContext()
    drawTile(ctx, { col: 1, row: 1 }, 'm', 'v', style({ shape: 'hex', stroke: true, glyphs: false }))
    expect(ctx.styles).toEqual([PALETTE.light.fill.mountains])

    // far out: rectangles only
    ctx = fakeContext()
    drawTile(ctx, { col: 1, row: 1 }, '~', 'v', style({ shape: 'rect', stroke: false, glyphs: false }))
    expect(ctx.calls.map((c) => c.name)).toEqual(['fillRect'])
    expect(ctx.styles).toEqual([PALETTE.light.fill.deepSea])
  })

  it('zeichnet alle Felder eines Chunks', () => {
    vi.stubGlobal('Path2D', FakePath2D)
    const map = { width: 4, height: 3, terrain: '.'.repeat(12), visibility: 'v'.repeat(12) }
    const ctx = fakeContext()
    drawChunkTiles(ctx, map, 1, { cx: 0, cy: 0 }, {
      palette: PALETTE.dark,
      hatch: null,
      paths: null,
      detail: { shape: 'rect', stroke: false, glyphs: false },
    })
    expect(ctx.calls.filter((c) => c.name === 'fillRect')).toHaveLength(12)
  })
})
