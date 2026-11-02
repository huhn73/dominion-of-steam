import { visibilityAt } from '../../mapcodec'
import { describe, expect, it } from 'vitest'
import {
  applyCommand,
  CommandError,
  combatChance,
  endTurn,
  projectView,
  seedDemo,
  type GameState,
} from '..'
import { city, makeState, participantState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-10-30T12:00:00Z')
const run = (state: GameState, playerId: string, cmd: Parameters<typeof applyCommand>[2]) =>
  applyCommand(state, playerId, cmd, NOW).state
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

describe('Zugrecht und Phasen', () => {
  it('lehnt Befehle ab, wenn der Spieler nicht am Zug ist', () => {
    const s = makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p2', 1, 1)] })
    expectError(
      () => run(s, 'p2', { type: 'move', unitId: 'a', target: { col: 2, row: 1 } }),
      'NOT_YOUR_TURN',
    )
  })

  it('sperrt Aktionen während der Wiederholung, bis sie übersprungen wurde', () => {
    const s = makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p1', 1, 1)] })
    s.phase = 'replay'
    expectError(
      () => run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 2, row: 1 } }),
      'REPLAY_ACTIVE',
    )
    const after = run(s, 'p1', { type: 'skipReplay' })
    expect(after.phase).toBe('yourTurn')
  })

  it('verändert den Eingangszustand nicht', () => {
    const s = makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p1', 1, 1)] })
    run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 2, row: 1 } })
    expect(unitOf(s, 'a')).toMatchObject({ col: 1, row: 1 })
  })
})

describe('Bewegung', () => {
  it('bewegt eine Einheit in Reichweite und verbraucht Bewegung', () => {
    const s = run(makeState({ map: PLAINS, units: [unit('a', 'panzerwagen', 'p1', 1, 1)] }), 'p1', {
      type: 'move',
      unitId: 'a',
      target: { col: 3, row: 1 },
    })
    expect(unitOf(s, 'a')).toMatchObject({ col: 3, row: 1, movesLeft: 0, needsOrders: false })
  })

  it('lehnt Ziele außerhalb der Reichweite, unerforschte Felder und Wasser für Landeinheiten ab', () => {
    const s = makeState({
      map: ['...~....', '........'],
      units: [unit('a', 'panzerwagen', 'p1', 2, 1)],
      unexplored: ['0,1'],
    })
    expectError(
      () => run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 5, row: 1 } }),
      'UNREACHABLE',
    )
    expectError(
      () => run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 0, row: 1 } }),
      'UNREACHABLE',
    )
    expectError(
      () => run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 3, row: 0 } }),
      'UNREACHABLE',
    )
  })

  it('lässt fremde Einheiten nicht bewegen', () => {
    const s = makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p2', 1, 1)] })
    expectError(
      () => run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 2, row: 1 } }),
      'NOT_YOURS',
    )
  })

  it('stoppt vor einem verborgenen Feind und meldet ihn', () => {
    // Panzerwagen sieht nur 1 Feld weit; der Feind steht auf dem zweiten Feld des Pfads … aber hinter Sichtweite
    const s0 = makeState({
      map: ['........'],
      units: [unit('a', 'panzerwagen', 'p1', 0, 0), unit('e', 'grenadiere', 'p2', 2, 0)],
    })
    // Gegner unsichtbar machen: Sicht hängt an Einheiten, Feld 2 ist nicht in Sichtweite von (0,0)
    expect(projectView(s0, 'p1').units.some((u) => u.id === 'e')).toBe(false)
    const s = applyCommand(
      s0,
      'p1',
      { type: 'goto', unitId: 'a', target: { col: 4, row: 0 } },
      NOW,
    ).state
    expect(unitOf(s, 'a')).toMatchObject({ col: 1, row: 0, order: { type: 'none' } })
    expect(s.events.at(-1)).toMatchObject({ type: 'enemySighted', participantId: 'p1' })
  })

  it('setzt einen Marschbefehl, zieht sofort los und kommt über mehrere Runden an', () => {
    let s = makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p1', 0, 0), outpost()] })
    s = run(s, 'p1', { type: 'goto', unitId: 'a', target: { col: 3, row: 0 } })
    expect(unitOf(s, 'a')).toMatchObject({
      col: 1,
      row: 0,
      order: { type: 'goto', turnsRemaining: 2 },
      needsOrders: false,
    })
    s = nextRound(s)
    expect(s.round).toBe(2)
    expect(unitOf(s, 'a')).toMatchObject({
      col: 2,
      row: 0,
      order: { type: 'goto', turnsRemaining: 1 },
    })
    s = nextRound(s)
    expect(unitOf(s, 'a')).toMatchObject({
      col: 3,
      row: 0,
      order: { type: 'none' },
      needsOrders: false,
      movesLeft: 0,
    })
  })
})

describe('Transport', () => {
  const coast = ['..~~~~..', '..~~~~..']
  it('lädt Landeinheiten auf einen Frachter, nimmt sie mit und lädt sie aus', () => {
    let s = makeState({
      map: coast,
      units: [unit('t', 'frachter', 'p1', 2, 0), unit('g', 'grenadiere', 'p1', 1, 0), outpost()],
    })
    s = run(s, 'p1', { type: 'move', unitId: 'g', target: { col: 2, row: 0 } })
    expect(unitOf(s, 'g')).toMatchObject({ carriedBy: 't', movesLeft: 0 })
    expect(unitOf(s, 't')!.cargoUnitIds).toEqual(['g'])

    s = run(s, 'p1', { type: 'move', unitId: 't', target: { col: 5, row: 0 } })
    expect(unitOf(s, 'g')).toMatchObject({ col: 5, row: 0 })

    // nächste Runde ausladen
    s = nextRound(s)
    expectError(
      () => run(s, 'p1', { type: 'unload', unitId: 'g', target: { col: 4, row: 0 } }),
      'INVALID_TARGET',
    )
    s = run(s, 'p1', { type: 'unload', unitId: 'g', target: { col: 6, row: 0 } })
    expect(unitOf(s, 'g')).toMatchObject({ col: 6, row: 0, carriedBy: null, movesLeft: 0 })
    expect(unitOf(s, 't')!.cargoUnitIds).toEqual([])
  })

  it('lässt Flugzeuge auf dem Träger landen und wieder starten', () => {
    let s = makeState({
      map: coast,
      units: [
        unit('c', 'flugzeugtraeger', 'p1', 3, 0),
        unit('f', 'doppeldecker', 'p1', 0, 0),
        outpost(),
      ],
    })
    s = run(s, 'p1', { type: 'move', unitId: 'f', target: { col: 3, row: 0 } })
    expect(unitOf(s, 'f')).toMatchObject({ carriedBy: 'c', fuel: 9 })
    s = nextRound(s)
    expect(unitOf(s, 'f')).toMatchObject({ fuel: 12, needsOrders: false })
    s = run(s, 'p1', { type: 'move', unitId: 'f', target: { col: 5, row: 1 } })
    expect(unitOf(s, 'f')).toMatchObject({ carriedBy: null, col: 5, row: 1 })
    expect(unitOf(s, 'c')!.cargoUnitIds).toEqual([])
  })

  it('lässt Flugzeuge ohne Treibstoff außerhalb einer Basis abstürzen', () => {
    let s = makeState({
      map: PLAINS,
      units: [unit('f', 'doppeldecker', 'p1', 0, 0, { fuel: 2 }), outpost()],
    })
    s = run(s, 'p1', { type: 'move', unitId: 'f', target: { col: 2, row: 0 } })
    expect(unitOf(s, 'f')!.fuel).toBe(0)
    s = endTurn(s, NOW)
    expect(unitOf(s, 'f')).toBeUndefined()
    expect(s.events.some((e) => e.type === 'unitLost' && e.participantId === 'p1')).toBe(true)
  })
})

describe('Stehende Befehle', () => {
  it('weckt eine Wache, wenn ein Feind in Sicht kommt', () => {
    let s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 2, 2), unit('e', 'panzerwagen', 'p2', 5, 2)],
    })
    s = run(s, 'p1', { type: 'sentry', unitId: 'a' })
    s = endTurn(s, NOW)
    s = run(s, 'p2', { type: 'move', unitId: 'e', target: { col: 3, row: 2 } })
    s = endTurn(s, NOW)
    expect(unitOf(s, 'a')).toMatchObject({ order: { type: 'none' }, needsOrders: true })
    expect(s.events.some((e) => e.type === 'enemySighted' && e.participantId === 'p1')).toBe(true)
  })

  it('patrouilliert zwischen Wegpunkten', () => {
    let s = makeState({ map: PLAINS, units: [unit('a', 'panzerwagen', 'p1', 0, 0), outpost()] })
    expectError(
      () => run(s, 'p1', { type: 'patrol', unitId: 'a', waypoints: [{ col: 0, row: 0 }] }),
      'INVALID_ORDER',
    )
    s = run(s, 'p1', {
      type: 'patrol',
      unitId: 'a',
      waypoints: [
        { col: 0, row: 0 },
        { col: 2, row: 0 },
      ],
    })
    s = nextRound(s)
    expect(unitOf(s, 'a')).toMatchObject({ col: 2, row: 0, order: { type: 'patrol' } })
    s = nextRound(s)
    expect(unitOf(s, 'a')).toMatchObject({ col: 0, row: 0 })
  })

  it('hebt Befehle auf und überspringt Einheiten für eine Runde', () => {
    let s = makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p1', 0, 0), outpost()] })
    s = run(s, 'p1', { type: 'sentry', unitId: 'a' })
    s = run(s, 'p1', { type: 'cancelOrder', unitId: 'a' })
    expect(unitOf(s, 'a')).toMatchObject({ order: { type: 'none' }, needsOrders: true })
    s = run(s, 'p1', { type: 'skip', unitId: 'a' })
    expect(unitOf(s, 'a')!.needsOrders).toBe(false)
    s = nextRound(s)
    expect(unitOf(s, 'a')!.needsOrders).toBe(true)
  })
})

describe('Kampf', () => {
  const setup = (rng: number) => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 1, 1), unit('d', 'grenadiere', 'p2', 2, 1)],
    })
    s.rng = rng
    return s
  }

  it('berechnet die Trefferchance aus Stärke und Abwehr, unabhängig vom Zustand', () => {
    const s = setup(0)
    expect(combatChance(s, 'a', { unitId: 'd' })).toBeCloseTo(4 / 6)
    unitOf(s, 'a')!.hp = 1
    expect(combatChance(s, 'a', { unitId: 'd' })).toBeCloseTo(4 / 6)
  })

  it('ist reproduzierbar und kämpft, bis eine Seite vernichtet ist', () => {
    const outcomes = new Set<string>()
    for (let rng = 0; rng < 40; rng++) {
      const first = applyCommand(
        setup(rng),
        'p1',
        { type: 'attack', unitId: 'a', target: { unitId: 'd' } },
        NOW,
      )
      const again = applyCommand(
        setup(rng),
        'p1',
        { type: 'attack', unitId: 'a', target: { unitId: 'd' } },
        NOW,
      )
      expect(again.combat).toEqual(first.combat)
      const c = first.combat!
      expect(c.attackerDestroyed).not.toBe(c.defenderDestroyed)
      outcomes.add(c.defenderDestroyed ? 'victory' : 'defeat')
      if (c.defenderDestroyed) {
        // Grenadiers fall at the first hit; the tank may have taken one before
        expect(c.hits.at(-1)).toBe('attacker')
        expect(c.hits.length).toBeLessThanOrEqual(2)
        expect(unitOf(first.state, 'd')).toBeUndefined()
        expect(unitOf(first.state, 'a')).toMatchObject({
          hp: 2 - c.attackerDamage,
          movesLeft: 1,
        })
      } else {
        expect(c.hits).toEqual(['defender', 'defender'])
        expect(unitOf(first.state, 'a')).toBeUndefined()
        expect(unitOf(first.state, 'd')!.hp).toBe(1)
      }
    }
    expect(outcomes).toEqual(new Set(['victory', 'defeat']))
  })

  it('lehnt Ziele außer Reichweite ab', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 0, 0), unit('d', 'grenadiere', 'p2', 0, 4)],
    })
    s.units.push(unit('scout', 'doppeldecker', 'p1', 0, 3))
    expectError(
      () => run(s, 'p1', { type: 'attack', unitId: 'a', target: { unitId: 'd' } }),
      'INVALID_TARGET',
    )
  })

  it('erobert eine leere Stadt, setzt die Produktion zurück und meldet es beiden Seiten', () => {
    for (let rng = 0; rng < 20; rng++) {
      const s = makeState({
        map: PLAINS,
        units: [unit('a', 'panzerwagen', 'p1', 1, 1)],
        cities: [
          city('c', 'p2', 2, 1, {
            production: { unitTypeId: 'grenadiere', progress: 2, turnsRemaining: 2 },
          }),
        ],
      })
      s.rng = rng
      const { state, combat } = applyCommand(
        s,
        'p1',
        { type: 'attack', unitId: 'a', target: { cityId: 'c' } },
        NOW,
      )
      if (!combat!.captured) continue
      expect(state.cities[0]).toMatchObject({ ownerId: 'p1', production: null })
      // The tank is spent; undamaged, it leaves grenadiers behind
      expect(unitOf(state, 'a')).toBeUndefined()
      expect(unitOf(state, combat!.garrisonUnitId!)).toMatchObject({
        unitTypeId: 'grenadiere',
        ownerId: 'p1',
        col: 2,
        row: 1,
        hp: 1,
        movesLeft: 0,
        needsOrders: false,
      })
      expect(state.events.map((e) => [e.participantId, e.type])).toEqual([
        ['p1', 'cityCaptured'],
        ['p2', 'cityLost'],
      ])
      expect(state.log.at(-1)).toMatchObject({ action: 'capture' })
      return
    }
    throw new Error('kein Sieg in 20 Versuchen')
  })

  it('verstärkt Städte der Salzküsten-Liga', () => {
    const s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 1, 1)],
      cities: [city('c', 'p2', 2, 1)],
      participants: [participantState('p1', 'eisenbund'), participantState('p2', 'salzkueste')],
    })
    expect(combatChance(s, 'a', { cityId: 'c' })).toBeCloseTo(4 / 6)
  })
})

describe('Produktion', () => {
  it('rechnet den Fraktionsbonus ein und baut die Einheit fertig', () => {
    let s = makeState({ map: PLAINS, cities: [city('c', 'p1', 2, 2)], units: [outpost()] })
    // Eisenbund: Panzerwagen 7 − 1 = 6, Grenadiere bleiben bei 4 (Bonus erst ab fünf Runden)
    s = run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'panzerwagen' })
    expect(s.cities[0]!.production).toMatchObject({ unitTypeId: 'panzerwagen', turnsRemaining: 6 })
    s = run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'grenadiere' })
    expect(s.cities[0]!.production).toEqual({
      unitTypeId: 'grenadiere',
      progress: 0,
      turnsRemaining: 4,
    })
    // gleicher Typ erneut: Fortschritt bleibt
    s.cities[0]!.production!.progress = 1
    s = run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'grenadiere' })
    expect(s.cities[0]!.production!.progress).toBe(1)
    s.cities[0]!.production = { unitTypeId: 'grenadiere', progress: 0, turnsRemaining: 4 }
    for (let i = 0; i < 4; i++) s = nextRound(s)
    expect(s.units.filter((u) => u.unitTypeId === 'grenadiere' && u.ownerId === 'p1')).toHaveLength(
      1,
    )
    expect(s.events.find((e) => e.type === 'unitBuilt')).toMatchObject({
      participantId: 'p1',
      col: 2,
      row: 2,
    })
    expect(s.cities[0]!.production).toMatchObject({ progress: 0, turnsRemaining: 4 })
  })

  it('baut Seeeinheiten nur an der Küste und Sondereinheiten nur für die eigene Fraktion', () => {
    const s = makeState({ map: PLAINS, cities: [city('c', 'p1', 2, 2)] })
    expectError(
      () => run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'kanonenboot' }),
      'NOT_BUILDABLE',
    )
    expectError(
      () => run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'blitzkorvette' }),
      'NOT_BUILDABLE',
    )
    expect(() =>
      run(s, 'p1', { type: 'setProduction', cityId: 'c', unitTypeId: 'dampfkoloss' }),
    ).not.toThrow()
  })
})

describe('Zugfolge', () => {
  it('reiht Teilnehmer nacheinander, überspringt Ausgeschiedene und zählt Runden', () => {
    let s = makeState({
      map: PLAINS,
      units: [unit('a', 'grenadiere', 'p1', 0, 0), unit('b', 'grenadiere', 'p3', 7, 5)],
      participants: [
        participantState('p1', 'eisenbund'),
        participantState('p2', 'aurelia', { status: 'eliminated' }),
        participantState('p3', 'nordmark'),
      ],
    })
    s = endTurn(s, NOW)
    expect(s.participants[s.seat]!.id).toBe('p3')
    expect(s.round).toBe(1)
    s = endTurn(s, NOW)
    expect(s.participants[s.seat]!.id).toBe('p1')
    expect(s.round).toBe(2)
  })

  it('beendet die Partie, wenn nur noch ein Teilnehmer übrig ist', () => {
    const s = endTurn(makeState({ map: PLAINS, units: [unit('a', 'grenadiere', 'p1', 0, 0)] }), NOW)
    expect(s.participants[1]!.status).toBe('eliminated')
    expect(s.status).toBe('finished')
  })

  it('setzt bei asynchronen Partien eine Frist', () => {
    const s = endTurn(
      makeState({
        map: PLAINS,
        mode: 'async',
        units: [unit('a', 'grenadiere', 'p1', 0, 0), unit('b', 'grenadiere', 'p2', 7, 5)],
      }),
      NOW,
    )
    expect(s.turnDeadline).toBe('2026-11-01T12:00:00.000Z')
  })

  it('zeigt dem nächsten Spieler sichtbare Gegneraktionen als Wiederholung', () => {
    let s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 0, 1), unit('b', 'grenadiere', 'p2', 3, 2)],
    })
    s = run(s, 'p1', { type: 'move', unitId: 'a', target: { col: 2, row: 2 } })
    s = endTurn(s, NOW)
    expect(s.phase).toBe('replay')
    const view = projectView(s, 'p2')
    expect(view.match.phase).toBe('replay')
    expect(view.replay).toHaveLength(1)
    expect(view.replay[0]).toMatchObject({
      participantId: 'p1',
      action: 'move',
      unitTypeId: 'panzerwagen',
    })
    expect(projectView(s, 'p1').match.phase).toBe('waiting')
  })
})

describe('Kriegsnebel in der Spielersicht', () => {
  const demo = seedDemo('demo', NOW)
  const view = projectView(demo, 'p1')

  it('enthält keine Feinde außerhalb der Sicht und keine Städte auf unerforschten Feldern', () => {
    for (const u of view.units.filter((u) => u.ownerId !== 'p1'))
      expect(visibilityAt(view.map, u)).toBe('visible')
    for (const c of view.cities) expect(visibilityAt(view.map, c)).not.toBe('unexplored')
    expect(view.cities.some((c) => c.name === 'Frostheim')).toBe(false)
  })

  it('zeigt fremde Produktion nicht', () => {
    for (const c of view.cities.filter((c) => c.ownerId !== 'p1')) expect(c.production).toBeNull()
  })

  it('startet die Demo mit der Wiederholung und den neuen Ereignissen', () => {
    expect(view.match).toMatchObject({ phase: 'replay', round: 14, youId: 'p1' })
    expect(view.replay).toHaveLength(4)
    expect(view.events).toHaveLength(8)
    expect(view.events.filter((e) => e.isNew)).toHaveLength(7)
    expect(view.combatPreviews.length).toBeGreaterThan(0)
  })

  it('liefert Lena Hartmann eine eigene Sicht mit ihrer Hauptstadt', () => {
    const lena = projectView(demo, 'p3')
    expect(lena.match.phase).toBe('waiting')
    expect(lena.cities.map((c) => c.name)).toContain('Frostheim')
    expect(lena.units.some((u) => u.ownerId === 'p1' && u.cargoUnitIds.length)).toBe(false)
  })
})

describe('Demo mit Spieler-IDs', () => {
  const mapping = { p1: 'spieler-bjoern', p3: 'spieler-lena' }
  const plain = seedDemo('demo', NOW)
  const mapped = seedDemo('demo', NOW, mapping)

  it('ersetzt die Teilnehmer-IDs überall im Zustand', () => {
    expect(mapped.participants.map((p) => p.id)).toEqual([
      'spieler-bjoern',
      'p2',
      'spieler-lena',
      'p4',
    ])
    const json = JSON.stringify(mapped)
    expect(json).not.toMatch(/"p1"|"p3"/)
    expect(mapped.units.filter((u) => u.ownerId === 'spieler-bjoern')).toHaveLength(
      plain.units.filter((u) => u.ownerId === 'p1').length,
    )
    expect(mapped.cities.find((c) => c.name === 'Frostheim')!.ownerId).toBe('spieler-lena')
    expect(mapped.events.every((e) => e.participantId === 'spieler-bjoern')).toBe(true)
    expect(mapped.log.every((l) => 'spieler-bjoern' in l.seenBy)).toBe(true)
  })

  it('liefert dieselben Sichten wie mit den Beispiel-IDs', () => {
    const swap = (v: unknown) =>
      JSON.parse(
        JSON.stringify(v)
          .replaceAll('"spieler-bjoern"', '"p1"')
          .replaceAll('"spieler-lena"', '"p3"'),
      )
    expect(swap(projectView(mapped, 'spieler-bjoern'))).toEqual(projectView(plain, 'p1'))
    expect(swap(projectView(mapped, 'spieler-lena'))).toEqual(projectView(plain, 'p3'))
  })

  it('lässt den Zustand ohne Zuordnung unverändert', () => {
    expect(seedDemo('demo', NOW, {})).toEqual(plain)
  })
})
