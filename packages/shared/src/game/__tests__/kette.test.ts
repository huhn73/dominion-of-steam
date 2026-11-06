import { describe, expect, it } from 'vitest'
import { chainOdds, exchangeOdds, exchangeOutcomes } from '../rules'

describe('Angriffsketten', () => {
  it('exchangeOutcomes stimmt mit exchangeOdds überein und verteilt die Rest-Trefferpunkte', () => {
    for (const [a, d, ahp, admg, dhp, ddmg] of [
      [2, 3, 1, 1, 2, 1],
      [4, 5, 2, 1, 3, 2],
      [5, 2, 1, 2, 3, 1],
    ] as const) {
      const odds = exchangeOdds(a, d, ahp, admg, dhp, ddmg)
      const o = exchangeOutcomes(odds.hitChance, ahp, admg, dhp, ddmg)
      expect(o.killChance).toBeCloseTo(odds.killChance, 10)
      const rest = [...o.survivors.values()].reduce((s, x) => s + x, 0)
      expect(o.killChance + rest).toBeCloseTo(1, 10)
      for (const hp of o.survivors.keys()) expect(hp).toBeGreaterThan(0)
    }
  })

  it('drei Grenadiere zermürben einen Panzerwagen, den keiner allein schafft', () => {
    const g = { hitChance: 0.4, attackerHp: 1, attackerDamage: 1, defenderDamage: 1, cost: 1 }
    // A grenadier alone: two hits in a row, 0.16. Three of them need two hits before three misses
    expect(chainOdds(2, [g]).killChance).toBeCloseTo(0.16, 10)
    const three = chainOdds(2, [g, g, g])
    expect(three.killChance).toBeCloseTo(1 - 0.6 ** 3 - 3 * 0.4 * 0.6 ** 3, 10)
    // Losses: the first always fights, the second only while the panzer stands, …
    expect(three.expectedLoss).toBeGreaterThan(1)
    expect(three.expectedLoss).toBeLessThan(3)
  })
})
