import { generateWorld, islandTargets, landmasses } from '@dos/shared/engine'
import { MAP_SIZES, type MapSizeId } from '@dos/shared/game/mapSizes'
import { isWaterCode } from '@dos/shared/game/mapcodec'
import { neighbors } from '@dos/shared/game/hex'
import type { WorldShape } from '@dos/shared/game/worldShapes'

export interface MapStatsOptions {
  shape: WorldShape
  sizes: MapSizeId[]
  shares: number[]
  seats: number[]
  seeds: number
}

export interface MapStatsRow {
  size: MapSizeId
  share: number
  seats: number
  worlds: number
  /** Worlds in which every capital sits on its own landmass */
  separated: number
  /** Capitals next to water */
  coastal: number
  capitals: number
  homeMin: number
  homeAvg: number
  homeMax: number
  homeTarget: number | null
  /** Landmasses of at least 6 tiles without a capital, per world */
  neutralIslands: number
  cities: number
  cityTarget: number
  landPct: number
  ms: number
}

/** Generate worlds for every combination and measure what an island world promises */
export function mapStats(opts: MapStatsOptions): MapStatsRow[] {
  const rows: MapStatsRow[] = []
  for (const size of opts.sizes) {
    const { width, height } = MAP_SIZES[size]
    for (const share of opts.shares) {
      for (const seats of opts.seats) {
        const row: MapStatsRow = {
          size,
          share,
          seats,
          worlds: opts.seeds,
          separated: 0,
          coastal: 0,
          capitals: 0,
          homeMin: Infinity,
          homeAvg: 0,
          homeMax: 0,
          homeTarget:
            islandTargets(Math.round((share / 100) * width * height), seats, opts.shape)
              ?.homeTiles ?? null,
          neutralIslands: 0,
          cities: 0,
          cityTarget: 0,
          landPct: 0,
          ms: 0,
        }
        let homeSum = 0
        for (let i = 0; i < opts.seeds; i++) {
          const t0 = performance.now()
          const world = generateWorld(
            {
              width,
              height,
              landShare: share,
              neutralCities: 'normal',
              terrain: 'normal',
              seed: `MASS-${i}`,
              worldShape: opts.shape,
            },
            seats,
          )
          row.ms += performance.now() - t0
          const isLand = (idx: number) => !isWaterCode(world.terrain[idx])
          const { massOf, sizes } = landmasses(width, height, isLand)
          const capMasses = world.capitals.map((c) => massOf[c.row * width + c.col]!)
          if (world.capitals.length === seats && new Set(capMasses).size === seats) row.separated++
          for (const c of world.capitals) {
            row.capitals++
            const coast = neighbors(c).some(
              (nb) =>
                nb.col >= 0 &&
                nb.row >= 0 &&
                nb.col < width &&
                nb.row < height &&
                isWaterCode(world.terrain[nb.row * width + nb.col]),
            )
            if (coast) row.coastal++
          }
          for (const m of capMasses) {
            const s = sizes[m] ?? 0
            row.homeMin = Math.min(row.homeMin, s)
            row.homeMax = Math.max(row.homeMax, s)
            homeSum += s
          }
          row.neutralIslands += sizes.filter((s, id) => s >= 6 && !capMasses.includes(id)).length
          row.cities += world.neutralCities.length
          let land = 0
          for (let k = 0; k < width * height; k++) if (isLand(k)) land++
          row.landPct += (land / (width * height)) * 100
          row.cityTarget += Math.round(land / 30)
        }
        const n = opts.seeds
        row.homeAvg = homeSum / (n * seats)
        row.neutralIslands /= n
        row.cities /= n
        row.cityTarget /= n
        row.landPct /= n
        row.ms /= n
        if (!Number.isFinite(row.homeMin)) row.homeMin = 0
        rows.push(row)
      }
    }
  }
  return rows
}

const de = (x: number, d = 0) => x.toFixed(d).replace('.', ',')

export function renderMapStats(shape: WorldShape, rows: MapStatsRow[]): string {
  const lines = [
    `Weltform ${shape}`,
    'Stufe   Land Sitze  getrennt  Küste  Heimat min/Ø/max (Ziel)  Neutralinseln≥6  Städte (Ziel)  Land erreicht  ms/Welt',
  ]
  for (const r of rows) {
    lines.push(
      [
        r.size.padEnd(7),
        `${r.share} %`.padStart(4),
        String(r.seats).padStart(5),
        `${r.separated}/${r.worlds}`.padStart(9),
        `${r.coastal}/${r.capitals}`.padStart(7),
        `${r.homeMin}/${de(r.homeAvg)}/${r.homeMax} (${r.homeTarget ?? '–'})`.padStart(24),
        de(r.neutralIslands, 1).padStart(16),
        `${de(r.cities, 1)} (${de(r.cityTarget, 1)})`.padStart(14),
        `${de(r.landPct, 1)} %`.padStart(13),
        de(r.ms, 1).padStart(8),
      ].join(' '),
    )
  }
  return lines.join('\n')
}
