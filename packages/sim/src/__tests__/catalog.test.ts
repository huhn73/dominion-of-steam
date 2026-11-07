import { describe, expect, it } from 'vitest'
import { FACTIONS, UNIT_TYPES } from '@dos/shared/game/catalog'
import { unitType } from '@dos/shared/engine'
import { applyCatalog, checkCatalogEntry } from '../catalogOverride'
import { parseConfig } from '../config'
import { expandJobs } from '../jobs'
import { rankCatalogSweep, type MatchupSummary } from '../aggregate'
import { catalogSweepMatchups } from '../sweep'

const panzer = () => UNIT_TYPES.find((t) => t.id === 'panzerwagen')!
const bonusOf = (id: string) => FACTIONS.find((f) => f.id === id)!.bonus

const base = {
  name: 'katalog',
  matchups: [
    {
      id: 'duell',
      participants: [
        { label: 'eisenbund', factionId: 'eisenbund', difficulty: 'normal' },
        { label: 'nordmark', factionId: 'nordmark', difficulty: 'normal' },
      ],
    },
  ],
  maps: [{ size: 'small' }],
  seeds: 1,
  rotateSeats: false,
}

describe('applyCatalog', () => {
  it('patches unit and faction values in place and restores them', () => {
    const before = panzer().productionTurns
    const restore = applyCatalog({
      'units.panzerwagen.productionTurns': 9,
      'factions.nordmark.modifier': 2,
      'factions.aurelia.minBase': 4,
    })
    expect(panzer().productionTurns).toBe(9)
    // the engine sees the same object
    expect(unitType('panzerwagen').productionTurns).toBe(9)
    expect(bonusOf('nordmark').modifier).toBe(2)
    expect(bonusOf('aurelia').minBase).toBe(4)
    restore()
    expect(panzer().productionTurns).toBe(before)
    expect(bonusOf('nordmark').modifier).toBe(1.5)
    expect('minBase' in bonusOf('aurelia')).toBe(false)
  })

  it('rejects unknown paths and bad values', () => {
    expect(checkCatalogEntry('units.panzerwagen.productionTurns', 6)).toBeNull()
    expect(checkCatalogEntry('units.nix.strength', 1)).toMatch(/unbekannte Einheit/)
    expect(checkCatalogEntry('units.panzerwagen.farbe', 1)).toMatch(/unbekannter Wert/)
    expect(checkCatalogEntry('units.panzerwagen.productionTurns', 0)).toMatch(/≥ 1/)
    expect(checkCatalogEntry('units.panzerwagen.strength', 1.5)).toMatch(/ganze Zahl/)
    expect(checkCatalogEntry('factions.nordmark.modifier', 1.75)).toBeNull()
    expect(checkCatalogEntry('factions.nordmark.label', 1)).toMatch(/unbekanntes Feld/)
    expect(checkCatalogEntry('panzerwagen', 1)).toMatch(/Schlüssel/)
    expect(() => applyCatalog({ 'units.nix.strength': 1 })).toThrow()
  })
})

describe('catalog in config and jobs', () => {
  it('merges the config catalog with the matchup catalog into the job', () => {
    const c = parseConfig({
      ...base,
      catalog: { 'units.panzerwagen.productionTurns': 8, 'factions.nordmark.modifier': 2 },
      matchups: [{ ...base.matchups[0], catalog: { 'factions.nordmark.modifier': 1.75 } }],
    })
    expect(expandJobs(c)[0]!.catalog).toEqual({
      'units.panzerwagen.productionTurns': 8,
      'factions.nordmark.modifier': 1.75,
    })
    expect(() => parseConfig({ ...base, catalog: { 'units.panzerwagen.speed': 2 } })).toThrow(
      /unbekannter Wert/,
    )
  })

  it('expands a catalog sweep into every point × matchup, baseline first', () => {
    const c = parseConfig({
      ...base,
      sweep: {
        catalogGrid: {
          'units.panzerwagen.productionTurns': [7, 8],
          'factions.nordmark.modifier': [2],
        },
      },
    })
    expect(c.sweep?.kind).toBe('catalog')
    const ms = catalogSweepMatchups(c.sweep as never, c.matchups)
    expect(ms.map((m) => m.id)).toEqual(['sweep-0-duell', 'sweep-1-duell', 'sweep-2-duell'])
    expect(ms[0]!.catalogParams).toEqual({})
    expect(ms[2]!.catalog).toEqual({
      'units.panzerwagen.productionTurns': 8,
      'factions.nordmark.modifier': 2,
    })
    expect(() =>
      parseConfig({ ...base, sweep: { catalogGrid: { 'units.panzerwagen.productionTurns': [] } } }),
    ).toThrow(/nicht leere Liste/)
  })

  it('ranks points by the largest distance from an even share', () => {
    const c = parseConfig({
      ...base,
      sweep: { catalogGrid: { 'factions.nordmark.modifier': [2] } },
    })
    const config = { ...c, matchups: catalogSweepMatchups(c.sweep as never, c.matchups) }
    const summary = (id: string, wins: Record<string, number>, games: number) =>
      ({
        matchupId: id,
        byMap: [{ mapId: 'small', games, decided: 1, meanRounds: 1, victoryTypes: {}, wins }],
        labels: [{ label: 'eisenbund' }, { label: 'nordmark' }],
      }) as unknown as MatchupSummary
    const rows = rankCatalogSweep(config, [
      summary('sweep-0-duell', { eisenbund: 7, nordmark: 3 }, 10),
      summary('sweep-1-duell', { eisenbund: 5, nordmark: 5 }, 10),
    ])
    expect(rows.map((r) => r.point)).toEqual(['sweep-1', 'sweep-0'])
    expect(rows[0]!.maxDeviation).toBeCloseTo(0)
    expect(rows[1]!.maxDeviation).toBeCloseTo(0.2)
    expect(rows[1]!.baseline).toBe(true)
    expect(rows[0]!.cells[0]).toMatchObject({ matchupId: 'duell', mapId: 'small', games: 10 })
  })
})
