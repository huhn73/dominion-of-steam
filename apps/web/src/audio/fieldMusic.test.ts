import type { City, Unit } from '@dos/shared/game'
import { cityThreatened, enemyVisible, INITIAL_FIELD, LAYER_OF, nextField } from './fieldMusic'

const step = (prev = INITIAL_FIELD, round: number, threat = false, combat = false) =>
  nextField(prev, { round, threat, combat })

describe('Spielfeldmusik', () => {
  it('bleibt ohne Feind beim Erkunden', () => {
    expect(step(INITIAL_FIELD, 1).state).toBe('explore')
    expect(step(step(INITIAL_FIELD, 1), 2).state).toBe('explore')
  })

  it('wechselt bei Feind in Sicht auf Anspannung und fällt nach zwei ruhigen Runden zurück', () => {
    const r3 = step(INITIAL_FIELD, 3, true)
    expect(r3.state).toBe('tension')
    expect(step(r3, 4).state).toBe('tension')
    expect(step(r3, 5).state).toBe('tension')
    expect(step(r3, 6).state).toBe('explore')
  })

  it('wechselt beim Kampf sofort und fällt nach einer Runde ohne Kampf auf Anspannung', () => {
    const r3 = step(INITIAL_FIELD, 3, true, true)
    expect(r3.state).toBe('combat')
    // Still the same round after the fight: combat stays
    expect(step(r3, 3, true).state).toBe('combat')
    expect(step(r3, 4, true).state).toBe('combat')
    expect(step(r3, 5, false).state).toBe('tension')
    expect(step(r3, 6, false).state).toBe('explore')
  })

  it('kennt zu jedem Zustand eine Schicht', () => {
    expect(LAYER_OF).toEqual({
      explore: 'field-explore',
      tension: 'field-tension',
      combat: 'field-combat',
    })
  })

  it('erkennt sichtbare Feinde und bedrohte Städte', () => {
    const unit = (id: string, ownerId: string, col: number, row: number): Unit =>
      ({ id, ownerId, col, row, unitTypeId: 'panzerwagen', carriedBy: null }) as unknown as Unit
    const city = (id: string, ownerId: string, col: number, row: number): City =>
      ({ id, ownerId, col, row }) as unknown as City
    expect(enemyVisible([unit('a', 'p1', 0, 0)], 'p1')).toBe(false)
    expect(enemyVisible([unit('a', 'p1', 0, 0), unit('b', 'p2', 9, 9)], 'p1')).toBe(true)
    const cities = [city('c', 'p1', 5, 5)]
    expect(cityThreatened(cities, [unit('b', 'p2', 9, 9)], 'p1')).toBe(false)
    expect(cityThreatened(cities, [unit('b', 'p2', 6, 6)], 'p1')).toBe(true)
    expect(cityThreatened(cities, [unit('b', 'p1', 6, 6)], 'p1')).toBe(false)
  })
})
