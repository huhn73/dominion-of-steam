import { describe, expect, it } from 'vitest'
import { ConfigError, parseConfig } from '../config'

const base = {
  name: 'test',
  matchups: [
    {
      id: 'a',
      participants: [
        { label: 'x', factionId: 'eisenbund', difficulty: 'hard' },
        { label: 'y', factionId: 'aurelia', difficulty: 'normal', personalityId: 'kessler' },
      ],
    },
  ],
}

describe('parseConfig', () => {
  it('füllt Vorgaben auf', () => {
    const c = parseConfig(base)
    expect(c.maps).toEqual([
      {
        size: 'medium',
        worldShape: 'continent',
        landShare: 35,
        neutralCities: 'normal',
        terrain: 'normal',
      },
    ])
    expect(c.seeds).toBe(10)
    expect(c.rotateSeats).toBe(true)
    expect(c.roundLimit).toBe(100)
    expect(c.victoryCondition).toBe('roundLimit')
    expect(c.matchups[0]!.participants[1]!.personalityId).toBe('kessler')
  })

  it.each([
    [
      'unbekannte Fraktion',
      { participants: [{ label: 'x', factionId: 'mordor', difficulty: 'hard' }] },
    ],
    [
      'unbekannte Stufe',
      { participants: [{ label: 'x', factionId: 'eisenbund', difficulty: 'brutal' }] },
    ],
    [
      'unbekannte Persönlichkeit',
      {
        participants: [
          { label: 'x', factionId: 'eisenbund', difficulty: 'hard', personalityId: 'nobody' },
        ],
      },
    ],
    [
      'doppelte Labels',
      {
        participants: [
          { label: 'x', factionId: 'eisenbund', difficulty: 'hard' },
          { label: 'x', factionId: 'aurelia', difficulty: 'easy' },
        ],
      },
    ],
    [
      'unbekanntes Profilfeld',
      {
        participants: [
          { label: 'x', factionId: 'eisenbund', difficulty: 'hard', profile: { aggression: 1 } },
        ],
      },
    ],
    [
      'Profilwert außerhalb 0–1',
      {
        participants: [
          {
            label: 'x',
            factionId: 'eisenbund',
            difficulty: 'hard',
            profile: { attackThreshold: 2 },
          },
        ],
      },
    ],
  ])('lehnt %s ab', (_, patch) => {
    const participants = [
      ...patch.participants,
      { label: 'z', factionId: 'nordmark', difficulty: 'easy' },
    ]
    const raw = { ...base, matchups: [{ id: 'a', participants }] }
    expect(() => parseConfig(raw)).toThrow(ConfigError)
  })

  it('prüft Karten und Seeds', () => {
    expect(() => parseConfig({ ...base, maps: [{ size: 'gigantic' }] })).toThrow(/size/)
    expect(() => parseConfig({ ...base, maps: [{ size: 'small', landShare: 90 }] })).toThrow(
      /landShare/,
    )
    expect(() =>
      parseConfig({ ...base, maps: [{ size: 'small', worldShape: 'pangaea' }] }),
    ).toThrow(/worldShape/)
    expect(
      parseConfig({ ...base, maps: [{ size: 'small', worldShape: 'islands' }] }).maps[0]!
        .worldShape,
    ).toBe('islands')
    expect(() => parseConfig({ ...base, seeds: 0 })).toThrow(/seeds/)
    expect(() => parseConfig({ ...base, seeds: [] })).toThrow(/seeds/)
    expect(
      parseConfig({ ...base, seeds: ['A', 'B'], maps: [{ size: { width: 20, height: 12 } }] })
        .maps[0]!.size,
    ).toEqual({ width: 20, height: 12 })
  })

  it('erlaubt leere Matchups nur mit sweep', () => {
    expect(() => parseConfig({ name: 'x', matchups: [] })).toThrow(/matchups/)
    const c = parseConfig({
      name: 'x',
      sweep: {
        reference: { label: 'ref', factionId: 'eisenbund', difficulty: 'normal' },
        subject: { label: 'sub', factionId: 'eisenbund', difficulty: 'normal' },
        grid: { attackThreshold: [0.4, 0.6], garrison: [true, false] },
      },
    })
    expect(c.matchups).toEqual([])
    expect(c.sweep?.grid.attackThreshold).toEqual([0.4, 0.6])
    expect(() =>
      parseConfig({
        ...base,
        sweep: {
          reference: base.matchups[0]!.participants[0],
          subject: base.matchups[0]!.participants[1],
          grid: {},
        },
      }),
    ).toThrow(/grid/)
  })
})
