import { describe, expect, it } from 'vitest'
import { generateWorld } from '..'
import { hashString } from '../rng'
import { MAP_SIZES } from '../../mapSizes'

const settingsOf = (size: keyof typeof MAP_SIZES, landShare: number, seed: string) => ({
  width: MAP_SIZES[size].width,
  height: MAP_SIZES[size].height,
  landShare,
  neutralCities: 'normal' as const,
  terrain: 'normal' as const,
  seed,
})

describe('Inselwelt: Kontinent unverändert', () => {
  // Golden hashes of worlds generated before the island shapes existed (Node 24). A new world
  // shape must never change the continent a known map code produces.
  const golden: [keyof typeof MAP_SIZES, number, number, string, number][] = [
    ['small', 20, 6, 'KOHLE-4417', 728108120],
    ['small', 45, 2, 'A-1', 3041375435],
    ['medium', 35, 4, 'KOHLE-4417', 836088141],
    ['medium', 70, 3, 'A-1', 2075032609],
    ['large', 30, 6, 'KOHLE-4417', 3101225917],
    ['large', 45, 4, 'A-1', 943411808],
  ]

  it.each(golden)('%s, %i %% Land, %i Sitze, %s', (size, landShare, seats, seed, hash) => {
    const settings = settingsOf(size, landShare, seed)
    expect(hashString(JSON.stringify(generateWorld(settings, seats)))).toBe(hash)
    // the default shape spelled out is the same world
    expect(generateWorld({ ...settings, worldShape: 'continent' }, seats)).toEqual(
      generateWorld(settings, seats),
    )
  })
})

import { islandTargets, landmasses } from '..'
import { isWaterCode } from '../../mapcodec'
import { neighbors } from '../../hex'

type Shape = 'islands' | 'archipelago'

function analyse(
  size: keyof typeof MAP_SIZES,
  landShare: number,
  seats: number,
  seed: string,
  shape: Shape,
) {
  const { width, height } = MAP_SIZES[size]
  const world = generateWorld({ ...settingsOf(size, landShare, seed), worldShape: shape }, seats)
  const isLand = (i: number) => !isWaterCode(world.terrain[i])
  const { massOf, sizes } = landmasses(width, height, isLand)
  const capMasses = world.capitals.map((c) => massOf[c.row * width + c.col]!)
  const inMap = (c: { col: number; row: number }) =>
    c.col >= 0 && c.row >= 0 && c.col < width && c.row < height
  const coastal = world.capitals.every((c) =>
    neighbors(c).some((nb) => inMap(nb) && isWaterCode(world.terrain[nb.row * width + nb.col])),
  )
  let land = 0
  for (let i = 0; i < width * height; i++) if (isLand(i)) land++
  const homeSizes = capMasses.map((m) => sizes[m] ?? 0)
  const neutral = sizes.filter((s, id) => s >= 6 && !capMasses.includes(id)).length
  const citiesOnMass = (mass: number) =>
    world.neutralCities.filter((c) => massOf[c.row * width + c.col] === mass).length
  return {
    world,
    width,
    height,
    massOf,
    sizes,
    capMasses,
    coastal,
    land,
    homeSizes,
    neutral,
    citiesOnMass,
  }
}

describe('Inselwelt: Garantien', () => {
  const sizes = ['small', 'medium'] as const
  const shares = [20, 35, 50]
  const seatsList = [2, 4, 6]
  const SEEDS = 20

  for (const shape of ['islands', 'archipelago'] as Shape[]) {
    it(
      `${shape}: jede Hauptstadt auf eigener Landmasse, an der Küste, Städte mit Abstand`,
      { timeout: 120_000 },
      () => {
        for (const size of sizes)
          for (const landShare of shares)
            for (const seats of seatsList)
              for (let i = 0; i < SEEDS; i++) {
                const a = analyse(size, landShare, seats, `INSEL-${i}`, shape)
                const label = `${shape} ${size} ${landShare} % ${seats} Sitze Seed ${i}`
                expect(a.world.capitals, label).toHaveLength(seats)
                expect(new Set(a.capMasses).size, label).toBe(seats)
                if (size === 'medium') expect(a.coastal, label).toBe(true)
                const all = [...a.world.capitals, ...a.world.neutralCities]
                for (const [k, c] of all.entries())
                  for (const other of all.slice(k + 1))
                    expect(
                      Math.max(Math.abs(c.col - other.col), Math.abs(c.row - other.row)),
                      label,
                    ).toBeGreaterThanOrEqual(2)
              }
      },
    )
  }

  it('große Karten: getrennt und an der Küste auch mit sechs Sitzen', { timeout: 120_000 }, () => {
    for (const shape of ['islands', 'archipelago'] as Shape[]) {
      for (let i = 0; i < 6; i++) {
        const a = analyse('large', 35, 6, `GROSS-${i}`, shape)
        expect(new Set(a.capMasses).size).toBe(6)
        expect(a.coastal).toBe(true)
      }
      for (const size of ['huge', 'empire'] as const) {
        const a = analyse(size, 35, 6, 'RIESIG-1', shape)
        expect(new Set(a.capMasses).size).toBe(6)
      }
    }
  })

  it('Heimatinseln liegen im Zielband und sind ähnlich groß', () => {
    for (const size of ['medium', 'large'] as const)
      for (const landShare of [20, 35])
        for (const seats of [2, 4]) {
          const { width, height } = MAP_SIZES[size]
          const target = islandTargets(
            Math.round((landShare / 100) * width * height),
            seats,
            'islands',
          )!.homeTiles
          let similar = 0
          for (let i = 0; i < 15; i++) {
            const a = analyse(size, landShare, seats, `HEIM-${i}`, 'islands')
            for (const s of a.homeSizes) {
              expect(s, `${size} ${landShare} % ${seats} Sitze Seed ${i}`).toBeGreaterThanOrEqual(
                0.5 * target,
              )
              expect(s).toBeLessThanOrEqual(2.5 * target)
            }
            if (Math.max(...a.homeSizes) / Math.min(...a.homeSizes) <= 2.2) similar++
          }
          expect(similar, `${size} ${landShare} % ${seats} Sitze`).toBeGreaterThanOrEqual(12)
        }
  })

  it('neutrale Inseln liegen dazwischen und tragen Städte, Heimatinseln haben Platz', () => {
    for (let i = 0; i < 10; i++) {
      const a = analyse('medium', 35, 4, `NEUTRAL-${i}`, 'islands')
      expect(a.neutral, `Seed ${i}`).toBeGreaterThanOrEqual(2)
      a.sizes.forEach((s, id) => {
        if (s >= 12 && !a.capMasses.includes(id))
          expect(a.citiesOnMass(id), `Seed ${i} Masse ${id}`).toBeGreaterThanOrEqual(1)
      })
      for (const m of a.capMasses)
        expect(a.citiesOnMass(m), `Seed ${i} Heimat`).toBeGreaterThanOrEqual(2)
      const b = analyse('large', 35, 4, `NEUTRAL-${i}`, 'islands')
      expect(b.neutral).toBeGreaterThanOrEqual(4)
    }
  })

  it('hält den Landanteil, bis auf kleine Karten voller Meerengen', () => {
    for (const size of ['medium', 'large'] as const)
      for (const landShare of [20, 35, 50]) {
        const a = analyse(size, landShare, 4, 'LAND-1', 'islands')
        expect((a.land / (a.width * a.height)) * 100).toBeCloseTo(landShare, 0)
      }
    const small = analyse('small', 70, 6, 'LAND-1', 'islands')
    const pct = (small.land / 400) * 100
    // six home cells on 400 tiles: the straits alone take a quarter of the board
    expect(pct).toBeLessThanOrEqual(70)
    expect(pct).toBeGreaterThanOrEqual(45)
  })

  it('Randring bleibt Wasser, Welten sind deterministisch und je Weltform verschieden', () => {
    const settings = { ...settingsOf('medium', 35, 'RAND-1'), worldShape: 'islands' as const }
    const a = generateWorld(settings, 4)
    expect(a).toEqual(generateWorld(settings, 4))
    expect(a.terrain).not.toBe(generateWorld({ ...settings, worldShape: 'archipelago' }, 4).terrain)
    expect(a.terrain).not.toBe(generateWorld({ ...settings, worldShape: 'continent' }, 4).terrain)
    const { width, height } = MAP_SIZES.medium
    for (let col = 0; col < width; col++) {
      expect(isWaterCode(a.terrain[col])).toBe(true)
      expect(isWaterCode(a.terrain[(height - 1) * width + col])).toBe(true)
    }
    for (let row = 0; row < height; row++) {
      expect(isWaterCode(a.terrain[row * width])).toBe(true)
      expect(isWaterCode(a.terrain[row * width + width - 1])).toBe(true)
    }
  })

  it('Imperium mit sechs Sitzen bleibt unter zwei Sekunden', () => {
    for (const shape of ['islands', 'archipelago'] as Shape[]) {
      const t0 = performance.now()
      const a = analyse('empire', 35, 6, 'IMPERIUM-1', shape)
      expect(performance.now() - t0).toBeLessThan(2000)
      expect(new Set(a.capMasses).size).toBe(6)
      expect(a.world.neutralCities.length).toBeGreaterThan(300)
    }
  })
})
