import type { Message } from '../i18n'
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
  /** ISO timestamp: async deadline per turn, or the live time limit per turn (null without one) */
  turnDeadline: string | null
  youId: string
  /** Participant on the move (null once the match is over); lets „KI zieht …“ name the AI */
  currentId?: string | null
}

export type VictoryCondition = 'elimination' | 'capitals' | 'roundLimit' | 'dominance'

/** Why a match ended (shown on the result card) */
export type EndReason = 'elimination' | 'capitals' | 'roundLimit' | 'dominance' | 'noHumans'

/** Rules chosen in the setup wizard */
export interface GameRules {
  mode: 'live' | 'async'
  /** Deadline per turn in async matches */
  asyncTurnLimitHours: number
  /** Time limit per turn in live matches, null = none */
  liveTurnLimitMinutes: number | null
  victoryCondition: VictoryCondition
  /** Only used with victoryCondition 'roundLimit'; null means no limit */
  roundLimit: number | null
  allowDuplicateFactions: boolean
}

/** Outcome of a finished match */
export interface MatchResult {
  winnerId: string | null
  /** ISO timestamp */
  endedAt: string
  /** Placement per participant id, 1 = winner */
  placements: Record<string, number>
  /** How it ended; null for matches finished before the reason was recorded */
  reason: EndReason | null
}

/** A participant holding the city share for the victory condition 'dominance' */
export interface Dominance {
  participantId: string
  /** Share of all cities, 0..1 */
  share: number
  /** Own turns still needed to win */
  turnsLeft: number
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
  /** An AI that gave up a lost match; its cities became neutral */
  capitulated: boolean
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
  /** The bonus only applies to base values of at least this (e.g. not to the cheapest unit) */
  minBase?: number
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
  /** Strength against defense gives the chance to hit per combat round */
  strength: number
  defense: number
  /** Hit points when undamaged */
  hitPoints: number
  /** Hit points one hit takes from the other side */
  damage: number
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

/**
 * The board as the viewer knows it, one character per tile in row-major order
 * (`row * width + col`): `terrain` with the codes of `mapcodec.ts` (~ s . f h m),
 * `visibility` with u/e/v. `expandMap` turns it into `Tile` objects when needed.
 */
export interface GameMap {
  width: number
  height: number
  seed: string
  terrain: string
  visibility: string
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
  /** Damage from attacks (0 to MAX_CITY_DAMAGE); each level adds a turn to new builds. 0 when not visible */
  damage: number
}

export type UnitOrder =
  | { type: 'none' }
  | { type: 'sentry' }
  | { type: 'goto'; target: HexCoord; turnsRemaining: number }
  | { type: 'patrol'; waypoints: HexCoord[] }
  /** Aircraft only: fly into the fog each round, refuel at a base when needed */
  | { type: 'explore' }

export interface Unit extends HexCoord {
  id: string
  unitTypeId: string
  ownerId: string
  /** Current hit points, 1 … UnitType.hitPoints while alive */
  hp: number
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
  | 'cityDiscovered'
  | 'exploration'
  | 'unitBuilt'
  | 'unitLost'
  | 'fuelLow'
  | 'dominance'
  | 'capitulation'

export interface GameEvent extends HexCoord {
  id: string
  round: number
  type: GameEventType
  /** German text (older saves have only this) */
  message: string
  /** The text in the player's language: key and parameters */
  text?: Message
  isNew: boolean
}

export interface ReplayAction {
  id: string
  participantId: string
  action: 'move' | 'attack' | 'capture'
  unitTypeId: string
  path: HexCoord[]
  result: string | null
  /** `result` as a text for the player (missing in older saves) */
  resultText?: Message | null
}

/**
 * Odds of an attack. A fight runs in rounds until one side has no hit points left: each round
 * the attacker hits with `hitChance` and takes `attackerDamage` from the defender, otherwise the
 * defender takes `defenderDamage` from the attacker. The chance does not change between rounds.
 */
export interface CombatOdds {
  /** Chance per round that the attacker lands the hit (city: chance to capture) */
  hitChance: number
  /** Chance to destroy the defender, i.e. to win the fight (city: to capture it) */
  killChance: number
  /** Chance to lose the attacker (city attack: always 1, the unit is spent) */
  deathChance: number
  /** Expected hit points the attacker loses over the whole fight */
  expectedDamageTaken: number
}

export interface CombatPreview {
  attackerUnitId: string
  targetUnitId: string | null
  targetCityId: string | null
  odds: CombatOdds
}

/** Who landed the hit in a combat round */
export type CombatHit = 'attacker' | 'defender'

export interface CombatResult {
  attackerUnitId: string
  /** null when a city without defenders was attacked */
  defenderUnitId: string | null
  /** Set when a city was attacked; with `captured` it changed hands */
  targetCityId: string | null
  /** The rounds in order (city attack: exactly one roll) */
  hits: CombatHit[]
  /** Hit points lost */
  attackerDamage: number
  defenderDamage: number
  attackerDestroyed: boolean
  defenderDestroyed: boolean
  /** The attacker moved onto the destroyed defender's tile */
  advanced: boolean
  /** The city changed hands (the attacker is always spent in a city attack) */
  captured: boolean
  /** Grenadiers an undamaged attacker left behind in the captured city */
  garrisonUnitId: string | null
  /** German text */
  message: string
  text: Message
}
