import { describe, expect, it } from 'vitest'
import { UNIT_TYPES } from '../catalog'
import { cityAttackOdds, exchangeOdds } from '../rules'

describe('Kampf-Odds', () => {
  it('ist bei gleicher Stärke und einem Trefferpunkt je Seite ein Münzwurf', () => {
    expect(exchangeOdds(2, 2, 1, 1, 1, 1)).toEqual({
      hitChance: 0.5,
      killChance: 0.5,
      deathChance: 0.5,
      expectedDamageTaken: 0.5,
    })
  })

  it('rechnet Panzerwagen gegen Grenadiere exakt', () => {
    // p = 2/3; the tank needs one hit, the grenadiers two
    const odds = exchangeOdds(4, 2, 2, 1, 1, 1)
    expect(odds.hitChance).toBeCloseTo(2 / 3)
    expect(odds.killChance).toBeCloseTo(8 / 9)
    expect(odds.deathChance).toBeCloseTo(1 / 9)
    expect(odds.expectedDamageTaken).toBeCloseTo(4 / 9)
  })

  it('kämpft lange Gefechte bis zum Ende durch', () => {
    // Panzerkreuzer (12 TP, 3) gegen Blitzkorvette (8 TP, 2) bei p = 0.5: 3 bzw. 6 Treffer nötig
    const odds = exchangeOdds(1, 1, 12, 3, 8, 2)
    let expected = 0
    for (let j = 0; j < 6; j++) {
      const binom = [1, 3, 6, 10, 15, 21][j]!
      expected += binom / 2 ** (3 + j)
    }
    expect(odds.killChance).toBeCloseTo(expected)
    expect(odds.killChance + odds.deathChance).toBeCloseTo(1)
    expect(odds.expectedDamageTaken).toBeGreaterThan(0)
    expect(odds.expectedDamageTaken).toBeLessThan(12)
  })

  it('steigt mit der Trefferchance', () => {
    const weak = exchangeOdds(1, 3, 3, 1, 3, 1)
    const strong = exchangeOdds(3, 1, 3, 1, 3, 1)
    expect(strong.killChance).toBeGreaterThan(weak.killChance)
    expect(strong.expectedDamageTaken).toBeLessThan(weak.expectedDamageTaken)
  })

  it('verbraucht den Angreifer bei einem Stadtangriff immer', () => {
    expect(cityAttackOdds(0.8, 2)).toEqual({
      hitChance: 0.8,
      killChance: 0.8,
      deathChance: 1,
      expectedDamageTaken: 2,
    })
  })

  it('hat für jeden Einheitentyp Trefferpunkte und Schaden', () => {
    for (const t of UNIT_TYPES) {
      expect(t.hitPoints, t.id).toBeGreaterThanOrEqual(1)
      expect(t.damage, t.id).toBeGreaterThanOrEqual(1)
    }
    const of = (id: string) => UNIT_TYPES.find((t) => t.id === id)!
    expect([of('grenadiere').hitPoints, of('grenadiere').damage]).toEqual([1, 1])
    expect([of('panzerkreuzer').hitPoints, of('panzerkreuzer').damage]).toEqual([12, 3])
    expect([of('tauchboot').hitPoints, of('tauchboot').damage]).toEqual([2, 3])
  })
})
