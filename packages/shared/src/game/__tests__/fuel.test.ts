import { describe, expect, it } from 'vitest'
import { UNIT_TYPES } from '../catalog'
import { airBases, moveSafety, returnDistance, strandedAircraft, unsafeTiles } from '../fuel'
import { hexKey } from '../hex'
import type { City, Unit } from '../types'

const typeOf = (id: string) => UNIT_TYPES.find((t) => t.id === id)!
const unit = (
  id: string,
  unitTypeId: string,
  col: number,
  row: number,
  extra: Partial<Unit> = {},
): Unit => ({
  id,
  unitTypeId,
  ownerId: 'p1',
  col,
  row,
  hp: typeOf(unitTypeId).hitPoints,
  movesLeft: typeOf(unitTypeId).movement,
  fuel: typeOf(unitTypeId).range,
  order: { type: 'none' },
  cargoUnitIds: [],
  carriedBy: null,
  needsOrders: true,
  ...extra,
})
const city = (id: string, ownerId: string | null, col: number, row: number): City => ({
  id,
  name: id,
  ownerId,
  isCapital: false,
  col,
  row,
  production: null,
  damage: 0,
})

describe('Treibstoffregeln', () => {
  const cities = [city('c1', 'p1', 0, 0), city('c2', 'p2', 9, 0)]
  const carrier = unit('t', 'flugzeugtraeger', 4, 4)

  it('zählt eigene Städte und eigene Träger als Basen, nicht geladene Träger und fremde Städte', () => {
    const carried = unit('t2', 'flugzeugtraeger', 6, 6, { carriedBy: 'x' })
    expect(airBases(cities, [carrier, carried], UNIT_TYPES, 'p1')).toEqual([
      { col: 0, row: 0 },
      { col: 4, row: 4 },
    ])
    expect(returnDistance({ col: 5, row: 4 }, airBases(cities, [carrier], UNIT_TYPES, 'p1'))).toBe(
      1,
    )
    expect(returnDistance({ col: 5, row: 4 }, [])).toBe(Infinity)
  })

  it('markiert Felder ohne Rückweg und lässt Bodeneinheiten in Ruhe', () => {
    const plane = unit('a', 'doppeldecker', 0, 0, { fuel: 4 })
    const reach = new Map(
      [1, 2, 3, 4].map((d) => [hexKey({ col: d, row: 0 }), { coord: { col: d, row: 0 }, dist: d }]),
    )
    const bases = [{ col: 0, row: 0 }]
    // fuel 4: at distance 2 two fuel left for two tiles back; at 3 only one left
    expect([...unsafeTiles(plane, typeOf('doppeldecker'), reach, bases)]).toEqual(['3,0', '4,0'])
    expect(
      unsafeTiles(unit('g', 'grenadiere', 0, 0), typeOf('grenadiere'), reach, bases).size,
    ).toBe(0)
  })

  it('bewertet Züge: zu weit, ohne Rückweg, sicher, Basis immer sicher', () => {
    const plane = unit('a', 'doppeldecker', 0, 0, { fuel: 5 })
    const type = typeOf('doppeldecker')
    const bases = [{ col: 0, row: 0 }]
    expect(moveSafety(plane, type, { col: 6, row: 0 }, 6, bases)).toEqual({
      fuelAfter: -1,
      returnDist: 6,
      safe: false,
    })
    expect(moveSafety(plane, type, { col: 3, row: 0 }, 3, bases)).toEqual({
      fuelAfter: 2,
      returnDist: 3,
      safe: false,
    })
    expect(moveSafety(plane, type, { col: 2, row: 0 }, 2, bases)).toEqual({
      fuelAfter: 3,
      returnDist: 2,
      safe: true,
    })
    expect(moveSafety(plane, type, { col: 0, row: 0 }, 5, bases).safe).toBe(true)
    expect(moveSafety(plane, type, { col: 2, row: 0 }, 2, []).safe).toBe(false)
  })

  it('findet gestrandete Flugzeuge', () => {
    const bases = [{ col: 0, row: 0 }]
    const units = [
      unit('ok', 'doppeldecker', 3, 0, { fuel: 3 }),
      unit('lost', 'doppeldecker', 4, 0, { fuel: 3 }),
      unit('home', 'doppeldecker', 0, 0, { fuel: 0 }),
      unit('cargo', 'doppeldecker', 8, 0, { fuel: 0, carriedBy: 't' }),
      unit('g', 'grenadiere', 8, 0),
    ]
    expect(
      strandedAircraft(units, UNIT_TYPES, bases, 'p1').map((s) => [s.unit.id, s.returnDist]),
    ).toEqual([['lost', 4]])
  })
})
