import { describe, expect, it } from 'vitest'
import {
  applyCommand,
  combatOdds,
  endTurn,
  type GameState,
  normalizeState,
  playAITurn,
  projectView,
} from '..'
import { UNIT_TYPES } from '../../catalog'
import { attackTargets, buildIndex } from '../../hex'
import type { CombatResult } from '../../types'
import { createRng } from '../rng'
import { unitType } from '../state'
import { city, makeState, participantState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-11-01T12:00:00Z')
const run = (state: GameState, playerId: string, cmd: Parameters<typeof applyCommand>[2]) =>
  applyCommand(state, playerId, cmd, NOW)
const unitOf = (state: GameState, id: string) => state.units.find((u) => u.id === id)
/** A distant opponent unit, so p2 is not eliminated */
const outpost = () => unit('far', 'grenadiere', 'p2', 7, 5)
function nextRound(state: GameState) {
  let s = endTurn(state, NOW)
  while (s.participants[s.seat]!.id !== 'p1') s = endTurn(s, NOW)
  return s
}
const attackCmd = (unitId: string, target: { unitId?: string; cityId?: string }) =>
  ({ type: 'attack', unitId, target }) as const

/** Run with increasing rng until the outcome occurs */
function attackUntil(
  build: () => GameState,
  cmd: Parameters<typeof applyCommand>[2],
  outcome: (c: CombatResult) => boolean,
) {
  for (let rng = 0; rng < 60; rng++) {
    const s = build()
    s.rng = rng
    const result = run(s, 'p1', cmd)
    if (outcome(result.combat!)) return result
  }
  throw new Error('Ausgang in 60 Versuchen nicht erreicht')
}

describe('Schlagabtausch: Runden bis zur Vernichtung', () => {
  it('folgt den Würfen des Spielstands, eine Runde je Wurf', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerkreuzer', 'p1', 1, 1), unit('d', 'blitzkorvette', 'p2', 2, 1)],
    })
    // Sea units on plains are fine for the fight itself; the chance is 6 / (6 + 2)
    s.rng = 7
    const chance = 6 / 8
    const expected: string[] = []
    let ah = 12
    let dh = 8
    for (let k = 1; ah > 0 && dh > 0; k++) {
      const roll = createRng(`${s.seed}:${s.rng + k}`)()
      if (roll < chance) {
        dh -= 3
        expected.push('attacker')
      } else {
        ah -= 2
        expected.push('defender')
      }
    }
    const { combat } = run(s, 'p1', attackCmd('a', { unitId: 'd' }))
    expect(combat!.hits).toEqual(expected)
    expect(combat!.hits.length).toBeGreaterThanOrEqual(3)
  })

  it('endet erst, wenn eine Seite keine Trefferpunkte mehr hat', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerkreuzer', 'p1', 1, 1),
          unit('d', 'blitzkorvette', 'p2', 2, 1),
          outpost(),
        ],
      })
    const { state, combat } = attackUntil(
      build,
      attackCmd('a', { unitId: 'd' }),
      (c) => c.defenderDestroyed,
    )
    expect(combat!.hits.length).toBeGreaterThanOrEqual(3)
    expect(combat!.hits.filter((h) => h === 'attacker')).toHaveLength(3)
    const defenderHits = combat!.hits.filter((h) => h === 'defender').length
    expect(combat).toMatchObject({
      attackerDestroyed: false,
      attackerDamage: defenderHits * 2,
      defenderDamage: 8,
    })
    expect(unitOf(state, 'd')).toBeUndefined()
    expect(unitOf(state, 'a')!.hp).toBe(12 - defenderHits * 2)

    // The other way round: a Kanonenboot (3 TP) needs eight hits, the Blitzkorvette two
    const weak = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'kanonenboot', 'p1', 1, 1),
          unit('d', 'blitzkorvette', 'p2', 2, 1),
          outpost(),
        ],
      })
    const lost = attackUntil(weak, attackCmd('a', { unitId: 'd' }), (c) => c.attackerDestroyed)
    expect(lost.combat!.hits.filter((h) => h === 'defender')).toHaveLength(2)
    expect(lost.combat!.attackerDamage).toBe(3)
    expect(unitOf(lost.state, 'a')).toBeUndefined()
    expect(unitOf(lost.state, 'd')!.hp).toBe(8 - lost.combat!.defenderDamage)
  })

  it('vernichtet mit genug Schaden je Treffer in einer Runde', () => {
    // Tauchboot: 3 damage against a 3-hit-point Kanonenboot
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'tauchboot', 'p1', 1, 1),
          unit('d', 'kanonenboot', 'p2', 2, 1),
          outpost(),
        ],
      })
    const { combat } = attackUntil(
      build,
      attackCmd('a', { unitId: 'd' }),
      (c) => c.defenderDestroyed,
    )
    expect(combat!.hits.at(-1)).toBe('attacker')
    expect(combat!.hits.filter((h) => h === 'attacker')).toHaveLength(1)
    expect(combat!.defenderDamage).toBe(3)
  })

  it('lässt Grenadiere beim ersten Treffer fallen', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'grenadiere', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          outpost(),
        ],
      })
    const won = attackUntil(build, attackCmd('a', { unitId: 'd' }), (c) => c.defenderDestroyed)
    expect(won.combat!.hits).toEqual(['attacker'])
    const lost = attackUntil(build, attackCmd('a', { unitId: 'd' }), (c) => c.attackerDestroyed)
    expect(lost.combat!.hits).toEqual(['defender'])
    expect(lost.combat!.message).toContain('gefallen')
  })
})

describe('Schlagabtausch: Angriffskosten', () => {
  it('kostet einen Bewegungspunkt und erlaubt einen zweiten Angriff', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 1, 1),
          unit('d1', 'grenadiere', 'p2', 2, 1),
          unit('d2', 'grenadiere', 'p2', 2, 2),
          outpost(),
        ],
      })
    const first = attackUntil(build, attackCmd('a', { unitId: 'd1' }), (c) => c.defenderDestroyed)
    expect(unitOf(first.state, 'a')).toMatchObject({ movesLeft: 1, needsOrders: true })
    // Advanced onto (2,1); d2 at (2,2) is adjacent
    const second = run(first.state, 'p1', attackCmd('a', { unitId: 'd2' }))
    expect(second.combat!.attackerUnitId).toBe('a')
    const a = unitOf(second.state, 'a')
    if (a) expect(a).toMatchObject({ movesLeft: 0, needsOrders: false })
    expect(second.state.log.filter((l) => l.action === 'attack')).toHaveLength(2)
  })

  it('lässt eine Einheit mit einem Bewegungspunkt nur fahren oder angreifen', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 1, 1), unit('d', 'grenadiere', 'p2', 3, 1), outpost()],
    })
    const moved = run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 2, row: 1 } }).state
    expect(unitOf(moved, 'a')!.movesLeft).toBe(0)
    const view = projectView(moved, 'p1')
    expect(view.combatPreviews).toEqual([])
    expect(() => run(moved, 'p1', attackCmd('a', { unitId: 'd' }))).toThrow()
  })

  it('kostet Flugzeuge Treibstoff, auch ohne Nachrücken', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('p', 'doppeldecker', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          unit('d2', 'grenadiere', 'p2', 2, 1),
          outpost(),
        ],
      })
    const { state, combat } = attackUntil(
      build,
      attackCmd('p', { unitId: 'd' }),
      (c) => c.defenderDestroyed,
    )
    expect(combat!.advanced).toBe(false)
    expect(unitOf(state, 'p')).toMatchObject({ col: 1, row: 1, fuel: 11, movesLeft: 5 })
  })
})

describe('Schlagabtausch: Stadtangriff', () => {
  const siege = (attacker: string, hp?: number) => () =>
    makeState({
      map: PLAINS,
      units: [unit('a', attacker, 'p1', 1, 1, hp ? { hp } : {}), outpost()],
      cities: [city('c', 'p2', 2, 1)],
    })

  it('verbraucht den Angreifer, ob er gewinnt oder verliert', () => {
    const won = attackUntil(siege('grenadiere'), attackCmd('a', { cityId: 'c' }), (c) => c.captured)
    expect(unitOf(won.state, 'a')).toBeUndefined()
    expect(won.state.cities[0]).toMatchObject({ ownerId: 'p1', underFire: false, damage: 1 })
    expect(won.combat).toMatchObject({
      attackerDestroyed: true,
      captured: true,
      garrisonUnitId: null,
      hits: ['attacker'],
    })
    expect(won.combat!.message).toContain('unbesetzt')
    expect(won.state.participants[0]!.citiesCaptured).toBe(1)
    expect(won.state.units.filter((u) => u.ownerId === 'p1')).toHaveLength(0)

    const lost = attackUntil(
      siege('grenadiere'),
      attackCmd('a', { cityId: 'c' }),
      (c) => !c.captured,
    )
    expect(unitOf(lost.state, 'a')).toBeUndefined()
    expect(lost.state.cities[0]).toMatchObject({ ownerId: 'p2', underFire: true })
    expect(lost.combat).toMatchObject({
      attackerDestroyed: true,
      captured: false,
      hits: ['defender'],
    })
  })

  it('hinterlässt Grenadiere, wenn ein unbeschädigter Panzer oder Koloss erobert', () => {
    for (const type of ['panzerwagen', 'dampfkoloss']) {
      const won = attackUntil(siege(type), attackCmd('a', { cityId: 'c' }), (c) => c.captured)
      const garrison = unitOf(won.state, won.combat!.garrisonUnitId!)
      expect(garrison).toMatchObject({
        unitTypeId: 'grenadiere',
        ownerId: 'p1',
        col: 2,
        row: 1,
        hp: 1,
        movesLeft: 0,
        needsOrders: false,
      })
      expect(won.combat!.message).toContain('Grenadiere halten die Stadt')
    }
    const damaged = attackUntil(
      siege('panzerwagen', 1),
      attackCmd('a', { cityId: 'c' }),
      (c) => c.captured,
    )
    expect(damaged.combat!.garrisonUnitId).toBeNull()
    expect(damaged.state.units.filter((u) => u.ownerId === 'p1')).toHaveLength(0)
  })

  it('kämpft Verteidiger in der Stadt vorher als Einheiten', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'dampfkoloss', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          outpost(),
        ],
        cities: [city('c', 'p2', 2, 1)],
      })
    const { state, combat } = attackUntil(
      build,
      attackCmd('a', { unitId: 'd' }),
      (c) => c.defenderDestroyed,
    )
    // No advancing into a foreign city; the city is still p2's and now empty
    expect(combat!.advanced).toBe(false)
    expect(unitOf(state, 'a')).toMatchObject({ col: 1, row: 1 })
    expect(state.cities[0]!.ownerId).toBe('p2')
  })
})

describe('Schlagabtausch: Reparatur und Migration', () => {
  it('repariert einen Trefferpunkt je Runde in eigenen Städten', () => {
    let s = makeState({
      map: PLAINS,
      units: [
        unit('a', 'panzerkreuzer', 'p1', 1, 1, { hp: 9 }),
        unit('b', 'panzerwagen', 'p1', 3, 3, { hp: 1 }),
        outpost(),
      ],
      cities: [city('c', 'p1', 1, 1)],
    })
    s = nextRound(s)
    expect(unitOf(s, 'a')!.hp).toBe(10)
    expect(unitOf(s, 'b')!.hp).toBe(1)
    s = nextRound(s)
    s = nextRound(s)
    s = nextRound(s)
    expect(unitOf(s, 'a')!.hp).toBe(12)
  })

  it('rechnet alte Prozentwerte in Trefferpunkte um', () => {
    const s = makeState({
      map: PLAINS,
      units: [
        unit('a', 'panzerwagen', 'p1', 1, 1),
        unit('b', 'flugzeugtraeger', 'p1', 2, 2),
        unit('c', 'grenadiere', 'p1', 3, 3),
      ],
    })
    const legacy = structuredClone(s)
    const values: Record<string, number> = { a: 50, b: 50, c: 10 }
    for (const u of legacy.units as unknown as Array<Record<string, unknown>>) {
      delete u.hp
      u.health = values[u.id as string]
    }
    const fixed = normalizeState(legacy)
    expect(fixed.units.map((u) => [u.id, u.hp])).toEqual([
      ['a', 1],
      ['b', 4],
      ['c', 1],
    ])
    expect(fixed.units.some((u) => 'health' in u)).toBe(false)
  })
})

describe('Schlagabtausch: Vorschau und KI', () => {
  it('zeigt dieselben Odds mit und ohne Server-Vorschau, Boni nur mit', () => {
    const base = () =>
      makeState({
        map: PLAINS,
        units: [unit('a', 'panzerwagen', 'p1', 1, 1), unit('d', 'grenadiere', 'p2', 2, 1)],
        cities: [city('c', 'p2', 2, 1)],
      })
    const s = base()
    const view = projectView(s, 'p1')
    const idx = buildIndex(view.map, view.cities, view.units, UNIT_TYPES, 'p1')
    const u = view.units.find((x) => x.id === 'a')!
    const [fallback] = attackTargets(u, idx, view.units, view.cities, [])
    const [withPreview] = attackTargets(u, idx, view.units, view.cities, view.combatPreviews)
    expect(fallback!.odds).toEqual(combatOdds(s, 'a', { unitId: 'd' }))
    expect(withPreview!.odds).toEqual(fallback!.odds)
    expect(fallback).toMatchObject({
      attacker: { hp: 2, damage: 1 },
      defender: { hp: 1, damage: 1 },
    })

    const salz = base()
    salz.participants = [participantState('p1', 'eisenbund'), participantState('p2', 'salzkueste')]
    const server = combatOdds(salz, 'a', { unitId: 'd' })
    expect(server.hitChance).toBeLessThan(fallback!.odds.hitChance)
  })

  it('lässt die KI mit einem Panzerwagen zweimal handeln', () => {
    for (let rng = 0; rng < 30; rng++) {
      const s = makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 1, 1),
          unit('d1', 'grenadiere', 'p2', 2, 1),
          unit('d2', 'grenadiere', 'p2', 2, 2),
          outpost(),
        ],
      })
      s.participants[0]!.aiDifficulty = 'hard'
      s.participants[0]!.isAI = true
      s.rng = rng
      const after = playAITurn(s, 'p1', NOW)
      const attacks = after.log.filter((l) => l.action === 'attack')
      if (attacks.length === 2) {
        expect(unitOf(after, 'a')?.movesLeft ?? 0).toBe(0)
        return
      }
    }
    throw new Error('kein doppelter Angriff in 30 Seeds')
  })

  it('opfert beschädigte Panzer nicht für eine leere Stadt', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 1, 1, { hp: 1 }), outpost()],
      cities: [city('c', 'p2', 2, 1)],
    })
    s.participants[0]!.aiDifficulty = 'hard'
    s.participants[0]!.isAI = true
    const after = playAITurn(s, 'p1', NOW)
    expect(after.log.some((l) => l.action === 'capture' || l.action === 'attack')).toBe(false)
    expect(unitOf(after, 'a')).toBeDefined()
    expect(unitType('panzerwagen').hitPoints).toBe(2)
  })
})
