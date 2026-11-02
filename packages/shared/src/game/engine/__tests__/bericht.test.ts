import { describe, expect, it } from 'vitest'
import { endTurn, type GameState, normalizeState } from '..'
import { city, makeState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-10-31T12:00:00Z')
const eventsFor = (s: GameState, id: string, type?: string) =>
  s.events.filter((e) => e.participantId === id && (!type || e.type === type))
/** A distant opponent unit, so p2 is not eliminated and p1 sees nothing of it */
const outpost = () => unit('far', 'grenadiere', 'p2', 7, 5)

/** p1 ends the turn; `during` plays p2's turn; then p1's next turn starts */
function nextRound(state: GameState, during: (s: GameState) => void = () => undefined) {
  const s = endTurn(state, NOW)
  expect(s.participants[s.seat]!.id).toBe('p2')
  during(s)
  const back = endTurn(s, NOW)
  expect(back.participants[back.seat]!.id).toBe('p1')
  return back
}

describe('Schnappschuss am Zugende', () => {
  it('merkt sich bekannte Städte und sichtbare fremde Einheiten', () => {
    const state = makeState({
      map: PLAINS,
      units: [
        unit('g1', 'grenadiere', 'p1', 1, 1),
        unit('e1', 'grenadiere', 'p2', 2, 1),
        outpost(),
      ],
      cities: [city('c1', 'p1', 0, 0), city('c2', 'p2', 6, 5)],
    })
    const s = endTurn(state, NOW)
    expect(s.participants[0]!.seenAtTurnEnd).toEqual({
      cities: { c1: 'p1', c2: 'p2' },
      unitIds: ['e1'],
    })
  })

  it('fehlt in alten Spielständen und wird von normalizeState ergänzt', () => {
    const state = makeState({ map: PLAINS })
    delete (state.participants[0] as Partial<(typeof state.participants)[0]>).seenAtTurnEnd
    expect(normalizeState(state).participants[0]!.seenAtTurnEnd).toBeNull()
  })

  it('meldet in der ersten Runde ohne Schnappschuss nichts', () => {
    const state = makeState({
      map: PLAINS,
      units: [unit('g1', 'grenadiere', 'p1', 1, 1), outpost()],
      cities: [city('c1', 'p1', 0, 0)],
    })
    // Already p2's turn when the match "starts": p1 has no snapshot yet
    state.seat = 1
    const s = endTurn(state, NOW)
    expect(s.participants[s.seat]!.id).toBe('p1')
    expect(eventsFor(s, 'p1')).toEqual([])
  })
})

describe('Rundenbericht: Gegner gesichtet', () => {
  const base = () =>
    makeState({
      map: PLAINS,
      units: [unit('g1', 'grenadiere', 'p1', 1, 1), outpost()],
      cities: [city('c1', 'p1', 0, 0)],
    })

  it('meldet eine Feindeinheit, die neu in Sicht steht, mit Feldkoordinate', () => {
    const s = nextRound(base(), (p2) => {
      const far = p2.units.find((u) => u.id === 'far')!
      far.col = 2
      far.row = 1
    })
    const sighted = eventsFor(s, 'p1', 'enemySighted')
    expect(sighted).toHaveLength(1)
    expect(sighted[0]).toMatchObject({
      col: 2,
      row: 1,
      round: 2,
      message: 'Feindliche Grenadiere (Gegner p2) bei 2,1 gesichtet.',
    })
  })

  it('fasst mehrere Einheiten auf einem Feld zu einer Meldung zusammen', () => {
    const state = base()
    state.units.push(unit('e2', 'panzerwagen', 'p2', 7, 4))
    const s = nextRound(state, (p2) => {
      for (const id of ['far', 'e2']) {
        const u = p2.units.find((x) => x.id === id)!
        u.col = 2
        u.row = 1
      }
    })
    const sighted = eventsFor(s, 'p1', 'enemySighted')
    expect(sighted).toHaveLength(1)
    expect(sighted[0]!.message).toBe(
      'Feindliche Einheiten bei 2,1 gesichtet: Grenadiere, Panzerwagen.',
    )
  })

  it('meldet keine Einheit, die schon am Zugende sichtbar war', () => {
    const state = base()
    state.units.push(unit('e1', 'grenadiere', 'p2', 2, 1))
    const s = nextRound(state)
    expect(eventsFor(s, 'p1', 'enemySighted')).toEqual([])
  })

  it('wiederholt eine Meldung der Wache nicht', () => {
    const state = base()
    state.units[0]!.order = { type: 'sentry' }
    const s = nextRound(state, (p2) => {
      const far = p2.units.find((u) => u.id === 'far')!
      far.col = 2
      far.row = 1
    })
    const sighted = eventsFor(s, 'p1', 'enemySighted')
    expect(sighted).toHaveLength(1)
    expect(sighted[0]!.message).toMatch(/^Wache:/)
  })
})

describe('Rundenbericht: Städte', () => {
  it('meldet den Besitzerwechsel einer Stadt in Sicht', () => {
    const state = makeState({
      map: PLAINS,
      units: [unit('g1', 'grenadiere', 'p1', 1, 1), outpost()],
      cities: [city('c1', 'p1', 0, 0), city('c2', null, 2, 2)],
    })
    const s = nextRound(state, (p2) => {
      // p2 takes the free city next to p1's grenadiers
      p2.cities.find((c) => c.id === 'c2')!.ownerId = 'p2'
    })
    const found = eventsFor(s, 'p1', 'cityDiscovered')
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({
      col: 2,
      row: 2,
      message: 'Stadt c2 ist jetzt in der Hand von Gegner p2.',
    })
  })

  it('meldet eine neu entdeckte Stadt, wenn eine Einheit mit Marschbefehl sie erreicht', () => {
    const state = makeState({
      map: PLAINS,
      units: [unit('g1', 'grenadiere', 'p1', 1, 1), outpost()],
      cities: [city('c1', 'p1', 0, 0), city('c2', 'p2', 5, 1)],
      unexplored: ['5,1', '6,1'],
    })
    state.units[0]!.order = { type: 'goto', target: { col: 4, row: 1 }, turnsRemaining: 3 }
    let s = state
    for (let i = 0; i < 3; i++) s = nextRound(s)
    expect(s.units.find((u) => u.id === 'g1')).toMatchObject({ col: 4, row: 1 })
    const found = eventsFor(s, 'p1', 'cityDiscovered')
    expect(found.map((e) => e.message)).toEqual(['Stadt c2 entdeckt, in der Hand von Gegner p2.'])
  })

  it('meldet eine eigene verlorene Stadt nur als Verlust', () => {
    const state = makeState({
      map: PLAINS,
      units: [unit('g1', 'grenadiere', 'p1', 1, 1), outpost()],
      cities: [city('c1', 'p1', 0, 0), city('c2', 'p1', 2, 2)],
    })
    const s = nextRound(state, (p2) => {
      p2.cities.find((c) => c.id === 'c2')!.ownerId = 'p2'
    })
    expect(eventsFor(s, 'p1', 'cityDiscovered')).toEqual([])
  })

  it('meldet nichts, wenn sich nichts geändert hat', () => {
    const state = makeState({
      map: PLAINS,
      units: [unit('g1', 'grenadiere', 'p1', 1, 1), outpost()],
      cities: [city('c1', 'p1', 0, 0), city('c2', 'p2', 6, 5)],
    })
    const s = nextRound(state)
    expect(eventsFor(s, 'p1')).toEqual([])
  })
})
