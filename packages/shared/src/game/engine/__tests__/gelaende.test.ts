import { describe, expect, it } from 'vitest'
import { applyCommand, type GameState, projectView } from '..'
import { UNIT_TYPES } from '../../catalog'
import {
  attackTargets,
  buildIndex,
  findPath,
  hexKey,
  marchTurns,
  pathTurns,
  reachableTiles,
} from '../../hex'
import { terrainDefense, terrainDefenseTable } from '../../rules'
import { unitType } from '../state'
import { visibleTiles } from '../visibility'
import { city, makeState, unit } from './fixtures'

const NOW = new Date('2026-11-07T12:00:00Z')
const run = (state: GameState, cmd: Parameters<typeof applyCommand>[2]) =>
  applyCommand(state, 'p1', cmd, NOW).state
const unitOf = (state: GameState, id: string) => state.units.find((u) => u.id === id)!

/** Board index and view unit as p1 knows them */
function board(state: GameState, unitId: string) {
  const view = projectView(state, 'p1', { previews: false })
  const idx = buildIndex(view.map, view.cities, view.units, UNIT_TYPES, 'p1')
  return { view, idx, u: view.units.find((x) => x.id === unitId)! }
}

/** A distant opponent unit, so p2 is not eliminated */
const outpost = () => unit('far', 'grenadiere', 'p2', 7, 5)

describe('Gelände: Fahrzeuge halten in rauem Gelände an', () => {
  // A wall of forest in column 1 between the panzerwagen and the rest of the board
  const WALL = ['.f......', '.f......', '.f......', '........', '........', '........']

  it('Reichweite endet am Wald, das Waldfeld kostet alle Bewegung', () => {
    const s = makeState({ map: WALL, units: [unit('pw', 'panzerwagen', 'p1', 0, 1), outpost()] })
    const { idx, u } = board(s, 'pw')
    const reach = reachableTiles(u, idx)
    expect(reach.get(hexKey({ col: 1, row: 1 }))).toMatchObject({ dist: 1, cost: 2 })
    expect(reach.has(hexKey({ col: 2, row: 1 }))).toBe(false)
  })

  it('wer in den Wald fährt, hat danach keine Bewegung mehr', () => {
    let s = makeState({ map: WALL, units: [unit('pw', 'panzerwagen', 'p1', 0, 1), outpost()] })
    s = run(s, { type: 'move', unitId: 'pw', target: { col: 1, row: 1 } })
    expect(unitOf(s, 'pw').movesLeft).toBe(0)
  })

  it('Grenadiere und Städte sind nicht betroffen', () => {
    let s = makeState({
      map: ['.f......', '.f......', '........', '........'],
      units: [
        unit('pw', 'panzerwagen', 'p1', 0, 1),
        unit('g', 'grenadiere', 'p1', 0, 0),
        outpost(),
      ],
      cities: [city('c', 'p1', 1, 1)],
    })
    s = run(s, { type: 'move', unitId: 'pw', target: { col: 1, row: 1 } })
    expect(unitOf(s, 'pw').movesLeft).toBe(1) // Stadt im Wald: Straßen
    s = run(s, { type: 'move', unitId: 'g', target: { col: 1, row: 0 } })
    expect(unitOf(s, 'g').movesLeft).toBe(0) // hat ohnehin nur eine Bewegung
  })

  it('kein Angriff über den Wald hinweg, wohl aber aus der Ebene', () => {
    const wall = makeState({
      map: WALL,
      units: [unit('pw', 'panzerwagen', 'p1', 0, 1), unit('d', 'grenadiere', 'p2', 2, 1)],
      cities: [city('c', 'p1', 3, 2)], // so p1 sees the defender
    })
    const w = board(wall, 'pw')
    expect(attackTargets(w.u, w.idx, w.view.units, w.view.cities, [])).toEqual([])
    const open = makeState({
      map: ['........', '........', '........'],
      units: [unit('pw', 'panzerwagen', 'p1', 0, 1), unit('d', 'grenadiere', 'p2', 2, 1)],
      cities: [city('c', 'p1', 3, 2)], // so p1 sees the defender
    })
    const o = board(open, 'pw')
    expect(attackTargets(o.u, o.idx, o.view.units, o.view.cities, []).map((t) => t.unitId)).toEqual(
      ['d'],
    )
  })

  it('Wege führen um das Gebirge herum, wenn das schneller ist', () => {
    const s = makeState({
      map: ['......', '......', '.mmm..', '......'],
      units: [unit('pw', 'panzerwagen', 'p1', 0, 2), outpost()],
    })
    const { idx, u } = board(s, 'pw')
    const path = findPath(u, { col: 4, row: 2 }, idx)!
    expect(path.some((c) => idx.terrainAt(c) === 'mountains')).toBe(false)
    // Grenadiere nehmen weiter den kürzesten Weg
    const g = makeState({
      map: ['......', '......', '.mmm..', '......'],
      units: [unit('g', 'grenadiere', 'p1', 0, 2), outpost()],
    })
    const gb = board(g, 'g')
    expect(findPath(gb.u, { col: 4, row: 2 }, gb.idx)).toHaveLength(4)
  })

  it('Marschdauer zählt raues Gelände als Rundenende', () => {
    const s = makeState({
      map: ['.f....', '......'],
      units: [unit('pw', 'panzerwagen', 'p1', 0, 0), outpost()],
    })
    const { idx, u } = board(s, 'pw')
    const type = unitType('panzerwagen')
    const path = [1, 2, 3, 4].map((col) => ({ col, row: 0 }))
    expect(pathTurns(u, type, path, idx)).toEqual([1, 2, 2, 3])
    expect(marchTurns(type, path, idx)).toBe(3)
    expect(marchTurns(type, path.slice(1), idx)).toBe(2)
  })
})

describe('Gelände: Abwehr je Einheit', () => {
  it('Grenadiere graben sich überall ein, Fahrzeuge nur auf Hügeln', () => {
    expect(terrainDefense(unitType('grenadiere'), 'forest')).toBe(1)
    expect(terrainDefense(unitType('grenadiere'), 'mountains')).toBe(2)
    for (const id of ['panzerwagen', 'dampfkoloss']) {
      expect(terrainDefense(unitType(id), 'forest')).toBe(0)
      expect(terrainDefense(unitType(id), 'hills')).toBe(1)
      expect(terrainDefense(unitType(id), 'mountains')).toBe(0)
    }
    expect(terrainDefenseTable(unitType('panzerwagen'))).toEqual([{ terrain: 'hills', value: 1 }])
    expect(terrainDefenseTable(unitType('kanonenboot'))).toEqual([])
  })
})

describe('Gelände: Sicht von Höhen', () => {
  const view = (terrain: string) =>
    makeState({
      map: [`.${terrain}......`, '........', '........', '........'],
      units: [unit('g', 'grenadiere', 'p1', 1, 0), outpost()],
    })

  it('Landeinheiten sehen von Hügeln und Gebirge zwei Felder weit', () => {
    const two = hexKey({ col: 3, row: 0 })
    expect(visibleTiles(view('.'), 'p1').has(two)).toBe(false)
    expect(visibleTiles(view('f'), 'p1').has(two)).toBe(false)
    expect(visibleTiles(view('h'), 'p1').has(two)).toBe(true)
    expect(visibleTiles(view('m'), 'p1').has(two)).toBe(true)
  })
})

describe('Gelände: Tauchboote im Flachwasser', () => {
  const scene = (water: string) =>
    makeState({
      map: ['.~~~~~~~', `.~~~${water}~~~`, '.~~~~~~~', '.~~~~~~~'],
      cities: [city('a', 'p1', 0, 0), city('b', 'p2', 0, 3)],
      units: [unit('k', 'kanonenboot', 'p1', 3, 1), unit('sub', 'tauchboot', 'p2', 4, 1)],
    })
  const sees = (s: GameState) => projectView(s, 'p1').units.some((u) => u.id === 'sub')

  it('sind im Flachwasser sichtbar, in tiefer See getarnt', () => {
    expect(sees(scene('s'))).toBe(true)
    expect(sees(scene('~'))).toBe(false)
  })
})
