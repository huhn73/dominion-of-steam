// Datentypen kommen aus packages/shared; die Props sind unverändert aus der Design-Übergabe
import type { Faction, UnitType } from '@dos/shared/compendium'
export type * from '@dos/shared/compendium'

// =============================================================================
// Component Props
// =============================================================================

export interface FraktionenUndEinheitenProps {
  factions: Faction[]
  unitTypes: UnitType[]
  /** Called when the user opens a faction's detail view */
  onSelectFaction?: (factionId: string) => void
  /** Called when the user opens a unit type's detail view */
  onSelectUnitType?: (unitTypeId: string) => void
}

export interface FraktionDetailProps {
  faction: Faction
  /** All unit types; the view picks the special unit and the general units */
  unitTypes: UnitType[]
  /** Called when the user opens a unit type's detail view, showing this faction's variant */
  onSelectUnitType?: (unitTypeId: string, factionId: string) => void
  /** Called when the user goes back to the previous view */
  onBack?: () => void
}

export interface EinheitDetailProps {
  unitType: UnitType
  /** Faction for special units, null for general units */
  faction: Faction | null
  /** All factions, used for the variant switcher of general units */
  factions: Faction[]
  /** Faction whose variant is shown first, e.g. when opened from a faction's page */
  initialVariantFactionId?: string | null
  /** All unit types, used to scale the stat bars to the highest value */
  unitTypes: UnitType[]
  /** Called when the user opens the faction of a special unit */
  onSelectFaction?: (factionId: string) => void
  /** Called when the user goes back to the previous view */
  onBack?: () => void
}
