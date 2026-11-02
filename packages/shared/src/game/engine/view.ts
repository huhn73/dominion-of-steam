import { attackTargets, buildIndex } from '../hex'
import { FACTIONS, UNIT_TYPES } from '../catalog'
import { tileIndex } from '../mapcodec'
import type { City, CombatPreview, GameMap, Participant, ReplayAction, Unit } from '../types'
import type { PlayerView } from '../view'
import { combatOdds } from './combat'
import { currentParticipant, type GameState } from './state'
import { exploredOf, seesUnit, visibleIndices } from './visibility'

const CODE_U = 'u'.charCodeAt(0)
const CODE_E = 'e'.charCodeAt(0)
const CODE_V = 'v'.charCodeAt(0)

/** The board as the viewer knows it: map with visibility, known cities, visible units */
export function projectBoard(
  state: GameState,
  viewerId: string,
): { map: GameMap; cities: City[]; units: Unit[]; visible: Set<number> } {
  const viewer = state.participants.find((p) => p.id === viewerId)
  if (!viewer) throw new Error(`Teilnehmer ${viewerId} gehört nicht zur Partie`)
  const visible = visibleIndices(state, viewerId)
  const explored = exploredOf(viewer, state.map)
  const n = state.map.width * state.map.height

  const codes = new Uint8Array(n)
  for (let i = 0; i < n; i++) codes[i] = explored[i] ? CODE_E : CODE_U
  for (const i of visible) codes[i] = CODE_V
  let visibility = ''
  for (let i = 0; i < n; i += 8192)
    visibility += String.fromCharCode.apply(null, Array.from(codes.subarray(i, i + 8192)))
  const map: GameMap = {
    width: state.map.width,
    height: state.map.height,
    seed: state.map.seed,
    terrain: state.map.terrain,
    visibility,
  }

  const cities: City[] = state.cities
    .filter((c) => viewerId in c.knownBy && explored[tileIndex(state.map, c)] === 1)
    .map(({ knownBy, underFire: _f, ...c }) => {
      const isVisible = visible.has(tileIndex(state.map, c))
      const ownerId = isVisible ? c.ownerId : (knownBy[viewerId] ?? null)
      return {
        ...c,
        ownerId,
        production: c.ownerId === viewerId ? c.production : null,
        damage: isVisible ? c.damage : 0,
      }
    })

  const units: Unit[] = state.units
    .filter((u) => {
      if (u.ownerId === viewerId) return true
      // Enemies only when visible, never as cargo, submarines only when detected
      return seesUnit(state, viewerId, u, (x) => visible.has(tileIndex(state.map, x)))
    })
    .map(({ skipped: _s, patrolIndex: _p, revealedTo: _r, ...u }) =>
      u.ownerId === viewerId
        ? u
        : { ...u, order: { type: 'none' }, cargoUnitIds: [], needsOrders: false },
    )
  return { map, cities, units, visible }
}

/** What a participant may see of the match: fog of war is enforced here */
export function projectView(
  state: GameState,
  viewerId: string,
  { previews = true } = {},
): PlayerView {
  const viewer = state.participants.find((p) => p.id === viewerId)
  if (!viewer) throw new Error(`Teilnehmer ${viewerId} gehört nicht zur Partie`)
  const isTurn = currentParticipant(state).id === viewerId && state.status === 'running'
  const { map, cities, units } = projectBoard(state, viewerId)

  const participants: Participant[] = state.participants.map((p) => ({
    id: p.id,
    name: p.name,
    isYou: p.id === viewerId,
    isAI: p.isAI,
    aiDifficulty: p.aiDifficulty,
    factionId: p.factionId,
    color: p.color,
    status: p.status,
    cityCount: state.cities.filter((c) => c.ownerId === p.id).length,
    unitCount: state.units.filter((u) => u.ownerId === p.id).length,
  }))

  const events = state.events
    .filter((e) => e.participantId === viewerId && e.seq > viewer.lastTurnEndSeq)
    .map(({ participantId: _p, seq: _s, ...e }) => e)

  const replay: ReplayAction[] = state.log
    .filter(
      (l) =>
        l.participantId !== viewerId && l.seq > viewer.lastTurnEndSeq && l.seenBy[viewerId]?.length,
    )
    .map((l) => ({
      id: `r${l.seq}`,
      participantId: l.participantId,
      action: l.action,
      unitTypeId: l.unitTypeId,
      path: l.seenBy[viewerId]!,
      result: l.result,
    }))

  const combatPreviews: CombatPreview[] = []
  if (isTurn && previews) {
    const idx = buildIndex(map, cities, units, UNIT_TYPES, viewerId)
    for (const u of units) {
      if (u.ownerId !== viewerId || Math.min(u.movesLeft, u.fuel ?? Infinity) <= 0) continue
      for (const t of attackTargets(u, idx, units, cities, [])) {
        combatPreviews.push({
          attackerUnitId: u.id,
          targetUnitId: t.unitId ?? null,
          targetCityId: t.cityId ?? null,
          odds: combatOdds(state, u.id, t),
        })
      }
    }
  }

  return {
    match: {
      id: state.id,
      name: state.name,
      round: state.round,
      mode: state.mode,
      phase: isTurn ? state.phase : 'waiting',
      // Async: deadline per turn; live: only with a time limit per turn
      turnDeadline: state.status === 'running' ? state.turnDeadline : null,
      youId: viewerId,
    },
    participants,
    factions: FACTIONS,
    unitTypes: UNIT_TYPES,
    map,
    cities,
    units,
    events,
    replay,
    combatPreviews,
    rules: state.rules,
    result:
      state.status === 'finished'
        ? {
            winnerId: state.winnerId,
            endedAt: state.endedAt ?? new Date(0).toISOString(),
            placements: Object.fromEntries(
              state.participants.flatMap((p) => (p.placement ? [[p.id, p.placement]] : [])),
            ),
          }
        : null,
  }
}
