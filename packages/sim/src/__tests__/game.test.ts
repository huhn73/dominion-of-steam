import type { CommandOutcome, GameState } from '@dos/shared/engine'
import type { CombatResult } from '@dos/shared/game/types'
import { describe, expect, it } from 'vitest'
import { aggregate, summarizeMatchup } from '../aggregate'
import { MetricsCollector, type GameResult } from '../collector'
import { parseConfig } from '../config'
import { runGame } from '../game'
import { expandJobs, type GameJob } from '../jobs'
import { renderReport } from '../report'

const config = parseConfig({
  name: 'klein',
  matchups: [
    {
      id: 'duell',
      participants: [
        { label: 'hart', factionId: 'eisenbund', difficulty: 'hard' },
        { label: 'leicht', factionId: 'aurelia', difficulty: 'easy' },
      ],
    },
  ],
  maps: [{ size: 'small' }],
  seeds: ['KLEIN-1'],
  rotateSeats: false,
  roundLimit: 8,
})
const job = expandJobs(config)[0]!

const strip = (r: GameResult) => ({
  ...r,
  durationMs: 0,
  participants: r.participants.map((p) => ({
    ...p,
    turns: { ...p.turns, totalMs: 0, maxMs: 0, turnMs: [] },
  })),
})

describe('runGame', () => {
  it('spielt deterministisch bis zum Rundenlimit und liefert plausible Kennzahlen', () => {
    const a = runGame(job)
    const b = runGame(job)
    expect(strip(a)).toEqual(strip(b))
    expect(a.rounds).toBe(8)
    expect(['roundLimit', 'elimination']).toContain(a.victoryType)
    expect(a.timeline).toHaveLength(8)
    expect(a.timeline.map((t) => t.round)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(a.participants.map((p) => p.label)).toEqual(['hart', 'leicht'])
    for (const p of a.participants) {
      expect(p.turns.count).toBe(8)
      expect(p.turns.turnMs).toHaveLength(8)
      expect(p.turns.commands).toBeGreaterThan(0)
      expect(p.finalScore).toBe(p.finalCities * 3 + p.finalUnits)
      // production counts the units the cities finished
      const built = Object.values(p.production).reduce((x, y) => x + y, 0)
      expect(built).toBeGreaterThan(0)
      expect(p.placement).not.toBeNull()
    }
    const winner = a.participants.find((p) => p.label === a.winnerLabel)
    expect(winner?.placement).toBe(1)
  })

  it('zählt Eroberungen wie die Engine', () => {
    const longer = { ...job, maxRounds: 30, rules: { ...job.rules, roundLimit: 30 } }
    const r = runGame(longer)
    const total = r.participants.reduce((x, p) => x + p.captures.neutral + p.captures.enemy, 0)
    expect(total).toBeGreaterThan(0)
    const lost = r.participants.reduce((x, p) => x + p.captures.lost, 0)
    const enemy = r.participants.reduce((x, p) => x + p.captures.enemy, 0)
    expect(lost).toBe(enemy)
    const killed = r.participants.reduce((x, p) => x + p.combat.unitsKilled, 0)
    const lostInCombat = r.participants.reduce((x, p) => x + p.combat.unitsLost, 0)
    const fallen = r.participants.reduce((x, p) => x + p.combat.lost, 0)
    const spent = r.participants.reduce((x, p) => x + p.combat.cityAttacksWon, 0)
    // every unit lost in combat is a destroyed defender, a fallen attacker or one spent on a city
    expect(lostInCombat).toBe(killed + fallen + spent)
  })
})

describe('MetricsCollector', () => {
  const state = (): GameState =>
    ({
      round: 4,
      seat: 0,
      status: 'running',
      participants: [
        { id: 'p1', status: 'active' },
        { id: 'p2', status: 'active' },
      ],
      cities: [
        { id: 'c1', ownerId: 'p2' },
        { id: 'c2', ownerId: null },
      ],
      units: [
        { id: 'a', ownerId: 'p1', unitTypeId: 'panzerwagen' },
        { id: 'd', ownerId: 'p2', unitTypeId: 'grenadiere' },
      ],
    }) as unknown as GameState
  const fakeJob = {
    ...job,
    participants: job.participants.map((p) => ({ ...p })),
  } as GameJob
  const combat = (patch: Partial<CombatResult>): CombatResult => ({
    attackerUnitId: 'a',
    defenderUnitId: null,
    targetCityId: null,
    hits: [],
    attackerDamage: 0,
    defenderDamage: 0,
    attackerDestroyed: false,
    defenderDestroyed: false,
    advanced: false,
    captured: false,
    garrisonUnitId: null,
    message: '',
    text: { key: 'events.win' },
    ...patch,
  })

  it('ordnet Kämpfe, Eroberungen und Verluste beiden Seiten zu', () => {
    const s = state()
    const c = new MetricsCollector(s, fakeJob)
    c.beginTurn('p1')
    // kill the defender: p1 wins, p2 loses a unit
    const afterKill = { ...s, units: s.units.filter((u) => u.id !== 'd') } as GameState
    c.onCommand({ type: 'attack', unitId: 'a', target: { unitId: 'd' } }, {
      state: afterKill,
      combat: combat({
        defenderUnitId: 'd',
        defenderDestroyed: true,
        attackerDamage: 1,
        defenderDamage: 1,
      }),
    } as CommandOutcome)
    // capture the enemy city, attacker spent, garrison left behind
    const afterCapture = {
      ...afterKill,
      cities: [
        { id: 'c1', ownerId: 'p1' },
        { id: 'c2', ownerId: null },
      ],
      units: [{ id: 'g', ownerId: 'p1', unitTypeId: 'grenadiere' }],
    } as GameState
    c.onCommand({ type: 'attack', unitId: 'a', target: { cityId: 'c1' } }, {
      state: afterCapture,
      combat: combat({
        targetCityId: 'c1',
        captured: true,
        attackerDestroyed: true,
        garrisonUnitId: 'g',
      }),
    } as CommandOutcome)
    c.endAiTurn(12)
    c.beforeEndTurn(afterCapture)
    // the other side produced a unit, our plane crashed (no combat explains it)
    const afterEnd = {
      ...afterCapture,
      seat: 1,
      units: [{ id: 'n1', ownerId: 'p2', unitTypeId: 'kanonenboot' }],
    } as GameState
    c.afterEndTurn(afterEnd)
    const finished = {
      ...afterEnd,
      status: 'finished',
      winnerId: 'p1',
      participants: [
        { id: 'p1', status: 'active', placement: 1 },
        { id: 'p2', status: 'active', placement: 2 },
      ],
    } as unknown as GameState
    const r = c.finish(finished, 'roundLimit', 99)
    const [p1, p2] = r.participants
    expect(p1!.combat).toMatchObject({
      attacks: 2,
      won: 2,
      lost: 0,
      cityAttacks: 1,
      cityAttacksWon: 1,
      unitsLost: 1,
      unitsKilled: 1,
      damageDealt: 1,
      damageTaken: 1,
    })
    expect(p1!.captures).toMatchObject({ neutral: 0, enemy: 1, lost: 0, firstCaptureRound: 4 })
    expect(p1!.combat.otherLosses).toBe(1) // the garrison 'g' vanished without a fight
    expect(p1!.production).toEqual({})
    expect(p2!.combat).toMatchObject({ unitsLost: 1, damageDealt: 1, damageTaken: 1 })
    expect(p2!.captures.lost).toBe(1)
    expect(p2!.production).toEqual({ kanonenboot: 1 })
    expect(p1!.turns).toMatchObject({
      count: 1,
      commands: 2,
      commandsByType: { attack: 2 },
      budgetExhausted: 0,
    })
    expect(r.winnerLabel).toBe('hart')
    expect(r.timeline).toHaveLength(0) // seat 0 did not close the round
  })
})

describe('aggregate und Bericht', () => {
  const results = [
    runGame(job),
    runGame({ ...job, rotation: 1, seed: 'KLEIN-2', map: { ...job.map, seed: 'KLEIN-2' } }),
  ]

  it('fasst je Matchup und Label zusammen', () => {
    const m = summarizeMatchup('duell', results)
    expect(m.games).toBe(2)
    expect(m.labels.map((l) => l.label)).toEqual(['hart', 'leicht'])
    const wins = m.labels.reduce((x, l) => x + l.wins, 0)
    expect(wins).toBeLessThanOrEqual(2)
    expect(m.bySeat.reduce((x, s) => x + s.wins, 0)).toBe(wins)
    for (const l of m.labels) {
      expect(l.curve).toHaveLength(8)
      expect(l.wilson[0]).toBeLessThanOrEqual(l.winRate)
      expect(l.wilson[1]).toBeGreaterThanOrEqual(l.winRate)
      expect(l.turns.avgMs).toBeGreaterThan(0)
    }
  })

  it('rendert den Markdown-Bericht mit den Tabellen', () => {
    const summary = aggregate(config, results, [{ jobId: 'kaputt', error: 'boom' }], {
      mode: 'run',
      startedAt: '2026-11-01T10:00:00Z',
      finishedAt: '2026-11-01T10:01:00Z',
      workers: 2,
      jobs: 3,
    })
    expect(summary.played).toBe(2)
    expect(summary.failed).toBe(1)
    expect(summary.msPerRound).toBeGreaterThan(0)
    const md = renderReport(summary)
    expect(md).toContain('# KI-Simulation: klein')
    expect(md).toContain('## Matchup duell')
    expect(md).toContain('| Teilnehmer | Siege | Quote |')
    expect(md).toContain('**Verlauf**')
    expect(md).toContain('`kaputt`: boom')
    expect(md).toMatch(/\d+ %/)
  })

  it('reiht den Sweep nach Siegquote', () => {
    const sweepConfig = parseConfig({
      name: 'sw',
      sweep: {
        reference: { label: 'leicht', factionId: 'aurelia', difficulty: 'easy' },
        subject: { label: 'hart', factionId: 'eisenbund', difficulty: 'hard' },
        grid: { attackThreshold: [0.3] },
      },
    })
    const matchups = [
      { id: 'sweep-0', participants: [], sweepParams: {} },
      { id: 'sweep-1', participants: [], sweepParams: { attackThreshold: 0.3 } },
    ]
    const withId = (id: string, winner: string | null) =>
      results.map((r) => ({ ...r, matchupId: id, winnerLabel: winner }))
    const summary = aggregate(
      { ...sweepConfig, matchups },
      [...withId('sweep-0', 'leicht'), ...withId('sweep-1', 'hart')],
      [],
      {
        mode: 'sweep',
        startedAt: '2026-11-01T10:00:00Z',
        finishedAt: '2026-11-01T10:01:00Z',
        workers: 1,
        jobs: 4,
      },
    )
    expect(summary.sweep?.map((r) => [r.rank, r.matchupId, r.winRate])).toEqual([
      [1, 'sweep-1', 1],
      [2, 'sweep-0', 0],
    ])
    expect(renderReport(summary)).toContain('## Sweep: hart gegen leicht')
  })
})
