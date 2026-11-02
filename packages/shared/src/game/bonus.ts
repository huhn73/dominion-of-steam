import type { Faction, UnitType } from './types'

/** Unit value after the faction bonus, or the base value if the bonus doesn't apply */
export function withBonus(type: UnitType, faction: Faction | undefined, stat: NonNullable<Faction['bonus']['stat']>) {
  const base = type[stat]
  if (base == null || !faction) return base
  const { stat: bStat, domain, modifier, mode, minBase } = faction.bonus
  if (bStat !== stat || (domain && domain !== type.domain)) return base
  if (minBase != null && base < minBase) return base
  const value = mode === 'add' ? base + modifier : Math.round(base * modifier)
  return stat === 'productionTurns' ? Math.max(1, value) : value
}
