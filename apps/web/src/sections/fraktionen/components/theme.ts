import type { MessageKey } from '@dos/shared/i18n'
import type { Faction, FactionColor, UnitDomain, UnitType } from '../types'

// Typography: Big Shoulders Display (headings), Barlow (body), IBM Plex Mono (numbers)

export const FACTION_HEX: Record<FactionColor, { base: string; deep: string; light: string }> = {
  amber: { base: '#f59e0b', deep: '#78350f', light: '#fef3c7' },
  rose: { base: '#f43f5e', deep: '#881337', light: '#ffe4e6' },
  sky: { base: '#0ea5e9', deep: '#0c4a6e', light: '#e0f2fe' },
  lime: { base: '#84cc16', deep: '#365314', light: '#ecfccb' },
  violet: { base: '#8b5cf6', deep: '#4c1d95', light: '#ede9fe' },
  orange: { base: '#f97316', deep: '#7c2d12', light: '#ffedd5' },
}

export const DOMAIN_LABEL = {
  land: 'compendium.domain.land',
  sea: 'compendium.domain.sea',
  air: 'compendium.domain.air',
} as const satisfies Record<UnitDomain, MessageKey>

export interface BonusEffect {
  stat: NonNullable<Faction['bonus']['stat']>
  base: number
  value: number
}

/** How a faction's bonus changes a unit's value, or null if it doesn't apply */
export function bonusEffect(unit: UnitType, faction: Faction): BonusEffect | null {
  const { stat, domain, modifier, mode, minBase } = faction.bonus
  if (!stat || (domain && domain !== unit.domain)) return null
  const base = unit[stat]
  if (base == null || (minBase != null && base < minBase)) return null
  const raw = mode === 'add' ? base + modifier : Math.round(base * modifier)
  const value = stat === 'productionTurns' ? Math.max(1, raw) : raw
  return value === base ? null : { stat, base, value }
}
