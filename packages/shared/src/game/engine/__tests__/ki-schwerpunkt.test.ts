import { describe, expect, it } from 'vitest'
import { playAITurn, projectView, type GameState } from '..'
import { hexDistance } from '../../hex'
import { city, makeState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-10-30T12:00:00Z')

describe('KI: Schwerpunkt', () => {
  // Two grenadiers next to an enemy city with one grenadier inside: alone 0.4 each, and two
  // besiegers are not more than twice the defenders, so the single-unit siege holds back
  const siege = () => {
    const s = makeState({
      map: PLAINS,
      units: [
        unit('g0', 'grenadiere', 'p1', 2, 1),
        unit('g1', 'grenadiere', 'p1', 2, 2),
        unit('d', 'grenadiere', 'p2', 3, 2),
      ],
      cities: [city('c', 'p2', 3, 2), city('home', 'p2', 7, 5)],
    })
    s.participants[0]!.aiDifficulty = 'normal'
    return s
  }

  it('greift einen Verteidiger gemeinsam an, den keiner allein angreifen würde', () => {
    const s = siege()
    for (const id of ['g0', 'g1'])
      expect(
        hexDistance(
          s.units.find((u) => u.id === id)!,
          { col: 3, row: 2 },
        ),
      ).toBe(1)
    const after = playAITurn(s, 'p1', NOW)
    expect(after.log.filter((l) => l.action === 'attack').length).toBeGreaterThanOrEqual(1)
  })

  it('ohne Schwerpunkt bleibt es bei der Belagerung mit Übermacht', () => {
    const after = playAITurn(siege(), 'p1', NOW, { profile: { strike: false } })
    expect(after.log.some((l) => l.action === 'attack')).toBe(false)
  })
})

describe('KI: Gedächtnis', () => {
  // A scout plane spots the enemy grenadier; next turn it is gone and the grenadier sits in fog
  const spotted = () => {
    const s = makeState({
      map: PLAINS,
      units: [
        unit('a', 'panzerwagen', 'p1', 0, 0),
        unit('s', 'doppeldecker', 'p1', 6, 3, { fuel: 12, movesLeft: 0 }),
        unit('e', 'grenadiere', 'p2', 7, 4),
      ],
      cities: [city('c', 'p1', 0, 0)],
    })
    s.participants[0]!.aiDifficulty = 'normal'
    return s
  }
  const withoutScout = (s: GameState): GameState => {
    const a = s.units.find((u) => u.id === 'a')!
    return {
      ...s,
      // Back home, the enemy out of sight
      units: s.units
        .filter((u) => u.id !== 's')
        .map((u) =>
          u.id === 'a' ? { ...a, col: 0, row: 0, movesLeft: 2, order: { type: 'none' } } : u,
        ),
    }
  }
  const memoryOf = (s: GameState) => s.participants[0]!.aiMemory ?? []

  it('merkt sich gesehene Feinde und rückt zur letzten bekannten Position vor', () => {
    const seen = playAITurn(spotted(), 'p1', NOW)
    expect(memoryOf(seen).map((m) => m.id)).toContain('e')
    const fog = withoutScout(seen)
    expect(projectView(fog, 'p1').units.some((u) => u.id === 'e')).toBe(false)
    const a = playAITurn(fog, 'p1', NOW).units.find((u) => u.id === 'a')!
    expect(a.col + a.row).toBeGreaterThan(0)
  })

  it('ohne Gedächtnis bleibt die Einheit stehen', () => {
    const seen = playAITurn(spotted(), 'p1', NOW, { profile: { memoryRounds: 0 } })
    expect(memoryOf(seen)).toEqual([])
    const a = playAITurn(withoutScout(seen), 'p1', NOW, {
      profile: { memoryRounds: 0 },
    }).units.find((u) => u.id === 'a')!
    expect(a.col + a.row).toBe(0)
  })

  it('vergisst nach memoryRounds und wenn das Feld sichtbar leer ist', () => {
    const seen = playAITurn(spotted(), 'p1', NOW)
    const later = { ...withoutScout(seen), round: seen.round + 5 }
    expect(memoryOf(playAITurn(later, 'p1', NOW)).some((m) => m.id === 'e')).toBe(false)
    // The enemy left; a unit of ours now sees the tile empty
    const gone = withoutScout(seen)
    gone.units = gone.units
      .filter((u) => u.id !== 'e')
      .concat(
        unit('e2', 'grenadiere', 'p2', 0, 5),
        unit('w', 'grenadiere', 'p1', 7, 3, { movesLeft: 0 }),
      )
    const after = playAITurn(gone, 'p1', NOW, { profile: { strike: false } })
    expect(memoryOf(after).some((m) => m.id === 'e')).toBe(false)
  })

  it('das Gedächtnis erscheint nicht in der Spieleransicht', () => {
    const seen = playAITurn(spotted(), 'p1', NOW)
    expect(memoryOf(seen).length).toBeGreaterThan(0)
    for (const p of projectView(seen, 'p2').participants) expect(p).not.toHaveProperty('aiMemory')
    for (const p of projectView(seen, 'p1').participants) expect(p).not.toHaveProperty('aiMemory')
  })
})
