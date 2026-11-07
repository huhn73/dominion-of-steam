import { describe, expect, it } from 'vitest'
import { translateMessage } from '../../../i18n'

const de = (m: Parameters<typeof translateMessage>[1]) => translateMessage('de', m)
import {
  createMatch,
  defaultRules,
  endTurn,
  generateWorld,
  type GameState,
  normalizeState,
  playAITurn,
  projectView,
} from '..'
import { countBits } from '../../bits'
import { MAP_SIZE_OPTIONS, MAP_SIZES, mapSizeLabel } from '../../mapSizes'
import { expandMap, isWaterCode } from '../../mapcodec'
import { validateDraft } from '../../../setup/validate'
import { defaultDraft, SETUP_OPTIONS } from '../../../setup/data'
import { city, makeState, PLAINS, unit } from './fixtures'

const NOW = new Date('2026-11-01T12:00:00Z')

const settingsOf = (size: keyof typeof MAP_SIZES, seed = 'KARTE-1') => ({
  width: MAP_SIZES[size].width,
  height: MAP_SIZES[size].height,
  landShare: 45,
  neutralCities: 'normal' as const,
  terrain: 'normal' as const,
  seed,
})

describe('Kartengrößen: Stufen', () => {
  it('kennt fünf quadratische Stufen mit Vorgaben', () => {
    expect(MAP_SIZE_OPTIONS.map((s) => [s.id, s.width, s.height, s.defaultRoundLimit])).toEqual([
      ['small', 20, 20, 50],
      ['medium', 40, 40, 150],
      ['large', 75, 75, 150],
      ['huge', 130, 130, 250],
      ['empire', 200, 200, 500],
    ])
    expect(SETUP_OPTIONS.mapSizes).toBe(MAP_SIZE_OPTIONS)
    expect(de(mapSizeLabel(200, 200))).toBe('Imperium')
    expect(de(mapSizeLabel(14, 10))).toBe('14×10')
  })

  it('erlaubt „kein Rundenlimit“ nur mit anderer Siegbedingung', () => {
    const draft = defaultDraft()
    draft.factionId = 'eisenbund'
    const ok = validateDraft(
      { ...draft, roundLimit: null, victoryCondition: 'capitals' },
      new Set(),
    )
    expect(ok.ok).toBe(true)
    const bad = validateDraft(
      { ...draft, roundLimit: null, victoryCondition: 'roundLimit' },
      new Set(),
    )
    expect(bad.ok).toBe(false)
  })
})

describe('Kartengrößen: Generator', () => {
  it.each(['small', 'medium', 'large'] as const)(
    'setzt auf %s Städte proportional zur Landfläche und benennt sie eindeutig',
    (size) => {
      const world = generateWorld(settingsOf(size), 4)
      const land = [...world.terrain].filter((c) => !isWaterCode(c)).length
      expect(world.capitals).toHaveLength(4)
      expect(world.neutralCities.length).toBeGreaterThanOrEqual(Math.floor((land / 30) * 0.85))
      expect(world.neutralCities.length).toBeLessThanOrEqual(Math.ceil((land / 30) * 1.15) + 1)
      expect(new Set(world.neutralCities.map((c) => c.name)).size).toBe(world.neutralCities.length)
    },
  )

  it('findet sechs Hauptstädte auf einer kleinen Inselwelt', () => {
    const world = generateWorld({ ...settingsOf('small'), landShare: 20 }, 6)
    expect(world.capitals).toHaveLength(6)
  })

  it('erzeugt Imperium in unter zwei Sekunden mit eindeutigen Namen', { timeout: 20_000 }, () => {
    const t0 = performance.now()
    const world = generateWorld(settingsOf('empire'), 6)
    const ms = performance.now() - t0
    expect(ms).toBeLessThan(2000)
    expect(world.terrain).toHaveLength(40_000)
    expect(world.neutralCities.length).toBeGreaterThan(400)
    expect(new Set(world.neutralCities.map((c) => c.name)).size).toBe(world.neutralCities.length)
    expect(generateWorld(settingsOf('empire'), 6).neutralCities).toEqual(world.neutralCities)
  })
})

describe('Kartengrößen: alte Spielstände', () => {
  it('rechnet Feldlisten und Schlüssel-Listen in das kompakte Format um', () => {
    const fresh = makeState({
      map: ['~~~~', '~..~', '~f.~', '~~~~'],
      units: [unit('a', 'grenadiere', 'p1', 1, 1), unit('b', 'grenadiere', 'p2', 2, 2)],
      cities: [city('c', 'p1', 1, 1)],
      unexplored: ['3,3', '0,0'],
    })
    const legacy = structuredClone(fresh) as unknown as GameState & {
      map: { tiles?: unknown[] }
      participants: { explored: unknown }[]
    }
    legacy.map.tiles = expandMap({ ...fresh.map, visibility: 'u'.repeat(16) }).map(
      ({ col, row, terrain }) => ({ col, row, terrain }),
    )
    delete (legacy.map as { terrain?: string }).terrain
    for (const p of legacy.participants) {
      const keys: string[] = []
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++)
          if (!['3,3', '0,0'].includes(`${col},${row}`)) keys.push(`${col},${row}`)
      p.explored = keys as unknown as string
    }
    const migrated = normalizeState(legacy as unknown as GameState)
    expect(migrated.map.terrain).toBe(fresh.map.terrain)
    expect(migrated.participants[0]!.explored).toBe(fresh.participants[0]!.explored)
    expect(countBits(migrated.participants[1]!.explored)).toBe(14)
    expect(projectView(migrated, 'p1').map).toEqual(projectView(fresh, 'p1').map)
  })
})

describe('Kartengrößen: KI auf Imperium', () => {
  const participants = [
    {
      id: 'p1',
      name: 'Kessler',
      factionId: 'aurelia',
      color: 'rose' as const,
      isAI: true,
      aiDifficulty: 'normal' as const,
    },
    {
      id: 'p2',
      name: 'Ostrow',
      factionId: 'salzkueste',
      color: 'lime' as const,
      isAI: true,
      aiDifficulty: 'hard' as const,
    },
  ]

  it('bleibt je KI-Zug unter zehn Sekunden und ist reproduzierbar', { timeout: 180_000 }, () => {
    const start = createMatch({
      id: 'imp',
      name: 'Imperium',
      rules: { ...defaultRules('live'), roundLimit: 500 },
      map: settingsOf('empire', 'IMPERIUM-1'),
      participants,
    })
    expect(JSON.stringify(start).length).toBeLessThan(600_000)
    const play = (rounds: number) => {
      let s = structuredClone(start)
      const times: number[] = []
      for (let r = 0; r < rounds; r++) {
        for (let seat = 0; seat < participants.length; seat++) {
          const current = s.participants[s.seat]!
          const t0 = performance.now()
          s = playAITurn(s, current.id, NOW)
          times.push(performance.now() - t0)
          s = endTurn(s, NOW)
        }
      }
      return { s, times }
    }
    const a = play(3)
    for (const t of a.times) expect(t).toBeLessThan(10_000)
    expect(a.s.round).toBe(4)
    const b = play(2)
    const c = play(2)
    expect(b.s).toEqual(c.s)
    // The view stays small on the wire
    const view = projectView(a.s, 'p1')
    expect(view.map.visibility).toHaveLength(40_000)
    expect(JSON.stringify(view).length).toBeLessThan(300_000)
  })
})

describe('Kartengrößen: Verlauf wird gekürzt', () => {
  it('behält nur Log und Ereignisse, die noch jemand sehen kann', () => {
    let s = makeState({
      map: PLAINS,
      units: [unit('a', 'panzerwagen', 'p1', 1, 1), unit('b', 'grenadiere', 'p2', 6, 4)],
    })
    for (let i = 0; i < 6; i++) {
      s = endTurn(s, NOW)
      s = endTurn(s, NOW)
    }
    const minSeq = Math.min(...s.participants.map((p) => p.lastTurnEndSeq))
    expect(s.log.every((l) => l.seq > minSeq)).toBe(true)
    expect(s.events.every((e) => e.seq > minSeq || e.round >= s.round - 1)).toBe(true)
  })
})
