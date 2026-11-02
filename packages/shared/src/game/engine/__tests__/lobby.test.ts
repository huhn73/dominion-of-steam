import { bitsFromKeys } from '../../bits'
import { describe, expect, it } from 'vitest'
import { endTurn, miniMap, playAITurn, surrender } from '..'
import { city, makeState, participantState, unit } from './fixtures'

const NOW = new Date('2026-10-30T12:00:00Z')

describe('Aufgeben', () => {
  const humans = () =>
    makeState({
      map: ['........', '........', '........', '........'],
      participants: [
        participantState('p1', 'eisenbund'),
        participantState('lena', 'nordmark', { isAI: false, aiDifficulty: null, name: 'Lena' }),
        participantState('p3', 'aurelia'),
      ],
      cities: [city('c1', 'p1', 0, 0), city('c2', 'lena', 7, 0), city('c3', 'p3', 7, 3)],
      units: [unit('u1', 'grenadiere', 'p1', 1, 1), unit('u2', 'grenadiere', 'lena', 6, 1)],
    })

  it('setzt eine KI (Normal) ein, behält die ID und merkt sich Name, Runde und Platz', () => {
    const s = surrender(humans(), 'lena', NOW)
    const lena = s.participants[1]!
    expect(lena).toMatchObject({
      id: 'lena',
      name: 'KI für Lena',
      isAI: true,
      aiDifficulty: 'normal',
      status: 'active',
    })
    expect(lena.surrender).toEqual({
      name: 'Lena',
      at: NOW.toISOString(),
      round: 1,
      placement: 3,
      citiesCaptured: 0,
      unitsBuilt: 0,
    })
    expect(s.status).toBe('running')
    // Die KI kann den Zug der Fraktion spielen
    s.seat = 1
    expect(() => playAITurn(s, 'lena', NOW)).not.toThrow()
    expect(() => endTurn(s, NOW)).not.toThrow()
  })

  it('beendet die Partie, wenn kein Mensch mehr übrig ist', () => {
    const s = surrender(surrender(humans(), 'lena', NOW), 'p1', NOW)
    expect(s.status).toBe('finished')
    expect(s.winnerId).not.toBeNull()
    expect(s.participants[0]!.surrender?.placement).toBe(3)
  })

  it('lehnt KI und bereits Aufgegebene ab', () => {
    expect(() => surrender(humans(), 'p3', NOW)).toThrow()
    expect(() => surrender(surrender(humans(), 'lena', NOW), 'lena', NOW)).toThrow()
  })
})

describe('Mini-Lagekarte', () => {
  const state = () =>
    makeState({
      map: ['~~~~~~~~', '~......~', '~......~', '~~~~~~~~'],
      participants: [participantState('p1', 'eisenbund'), participantState('p2', 'aurelia')],
      cities: [city('c1', 'p1', 1, 1), city('c2', 'p2', 6, 2)],
      // p2 kennt die linke Hälfte nicht
      unexplored: [],
    })

  it('hat eine feste Auflösung und zeigt Wasser, Land und Gebiete', () => {
    const rows = miniMap(state(), 'p1', (id) => ['p1', 'p2'].indexOf(id), 16, 8)
    expect(rows).toHaveLength(8)
    expect(rows.every((r) => r.length === 16)).toBe(true)
    expect(rows[0]).toBe('~'.repeat(16))
    const all = rows.join('')
    expect(all).toContain('0')
    expect(all).toContain('1')
  })

  it('zeigt nur erkundete Gebiete (Kriegsnebel)', () => {
    const s = state()
    // p1 hat nur die Felder um die eigene Stadt erkundet
    s.participants[0]!.explored = bitsFromKeys(['1,1', '2,1', '1,2', '2,2'], s.map)
    const rows = miniMap(s, 'p1', (id) => ['p1', 'p2'].indexOf(id), 8, 4)
    expect(rows.join('')).not.toContain('1')
    expect(rows[1]).toBe('~00~~~~~')
  })

  it('ist leer für Fremde', () => {
    expect(miniMap(state(), 'fremd', () => 0, 8, 4)).toEqual([])
  })
})
