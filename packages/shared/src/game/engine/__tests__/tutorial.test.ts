import { describe, expect, it } from 'vitest'
import { isWater } from '../../hex'
import { TERRAIN_OF_CODE, tileIndex } from '../../mapcodec'
import type { HexCoord } from '../../types'
import type { Command } from '../../view'
import { playAITurn } from '../ai'
import { applyCommand } from '../commands'
import { type GameState, unitType } from '../state'
import { endTurn } from '../turn'
import {
  seedTutorial,
  TUTORIAL_AI_ID,
  TUTORIAL_CITIES,
  TUTORIAL_ENEMY_ID,
  TUTORIAL_STEPS,
  tutorialView,
} from '../tutorial'
import { projectView } from '../view'

const NOW = new Date('2026-11-06T12:00:00Z')
const ME = 'spieler-1'

const terrainAt = (s: GameState, c: HexCoord) =>
  TERRAIN_OF_CODE[s.map.terrain[tileIndex(s.map, c)]!]!
const stepId = (s: GameState) => TUTORIAL_STEPS[s.tutorial!.step]?.id ?? 'done'
const run = (s: GameState, cmd: Command) => applyCommand(s, ME, cmd, NOW).state

/** End the player's turn and let the passive opponent play (as the server does) */
function endRound(s: GameState) {
  let next = run(s, { type: 'endTurn' })
  while (next.status === 'running' && next.participants[next.seat]!.isAI) {
    const ai = next.participants[next.seat]!
    next = endTurn(playAITurn(next, ai.id, NOW), NOW)
  }
  return next.phase === 'replay' ? run(next, { type: 'skipReplay' }) : next
}

const mine = (s: GameState, typeId?: string) =>
  s.units.filter((u) => u.ownerId === ME && (!typeId || u.unitTypeId === typeId))

/** Attack until `done` holds, using fresh attackers from `pick`; ends rounds in between */
function attackUntil(
  s: GameState,
  done: (s: GameState) => boolean,
  pick: (s: GameState) => { unitId: string; target: { unitId?: string; cityId?: string } } | null,
) {
  for (let i = 0; i < 20 && !done(s); i++) {
    const a = pick(s)
    if (!a) {
      s = endRound(s)
      continue
    }
    s = run(s, { type: 'attack', ...a })
  }
  return s
}

describe('Tutorial', () => {
  it('builds a valid world: cities on land, the freighter at sea, a passive opponent', () => {
    const s = seedTutorial(ME, 'Björn')
    for (const c of s.cities) expect(isWater(terrainAt(s, c))).toBe(false)
    for (const u of s.units) {
      const water = isWater(terrainAt(s, u))
      expect(water).toBe(unitType(u.unitTypeId).domain === 'sea')
    }
    const enemy = s.participants.find((p) => p.id === TUTORIAL_ENEMY_ID)!
    expect(enemy.aiPersonalityId).toBe(TUTORIAL_AI_ID)
    // The enemy island lies in the unexplored part of the map
    expect(s.cities.find((c) => c.id === TUTORIAL_CITIES.enemy.id)!.knownBy[ME]).toBeUndefined()
    const view = projectView(s, ME)
    expect(view.tutorial).toMatchObject({ step: 0, total: TUTORIAL_STEPS.length })
    expect(view.tutorial!.current).toMatchObject({ id: 'welcome', manual: true })
  })

  it('the passive opponent neither moves nor builds', () => {
    let s = seedTutorial(ME, 'Björn')
    s = endRound(s)
    s = endRound(s)
    const enemyUnits = s.units.filter((u) => u.ownerId === TUTORIAL_ENEMY_ID)
    expect(enemyUnits).toHaveLength(1)
    expect(enemyUnits[0]).toMatchObject({ col: 13, row: 5 })
    expect(s.cities.find((c) => c.id === TUTORIAL_CITIES.enemy.id)!.production).toBeNull()
  })

  it('„Weiter“ only confirms text steps; „Überspringen“ skips any step', () => {
    let s = seedTutorial(ME, 'Björn')
    s = run(s, { type: 'tutorialNext' })
    s = run(s, { type: 'tutorialNext' })
    expect(stepId(s)).toBe('move')
    s = run(s, { type: 'tutorialNext' })
    expect(stepId(s)).toBe('move')
    s = run(s, { type: 'tutorialSkip' })
    expect(stepId(s)).toBe('town')
  })

  it('rejects tutorial commands in normal matches', () => {
    const s = seedTutorial(ME, 'Björn')
    delete s.tutorial
    expect(() => run(s, { type: 'tutorialNext' })).toThrow(/kein Tutorial/)
  })

  it('can be played through to victory, every step fulfilled by its action', () => {
    let s = seedTutorial(ME, 'Björn')
    s = run(s, { type: 'tutorialNext' })
    s = run(s, { type: 'tutorialNext' })

    // Move: a grenadier from the capital to the north
    const g = mine(s, 'grenadiere').find((u) => u.col === 9 && u.row === 5)!
    s = run(s, { type: 'move', unitId: g.id, target: { col: 9, row: 4 } })
    expect(stepId(s)).toBe('town')

    // Capture the neutral town (each try spends a unit)
    const town = TUTORIAL_CITIES.town.id
    s = attackUntil(
      s,
      (x) => x.cities.find((c) => c.id === town)!.ownerId === ME,
      (x) => {
        const v = projectView(x, ME)
        const p = v.combatPreviews.find((c) => c.targetCityId === town)
        return p ? { unitId: p.attackerUnitId, target: { cityId: town } } : null
      },
    )
    expect(['production', 'endTurn', 'report']).toContain(stepId(s))
    if (stepId(s) === 'production')
      s = run(s, { type: 'setProduction', cityId: town, unitTypeId: 'grenadiere' })
    if (stepId(s) === 'endTurn') s = endRound(s)
    expect(stepId(s)).toBe('report')
    s = run(s, { type: 'tutorialNext' })

    // Scout with the biplane until the enemy capital is known
    expect(stepId(s)).toBe('scout')
    for (let i = 0; i < 4 && stepId(s) === 'scout'; i++) {
      const plane = mine(s, 'doppeldecker')[0]
      if (plane && plane.order.type !== 'explore') s = run(s, { type: 'explore', unitId: plane.id })
      if (stepId(s) === 'scout') s = endRound(s)
    }
    expect(stepId(s)).toBe('board')

    // Board: land units step onto the freighter's tile
    const freighter = mine(s, 'frachter')[0]!
    for (const u of mine(s).filter(
      (u) => unitType(u.unitTypeId).domain === 'land' && u.col === 9 && u.row === 5,
    ))
      s = run(s, { type: 'move', unitId: u.id, target: freighter })
    expect(stepId(s)).toBe('land')
    s = run(s, { type: 'move', unitId: freighter.id, target: { col: 12, row: 5 } })
    s = endRound(s)
    const cargo = mine(s).filter((u) => u.carriedBy === freighter.id)
    expect(cargo.length).toBeGreaterThanOrEqual(2)
    for (const [i, u] of cargo.slice(0, 2).entries())
      s = run(s, {
        type: 'unload',
        unitId: u.id,
        target: i === 0 ? { col: 13, row: 4 } : { col: 13, row: 6 },
      })
    expect(stepId(s)).toBe('attack')
    s = endRound(s)

    // Attack the garrison, then take the empty fortress
    const enemyCity = TUTORIAL_CITIES.enemy.id
    s = attackUntil(
      s,
      (x) => x.status === 'finished',
      (x) => {
        const v = projectView(x, ME)
        const p =
          v.combatPreviews.find((c) => c.targetUnitId) ??
          v.combatPreviews.find((c) => c.targetCityId === enemyCity)
        if (!p) return null
        return {
          unitId: p.attackerUnitId,
          target: p.targetUnitId ? { unitId: p.targetUnitId } : { cityId: enemyCity },
        }
      },
    )
    expect(s.winnerId).toBe(ME)
    expect(stepId(s)).toBe('done')
    expect(tutorialView(s)).toMatchObject({ step: TUTORIAL_STEPS.length, current: null })
  })
})
