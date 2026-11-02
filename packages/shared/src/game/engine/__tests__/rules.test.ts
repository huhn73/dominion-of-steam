import { describe, expect, it } from 'vitest'
import {
  aiProfile,
  applyCommand,
  checkVictory,
  createMatch,
  defaultRules,
  endTurn,
  type GameRules,
  type GameState,
  normalizeState,
  playAITurn,
  projectView,
} from '..'
import { MAP_SIZES } from '../../catalog'
import { city, makeState, participantState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-10-30T12:00:00Z')
const HOUR = 3600_000

function newMatch(rules: Partial<GameRules>) {
  return createMatch(
    {
      id: 'm',
      name: 'Regeltest',
      rules: { ...defaultRules('async'), ...rules },
      map: {
        ...MAP_SIZES.small,
        landShare: 50,
        neutralCities: 'normal',
        terrain: 'normal',
        seed: 'REGEL-1',
      },
      participants: [
        {
          id: 'p1',
          name: 'Björn',
          factionId: 'eisenbund',
          color: 'amber',
          isAI: false,
          aiDifficulty: null,
        },
        {
          id: 'ai1',
          name: 'Admiral Kessler',
          factionId: 'aurelia',
          color: 'rose',
          isAI: true,
          aiDifficulty: 'hard',
          aiPersonalityId: 'kessler',
        },
      ],
    },
    NOW,
  )
}

/** Three participants, each with a capital; p1 also has a unit next to p2's capital */
function capitalsState(victoryCondition: GameRules['victoryCondition'] = 'capitals') {
  const s = makeState({
    map: PLAINS,
    participants: [
      participantState('p1', 'eisenbund', { capitalCityId: 'c1' }),
      participantState('p2', 'aurelia', { capitalCityId: 'c2' }),
      participantState('p3', 'nordmark', { capitalCityId: 'c3' }),
    ],
    cities: [
      city('c1', 'p1', 0, 0, { isCapital: true }),
      city('c2', 'p2', 2, 1, { isCapital: true }),
      city('c3', 'p3', 7, 5, { isCapital: true }),
    ],
    units: [unit('a', 'panzerwagen', 'p1', 1, 1), unit('b', 'grenadiere', 'p3', 6, 5)],
    rules: { victoryCondition },
  })
  return s
}

describe('Regeln aus dem Partie-Setup', () => {
  it('übernimmt Regeln, Persönlichkeit und Hauptstadt in den Spielzustand', () => {
    const s = newMatch({ asyncTurnLimitHours: 12, victoryCondition: 'roundLimit', roundLimit: 50 })
    expect(s.rules).toMatchObject({ mode: 'async', victoryCondition: 'roundLimit', roundLimit: 50 })
    expect(s.mode).toBe('async')
    expect(s.participants[1]).toMatchObject({ aiPersonalityId: 'kessler', capitalCityId: 'c2' })
    expect(s.participants[0]).toMatchObject({
      aiPersonalityId: null,
      citiesCaptured: 0,
      unitsBuilt: 0,
    })
    expect(projectView(s, 'p1').rules.asyncTurnLimitHours).toBe(12)
    expect(projectView(s, 'p1').result).toBeNull()
  })

  it('setzt die Frist aus der Regel: asynchron in Stunden, live in Minuten oder gar nicht', () => {
    const async12 = newMatch({ asyncTurnLimitHours: 12 })
    expect(Date.parse(async12.turnDeadline!) - NOW.getTime()).toBe(12 * HOUR)
    const later = new Date(NOW.getTime() + HOUR)
    const next = endTurn(structuredClone(async12), later)
    expect(Date.parse(next.turnDeadline!) - later.getTime()).toBe(12 * HOUR)

    const live5 = newMatch({ mode: 'live', liveTurnLimitMinutes: 5 })
    expect(Date.parse(live5.turnDeadline!) - NOW.getTime()).toBe(5 * 60_000)
    expect(projectView(live5, 'p1').match.turnDeadline).toBe(live5.turnDeadline)

    const liveOpen = newMatch({ mode: 'live', liveTurnLimitMinutes: null })
    expect(liveOpen.turnDeadline).toBeNull()
  })

  it('ergänzt Regeln und Zähler in gespeicherten Zuständen älterer Versionen', () => {
    const s = capitalsState() as Partial<GameState> & GameState
    delete (s as Partial<GameState>).rules
    delete (s as Partial<GameState>).winnerId
    for (const p of s.participants) {
      delete (p as Partial<typeof p>).capitalCityId
      delete (p as Partial<typeof p>).unitsBuilt
    }
    const n = normalizeState(s)
    expect(n.rules).toEqual(defaultRules('live'))
    expect(n.winnerId).toBeNull()
    expect(n.participants.map((p) => [p.capitalCityId, p.unitsBuilt])).toEqual([
      ['c1', 0],
      ['c2', 0],
      ['c3', 0],
    ])
  })
})

describe('Siegbedingungen', () => {
  it('Alle Gegner besiegen: der Letzte mit Städten oder Einheiten gewinnt', () => {
    const s = makeState({
      map: PLAINS,
      participants: [
        participantState('p1', 'eisenbund'),
        participantState('p2', 'aurelia'),
        participantState('p3', 'nordmark'),
      ],
      units: [unit('a', 'grenadiere', 'p1', 1, 1), unit('b', 'grenadiere', 'p2', 5, 5)],
    })
    // p3 hat nichts mehr: scheidet beim Zugende aus, die Partie läuft weiter
    let next = endTurn(s, NOW)
    expect(next.status).toBe('running')
    expect(next.participants[2]!.status).toBe('eliminated')
    // dann verliert p2 seine letzte Einheit
    next.units = next.units.filter((u) => u.ownerId !== 'p2')
    next = endTurn(next, NOW)
    expect(next).toMatchObject({ status: 'finished', winnerId: 'p1', endedAt: NOW.toISOString() })
    expect(next.participants.map((p) => [p.id, p.placement])).toEqual([
      ['p1', 1],
      ['p2', 2],
      ['p3', 3],
    ])
    expect(projectView(next, 'p2').result).toEqual({
      winnerId: 'p1',
      endedAt: NOW.toISOString(),
      placements: { p1: 1, p2: 2, p3: 3 },
      reason: 'elimination',
    })
  })

  it('Hauptstädte erobern: wer alle gegnerischen Hauptstädte hält, gewinnt sofort', () => {
    const s = capitalsState()
    s.cities.find((c) => c.id === 'c3')!.ownerId = 'p1'
    expect(checkVictory(s, NOW)).toBe(false)

    for (let rng = 0; rng < 20; rng++) {
      const attempt = structuredClone(s)
      attempt.rng = rng
      const { state, combat } = applyCommand(
        attempt,
        'p1',
        { type: 'attack', unitId: 'a', target: { cityId: 'c2' } },
        NOW,
      )
      if (!combat!.captured) continue
      expect(state).toMatchObject({ status: 'finished', winnerId: 'p1' })
      expect(state.participants[0]!.citiesCaptured).toBe(1)
      // p3 hat noch eine Einheit, p2 nichts: p3 vor p2
      expect(state.participants.map((p) => p.placement)).toEqual([1, 3, 2])
      return
    }
    throw new Error('kein Sieg in 20 Versuchen')
  })

  it('Hauptstädte erobern zählt nicht, wenn die Siegbedingung eine andere ist', () => {
    const s = capitalsState('elimination')
    s.cities.find((c) => c.id === 'c2')!.ownerId = 'p1'
    s.cities.find((c) => c.id === 'c3')!.ownerId = 'p1'
    expect(checkVictory(s, NOW)).toBe(false)
    expect(s.status).toBe('running')
  })

  it('Rundenlimit: nach der letzten Runde gewinnt, wer die meisten Punkte hat', () => {
    const s = makeState({
      map: PLAINS,
      units: [
        unit('a', 'grenadiere', 'p1', 1, 1),
        unit('b', 'grenadiere', 'p2', 5, 5),
        unit('c', 'grenadiere', 'p2', 6, 5),
      ],
      cities: [city('c1', 'p1', 0, 0), city('c2', 'p2', 7, 5)],
      rules: { victoryCondition: 'roundLimit', roundLimit: 2 },
    })
    let next = endTurn(s, NOW) // p2, Runde 1
    next = endTurn(next, NOW) // p1, Runde 2
    expect(next).toMatchObject({ status: 'running', round: 2 })
    next = endTurn(next, NOW) // p2, Runde 2
    next = endTurn(next, NOW) // Ende der letzten Runde
    // p1: 1 Stadt × 3 + 1 Einheit = 4, p2: 3 + 2 = 5
    expect(next).toMatchObject({ status: 'finished', round: 2, winnerId: 'p2', turnDeadline: null })
    expect(next.participants.map((p) => p.placement)).toEqual([2, 1])
  })

  it('zählt fertiggestellte Einheiten für die Statistik', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 1, 1), unit('b', 'grenadiere', 'p2', 5, 5)],
      cities: [
        city('c1', 'p1', 0, 0, {
          production: { unitTypeId: 'grenadiere', progress: 0, turnsRemaining: 1 },
        }),
      ],
    })
    const next = endTurn(endTurn(s, NOW), NOW)
    expect(next.participants[0]!.unitsBuilt).toBe(1)
    expect(next.participants[1]!.unitsBuilt).toBe(0)
  })
})

describe('KI-Persönlichkeiten', () => {
  it('verändern die Parameter der Schwierigkeit leicht', () => {
    const normal = aiProfile('normal')
    expect(aiProfile('normal', ['Aggressiv', 'Seekrieg'])).toMatchObject({
      attackThreshold: normal.attackThreshold - 0.1,
      maxShips: 4,
    })
    expect(aiProfile('normal', ['Aggressiv']).shipShare).toBe(normal.shipShare)
    expect(aiProfile('normal', ['Defensiv'])).toMatchObject({
      attackThreshold: normal.attackThreshold + 0.1,
      defend: true,
    })
    // Defensive tags never push the threshold past the point where grenadiers stop taking cities
    expect(aiProfile('normal', ['Defensiv', 'Befestigung']).attackThreshold).toBeLessThanOrEqual(
      0.65,
    )
    expect(aiProfile('easy', ['Expansiv']).neutralBias).toBeGreaterThan(0)
    expect(aiProfile('hard', ['Luftkrieg']).specialShare).toBeGreaterThan(
      aiProfile('hard').specialShare,
    )
    expect(aiProfile('normal', ['Landkrieg']).shipShare).toBeLessThan(normal.shipShare)
    expect(aiProfile('normal', [])).toEqual(normal)
  })

  it('defensive Persönlichkeiten lassen eine Wache in der bedrohten Stadt', () => {
    const scenario = (personality: string | null) => {
      const s = makeState({
        map: PLAINS,
        participants: [
          participantState('p1', 'eisenbund'),
          participantState('p2', 'salzkueste', { aiPersonalityId: personality }),
        ],
        units: [unit('g', 'grenadiere', 'p2', 4, 3), unit('foe', 'panzerwagen', 'p1', 3, 3)],
        cities: [
          city('own', 'p2', 4, 3, {
            production: { unitTypeId: 'grenadiere', progress: 0, turnsRemaining: 3 },
          }),
          city('n', null, 6, 3),
        ],
      })
      s.seat = 1
      return playAITurn(s, 'p2', NOW).units.find((u) => u.id === 'g')!
    }
    expect(scenario('ostrow')).toMatchObject({ col: 4, row: 3, order: { type: 'sentry' } })
    const normal = scenario(null)
    expect([normal.col, normal.row]).not.toEqual([4, 3])
  })

  it('expansive Persönlichkeiten ziehen neutrale Städte vor', () => {
    const target = (personality: string | null) => {
      const s = makeState({
        map: ['..........', '..........', '..........', '..........', '..........'],
        participants: [
          participantState('p1', 'eisenbund'),
          participantState('p2', 'aurelia', { aiPersonalityId: personality }),
        ],
        units: [unit('g', 'grenadiere', 'p2', 4, 2), unit('w', 'grenadiere', 'p1', 9, 4)],
        cities: [city('enemy', 'p1', 2, 2), city('neutral', null, 7, 2)],
      })
      s.seat = 1
      const g = playAITurn(s, 'p2', NOW).units.find((u) => u.id === 'g')!
      return g.col > 4 ? 'neutral' : 'enemy'
    }
    expect(target(null)).toBe('enemy')
    expect(target('varenne')).toBe('neutral')
  })
})
