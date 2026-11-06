import { describe, expect, it } from 'vitest'
import { endTurn, playAITurn, type AiProfile, type GameState } from '..'
import { hexDistance } from '../../hex'
import type { Unit } from '../../types'
import { city, makeState, unit } from './fixtures'

const NOW = new Date('2026-10-30T12:00:00Z')
const WIDE = Array.from({ length: 9 }, () => '..............')
const CITY = { col: 11, row: 4 }

/**
 * An enemy city with one grenadier inside, seen by a scout plane next to it; normal needs more
 * than 2 × 1 besiegers. Own grenadiers stand where the scenario puts them.
 */
function scenario(own: Unit[], opts: { defended?: boolean } = {}) {
  const s = makeState({
    map: WIDE,
    units: [
      ...own,
      unit('s', 'doppeldecker', 'p1', 11, 2, { fuel: 12, movesLeft: 0 }),
      ...(opts.defended === false ? [] : [unit('d', 'grenadiere', 'p2', CITY.col, CITY.row)]),
    ],
    cities: [city('c', 'p2', CITY.col, CITY.row), city('home', 'p1', 0, 4)],
  })
  s.participants[0]!.aiDifficulty = 'normal'
  return s
}
const play = (s: GameState, profile: Partial<AiProfile> = {}) =>
  playAITurn(s, 'p1', NOW, { profile: { strike: false, musterDistance: 3, ...profile } })
const of = (s: GameState, id: string) => s.units.find((u) => u.id === id)!
const target = (u: Unit) => (u.order.type === 'goto' ? u.order.target : null)

describe('KI: Sammeln vor dem Angriff', () => {
  const spread = () => [
    unit('a', 'grenadiere', 'p1', 4, 4),
    unit('b', 'grenadiere', 'p1', 1, 1),
    unit('c', 'grenadiere', 'p1', 1, 7),
  ]

  it('marschiert zu einem Sammelfeld im Abstand 3 statt direkt an die Stadt', () => {
    const a = of(play(scenario(spread())), 'a')
    expect(target(a)).not.toBeNull()
    expect(hexDistance(target(a)!, CITY)).toBe(3)
  })

  it('wartet am Sammelfeld ohne Wache und wird nächste Runde neu geplant', () => {
    const own = spread()
    own[0] = unit('a', 'grenadiere', 'p1', 8, 4)
    const after = play(scenario(own))
    const a = of(after, 'a')
    expect(a.col).toBe(8)
    expect(a.skipped).toBe(true)
    expect(a.order.type).not.toBe('sentry')
    let s = endTurn(after, NOW)
    while (s.participants[s.seat]!.id !== 'p1') s = endTurn(s, NOW)
    expect(of(s, 'a').skipped).toBe(false)
  })

  it('rückt an, sobald genug Einheiten versammelt sind', () => {
    const own = [
      unit('a', 'grenadiere', 'p1', 8, 4),
      unit('b', 'grenadiere', 'p1', 8, 3),
      unit('c', 'grenadiere', 'p1', 8, 5),
    ]
    const after = play(scenario(own))
    const near = ['a', 'b', 'c'].map((id) => of(after, id))
    expect(near.some((u) => u.skipped)).toBe(false)
    expect(near.some((u) => hexDistance(target(u) ?? u, CITY) <= 2)).toBe(true)
  })

  it('wartet nicht, wenn die Armee auf der Landmasse zu klein ist', () => {
    const a = of(play(scenario([unit('a', 'grenadiere', 'p1', 4, 4)])), 'a')
    expect(hexDistance(target(a)!, CITY)).toBe(1)
  })

  it('rückt an unverteidigte Städte direkt an', () => {
    const a = of(play(scenario(spread(), { defended: false })), 'a')
    expect(hexDistance(target(a)!, CITY)).toBe(1)
  })

  it('nimmt in einer feindlichen Stadt außer Sicht einen Verteidiger an, in einer neutralen keinen', () => {
    const unseen = (ownerId: string | null) => {
      const s = scenario(spread(), { defended: false })
      s.units = s.units.filter((u) => u.id !== 's')
      s.cities[0]!.ownerId = ownerId
      s.cities[0]!.knownBy = { p1: ownerId }
      return hexDistance(target(of(play(s), 'a'))!, CITY)
    }
    expect(unseen('p2')).toBe(3)
    expect(unseen(null)).toBe(1)
  })

  it('musterDistance 0 schaltet das Sammeln ab', () => {
    const a = of(play(scenario(spread()), { musterDistance: 0 }), 'a')
    expect(hexDistance(target(a)!, CITY)).toBe(1)
  })
})
