import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gameText } from './report'
import { Crosshair, Crown, Fuel, Hourglass, Map as MapIcon, Maximize2, Play, SkipForward, Swords, Trophy, X } from 'lucide-react'
import type { BoardCue, GameEvent, HexCoord, SpielfeldUndZuegeProps, Unit } from '../types'
import { ambienceMix, mixChanged } from '../../../audio/ambience'
import {
  type AttackTarget,
  attackTargets,
  buildIndex,
  findPath,
  hexDistance,
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
import { defenseModifiers } from '@dos/shared/game/rules'
import { airBases, moveSafety, returnDistance, strandedAircraft, unsafeTiles } from '@dos/shared/game/fuel'
import { type Ghost, HexMap, type PathMarker } from './HexMap'
import { centerCamera, clampCamera, fitCamera, scaleBounds, zoomAt, zoomSpeed } from './camera'
import { createCameraStore } from './cameraStore'
import { OUTCOME_STYLE, Partieabschluss } from './Partieabschluss'
import { formatNumber, type Translate } from '@dos/shared/i18n'
import { matchOutcome } from '@dos/shared/game'
import {
  combatTimeline,
  nextPendingUnit,
  nextTapSelection,
  ownUnitsAt,
  productionOverview,
} from './selection'
import { UnitPanel } from './UnitPanel'
import { CityPanel } from './CityPanel'
import { EventLog } from './EventLog'
import { Rundenbericht, type ReportFooter } from './Rundenbericht'
import { buildTurnReport, type ReportEntry, type TurnReport } from './report'
import { MiniMap } from './MiniMap'
import { TutorialPanel } from './TutorialPanel'
import { useLocale, useT } from '../../../i18n'

// Typography: Big Shoulders Display (headings), Barlow (UI), IBM Plex Mono (numbers)

type Mode = 'normal' | 'patrol' | 'unload'

/** Arrow keys pan by this many screen pixels (Shift: four times) */
const KEY_PAN_PX = 80
const KEY_ZOOM_FACTOR = 1.25
/** Drag preview: node budget of the path search and the farthest target that still previews */
const DRAG_PREVIEW_MAX_NODES = 2500
const DRAG_PREVIEW_MAX_DISTANCE = 25

function noReturnText(t: Translate, m: { pathLength: number; fuelAfter: number; returnDist: number }) {
  if (m.fuelAfter < 0) return t('board.fuel.short', { path: m.pathLength, fuel: m.pathLength + m.fuelAfter })
  if (!Number.isFinite(m.returnDist)) return t('board.fuel.noBase', { fuel: m.fuelAfter })
  return t('board.fuel.far', { fuel: m.fuelAfter, count: m.returnDist })
}

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
  combatAnimationMs = 0,
  showTurnReport = false,
  canWatchReplay = true,
  controls,
  onSelectUnit,
  onMoveUnit,
  onSetGoto,
  onSetSentry,
  onSetPatrol,
  onSetExplore,
  onCancelOrder,
  onSkipUnit,
  onAttack,
  onUnloadUnit,
  onSelectCity,
  onSetProduction,
  onSelectEvent,
  onSkipReplay,
  onEndTurn,
  onCue,
  result = null,
  dominance = null,
  onLeave,
  tutorial = null,
  onTutorialNext,
  onTutorialSkip,
  onNewMatch,
  onOpenPlayer,
}: SpielfeldUndZuegeProps) {
  const t = useT()
  const { locale } = useLocale()
  const youId = match.youId
  const focusUi = tutorial?.current?.focus?.ui ?? null
  const you = participants.find((p) => p.id === youId)
  // Sound cues go to the page (audio brief: the board itself plays nothing)
  const cueRef = useRef(onCue)
  cueRef.current = onCue
  const cue = useCallback((c: BoardCue) => cueRef.current?.(c), [])
  // Combat sequence in progress: ghost of the attacker, muzzle flash, fading loser
  const [combatPlay, setCombatPlay] = useState<{
    id: number
    ghost: Ghost | null
    hidden: Set<string>
    fading: Set<string>
    muzzle: HexCoord | null
  } | null>(null)
  const canAct = match.phase === 'yourTurn' && !combatPlay

  const idx = useMemo(() => buildIndex(map, cities, units, unitTypes, youId), [map, cities, units, unitTypes, youId])
  const typeById = useMemo(() => new Map(unitTypes.map((t) => [t.id, t])), [unitTypes])
  const participantById = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------
  // The camera lives in a store outside React (see cameraStore.ts); only the viewport is state
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [cameraStore] = useState(() => createCameraStore({ x: 0, y: 0, scale: 1 }))
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

  // A resized window or another map may leave the camera off the map
  useEffect(() => {
    cameraStore.set(clampCamera(cameraStore.get(), viewport, map))
  }, [cameraStore, viewport, map])

  const centerOnPixel = useCallback(
    (px: number, py: number, animate = true) => {
      const target = centerCamera(cameraStore.get(), px, py, viewport, map)
      if (animate) cameraStore.animateTo(target)
      else cameraStore.set(target)
    },
    [cameraStore, viewport, map],
  )
  const centerOn = useCallback(
    (c: HexCoord, animate = true) => {
      const { x, y } = hexToPixel(c)
      centerOnPixel(x, y, animate)
    },
    [centerOnPixel],
  )
  const fitMap = useCallback(() => {
    cameraStore.animateTo(fitCamera(cameraStore.get(), viewport, map))
  }, [cameraStore, viewport, map])
  const zoomBy = useCallback(
    (factor: number) => {
      const cam = cameraStore.get()
      cameraStore.set(zoomAt(cam, viewport.width / 2, viewport.height / 2, cam.scale * factor, viewport, map))
    },
    [cameraStore, viewport, map],
  )
  const panBy = useCallback(
    (dx: number, dy: number) => {
      const cam = cameraStore.get()
      cameraStore.set(clampCamera({ ...cam, x: cam.x - dx, y: cam.y - dy }, viewport, map))
    },
    [cameraStore, viewport, map],
  )

  // ---------------------------------------------------------------------------
  // Selection & interaction state
  // ---------------------------------------------------------------------------
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ target: HexCoord; path: HexCoord[] } | null>(null)
  const [pendingAttack, setPendingAttack] = useState<{ unitId: string; target: AttackTarget } | null>(null)
  // Aircraft move that leaves no fuel for the way back: needs „Trotzdem fliegen“
  const [pendingMove, setPendingMove] = useState<{
    unitId: string
    target: HexCoord
    inReach: boolean
    pathLength: number
    fuelAfter: number
    returnDist: number
  } | null>(null)
  const [mode, setMode] = useState<Mode>('normal')
  const [patrolPoints, setPatrolPoints] = useState<HexCoord[]>([])
  const [unloadCargoId, setUnloadCargoId] = useState<string | null>(null)
  const [combatFx, setCombatFx] = useState<{ coord: HexCoord; id: number } | null>(null)
  const [toast, setToast] = useState<typeof lastCombat>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [minimapOpen, setMinimapOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  // Turn report card; `reopened` from the event log only offers „Schließen“
  const [report, setReport] = useState<{ data: TurnReport; reopened: boolean } | null>(null)
  // Result card of a finished match; „Karte ansehen“ closes it, the pill reopens it
  const [resultOpen, setResultOpen] = useState(true)
  const resultKey = result ? `${match.id}:${result.endedAt}` : null
  useEffect(() => setResultOpen(true), [resultKey])
  const outcome = result ? (matchOutcome({ match, participants, result }) ?? 'defeat') : null

  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? null
  const selectedType = selectedUnit ? typeById.get(selectedUnit.unitTypeId) : undefined
  const selectedIsYours = selectedUnit?.ownerId === youId
  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null

  const reach = useMemo(
    () => (selectedUnit && selectedIsYours && canAct && mode === 'normal' ? reachableTiles(selectedUnit, idx) : new Map()),
    [selectedUnit, selectedIsYours, canAct, mode, idx],
  )
  const bases = useMemo(() => airBases(cities, units, unitTypes, youId), [cities, units, unitTypes, youId])
  const unsafe = useMemo(
    () => (selectedUnit ? unsafeTiles(selectedUnit, selectedType, reach, bases) : new Set<string>()),
    [selectedUnit, selectedType, reach, bases],
  )
  // Stable arrays for the memoised map layers
  const reachableCoords = useMemo(() => [...reach.values()].map((r) => r.coord), [reach])
  const unsafeCoords = useMemo(
    () => [...reach.values()].filter((r) => unsafe.has(hexKey(r.coord))).map((r) => r.coord),
    [reach, unsafe],
  )
  const stranded = useMemo(() => strandedAircraft(units, unitTypes, bases, youId), [units, unitTypes, bases, youId])
  const targets = useMemo(
    () =>
      selectedUnit && selectedIsYours && canAct && mode === 'normal'
        ? attackTargets(selectedUnit, idx, units, cities, combatPreviews)
        : [],
    [selectedUnit, selectedIsYours, canAct, mode, idx, units, cities, combatPreviews],
  )

  const pathMarkers: PathMarker[] = useMemo(() => {
    if (!preview || !selectedUnit || !selectedType) return []
    const turns = pathTurns(selectedUnit, selectedType, preview.path, idx)
    return preview.path
      .map((coord, i) => ({ coord, turn: turns[i] }))
      .filter((m, i, all) => i === all.length - 1 || all[i + 1].turn !== m.turn)
  }, [preview, selectedUnit, selectedType, idx])
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
    setPendingMove(null)
    setMode('normal')
    setPatrolPoints([])
    setUnloadCargoId(null)
  }

  // Position of the last selected own unit in `units`: „Nächste Einheit“ continues behind it
  const cursorRef = useRef(-1)

  const selectUnit = (id: string | null) => {
    resetTransient()
    setSelectedUnitId(id)
    if (id) {
      setSelectedCityId(null)
      const i = units.findIndex((x) => x.id === id)
      if (units[i]?.ownerId === youId) {
        cursorRef.current = i
        onSelectUnit?.(id)
        if (id !== selectedUnitId) cue({ type: 'unitSelected', unitTypeId: units[i]!.unitTypeId })
      }
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
    cameraStore.set(centerCamera({ x: 0, y: 0, scale }, x, y, viewport, map))
  }, [viewport, pendingOrders, cities, youId, map, cameraStore])

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
  // Plays the sequence on the state *before* the result (the new view is held back meanwhile),
  // then shows the toast
  useEffect(() => {
    if (!lastCombat) return
    const finish = () => {
      setCombatPlay(null)
      setToast(lastCombat)
      if (lastCombat.captured && lastCombat.targetCityId) {
        openCity(lastCombat.targetCityId)
        cue({ type: 'cityCaptured' })
      }
    }
    const timeline = combatTimeline(combatAnimationMs)
    const attacker = units.find((u) => u.id === lastCombat.attackerUnitId)
    const target: HexCoord | undefined = lastCombat.defenderUnitId
      ? units.find((u) => u.id === lastCombat.defenderUnitId)
      : cities.find((c) => c.id === lastCombat.targetCityId)
    // A fight runs until one side is destroyed; a city attack always spends the attacker
    const loserGone = lastCombat.attackerDestroyed || lastCombat.defenderDestroyed
    // Long fights are not animated longer: at most four flashes within the blast window
    const flashes = Math.max(1, Math.min(4, lastCombat.hits.length))
    if (!timeline || !attacker || !target) {
      cue({ type: 'hit' })
      if (loserGone) cue({ type: 'unitDestroyed' })
      finish()
      return
    }
    // Same tile the server picks when the attacker has to approach first
    let origin: HexCoord = attacker
    if (hexDistance(attacker, target) > 1) {
      const o = [...reachableTiles(attacker, idx).values()]
        .filter((r) => r.cost < attacker.movesLeft && hexDistance(r.coord, target) === 1)
        .sort((a, b) => a.dist - b.dist)[0]
      if (o) origin = o.coord
    }
    const id = Date.now()
    const color = participantById.get(attacker.ownerId)?.color ?? 'amber'
    const ghostAt = (c: HexCoord): Ghost => ({ coord: c, trail: [], unitTypeId: attacker.unitTypeId, color })
    const loser = lastCombat.defenderDestroyed ? lastCombat.defenderUnitId : attacker.id
    const approaching = !sameHex(origin, attacker)
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    setCombatPlay({
      id,
      ghost: approaching ? ghostAt(attacker) : null,
      hidden: new Set(approaching ? [attacker.id] : []),
      fading: new Set(),
      muzzle: null,
    })
    if (approaching) at(30, () => setCombatPlay((p) => p && { ...p, ghost: ghostAt(origin) }))
    at(timeline.muzzle, () => setCombatPlay((p) => p && { ...p, muzzle: origin }))
    const blastWindow = timeline.resolve - timeline.blast
    for (let i = 0; i < flashes; i++) {
      at(timeline.blast + (blastWindow * i) / flashes, () => {
        setCombatFx({ coord: { col: target.col, row: target.row }, id: id + i })
        cue({ type: 'hit' })
      })
    }
    at(timeline.resolve, () => {
      if (loserGone) cue({ type: 'unitDestroyed' })
    })
    at(timeline.resolve, () =>
      setCombatPlay((p) => {
        if (!p) return p
        const fading = new Set(loser ? [loser] : [])
        if (!lastCombat.advanced) return { ...p, fading, muzzle: null }
        // The winner slides onto the target tile as a ghost
        const hidden = new Set(p.hidden)
        hidden.add(attacker.id)
        return { ...p, fading, muzzle: null, hidden, ghost: ghostAt(origin) }
      }),
    )
    if (lastCombat.advanced)
      at(timeline.resolve + 40, () => setCombatPlay((p) => p && { ...p, ghost: ghostAt(target) }))
    at(timeline.end, finish)
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCombat])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const confirmAttack = () => {
    if (!pendingAttack) return
    const { unitId, target } = pendingAttack
    setPendingAttack(null)
    setPreview(null)
    const attacker = units.find((u) => u.id === unitId)
    const attackerType = attacker && typeById.get(attacker.unitTypeId)
    if (attacker && attackerType)
      cue({ type: 'attackStarted', attackerTypeId: attacker.unitTypeId, domain: attackerType.domain })
    onAttack?.(unitId, { unitId: target.unitId, cityId: target.cityId })
  }

  // ---------------------------------------------------------------------------
  // Opponent replay
  // ---------------------------------------------------------------------------
  const [replayPos, setReplayPos] = useState({ action: 0, step: 0 })
  // The report card holds the replay until „Gegnerzüge ansehen“
  const replayAction = match.phase === 'replay' && !report ? replay[replayPos.action] : undefined

  // Callbacks change identity on every render; keep them out of the timer effect's deps
  const replayCallbacks = useRef({ onSkipReplay, centerOn })
  const replayStepRef = useRef<string | null>(null)
  useEffect(() => {
    replayCallbacks.current = { onSkipReplay, centerOn }
  })

  useEffect(() => {
    if (match.phase !== 'replay' || report) return
    if (!replayAction) {
      replayCallbacks.current.onSkipReplay?.()
      return
    }
    const last = replayAction.path.length - 1
    const current = replayAction.path[replayPos.step]
    if (viewport.width > 0) replayCallbacks.current.centerOn(current)
    const stepKey = `${replayAction.id}:${replayPos.step}`
    if (replayStepRef.current !== stepKey) {
      replayStepRef.current = stepKey
      cue({ type: 'replayStep', action: replayAction.action, last: replayPos.step === last })
      if (replayPos.step === last && replayAction.action !== 'move') cue({ type: 'hit' })
    }
    if (replayPos.step === last && replayAction.action !== 'move') setCombatFx({ coord: current, id: Date.now() })
    const t = setTimeout(
      () =>
        setReplayPos((p) => (p.step < last ? { ...p, step: p.step + 1 } : { action: p.action + 1, step: 0 })),
      replayPos.step === last ? 1100 : 500,
    )
    return () => clearTimeout(t)
  }, [match.phase, report, replayAction, replayPos, viewport.width])

  // ---------------------------------------------------------------------------
  // Turn report: once per turn, when the own turn starts (also on a fresh page load)
  // ---------------------------------------------------------------------------
  const reportStorageKey = `dos-turn-report:${match.id}`
  const reportTurnKey = `${match.round}:${youId}`
  const reportSeen = () => {
    try {
      return localStorage.getItem(reportStorageKey) === reportTurnKey
    } catch {
      return false
    }
  }
  const markReportSeen = () => {
    try {
      localStorage.setItem(reportStorageKey, reportTurnKey)
    } catch {
      // storage unavailable: the report may show again after a reload
    }
  }
  const reportInput = { events, replay, participants, unitTypes, round: match.round, t }
  const reportInputRef = useRef(reportInput)
  reportInputRef.current = reportInput
  const prevPhaseRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = match.phase
    if (!showTurnReport || match.phase === 'waiting') return
    if (prev !== null && prev !== 'waiting') return
    if (reportSeen()) return
    const data = buildTurnReport(reportInputRef.current)
    if (!data.isEmpty) setReport({ data, reopened: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- events and replay are read from the ref
  }, [match.phase, showTurnReport, reportStorageKey, reportTurnKey])

  // Sound at the start of the own turn, once per round (not again after a reload)
  const turnSoundKey = `dos-turn-sound:${match.id}`
  const prevPhaseSound = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevPhaseSound.current
    prevPhaseSound.current = match.phase
    if (match.phase === 'waiting') return
    if (prev !== null && prev !== 'waiting') return
    try {
      if (localStorage.getItem(turnSoundKey) === reportTurnKey) return
      localStorage.setItem(turnSoundKey, reportTurnKey)
    } catch {
      if (prev === null) return
    }
    cue({ type: 'turnStarted' })
  }, [match.phase, turnSoundKey, reportTurnKey, cue])

  // New events worth a sound (one per type and view); events present at mount stay silent
  const soundedEvents = useRef<Set<string> | null>(null)
  useEffect(() => {
    const first = soundedEvents.current === null
    const sounded = (soundedEvents.current ??= new Set())
    const done = new Set<string>()
    for (const e of events) {
      if (!e.isNew || sounded.has(e.id)) continue
      sounded.add(e.id)
      if (first) continue
      if ((e.type === 'cityLost' || e.type === 'unitBuilt' || e.type === 'fuelLow') && !done.has(e.type)) {
        done.add(e.type)
        cue({ type: 'event', eventType: e.type })
      }
    }
  }, [events, cue])

  // Ambience from the visible part of the map, throttled while panning and zooming; the camera
  // is read from the store once the debounce fires
  const lastAmbience = useRef<{ mix: Record<string, number>; zoom: number } | null>(null)
  useEffect(() => {
    if (!onCue) return
    // Before the first measurement the window size stands in for the viewport
    const vp = viewport.width > 0 ? viewport : { width: window.innerWidth || 1280, height: window.innerHeight || 720 }
    let t: ReturnType<typeof setTimeout> | null = null
    const arm = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => {
        t = null
        const { mix, zoom } = ambienceMix({
          map,
          cities,
          camera: cameraStore.get(),
          viewport: vp,
          bounds: scaleBounds(vp, map),
        })
        const prev = lastAmbience.current
        if (prev && !mixChanged(prev.mix as typeof mix, mix) && Math.abs(prev.zoom - zoom) < 0.05) return
        lastAmbience.current = { mix, zoom }
        cue({ type: 'ambience', mix, zoom })
      }, 250)
    }
    arm()
    const unsubscribe = cameraStore.subscribe(arm)
    return () => {
      unsubscribe()
      if (t) clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCue is read through cueRef
  }, [cameraStore, viewport, map, cities, cue])

  const pendingReplay = match.phase === 'replay' && replay.length > 0 && canWatchReplay
  const reportFooter: ReportFooter = report?.reopened ? 'close' : pendingReplay ? 'watch' : 'continue'
  const closeReport = () => {
    setReport(null)
    markReportSeen()
  }
  const continueFromReport = () => {
    closeReport()
    // Replay pending but not watchable (autoplay off): skip it like MatchPage would
    if (match.phase === 'replay' && !report?.reopened) onSkipReplay?.()
  }
  const skipFromReport = () => {
    closeReport()
    onSkipReplay?.()
  }
  const openReport = () => {
    setReport({ data: buildTurnReport(reportInputRef.current), reopened: true })
    if (viewport.width < 768) setLogOpen(false)
  }
  const jumpFromReport = (entry: ReportEntry) => {
    centerOn(entry.coord)
    if (entry.eventId) onSelectEvent?.(entry.eventId)
  }

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
  const sendMove = (unitId: string, target: HexCoord, inReach: boolean) => {
    const moving = units.find((u) => u.id === unitId)
    if (moving) cue({ type: 'unitMoved', unitTypeId: moving.unitTypeId })
    if (inReach) onMoveUnit?.(unitId, target)
    else onSetGoto?.(unitId, target)
    setPreview(null)
    setPendingMove(null)
  }

  // Aircraft resist being flown beyond their fuel: no way back asks for confirmation
  const commitMove = (unitId: string, target: HexCoord, inReach: boolean) => {
    const unit = units.find((u) => u.id === unitId)
    const path = unit && findPath(unit, target, idx)
    if (unit && path) {
      const safety = moveSafety(unit, typeById.get(unit.unitTypeId), target, path.length, bases)
      if (!safety.safe) {
        setPreview(null)
        setPendingMove({ unitId, target, inReach, pathLength: path.length, ...safety })
        return
      }
    }
    sendMove(unitId, target, inReach)
  }

  const returnToBase = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return
    const home = [...bases]
      .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
      .find((b) => findPath(unit, b, idx))
    if (home) commitMove(unitId, home, reachableTiles(unit, idx).has(hexKey(home)))
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
      const stackHere = ownUnitsAt(idx, c, youId)
      if (stackHere.length === 0 || stackHere.some((u) => u.id === selectedUnit.id) || reach.has(hexKey(c))) {
        const path = findPath(selectedUnit, c, idx)
        if (path) {
          setPendingAttack(null)
          setPreview({ target: c, path })
          cue({ type: 'pathPreview' })
          return
        }
        // Nowhere to go: an empty tile the unit cannot reach
        if (stackHere.length === 0 && !idx.cityAt(c) && selectedUnit.movesLeft > 0) cue({ type: 'moveInvalid' })
      }
    }

    const own = ownUnitsAt(idx, c, youId)
    const city = idx.cityAt(c)
    // Repeated taps on a tile cycle: unit 1 → unit 2 → … → city → nothing
    const next = nextTapSelection({ ownUnits: own, city, selectedUnitId, selectedCityId })
    if (next && 'unitId' in next) {
      selectUnit(next.unitId)
      return
    }
    if (next && 'cityId' in next) {
      openCity(next.cityId)
      return
    }
    if (own.length === 0 && !city) {
      const other = idx.unitsAt(c).find((u) => u.ownerId !== youId)
      if (other && idx.tileAt(c)?.visibility === 'visible') {
        selectUnit(other.id)
        return
      }
    }
    selectUnit(null)
    setSelectedCityId(null)
  }

  // Path preview while dragging: one search per frame, with a node budget and a distance limit
  // so a large map never stalls the pointer; tap and drop targets search without a budget
  const dragFrame = useRef<number | null>(null)
  const dragPreview = useCallback(
    (unit: Unit, c: HexCoord) => {
      if (hexDistance(unit, c) > DRAG_PREVIEW_MAX_DISTANCE) {
        setPreview(null)
        return
      }
      const path = findPath(unit, c, idx, { maxNodes: DRAG_PREVIEW_MAX_NODES, used: 0 })
      setPreview((prev) => {
        if (path && !(prev && sameHex(prev.target, c))) cue({ type: 'pathPreview' })
        return path ? { target: c, path } : null
      })
    },
    [idx, cue],
  )
  const cancelDragFrame = () => {
    if (dragFrame.current !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(dragFrame.current)
    dragFrame.current = null
  }

  const handleDrag = (unitId: string, c: HexCoord) => {
    if (!canAct) return
    const unit = units.find((u) => u.id === unitId)
    if (selectedUnitId !== unitId) {
      setSelectedUnitId(unitId)
      setSelectedCityId(null)
      setMode('normal')
      onSelectUnit?.(unitId)
      if (unit) cue({ type: 'unitSelected', unitTypeId: unit.unitTypeId })
    }
    if (!unit) return
    if (typeof requestAnimationFrame !== 'function') {
      dragPreview(unit, c)
      return
    }
    cancelDragFrame()
    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null
      dragPreview(unit, c)
    })
  }

  const handleDragEnd = (unitId: string, c: HexCoord) => {
    cancelDragFrame()
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
    if (!canAct || mode !== 'normal' || controls?.dragUnits === false) return null
    const own = ownUnitsAt(idx, c, youId)
    return (own.find((u) => u.id === selectedUnitId) ?? own.find((u) => u.needsOrders) ?? own[0])?.id ?? null
  }

  // Right click / Esc: undo the innermost step first
  const cancelStep = () => {
    if (confirmEnd) setConfirmEnd(false)
    else if (report && reportFooter === 'close') closeReport()
    else if (report && reportFooter === 'continue') continueFromReport()
    else if (report) return // pending replay: watch or skip explicitly
    else if (pendingAttack) setPendingAttack(null)
    else if (pendingMove) setPendingMove(null)
    else if (mode !== 'normal') resetTransient()
    else if (preview) setPreview(null)
    else if (selectedUnitId) selectUnit(null)
    else if (selectedCityId) setSelectedCityId(null)
    else if (logOpen) setLogOpen(false)
  }
  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const nextUnit = () => {
    const next = nextPendingUnit(units, youId, cursorRef.current)
    if (!next) return
    selectUnit(next.id)
    centerOn(next)
  }

  // Keyboard: Esc steps back, N or Space jumps to the next unit, +/- zoom, arrows pan (Shift
  // four times as far), F fits the map (outside dialogs and inputs)
  const keyRef = useRef({ cancel: cancelStep, next: nextUnit, nextAllowed: false, zoomBy, panBy, fitMap })
  useEffect(() => {
    keyRef.current = {
      cancel: cancelStep,
      next: nextUnit,
      nextAllowed: canAct && !pendingAttack && !pendingMove && !confirmEnd && mode === 'normal',
      zoomBy,
      panBy,
      fitMap,
    }
  })
  useEffect(() => {
    const inControl = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(t.tagName))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        keyRef.current.cancel()
        return
      }
      if (inControl(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      const k = keyRef.current
      const step = e.shiftKey ? KEY_PAN_PX * 4 : KEY_PAN_PX
      switch (e.key) {
        case 'n':
        case 'N':
        case ' ':
          if (e.key === ' ') e.preventDefault()
          if (k.nextAllowed) k.next()
          return
        case '+':
        case '=':
          k.zoomBy(KEY_ZOOM_FACTOR)
          return
        case '-':
          k.zoomBy(1 / KEY_ZOOM_FACTOR)
          return
        case 'f':
        case 'F':
          k.fitMap()
          return
        case 'ArrowLeft':
          e.preventDefault()
          k.panBy(-step, 0)
          return
        case 'ArrowRight':
          e.preventDefault()
          k.panBy(step, 0)
          return
        case 'ArrowUp':
          e.preventDefault()
          k.panBy(0, -step)
          return
        case 'ArrowDown':
          e.preventDefault()
          k.panBy(0, step)
          return
        default:
          return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // „Nachfrage beim Zugende“ off: units without orders do not ask; stranded aircraft always do
  const askPending = controls?.confirmEndTurn !== false && pendingOrders.length > 0
  const handleEndTurn = () => {
    if ((askPending || stranded.length > 0) && !confirmEnd) {
      setConfirmEnd(true)
      return
    }
    setConfirmEnd(false)
    selectUnit(null)
    setSelectedCityId(null)
    cue({ type: 'turnEnded' })
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

  const overview = useMemo(
    () => (selectedCity ? productionOverview(units, cities, youId, selectedCity.id) : undefined),
    [selectedCity, units, cities, youId],
  )
  const withType = (u: (typeof units)[number]) => ({ unit: u, type: typeById.get(u.unitTypeId) })
  const stack = selectedUnit && selectedIsYours ? ownUnitsAt(idx, selectedUnit, youId).map(withType) : []
  const cityHere = selectedUnit && selectedIsYours ? idx.cityAt(selectedUnit) : undefined
  const garrison = selectedCity ? idx.unitsAt(selectedCity).filter((u) => !u.carriedBy).map(withType) : []

  const sheetOpen = !!selectedUnit || !!selectedCity
  const mapSize = mapPixelSize(map)
  const attacker = pendingAttack ? units.find((u) => u.id === pendingAttack.unitId) : undefined
  const defenderName = pendingAttack
    ? pendingAttack.target.unitId
      ? typeById.get(units.find((u) => u.id === pendingAttack.target.unitId)?.unitTypeId ?? '')?.name
      : cities.find((c) => c.id === pendingAttack.target.cityId)?.name
    : undefined
  // Defense modifiers of the target and the approach the attacker has to make first
  const attackDetails = (() => {
    if (!pendingAttack || !attacker) return { modifiers: [], approach: 0 }
    const { target } = pendingAttack
    const defender = target.unitId ? units.find((u) => u.id === target.unitId) : undefined
    const defenderType = defender ? typeById.get(defender.unitTypeId) : undefined
    const tile = idx.tileAt(target.coord)
    const modifiers =
      defenderType && tile ? defenseModifiers(defenderType, tile.terrain, !!idx.cityAt(target.coord)) : []
    let approach = 0
    if (hexDistance(attacker, target.coord) > 1) {
      const steps = [...reachableTiles(attacker, idx).values()]
        .filter((r) => r.cost < attacker.movesLeft && hexDistance(r.coord, target.coord) === 1)
        .map((r) => r.dist)
      approach = steps.length ? Math.min(...steps) : 0
    }
    return { modifiers, approach }
  })()
  const replayActor = replayAction ? participantById.get(replayAction.participantId) : undefined
  const waitingFor = participants.filter((p) => !p.isYou && p.status === 'active').map((p) => p.name)

  return (
    <div
      ref={containerRef}
      className="relative size-full overflow-hidden bg-[#5f8f8b] font-['Barlow'] text-stone-900 dark:bg-[#0b2226] dark:text-stone-100"
    >
      <HexMap
        pinchExponent={controls ? zoomSpeed(controls.zoomSensitivity) : 1}
        map={map}
        cities={cities}
        units={units}
        unitTypes={unitTypes}
        participants={participants}
        youId={youId}
        store={cameraStore}
        viewport={viewport}
        selectedUnitId={selectedUnitId}
        selectedCityId={selectedCityId}
        reachable={reachableCoords}
        unsafeTiles={unsafeCoords}
        targets={targets}
        path={preview?.path ?? null}
        pathMarkers={pathMarkers}
        pathBeyondReach={previewBeyondReach}
        patrolPoints={selectedUnit ? (mode === 'patrol' ? [selectedUnit, ...patrolPoints] : []) : []}
        unloadTargets={unloadTargets}
        ghost={ghost ?? combatPlay?.ghost ?? null}
        combatFx={combatFx}
        muzzleFx={combatPlay?.muzzle ? { coord: combatPlay.muzzle, id: combatPlay.id } : null}
        hiddenUnitIds={combatPlay?.hidden}
        fadingUnitIds={combatPlay?.fading}
        draggableUnitAt={draggableUnitAt}
        highlight={tutorial?.current?.focus?.hex ?? null}
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
        <EventLog
          events={events}
          open={logOpen}
          onToggle={() => setLogOpen((o) => !o)}
          onSelect={handleEvent}
          onOpenReport={events.length || replay.length ? openReport : undefined}
        />
      </div>

      {/* Top-right: fit the whole map, minimap toggle on mobile */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
        <button
          type="button"
          onClick={fitMap}
          aria-label={t('board.fit')}
          title={t('board.fitKey')}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-lg border border-stone-300 bg-white/90 shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/90"
        >
          <Maximize2 className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setMinimapOpen((o) => !o)}
          aria-label={t('board.minimap')}
          aria-pressed={minimapOpen}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-lg border border-stone-300 bg-white/90 shadow-lg backdrop-blur md:hidden dark:border-stone-700 dark:bg-stone-900/90"
        >
          <MapIcon className="size-5" />
        </button>
      </div>

      {/* Minimap */}
      <div
        data-tutorial-focus={focusUi === 'minimap' ? '' : undefined}
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
          store={cameraStore}
          viewport={viewport}
          onJump={(x, y) => centerOnPixel(Math.min(Math.max(x, 0), mapSize.width), Math.min(Math.max(y, 0), mapSize.height))}
        />
      </div>

      {/* Result of a finished match: same place as the turn report */}
      {result && resultOpen && (
        <div className="absolute inset-x-0 bottom-0 z-30 md:inset-x-auto md:bottom-auto md:left-4 md:top-20 md:w-[30rem]">
          <Partieabschluss
            match={match}
            participants={participants}
            result={result}
            onViewMap={() => setResultOpen(false)}
            onLeave={() => onLeave?.()}
            tutorial={!!tutorial}
            onNewMatch={onNewMatch}
            onOpenPlayer={onOpenPlayer}
          />
        </div>
      )}

      {/* Tutorial: below the event log; hidden while the turn report or the result card is open */}
      {tutorial?.current && !report && !result && (
        <div
          className={`pointer-events-none absolute inset-x-3 top-16 z-20 sm:inset-x-auto sm:left-4 sm:w-[24rem] md:top-20 ${
            selectedUnit || selectedCity ? 'max-md:hidden' : ''
          }`}
        >
          <TutorialPanel
            tutorial={tutorial}
            onNext={() => onTutorialNext?.()}
            onSkip={() => onTutorialSkip?.()}
            onLeave={() => onLeave?.()}
          />
        </div>
      )}

      {/* Turn report: bottom sheet on mobile, card below the event log on desktop */}
      {report && !result && (
        <div className="absolute inset-x-0 bottom-0 z-30 md:inset-x-auto md:bottom-auto md:left-4 md:top-20 md:w-[26rem]">
          <Rundenbericht
            report={report.data}
            footer={reportFooter}
            onJump={jumpFromReport}
            onWatchReplay={closeReport}
            onSkipReplay={skipFromReport}
            onClose={reportFooter === 'continue' ? continueFromReport : closeReport}
          />
        </div>
      )}

      {/* Replay overlay */}
      {replayAction && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-3 sm:top-4">
          <div className="flex items-center gap-3 rounded-full border border-stone-700 bg-stone-950/90 py-1.5 pl-4 pr-1.5 text-stone-100 shadow-2xl backdrop-blur">
            <Play className="size-4 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <p className="font-['Big_Shoulders_Display'] text-sm font-bold uppercase leading-tight tracking-widest">
                {t('board.replay.title')} ·{' '}
                <span style={{ color: replayActor ? PARTICIPANT_HEX[replayActor.color].base : undefined }}>{replayActor?.name}</span>
              </p>
              <p className="truncate text-xs text-stone-400">
                {typeById.get(replayAction.unitTypeId)?.name}{' '}
                {t(`board.replay.${replayAction.action}`)}
                {replayAction.result &&
                  ` · ${gameText(t, { message: replayAction.result, text: replayAction.resultText })}`}
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
              <SkipForward className="size-4" /> {t('board.replay.skip')}
            </button>
          </div>
        </div>
      )}

      {/* Combat toast */}
      {toast && (
        <div className="absolute inset-x-0 top-16 z-30 flex justify-center px-3 sm:top-4" role="status">
          <div
            className={`flex max-w-md items-center gap-3 rounded-lg border-l-4 bg-stone-950/95 px-4 py-3 text-stone-100 shadow-2xl animate-in fade-in slide-in-from-top-2 ${
              toast.defenderDestroyed || toast.captured ? 'border-teal-400' : 'border-rose-500'
            }`}
          >
            {toast.defenderDestroyed || toast.captured ? (
              <Trophy className="size-6 shrink-0 text-teal-300" />
            ) : (
              <Swords className="size-6 shrink-0 text-rose-400" />
            )}
            <div className="min-w-0">
              <p className="font-['Big_Shoulders_Display'] text-lg font-black uppercase leading-tight tracking-widest">
                {toast.defenderDestroyed || toast.captured ? t('board.toast.win') : t('board.toast.loss')}
              </p>
              <p className="text-sm text-stone-300">{gameText(t, toast)}</p>
              <p className="mt-0.5 font-['IBM_Plex_Mono'] text-[11px] text-stone-400">
                {t('board.toast.damage', { own: toast.attackerDamage, enemy: toast.defenderDamage, count: toast.hits.length })}
              </p>
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label={t('board.close')} className="flex size-9 items-center justify-center rounded text-stone-400 hover:text-stone-100">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Finished: pill with the outcome, reopens the result card */}
      {result && outcome && !resultOpen && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-3 sm:top-4">
          <div className="flex items-center gap-2 rounded-full bg-stone-950/90 py-1 pl-4 pr-1 text-sm text-stone-200 shadow-xl">
            <Trophy className={`size-4 ${outcome === 'victory' ? 'text-teal-400' : outcome === 'defeat' ? 'text-rose-400' : 'text-stone-400'}`} />
            {t('board.endedPill', { outcome: { key: OUTCOME_STYLE[outcome].label } })}
            <button
              type="button"
              onClick={() => setResultOpen(true)}
              className="ml-1 rounded-full bg-stone-800 px-3 py-1.5 font-['Big_Shoulders_Display'] text-xs font-bold uppercase tracking-widest text-amber-300 hover:bg-stone-700"
            >
              {t('board.result')}
            </button>
          </div>
        </div>
      )}

      {/* Waiting banner and the dominance countdown */}
      {!result && (match.phase === 'waiting' || dominance) && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-2 px-3 sm:top-4">
          {match.phase === 'waiting' && (
            <div className="flex items-center gap-2 rounded-full bg-stone-950/90 px-4 py-2 text-sm text-stone-200 shadow-xl">
              <Hourglass className="size-4 animate-pulse text-amber-400" />
              {t('board.waitingFor', { names: waitingFor.join(' & ') })}
            </div>
          )}
          {dominance && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm shadow-xl ${
                dominance.participantId === youId
                  ? 'border-teal-500/60 bg-teal-950/90 text-teal-100'
                  : 'border-amber-500/60 bg-stone-950/90 text-amber-100'
              }`}
            >
              <Crown className="size-4 text-amber-400" />
              {t('board.dominance')}{' '}
              {dominance.participantId === youId
                ? t('board.you')
                : (participantById.get(dominance.participantId)?.name ?? t('board.unknown'))}{' '}
              · {t('board.dominanceShare', { share: Math.floor(dominance.share * 100), count: dominance.turnsLeft })}
            </div>
          )}
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
            stack={stack}
            cityHere={cityHere}
            onSelectStackUnit={(id) => selectUnit(id)}
            onOpenCity={(id) => openCity(id)}
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
            onExplore={() => {
              resetTransient()
              onSetExplore?.(selectedUnit.id)
            }}
            onReturnToBase={() => returnToBase(selectedUnit.id)}
            atBase={returnDistance(selectedUnit, bases) === 0}
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
            garrison={garrison}
            overview={overview}
            onSelectUnit={(id) => selectUnit(id)}
            onSetProduction={(typeId) => onSetProduction?.(selectedCity.id, typeId)}
            onClose={() => setSelectedCityId(null)}
          />
        </div>
      )}

      {/* No way back: aircraft move beyond the fuel to return */}
      {pendingMove && (
        <div className="absolute inset-x-0 bottom-24 z-30 flex justify-center px-3 md:bottom-28">
          <div role="alertdialog" aria-labelledby="dos-fuel-title" className="w-full max-w-sm rounded-xl border border-rose-500/60 bg-stone-950/95 p-4 text-stone-100 shadow-2xl">
            <p id="dos-fuel-title" className="font-['Big_Shoulders_Display'] text-xs font-bold uppercase tracking-[0.25em] text-rose-400">{t('board.noReturn')}</p>
            <p className="mt-1 text-sm">{noReturnText(t, pendingMove)}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingMove(null)}
                className="min-h-11 flex-1 rounded-md border border-stone-600 text-sm font-semibold hover:bg-stone-800"
              >
                {t('board.cancel')}
              </button>
              <button
                type="button"
                onClick={() => sendMove(pendingMove.unitId, pendingMove.target, pendingMove.inReach)}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 text-sm font-bold uppercase tracking-wider text-white hover:bg-rose-500"
              >
                <Fuel className="size-4" /> {t('board.flyAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attack confirmation */}
      {pendingAttack && attacker && (
        <div className="absolute inset-x-0 bottom-24 z-30 flex justify-center px-3 md:bottom-28">
          <div className="w-full max-w-sm rounded-xl border border-rose-500/60 bg-stone-950/95 p-4 text-stone-100 shadow-2xl">
            <p className="font-['Big_Shoulders_Display'] text-xs font-bold uppercase tracking-[0.25em] text-rose-400">{t('board.attack.title')}</p>
            <p className="mt-0.5 text-sm">
              {typeById.get(attacker.unitTypeId)?.name} → <strong>{defenderName}</strong>
            </p>
            <div className="my-3 flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-rose-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-400"
                  style={{ width: `${pendingAttack.target.odds.killChance * 100}%` }}
                />
              </div>
              <span className="font-['IBM_Plex_Mono'] text-lg font-semibold">{Math.round(pendingAttack.target.odds.killChance * 100)} %</span>
            </div>
            <p className="text-xs text-stone-400">{pendingAttack.target.cityId ? t('board.attack.captureChance') : t('board.attack.winChance')}</p>
            {pendingAttack.target.defender ? (
              <p className="mt-1 font-['IBM_Plex_Mono'] text-[11px] text-stone-400">
                {t('board.attack.details', {
                  hit: Math.round(pendingAttack.target.odds.hitChance * 100),
                  own: pendingAttack.target.attacker.damage,
                  enemy: pendingAttack.target.defender.damage,
                  loss: formatNumber(locale, pendingAttack.target.odds.expectedDamageTaken, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                })}
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-300">
                {typeById.get(attacker.unitTypeId)!.hitPoints > 1 && attacker.hp === typeById.get(attacker.unitTypeId)!.hitPoints
                  ? t('board.attack.spentGarrison')
                  : t('board.attack.spent')}
              </p>
            )}
            {(attackDetails.modifiers.length > 0 || attackDetails.approach > 0) && (
              <p className="mt-1 text-xs text-stone-400">
                {attackDetails.modifiers.length > 0 && (
                  <>
                    {t('board.attack.defender', { mods: attackDetails.modifiers.map((m) => `${t(m.label)} +${m.value}`).join(' · ') })}
                  </>
                )}
                {attackDetails.modifiers.length > 0 && attackDetails.approach > 0 && ' · '}
                {attackDetails.approach > 0 &&
                  t('board.attack.approach', { count: attackDetails.approach })}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingAttack(null)}
                className="min-h-11 flex-1 rounded-md border border-stone-600 text-sm font-semibold hover:bg-stone-800"
              >
                {t('board.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmAttack}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 text-sm font-bold uppercase tracking-wider text-white hover:bg-rose-500"
              >
                <Swords className="size-4" /> {t('board.attack.confirm')}
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
          title={t('board.nextUnit')}
          disabled={!canAct || pendingOrders.length === 0}
          className="flex min-h-12 items-center gap-2 rounded-lg px-3 text-stone-200 transition-colors hover:bg-stone-800 disabled:opacity-40"
        >
          <Crosshair className="size-5" />
          <span className="whitespace-nowrap font-['Big_Shoulders_Display'] text-sm font-bold uppercase tracking-widest">
            {t('board.next')}<span className="hidden sm:inline">{t('board.unitSuffix')}</span>
          </span>
          <span className="rounded bg-stone-800 px-1.5 font-['IBM_Plex_Mono'] text-xs text-amber-300">{pendingOrders.length}</span>
        </button>
        <button
          type="button"
          onClick={handleEndTurn}
          disabled={!canAct}
          data-tutorial-focus={focusUi === 'endTurn' ? '' : undefined}
          className="min-h-12 whitespace-nowrap rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 px-5 font-['Big_Shoulders_Display'] text-base font-black uppercase tracking-[0.18em] text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:from-amber-300 hover:to-amber-500 disabled:from-stone-600 disabled:to-stone-700 disabled:text-stone-400"
        >
          {result ? t('board.matchEnded') : t('board.endTurn')}
        </button>
      </div>

      {/* End-turn confirmation */}
      {confirmEnd && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-stone-950/50 p-3 sm:items-center">
          <div role="alertdialog" aria-labelledby="dos-end-title" className="w-full max-w-sm rounded-xl border border-stone-300 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
            <h2 id="dos-end-title" className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wider">
              {t('board.endTurnQ')}
            </h2>
            {askPending && (
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                {t('board.pendingOrders', { count: pendingOrders.length })}
              </p>
            )}
            {stranded.length > 0 && (
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                {t('board.stranded', {
                  count: stranded.length,
                  list: stranded
                    .map(({ unit: u, returnDist }) =>
                      t('board.strandedUnit', {
                        name: typeById.get(u.unitTypeId)?.name ?? u.unitTypeId,
                        col: u.col,
                        row: u.row,
                        fuel: u.fuel ?? 0,
                        base: Number.isFinite(returnDist) ? t('board.baseTiles', { count: returnDist }) : t('board.unreachable'),
                      }),
                    )
                    .join(', '),
                })}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmEnd(false)
                  if (askPending) nextUnit()
                  else if (stranded[0]) {
                    selectUnit(stranded[0].unit.id)
                    centerOn(stranded[0].unit)
                  }
                }}
                className="min-h-11 flex-1 rounded-md border border-stone-300 text-sm font-semibold hover:border-teal-500 dark:border-stone-600"
              >
                {t('board.toUnits')}
              </button>
              <button
                type="button"
                onClick={handleEndTurn}
                className="min-h-11 flex-1 rounded-md bg-amber-500 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-400"
              >
                {t('board.endAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
