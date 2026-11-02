// Spielwerte, abgeleitet aus den Stammdaten des Kompendiums (eine Quelle für Spiel und Kompendium)
import { COMPENDIUM_FACTIONS, COMPENDIUM_UNIT_TYPES } from '../compendium'
import type { Faction, UnitType } from './types'

// The map tiers live in ./mapSizes; re-exported here for older imports (sim package, tests)
export { MAP_SIZES, type MapSizeId } from './mapSizes'

export const FACTIONS: Faction[] = COMPENDIUM_FACTIONS.map((f) => ({
  id: f.id,
  name: f.name,
  trait: f.trait,
  description: f.playstyleSummary,
  bonus: {
    label: f.bonus.label,
    domain: f.bonus.domain,
    stat: f.bonus.stat,
    modifier: f.bonus.modifier,
    mode: f.bonus.mode,
    ...(f.bonus.minBase != null ? { minBase: f.bonus.minBase } : {}),
  },
  specialUnitTypeId: f.specialUnitTypeId,
}))

export const UNIT_TYPES: UnitType[] = COMPENDIUM_UNIT_TYPES.map((u) => ({
  id: u.id,
  name: u.name,
  domain: u.domain,
  strength: u.strength,
  defense: u.defense,
  hitPoints: u.hitPoints,
  damage: u.damage,
  movement: u.movement,
  range: u.range,
  capacity: u.capacity,
  cargoDomain: u.cargoDomain,
  productionTurns: u.productionTurns,
  factionId: u.factionId,
  canCaptureCities: u.canCaptureCities,
}))
