import { describe, expect, it } from 'vitest'
import { applyCommand, CommandError, endTurn, type GameState } from '..'
import { countBits } from '../../bits'
import { hexKey } from '../../hex'
import { city, makeState, unit } from './fixtures'

const NOW = new Date('2026-10-31T12:00:00Z')
const run = (state: GameState, playerId: string, cmd: Parameters<typeof applyCommand>[2]) =>
  applyCommand(state, playerId, cmd, NOW).state
const unitOf = (s: GameState, id: string) => s.units.find((u) => u.id === id)
const explored = (s: GameState) => countBits(s.participants[0]!.explored)
function nextRound(state: GameState) {
  let s = endTurn(state, NOW)
  while (s.participants[s.seat]!.id !== 'p1') s = endTurn(s, NOW)
  return s
}
/** 14 × 6 plains; columns 5 to 13 are fog for everybody */
const WIDE = Array.from({ length: 6 }, () => '..............')
const fog = (fromCol: number) =>
  WIDE.flatMap((row, r) => [...row].map((_, c) => (c >= fromCol ? `${c},${r}` : null))).filter(
    (k): k is string => k !== null,
  )
const base = (extra: Partial<Parameters<typeof makeState>[0]> = {}) =>
  makeState({
    units: [unit('f', 'doppeldecker', 'p1', 0, 0), unit('far', 'grenadiere', 'p2', 13, 5)],
    cities: [city('c1', 'p1', 0, 0)],
    unexplored: fog(5),
    ...extra,
    map: WIDE,
  })

describe('Erkunden', () => {
  it('fliegt sofort zum Nebelrand, lichtet den Nebel und behält den Befehl', () => {
    const s0 = base()
    const before = explored(s0)
    const s = run(s0, 'p1', { type: 'explore', unitId: 'f' })
    const f = unitOf(s, 'f')!
    expect(f.order).toEqual({ type: 'explore' })
    expect(f.needsOrders).toBe(false)
    expect(f.col).toBeGreaterThan(3)
    expect(explored(s)).toBeGreaterThan(before)
    // never beyond the point of no return: fuel left covers the way home
    expect(f.fuel).toBeGreaterThanOrEqual(f.col)
    expect(s.log.at(-1)).toMatchObject({ participantId: 'p1', action: 'move' })
    expect(s.log.at(-1)!.path.length).toBeGreaterThan(1)
  })

  it('stoppt, sobald eine Feindeinheit in Sicht kommt, und meldet sie einmal', () => {
    const s0 = base()
    s0.units.push(unit('e', 'panzerwagen', 'p2', 6, 1))
    const s = run(s0, 'p1', { type: 'explore', unitId: 'f' })
    const f = unitOf(s, 'f')!
    expect(f.order).toEqual({ type: 'none' })
    expect(f.needsOrders).toBe(true)
    const sighted = s.events.filter((e) => e.participantId === 'p1' && e.type === 'enemySighted')
    expect(sighted).toHaveLength(1)
    expect(sighted[0]).toMatchObject({ col: 6, row: 1 })
    expect(sighted[0]!.message).toBe(
      'Erkundung: feindliche Panzerwagen (Gegner p2) bei 6,1 entdeckt.',
    )
    // the plane stays where it spotted the enemy: two tiles away at most
    expect(f).toMatchObject({ col: 5, row: 0 })
  })

  it('stoppt bei einer neu entdeckten Stadt', () => {
    const s0 = base({ cities: [city('c1', 'p1', 0, 0), city('c2', null, 6, 2)] })
    const s = run(s0, 'p1', { type: 'explore', unitId: 'f' })
    expect(unitOf(s, 'f')!.order).toEqual({ type: 'none' })
    const found = s.events.filter((e) => e.participantId === 'p1' && e.type === 'cityDiscovered')
    expect(found.map((e) => e.message)).toEqual(['Erkundung: freie Stadt Stadt c2 entdeckt.'])
  })

  it('fliegt zum Tanken heim und erkundet danach weiter', () => {
    let s = run(base(), 'p1', { type: 'explore', unitId: 'f' })
    const afterFirst = { col: unitOf(s, 'f')!.col, explored: explored(s) }
    expect(afterFirst.col).toBeGreaterThan(0)
    // round 2: nothing safe left from out there, so it heads home
    s = nextRound(s)
    expect(unitOf(s, 'f')).toMatchObject({ col: 0, row: 0, order: { type: 'explore' } })
    // round 3: refuelled, off it goes again and reveals more
    s = nextRound(s)
    const f = unitOf(s, 'f')!
    expect(f.fuel).toBeLessThan(12)
    expect(explored(s)).toBeGreaterThan(afterFirst.explored)
    expect(f.order).toEqual({ type: 'explore' })
  })

  it('wiederholt den Stopp einer Erkundung im Rundenbericht nicht', () => {
    // the plane is already exploring; the enemy sits in the fog it will reveal next round
    const s0 = base()
    s0.units[0]!.order = { type: 'explore' }
    s0.units[0]!.needsOrders = false
    s0.units.push(unit('e', 'panzerwagen', 'p2', 6, 1))
    const s = nextRound(s0)
    const sighted = s.events.filter((e) => e.participantId === 'p1' && e.type === 'enemySighted')
    expect(sighted.map((e) => e.message)).toEqual([
      'Erkundung: feindliche Panzerwagen (Gegner p2) bei 6,1 entdeckt.',
    ])
    expect(unitOf(s, 'f')!.order).toEqual({ type: 'none' })
  })

  it('beendet die Erkundung, wenn kein Nebel mehr erreichbar ist', () => {
    const s0 = base({ unexplored: [] })
    const s = run(s0, 'p1', { type: 'explore', unitId: 'f' })
    const f = unitOf(s, 'f')!
    expect(f).toMatchObject({ col: 0, row: 0, order: { type: 'none' }, needsOrders: true })
    expect(s.events.filter((e) => e.type === 'exploration').map((e) => e.message)).toEqual([
      'Erkundung abgeschlossen: kein unerforschtes Feld mehr erreichbar.',
    ])
  })

  it('gibt auf, wenn der Nebel außerhalb der sicheren Reichweite liegt', () => {
    // fog only far away: a full tank (12) must cover the way there and back
    const s0 = base({ unexplored: fog(9) })
    const s = run(s0, 'p1', { type: 'explore', unitId: 'f' })
    expect(unitOf(s, 'f')!.order).toEqual({ type: 'none' })
    expect(s.events.some((e) => e.type === 'exploration')).toBe(true)
    expect(s.participants[0]!.explored.includes(hexKey({ col: 9, row: 0 }))).toBe(false)
  })

  it('lehnt den Befehl für Bodeneinheiten ab', () => {
    const s0 = base()
    s0.units.push(unit('g', 'grenadiere', 'p1', 1, 1))
    expect(() => run(s0, 'p1', { type: 'explore', unitId: 'g' })).toThrowError(CommandError)
  })
})
