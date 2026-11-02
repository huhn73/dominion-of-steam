import { useEffect, useMemo, useRef } from 'react'
import type { City, GameMap, Participant, Terrain } from '../types'
import { HEX_SIZE, PARTICIPANT_HEX, hexToPixel, mapPixelSize, visibilityAt } from './hex'
import type { Camera, Viewport } from './camera'
import type { CameraStore } from './cameraStore'
import { diffVisibility } from './terrainChunks'
import { TERRAIN_OF_CODE } from '@dos/shared/game/mapcodec'

interface MiniMapProps {
  map: GameMap
  cities: City[]
  participants: Participant[]
  store: CameraStore
  viewport: Viewport
  onJump: (worldX: number, worldY: number) => void
}

const MINI_FILL: Record<Terrain, string> = {
  deepSea: '#2f6b6b',
  shallows: '#5f9a92',
  plains: '#d8c595',
  forest: '#8e9561',
  hills: '#b99460',
  mountains: '#8a7f73',
}
const MINI_BG = '#0c0a09'
const MINI_UNEXPLORED = '#1c1917'
/** Veil over explored tiles (the SVG drew them at 55 % over the background) */
const MINI_EXPLORED = 'rgba(12,10,9,0.45)'
/** Device pixels per hex column on the minimap bitmap (Imperium ≈ 800 × 700) */
const PX_PER_HEX = 4
/** World units → minimap pixels */
const MINI_SCALE = PX_PER_HEX / (HEX_SIZE * Math.sqrt(3))

/** Cities the player has discovered; the fog hides the rest */
export function visibleCities(map: GameMap, cities: readonly City[]): City[] {
  return cities.filter((c) => visibilityAt(map, c) !== 'unexplored')
}

function paintTile(ctx: CanvasRenderingContext2D, map: GameMap, i: number) {
  const col = i % map.width
  const row = (i / map.width) | 0
  const { x, y } = hexToPixel({ col, row })
  const px = x * MINI_SCALE - PX_PER_HEX / 2
  const py = y * MINI_SCALE - PX_PER_HEX / 2
  const vis = map.visibility[i]
  ctx.fillStyle = vis === 'u' ? MINI_UNEXPLORED : MINI_FILL[TERRAIN_OF_CODE[map.terrain[i]!] ?? 'deepSea']
  ctx.fillRect(px, py, PX_PER_HEX, PX_PER_HEX)
  if (vis === 'e') {
    ctx.fillStyle = MINI_EXPLORED
    ctx.fillRect(px, py, PX_PER_HEX, PX_PER_HEX)
  }
}

/**
 * Lagekarte on a canvas: a terrain bitmap painted once per terrain string and patched for the
 * tiles whose visibility changed, with city squares and the viewport rectangle on top for every
 * camera frame. Tapping jumps the camera.
 */
export function MiniMap({ map, cities, participants, store, viewport, onJump }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const base = useRef<{ canvas: HTMLCanvasElement; terrain: string; visibility: string } | null>(null)
  const size = mapPixelSize(map)
  const width = Math.max(1, Math.ceil(size.width * MINI_SCALE))
  const height = Math.max(1, Math.ceil(size.height * MINI_SCALE))

  const shown = useMemo(() => visibleCities(map, cities), [map, cities])
  const participantById = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    // jsdom has no 2D context: nothing to paint, the tap target still works
    if (!canvas || !ctx) return

    const ensureBase = () => {
      let b = base.current
      if (b && b.canvas.width === width && b.canvas.height === height && b.terrain === map.terrain) {
        if (b.visibility !== map.visibility) {
          const bctx = b.canvas.getContext('2d')
          if (bctx) for (const i of diffVisibility(b.visibility, map.visibility)) paintTile(bctx, map, i)
          b.visibility = map.visibility
        }
        return b.canvas
      }
      const off = document.createElement('canvas')
      off.width = width
      off.height = height
      const bctx = off.getContext('2d')
      if (bctx) {
        bctx.fillStyle = MINI_BG
        bctx.fillRect(0, 0, width, height)
        for (let i = 0; i < map.width * map.height; i++) paintTile(bctx, map, i)
      }
      b = { canvas: off, terrain: map.terrain, visibility: map.visibility }
      base.current = b
      return off
    }

    let frame: number | null = null
    const draw = (cam: Camera) => {
      frame = null
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(ensureBase(), 0, 0)
      for (const c of shown) {
        const { x, y } = hexToPixel(c)
        const owner = c.ownerId ? participantById.get(c.ownerId) : undefined
        const px = Math.round(x * MINI_SCALE)
        const py = Math.round(y * MINI_SCALE)
        ctx.fillStyle = MINI_BG
        ctx.fillRect(px - 3, py - 3, 6, 6)
        ctx.fillStyle = owner ? PARTICIPANT_HEX[owner.color].base : '#e7e5e4'
        ctx.fillRect(px - 2, py - 2, 4, 4)
      }
      if (viewport.width > 0 && viewport.height > 0) {
        const k = MINI_SCALE / cam.scale
        ctx.strokeStyle = '#fbbf24'
        ctx.fillStyle = 'rgba(251,191,36,0.08)'
        ctx.lineWidth = 1.5
        const rx = -cam.x * k
        const ry = -cam.y * k
        const rw = viewport.width * k
        const rh = viewport.height * k
        ctx.fillRect(rx, ry, rw, rh)
        ctx.strokeRect(rx, ry, rw, rh)
      }
    }
    const request = (cam: Camera) => {
      if (typeof requestAnimationFrame !== 'function') {
        draw(cam)
        return
      }
      if (frame !== null) return
      frame = requestAnimationFrame(() => draw(store.get()))
    }
    request(store.get())
    const unsubscribe = store.subscribe(request)
    return () => {
      unsubscribe()
      if (frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    }
  }, [map, shown, participantById, store, viewport, width, height])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    onJump(((e.clientX - r.left) / r.width) * size.width, ((e.clientY - r.top) / r.height) * size.height)
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block h-auto w-full cursor-crosshair bg-[#0c0a09]"
      style={{ imageRendering: 'pixelated' }}
      onClick={handleClick}
      role="img"
      aria-label="Minikarte, antippen zum Springen"
    />
  )
}
