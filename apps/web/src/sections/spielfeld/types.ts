// Datentypen kommen aus packages/shared; die Props sind unverändert aus der Design-Übergabe
import type {
  CombatPreview,
  CombatResult,
  Dominance,
  Faction,
  GameEvent,
  GameMap,
  HexCoord,
  Match,
  MatchResult,
  Participant,
  ReplayAction,
  City,
  TutorialView,
  Unit,
  UnitType,
} from '@dos/shared/game'
export type * from '@dos/shared/game/types'

/**
 * Moments the board reports so the page can play sounds (the board itself stays silent,
 * see the audio brief). `ambience` carries the terrain shares of the visible map.
 */
export type BoardCue =
  | { type: 'unitSelected'; unitTypeId: string }
  | { type: 'unitMoved'; unitTypeId: string }
  | { type: 'moveInvalid' }
  | { type: 'pathPreview' }
  | { type: 'attackStarted'; attackerTypeId: string; domain: 'land' | 'sea' | 'air' }
  | { type: 'hit' }
  | { type: 'unitDestroyed' }
  | { type: 'cityCaptured' }
  | { type: 'turnEnded' }
  | { type: 'turnStarted' }
  | { type: 'replayStep'; action: 'move' | 'attack' | 'capture'; last: boolean }
  | { type: 'event'; eventType: 'cityLost' | 'unitBuilt' | 'fuelLow' }
  | { type: 'ambience'; mix: Record<string, number>; zoom: number }

// =============================================================================
// Component Props
// =============================================================================

/** Settings „Einheiten ziehen“, „Nachfrage beim Zugende“ and „Zoom-Empfindlichkeit“ (0–100) */
export interface BoardControls {
  dragUnits: boolean
  confirmEndTurn: boolean
  zoomSensitivity: number
}

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
  /** Duration of the combat sequence on the map; 0 shows only the toast */
  combatAnimationMs?: number
  /** Show the turn report card when the own turn starts (setting „Rundenbericht zu Zugbeginn“) */
  showTurnReport?: boolean
  /** The report may start the replay; false when „Gegnerzüge automatisch abspielen“ is off */
  canWatchReplay?: boolean
  /** Control settings from the profile; without them units can be dragged and the board asks */
  controls?: BoardControls
  /** Sound cues (selection, moves, combat, turn, ambience); the board plays nothing itself */
  onCue?: (cue: BoardCue) => void
  /** Set once the match is finished: shows the result card instead of the waiting banner */
  result?: MatchResult | null
  /** Victory condition „Vorherrschaft“: who holds the city share, shown as a countdown pill */
  dominance?: Dominance | null
  /** „Zur Lobby“ on the result card */
  onLeave?: () => void
  /** Tutorial match only: the current guided step (panel, highlighted tile and control) */
  tutorial?: TutorialView | null
  /** Tutorial: confirm a text step („Weiter“) */
  onTutorialNext?: () => void
  /** Tutorial: skip the current step */
  onTutorialSkip?: () => void
  /** Tutorial: „Neue Partie“ on the result card */
  onNewMatch?: () => void
  /** Open another player's profile (ranking of the result card) */
  onOpenPlayer?: (playerId: string) => void

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
  /** Called when the player sends an aircraft exploring the fog */
  onSetExplore?: (unitId: string) => void
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
