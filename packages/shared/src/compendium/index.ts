import data from './data.json'
import type { Faction, UnitType } from './types'

export type * from './types'

/** Master data of the compendium (product-plan/sections/fraktionen-and-einheiten/sample-data.json) */
export const COMPENDIUM_FACTIONS = data.factions as Faction[]
export const COMPENDIUM_UNIT_TYPES = data.unitTypes as UnitType[]

export interface CompendiumData {
  factions: Faction[]
  unitTypes: UnitType[]
}
