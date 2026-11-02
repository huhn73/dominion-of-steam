import { buildIndex } from './hex'
import { UNIT_TYPES } from '@dos/shared/game'
import type { City, GameMap, Unit } from '../types'
import {
  combatTimeline,
  nextPendingUnit,
  nextTapSelection,
  ownUnitsAt,
  productionOverview,
} from './selection'

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  unitTypeId: 'grenadiere',
  ownerId: 'p1',
  col: 1,
  row: 1,
  hp: 1,
  movesLeft: 1,
  fuel: null,
  order: { type: 'none' },
  cargoUnitIds: [],
  carriedBy: null,
  needsOrders: true,
  ...extra,
})
const city: City = {
  id: 'c1',
  name: 'Eisenhafen',
  col: 1,
  row: 1,
  ownerId: 'p1',
  isCapital: true,
  production: null,
  damage: 0,
}

describe('Tipp-Zyklus', () => {
  const a = unit('a', { needsOrders: false })
  const b = unit('b')

  it('geht Einheit → Einheit → Stadt → nichts', () => {
    const base = { ownUnits: [a, b], city, selectedCityId: null }
    expect(nextTapSelection({ ...base, selectedUnitId: null })).toEqual({ unitId: 'b' }) // braucht Befehle
    expect(nextTapSelection({ ...base, selectedUnitId: 'a' })).toEqual({ unitId: 'b' })
    expect(nextTapSelection({ ...base, selectedUnitId: 'b' })).toEqual({ cityId: 'c1' })
    expect(nextTapSelection({ ...base, selectedUnitId: null, selectedCityId: 'c1' })).toBeNull()
  })

  it('wechselt ohne Stadt zwischen den Einheiten und hebt am Ende auf', () => {
    const base = { ownUnits: [a, b], city: null, selectedCityId: null }
    expect(nextTapSelection({ ...base, selectedUnitId: 'b' })).toBeNull()
    expect(nextTapSelection({ ...base, selectedUnitId: 'x' })).toEqual({ unitId: 'b' })
  })

  it('öffnet eine Stadt ohne Einheiten direkt', () => {
    expect(
      nextTapSelection({ ownUnits: [], city, selectedUnitId: null, selectedCityId: null }),
    ).toEqual({ cityId: 'c1' })
    expect(
      nextTapSelection({ ownUnits: [], city: null, selectedUnitId: null, selectedCityId: null }),
    ).toBeNull()
  })

  it('zählt Ladung nicht zum Stapel', () => {
    const map: GameMap = { width: 3, height: 3, seed: 's', terrain: '.'.repeat(9), visibility: 'v'.repeat(9) }
    const carrier = unit('t', { unitTypeId: 'frachter', cargoUnitIds: ['c'] })
    const cargo = unit('c', { carriedBy: 't' })
    const enemy = unit('e', { ownerId: 'p2' })
    const idx = buildIndex(map, [], [carrier, cargo, enemy], UNIT_TYPES, 'p1')
    expect(ownUnitsAt(idx, { col: 1, row: 1 }, 'p1').map((u) => u.id)).toEqual(['t'])
  })
})

describe('Nächste Einheit', () => {
  const units = [
    unit('u1'),
    unit('u2', { needsOrders: false }),
    unit('u3'),
    unit('e1', { ownerId: 'p2' }),
    unit('u4'),
    unit('u5', { carriedBy: 'u4' }),
  ]

  it('springt hinter der Cursorposition weiter und am Ende von vorn', () => {
    expect(nextPendingUnit(units, 'p1', -1)?.id).toBe('u1')
    expect(nextPendingUnit(units, 'p1', 0)?.id).toBe('u3')
    expect(nextPendingUnit(units, 'p1', 2)?.id).toBe('u4')
    expect(nextPendingUnit(units, 'p1', 4)?.id).toBe('u1')
  })

  it('bleibt hinter der Position, wenn die bediente Einheit keine Befehle mehr braucht', () => {
    const after = units.map((u) => (u.id === 'u1' ? { ...u, needsOrders: false } : u))
    expect(nextPendingUnit(after, 'p1', 0)?.id).toBe('u3')
  })

  it('findet nichts, wenn keine Einheit offen ist', () => {
    expect(nextPendingUnit(units.map((u) => ({ ...u, needsOrders: false })), 'p1', 1)).toBeUndefined()
  })
})

describe('Produktionsübersicht', () => {
  it('zählt Bestand inklusive Ladung und listet Bauaufträge mit „hier“ zuerst', () => {
    const units = [
      unit('a'),
      unit('b', { carriedBy: 't' }),
      unit('t', { unitTypeId: 'frachter' }),
      unit('e', { ownerId: 'p2' }),
    ]
    const cities: City[] = [
      { ...city, id: 'c2', name: 'Kesselstadt', production: { unitTypeId: 'grenadiere', progress: 0, turnsRemaining: 3 } },
      { ...city, id: 'c1', production: { unitTypeId: 'grenadiere', progress: 1, turnsRemaining: 2 } },
      { ...city, id: 'c3', name: 'Rußbrück', ownerId: 'p2', production: { unitTypeId: 'panzerwagen', progress: 0, turnsRemaining: 7 } },
    ]
    const o = productionOverview(units, cities, 'p1', 'c1')
    expect(o.byType.get('grenadiere')).toEqual({ owned: 2, building: ['hier', 'Kesselstadt'] })
    expect(o.byType.get('frachter')).toEqual({ owned: 1, building: [] })
    expect(o.byType.has('panzerwagen')).toBe(false)
    expect(o).toMatchObject({ owned: 3, building: 2 })
  })
})

describe('Kampfsequenz', () => {
  it('teilt die Dauer in Phasen und entfällt bei 0 ms', () => {
    expect(combatTimeline(0)).toBeNull()
    expect(combatTimeline(1000)).toEqual({ muzzle: 200, blast: 400, resolve: 700, end: 1000 })
  })
})
