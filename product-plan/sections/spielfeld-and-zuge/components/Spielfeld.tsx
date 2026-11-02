import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, Hourglass, Map as MapIcon, Play, SkipForward, Swords, Trophy, X } from 'lucide-react'
import type { GameEvent, HexCoord, SpielfeldUndZuegeProps } from '../types'
import {
  type AttackTarget,
  attackTargets,
  buildIndex,
  findPath,
  hexKey,
  hexToPixel,
  isWater,
  mapPixelSize,
  neighbors,
  PARTICIPANT_HEX,
  pathTurns,
  reachableTiles,
  sameHex,
} from './hex'
import { type Camera, type Ghost, HexMap, type PathMarker } from './HexMap'
import { UnitPanel } from './UnitPanel'
import { CityPanel } from './CityPanel'
import { EventLog } from './EventLog'
import { MiniMap } from './MiniMap'

// Typography: Big Shoulders Display (headings), Barlow (UI), IBM Plex Mono (numbers)

type Mode = 'normal' | 'patrol' | 'unload'

export function Spielfeld({
  match,
  participants,
  factions,
  unitTypes,
  map,
  cities,
  units,
  events,
  replay,
  combatPreviews,
  lastCombat,
  onSelectUnit,
  onMoveUnit,
  onSetGoto,
  onSetSentry,
  onSetPatrol,
  onCancelOrder,
  onSkipUnit,
  onAttack,
  onUnloadUnit,
  onSelectCity,
  onSetProduction,
  onSelectEvent,
  onSkipReplay,
  onEndTurn,
}: SpielfeldUndZuegeProps) {
  const youId = match.youId
  const you = participants.find((p) => p.id === youId)
  const canAct = match.phase === 'yourTurn'

  const idx = useMemo(() => buildIndex(map, cities, units, unitTypes, youId), [map, cities, units, unitTypes, youId])
  const typeById = useMemo(() => new Map(unitTypes.map((t) => [t.id, t])), [unitTypes])
  const participantById = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 })
  const [animateCamera, setAnimateCamera] = useState(false)
  const centered = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const centerOnPixel = useCallback(
    (px: number, py: number, animate = true) => {
      setAnimateCamera(animate)
      setCamera((c) => ({ ...c, x: viewport.width / 2 - px * c.scale, y: viewport.height / 2 - py * c.scale }))
    },
    [viewport],
  )
  const centerOn = useCallback(
    (c: HexCoord, animate = true) => {
      const { x, y } = hexToPixel(c)
      centerOnPixel(x, y, animate)
    },
    [centerOnPixel],
  )

  const handleCameraChange = (next: Camera) => {
    setAnimateCamera(false)
    setCamera(next)
  }

  // ---------------------------------------------------------------------------
  // Selection & interaction state
  // ---------------------------------------------------------------------------
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ target: HexCoord; path: HexCoord[] } | null>(null)
  const [pendingAttack, setPendingAttack] = useState<{ unitId: string; target: AttackTarget } | null>(null)
  const [mode, setMode] = useState<Mode>('normal')
  const [patrolPoints, setPatrolPoints] = useState<HexCoord[]>([])
  const [unloadCargoId, setUnloadCargoId] = useState<string | null>(null)
  const [combatFx, setCombatFx] = useState<{ coord: HexCoord; id: number } | null>(null)
  const [toast, setToast] = useState<typeof lastCombat>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [minimapOpen, setMinimapOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? null
  const selectedType = selectedUnit ? typeById.get(selectedUnit.unitTypeId) : undefined
  const selectedIsYours = selectedUnit?.ownerId === youId
  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null

  const reach = useMemo(
    () => (selectedUnit && selectedIsYours && canAct && mode === 'normal' ? reachableTiles(selectedUnit, idx) : new Map()),
    [selectedUnit, selectedIsYours, canAct, mode, idx],
  )
  const targets = useMemo(
    () =>
      selectedUnit && selectedIsYours && canAct && mode === 'normal'
        ? attackTargets(selectedUnit, idx, units, cities, combatPreviews)
        : [],
    [selectedUnit, selectedIsYours, canAct, mode, idx, units, cities, combatPreviews],
  )

  const pathMarkers: PathMarker[] = useMemo(() => {
    if (!preview || !selectedUnit || !selectedType) return []
    const turns = pathTurns(selectedUnit, selectedType, preview.path.length)
    return preview.path
      .map((coord, i) => ({ coord, turn: turns[i] }))
      .filter((m, i, all) => i === all.length - 1 || all[i + 1].turn !== m.turn)
  }, [preview, selectedUnit, selectedType])
  const previewBeyondReach = !!preview && !reach.has(hexKey(preview.target))

  const unloadTargets = useMemo(() => {
    if (mode !== 'unload' || !selectedUnit) return []
    return neighbors(selectedUnit).filter((n) => {
      const t = idx.tileAt(n)
      const city = idx.cityAt(n)
      return (
        !!t &&
        t.visibility !== 'unexplored' &&
        !isWater(t.terrain) &&
        (!city || city.ownerId === youId) &&
        !idx.unitsAt(n).some((u) => u.ownerId !== youId)
      )
    })
  }, [mode, selectedUnit, idx, youId])

  const pendingOrders = units.filter((u) => u.ownerId === youId && u.needsOrders && !u.carriedBy)

  const resetTransient = () => {
    setPreview(null)
    setPendingAttack(null)
    setMode('normal')
    setPatrolPoints([])
    setUnloadCargoId(null)
  }

  const selectUnit = (id: string | null) => {
    resetTransient()
    setSelectedUnitId(id)
    if (id) {
      setSelectedCityId(null)
      const u = units.find((x) => x.id === id)
      if (u?.ownerId === youId) onSelectUnit?.(id)
    }
  }

  const openCity = (id: string) => {
    resetTransient()
    setSelectedUnitId(null)
    setSelectedCityId(id)
    if (cities.find((c) => c.id === id)?.ownerId === youId) onSelectCity?.(id)
  }

  // Initial camera: first unit that needs orders, otherwise the capital
  useEffect(() => {
    if (centered.current || viewport.width === 0) return
    centered.current = true
    const start =
      pendingOrders[0] ?? cities.find((c) => c.ownerId === youId && c.isCapital) ?? { col: map.width / 2, row: map.height / 2 }
    const scale = viewport.width < 640 ? 0.85 : 1.1
    const { x, y } = hexToPixel(start)
    setCamera({ scale, x: viewport.width / 2 - x * scale, y: viewport.height / 2 - y * scale })
  }, [viewport, pendingOrders, cities, youId, map])

  // Deselect units that disappeared (destroyed or loaded)
  useEffect(() => {
    // aircraft stay selectable on a carrier so they can take off again
    const stillSelectable = units.some(
      (u) => u.id === selectedUnitId && (!u.carriedBy || typeById.get(u.unitTypeId)?.domain === 'air'),
    )
    if (selectedUnitId && !stillSelectable) setSelectedUnitId(null)
  }, [units, selectedUnitId, typeById])

  // ---------------------------------------------------------------------------
  // Combat result
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!lastCombat) return
    setToast(lastCombat)
    if (lastCombat.outcome === 'victory' && lastCombat.targetCityId) openCity(lastCombat.targetCityId)
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCombat])

  const confirmAttack = () => {
    if (!pendingAttack) return
    const { unitId, target } = pendingAttack
    setCombatFx({ coord: target.coord, id: Date.now() })
    setPendingAttack(null)
    setPreview(null)
    onAttack?.(unitId, { unitId: target.unitId, cityId: target.cityId })
  }

  // ---------------------------------------------------------------------------
  // Opponent replay
  // ---------------------------------------------------------------------------
  const [replayPos, setReplayPos] = useState({ action: 0, step: 0 })
  const replayAction = match.phase === 'replay' ? replay[replayPos.action] : undefined

  // Callbacks change identity on every render; keep them out of the timer effect's deps
  const replayCallbacks = useRef({ onSkipReplay, centerOn })
  useEffect(() => {
    replayCallbacks.current = { onSkipReplay, centerOn }
  })

  useEffect(() => {
    if (match.phase !== 'replay') return
    if (!replayAction) {
      replayCallbacks.current.onSkipReplay?.()
      return
    }
    const last = replayAction.path.length - 1
    const current = replayAction.path[replayPos.step]
    if (viewport.width > 0) replayCallbacks.current.centerOn(current)
    if (replayPos.step === last && replayAction.action !== 'move') setCombatFx({ coord: current, id: Date.now() })
    const t = setTimeout(
      () =>
        setReplayPos((p) => (p.step < last ? { ...p, step: p.step + 1 } : { action: p.action + 1, step: 0 })),
      replayPos.step === last ? 1100 : 500,
    )
    return () => clearTimeout(t)
  }, [match.phase, replayAction, replayPos, viewport.width])

  const ghost: Ghost | null = replayAction
    ? {
        coord: replayAction.path[replayPos.step],
        trail: replayAction.path.slice(0, replayPos.step + 1),
        unitTypeId: replayAction.unitTypeId,
        color: participantById.get(replayAction.participantId)?.color ?? 'rose',
      }
    : null

  // ---------------------------------------------------------------------------
  // Map input
  // ---------------------------------------------------------------------------
  const ownUnitAt = (c: HexCoord) =>
    idx.unitsAt(c).find((u) => u.ownerId === youId && (u.needsOrders || u.id !== selectedUnitId)) ??
    idx.unitsAt(c).find((u) => u.ownerId === youId)

  const commitMove = (unitId: string, target: HexCoord, inReach: boolean) => {
    if (inReach) onMoveUnit?.(unitId, target)
    else onSetGoto?.(unitId, target)
    setPreview(null)
  }

  const handleTap = (c: HexCoord) => {
    if (!idx.tileAt(c)) return

    if (canAct && selectedUnit && selectedIsYours) {
      if (mode === 'patrol') {
        setPatrolPoints((pts) => [...pts, c])
        return
      }
      if (mode === 'unload') {
        if (unloadCargoId && unloadTargets.some((t) => sameHex(t, c))) onUnloadUnit?.(unloadCargoId, c)
        setMode('normal')
        setUnloadCargoId(null)
        return
      }
      const target = targets.find((t) => sameHex(t.coord, c))
      if (target) {
        setPreview(null)
        setPendingAttack({ unitId: selectedUnit.id, target })
        return
      }
      if (preview && sameHex(preview.target, c)) {
        commitMove(selectedUnit.id, c, reach.has(hexKey(c)))
        return
      }
      const ownHere = ownUnitAt(c)
      if (!ownHere || ownHere.id === selectedUnit.id || reach.has(hexKey(c))) {
        const path = findPath(selectedUnit, c, idx)
        if (path) {
          setPendingAttack(null)
          setPreview({ target: c, path })
          return
        }
      }
    }

    const own = ownUnitAt(c)
    const city = idx.cityAt(c)
    // Repeated taps on a tile cycle: unit → city → nothing
    if (city && city.id === selectedCityId) {
      setSelectedCityId(null)
      return
    }
    if (own && own.id !== selectedUnitId) {
      selectUnit(own.id)
      return
    }
    if (city) {
      openCity(city.id)
      return
    }
    const other = idx.unitsAt(c).find((u) => u.ownerId !== youId)
    if (other && idx.tileAt(c)?.visibility === 'visible') {
      selectUnit(other.id)
      return
    }
    selectUnit(null)
    setSelectedCityId(null)
  }

  const handleDrag = (unitId: string, c: HexCoord) => {
    if (!canAct) return
    if (selectedUnitId !== unitId) {
      setSelectedUnitId(unitId)
      setSelectedCityId(null)
      setMode('normal')
      onSelectUnit?.(unitId)
    }
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return
    const path = findPath(unit, c, idx)
    setPreview(path ? { target: c, path } : null)
  }

  const handleDragEnd = (unitId: string, c: HexCoord) => {
    if (!canAct) return
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return
    const target = attackTargets(unit, idx, units, cities, combatPreviews).find((t) => sameHex(t.coord, c))
    if (target) {
      setPreview(null)
      setPendingAttack({ unitId, target })
      return
    }
    if (findPath(unit, c, idx)) commitMove(unitId, c, reachableTiles(unit, idx).has(hexKey(c)))
    else setPreview(null)
  }

  const draggableUnitAt = (c: HexCoord) => {
    if (!canAct || mode !== 'normal') return null
    return ownUnitAt(c)?.id ?? null
  }

  // Right click / Esc: undo the innermost step first
  const cancelStep = () => {
    if (confirmEnd) setConfirmEnd(false)
    else if (pendingAttack) setPendingAttack(null)
    else if (mode !== 'normal') resetTransient()
    else if (preview) setPreview(null)
    else if (selectedUnitId) selectUnit(null)
    else if (selectedCityId) setSelectedCityId(null)
    else if (logOpen) setLogOpen(false)
  }
  const cancelRef = useRef(cancelStep)
  useEffect(() => {
    cancelRef.current = cancelStep
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const nextUnit = () => {
    if (pendingOrders.length === 0) return
    const i = pendingOrders.findIndex((u) => u.id === selectedUnitId)
    const next = pendingOrders[(i + 1) % pendingOrders.length]
    selectUnit(next.id)
    centerOn(next)
  }

  const handleEndTurn = () => {
    if (pendingOrders.length > 0 && !confirmEnd) {
      setConfirmEnd(true)
      return
    }
    setConfirmEnd(false)
    selectUnit(null)
    setSelectedCityId(null)
    onEndTurn?.()
  }

  const handleEvent = (e: GameEvent) => {
    onSelectEvent?.(e.id)
    centerOn(e)
    if (viewport.width < 768) setLogOpen(false)
  }

  const buildable = useMemo(() => {
    if (!selectedCity) return []
    const coastal = neighbors(selectedCity).some((n) => {
      const t = idx.tileAt(n)
      return !!t && isWater(t.terrain)
    })
    return unitTypes.filter(
      (t) => (t.factionId === null || t.factionId === you?.factionId) && (t.domain !== 'sea' || coastal),
    )
  }, [selectedCity, unitTypes, you, idx])

  const sheetOpen = !!selectedUnit || !!selectedCity
  const mapSize = mapPixelSize(map)
  const attacker = pendingAttack ? units.find((u) => u.id === pendingAttack.unitId) : undefined
  const defenderName = pendingAttack
    ? pendingAttack.target.unitId
      ? typeById.get(units.find((u) => u.id === pendingAttack.target.unitId)?.unitTypeId ?? '')?.name
      : cities.find((c) => c.id === pendingAttack.target.cityId)?.name
    : undefined
  const replayActor = replayAction ? participantById.get(replayAction.participantId) : undefined
  const waitingFor = participants.filter((p) => !p.isYou && p.status === 'active').map((p) => p.name)

  return (
    <div
      ref={containerRef}
      className="relative size-full overflow-hidden bg-[#5f8f8b] font-['Barlow'] text-stone-900 dark:bg-[#0b2226] dark:text-stone-100"
    >
      <HexMap
        map={map}
        cities={cities}
        units={units}
        unitTypes={unitTypes}
        participants={participants}
        youId={youId}
        camera={camera}
        animateCamera={animateCamera}
        onCameraChange={handleCameraChange}
        selectedUnitId={selectedUnitId}
        selectedCityId={selectedCityId}
        reachable={[...reach.values()].map((r) => r.coord)}
        targets={targets}
        path={preview?.path ?? null}
        pathMarkers={pathMarkers}
        pathBeyondReach={previewBeyondReach}
        patrolPoints={selectedUnit ? (mode === 'patrol' ? [selectedUnit, ...patrolPoints] : []) : []}
        unloadTargets={unloadTargets}
        ghost={ghost}
        combatFx={combatFx}
        draggableUnitAt={draggableUnitAt}
        onTap={handleTap}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onCancel={cancelStep}
      />

      {/* Atmosphere: vignette and grain */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(28,25,23,0.55)] dark:shadow-[inset_0_0_160px_rgba(0,0,0,0.8)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Top-left: event log */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
        <EventLog events={events} open={logOpen} onToggle={() => setLogOpen((o) => !o)} onSelect={handleEvent} />
      </div>

      {/* Top-right: minimap toggle on mobile */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
        <button
          type="button"
          onClick={() => setMinimapOpen((o) => !o)}
          aria-label="Minikarte ein- oder ausblenden"
          aria-pressed={minimapOpen}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-lg border border-stone-300 bg-white/90 shadow-lg backdrop-blur md:hidden dark:border-stone-700 dark:bg-stone-900/90"
        >
          <MapIcon className="size-5" />
        </button>
      </div>

      {/* Minimap */}
      <div
        className={`${minimapOpen ? 'block' : 'hidden'} absolute right-3 top-16 z-10 w-44 overflow-hidden rounded-lg border-2 border-stone-800 shadow-xl md:right-4 md:top-auto md:block md:w-56 ${
          selectedCity ? 'md:bottom-4 lg:right-[25rem]' : 'md:bottom-4'
        } dark:border-stone-600`}
      >
        <div className="flex items-center justify-between bg-stone-900 px-2 py-0.5 font-['Big_Shoulders_Display'] text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
          Lagekarte <Crosshair className="size-3" />
        </div>
        <MiniMap
          map={map}
          cities={cities}
          participants={participants}
          camera={camera}
          viewport={viewport}
          onJump={(x, y) => centerOnPixel(Math.min(Math.max(x, 0), mapSize.width), Math.min(Math.max(y, 0), mapSize.height))}
        />
      </div>

      {/* Replay overlay */}
      {replayAction && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-3 sm:top-4">
          <div className="flex items-center gap-3 rounded-full border border-stone-700 bg-stone-950/90 py-1.5 pl-4 pr-1.5 text-stone-100 shadow-2xl backdrop-blur">
            <Play className="size-4 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <p className="font-['Big_Shoulders_Display'] text-sm font-bold uppercase leading-tight tracking-widest">
                Gegnerzug ·{' '}
                <span style={{ color: replayActor ? PARTICIPANT_HEX[replayActor.color].base : undefined }}>{replayActor?.name}</span>
              </p>
              <p className="truncate text-xs text-stone-400">
                {typeById.get(replayAction.unitTypeId)?.name}{' '}
                {replayAction.action === 'move' ? 'bewegt sich' : replayAction.action === 'attack' ? 'greift an' : 'erobert'}
                {replayAction.result && ` · ${replayAction.result}`}
              </p>
            </div>
            <span className="font-['IBM_Plex_Mono'] text-xs text-stone-400">
              {replayPos.action + 1}/{replay.length}
            </span>
            <button
              type="button"
              onClick={() => onSkipReplay?.()}
              className="flex min-h-10 items-center gap-1 rounded-full bg-stone-800 px-3 text-xs font-semibold uppercase tracking-wide hover:bg-stone-700"
            >
              <SkipForward className="size-4" /> Überspringen
            </button>
          </div>
        </div>
      )}

      {/* Combat toast */}
      {toast && (
        <div className="absolute inset-x-0 top-16 z-30 flex justify-center px-3 sm:top-4" role="status">
          <div
            className={`flex max-w-md items-center gap-3 rounded-lg border-l-4 bg-stone-950/95 px-4 py-3 text-stone-100 shadow-2xl animate-in fade-in slide-in-from-top-2 ${
              toast.outcome === 'victory' ? 'border-teal-400' : 'border-rose-500'
            }`}
          >
            {toast.outcome === 'victory' ? (
              <Trophy className="size-6 shrink-0 text-teal-300" />
            ) : (
              <Swords className="size-6 shrink-0 text-rose-400" />
            )}
            <div className="min-w-0">
              <p className="font-['Big_Shoulders_Display'] text-lg font-black uppercase leading-tight tracking-widest">
                {toast.outcome === 'victory' ? 'Sieg' : 'Niederlage'}
              </p>
              <p className="text-sm text-stone-300">{toast.message}</p>
              <p className="mt-0.5 font-['IBM_Plex_Mono'] text-[11px] text-stone-400">
                Schaden: eigene −{toast.attackerDamage} · Gegner −{toast.defenderDamage}
              </p>
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label="Schließen" className="flex size-9 items-center justify-center rounded text-stone-400 hover:text-stone-100">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Waiting banner */}
      {match.phase === 'waiting' && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-3 sm:top-4">
          <div className="flex items-center gap-2 rounded-full bg-stone-950/90 px-4 py-2 text-sm text-stone-200 shadow-xl">
            <Hourglass className="size-4 animate-pulse text-amber-400" />
            Warte auf {waitingFor.join(' & ')} …
          </div>
        </div>
      )}

      {/* Bottom-left: unit info / sheet */}
      {selectedUnit && selectedType && (
        <div className="absolute inset-x-0 bottom-0 z-20 md:inset-x-auto md:bottom-4 md:left-4 md:w-96">
          <UnitPanel
            unit={selectedUnit}
            type={selectedType}
            owner={participantById.get(selectedUnit.ownerId)}
            faction={factions.find((f) => f.id === participantById.get(selectedUnit.ownerId)?.factionId)}
            isYours={selectedIsYours}
            cargo={selectedUnit.cargoUnitIds.flatMap((id) => {
              const u = units.find((x) => x.id === id)
              return u ? [{ unit: u, type: typeById.get(u.unitTypeId) }] : []
            })}
            mode={mode}
            patrolCount={patrolPoints.length}
            disabled={!canAct}
            onSentry={() => {
              onSetSentry?.(selectedUnit.id)
              setPreview(null)
            }}
            onPatrolStart={() => {
              resetTransient()
              setMode('patrol')
            }}
            onPatrolConfirm={() => {
              onSetPatrol?.(selectedUnit.id, [selectedUnit, ...patrolPoints])
              resetTransient()
            }}
            onCancelMode={resetTransient}
            onCancelOrder={() => onCancelOrder?.(selectedUnit.id)}
            onSkip={() => {
              onSkipUnit?.(selectedUnit.id)
              nextUnit()
            }}
            onUnloadStart={(id) => {
              resetTransient()
              setUnloadCargoId(id)
              setMode('unload')
            }}
            onSelectCargo={(id) => selectUnit(id)}
            onClose={() => selectUnit(null)}
          />
        </div>
      )}

      {/* Right: city panel / sheet */}
      {selectedCity && (
        <div className="absolute inset-x-0 bottom-0 z-20 max-h-[70%] md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-96">
          <CityPanel
            city={selectedCity}
            owner={selectedCity.ownerId ? participantById.get(selectedCity.ownerId) : undefined}
            isYours={selectedCity.ownerId === youId}
            buildable={buildable}
            faction={factions.find((f) => f.id === participantById.get(selectedCity.ownerId ?? '')?.factionId)}
            disabled={!canAct}
            onSetProduction={(typeId) => onSetProduction?.(selectedCity.id, typeId)}
            onClose={() => setSelectedCityId(null)}
          />
        </div>
      )}

      {/* Attack confirmation */}
      {pendingAttack && attacker && (
        <div className="absolute inset-x-0 bottom-24 z-30 flex justify-center px-3 md:bottom-28">
          <div className="w-full max-w-sm rounded-xl border border-rose-500/60 bg-stone-950/95 p-4 text-stone-100 shadow-2xl">
            <p className="font-['Big_Shoulders_Display'] text-xs font-bold uppercase tracking-[0.25em] text-rose-400">Angriff</p>
            <p className="mt-0.5 text-sm">
              {typeById.get(attacker.unitTypeId)?.name} → <strong>{defenderName}</strong>
            </p>
            <div className="my-3 flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-rose-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-400"
                  style={{ width: `${pendingAttack.target.winChance * 100}%` }}
                />
              </div>
              <span className="font-['IBM_Plex_Mono'] text-lg font-semibold">{Math.round(pendingAttack.target.winChance * 100)} %</span>
            </div>
            <p className="mb-3 text-xs text-stone-400">Siegchance</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingAttack(null)}
                className="min-h-11 flex-1 rounded-md border border-stone-600 text-sm font-semibold hover:bg-stone-800"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmAttack}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 text-sm font-bold uppercase tracking-wider text-white hover:bg-rose-500"
              >
                <Swords className="size-4" /> Angreifen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div
        className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 items-stretch gap-2 rounded-xl border border-stone-800 bg-stone-950/90 p-1.5 shadow-2xl backdrop-blur ${
          sheetOpen ? 'hidden md:flex' : 'flex'
        } ${selectedUnit ? 'md:left-[calc(50%+12rem)]' : ''}`}
      >
        <button
          type="button"
          onClick={nextUnit}
          disabled={!canAct || pendingOrders.length === 0}
          className="flex min-h-12 items-center gap-2 rounded-lg px-3 text-stone-200 transition-colors hover:bg-stone-800 disabled:opacity-40"
        >
          <Crosshair className="size-5" />
          <span className="whitespace-nowrap font-['Big_Shoulders_Display'] text-sm font-bold uppercase tracking-widest">
            Nächste<span className="hidden sm:inline"> Einheit</span>
          </span>
          <span className="rounded bg-stone-800 px-1.5 font-['IBM_Plex_Mono'] text-xs text-amber-300">{pendingOrders.length}</span>
        </button>
        <button
          type="button"
          onClick={handleEndTurn}
          disabled={!canAct}
          className="min-h-12 whitespace-nowrap rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 px-5 font-['Big_Shoulders_Display'] text-base font-black uppercase tracking-[0.18em] text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:from-amber-300 hover:to-amber-500 disabled:from-stone-600 disabled:to-stone-700 disabled:text-stone-400"
        >
          Zug beenden
        </button>
      </div>

      {/* End-turn confirmation */}
      {confirmEnd && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-stone-950/50 p-3 sm:items-center">
          <div role="alertdialog" aria-labelledby="dos-end-title" className="w-full max-w-sm rounded-xl border border-stone-300 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
            <h2 id="dos-end-title" className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wider">
              Zug beenden?
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {pendingOrders.length} {pendingOrders.length === 1 ? 'Einheit hat' : 'Einheiten haben'} in dieser Runde noch keine Befehle.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmEnd(false)
                  nextUnit()
                }}
                className="min-h-11 flex-1 rounded-md border border-stone-300 text-sm font-semibold hover:border-teal-500 dark:border-stone-600"
              >
                Zu den Einheiten
              </button>
              <button
                type="button"
                onClick={handleEndTurn}
                className="min-h-11 flex-1 rounded-md bg-amber-500 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-400"
              >
                Trotzdem beenden
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
