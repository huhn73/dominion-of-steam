// =============================================================================
// Data Types
// =============================================================================

export type UnitDomain = 'land' | 'sea' | 'air'

/** Tailwind color name used for a faction's emblem and header */
export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

/** Unit values a faction bonus can change */
export type BonusStat = 'movement' | 'range' | 'productionTurns' | 'strength' | 'defense'

export interface FactionBonus {
  label: string
  description: string
  /** Einsatzgebiet the bonus applies to, null if it does not affect units */
  domain: UnitDomain | null
  /** Unit value that changes, null if the bonus affects something else (e.g. cities) */
  stat: BonusStat | null
  modifier: number
  /** 'add' adds the modifier, 'multiply' multiplies the base value by it */
  mode: 'add' | 'multiply'
  /** The bonus only applies to base values of at least this (e.g. not to the cheapest unit) */
  minBase?: number
}

export interface Faction {
  id: string
  name: string
  /** Short label for badges and tabs, e.g. "Aurelia" */
  shortName: string
  motto: string
  color: FactionColor
  /** Shield emblem, transparent PNG (8:9) */
  emblemUrl: string | null
  /** Wide header image (21:9) with the subject on the right */
  heroImageUrl: string | null
  trait: string
  bonus: FactionBonus
  playstyle: string[]
  playstyleSummary: string
  /** Paragraphs separated by blank lines */
  history: string
  specialUnitTypeId: string | null
}

export interface UnitType {
  id: string
  name: string
  domain: UnitDomain
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
  description: string
  tactics: string[]
  /** Painted illustration (4:3) */
  illustrationUrl: string | null
  /** Faction-specific looks of a general unit (faction id → image); same stats, different design. Empty for special units. */
  variantIllustrationUrls: Record<string, string>
}
