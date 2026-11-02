import { memo, useMemo, useRef } from 'react'
import { Crown, Eye, Flag, Repeat } from 'lucide-react'
import type {
  City,
  GameMap,
  HexCoord,
  Participant,
  Terrain,
  Unit,
  UnitType,
} from '../types'
import { HEX_SIZE, PARTICIPANT_HEX, hexKey, hexPoints, hexToPixel, pixelToHex } from './hex'
import type { AttackTarget } from './hex'
import { UnitIcon } from './unitIcons'

export interface Camera {
  x: number
  y: number
  scale: number
}

export interface PathMarker {
  coord: HexCoord
  turn: number
}

export interface Ghost {
  coord: HexCoord
  trail: HexCoord[]
  unitTypeId: string
  color: Participant['color']
}

interface HexMapProps {
  map: GameMap
  cities: City[]
  units: Unit[]
  unitTypes: UnitType[]
  participants: Participant[]
  youId: string
  camera: Camera
  animateCamera?: boolean
  onCameraChange: (camera: Camera) => void
  selectedUnitId?: string | null
  selectedCityId?: string | null
  reachable: HexCoord[]
  targets: AttackTarget[]
  path: HexCoord[] | null
  pathMarkers: PathMarker[]
  pathBeyondReach?: boolean
  patrolPoints: HexCoord[]
  unloadTargets: HexCoord[]
  ghost?: Ghost | null
  combatFx?: { coord: HexCoord; id: number } | null
  draggableUnitAt: (c: HexCoord) => string | null
  onTap: (c: HexCoord) => void
  onDrag: (unitId: string, c: HexCoord) => void
  onDragEnd: (unitId: string, c: HexCoord) => void
  /** Right click: step back out of the current selection */
  onCancel: () => void
}

const MIN_SCALE = 0.45
const MAX_SCALE = 2.4
const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

// Parchment chart in light mode, soot-and-brass in dark mode
const TERRAIN_FILL: Record<Terrain, string> = {
  deepSea: 'fill-[#5f8f8b] dark:fill-[#0f2e33]',
  shallows: 'fill-[#8fbab0] dark:fill-[#1f4f50]',
  plains: 'fill-[#ead9ae] dark:fill-[#5d5541]',
  forest: 'fill-[#b6b97f] dark:fill-[#3e4a2f]',
  hills: 'fill-[#d9b77c] dark:fill-[#6b5434]',
  mountains: 'fill-[#a89a88] dark:fill-[#4a443d]',
}

function TerrainGlyph({ terrain, x, y, seed }: { terrain: Terrain; x: number; y: number; seed: number }) {
  switch (terrain) {
    case 'forest':
      return (
        <g transform={`translate(${x},${y})`} className="fill-[#6f7a45] dark:fill-[#25301b]">
          <path d="M-15 7 l6 -13 l6 13 z" />
          <path d="M-3 3 l7 -15 l7 15 z" />
          <path d="M5 13 l5 -11 l5 11 z" />
        </g>
      )
    case 'hills':
      return (
        <g transform={`translate(${x},${y})`} className="fill-none stroke-[#9c7840] dark:stroke-[#3d2f1c]" strokeWidth={2.2} strokeLinecap="round">
          <path d="M-16 6 q8 -12 16 0" />
          <path d="M-2 12 q7 -10 14 0" />
        </g>
      )
    case 'mountains':
      return (
        <g transform={`translate(${x},${y})`}>
          <path d="M-17 12 L-5 -10 L7 12 Z" className="fill-[#7a6e62] dark:fill-[#2d2925]" />
          <path d="M-5 -10 L-1 -3 L-6 -1 L-9 -3 Z" className="fill-[#f5f0e6] dark:fill-[#8b847a]" />
          <path d="M1 12 L10 -3 L19 12 Z" className="fill-[#8b7f72] dark:fill-[#38332e]" />
        </g>
      )
    case 'deepSea':
      return seed % 3 === 0 ? (
        <path
          d={`M${x - 11} ${y + 2} q3 -4 6 0 t6 0 t6 0`}
          className="fill-none stroke-[#e6f0ea]/35 dark:stroke-[#5eead4]/15"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ) : null
    default:
      return null
  }
}

const TerrainLayer = memo(function TerrainLayer({ map }: { map: GameMap }) {
  return (
    <g>
      {map.tiles.map((t) => {
        const { x, y } = hexToPixel(t)
        if (t.visibility === 'unexplored') {
          return (
            <g key={hexKey(t)}>
              <polygon points={hexPoints(x, y, HEX_SIZE + 0.6)} className="fill-[#3b3530] dark:fill-[#0c0a09]" />
              <polygon points={hexPoints(x, y, HEX_SIZE + 0.6)} fill="url(#dos-hatch)" />
            </g>
          )
        }
        return (
          <g key={hexKey(t)}>
            <polygon
              points={hexPoints(x, y, HEX_SIZE + 0.6)}
              className={`${TERRAIN_FILL[t.terrain]} stroke-[#4a3f33]/15 dark:stroke-black/30`}
              strokeWidth={1}
            />
            <TerrainGlyph terrain={t.terrain} x={x} y={y} seed={t.col * 7 + t.row * 13} />
            {t.visibility === 'explored' && (
              <polygon points={hexPoints(x, y, HEX_SIZE + 0.6)} className="fill-[#2b2420]/45 dark:fill-black/55" />
            )}
          </g>
        )
      })}
    </g>
  )
})

function CityMarker({ city, owner, selected, fogged }: { city: City; owner?: Participant; selected: boolean; fogged: boolean }) {
  const { x, y } = hexToPixel(city)
  const color = owner ? PARTICIPANT_HEX[owner.color] : { base: '#d6d3d1', deep: '#57534e' }
  const prod = city.production
  const total = prod ? prod.progress + prod.turnsRemaining : 0
  const fraction = prod && total > 0 ? prod.progress / total : 0
  const ringLen = 2 * Math.PI * 6
  return (
    <g transform={`translate(${x},${y})`} opacity={fogged ? 0.7 : 1}>
      {selected && (
        <polygon points={hexPoints(0, 0, HEX_SIZE - 3)} className="fill-none stroke-amber-300" strokeWidth={3} />
      )}
      <circle r={HEX_SIZE * 0.62} fill={color.base} opacity={0.22} />
      <path
        d="M-14 10 V-2 H-10 V-6 H-6 V-2 H-3 V-11 H3 V-2 H6 V-6 H10 V-2 H14 V10 Z"
        fill={color.base}
        stroke="#1c1917"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M-3 10 V5 a3 3 0 0 1 6 0 V10 Z" fill="#1c1917" />
      {city.isCapital && (
        <Crown x={-6} y={-26} width={12} height={12} color="#fbbf24" fill="#fbbf24" strokeWidth={1.5} />
      )}
      {prod && (
        <g transform="translate(16,-12)">
          <circle r={7.5} fill="#1c1917" />
          <circle
            r={6}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2.4}
            strokeDasharray={`${ringLen * fraction} ${ringLen}`}
            transform="rotate(-90)"
          />
        </g>
      )}
      <g transform={`translate(0,${HEX_SIZE * 0.62})`}>
        <rect x={-30} y={-7} width={60} height={14} rx={2} fill="#1c1917" opacity={0.82} />
        <text
          textAnchor="middle"
          dy={4}
          fill={owner ? color.base : '#e7e5e4'}
          style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: 1.2 }}
        >
          {city.name.toUpperCase()}
        </text>
      </g>
    </g>
  )
}

function UnitToken({
  unit,
  type,
  owner,
  isYours,
  inCity,
  selected,
}: {
  unit: Unit
  type?: UnitType
  owner?: Participant
  isYours: boolean
  inCity: boolean
  selected: boolean
}) {
  const p = hexToPixel(unit)
  const x = inCity ? p.x + 13 : p.x
  const y = inCity ? p.y - 12 : p.y
  const scale = inCity ? 0.82 : 1
  const color = PARTICIPANT_HEX[owner?.color ?? 'amber']
  const healthColor = unit.health > 66 ? '#84cc16' : unit.health > 33 ? '#f59e0b' : '#f43f5e'
  const orderIconProps = { x: -4.5, y: -4.5, width: 9, height: 9, color: '#5eead4', strokeWidth: 2.4 }

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {selected && (
        <circle
          r={22}
          className="animate-[spin_6s_linear_infinite] fill-none stroke-amber-300"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      )}
      {isYours && unit.needsOrders && !selected && (
        <circle r={20} className="animate-pulse fill-none stroke-amber-400" strokeWidth={2} />
      )}
      {type?.domain === 'air' && <ellipse cy={18} rx={11} ry={3} fill="#000" opacity={0.25} />}
      <circle r={15} fill={color.base} stroke={isYours ? '#b45309' : '#1c1917'} strokeWidth={3} />
      <circle r={11} fill={color.deep} opacity={0.35} />
      <UnitIcon unitTypeId={unit.unitTypeId} domain={type?.domain} x={-8} y={-8} width={16} height={16} color="#fff" strokeWidth={2.2} />
      <g transform="translate(-12,17)">
        <rect width={24} height={4} rx={1} fill="#1c1917" />
        <rect width={(24 * unit.health) / 100} height={4} rx={1} fill={healthColor} />
      </g>
      {unit.order.type !== 'none' && (
        <g transform="translate(-13,-13)">
          <circle r={7} fill="#1c1917" stroke="#14b8a6" strokeWidth={1.2} />
          {unit.order.type === 'sentry' && <Eye {...orderIconProps} />}
          {unit.order.type === 'patrol' && <Repeat {...orderIconProps} />}
          {unit.order.type === 'goto' && <Flag {...orderIconProps} />}
        </g>
      )}
      {unit.cargoUnitIds.length > 0 && (
        <g transform="translate(13,-13)">
          <circle r={7} fill="#1c1917" stroke="#f59e0b" strokeWidth={1.2} />
          <text
            textAnchor="middle"
            dy={3.5}
            fill="#fbbf24"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600 }}
          >
            {unit.cargoUnitIds.length}
          </text>
        </g>
      )}
    </g>
  )
}

function polyline(coords: HexCoord[]) {
  return coords.map((c) => {
    const { x, y } = hexToPixel(c)
    return `${x},${y}`
  }).join(' ')
}

export function HexMap({
  map,
  cities,
  units,
  unitTypes,
  participants,
  youId,
  camera,
  animateCamera,
  onCameraChange,
  selectedUnitId,
  selectedCityId,
  reachable,
  targets,
  path,
  pathMarkers,
  pathBeyondReach,
  patrolPoints,
  unloadTargets,
  ghost,
  combatFx,
  draggableUnitAt,
  onTap,
  onDrag,
  onDragEnd,
  onCancel,
}: HexMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{
    startX: number
    startY: number
    cam: Camera
    unitId: string | null
    moved: boolean
    pinchDist?: number
  } | null>(null)

  const participantById = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])
  const typeById = useMemo(() => new Map(unitTypes.map((t) => [t.id, t])), [unitTypes])
  const tileByKey = useMemo(() => new Map(map.tiles.map((t) => [hexKey(t), t])), [map])
  const cityKeys = useMemo(() => new Set(cities.map(hexKey)), [cities])

  const local = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }
  const hexAtScreen = (sx: number, sy: number) =>
    pixelToHex((sx - camera.x) / camera.scale, (sy - camera.y) / camera.scale)

  const zoomAt = (sx: number, sy: number, nextScale: number, from: Camera) => {
    const scale = clampScale(nextScale)
    const wx = (sx - from.x) / from.scale
    const wy = (sy - from.y) / from.scale
    onCameraChange({ scale, x: sx - wx * scale, y: sy - wy * scale })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    // only the primary button selects, moves and pans; right click cancels via onContextMenu
    if (e.pointerType === 'mouse' && e.button !== 0) return
    svgRef.current?.setPointerCapture(e.pointerId)
    const p = local(e.clientX, e.clientY)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) {
      const hex = hexAtScreen(p.x, p.y)
      gesture.current = { startX: p.x, startY: p.y, cam: camera, unitId: draggableUnitAt(hex), moved: false }
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { ...gesture.current, unitId: null, moved: true, cam: camera, pinchDist: Math.hypot(a.x - b.x, a.y - b.y) }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    const p = local(e.clientX, e.clientY)
    pointers.current.set(e.pointerId, p)
    const g = gesture.current

    if (pointers.current.size === 2 && g.pinchDist) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, g.cam.scale * (dist / g.pinchDist), g.cam)
      return
    }

    const dx = p.x - g.startX
    const dy = p.y - g.startY
    if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true
    if (!g.moved) return
    if (g.unitId) onDrag(g.unitId, hexAtScreen(p.x, p.y))
    else onCameraChange({ ...g.cam, x: g.cam.x + dx, y: g.cam.y + dy })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    const p = local(e.clientX, e.clientY)
    pointers.current.delete(e.pointerId)
    if (pointers.current.size > 0) {
      // finishing a pinch: continue panning with the remaining finger
      const [rest] = [...pointers.current.values()]
      gesture.current = { startX: rest.x, startY: rest.y, cam: camera, unitId: null, moved: true }
      return
    }
    gesture.current = null
    if (!g) return
    const hex = hexAtScreen(p.x, p.y)
    if (!g.moved) onTap(hex)
    else if (g.unitId) onDragEnd(g.unitId, hex)
  }

  const handleWheel = (e: React.WheelEvent) => {
    const p = local(e.clientX, e.clientY)
    zoomAt(p.x, p.y, camera.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), camera)
  }

  // own units are always shown; enemies only where the player currently has vision
  const visibleUnits = units.filter(
    (u) => !u.carriedBy && (u.ownerId === youId || tileByKey.get(hexKey(u))?.visibility === 'visible'),
  )
  const fxPoint = combatFx ? hexToPixel(combatFx.coord) : null

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 size-full touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        e.preventDefault()
        onCancel()
      }}
      role="application"
      aria-label="Spielkarte"
    >
      <defs>
        <pattern id="dos-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#a8a29e" strokeOpacity="0.12" strokeWidth="2" />
        </pattern>
        <style>{`
          @keyframes dos-blast { 0% { transform: scale(.15); opacity: 1 } 100% { transform: scale(1.4); opacity: 0 } }
          @keyframes dos-flash { 0%, 100% { opacity: 0 } 15% { opacity: 1 } }
          @keyframes dos-dash { to { stroke-dashoffset: -20 } }
          .dos-blast { animation: dos-blast .9s ease-out forwards; transform-box: fill-box; transform-origin: center }
          .dos-flash { animation: dos-flash .5s ease-out forwards; transform-box: fill-box; transform-origin: center }
          .dos-march { animation: dos-dash .8s linear infinite }
        `}</style>
      </defs>

      <g
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: '0 0',
          transition: animateCamera ? 'transform 450ms ease-in-out' : undefined,
        }}
      >
        <TerrainLayer map={map} />

        {/* Reachable tiles */}
        {reachable.map((c) => {
          const { x, y } = hexToPixel(c)
          return (
            <polygon
              key={`r-${hexKey(c)}`}
              points={hexPoints(x, y, HEX_SIZE - 3)}
              className="fill-amber-300/25 stroke-amber-400/80 dark:fill-amber-400/15"
              strokeWidth={1.5}
            />
          )
        })}

        {/* Unload targets */}
        {unloadTargets.map((c) => {
          const { x, y } = hexToPixel(c)
          return (
            <polygon
              key={`u-${hexKey(c)}`}
              points={hexPoints(x, y, HEX_SIZE - 3)}
              className="animate-pulse fill-teal-300/30 stroke-teal-400"
              strokeWidth={2}
            />
          )
        })}

        {/* Planned path */}
        {path && path.length > 0 && selectedUnitId && (
          <g>
            <polyline
              points={polyline([units.find((u) => u.id === selectedUnitId)!, ...path])}
              className={`dos-march fill-none ${pathBeyondReach ? 'stroke-teal-300' : 'stroke-amber-300'}`}
              strokeWidth={4}
              strokeDasharray="10 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pathMarkers.map(({ coord, turn }) => {
              const { x, y } = hexToPixel(coord)
              return (
                <g key={`m-${hexKey(coord)}`} transform={`translate(${x},${y})`}>
                  <circle r={10} fill="#1c1917" stroke={turn === 1 ? '#fbbf24' : '#5eead4'} strokeWidth={2} />
                  <text
                    textAnchor="middle"
                    dy={4}
                    fill={turn === 1 ? '#fbbf24' : '#5eead4'}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600 }}
                  >
                    {turn}
                  </text>
                </g>
              )
            })}
          </g>
        )}

        {/* Patrol waypoints */}
        {patrolPoints.length > 0 && (
          <g>
            <polyline
              points={polyline(patrolPoints)}
              className="dos-march fill-none stroke-teal-300"
              strokeWidth={3}
              strokeDasharray="6 8"
            />
            {patrolPoints.map((c, i) => {
              const { x, y } = hexToPixel(c)
              return (
                <g key={`p-${i}`} transform={`translate(${x},${y})`}>
                  <circle r={9} fill="#134e4a" stroke="#5eead4" strokeWidth={2} />
                  <text textAnchor="middle" dy={4} fill="#ccfbf1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>
                    {i + 1}
                  </text>
                </g>
              )
            })}
          </g>
        )}

        {/* cities the player has never seen stay hidden in the fog */}
        {cities.filter((c) => tileByKey.get(hexKey(c))?.visibility !== 'unexplored').map((city) => (
          <CityMarker
            key={city.id}
            city={city}
            owner={city.ownerId ? participantById.get(city.ownerId) : undefined}
            selected={city.id === selectedCityId}
            fogged={tileByKey.get(hexKey(city))?.visibility !== 'visible'}
          />
        ))}

        {visibleUnits.map((u) => (
          <UnitToken
            key={u.id}
            unit={u}
            type={typeById.get(u.unitTypeId)}
            owner={participantById.get(u.ownerId)}
            isYours={u.ownerId === youId}
            inCity={cityKeys.has(hexKey(u))}
            selected={u.id === selectedUnitId}
          />
        ))}

        {/* Attack targets */}
        {targets.map((t) => {
          const { x, y } = hexToPixel(t.coord)
          return (
            <g key={`t-${hexKey(t.coord)}`} transform={`translate(${x},${y})`}>
              <polygon points={hexPoints(0, 0, HEX_SIZE - 3)} className="fill-rose-500/20 stroke-rose-500" strokeWidth={2.5} strokeDasharray="5 4" />
              <g transform={`translate(0,${-HEX_SIZE + 6})`}>
                <rect x={-20} y={-9} width={40} height={16} rx={3} fill="#881337" />
                <text textAnchor="middle" dy={3} fill="#ffe4e6" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600 }}>
                  {Math.round(t.winChance * 100)} %
                </text>
              </g>
            </g>
          )
        })}

        {/* Opponent replay ghost */}
        {ghost && (
          <g>
            {ghost.trail.length > 1 && (
              <polyline
                points={polyline(ghost.trail)}
                fill="none"
                stroke={PARTICIPANT_HEX[ghost.color].base}
                strokeWidth={3}
                strokeDasharray="4 6"
                strokeLinecap="round"
                opacity={0.9}
              />
            )}
            {(() => {
              const { x, y } = hexToPixel(ghost.coord)
              return (
                <g style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 400ms ease-in-out' }}>
                  <circle r={22} fill={PARTICIPANT_HEX[ghost.color].base} opacity={0.25} className="animate-ping" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                  <circle r={15} fill={PARTICIPANT_HEX[ghost.color].base} stroke="#1c1917" strokeWidth={3} />
                  <UnitIcon unitTypeId={ghost.unitTypeId} domain={typeById.get(ghost.unitTypeId)?.domain} x={-8} y={-8} width={16} height={16} color="#fff" strokeWidth={2.2} />
                </g>
              )
            })()}
          </g>
        )}

        {/* Combat animation */}
        {combatFx && fxPoint && (
          <g key={combatFx.id} transform={`translate(${fxPoint.x},${fxPoint.y})`} pointerEvents="none">
            <circle r={30} className="dos-blast fill-none stroke-amber-300" strokeWidth={5} />
            <circle r={22} className="dos-blast fill-orange-500/60" style={{ animationDelay: '.12s' }} />
            <path
              d="M0 -26 L6 -8 L24 -10 L10 2 L18 20 L0 9 L-18 20 L-10 2 L-24 -10 L-6 -8 Z"
              className="dos-flash fill-yellow-200"
            />
          </g>
        )}

      </g>
    </svg>
  )
}
