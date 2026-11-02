// =============================================================================
// Basics
// =============================================================================

/** Hex position in offset coordinates (pointy-top, odd rows shifted right) */
export interface HexCoord {
  col: number
  row: number
}

export type Terrain = 'deepSea' | 'shallows' | 'plains' | 'forest' | 'hills' | 'mountains'

export type Visibility = 'unexplored' | 'explored' | 'visible'

export type UnitDomain = 'land' | 'sea' | 'air'

/** Tailwind color name used for a participant's units, cities and markers */
export type ParticipantColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

// =============================================================================
// Data
// =============================================================================

export interface Match {
  id: string
  name: string
  round: number
  mode: 'live' | 'async'
  phase: 'replay' | 'yourTurn' | 'waiting'
  /** ISO timestamp, only set for async matches */
  turnDeadline: string | null
  youId: string
}

export interface Participant {
  id: string
  name: string
  isYou: boolean
  isAI: boolean
  aiDifficulty: 'easy' | 'normal' | 'hard' | null
  factionId: string
  color: ParticipantColor
  status: 'active' | 'eliminated'
  cityCount: number
  unitCount: number
}

export interface FactionBonus {
  label: string
  /** Einsatzgebiet the bonus applies to, null if it does not affect units */
  domain: UnitDomain | null
  /** Unit value that changes, null if the bonus affects something else (e.g. cities) */
  stat: 'movement' | 'range' | 'productionTurns' | 'strength' | 'defense' | null
  modifier: number
  /** 'add' adds the modifier, 'multiply' multiplies the base value by it */
  mode: 'add' | 'multiply'
}

export interface Faction {
  id: string
  name: string
  trait: string
  description: string
  bonus: FactionBonus
  specialUnitTypeId: string | null
}

export interface UnitType {
  id: string
  name: string
  domain: UnitDomain
  strength: number
  defense: number
  movement: number
  /** Max fuel for air units, null for land and sea units */
  range: number | null
  /** How many units it can carry, 0 if none */
  capacity: number
  /** What it carries: land units (transports) or air units (carriers), null if nothing */
  cargoDomain: UnitDomain | null
  productionTurns: number
  /** Set for faction-exclusive special units */
  factionId: string | null
  canCaptureCities: boolean
}

export interface Tile extends HexCoord {
  terrain: Terrain
  visibility: Visibility
}

export interface GameMap {
  width: number
  height: number
  seed: string
  tiles: Tile[]
}

export interface Production {
  unitTypeId: string
  progress: number
  turnsRemaining: number
}

export interface City extends HexCoord {
  id: string
  name: string
  /** null for neutral cities */
  ownerId: string | null
  isCapital: boolean
  /** Only known for your own cities; null if nothing is being built */
  production: Production | null
}

export type UnitOrder =
  | { type: 'none' }
  | { type: 'sentry' }
  | { type: 'goto'; target: HexCoord; turnsRemaining: number }
  | { type: 'patrol'; waypoints: HexCoord[] }

export interface Unit extends HexCoord {
  id: string
  unitTypeId: string
  ownerId: string
  /** 0–100 */
  health: number
  movesLeft: number
  /** Remaining fuel for air units, null otherwise */
  fuel: number | null
  order: UnitOrder
  cargoUnitIds: string[]
  /** ID of the transport carrying this unit */
  carriedBy: string | null
  needsOrders: boolean
}

export type GameEventType =
  | 'enemySighted'
  | 'combat'
  | 'cityLost'
  | 'cityCaptured'
  | 'unitBuilt'
  | 'unitLost'
  | 'fuelLow'

export interface GameEvent extends HexCoord {
  id: string
  round: number
  type: GameEventType
  message: string
  isNew: boolean
}

export interface ReplayAction {
  id: string
  participantId: string
  action: 'move' | 'attack' | 'capture'
  unitTypeId: string
  path: HexCoord[]
  result: string | null
}

export interface CombatPreview {
  attackerUnitId: string
  targetUnitId: string | null
  targetCityId: string | null
  /** 0–1 */
  winChance: number
}

export interface CombatResult {
  attackerUnitId: string
  /** null when a city without defenders was attacked */
  defenderUnitId: string | null
  /** Set when a city was attacked; on victory the city is captured */
  targetCityId: string | null
  outcome: 'victory' | 'defeat'
  /** Damage taken in health points */
  attackerDamage: number
  defenderDamage: number
  message: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface SpielfeldUndZuegeProps {
  match: Match
  participants: Participant[]
  factions: Faction[]
  unitTypes: UnitType[]
  map: GameMap
  cities: City[]
  units: Unit[]
  events: GameEvent[]
  replay: ReplayAction[]
  combatPreviews: CombatPreview[]
  lastCombat?: CombatResult | null

  /** Called when the player selects one of their units */
  onSelectUnit?: (unitId: string) => void
  /** Called when the player confirms a move within this round's reach (tap or drag) */
  onMoveUnit?: (unitId: string, target: HexCoord) => void
  /** Called when the player sets a target beyond this round's reach */
  onSetGoto?: (unitId: string, target: HexCoord) => void
  /** Called when the player puts a unit on sentry */
  onSetSentry?: (unitId: string) => void
  /** Called when the player confirms patrol waypoints for a unit */
  onSetPatrol?: (unitId: string, waypoints: HexCoord[]) => void
  /** Called when the player clears a unit's standing order */
  onCancelOrder?: (unitId: string) => void
  /** Called when the player skips a unit for this round */
  onSkipUnit?: (unitId: string) => void
  /** Called when the player attacks an enemy unit or city */
  onAttack?: (unitId: string, target: { unitId?: string; cityId?: string }) => void
  /** Called when the player unloads a carried unit onto an adjacent land tile */
  onUnloadUnit?: (unitId: string, target: HexCoord) => void
  /** Called when the player opens a city's panel */
  onSelectCity?: (cityId: string) => void
  /** Called when the player picks what a city should build */
  onSetProduction?: (cityId: string, unitTypeId: string) => void
  /** Called when the player taps an event in the log */
  onSelectEvent?: (eventId: string) => void
  /** Called when the player skips the opponent replay */
  onSkipReplay?: () => void
  /** Called when the player ends their turn */
  onEndTurn?: () => void
}
