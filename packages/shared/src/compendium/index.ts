import data from './data.json'
import dataEn from './data.en.json'
import type { Locale } from '../i18n/locale'
import type { Faction, UnitType } from './types'

export type * from './types'

/** Master data of the compendium (product-plan/sections/fraktionen-and-einheiten/sample-data.json) */
export const COMPENDIUM_FACTIONS = data.factions as Faction[]
export const COMPENDIUM_UNIT_TYPES = data.unitTypes as UnitType[]

export interface CompendiumData {
  factions: Faction[]
  unitTypes: UnitType[]
}

/**
 * The compendium per language. German is the source (`data.json`); `data.en.json` has the same
 * structure and values, only the texts differ (checked in `__tests__/compendium.test.ts`).
 */
const BY_LOCALE: Record<Locale, CompendiumData> = {
  de: { factions: COMPENDIUM_FACTIONS, unitTypes: COMPENDIUM_UNIT_TYPES },
  en: { factions: dataEn.factions as Faction[], unitTypes: dataEn.unitTypes as UnitType[] },
}

export const compendiumFor = (locale: Locale): CompendiumData => BY_LOCALE[locale]

const FACTION_TEXT = [
  'name',
  'shortName',
  'motto',
  'trait',
  'playstyle',
  'playstyleSummary',
  'history',
] as const
const UNIT_TEXT = ['name', 'description', 'tactics'] as const

/**
 * Copies of `items` with the texts of the faction of the same id in `locale` (name, motto, trait,
 * bonus label …); only fields the item already has are replaced, so it works for the compendium,
 * the game catalog and the factions of lobby and setup alike.
 */
export function localizeFactions<T extends { id: string }>(
  items: readonly T[],
  locale: Locale,
): T[] {
  const byId = new Map(BY_LOCALE[locale].factions.map((f) => [f.id, f]))
  return items.map((item) => {
    const f = byId.get(item.id)
    if (!f) return item
    const out: Record<string, unknown> = { ...item }
    for (const key of FACTION_TEXT) if (key in out) out[key] = f[key]
    // The game catalog calls the summary `description`
    if ('description' in out && !('playstyleSummary' in out)) out.description = f.playstyleSummary
    const bonus = out.bonus as Record<string, unknown> | undefined
    if (bonus && typeof bonus === 'object') {
      out.bonus = {
        ...bonus,
        ...('label' in bonus ? { label: f.bonus.label } : {}),
        ...('description' in bonus ? { description: f.bonus.description } : {}),
      }
    }
    return out as T
  })
}

/** Like `localizeFactions` for unit types (name, description, tactics) */
export function localizeUnitTypes<T extends { id: string }>(
  items: readonly T[],
  locale: Locale,
): T[] {
  const byId = new Map(BY_LOCALE[locale].unitTypes.map((u) => [u.id, u]))
  return items.map((item) => {
    const u = byId.get(item.id)
    if (!u) return item
    const out: Record<string, unknown> = { ...item }
    for (const key of UNIT_TEXT) if (key in out) out[key] = u[key]
    return out as T
  })
}

/** Name of a unit type in `locale` (e.g. for event texts), the id if unknown */
export const unitTypeName = (locale: Locale, id: string) =>
  BY_LOCALE[locale].unitTypes.find((u) => u.id === id)?.name ?? id

/** Short name of a faction in `locale`, the id if unknown */
export const factionShortName = (locale: Locale, id: string) =>
  BY_LOCALE[locale].factions.find((f) => f.id === id)?.shortName ?? id
