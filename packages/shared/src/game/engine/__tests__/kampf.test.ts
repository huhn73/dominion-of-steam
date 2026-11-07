import { describe, expect, it } from 'vitest'
import {
  applyCommand,
  CommandError,
  combatChance,
  endTurn,
  type GameState,
  normalizeState,
  playAITurn,
  projectView,
} from '..'
import { UNIT_TYPES } from '../../catalog'
import { attackTargets, buildIndex } from '../../hex'
import { canAttack, canEnter, defenseModifiers, terrainDefense } from '../../rules'
import type { CombatResult } from '../../types'
import { unitType } from '../state'
import { city, makeState, participantState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-10-31T12:00:00Z')
const run = (state: GameState, playerId: string, cmd: Parameters<typeof applyCommand>[2]) =>
  applyCommand(state, playerId, cmd, NOW)
const unitOf = (state: GameState, id: string) => state.units.find((u) => u.id === id)
/** End p1's turn and let everybody else end theirs until p1 is on the move again */
function nextRound(state: GameState) {
  let s = endTurn(state, NOW)
  while (s.participants[s.seat]!.id !== 'p1') s = endTurn(s, NOW)
  return s
}
/** A distant opponent unit, so p2 is not eliminated */
const outpost = () => unit('far', 'grenadiere', 'p2', 7, 5)

function expectError(fn: () => unknown, code: string) {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(CommandError)
    expect((e as CommandError).code).toBe(code)
    return
  }
  throw new Error(`erwartet: ${code}`)
}

/** Targets p1's unit may attack, computed on p1's knowledge without server previews */
function targetsOf(state: GameState, unitId: string) {
  const view = projectView(state, 'p1', { previews: false })
  const idx = buildIndex(view.map, view.cities, view.units, UNIT_TYPES, 'p1')
  const u = view.units.find((x) => x.id === unitId)!
  return attackTargets(u, idx, view.units, view.cities, [])
}

/** The attacker won: the defender fell or the city changed hands */
const victory = (c: CombatResult) => c.defenderDestroyed || c.captured
const defeat = (c: CombatResult) => !victory(c)

/** Run the attack with increasing rng values until the wanted outcome occurs */
function attackUntil(
  build: () => GameState,
  cmd: Parameters<typeof applyCommand>[2],
  outcome: (c: CombatResult) => boolean,
) {
  for (let rng = 0; rng < 40; rng++) {
    const s = build()
    s.rng = rng
    const result = run(s, 'p1', cmd)
    if (outcome(result.combat!)) return result
  }
  throw new Error('Ausgang in 40 Versuchen nicht erreicht')
}

// Two columns of land on the left, open sea to the right
const COAST = ['..~~~~~~', '..~~~~~~', '..~~~~~~', '..~~~~~~', '........', '........']

describe('Kampfregeln: Domänen', () => {
  const t = (id: string) => unitType(id)

  it('erlaubt und verbietet Angriffe nach Domäne', () => {
    // Land
    expect(canAttack(t('panzerwagen'), 'land', 'plains', false)).toBe(true)
    expect(canAttack(t('panzerwagen'), 'sea', 'shallows', true)).toBe(true)
    expect(canAttack(t('panzerwagen'), 'air', 'plains', false)).toBe(true)
    expect(canAttack(t('panzerwagen'), 'air', 'deepSea', true)).toBe(false)
    // See
    expect(canAttack(t('panzerkreuzer'), 'sea', 'deepSea', false)).toBe(true)
    expect(canAttack(t('panzerkreuzer'), 'land', 'plains', true)).toBe(true)
    expect(canAttack(t('panzerkreuzer'), 'land', 'plains', false)).toBe(false)
    expect(canAttack(t('panzerkreuzer'), 'air', 'deepSea', false)).toBe(true)
    expect(canAttack(t('tauchboot'), 'sea', 'deepSea', false)).toBe(true)
    expect(canAttack(t('tauchboot'), 'air', 'deepSea', false)).toBe(false)
    expect(canAttack(t('tauchboot'), 'land', 'plains', true)).toBe(false)
    expect(canAttack(t('frachter'), 'sea', 'deepSea', false)).toBe(false)
    // Luft
    expect(canAttack(t('doppeldecker'), 'land', 'mountains', false)).toBe(true)
    expect(canAttack(t('doppeldecker'), 'sea', 'deepSea', false)).toBe(true)
    expect(canAttack(t('doppeldecker'), 'air', 'deepSea', false)).toBe(true)
  })

  it('lässt Panzer Schiffe direkt vor der Küste angreifen, nicht auf offener See', () => {
    const s = makeState({
      map: COAST,
      units: [
        unit('a', 'panzerwagen', 'p1', 1, 1),
        unit('near', 'kanonenboot', 'p2', 2, 1),
        unit('far', 'kanonenboot', 'p2', 5, 1),
      ],
    })
    expect(targetsOf(s, 'a').map((x) => x.unitId)).toEqual(['near'])
  })

  it('lässt Grenadiere Flugzeuge nur über Land angreifen', () => {
    const over = (col: number) =>
      makeState({
        map: COAST,
        units: [unit('a', 'grenadiere', 'p1', 1, 2), unit('f', 'doppeldecker', 'p2', col, 2)],
      })
    expect(targetsOf(over(0), 'a').map((x) => x.unitId)).toEqual(['f'])
    expect(targetsOf(over(2), 'a')).toEqual([])
  })

  it('lässt Schiffe die Küste beschießen, Tauchboote nur Schiffe', () => {
    const s = makeState({
      map: COAST,
      units: [
        unit('k', 'kanonenboot', 'p1', 2, 1, { movesLeft: 1 }),
        unit('t', 'tauchboot', 'p1', 2, 3, { movesLeft: 1 }),
        unit('g', 'grenadiere', 'p2', 1, 1),
        unit('g2', 'grenadiere', 'p2', 1, 3),
        unit('f', 'doppeldecker', 'p2', 3, 3),
        unit('b', 'kanonenboot', 'p2', 3, 2),
      ],
    })
    expect(
      targetsOf(s, 'k')
        .map((x) => x.unitId)
        .sort(),
    ).toEqual(['b', 'g'])
    expect(targetsOf(s, 't').map((x) => x.unitId)).toEqual(['b'])
    expectError(
      () => run(s, 'p1', { type: 'attack', unitId: 't', target: { unitId: 'f' } }),
      'INVALID_TARGET',
    )
  })

  it('hält die KI an dieselben Regeln', () => {
    const s = makeState({
      map: COAST,
      units: [unit('t', 'tauchboot', 'p1', 3, 1), unit('f', 'doppeldecker', 'p2', 4, 1), outpost()],
    })
    s.participants[0]!.isAI = true
    s.participants[0]!.aiDifficulty = 'hard'
    const after = playAITurn(s, 'p1', NOW)
    expect(unitOf(after, 'f')).toBeDefined()
    expect(after.log.filter((l) => l.action === 'attack')).toEqual([])
  })
})

describe('Kampfregeln: Nachrücken', () => {
  it('rückt nach dem Sieg auf das Feld des Verlierers; der Angriff kostet einen Zug', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          outpost(),
        ],
      })
    const { state, combat } = attackUntil(
      build,
      { type: 'attack', unitId: 'a', target: { unitId: 'd' } },
      victory,
    )
    expect(combat).toMatchObject({ advanced: true })
    expect(combat!.message).toContain('Rückt nach.')
    expect(unitOf(state, 'a')).toMatchObject({ col: 2, row: 1, movesLeft: 1 })
    expect(state.log.at(-1)!.path.at(-1)).toMatchObject({ col: 2, row: 1 })
  })

  it('bleibt stehen, wenn das Feld nicht betretbar ist', () => {
    const build = () =>
      makeState({
        map: COAST,
        units: [
          unit('a', 'panzerwagen', 'p1', 1, 1),
          unit('b', 'kanonenboot', 'p2', 2, 1),
          outpost(),
        ],
      })
    const { state, combat } = attackUntil(
      build,
      { type: 'attack', unitId: 'a', target: { unitId: 'b' } },
      victory,
    )
    expect(combat).toMatchObject({ advanced: false })
    expect(unitOf(state, 'a')).toMatchObject({ col: 1, row: 1 })
  })

  it('bleibt stehen, wenn weitere Gegner auf dem Feld stehen', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          unit('d2', 'grenadiere', 'p2', 2, 1),
        ],
      })
    const { state } = attackUntil(
      build,
      { type: 'attack', unitId: 'a', target: { unitId: 'd' } },
      victory,
    )
    expect(unitOf(state, 'a')).toMatchObject({ col: 1, row: 1 })
    expect(unitOf(state, 'd2')).toBeDefined()
  })

  it('rückt nicht in eine fremde Stadt ein; die bleibt ein eigener Angriff', () => {
    const build = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('a', 'panzerwagen', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          outpost(),
        ],
        cities: [city('c', 'p2', 2, 1)],
      })
    const { state } = attackUntil(
      build,
      { type: 'attack', unitId: 'a', target: { unitId: 'd' } },
      victory,
    )
    expect(unitOf(state, 'a')).toMatchObject({ col: 1, row: 1 })
    expect(state.cities[0]).toMatchObject({ ownerId: 'p2' })
  })

  it('nimmt die Ladung mit und kostet Flugzeuge Treibstoff', () => {
    const carrier = () =>
      makeState({
        map: COAST,
        units: [
          unit('t', 'flugzeugtraeger', 'p1', 3, 1, { cargoUnitIds: ['f'] }),
          unit('f', 'doppeldecker', 'p1', 3, 1, { carriedBy: 't', movesLeft: 0 }),
          unit('b', 'kanonenboot', 'p2', 4, 1),
          outpost(),
        ],
      })
    const { state } = attackUntil(
      carrier,
      { type: 'attack', unitId: 't', target: { unitId: 'b' } },
      victory,
    )
    expect(unitOf(state, 't')).toMatchObject({ col: 4, row: 1 })
    expect(unitOf(state, 'f')).toMatchObject({ col: 4, row: 1, carriedBy: 't' })

    const plane = () =>
      makeState({
        map: PLAINS,
        units: [
          unit('p', 'doppeldecker', 'p1', 1, 1),
          unit('d', 'grenadiere', 'p2', 2, 1),
          outpost(),
        ],
      })
    const flown = attackUntil(
      plane,
      { type: 'attack', unitId: 'p', target: { unitId: 'd' } },
      victory,
    )
    // One fuel for the attack, one for advancing
    expect(unitOf(flown.state, 'p')).toMatchObject({ col: 2, row: 1, fuel: 10 })
  })

  it('kennt die betretbaren Felder je Domäne', () => {
    expect(canEnter(unitType('grenadiere'), 'deepSea')).toBe(false)
    expect(canEnter(unitType('kanonenboot'), 'plains')).toBe(false)
    expect(canEnter(unitType('doppeldecker'), 'deepSea')).toBe(true)
  })
})

describe('Kampfregeln: Gelände- und Stadtbonus', () => {
  // Row 1: plains, forest, hills, mountains next to each other
  const TERRAIN = ['........', '.fhm....', '........', '........', '........', '........']
  const duel = (col: number, defender = 'grenadiere', factionId = 'aurelia') =>
    makeState({
      map: TERRAIN,
      units: [unit('a', 'panzerwagen', 'p1', 0, 1), unit('d', defender, 'p2', col, 1)],
      participants: [participantState('p1', 'eisenbund'), participantState('p2', factionId)],
    })

  it('erhöht die Abwehr von Landeinheiten im Gelände', () => {
    expect(terrainDefense(unitType('grenadiere'), 'forest')).toBe(1)
    expect(terrainDefense(unitType('grenadiere'), 'mountains')).toBe(2)
    expect(terrainDefense(unitType('kanonenboot'), 'shallows')).toBe(0)
    expect(combatChance(duel(1), 'a', { unitId: 'd' })).toBeCloseTo(4 / 7) // Wald +1
    expect(combatChance(duel(2), 'a', { unitId: 'd' })).toBeCloseTo(4 / 7) // Hügel +1
    expect(combatChance(duel(3), 'a', { unitId: 'd' })).toBeCloseTo(4 / 8) // Gebirge +2
  })

  it('gibt Flugzeugen keinen Geländebonus', () => {
    expect(combatChance(duel(3, 'doppeldecker'), 'a', { unitId: 'd' })).toBeCloseTo(4 / 5)
  })

  it('addiert Stadt, Gelände und Befestigung', () => {
    const s = duel(2)
    s.cities.push(city('c', 'p2', 2, 1))
    expect(combatChance(s, 'a', { unitId: 'd' })).toBeCloseTo(4 / 8) // Hügel +1, Stadt +1
    const salz = duel(2, 'grenadiere', 'salzkueste')
    salz.cities.push(city('c', 'p2', 2, 1))
    expect(combatChance(salz, 'a', { unitId: 'd' })).toBeCloseTo(4 / 9) // + Befestigung
  })

  it('zeigt dieselbe Siegchance ohne Server-Vorschau an', () => {
    const s = makeState({
      map: TERRAIN,
      units: [unit('a', 'panzerwagen', 'p1', 1, 1), unit('d', 'grenadiere', 'p2', 2, 1)],
      cities: [city('c', 'p2', 2, 1)],
    })
    const [t] = targetsOf(s, 'a')
    expect(t!.odds.hitChance).toBeCloseTo(combatChance(s, 'a', { unitId: 'd' }))
    expect(defenseModifiers(unitType('grenadiere'), 'hills', true)).toEqual([
      { label: 'game.terrain.hills', value: 1 },
      { label: 'game.city', value: 1 },
    ])
    expect(defenseModifiers(unitType('kanonenboot'), 'shallows', false)).toEqual([])
  })
})

describe('Kampfregeln: Städte unter Beschuss', () => {
  const PROD = { unitTypeId: 'grenadiere', progress: 1, turnsRemaining: 2 }
  const siege = (defended: boolean) => () =>
    makeState({
      map: PLAINS,
      units: [
        unit('a', 'panzerwagen', 'p1', 1, 1),
        ...(defended ? [unit('d', 'dampfkoloss', 'p2', 2, 1)] : []),
        outpost(),
      ],
      cities: [city('c', 'p2', 2, 1, { production: { ...PROD } })],
    })

  it('verzögert die Produktion bei jedem Angriff auf die Stadt, auch wenn er scheitert', () => {
    const lost = attackUntil(
      siege(false),
      { type: 'attack', unitId: 'a', target: { cityId: 'c' } },
      defeat,
    )
    expect(lost.state.cities[0]).toMatchObject({
      ownerId: 'p2',
      damage: 1,
      underFire: true,
      production: { ...PROD, turnsRemaining: 3 },
    })
    expect(lost.state.events.find((e) => e.participantId === 'p2')!.message).toContain(
      'Produktion verzögert',
    )
    const won = attackUntil(
      siege(false),
      { type: 'attack', unitId: 'a', target: { cityId: 'c' } },
      victory,
    )
    expect(won.state.cities[0]).toMatchObject({ ownerId: 'p1', damage: 1, underFire: false })
  })

  it('zählt auch Angriffe auf Verteidiger in der Stadt', () => {
    const r = attackUntil(
      siege(true),
      { type: 'attack', unitId: 'a', target: { unitId: 'd' } },
      defeat,
    )
    expect(r.state.cities[0]).toMatchObject({ damage: 1, production: { turnsRemaining: 3 } })
    expect(r.state.events.find((e) => e.participantId === 'p2')!.message).toContain(
      'Produktion verzögert',
    )
  })

  it('deckelt den Schaden bei 3', () => {
    // Four attackers around the city; the defender is replaced whenever it falls
    let s = makeState({
      map: PLAINS,
      units: [
        unit('a1', 'grenadiere', 'p1', 2, 2),
        unit('a2', 'grenadiere', 'p1', 4, 2),
        unit('a3', 'grenadiere', 'p1', 2, 1),
        unit('a4', 'grenadiere', 'p1', 3, 1),
        unit('d', 'dampfkoloss', 'p2', 3, 2),
        outpost(),
      ],
      cities: [city('c', 'p2', 3, 2, { production: { ...PROD } })],
    })
    for (const id of ['a1', 'a2', 'a3', 'a4']) {
      s = run(s, 'p1', { type: 'attack', unitId: id, target: { unitId: 'd' } }).state
      if (!unitOf(s, 'd')) s.units.push(unit('d', 'dampfkoloss', 'p2', 3, 2))
    }
    expect(s.cities[0]).toMatchObject({ damage: 3, production: { turnsRemaining: 6 } })
  })

  it('erholt sich nur in ruhigen Runden', () => {
    let s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 0, 0), outpost()],
      cities: [city('c', 'p1', 1, 1, { damage: 2, underFire: true })],
    })
    s = nextRound(s)
    expect(s.cities[0]).toMatchObject({ damage: 2, underFire: false })
    s = nextRound(s)
    expect(s.cities[0]).toMatchObject({ damage: 1 })
    s = nextRound(s)
    s = nextRound(s)
    expect(s.cities[0]).toMatchObject({ damage: 0 })
  })

  it('verlängert neue und automatisch neu gestartete Bauaufträge um den Schaden', () => {
    let s = makeState({
      map: PLAINS,
      units: [outpost()],
      cities: [city('c', 'p1', 1, 1, { damage: 2 })],
    })
    // Grenadiere 4 Runden (der Eisenbund-Bonus gilt erst ab fünf), plus 2 Schaden
    s = run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'grenadiere' }).state
    expect(s.cities[0]!.production).toMatchObject({ turnsRemaining: 6 })

    s.cities[0]!.production = { unitTypeId: 'grenadiere', progress: 4, turnsRemaining: 1 }
    s = nextRound(s) // heals to 1, finishes the unit and restarts at 4 + 1
    expect(s.units.filter((u) => u.ownerId === 'p1' && u.unitTypeId === 'grenadiere')).toHaveLength(
      1,
    )
    expect(s.cities[0]).toMatchObject({ damage: 1, production: { progress: 0, turnsRemaining: 5 } })
  })

  it('ergänzt alte Spielstände um die neuen Felder', () => {
    const s = makeState({ map: PLAINS, cities: [city('c', 'p1', 1, 1)] })
    const old = s.cities[0] as Partial<(typeof s.cities)[0]>
    delete old.damage
    delete old.underFire
    expect(normalizeState(s).cities[0]).toMatchObject({ damage: 0, underFire: false })
  })

  it('zeigt den Schaden nur für sichtbare Städte', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 0, 1), outpost()],
      cities: [city('near', 'p2', 1, 1, { damage: 2 }), city('far', 'p2', 6, 4, { damage: 2 })],
    })
    const view = projectView(s, 'p1')
    expect(view.cities.find((c) => c.id === 'near')).toMatchObject({ damage: 2 })
    expect(view.cities.find((c) => c.id === 'far')).toMatchObject({ damage: 0 })
    expect('underFire' in view.cities[0]!).toBe(false)
  })
})
