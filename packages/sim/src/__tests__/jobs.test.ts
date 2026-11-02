import { describe, expect, it } from 'vitest'
import { parseConfig } from '../config'
import { expandJobs, rotate, seedList } from '../jobs'
import { gridCombinations, sweepMatchups } from '../sweep'

const participants = [
  { label: 'a', factionId: 'eisenbund', difficulty: 'hard' },
  { label: 'b', factionId: 'aurelia', difficulty: 'normal' },
  { label: 'c', factionId: 'nordmark', difficulty: 'easy' },
]

describe('expandJobs', () => {
  it('bildet Matchups × Karten × Seeds × Rotationen', () => {
    const c = parseConfig({
      name: 'jobs',
      matchups: [
        { id: 'm1', participants: participants.slice(0, 2) },
        { id: 'm2', participants: participants.slice(0, 2) },
      ],
      maps: [{ size: 'small' }, { size: 'medium' }],
      seeds: 3,
    })
    const jobs = expandJobs(c)
    expect(jobs).toHaveLength(2 * 2 * 3 * 2)
    expect(new Set(jobs.map((j) => j.id)).size).toBe(jobs.length)
    expect(jobs[0]!.map).toMatchObject({ width: 20, height: 20, landShare: 35, seed: 'jobs-001' })
    expect(jobs[0]!.rules).toMatchObject({
      victoryCondition: 'roundLimit',
      roundLimit: 100,
      allowDuplicateFactions: true,
    })
  })

  it('rotiert die Sitze zyklisch, jedes Label sitzt einmal auf jedem Sitz', () => {
    expect(rotate(['a', 'b', 'c'], 1)).toEqual(['b', 'c', 'a'])
    const c = parseConfig({ name: 'rot', matchups: [{ id: 'm', participants }], seeds: ['S'] })
    const jobs = expandJobs(c)
    expect(jobs).toHaveLength(3)
    for (const label of ['a', 'b', 'c']) {
      const seats = jobs.map((j) => j.participants.find((p) => p.label === label)!.seat).sort()
      expect(seats).toEqual([0, 1, 2])
    }
    expect(jobs[1]!.participants.map((p) => [p.id, p.label, p.color])).toEqual([
      ['p1', 'b', 'amber'],
      ['p2', 'c', 'rose'],
      ['p3', 'a', 'sky'],
    ])
  })

  it('ohne Rotation ein Job je Seed, Seeds auch als Liste', () => {
    const c = parseConfig({
      name: 'x',
      matchups: [{ id: 'm', participants }],
      seeds: ['A', 'B'],
      rotateSeats: false,
    })
    expect(seedList(c)).toEqual(['A', 'B'])
    expect(expandJobs(c).map((j) => j.seed)).toEqual(['A', 'B'])
  })
})

describe('sweep', () => {
  it('bildet das kartesische Produkt', () => {
    const combos = gridCombinations({
      attackThreshold: [0.4, 0.5, 0.6],
      garrison: [true, false],
      neutralBias: [0, 3],
    })
    expect(combos).toHaveLength(12)
    expect(combos[0]).toEqual({ attackThreshold: 0.4, garrison: true, neutralBias: 0 })
    expect(combos[11]).toEqual({ attackThreshold: 0.6, garrison: false, neutralBias: 3 })
  })

  it('erzeugt je Rasterpunkt ein Matchup plus Basis ohne Override', () => {
    const c = parseConfig({
      name: 'sw',
      sweep: {
        reference: { label: 'ref', factionId: 'eisenbund', difficulty: 'normal' },
        subject: {
          label: 'sub',
          factionId: 'eisenbund',
          difficulty: 'normal',
          profile: { maxShips: 3 },
        },
        grid: { attackThreshold: [0.4, 0.6], garrison: [true] },
      },
    })
    const matchups = sweepMatchups(c.sweep!)
    expect(matchups.map((m) => m.id)).toEqual(['sweep-0', 'sweep-1', 'sweep-2'])
    expect(matchups[0]!.sweepParams).toEqual({})
    expect(matchups[0]!.participants[0]!.profile).toEqual({ maxShips: 3 })
    expect(matchups[2]!.participants[0]!.profile).toEqual({
      maxShips: 3,
      attackThreshold: 0.6,
      garrison: true,
    })
    expect(matchups[2]!.participants[1]!.label).toBe('ref')
    expect(expandJobs({ ...c, matchups, seeds: 2 })).toHaveLength(3 * 2 * 2)
  })
})
