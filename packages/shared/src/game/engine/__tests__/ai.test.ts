import { describe, expect, it } from 'vitest'
import { aiProfile, createMatch, defaultRules, endTurn, playAITurn, type GameState } from '..'
import { MAP_SIZES } from '../../catalog'
import { hexDistance, isWater, neighbors, sameHex } from '../../hex'
import { terrainAt } from '../../mapcodec'
import { unitType } from '../state'
import { city, makeState, participantState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-10-30T12:00:00Z')

describe('KI', () => {
  it('erobert eine benachbarte neutrale Stadt', () => {
    // mehrere Seeds, weil der Kampf vom Zufall abhängt
    let captured = 0
    for (let rng = 0; rng < 10; rng++) {
      const s = makeState({
        map: PLAINS,
        units: [unit('a', 'panzerwagen', 'p1', 2, 2), unit('far', 'grenadiere', 'p2', 7, 5)],
        cities: [city('c', null, 3, 2)],
      })
      s.participants[0]!.isAI = true
      s.rng = rng
      const after = playAITurn(s, 'p1', NOW)
      if (after.cities[0]!.ownerId === 'p1') captured++
    }
    expect(captured).toBeGreaterThan(5)
  })

  it('greift schwache Gegner an, starke nicht', () => {
    const scenario = (enemyType: string) => {
      const s = makeState({
        map: PLAINS,
        units: [unit('a', 'panzerwagen', 'p1', 2, 2), unit('e', enemyType, 'p2', 3, 2)],
      })
      s.participants[0]!.aiDifficulty = 'normal'
      return playAITurn(s, 'p1', NOW)
    }
    const weak = scenario('grenadiere')
    expect(weak.log.some((l) => l.action === 'attack')).toBe(true)
    const strong = scenario('dampfkoloss')
    expect(strong.log.some((l) => l.action === 'attack')).toBe(false)
  })

  it('lässt sich das Profil von außen überschreiben', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 2, 2), unit('e', 'grenadiere', 'p2', 3, 2)],
    })
    s.participants[0]!.aiDifficulty = 'normal'
    const after = playAITurn(s, 'p1', NOW, { profile: { attackThreshold: 1 } })
    expect(after.log.some((l) => l.action === 'attack')).toBe(false)
  })

  it('meldet jeden angenommenen Befehl mit seinem Zwischenstand', () => {
    const s = makeState({
      map: PLAINS,
      cities: [city('c', 'p1', 3, 3)],
      units: [unit('a', 'panzerwagen', 'p1', 2, 2), unit('e', 'grenadiere', 'p2', 3, 2)],
    })
    const seen: { type: string; seq: number }[] = []
    const after = playAITurn(s, 'p1', NOW, {
      onCommand: (cmd, outcome) => seen.push({ type: cmd.type, seq: outcome.state.seq }),
    })
    expect(seen.length).toBeGreaterThan(1)
    expect(seen.map((x) => x.type)).toContain('setProduction')
    expect(seen.map((x) => x.type)).toContain('attack')
    // the last reported state is the one the turn returns
    expect(seen.at(-1)!.seq).toBe(after.seq)
  })

  it('leicht erobert neutrale Städte, lässt aber Verteidiger in Städten in Ruhe', () => {
    let captured = 0
    for (let rng = 0; rng < 20; rng++) {
      const s = makeState({
        map: PLAINS,
        units: [unit('a', 'grenadiere', 'p1', 2, 2), unit('far', 'grenadiere', 'p2', 7, 5)],
        cities: [city('c', null, 3, 2)],
      })
      s.participants[0]!.aiDifficulty = 'easy'
      s.rng = rng
      if (playAITurn(s, 'p1', NOW).cities[0]!.ownerId === 'p1') captured++
    }
    expect(captured).toBeGreaterThan(4)

    const siege = (difficulty: 'easy' | 'normal') => {
      const s = makeState({
        map: PLAINS,
        units: [unit('a', 'panzerwagen', 'p1', 2, 2), unit('e', 'grenadiere', 'p2', 3, 2)],
        cities: [city('c', 'p2', 3, 2)],
      })
      s.participants[0]!.aiDifficulty = difficulty
      return playAITurn(s, 'p1', NOW).log.some((l) => l.action === 'attack')
    }
    expect(siege('easy')).toBe(false)
    expect(siege('normal')).toBe(true)
  })

  it('belagert eine verteidigte Stadt nur mit Übermacht', () => {
    // grenadiers against a grenadier in a city hit with 2/(2+2+1) = 0.4, below every threshold
    const scenario = (own: number) => {
      const units = Array.from({ length: own }, (_, i) =>
        unit(`g${i}`, 'grenadiere', 'p1', 2, 1 + i),
      )
      const s = makeState({
        map: PLAINS,
        units: [...units, unit('d', 'grenadiere', 'p2', 3, 2)],
        cities: [city('c', 'p2', 3, 2), city('home', 'p2', 7, 5)],
      })
      s.participants[0]!.aiDifficulty = 'normal'
      return playAITurn(s, 'p1', NOW).log.some((l) => l.action === 'attack')
    }
    expect(scenario(1)).toBe(false)
    expect(scenario(3)).toBe(true)
  })

  it('bedrohte Städte bauen Grenadiere nur bis zur Zielstärke der Garnison', () => {
    const build = (garrisonTarget: number, defenders: number) => {
      const types = new Set<string>()
      for (let rng = 0; rng < 20; rng++) {
        const s = makeState({
          map: PLAINS,
          cities: [city('c', 'p1', 3, 3)],
          units: [
            ...Array.from({ length: defenders }, (_, i) => unit(`g${i}`, 'grenadiere', 'p1', 3, 3)),
            unit('e', 'panzerwagen', 'p2', 4, 3),
          ],
        })
        s.participants[0]!.aiDifficulty = 'hard'
        s.rng = rng
        types.add(
          playAITurn(s, 'p1', NOW, { profile: { garrisonTarget } }).cities[0]!.production!
            .unitTypeId,
        )
      }
      return [...types]
    }
    expect(build(2, 1)).toEqual(['grenadiere'])
    expect(build(2, 2)).toContain('panzerwagen')
    expect(build(99, 2)).toEqual(['grenadiere'])
  })

  it('baut Tauchboote, wenn feindliche Schiffe in Sicht sind', () => {
    const types = new Set<string>()
    for (let rng = 0; rng < 30; rng++) {
      const s = makeState({
        map: ['..~~~~', '..~~~~', '..~~~~', '..~~~~'],
        cities: [city('c', 'p1', 1, 1)],
        // the enemy ship is 4 tiles from the city (not a threat) but in sight of the own gunboat
        units: [unit('k', 'kanonenboot', 'p1', 3, 1), unit('e', 'kanonenboot', 'p2', 5, 1)],
      })
      s.participants[0]!.aiDifficulty = 'hard'
      s.rng = rng
      types.add(playAITurn(s, 'p1', NOW).cities[0]!.production!.unitTypeId)
    }
    expect(types).toContain('tauchboot')
  })

  it('schwer schickt angeschlagene Panzerwagen zur Reparatur, normal kämpft weiter', () => {
    const scenario = (difficulty: 'normal' | 'hard') => {
      const s = makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 4, 2, { hp: 1 }),
          unit('far', 'grenadiere', 'p2', 7, 5),
        ],
        cities: [city('home', 'p1', 2, 2), city('n', null, 6, 2)],
      })
      s.participants[0]!.aiDifficulty = difficulty
      const a = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'a')!
      return a.col
    }
    expect(scenario('hard')).toBeLessThan(4) // towards home
    expect(scenario('normal')).toBeGreaterThan(4) // towards the neutral city
  })

  it('verfolgt versprengte Feinde, wenn keine Stadt mehr zu holen ist', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 0, 0), unit('e', 'grenadiere', 'p2', 6, 4)],
      cities: [city('c', 'p1', 0, 0)],
    })
    // the enemy is visible to the test's all-explored map only within sight: put a scout next to it
    s.units.push(unit('s', 'doppeldecker', 'p1', 5, 4, { fuel: 12, movesLeft: 0 }))
    const a = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'a')!
    expect(a.col + a.row).toBeGreaterThan(0)
  })

  it('bewertet Stadtangriffe nach Ertrag: Grenadiere greifen auch Salzküste-Städte an', () => {
    const scenario = (difficulty: 'easy' | 'normal') => {
      const s = makeState({
        map: PLAINS,
        participants: [participantState('p1', 'eisenbund'), participantState('p2', 'salzkueste')],
        units: [unit('a', 'grenadiere', 'p1', 2, 2), unit('far', 'grenadiere', 'p2', 7, 5)],
        cities: [city('c', 'p2', 3, 2)],
      })
      s.participants[0]!.aiDifficulty = difficulty
      return playAITurn(s, 'p1', NOW).log.some(
        (l) => l.action === 'attack' || l.action === 'capture',
      )
    }
    // capture chance 2/(2+1+1) = 0.5 is below every threshold, but 0.5 × 6 points beats one grenadier
    expect(scenario('normal')).toBe(true)
    expect(scenario('easy')).toBe(false)
  })

  it('würfelt die Produktion bei jedem Neustart neu, läuft sie, bleibt sie', () => {
    const build = (progress: number) => {
      const s = makeState({
        map: PLAINS,
        cities: [
          city('c', 'p1', 3, 3, {
            production: { unitTypeId: 'dampfkoloss', progress, turnsRemaining: 12 - progress },
          }),
        ],
        units: [unit('far', 'grenadiere', 'p2', 7, 5)],
      })
      return playAITurn(s, 'p1', NOW).cities[0]!.production!.unitTypeId
    }
    expect(build(0)).not.toBe('dampfkoloss')
    expect(build(3)).toBe('dampfkoloss')
  })

  it('schwer plant Einheiten auf Wache neu, normal lässt sie stehen', () => {
    const scenario = (difficulty: 'normal' | 'hard') => {
      const s = makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 2, 2, { order: { type: 'sentry' } }),
          unit('far', 'grenadiere', 'p2', 7, 5),
        ],
        cities: [city('c', null, 3, 2)],
      })
      s.participants[0]!.aiDifficulty = difficulty
      const after = playAITurn(s, 'p1', NOW)
      const a = after.units.find((u) => u.id === 'a')
      return { acted: !a || a.order.type !== 'sentry' || after.cities[0]!.ownerId === 'p1', after }
    }
    expect(scenario('normal').acted).toBe(false)
    expect(scenario('hard').acted).toBe(true)
  })

  it('schwer ruft eine Einheit in eine bedrohte Stadt ohne Besatzung zurück', () => {
    const scenario = (difficulty: 'normal' | 'hard') => {
      const s = makeState({
        map: PLAINS,
        units: [unit('g', 'grenadiere', 'p1', 3, 5), unit('e', 'panzerwagen', 'p2', 4, 3)],
        cities: [city('c', 'p1', 3, 3), city('home', 'p2', 7, 0)],
      })
      s.participants[0]!.aiDifficulty = difficulty
      const g = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'g')!
      return g.order.type === 'goto' && g.order.target.col === 3 && g.order.target.row === 3
    }
    expect(scenario('hard')).toBe(true)
    expect(scenario('normal')).toBe(false)
  })

  it('schwer hält eine bedrohte Stadt besetzt', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('g', 'grenadiere', 'p1', 3, 3), unit('e', 'grenadiere', 'p2', 4, 3)],
      cities: [city('c', 'p1', 3, 3), city('n', null, 1, 3)],
    })
    s.participants[0]!.aiDifficulty = 'hard'
    const g = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'g')!
    expect(g.col).toBe(3)
    expect(g.row).toBe(3)
    expect(g.order.type).toBe('sentry')
  })

  it('Befestiger halten Grenzstädte besetzt, Städte im Hinterland nicht', () => {
    const scenario = (personality: string | null, cityCol: number) => {
      const s = makeState({
        map: ['..........', '..........', '..........', '..........'],
        participants: [
          participantState('p1', 'eisenbund'),
          participantState('p2', 'salzkueste', { aiPersonalityId: personality }),
        ],
        units: [unit('g', 'grenadiere', 'p2', cityCol, 1), unit('w', 'grenadiere', 'p1', 9, 3)],
        cities: [city('own', 'p2', cityCol, 1), city('enemy', 'p1', 9, 1), city('n', null, 0, 3)],
      })
      s.seat = 1
      return playAITurn(s, 'p2', NOW).units.find((u) => u.id === 'g')!
    }
    // the enemy city is 3 tiles away: a border city, the garrison stays
    expect(scenario('ostrow', 6)).toMatchObject({ col: 6, row: 1, order: { type: 'sentry' } })
    // 8 tiles away: hinterland, the unit marches off
    expect(scenario('ostrow', 1).order.type).not.toBe('sentry')
    // without the personality the unit leaves the border city too
    expect(scenario(null, 6).order.type).not.toBe('sentry')
  })

  it('deckelt die Angriffsschwelle, damit defensive Persönlichkeiten nicht einfrieren', () => {
    const ostrow = aiProfile('normal', ['Defensiv', 'Befestigung'])
    expect(ostrow.attackThreshold).toBeLessThanOrEqual(0.65)
    expect(ostrow.defend).toBe(true)
    expect(ostrow.fortify).toBe(true)
    expect(ostrow.garrison).toBe(false)
    expect(aiProfile('hard')).toMatchObject({ replan: 'all', defend: true, attackThreshold: 0.55 })
    expect(aiProfile('easy')).toMatchObject({ siege: false, cityValue: false, replan: 'none' })
  })

  it('legt Produktion in untätigen Städten fest und baut an Land keine Schiffe', () => {
    const s = makeState({
      map: PLAINS,
      cities: [city('c', 'p1', 3, 3)],
      units: [unit('far', 'grenadiere', 'p2', 7, 5)],
    })
    const after = playAITurn(s, 'p1', NOW)
    const production = after.cities[0]!.production
    expect(production).not.toBeNull()
    expect(unitType(production!.unitTypeId).domain).toBe('land')
  })

  it('baut Doppeldecker, solange Nebel bleibt, und schickt sie auf Erkundung', () => {
    const build = (fog: boolean) => {
      const types = new Set<string>()
      for (let rng = 0; rng < 30; rng++) {
        const s = makeState({
          map: PLAINS,
          cities: [city('c', 'p1', 3, 3)],
          units: [unit('far', 'grenadiere', 'p2', 7, 5)],
          unexplored: fog ? ['7,0', '6,0'] : [],
        })
        s.rng = rng
        types.add(
          playAITurn(s, 'p1', NOW, { profile: { scoutShare: 0.25 } }).cities[0]!.production!
            .unitTypeId,
        )
      }
      return types
    }
    expect(build(true)).toContain('doppeldecker')
    expect(build(false)).not.toContain('doppeldecker')

    const s = makeState({
      map: PLAINS,
      cities: [city('c', 'p1', 3, 3)],
      units: [
        unit('f', 'doppeldecker', 'p1', 3, 3, { fuel: 12 }),
        unit('far', 'grenadiere', 'p2', 7, 5),
      ],
      unexplored: ['7,0', '6,0', '7,1'],
    })
    const plane = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'f')!
    expect(plane.order.type === 'explore' || !sameHex(plane, { col: 3, row: 3 })).toBe(true)
  })

  it('Nordmark fliegt Wolkenkreuzer statt Schwerbomber, Eisenbund mischt Dampfkolosse unter die Panzer', () => {
    const builds = (factionId: string, round: number) => {
      const types = new Set<string>()
      for (let rng = 0; rng < 40; rng++) {
        const s = makeState({
          map: PLAINS,
          participants: [participantState('p1', factionId), participantState('p2', 'salzkueste')],
          // six cities: land specials need a grown realm; a scout keeps the enemy in sight
          cities: [city('c', 'p1', 1, 3), ...[0, 1, 2, 3, 4].map((i) => city(`x${i}`, 'p1', 7, i))],
          units: [
            unit('s', 'doppeldecker', 'p1', 3, 3, { fuel: 12, movesLeft: 0 }),
            unit('e', 'grenadiere', 'p2', 5, 3),
          ],
        })
        s.participants[0]!.aiDifficulty = 'hard'
        s.rng = rng
        s.round = round
        types.add(playAITurn(s, 'p1', NOW).cities[0]!.production!.unitTypeId)
      }
      return types
    }
    const nordmark = builds('nordmark', 20)
    expect(nordmark).toContain('wolkenkreuzer')
    expect(nordmark).not.toContain('schwerbomber')
    expect(builds('eisenbund', 20)).toContain('dampfkoloss')
    expect(builds('eisenbund', 5)).not.toContain('dampfkoloss')
  })

  it('Bomber greifen nur an, wenn der Treibstoff für den Rückweg reicht', () => {
    const scenario = (fuel: number) => {
      const s = makeState({
        map: PLAINS,
        cities: [city('c', 'p1', 1, 3)],
        units: [
          unit('b', 'schwerbomber', 'p1', 1, 3, { fuel }),
          unit('e', 'grenadiere', 'p2', 3, 3),
        ],
      })
      s.participants[0]!.aiDifficulty = 'hard'
      const types: string[] = []
      playAITurn(s, 'p1', NOW, { onCommand: (cmd) => types.push(cmd.type) })
      return types.includes('attack')
    }
    expect(scenario(16)).toBe(true)
    expect(scenario(4)).toBe(false)
  })

  it('schickt Flugzeuge mit knappem Treibstoff zurück zur Basis', () => {
    const s = makeState({
      map: PLAINS,
      cities: [
        city('c', 'p1', 0, 0, {
          production: { unitTypeId: 'grenadiere', progress: 0, turnsRemaining: 3 },
        }),
      ],
      units: [
        unit('f', 'doppeldecker', 'p1', 5, 3, { fuel: 7 }),
        unit('far', 'grenadiere', 'p2', 7, 5),
      ],
    })
    const after = playAITurn(s, 'p1', NOW)
    const plane = after.units.find((u) => u.id === 'f')!
    expect(plane.col + plane.row).toBeLessThan(8)
    expect(plane.fuel).toBeGreaterThan(0)
  })

  it('beendet die Wiederholung selbst', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 0, 0), unit('far', 'grenadiere', 'p2', 7, 5)],
    })
    s.phase = 'replay'
    expect(() => playAITurn(s, 'p1', NOW)).not.toThrow()
  })
})

describe('KI: Transporte', () => {
  // Two islands: columns 0–1 and 4–5 are land, columns 2–3 water
  const ISLANDS = ['..~~..', '..~~..', '..~~..', '..~~..']
  const inMap = (c: { col: number; row: number }) =>
    c.col >= 0 && c.col < 6 && c.row >= 0 && c.row < 4
  const PIER = { col: 2, row: 1 }

  it('baut ein Kanonenboot zum Erkunden, solange Nebel bleibt und kein Schiff fährt', () => {
    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
      units: [0, 1, 2, 3].map((i) => unit(`g${i}`, 'grenadiere', 'p1', 0, i)),
      unexplored: ['5,3', '4,3'],
    })
    s.participants[0]!.aiDifficulty = 'hard'
    expect(playAITurn(s, 'p1', NOW).cities[0]!.production!.unitTypeId).toBe('kanonenboot')
  })

  it('baut einen Frachter, wenn die Städte der anderen jenseits des Wassers liegen', () => {
    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
      units: [0, 1, 2, 3].map((i) => unit(`g${i}`, 'grenadiere', 'p1', 0, i)),
    })
    expect(playAITurn(s, 'p1', NOW).cities[0]!.production!.unitTypeId).toBe('frachter')
    const easy = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
      units: [0, 1, 2, 3].map((i) => unit(`g${i}`, 'grenadiere', 'p1', 0, i)),
    })
    easy.participants[0]!.aiDifficulty = 'easy'
    expect(playAITurn(easy, 'p1', NOW).cities[0]!.production!.unitTypeId).not.toBe('frachter')
  })

  it('lädt Landeinheiten ein, wenn sie zu Fuß nichts mehr erreichen', () => {
    const shore = neighbors(PIER).filter((n) => inMap(n) && n.col === 1)
    const first = shore[0]!
    const second = neighbors(first).filter((n) => inMap(n) && n.col <= 1 && !sameHex(n, first))
    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
      units: [
        unit('f', 'frachter', 'p1', PIER.col, PIER.row),
        unit('a', 'panzerwagen', 'p1', first.col, first.row),
        unit('b', 'panzerwagen', 'p1', second[0]!.col, second[0]!.row),
        unit('c', 'panzerwagen', 'p1', second[1]!.col, second[1]!.row),
      ],
    })
    const after = playAITurn(s, 'p1', NOW)
    const aboard = after.units.filter((u) => u.carriedBy === 'f').map((u) => u.id)
    expect(aboard.length).toBeGreaterThanOrEqual(2)
    expect(after.units.find((u) => u.id === 'f')!.cargoUnitIds).toEqual(aboard)
  })

  it('baut Geleitschutz für Frachter und lässt Kriegsschiffe den Konvoi begleiten', () => {
    const production = (factionId: string) => {
      const s = makeState({
        map: ISLANDS,
        participants: [participantState('p1', factionId), participantState('p2', 'nordmark')],
        cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
        units: [
          unit('f', 'frachter', 'p1', PIER.col, PIER.row),
          ...[0, 1, 2, 3].map((i) => unit(`g${i}`, 'grenadiere', 'p1', 0, i)),
        ],
      })
      return playAITurn(s, 'p1', NOW, { profile: { maxTransports: 1 } }).cities[0]!.production!
        .unitTypeId
    }
    expect(production('eisenbund')).toBe('kanonenboot')
    // the Blitzkorvette is only a special now (see tarnung.test.ts), normal escorts with gunboats
    expect(production('aurelia')).toBe('kanonenboot')

    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
      units: [
        unit('f', 'frachter', 'p1', PIER.col, PIER.row, { cargoUnitIds: ['a'], movesLeft: 0 }),
        unit('a', 'grenadiere', 'p1', PIER.col, PIER.row, { carriedBy: 'f', movesLeft: 0 }),
        unit('k', 'kanonenboot', 'p1', 3, 3),
      ],
    })
    const k = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'k')!
    expect(hexDistance(k, PIER)).toBeLessThanOrEqual(1)
  })

  it('setzt mit voller Ladung zur fremden Küste über', () => {
    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
      units: [
        unit('f', 'frachter', 'p1', PIER.col, PIER.row, { cargoUnitIds: ['a', 'b', 'c'] }),
        ...['a', 'b', 'c'].map((id) =>
          unit(id, 'grenadiere', 'p1', PIER.col, PIER.row, { carriedBy: 'f' }),
        ),
      ],
    })
    const after = playAITurn(s, 'p1', NOW)
    const f = after.units.find((u) => u.id === 'f')!
    expect(f.col).toBe(3) // one step is enough on this map: the far shore is column 3
    // the cargo still has its moves this turn, so it may already have stepped ashore
    for (const id of ['a', 'b', 'c']) {
      const u = after.units.find((x) => x.id === id)!
      expect(u.carriedBy === 'f' || u.col === 4).toBe(true)
    }
  })

  it('Ladung greift vom Schiff aus an oder geht an Land', () => {
    const landed = (farCity: { col: number; row: number }) => {
      const at = { col: 3, row: 1 }
      const s = makeState({
        map: ISLANDS,
        cities: [city('home', 'p1', 1, 1), city('far', 'p2', farCity.col, farCity.row)],
        units: [
          unit('f', 'frachter', 'p1', at.col, at.row, { cargoUnitIds: ['a'], movesLeft: 0 }),
          unit('a', 'grenadiere', 'p1', at.col, at.row, { carriedBy: 'f' }),
          unit('w', 'grenadiere', 'p2', 5, 3),
        ],
      })
      const types: string[] = []
      const after = playAITurn(s, 'p1', NOW, { onCommand: (cmd) => types.push(cmd.type) })
      return { types, a: after.units.find((u) => u.id === 'a') }
    }
    // the city lies right next to the ship: capture it from aboard
    const adjacent = neighbors({ col: 3, row: 1 }).find((n) => inMap(n) && n.col === 4)!
    expect(landed(adjacent).types).toContain('attack')
    // the city lies inland: step ashore and march
    const inland = landed({ col: 5, row: 3 })
    expect(inland.a?.carriedBy).toBeNull()
    expect(inland.a?.col).toBe(4)
  })

  it('Ladung landet auch auf einer Insel mit eigener Stadt, wenn dort eine fremde näher liegt', () => {
    const at = { col: 3, row: 3 }
    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('own', 'p1', 4, 0), city('n', null, 5, 3)],
      units: [
        unit('f', 'frachter', 'p1', at.col, at.row, { cargoUnitIds: ['a'], movesLeft: 0 }),
        unit('a', 'grenadiere', 'p1', at.col, at.row, { carriedBy: 'f' }),
      ],
    })
    const a = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'a')!
    expect(a.carriedBy).toBeNull()
    expect(a.col).toBeGreaterThanOrEqual(4)
  })

  it('Ladung bleibt am eigenen Anleger an Bord', () => {
    const s = makeState({
      map: ISLANDS,
      cities: [city('home', 'p1', 1, 1), city('n', null, 0, 3), city('far', 'p2', 5, 1)],
      units: [
        unit('f', 'frachter', 'p1', PIER.col, PIER.row, { cargoUnitIds: ['a'], movesLeft: 0 }),
        unit('a', 'grenadiere', 'p1', PIER.col, PIER.row, { carriedBy: 'f' }),
      ],
    })
    // the neutral city on the home island is no reason to unload at the pier
    const a = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'a')!
    expect(a.carriedBy).toBe('f')
  })

  it('Frachter wählen die unverteidigte neutrale Insel vor einer näheren verteidigten Feindstadt', () => {
    // Home island, a near island with a defended enemy city, a far island with a neutral one;
    // the bottom row is open water
    const map = ['..~~..~~~~..', '..~~..~~~~..', '..~~..~~~~..', '~~~~~~~~~~~~']
    const s = makeState({
      map,
      cities: [city('home', 'p1', 1, 1), city('near', 'p2', 4, 1), city('n', null, 11, 1)],
      units: [
        unit('f', 'frachter', 'p1', PIER.col, PIER.row, { cargoUnitIds: ['a', 'b'] }),
        ...['a', 'b'].map((id) =>
          unit(id, 'grenadiere', 'p1', PIER.col, PIER.row, { carriedBy: 'f' }),
        ),
        unit('d1', 'panzerwagen', 'p2', 4, 1),
        unit('d2', 'grenadiere', 'p2', 5, 1),
        // a lookout, only defenders in sight count
        unit('k', 'kanonenboot', 'p1', 3, 1, { movesLeft: 0 }),
      ],
    })
    const f = playAITurn(s, 'p1', NOW).units.find((u) => u.id === 'f')!
    const heading = f.order.type === 'goto' ? f.order.target : f
    expect(heading.col).toBeGreaterThanOrEqual(9)
  })

  it('ein Kriegsschiff begleitet den Frachter, das zweite erkundet', () => {
    const map = ['..~~~~~~', '..~~~~~~', '..~~~~~~', '..~~~~~~']
    const s = makeState({
      map,
      cities: [city('home', 'p1', 1, 1), city('far', 'p2', 0, 3)],
      units: [
        unit('f', 'frachter', 'p1', PIER.col, PIER.row, { cargoUnitIds: ['a'], movesLeft: 0 }),
        unit('a', 'grenadiere', 'p1', PIER.col, PIER.row, { carriedBy: 'f', movesLeft: 0 }),
        unit('k1', 'kanonenboot', 'p1', 3, 1),
        unit('k2', 'kanonenboot', 'p1', 3, 2),
      ],
      unexplored: ['7,0', '7,1', '7,2', '7,3'],
    })
    const after = playAITurn(s, 'p1', NOW)
    const ships = ['k1', 'k2'].map((id) => after.units.find((u) => u.id === id)!)
    expect(ships.filter((k) => hexDistance(k, PIER) <= 1)).toHaveLength(1)
    expect(Math.max(...ships.map((k) => k.col))).toBeGreaterThanOrEqual(5)
  })

  it('baut mit der Vorherrschaft in Reichweite einen Frachter mehr', () => {
    const build = (victoryCondition: 'dominance' | 'capitals') => {
      const s = makeState({
        map: ISLANDS,
        rules: { victoryCondition },
        cities: [
          city('home', 'p1', 1, 1),
          city('own', 'p1', 0, 3),
          city('n1', null, 4, 0),
          city('n2', null, 5, 3),
        ],
        units: [
          unit('f1', 'frachter', 'p1', PIER.col, PIER.row),
          unit('f2', 'frachter', 'p1', 2, 2),
          unit('k', 'kanonenboot', 'p1', 3, 0),
          unit('k2', 'kanonenboot', 'p1', 3, 3),
          ...[0, 1, 2, 3].map((i) => unit(`g${i}`, 'grenadiere', 'p1', 0, i % 3)),
        ],
      })
      return playAITurn(s, 'p1', NOW).cities[0]!.production!.unitTypeId
    }
    expect(build('dominance')).toBe('frachter')
    expect(build('capitals')).not.toBe('frachter')
  })

  it('leicht zielt nicht auf Vorherrschaft und erkundet nicht zur See', () => {
    expect(aiProfile('easy').dominanceDrive).toBe(false)
    expect(aiProfile('easy').scoutShips).toBe(0)
    expect(aiProfile('normal').dominanceDrive).toBe(true)
    expect(aiProfile('hard').scoutShips).toBe(2)
  })
})

describe('Simulation KI gegen KI', () => {
  const simulate = (seed: string, rounds: number) => {
    let s: GameState = createMatch({
      id: 'sim',
      name: 'Simulation',
      rules: defaultRules('live'),
      map: { ...MAP_SIZES.medium, landShare: 55, neutralCities: 'normal', terrain: 'normal', seed },
      participants: [
        participantState('a', 'eisenbund'),
        participantState('b', 'aurelia'),
        participantState('c', 'nordmark'),
      ].map((p, i) => ({
        id: p.id,
        name: p.name,
        factionId: p.factionId,
        color: (['amber', 'rose', 'sky'] as const)[i]!,
        isAI: true,
        aiDifficulty: (['easy', 'normal', 'hard'] as const)[i]!,
      })),
    })
    const initialOwners = new Map(s.cities.map((c) => [c.id, c.ownerId]))
    while (s.status === 'running' && s.round <= rounds) {
      const current = s.participants[s.seat]!
      s = endTurn(playAITurn(s, current.id, NOW), NOW)
    }
    return { s, initialOwners }
  }

  it(
    'spielt 40 Runden ohne Fehler, mit gültigem Zustand und Eroberungen',
    { timeout: 60_000 },
    () => {
      const { s, initialOwners } = simulate('SIM-1', 40)
      const ids = new Set(s.units.map((u) => u.id))
      for (const u of s.units) {
        const t = terrainAt(s.map, u)
        expect(t).toBeDefined()
        const domain = unitType(u.unitTypeId).domain
        const inCity = s.cities.some((c) => c.col === u.col && c.row === u.row)
        if (domain === 'land' && !u.carriedBy) expect(isWater(t!)).toBe(false)
        if (domain === 'sea') expect(isWater(t!) || inCity).toBe(true)
        for (const cargo of u.cargoUnitIds) expect(ids.has(cargo)).toBe(true)
        if (u.carriedBy)
          expect(s.units.find((x) => x.id === u.carriedBy)!.cargoUnitIds).toContain(u.id)
        expect(u.hp).toBeGreaterThan(0)
        expect(u.hp).toBeLessThanOrEqual(unitType(u.unitTypeId).hitPoints)
      }
      const changed = s.cities.filter((c) => c.ownerId !== initialOwners.get(c.id))
      expect(changed.length).toBeGreaterThan(2)
      expect(s.units.length).toBeGreaterThan(3)
    },
  )

  it('ist mit gleichem Seed reproduzierbar', { timeout: 60_000 }, () => {
    expect(simulate('SIM-2', 12).s).toEqual(simulate('SIM-2', 12).s)
  })
})
