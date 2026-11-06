import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { Crown, Eye, Flag, Repeat } from 'lucide-react'
import type {
  City,
  GameMap,
  HexCoord,
  Participant,
  Unit,
  UnitType,
} from '../types'
import { HEX_SIZE, PARTICIPANT_HEX, hexKey, hexPoints, hexToPixel, pixelToHex, visibilityAt } from './hex'
import type { AttackTarget } from './hex'
import { type Camera, clampCamera, inRange, type TileRange, type Viewport, zoomAt } from './camera'
import { type CameraStore, useCameraRange } from './cameraStore'
import { TerrainCanvas } from './TerrainCanvas'
import { UnitIcon } from './unitIcons'

export type { Camera } from './camera'

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
  /** Camera outside React: pan and zoom move the world group without a render */
  store: CameraStore
  viewport: Viewport
  selectedUnitId?: string | null
  selectedCityId?: string | null
  reachable: HexCoord[]
  /** Reachable tiles from which an aircraft could not return to a base */
  unsafeTiles?: HexCoord[]
  targets: AttackTarget[]
  path: HexCoord[] | null
  pathMarkers: PathMarker[]
  pathBeyondReach?: boolean
  patrolPoints: HexCoord[]
  unloadTargets: HexCoord[]
  ghost?: Ghost | null
  combatFx?: { coord: HexCoord; id: number } | null
  /** Muzzle flash at the attacker during the combat sequence */
  muzzleFx?: { coord: HexCoord; id: number } | null
  /** Units drawn as a ghost instead of their token (combat sequence) */
  hiddenUnitIds?: Set<string>
  /** Units fading out (combat losers) */
  fadingUnitIds?: Set<string>
  draggableUnitAt: (c: HexCoord) => string | null
  /** Tutorial: tile the current step points at (pulsing ring) */
  highlight?: HexCoord | null
  onTap: (c: HexCoord) => void
  onDrag: (unitId: string, c: HexCoord) => void
  onDragEnd: (unitId: string, c: HexCoord) => void
  /** Right click: step back out of the current selection */
  onCancel: () => void
}

/** Hex outlines around the origin; markers translate them instead of computing points per tile */
const HEX_INNER = hexPoints(0, 0, HEX_SIZE - 3)
const at = (c: HexCoord) => {
  const { x, y } = hexToPixel(c)
  return `translate(${x},${y})`
}

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
        <polygon points={HEX_INNER} className="fill-none stroke-amber-300" strokeWidth={3} />
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
  stackCount,
  fading,
}: {
  unit: Unit
  type?: UnitType
  owner?: Participant
  isYours: boolean
  inCity: boolean
  selected: boolean
  /** Units on this tile (cargo excluded); more than one shows a badge */
  stackCount: number
  fading: boolean
}) {
  const p = hexToPixel(unit)
  const x = inCity ? p.x + 13 : p.x
  const y = inCity ? p.y - 12 : p.y
  const scale = inCity ? 0.82 : 1
  const color = PARTICIPANT_HEX[owner?.color ?? 'amber']
  // Hit points as a share of the type's maximum
  const hpShare = type ? unit.hp / type.hitPoints : 1
  const healthColor = hpShare > 2 / 3 ? '#84cc16' : hpShare > 1 / 3 ? '#f59e0b' : '#f43f5e'
  const orderIconProps = { x: -4.5, y: -4.5, width: 9, height: 9, color: '#5eead4', strokeWidth: 2.4 }

  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 400ms ease-out' }}
    >
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
        <rect width={24 * Math.max(0, Math.min(1, hpShare))} height={4} rx={1} fill={healthColor} />
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
      {stackCount > 1 && (
        <g transform="translate(13,13)" data-testid="stack-badge" aria-label={`${stackCount} Einheiten`}>
          <circle r={7} fill="#1c1917" stroke="#e7e5e4" strokeWidth={1.2} />
          <text
            textAnchor="middle"
            dy={3.5}
            fill="#f5f5f4"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600 }}
          >
            {stackCount}
          </text>
        </g>
      )}
    </g>
  )
}

/** Reachable, unsafe and unload tiles, culled to the camera range (null = everything) */
const ReachLayer = memo(function ReachLayer({
  reachable,
  unsafeTiles,
  unloadTargets,
  range,
}: {
  reachable: HexCoord[]
  unsafeTiles: HexCoord[]
  unloadTargets: HexCoord[]
  range: TileRange | null
}) {
  const shown = (list: HexCoord[]) => (range ? list.filter((c) => inRange(range, c)) : list)
  return (
    <g>
      {shown(reachable).map((c) => (
        <polygon
          key={`r-${hexKey(c)}`}
          points={HEX_INNER}
          transform={at(c)}
          className="fill-amber-300/25 stroke-amber-400/80 dark:fill-amber-400/15"
          strokeWidth={1.5}
        />
      ))}
      {/* No way back: the aircraft could not reach a base from here */}
      {shown(unsafeTiles).map((c) => (
        <g key={`n-${hexKey(c)}`} transform={at(c)} data-testid="unsafe-tile">
          <polygon points={HEX_INNER} fill="url(#dos-hatch-rose)" />
          <polygon points={HEX_INNER} className="fill-rose-500/15 stroke-rose-500/80" strokeWidth={1.5} />
        </g>
      ))}
      {shown(unloadTargets).map((c) => (
        <polygon
          key={`u-${hexKey(c)}`}
          points={HEX_INNER}
          transform={at(c)}
          className="animate-pulse fill-teal-300/30 stroke-teal-400"
          strokeWidth={2}
        />
      ))}
    </g>
  )
})

/** Cities the player has seen, within the camera range; never-seen cities stay in the fog */
const CityLayer = memo(function CityLayer({
  map,
  cities,
  participantById,
  selectedCityId,
  range,
}: {
  map: GameMap
  cities: City[]
  participantById: Map<string, Participant>
  selectedCityId?: string | null
  range: TileRange | null
}) {
  return (
    <g>
      {cities.map((city) => {
        const vis = visibilityAt(map, city)
        if (vis === 'unexplored' || !inRange(range, city)) return null
        return (
          <CityMarker
            key={city.id}
            city={city}
            owner={city.ownerId ? participantById.get(city.ownerId) : undefined}
            selected={city.id === selectedCityId}
            fogged={vis !== 'visible'}
          />
        )
      })}
    </g>
  )
})

/** Unit tokens, one per tile, within the camera range; the selected unit is always drawn */
const TokenLayer = memo(function TokenLayer({
  map,
  units,
  typeById,
  participantById,
  youId,
  selectedUnitId,
  cityKeys,
  hiddenUnitIds,
  fadingUnitIds,
  range,
}: {
  map: GameMap
  units: Unit[]
  typeById: Map<string, UnitType>
  participantById: Map<string, Participant>
  youId: string
  selectedUnitId?: string | null
  cityKeys: Set<string>
  hiddenUnitIds?: Set<string>
  fadingUnitIds?: Set<string>
  range: TileRange | null
}) {
  // own units are always shown; enemies only where the player currently has vision
  const visibleUnits = units.filter(
    (u) =>
      !u.carriedBy &&
      !hiddenUnitIds?.has(u.id) &&
      (u.id === selectedUnitId || inRange(range, u)) &&
      (u.ownerId === youId || visibilityAt(map, u) === 'visible'),
  )
  // One token per tile: the selected unit, else an own unit waiting for orders, else the first
  const stacks = new Map<string, Unit[]>()
  for (const u of visibleUnits) {
    const k = hexKey(u)
    const s = stacks.get(k)
    if (s) s.push(u)
    else stacks.set(k, [u])
  }
  return (
    <g>
      {[...stacks.values()].map((stack) => {
        const u =
          stack.find((x) => x.id === selectedUnitId) ??
          stack.find((x) => x.ownerId === youId && x.needsOrders) ??
          stack[0]!
        return (
          <UnitToken
            key={u.id}
            unit={u}
            type={typeById.get(u.unitTypeId)}
            owner={participantById.get(u.ownerId)}
            isYours={u.ownerId === youId}
            inCity={cityKeys.has(hexKey(u))}
            selected={u.id === selectedUnitId}
            stackCount={stack.length}
            fading={!!fadingUnitIds?.has(u.id)}
          />
        )
      })}
    </g>
  )
})

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
  store,
  viewport,
  selectedUnitId,
  selectedCityId,
  reachable,
  targets,
  path,
  pathMarkers,
  pathBeyondReach,
  patrolPoints,
  unloadTargets,
  unsafeTiles = [],
  ghost,
  combatFx,
  muzzleFx,
  hiddenUnitIds,
  fadingUnitIds,
  draggableUnitAt,
  highlight = null,
  onTap,
  onDrag,
  onDragEnd,
  onCancel,
}: HexMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const worldRef = useRef<SVGGElement>(null)
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
  const cityKeys = useMemo(() => new Set(cities.map(hexKey)), [cities])
  // Tiles under the viewport (null in jsdom: everything is rendered)
  const range = useCameraRange(store, viewport, map)

  // The world group follows the camera imperatively: no React render per pointer move
  useLayoutEffect(() => {
    const apply = (cam: Camera) =>
      worldRef.current?.setAttribute('transform', `translate(${cam.x} ${cam.y}) scale(${cam.scale})`)
    apply(store.get())
    return store.subscribe(apply)
  }, [store])

  const local = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }
  const hexAtScreen = (sx: number, sy: number) => {
    const cam = store.get()
    return pixelToHex((sx - cam.x) / cam.scale, (sy - cam.y) / cam.scale)
  }
  const moveCamera = (next: Camera) => store.set(clampCamera(next, viewport, map))
  const zoomTo = (sx: number, sy: number, nextScale: number, from: Camera) =>
    store.set(zoomAt(from, sx, sy, nextScale, viewport, map))

  const handlePointerDown = (e: React.PointerEvent) => {
    // only the primary button selects, moves and pans; right click cancels via onContextMenu
    if (e.pointerType === 'mouse' && e.button !== 0) return
    svgRef.current?.setPointerCapture(e.pointerId)
    const p = local(e.clientX, e.clientY)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) {
      const hex = hexAtScreen(p.x, p.y)
      gesture.current = { startX: p.x, startY: p.y, cam: store.get(), unitId: draggableUnitAt(hex), moved: false }
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { ...gesture.current, unitId: null, moved: true, cam: store.get(), pinchDist: Math.hypot(a.x - b.x, a.y - b.y) }
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
      zoomTo((a.x + b.x) / 2, (a.y + b.y) / 2, g.cam.scale * (dist / g.pinchDist), g.cam)
      return
    }

    const dx = p.x - g.startX
    const dy = p.y - g.startY
    if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true
    if (!g.moved) return
    if (g.unitId) onDrag(g.unitId, hexAtScreen(p.x, p.y))
    else moveCamera({ ...g.cam, x: g.cam.x + dx, y: g.cam.y + dy })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    const p = local(e.clientX, e.clientY)
    pointers.current.delete(e.pointerId)
    if (pointers.current.size > 0) {
      // finishing a pinch: continue panning with the remaining finger
      const [rest] = [...pointers.current.values()]
      gesture.current = { startX: rest.x, startY: rest.y, cam: store.get(), unitId: null, moved: true }
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
    const cam = store.get()
    zoomTo(p.x, p.y, cam.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), cam)
  }

  const targetMarkers = [...new Map(targets.map((t) => [hexKey(t.coord), t] as const).reverse()).values()].reverse()
  const fxPoint = combatFx ? hexToPixel(combatFx.coord) : null
  const muzzlePoint = muzzleFx ? hexToPixel(muzzleFx.coord) : null

  return (
    <>
      <TerrainCanvas map={map} store={store} viewport={viewport} />
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
          <pattern id="dos-hatch-rose" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#f43f5e" strokeOpacity="0.45" strokeWidth="2.5" />
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

        <g ref={worldRef}>
          <ReachLayer reachable={reachable} unsafeTiles={unsafeTiles} unloadTargets={unloadTargets} range={range} />

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

          <CityLayer
            map={map}
            cities={cities}
            participantById={participantById}
            selectedCityId={selectedCityId}
            range={range}
          />

          <TokenLayer
            map={map}
            units={units}
            typeById={typeById}
            participantById={participantById}
            youId={youId}
            selectedUnitId={selectedUnitId}
            cityKeys={cityKeys}
            hiddenUnitIds={hiddenUnitIds}
            fadingUnitIds={fadingUnitIds}
            range={range}
          />

          {/* Attack targets: one marker per tile (a stack lists every unit as a target; duplicate
              keys would leave stale markers behind when the list changes) */}
          {targetMarkers.map((t) => {
            const { x, y } = hexToPixel(t.coord)
            return (
              <g key={`t-${hexKey(t.coord)}`} transform={`translate(${x},${y})`} data-testid="attack-marker">
                <polygon points={HEX_INNER} className="fill-rose-500/20 stroke-rose-500" strokeWidth={2.5} strokeDasharray="5 4" />
                <g transform={`translate(0,${-HEX_SIZE + 6})`}>
                  <rect x={-20} y={-9} width={40} height={16} rx={3} fill="#881337" />
                  <text textAnchor="middle" dy={3} fill="#ffe4e6" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600 }}>
                    {Math.round(t.odds.killChance * 100)} %
                  </text>
                </g>
              </g>
            )
          })}

          {/* Tutorial: the tile the current step is about */}
          {highlight && (
            <g
              transform={`translate(${hexToPixel(highlight).x},${hexToPixel(highlight).y})`}
              pointerEvents="none"
              data-testid="tutorial-highlight"
            >
              <polygon points={HEX_INNER} className="animate-pulse fill-teal-300/15 stroke-teal-300" strokeWidth={4} />
            </g>
          )}

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

          {/* Muzzle flash at the attacker */}
          {muzzleFx && muzzlePoint && (
            <g key={`m-${muzzleFx.id}`} transform={`translate(${muzzlePoint.x},${muzzlePoint.y})`} pointerEvents="none" data-testid="muzzle-fx">
              <path
                d="M14 -6 L20 -14 L18 -4 L28 -8 L20 0 L28 6 L18 3 L20 12 L14 4 L10 0 Z"
                className="dos-flash fill-amber-200"
              />
            </g>
          )}

          {/* Combat animation */}
          {combatFx && fxPoint && (
            <g key={combatFx.id} transform={`translate(${fxPoint.x},${fxPoint.y})`} pointerEvents="none" data-testid="combat-fx">
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
    </>
  )
}
