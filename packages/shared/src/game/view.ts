import type {
  City,
  CombatPreview,
  CombatResult,
  Dominance,
  Faction,
  GameEvent,
  GameMap,
  HexCoord,
  GameRules,
  Match,
  MatchResult,
  Participant,
  ReplayAction,
  Unit,
  UnitType,
} from './types'

/** Everything a participant sees of a match (the data props of `Spielfeld`) */
export interface PlayerView {
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
  /** Rules of the match (setup wizard) */
  rules: GameRules
  /** Set once the match is finished */
  result: MatchResult | null
  /** Victory condition 'dominance': who holds the city share and for how much longer */
  dominance: Dominance | null
  /** Only in tutorial matches: the current guided step */
  tutorial?: TutorialView | null
}

/** What a tutorial step points at: a tile on the map and/or a control of the board */
export interface TutorialFocus {
  hex?: HexCoord
  ui?: 'endTurn' | 'minimap'
}

export interface TutorialView {
  /** Index of the current step (0-based); equals `total` once the tutorial is done */
  step: number
  total: number
  current: {
    id: string
    title: string
    text: string
    focus: TutorialFocus | null
    /** Text step: confirmed with „Weiter“ instead of an action */
    manual: boolean
  } | null
}

/** How the match ended for the viewer */
export type MatchOutcome = 'victory' | 'defeat' | 'surrendered'

/**
 * The viewer's outcome of a finished match: winner → victory; a seat that an AI took over
 * after surrender (still `isYou`, now `isAI`) → surrendered; otherwise defeat.
 * null while the match runs or when the viewer does not take part.
 */
export function matchOutcome(view: {
  match: Pick<Match, 'youId'>
  participants: Pick<Participant, 'id' | 'isAI'>[]
  result: Pick<MatchResult, 'winnerId'> | null
}): MatchOutcome | null {
  if (!view.result) return null
  const me = view.participants.find((p) => p.id === view.match.youId)
  if (!me) return null
  if (view.result.winnerId === me.id) return 'victory'
  return me.isAI ? 'surrendered' : 'defeat'
}

/** Points of a participant as the round limit counts them: 3 per city plus 1 per unit */
export const participantScore = (p: Pick<Participant, 'cityCount' | 'unitCount'>) =>
  p.cityCount * 3 + p.unitCount

export type Command =
  | { type: 'move'; unitId: string; target: HexCoord }
  | { type: 'goto'; unitId: string; target: HexCoord }
  | { type: 'sentry'; unitId: string }
  | { type: 'patrol'; unitId: string; waypoints: HexCoord[] }
  | { type: 'explore'; unitId: string }
  | { type: 'cancelOrder'; unitId: string }
  | { type: 'skip'; unitId: string }
  | { type: 'attack'; unitId: string; target: { unitId?: string; cityId?: string } }
  | { type: 'unload'; unitId: string; target: HexCoord }
  | { type: 'setProduction'; cityId: string; unitTypeId: string }
  | { type: 'markEventRead'; eventId: string }
  | { type: 'skipReplay' }
  | { type: 'endTurn' }
  | { type: 'tutorialNext' }
  | { type: 'tutorialSkip' }

export interface CommandResponse {
  view: PlayerView
  combat?: CombatResult
}

export interface ApiError {
  error: { code: string; message: string }
}
