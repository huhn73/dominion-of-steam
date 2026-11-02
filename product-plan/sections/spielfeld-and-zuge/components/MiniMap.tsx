import { memo } from 'react'
import type { City, GameMap, Participant, Terrain } from '../types'
import { HEX_SIZE, PARTICIPANT_HEX, hexKey, hexPoints, hexToPixel, mapPixelSize } from './hex'
import type { Camera } from './HexMap'

interface MiniMapProps {
  map: GameMap
  cities: City[]
  participants: Participant[]
  camera: Camera
  viewport: { width: number; height: number }
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

const MiniTiles = memo(function MiniTiles({ map }: { map: GameMap }) {
  return (
    <>
      {map.tiles.map((t) => {
        const { x, y } = hexToPixel(t)
        return (
          <polygon
            key={hexKey(t)}
            points={hexPoints(x, y, HEX_SIZE + 1)}
            fill={t.visibility === 'unexplored' ? '#1c1917' : MINI_FILL[t.terrain]}
            opacity={t.visibility === 'explored' ? 0.55 : 1}
          />
        )
      })}
    </>
  )
})

export function MiniMap({ map, cities, participants, camera, viewport, onJump }: MiniMapProps) {
  const size = mapPixelSize(map)
  const view = {
    x: -camera.x / camera.scale,
    y: -camera.y / camera.scale,
    w: viewport.width / camera.scale,
    h: viewport.height / camera.scale,
  }

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onJump(((e.clientX - r.left) / r.width) * size.width, ((e.clientY - r.top) / r.height) * size.height)
  }

  return (
    <svg
      viewBox={`0 0 ${size.width} ${size.height}`}
      className="block w-full cursor-crosshair"
      onClick={handleClick}
      role="img"
      aria-label="Minikarte, antippen zum Springen"
    >
      <rect width={size.width} height={size.height} fill="#0c0a09" />
      <MiniTiles map={map} />
      {cities.filter((c) => map.tiles.some((t) => t.col === c.col && t.row === c.row && t.visibility !== 'unexplored')).map((c) => {
        const { x, y } = hexToPixel(c)
        const owner = participants.find((p) => p.id === c.ownerId)
        return (
          <rect
            key={c.id}
            x={x - 16}
            y={y - 16}
            width={32}
            height={32}
            fill={owner ? PARTICIPANT_HEX[owner.color].base : '#e7e5e4'}
            stroke="#0c0a09"
            strokeWidth={6}
          />
        )
      })}
      <rect
        x={view.x}
        y={view.y}
        width={view.w}
        height={view.h}
        fill="#fbbf24"
        fillOpacity={0.08}
        stroke="#fbbf24"
        strokeWidth={10}
      />
    </svg>
  )
}
