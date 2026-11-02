import { useEffect, useRef } from 'react'
import type { GameMap } from '../types'
import type { Camera, Viewport } from './camera'
import type { CameraStore } from './cameraStore'
import { mapPixelSize } from './hex'
import {
  CHUNK_PAD,
  CHUNK_PX,
  type ChunkCoord,
  chunkRect,
  chunksForTile,
  chunksInView,
  chunkWorldSize,
  detailFor,
  diffVisibility,
  drawChunkTiles,
  levelFor,
  makeHatch,
  MAX_LEVEL,
  MIN_LEVEL,
  PALETTE,
  type Palette,
  terrainPaths,
  type TileStyle,
} from './terrainChunks'

interface TerrainCanvasProps {
  map: GameMap
  store: CameraStore
  viewport: Viewport
}

/** Cached chunks across all levels; 96 × 512² × 4 B ≈ 100 MB at most */
const CACHE_SIZE = 96
/** Milliseconds of chunk rendering per frame; the rest waits for the next frame */
const FRAME_BUDGET_MS = 6

interface Chunk {
  canvas: HTMLCanvasElement
  level: number
  cx: number
  cy: number
}

const chunkKey = (level: number, c: ChunkCoord) => `${level}:${c.cx}:${c.cy}`

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

/** All pyramid levels, coarse to fine */
const LEVELS: number[] = []
for (let l = MIN_LEVEL; l <= MAX_LEVEL; l *= 2) LEVELS.push(l)

/**
 * Terrain and fog of the whole map on one canvas under the SVG overlays. Chunks are rendered
 * on demand within a frame budget and cached per zoom level; a visibility change only
 * invalidates the chunks of the tiles that changed, a new terrain string empties the cache.
 */
export function TerrainCanvas({ map, store, viewport }: TerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painter = useRef<Painter | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    // jsdom has no 2D context: the map stays blank, the SVG overlays still work
    if (!ctx) return
    const p = new Painter(canvas, ctx)
    painter.current = p
    const theme = new MutationObserver(() => p.setTheme(isDark()))
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      theme.disconnect()
      p.dispose()
      painter.current = null
    }
  }, [])

  useEffect(() => {
    painter.current?.setMap(map)
  }, [map])

  useEffect(() => {
    painter.current?.setViewport(viewport)
  }, [viewport])

  useEffect(() => {
    const p = painter.current
    if (!p) return
    p.setCamera(store.get())
    return store.subscribe((cam) => p.setCamera(cam))
  }, [store])

  return <canvas ref={canvasRef} data-testid="terrain-canvas" className="pointer-events-none absolute inset-0 size-full" />
}

class Painter {
  private map: GameMap | null = null
  private viewport: Viewport = { width: 0, height: 0 }
  private cam: Camera = { x: 0, y: 0, scale: 1 }
  private palette: Palette = isDark() ? PALETTE.dark : PALETTE.light
  private cache = new Map<string, Chunk>()
  private frame: number | null = null
  private disposed = false

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {}

  setTheme(dark: boolean) {
    const next = dark ? PALETTE.dark : PALETTE.light
    if (next === this.palette) return
    this.palette = next
    this.cache.clear()
    this.schedule()
  }

  setMap(map: GameMap) {
    const prev = this.map
    this.map = map
    if (!prev || prev.terrain !== map.terrain || prev.width !== map.width || prev.height !== map.height) {
      this.cache.clear()
    } else if (prev.visibility !== map.visibility) {
      this.invalidateTiles(diffVisibility(prev.visibility, map.visibility), map.width)
    }
    this.schedule()
  }

  setViewport(viewport: Viewport) {
    this.viewport = viewport
    this.schedule()
  }

  setCamera(cam: Camera) {
    this.cam = cam
    this.schedule()
  }

  dispose() {
    this.disposed = true
    if (this.frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.frame)
    this.frame = null
    this.cache.clear()
  }

  private invalidateTiles(indices: number[], width: number) {
    if (indices.length === 0) return
    if (indices.length > this.cache.size * 64) {
      // cheaper to drop everything than to visit every changed tile per cached chunk
      this.cache.clear()
      return
    }
    for (const i of indices) {
      const c = { col: i % width, row: (i / width) | 0 }
      for (const level of LEVELS) for (const chunk of chunksForTile(level, c)) this.cache.delete(chunkKey(level, chunk))
    }
  }

  private schedule() {
    if (this.disposed || this.frame !== null) return
    if (typeof requestAnimationFrame !== 'function') {
      this.draw()
      return
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = null
      this.draw()
    })
  }

  /** Drawing style for one chunk; the hatch pattern is created on the chunk's own context */
  private style(level: number, ctx: CanvasRenderingContext2D): TileStyle {
    return { palette: this.palette, hatch: makeHatch(ctx, this.palette.hatch), paths: terrainPaths(), detail: detailFor(level) }
  }

  private renderChunk(level: number, c: ChunkCoord): Chunk | null {
    const map = this.map
    if (!map) return null
    const canvas = document.createElement('canvas')
    canvas.width = CHUNK_PX + 2 * CHUNK_PAD
    canvas.height = CHUNK_PX + 2 * CHUNK_PAD
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const rect = chunkRect(level, c)
    ctx.setTransform(level, 0, 0, level, CHUNK_PAD - rect.x * level, CHUNK_PAD - rect.y * level)
    drawChunkTiles(ctx, map, level, c, this.style(level, ctx))
    const chunk = { canvas, level, cx: c.cx, cy: c.cy }
    const key = chunkKey(level, c)
    this.cache.delete(key)
    this.cache.set(key, chunk)
    if (this.cache.size > CACHE_SIZE) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    return chunk
  }

  private lookup(level: number, c: ChunkCoord): Chunk | undefined {
    const key = chunkKey(level, c)
    const chunk = this.cache.get(key)
    if (chunk) {
      // most recently used goes to the back
      this.cache.delete(key)
      this.cache.set(key, chunk)
    }
    return chunk
  }

  /** Draws a chunk at its world rectangle with the current camera */
  private blit(chunk: Chunk, dpr: number) {
    const { cam } = this
    const size = chunkWorldSize(chunk.level)
    const k = (cam.scale * dpr) / chunk.level
    const pad = CHUNK_PAD * k
    this.ctx.drawImage(
      chunk.canvas,
      (chunk.cx * size * cam.scale + cam.x) * dpr - pad,
      (chunk.cy * size * cam.scale + cam.y) * dpr - pad,
      CHUNK_PX * k + 2 * pad,
      CHUNK_PX * k + 2 * pad,
    )
  }

  /** Stand-in for a missing chunk: cached chunks of neighbouring levels, clipped to its rectangle */
  private blitFallback(level: number, c: ChunkCoord, dpr: number, mapPixels: { width: number; height: number }) {
    const rect = chunkRect(level, c)
    const { cam, ctx } = this
    const candidates = [level / 2, level * 2, level / 4, level * 4, level / 8, level * 8].filter(
      (l) => l >= MIN_LEVEL && l <= MAX_LEVEL,
    )
    for (const other of candidates) {
      const size = chunkWorldSize(other)
      const cx0 = Math.floor(rect.x / size)
      const cx1 = Math.min(Math.ceil(mapPixels.width / size) - 1, Math.floor((rect.x + rect.width - 1) / size))
      const cy0 = Math.floor(rect.y / size)
      const cy1 = Math.min(Math.ceil(mapPixels.height / size) - 1, Math.floor((rect.y + rect.height - 1) / size))
      const found: Chunk[] = []
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const chunk = this.cache.get(chunkKey(other, { cx, cy }))
          if (chunk) found.push(chunk)
        }
      if (found.length === 0) continue
      ctx.save()
      ctx.beginPath()
      ctx.rect((rect.x * cam.scale + cam.x) * dpr, (rect.y * cam.scale + cam.y) * dpr, rect.width * cam.scale * dpr, rect.height * cam.scale * dpr)
      ctx.clip()
      for (const chunk of found) this.blit(chunk, dpr)
      ctx.restore()
      return
    }
  }

  private draw() {
    const { map, viewport, canvas, ctx, cam } = this
    if (this.disposed || !map) return
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
    const w = Math.max(1, Math.round(viewport.width * dpr))
    const h = Math.max(1, Math.round(viewport.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (viewport.width <= 0 || viewport.height <= 0) return

    const level = levelFor(cam.scale, dpr)
    const mapPixels = mapPixelSize(map)
    const wanted = chunksInView(cam, viewport, level, mapPixels)
    const missing: ChunkCoord[] = []
    const started = typeof performance !== 'undefined' ? performance.now() : 0
    const now = () => (typeof performance !== 'undefined' ? performance.now() : started)

    for (const c of wanted) {
      let chunk = this.lookup(level, c)
      if (!chunk && now() - started < FRAME_BUDGET_MS) chunk = this.renderChunk(level, c) ?? undefined
      if (chunk) this.blit(chunk, dpr)
      else {
        this.blitFallback(level, c, dpr, mapPixels)
        missing.push(c)
      }
    }
    if (missing.length > 0) this.schedule()
  }
}
