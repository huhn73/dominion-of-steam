// Simulation-only overrides of unit and faction values, keyed by path:
//   "units.<unitTypeId>.<stat>"   e.g. "units.panzerwagen.productionTurns": 8
//   "factions.<factionId>.<field>" e.g. "factions.nordmark.modifier": 2
// The objects in FACTIONS and UNIT_TYPES are patched in place, because the engine holds references
// to them (state.ts typeMap/factionMap); the returned function restores the original values.
import { FACTIONS, UNIT_TYPES } from '@dos/shared/game/catalog'

export type CatalogOverride = Record<string, number>

export const UNIT_STATS = [
  'strength',
  'defense',
  'hitPoints',
  'damage',
  'movement',
  'range',
  'capacity',
  'productionTurns',
] as const
export const FACTION_FIELDS = ['modifier', 'minBase'] as const

type UnitStat = (typeof UNIT_STATS)[number]
type FactionField = (typeof FACTION_FIELDS)[number]

/** Checks one path and value; returns an error message or null */
export function checkCatalogEntry(path: string, value: unknown): string | null {
  const [kind, id, field, ...rest] = path.split('.')
  if (rest.length || !kind || !id || !field)
    return 'Schlüssel muss "units.<id>.<wert>" oder "factions.<id>.<feld>" sein'
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'muss eine Zahl sein'
  if (kind === 'units') {
    if (!UNIT_TYPES.some((t) => t.id === id)) return `unbekannte Einheit "${id}"`
    if (!(UNIT_STATS as readonly string[]).includes(field))
      return `unbekannter Wert (${UNIT_STATS.join(', ')})`
    if (!Number.isInteger(value) || value < 0) return 'muss eine ganze Zahl ≥ 0 sein'
    if (field === 'productionTurns' || field === 'hitPoints' || field === 'movement')
      if (value < 1) return 'muss ≥ 1 sein'
    return null
  }
  if (kind === 'factions') {
    if (!FACTIONS.some((f) => f.id === id)) return `unbekannte Fraktion "${id}"`
    if (!(FACTION_FIELDS as readonly string[]).includes(field))
      return `unbekanntes Feld (${FACTION_FIELDS.join(', ')})`
    if (field === 'minBase' && (!Number.isInteger(value) || value < 0))
      return 'muss eine ganze Zahl ≥ 0 sein'
    return null
  }
  return 'muss mit "units." oder "factions." beginnen'
}

/** Applies the overrides in place and returns a function that restores the previous values */
export function applyCatalog(override: CatalogOverride | undefined): () => void {
  const undo: (() => void)[] = []
  for (const [path, value] of Object.entries(override ?? {})) {
    const error = checkCatalogEntry(path, value)
    if (error) throw new Error(`Katalog ${path}: ${error}`)
    const [kind, id, field] = path.split('.') as [string, string, string]
    if (kind === 'units') {
      const type = UNIT_TYPES.find((t) => t.id === id)!
      const key = field as UnitStat
      const before = type[key]
      ;(type as Record<UnitStat, number | null>)[key] = value
      undo.push(() => ((type as Record<UnitStat, number | null>)[key] = before))
    } else {
      const bonus = FACTIONS.find((f) => f.id === id)!.bonus
      const key = field as FactionField
      const had = key in bonus
      const before = bonus[key]
      ;(bonus as Record<FactionField, number | undefined>)[key] = value
      undo.push(() => {
        if (had) (bonus as Record<FactionField, number | undefined>)[key] = before
        else delete (bonus as unknown as Record<string, unknown>)[key]
      })
    }
  }
  return () => {
    for (const fn of undo.reverse()) fn()
  }
}

export const describeCatalog = (o: CatalogOverride | undefined) =>
  Object.entries(o ?? {})
    .map(([k, v]) => `${k.replace(/^(units|factions)\./, '')}=${String(v).replace('.', ',')}`)
    .join(', ') || 'Basis'
