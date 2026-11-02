import { describe, expect, it } from 'vitest'
import { endTurn } from '../turn'
import { capitulate, shouldCapitulate } from '../surrender'
import { projectView } from '../view'
import type { GameRules } from '../../types'
import { city, makeState, participantState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-11-02T12:00:00Z')

/**
 * p1 (human) holds `held` of ten cities, p2 (AI) the rest; p3 (AI) has a single city when
 * `third` is set. Capitals: c0 for p1, c9 for p2, c10 for p3.
 */
function tenCities(
  held: number,
  victoryCondition: GameRules['victoryCondition'] = 'dominance',
  third = false,
) {
  const cities = Array.from({ length: 10 }, (_, i) =>
    city(`c${i}`, i < held ? 'p1' : 'p2', i % 8, Math.floor(i / 8) * 2, {
      isCapital: i === 0 || i === 9,
    }),
  )
  const participants = [
    participantState('p1', 'eisenbund', { capitalCityId: 'c0' }),
    participantState('p2', 'aurelia', { capitalCityId: 'c9' }),
  ]
  if (third) {
    cities.push(city('c10', 'p3', 7, 5, { isCapital: true }))
    participants.push(participantState('p3', 'nordmark', { capitalCityId: 'c10' }))
  }
  return makeState({
    map: PLAINS,
    participants,
    cities,
    units: [unit('a', 'grenadiere', 'p1', 0, 4), unit('b', 'grenadiere', 'p2', 7, 4)],
    rules: { victoryCondition },
  })
}

/** End turns until it is `id`'s turn again (the AI seats just pass) */
function passRound(s: ReturnType<typeof tenCities>) {
  let state = endTurn(s, NOW)
  while (state.status === 'running' && state.seat !== 0) state = endTurn(state, NOW)
  return state
}

const messages = (s: ReturnType<typeof tenCities>, id: string) =>
  s.events.filter((e) => e.participantId === id).map((e) => e.message)

describe('Vorherrschaft', () => {
  it('zählt eigene Runden mit 60 % der Städte und gewinnt nach der fünften', () => {
    let s = tenCities(6)
    for (let turn = 1; turn <= 4; turn++) {
      s = passRound(s)
      expect(s.status).toBe('running')
      expect(s.dominance).toEqual({ participantId: 'p1', turns: turn })
    }
    expect(projectView(s, 'p2').dominance).toEqual({
      participantId: 'p1',
      share: 0.6,
      turnsLeft: 1,
    })
    expect(messages(s, 'p2')).toContain('Björn hält 60 % der Städte: Vorherrschaft in 1 Runde.')
    expect(messages(s, 'p1')).toContain(
      'Du hältst 60 % der Städte: Sieg durch Vorherrschaft in 4 Runden.',
    )
    s = endTurn(s, NOW)
    expect(s.status).toBe('finished')
    expect(s.winnerId).toBe('p1')
    expect(projectView(s, 'p2').result?.reason).toBe('dominance')
    expect(projectView(s, 'p2').dominance).toBeNull()
  })

  it('bricht ab, sobald der Anteil fällt, und beginnt danach von vorn', () => {
    let s = passRound(passRound(tenCities(6)))
    expect(s.dominance?.turns).toBe(2)
    // p2 takes a city during its turn: the count is gone at the end of that turn
    s = endTurn(s, NOW)
    s.cities.find((c) => c.id === 'c5')!.ownerId = 'p2'
    s = endTurn(s, NOW)
    expect(s.dominance).toBeNull()
    expect(messages(s, 'p2')).toContain(
      'Die Vorherrschaft von Björn ist gebrochen (50 % der Städte).',
    )
    s.cities.find((c) => c.id === 'c5')!.ownerId = 'p1'
    s = passRound(s)
    expect(s.dominance).toEqual({ participantId: 'p1', turns: 1 })
  })

  it('verlangt auf Inselwelten nur die Hälfte der Städte', () => {
    const continent = passRound(tenCities(5))
    expect(continent.dominance).toBeNull()
    const islands = tenCities(5)
    islands.map.worldShape = 'islands'
    expect(passRound(islands).dominance).toEqual({ participantId: 'p1', turns: 1 })
    const archipelago = tenCities(5)
    archipelago.map.worldShape = 'archipelago'
    expect(projectView(passRound(archipelago), 'p2').dominance?.share).toBe(0.5)
  })

  it('bei Gleichstand behält der Erste die Vorherrschaft, bis sie bricht', () => {
    const s = tenCities(5)
    s.map.worldShape = 'islands'
    // p2 holds 50 % as well, but p1 reached it first
    const after = passRound(passRound(s))
    expect(after.dominance).toEqual({ participantId: 'p1', turns: 2 })
  })

  it('gilt nur mit der Siegbedingung „Vorherrschaft“', () => {
    let s = tenCities(8, 'capitals')
    for (let i = 0; i < 6; i++) s = passRound(s)
    expect(s.status).toBe('running')
    expect(s.dominance).toBeNull()
    expect(projectView(s, 'p1').dominance).toBeNull()
  })

  it('verrät die Städte des Führenden nicht: das Ereignis liegt auf einer eigenen Stadt', () => {
    const s = passRound(tenCities(6))
    const event = s.events.find((e) => e.participantId === 'p2' && e.type === 'dominance')!
    expect(s.cities.find((c) => c.col === event.col && c.row === event.row)?.ownerId).toBe('p2')
  })
})

describe('Kapitulation der KI', () => {
  /** p1 holds nine cities including p2's capital, p2 one city, from round 25 */
  function lost(third = false) {
    const s = tenCities(9, 'elimination', third)
    s.cities.find((c) => c.id === 'c9')!.ownerId = 'p1'
    s.cities.find((c) => c.id === 'c8')!.ownerId = 'p2'
    s.round = 25
    return s
  }

  it('erst wenn alle Schwellen erreicht sind', () => {
    const s = lost()
    expect(shouldCapitulate(s, s.participants[1]!)).toBe(true)
    s.round = 19
    expect(shouldCapitulate(s, s.participants[1]!)).toBe(false)
    s.round = 25
    // Capital back: no capitulation
    s.cities.find((c) => c.id === 'c9')!.ownerId = 'p2'
    expect(shouldCapitulate(s, s.participants[1]!)).toBe(false)
    s.cities.find((c) => c.id === 'c9')!.ownerId = 'p1'
    // Leader too small
    for (const c of s.cities.slice(1, 7)) c.ownerId = null
    expect(shouldCapitulate(s, s.participants[1]!)).toBe(false)
  })

  it('Menschen kapitulieren nie von selbst', () => {
    const s = lost()
    const p2 = s.participants[1]!
    p2.isAI = false
    expect(shouldCapitulate(s, p2)).toBe(false)
  })

  it('macht die Städte neutral, entfernt Einheiten samt Ladung und meldet es allen', () => {
    const s = lost(true)
    s.units.push(
      unit('t', 'frachter', 'p2', 6, 4, { cargoUnitIds: ['g'] }),
      unit('g', 'grenadiere', 'p2', 6, 4, { carriedBy: 't' }),
    )
    capitulate(s, 'p2')
    expect(s.units.filter((u) => u.ownerId === 'p2')).toEqual([])
    expect(s.cities.find((c) => c.id === 'c8')).toMatchObject({
      ownerId: null,
      production: null,
      damage: 0,
    })
    expect(s.participants[1]).toMatchObject({ status: 'eliminated', capitulatedRound: 25 })
    for (const id of ['p1', 'p3'])
      expect(messages(s, id)).toContain(
        'Gegner p2 kapituliert. Die Städte von Gegner p2 sind jetzt neutral.',
      )
    expect(projectView(s, 'p1').participants.find((p) => p.id === 'p2')?.capitulated).toBe(true)
  })

  it('kapituliert zu Beginn ihres Zuges; bleibt nur einer übrig, gewinnt er', () => {
    let s = lost()
    s = endTurn(s, NOW)
    expect(s.participants[1]!.status).toBe('eliminated')
    expect(s.status).toBe('finished')
    expect(s.winnerId).toBe('p1')
    expect(s.endReason).toBe('elimination')
  })

  it('mit einem dritten Teilnehmer geht die Partie weiter, der nächste ist am Zug', () => {
    let s = lost(true)
    s = endTurn(s, NOW)
    expect(s.status).toBe('running')
    expect(s.participants[s.seat]!.id).toBe('p3')
    expect(s.cities.find((c) => c.id === 'c8')!.ownerId).toBeNull()
  })
})
