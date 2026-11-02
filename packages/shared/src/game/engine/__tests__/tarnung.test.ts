import { describe, expect, it } from 'vitest'
import { applyCommand, endTurn, playAITurn, projectView, type GameState } from '..'
import { sightingSnapshot } from '../visibility'
import { city, makeState, participantState, unit } from './fixtures'

const NOW = new Date('2026-11-01T12:00:00Z')
// Open sea with a strip of land at the left edge for the cities
const SEA = ['.~~~~~~~', '.~~~~~~~', '.~~~~~~~', '.~~~~~~~']

const enemyIds = (s: GameState, viewer = 'p1') =>
  projectView(s, viewer)
    .units.filter((u) => u.ownerId !== viewer)
    .map((u) => u.id)

describe('Tauchboote sind getarnt', () => {
  const scene = (own: Parameters<typeof unit>) =>
    makeState({
      map: SEA,
      cities: [city('a', 'p1', 0, 0), city('b', 'p2', 0, 3)],
      units: [unit(...own), unit('sub', 'tauchboot', 'p2', 4, 1)],
    })

  it('bleiben neben einem Kanonenboot unsichtbar, auch in Sichtung und Bericht', () => {
    const s = scene(['k', 'kanonenboot', 'p1', 3, 1])
    expect(enemyIds(s)).not.toContain('sub')
    expect(sightingSnapshot(s, 'p1').unitIds).not.toContain('sub')
  })

  it('ein eigenes Tauchboot ortet sie im Umkreis von zwei Feldern', () => {
    expect(enemyIds(scene(['t', 'tauchboot', 'p1', 2, 1]))).toContain('sub')
    expect(enemyIds(scene(['t', 'tauchboot', 'p1', 1, 3]))).not.toContain('sub')
  })

  it('wer gegen sie fährt, sieht sie bis zum nächsten Zug ihres Besitzers', () => {
    let s = scene(['k', 'kanonenboot', 'p1', 2, 1])
    s = applyCommand(s, 'p1', { type: 'move', unitId: 'k', target: { col: 5, row: 1 } }, NOW).state
    const k = s.units.find((u) => u.id === 'k')!
    expect([k.col, k.row]).toEqual([3, 1]) // stopped in front of the submarine
    expect(enemyIds(s)).toContain('sub')
    expect(s.events.some((e) => e.type === 'enemySighted' && /Tauchboot/.test(e.message))).toBe(
      true,
    )
    // now it can be attacked
    const attack = applyCommand(
      s,
      'p1',
      { type: 'attack', unitId: 'k', target: { unitId: 'sub' } },
      NOW,
    )
    expect(attack.combat).toBeDefined()
  })

  it('taucht zu Beginn des Zuges seines Besitzers wieder ab', () => {
    let s = scene(['k', 'kanonenboot', 'p1', 2, 1])
    s = applyCommand(s, 'p1', { type: 'move', unitId: 'k', target: { col: 5, row: 1 } }, NOW).state
    expect(enemyIds(s)).toContain('sub')
    s = endTurn(structuredClone(s), NOW) // p2's turn starts
    expect(enemyIds(s)).not.toContain('sub')
  })

  it('hinterlässt keine Spur in der Wiedergabe des Gegners', () => {
    const s = makeState({
      map: SEA,
      cities: [city('a', 'p1', 0, 0), city('b', 'p2', 0, 3)],
      units: [unit('k', 'kanonenboot', 'p1', 3, 2), unit('sub', 'tauchboot', 'p2', 6, 1)],
    })
    s.seat = 1
    const after = applyCommand(
      s,
      'p2',
      { type: 'move', unitId: 'sub', target: { col: 4, row: 1 } },
      NOW,
    ).state
    const entry = after.log.at(-1)!
    expect(entry.seenBy.p1).toBeUndefined()
  })
})

describe('KI: Geleitschutz und Träger', () => {
  const ISLANDS = ['..~~..', '..~~..', '..~~..', '..~~..']
  const production = (
    factionId: string,
    extra: Parameters<typeof unit>[] = [],
    difficulty: 'normal' | 'hard' = 'normal',
  ) => {
    const types = new Set<string>()
    for (let rng = 0; rng < 30; rng++) {
      const s = makeState({
        map: ISLANDS,
        participants: [participantState('p1', factionId), participantState('p2', 'nordmark')],
        cities: [city('home', 'p1', 1, 1), city('far', 'p2', 5, 1)],
        units: [
          unit('f', 'frachter', 'p1', 2, 1),
          ...[0, 1, 2, 3].map((i) => unit(`g${i}`, 'grenadiere', 'p1', 0, i)),
          ...extra.map((e) => unit(...e)),
        ],
      })
      s.participants[0]!.aiDifficulty = difficulty
      s.rng = rng
      types.add(
        playAITurn(s, 'p1', NOW, { profile: { maxTransports: 1 } }).cities[0]!.production!
          .unitTypeId,
      )
    }
    return types
  }

  it('Aurelia geleitet normal mit Kanonenbooten, die Korvette bleibt Sondereinheit', () => {
    const normal = production('aurelia')
    expect(normal).toContain('kanonenboot')
    expect(normal).not.toContain('blitzkorvette')
    expect(production('aurelia', [], 'hard')).toContain('blitzkorvette')
  })

  it('schwer baut einen Träger, sobald Bomber und Frachter unterwegs sind', () => {
    const types = production(
      'eisenbund',
      [
        ['k', 'kanonenboot', 'p1', 3, 2],
        ['b', 'schwerbomber', 'p1', 1, 1],
        ['b2', 'schwerbomber', 'p1', 1, 1],
      ],
      'hard',
    )
    expect(types).toContain('flugzeugtraeger')
    // one bomber is not a force worth a carrier
    expect(
      production(
        'eisenbund',
        [
          ['k', 'kanonenboot', 'p1', 3, 2],
          ['b', 'schwerbomber', 'p1', 1, 1],
        ],
        'hard',
      ),
    ).not.toContain('flugzeugtraeger')
    expect(production('eisenbund', [['k', 'kanonenboot', 'p1', 3, 2]], 'hard')).not.toContain(
      'flugzeugtraeger',
    )
  })
})
