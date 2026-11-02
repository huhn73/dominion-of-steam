import type {
  City,
  GameRules,
  Faction,
  GameEvent,
  HexCoord,
  Match,
  Participant,
  Terrain,
  Unit,
  UnitType,
} from '../types'
import { bitsFromKeys } from '../bits'
import { FACTIONS, UNIT_TYPES } from '../catalog'
import { encodeTerrain } from '../mapcodec'
import { createRng } from './rng'

export type { GameRules, VictoryCondition } from '../types'

export const defaultRules = (mode: Match['mode']): GameRules => ({
  mode,
  asyncTurnLimitHours: 48,
  liveTurnLimitMinutes: null,
  victoryCondition: 'elimination',
  roundLimit: 100,
  allowDuplicateFactions: false,
})

/** Full, authoritative game state as stored on the server (never sent to clients as is) */
export interface GameState {
  id: string
  name: string
  /** Same as `rules.mode` */
  mode: Match['mode']
  rules: GameRules
  seed: string
  round: number
  status: 'running' | 'finished'
  /** Set when the match is finished; null when nobody won */
  winnerId: string | null
  /** ISO timestamp when the match finished */
  endedAt: string | null
  /** Index into `participants` of the participant whose turn it is */
  seat: number
  /** Phase of the participant whose turn it is */
  phase: 'replay' | 'yourTurn'
  /** ISO timestamp, only for async matches */
  turnDeadline: string | null
  participants: ParticipantState[]
  /** Terrain as one character per tile, row-major (codes in ../mapcodec.ts) */
  map: { width: number; height: number; seed: string; terrain: string }
  cities: CityState[]
  units: UnitState[]
  events: EventState[]
  log: LogEntry[]
  /** Monotonic counter for events and log entries */
  seq: number
  /** Counter for the seeded combat RNG */
  rng: number
  /** Counter for new IDs */
  nextId: number
}

export interface ParticipantState {
  id: string
  name: string
  isAI: boolean
  aiDifficulty: Participant['aiDifficulty']
  factionId: string
  color: Participant['color']
  status: Participant['status']
  /** Explored tiles as a bitset over the tile index (../bits.ts) */
  explored: string
  /** `seq` when this participant last ended a turn; events and replay are shown from here */
  lastTurnEndSeq: number
  /** AI personality (setup master data), null for humans and AIs without one */
  aiPersonalityId: string | null
  /** The capital the participant started with (victory condition 'capitals') */
  capitalCityId: string | null
  /** Statistics for the profile: cities taken, units finished in own cities */
  citiesCaptured: number
  unitsBuilt: number
  /** `seq` when the participant was eliminated (earlier = worse placement) */
  eliminatedSeq: number | null
  /** Final placement once the match is finished, 1 = winner */
  placement: number | null
  /** Set when the human player surrendered; an AI ("Normal") plays the faction since then */
  surrender: SurrenderInfo | null
  /**
   * What the participant knew at the end of their last turn: known cities with the owner seen
   * last and the ids of visible foreign units. The turn report compares against it; null before
   * the first turn ends.
   */
  seenAtTurnEnd: Sighting | null
}

export interface Sighting {
  cities: Record<string, string | null>
  unitIds: string[]
}

/** A human participant who surrendered keeps the participant id; the AI takes over */
export interface SurrenderInfo {
  /** Player name before the AI took over (the participant is renamed "KI für …") */
  name: string
  /** ISO timestamp */
  at: string
  round: number
  /** Placement of the player: behind all participants still active at that time */
  placement: number
  /** Statistics at the time of surrender (the AI keeps counting on the participant) */
  citiesCaptured?: number
  unitsBuilt?: number
}

export interface CityState extends Omit<City, 'production'> {
  production: City['production']
  /** Last owner each participant has seen; a city is known to a participant once it has an entry */
  knownBy: Record<string, string | null>
  /** Attacked since the owner's last turn started; blocks the recovery of `damage` */
  underFire: boolean
}

export interface UnitState extends Unit {
  /** Skipped for the current turn */
  skipped?: boolean
  /** Submarines: participants who ran into it since its owner's last turn and can see it */
  revealedTo?: string[]
  /** Index of the next patrol waypoint */
  patrolIndex?: number
}

export interface EventState extends GameEvent {
  participantId: string
  seq: number
}

export interface LogEntry {
  seq: number
  round: number
  participantId: string
  action: 'move' | 'attack' | 'capture'
  unitTypeId: string
  path: HexCoord[]
  result: string | null
  /** Part of the path each other participant could see */
  seenBy: Record<string, HexCoord[]>
}

// =============================================================================
// Lookups
// =============================================================================

const typeMap = new Map(UNIT_TYPES.map((t) => [t.id, t]))
const factionMap = new Map(FACTIONS.map((f) => [f.id, f]))

export function unitType(id: string): UnitType {
  const t = typeMap.get(id)
  if (!t) throw new Error(`Unbekannter Einheitentyp ${id}`)
  return t
}

export function factionOf(state: GameState, participantId: string | null): Faction | undefined {
  const p = state.participants.find((x) => x.id === participantId)
  return p ? factionMap.get(p.factionId) : undefined
}

export function participant(state: GameState, id: string) {
  return state.participants.find((p) => p.id === id)
}

export const currentParticipant = (state: GameState) => state.participants[state.seat]!

/**
 * Fill in fields added after a state was stored (rules, results, statistics), so matches saved
 * by older versions keep working. Mutates and returns the state.
 */
export function normalizeState(state: GameState): GameState {
  const s = state as Partial<GameState> & GameState
  s.rules ??= defaultRules(s.mode)
  s.winnerId ??= null
  s.endedAt ??= null
  for (const p of s.participants) {
    const ps = p as Partial<ParticipantState> & ParticipantState
    ps.aiPersonalityId ??= null
    ps.capitalCityId ??= s.cities.find((c) => c.isCapital && c.ownerId === p.id)?.id ?? null
    ps.citiesCaptured ??= 0
    ps.unitsBuilt ??= 0
    ps.eliminatedSeq ??= null
    ps.placement ??= null
    ps.surrender ??= null
    ps.seenAtTurnEnd ??= null
  }
  for (const c of s.cities) {
    const cs = c as Partial<CityState> & CityState
    cs.damage ??= 0
    cs.underFire ??= false
  }
  // Older states stored a tile object per field and explored tiles as a list of keys
  const m = s.map as typeof s.map & { tiles?: (HexCoord & { terrain: Terrain })[] }
  if (m.tiles) {
    m.terrain = encodeTerrain(m.tiles, m.width, m.height)
    delete m.tiles
  }
  for (const p of s.participants) {
    const ps = p as ParticipantState & { explored: string | string[] }
    if (Array.isArray(ps.explored)) ps.explored = bitsFromKeys(ps.explored, s.map)
  }
  for (const u of s.units) {
    // Condition used to be a percentage (`health`); it became hit points per type
    const us = u as Partial<UnitState> & UnitState & { health?: number }
    if (us.hp == null) {
      const max = unitType(u.unitTypeId).hitPoints
      us.hp = Math.max(1, Math.min(max, Math.round(((us.health ?? 100) / 100) * max)))
    }
    delete us.health
  }
  return s
}

/** Put a unit (with its cargo) on a tile */
export function placeUnit(state: GameState, unit: UnitState, at: HexCoord) {
  unit.col = at.col
  unit.row = at.row
  for (const id of unit.cargoUnitIds) {
    const cargo = state.units.find((u) => u.id === id)
    if (cargo) {
      cargo.col = at.col
      cargo.row = at.row
    }
  }
}

/** Deadline of the turn that starts now: async from the rule in hours, live in minutes or none */
export function turnDeadline(state: Pick<GameState, 'rules'>, now: Date): string | null {
  const { rules } = state
  if (rules.mode === 'async')
    return new Date(now.getTime() + rules.asyncTurnLimitHours * 3600_000).toISOString()
  return rules.liveTurnLimitMinutes
    ? new Date(now.getTime() + rules.liveTurnLimitMinutes * 60_000).toISOString()
    : null
}

// =============================================================================
// Mutation helpers (the engine works on a structured clone)
// =============================================================================

export const clone = (state: GameState): GameState => structuredClone(state)

export function nextSeq(state: GameState) {
  state.seq += 1
  return state.seq
}

export function newId(state: GameState, prefix: string) {
  state.nextId += 1
  return `${prefix}${state.nextId}`
}

export function addEvent(
  state: GameState,
  participantId: string,
  type: GameEvent['type'],
  at: HexCoord,
  message: string,
) {
  state.events.push({
    id: newId(state, 'ev'),
    participantId,
    seq: nextSeq(state),
    round: state.round,
    type,
    message,
    col: at.col,
    row: at.row,
    isNew: true,
  })
}

/** Deterministic random number in [0, 1) from the match seed and a counter */
export function random(state: GameState) {
  state.rng += 1
  return createRng(`${state.seed}:${state.rng}`)()
}
