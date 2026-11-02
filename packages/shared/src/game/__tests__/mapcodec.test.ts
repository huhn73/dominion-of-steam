import { describe, expect, it } from 'vitest'
import { buildIndex, findPath, tilesNear } from '../hex'
import { expandMap, packMap, terrainAt, tileIndex, visibilityAt } from '../mapcodec'
import { UNIT_TYPES } from '../catalog'
import type { Tile, Unit } from '../types'

const tiles: Tile[] = [
  { col: 0, row: 0, terrain: 'deepSea', visibility: 'explored' },
  { col: 1, row: 0, terrain: 'plains', visibility: 'visible' },
  { col: 2, row: 0, terrain: 'forest', visibility: 'unexplored' },
  { col: 0, row: 1, terrain: 'shallows', visibility: 'visible' },
  { col: 1, row: 1, terrain: 'hills', visibility: 'visible' },
  { col: 2, row: 1, terrain: 'mountains', visibility: 'explored' },
]

describe('Kompakte Karte', () => {
  const map = packMap({ width: 3, height: 2, seed: 'S', tiles })

  it('packt Felder in Zeichenketten und entpackt sie wieder', () => {
    expect(map).toEqual({ width: 3, height: 2, seed: 'S', terrain: '~.fshm', visibility: 'evuvve' })
    expect(expandMap(map)).toEqual(tiles)
    expect(tileIndex(map, { col: 2, row: 1 })).toBe(5)
    expect(tileIndex(map, { col: 3, row: 0 })).toBe(-1)
    expect(terrainAt(map, { col: 1, row: 1 })).toBe('hills')
    expect(visibilityAt(map, { col: 2, row: 0 })).toBe('unexplored')
    expect(terrainAt(map, { col: -1, row: 0 })).toBeUndefined()
  })

  it('indiziert die kompakte Karte ohne Feldobjekte', () => {
    const idx = buildIndex(map, [], [], UNIT_TYPES, 'p1')
    expect(idx.terrainAt({ col: 0, row: 1 })).toBe('shallows')
    expect(idx.visibilityAt({ col: 0, row: 0 })).toBe('explored')
    expect(idx.tileAt({ col: 1, row: 0 })).toEqual(tiles[1])
    expect(idx.tileAt({ col: 5, row: 5 })).toBeUndefined()
  })
})

describe('Wegsuche mit Budget', () => {
  // A 12-wide corridor of plains, all explored
  const width = 12
  const height = 3
  const corridor = packMap({
    width,
    height,
    seed: 'S',
    tiles: Array.from({ length: width * height }, (_, i) => ({
      col: i % width,
      row: Math.floor(i / width),
      terrain: 'plains' as const,
      visibility: 'explored' as const,
    })),
  })
  const unit: Unit = {
    id: 'u',
    unitTypeId: 'panzerwagen',
    ownerId: 'p1',
    col: 0,
    row: 1,
    hp: 2,
    movesLeft: 2,
    fuel: null,
    order: { type: 'none' },
    cargoUnitIds: [],
    carriedBy: null,
    needsOrders: true,
  }
  const idx = buildIndex(corridor, [], [unit], UNIT_TYPES, 'p1')

  it('findet denselben Weg mit und ohne Budget, gibt bei erschöpftem Budget auf', () => {
    const free = findPath(unit, { col: 11, row: 1 }, idx)
    expect(free).toHaveLength(11)
    const ample = findPath(unit, { col: 11, row: 1 }, idx, { maxNodes: 1000, used: 0 })
    expect(ample).toEqual(free)
    const tight = { maxNodes: 5, used: 0 }
    expect(findPath(unit, { col: 11, row: 1 }, idx, tight)).toBeNull()
    expect(tight.used).toBe(5)
  })

  it('nutzt das Budget des Index, wenn keins übergeben wird', () => {
    const budgeted = buildIndex(corridor, [], [unit], UNIT_TYPES, 'p1')
    budgeted.pathBudget = { maxNodes: 3, used: 0 }
    expect(findPath(unit, { col: 11, row: 1 }, budgeted)).toBeNull()
    expect(budgeted.pathBudget.used).toBe(3)
  })

  it('listet Felder im Umkreis, nächste zuerst', () => {
    const near = tilesNear(corridor, { col: 5, row: 1 }, 1)
    expect(near[0]).toEqual({ col: 5, row: 1 })
    expect(near).toHaveLength(7)
    expect(tilesNear(corridor, { col: 0, row: 0 }, 1).length).toBeLessThan(7)
  })
})
