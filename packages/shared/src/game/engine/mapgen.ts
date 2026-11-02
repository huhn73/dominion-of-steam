import { hexDistance, isWater, neighbors, tilesNear } from '../hex'
import type { HexCoord, Terrain } from '../types'
import { createRng, type Rng, shuffle } from './rng'
import { TERRAIN_OF_CODE } from '../mapcodec'
import { DEFAULT_WORLD_SHAPE, type WorldShape } from '../worldShapes'

export type Level = 'low' | 'normal' | 'high'

export interface MapSettings {
  width: number
  height: number
  /** Percentage of land tiles, 20–70 */
  landShare: number
  neutralCities: Level
  /** Share of forest, hills and mountains */
  terrain: Level
  seed: string
  /** Continent (default, the classic noise world), islands or archipelago */
  worldShape?: WorldShape
}

export interface GeneratedCity extends HexCoord {
  name: string
}

export interface World {
  /** One character per tile, row-major (../mapcodec.ts) */
  terrain: string
  /** One per seat, in seat order */
  capitals: HexCoord[]
  neutralCities: GeneratedCity[]
}

const ROUGH_SHARE: Record<Level, number> = { low: 0.12, normal: 0.22, high: 0.34 }
/** Land tiles per neutral city (Playtest 2: about 2.5× fewer cities than before) */
const LAND_TILES_PER_CITY: Record<Level, number> = { low: 45, normal: 30, high: 20 }

export const CITY_NAMES = [
  'Kesselstadt',
  'Rußbrück',
  'Ventil',
  'Grauwasser',
  'Südwacht',
  'Kohlgrund',
  'Nietenfeld',
  'Schlotheim',
  'Dampfhafen',
  'Messingau',
  'Zahnradbrück',
  'Kolbenrode',
  'Teerhafen',
  'Funkenberg',
  'Eisenwald',
  'Ölmark',
  'Rostfurt',
  'Ankerhorn',
  'Pumpwerk',
  'Hammerfels',
  'Nebelsund',
  'Krähenkai',
  'Bleistedt',
  'Salpeterbucht',
  'Gaslicht',
  'Bolzenbach',
  'Kupferkap',
  'Schieferhall',
  'Dieselgrund',
  'Glutstein',
  'Möwenwerft',
  'Rauchtal',
  'Stahlwacht',
  'Sturmhafen',
  'Weichenau',
  'Turbinenfeld',
  'Ladekai',
  'Ascheberg',
  'Kranichdock',
  'Signalhorn',
]

/** Smoothed value noise on a coarse grid, sampled at hex centres */
function valueNoise(width: number, height: number, cell: number, rng: Rng) {
  const gw = Math.ceil(width / cell) + 2
  const gh = Math.ceil(height / cell) + 2
  const grid = new Float64Array(gw * gh)
  for (let i = 0; i < grid.length; i++) grid[i] = rng()
  const at = (x: number, y: number) => grid[Math.min(gh - 1, y) * gw + Math.min(gw - 1, x)]!
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (col: number, row: number) => {
    const x = (col + 0.5 * (row & 1)) / cell
    const y = (row * 0.866) / cell
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const sx = smooth(x - x0)
    const sy = smooth(y - y0)
    const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx
    const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx
    return top * (1 - sy) + bottom * sy
  }
}

/** Prefixes and base words for city names beyond the classic list (40 × 40 combinations) */
const CITY_NAME_PREFIXES = [
  'Alt',
  'Neu',
  'Ober',
  'Nieder',
  'Nord',
  'Süd',
  'Ost',
  'West',
  'Eisen',
  'Kohl',
  'Dampf',
  'Rost',
  'Ruß',
  'Messing',
  'Kupfer',
  'Zahnrad',
  'Kolben',
  'Niet',
  'Schlot',
  'Kessel',
  'Teer',
  'Glut',
  'Asche',
  'Nebel',
  'Salz',
  'Sturm',
  'Funken',
  'Blei',
  'Stahl',
  'Gas',
  'Öl',
  'Schiefer',
  'Kran',
  'Signal',
  'Anker',
  'Turbinen',
  'Hammer',
  'Möwen',
  'Krähen',
  'Pump',
]
const CITY_NAME_BASES = [
  'hafen',
  'burg',
  'furt',
  'berg',
  'feld',
  'wacht',
  'heim',
  'stedt',
  'bach',
  'tal',
  'au',
  'brück',
  'horn',
  'kai',
  'werft',
  'dock',
  'grund',
  'hall',
  'bucht',
  'rode',
  'mark',
  'fels',
  'sund',
  'stein',
  'kap',
  'licht',
  'werk',
  'hain',
  'moor',
  'ried',
  'wald',
  'see',
  'born',
  'hof',
  'dorf',
  'münde',
  'eck',
  'gau',
  'hagen',
  'hausen',
]

/** Capital names live in create.ts; avoid them and the classic list when generating */
const RESERVED_NAMES = new Set([
  ...CITY_NAMES,
  'Eisenhafen',
  'Port Aurel',
  'Frostheim',
  'Salzburg',
  'Nordhavn',
  'Valdrin',
])

/** Unique generated names, drawn without repeats; only used when the classic list runs out */
export function generatedCityNames(rng: Rng, count: number): string[] {
  const combos: string[] = []
  for (const p of CITY_NAME_PREFIXES)
    for (const b of CITY_NAME_BASES) {
      const name = p + b
      if (!RESERVED_NAMES.has(name)) combos.push(name)
    }
  return shuffle(combos, rng).slice(0, count)
}

/** Deterministic world from seed and settings: terrain, capitals per seat and neutral cities */
export function generateWorld(settings: MapSettings, seats: number): World {
  const { width, height, seed } = settings
  const n = width * height
  const shape = settings.worldShape ?? DEFAULT_WORLD_SHAPE
  // The shape only enters the seed when it is not the default, so old map codes stay the same
  const rng = createRng(
    `${seed}:${width}x${height}:${settings.landShare}:${settings.terrain}:${settings.neutralCities}` +
      (shape === 'continent' ? '' : `:${shape}`),
  )
  const coarse = valueNoise(
    width,
    height,
    Math.max(3, Math.round(Math.min(width, height) / 3)),
    rng,
  )
  const fine = valueNoise(width, height, 2, rng)
  const rough = valueNoise(width, height, 2.5, rng)

  const colOf = (i: number) => i % width
  const rowOf = (i: number) => (i / width) | 0
  const coordOf = (i: number): HexCoord => ({ col: colOf(i), row: rowOf(i) })
  const indexOf = (c: HexCoord) =>
    c.col >= 0 && c.row >= 0 && c.col < width && c.row < height ? c.row * width + c.col : -1
  const onRing = (i: number) => {
    const col = colOf(i)
    const row = rowOf(i)
    return col === 0 || row === 0 || col === width - 1 || row === height - 1
  }

  const inner: number[] = []
  for (let i = 0; i < n; i++) if (!onRing(i)) inner.push(i)
  const landCount0 = Math.min(inner.length, Math.round((settings.landShare / 100) * n))
  const px = (col: number, row: number) => col + 0.5 * (row & 1)
  const py = (row: number) => row * 0.866

  // Land: a continent is noise with falloff towards the border; islands are domes around home
  // and neutral island centres with a forced strait along the Voronoi borders of the home centres.
  // Either way the top share of the inner tiles becomes land.
  const elevation = new Float64Array(n)
  const layout = shape === 'continent' ? null : islandLayout(settings, seats, landCount0, rng)
  if (!layout) {
    for (let i = 0; i < n; i++) {
      const col = colOf(i)
      const row = rowOf(i)
      const dx = Math.min(col, width - 1 - col) / (width / 2)
      const dy = Math.min(row, height - 1 - row) / (height / 2)
      const falloff = Math.min(1, Math.min(dx, dy) * 2.2)
      elevation[i] = (0.65 * coarse(col, row) + 0.35 * fine(col, row)) * (0.35 + 0.65 * falloff)
    }
  } else {
    const dome = new Float64Array(n)
    for (const isl of layout.islands) {
      const reach = isl.r + layout.params.rim
      const rows = Math.ceil(reach / 0.866)
      for (
        let row = Math.max(0, isl.row - rows);
        row <= Math.min(height - 1, isl.row + rows);
        row++
      )
        for (
          let col = Math.max(0, isl.col - Math.ceil(reach) - 1);
          col <= Math.min(width - 1, isl.col + Math.ceil(reach) + 1);
          col++
        ) {
          const d = Math.hypot(px(col, row) - isl.x, py(row) - isl.y)
          const h =
            d <= isl.r ? 1.3 : d <= reach ? 1.3 - (0.9 * (d - isl.r)) / layout.params.rim : 0
          const i = row * width + col
          if (h > dome[i]!) dome[i] = h
        }
    }
    for (let i = 0; i < n; i++) {
      const col = colOf(i)
      const row = rowOf(i)
      const c = coarse(col, row)
      elevation[i] = dome[i]! * (0.85 + 0.3 * fine(col, row)) + 0.2 * c * fine(col, row)
    }
  }

  const land = new Uint8Array(n)
  const codes = new Array<string>(n)
  let landIdx: number[] = []
  let massOf = new Int32Array(0)
  let massSizes: number[] = []
  let terrain = ''
  let capitals: HexCoord[] = []
  let cellOf: Int8Array | null = null
  const terrainOf = (c: HexCoord): Terrain | undefined => {
    const i = indexOf(c)
    return i < 0 ? undefined : TERRAIN_OF_CODE[terrain[i]!]
  }
  const buildable = (c: HexCoord) => {
    const t = terrainOf(c)
    return !!t && !isWater(t) && t !== 'mountains'
  }
  const landNeighbours = (c: HexCoord) => neighbors(c).filter(buildable).length
  const isCoast = (c: HexCoord) => neighbors(c).some((nb) => isWater(terrainOf(nb) ?? 'deepSea'))
  const massAt = (c: HexCoord) => massOf[indexOf(c)]!

  // Island worlds may widen the strait and try again should two capitals share a landmass;
  // the tests show that never happens, the continent takes a single pass.
  for (let attempt = 0; attempt < 3; attempt++) {
    land.fill(0)
    let landCount = landCount0
    let ranked = inner
    if (layout) {
      const strait = layout.strait + attempt
      cellOf = new Int8Array(n).fill(-1)
      const open: number[] = []
      for (const i of inner) {
        const col = colOf(i)
        const row = rowOf(i)
        const [d1, d2, nearest] = nearestTwo(
          layout.homes,
          ...layout.warp(px(col, row), py(row), col, row),
        )
        cellOf[i] = nearest
        const inBand = d2 - d1 + layout.params.warp * (2 * coarse(col, row) - 1) < strait
        if (!inBand) open.push(i)
      }
      ranked = open
      landCount = Math.min(landCount0, open.length)
    }
    ranked = [...ranked].sort((a, b) => elevation[b]! - elevation[a]! || a - b)
    for (let k = 0; k < landCount; k++) land[ranked[k]!] = 1
    landIdx = []
    for (let i = 0; i < n; i++) if (land[i]) landIdx.push(i)

    // Terrain on land: the roughest tiles become forest, hills and some mountains
    const roughness = new Float64Array(n)
    for (const i of landIdx) roughness[i] = rough(colOf(i), rowOf(i))
    const byRoughness = [...landIdx].sort((a, b) => roughness[b]! - roughness[a]!)
    const roughCount = Math.round(landIdx.length * ROUGH_SHARE[settings.terrain])
    for (const i of landIdx) codes[i] = '.'
    byRoughness.forEach((i, k) => {
      if (k < roughCount * 0.12) codes[i] = 'm'
      else if (k < roughCount * 0.45) codes[i] = 'h'
      else if (k < roughCount) codes[i] = 'f'
    })
    const landAt = (c: HexCoord) => {
      const i = indexOf(c)
      return i >= 0 && land[i] === 1
    }
    for (let i = 0; i < n; i++) {
      if (land[i]) continue
      codes[i] = neighbors(coordOf(i)).some(landAt) ? 's' : '~'
    }
    terrain = codes.join('')
    const masses = landmasses(width, height, (i) => land[i] === 1)
    massOf = masses.massOf
    massSizes = masses.sizes

    capitals = layout
      ? islandCapitals(
          layout,
          cellOf!,
          massOf,
          massSizes,
          width,
          height,
          buildable,
          landNeighbours,
          isCoast,
        )
      : continentCapitals(
          landIdx.map(coordOf),
          seats,
          massOf,
          massSizes,
          indexOf,
          buildable,
          landNeighbours,
          rng,
          width + height,
        )
    if (!layout) break
    if (capitals.length >= seats && new Set(capitals.map(massAt)).size === capitals.length) break
    if (attempt === 2) {
      // Last resort: the continent rule, which at least fills every seat
      capitals = continentCapitals(
        landIdx.map(coordOf),
        seats,
        massOf,
        massSizes,
        indexOf,
        buildable,
        landNeighbours,
        rng,
        width + height,
      )
    }
  }

  // Neutral cities: spread out (distance ≥ 3 from every other city), coast preferred
  const cityCount = Math.round(landIdx.length / LAND_TILES_PER_CITY[settings.neutralCities])
  const landCoords = landIdx.map(coordOf)
  const spots = shuffle(landCoords.filter(buildable), rng).sort(
    (a, b) => Number(isCoast(b)) - Number(isCoast(a)),
  )
  const blocked = new Uint8Array(n)
  const block = (c: HexCoord) => {
    for (const t of tilesNear({ width, height }, c, 2)) blocked[indexOf(t)] = 1
  }
  capitals.forEach(block)
  const neutralCities: GeneratedCity[] = []
  const place = (c: HexCoord) => {
    if (blocked[indexOf(c)]) return false
    block(c)
    neutralCities.push({ ...c, name: '' })
    return true
  }
  if (layout) {
    // Phase 1: every island gets its guaranteed cities, home islands room to grow
    const { params } = layout
    const capitalMass = new Set(capitals.map(massAt))
    const spotsByMass = new Map<number, HexCoord[]>()
    for (const c of spots) {
      const m = massAt(c)
      const list = spotsByMass.get(m)
      if (list) list.push(c)
      else spotsByMass.set(m, [c])
    }
    const order = massSizes
      .map((size, id) => ({ size, id }))
      .sort((a, b) => b.size - a.size || a.id - b.id)
    for (const { size, id } of order) {
      let target: number
      if (capitalMass.has(id))
        target = Math.min(params.homeCityMax, Math.round(size / params.homeCityDiv))
      else if (size >= params.minIslandForCity[settings.neutralCities])
        target = size >= params.secondCityAt ? 2 : 1
      else target = 0
      let placed = 0
      for (const c of spotsByMass.get(id) ?? []) {
        if (placed >= target) break
        if (place(c)) placed++
      }
    }
  }
  // Phase 2: fill up to the density of the level
  for (const c of spots) {
    if (neutralCities.length >= cityCount) break
    place(c)
  }
  const total = Math.max(cityCount, neutralCities.length)
  const classic = shuffle(CITY_NAMES, rng)
  const names =
    total > classic.length
      ? [...classic, ...generatedCityNames(rng, total - classic.length)]
      : classic
  neutralCities.forEach((c, i) => (c.name = names[i % names.length]!))

  return { terrain, capitals, neutralCities }
}

/** Connected land areas: landmass id per tile index (−1 for water) and the size of each */
export function landmasses(width: number, height: number, isLand: (i: number) => boolean) {
  const n = width * height
  const massOf = new Int32Array(n).fill(-1)
  const sizes: number[] = []
  for (let start = 0; start < n; start++) {
    if (!isLand(start) || massOf[start] !== -1) continue
    const id = sizes.length
    let size = 0
    const stack = [start]
    massOf[start] = id
    while (stack.length) {
      const cur = stack.pop()!
      size++
      for (const nb of neighbors({ col: cur % width, row: (cur / width) | 0 })) {
        if (nb.col < 0 || nb.row < 0 || nb.col >= width || nb.row >= height) continue
        const j = nb.row * width + nb.col
        if (isLand(j) && massOf[j] === -1) {
          massOf[j] = id
          stack.push(j)
        }
      }
    }
    sizes.push(size)
  }
  return { massOf, sizes }
}

/** Capitals of the continent: a random first one on a landmass big enough, then farthest-point sampling that prefers landmasses without a capital */
function continentCapitals(
  landCoords: HexCoord[],
  seats: number,
  massOf: Int32Array,
  massSizes: number[],
  indexOf: (c: HexCoord) => number,
  buildable: (c: HexCoord) => boolean,
  landNeighbours: (c: HexCoord) => number,
  rng: Rng,
  span: number,
): HexCoord[] {
  // Islands qualify from a twelfth of a seat's share of the land, so island worlds really split
  const minMass = Math.max(6, Math.round(landCoords.length / (seats * 12)))
  let candidates = landCoords.filter((c) => buildable(c) && landNeighbours(c) >= 2)
  const massAt = (c: HexCoord) => massOf[indexOf(c)]!
  const massSize = (c: HexCoord) => massSizes[massAt(c)] ?? 0
  const onBigMass = candidates.filter((c) => massSize(c) >= minMass)
  if (onBigMass.length >= seats) candidates = onBigMass
  candidates = shuffle(candidates, rng)
  const capitals: HexCoord[] = []
  if (candidates.length) capitals.push(candidates[0]!)
  while (capitals.length < seats && candidates.length) {
    const taken = new Set(capitals.map(massAt))
    let best: HexCoord | undefined
    let bestScore = -1
    for (const c of candidates) {
      if (capitals.some((k) => k.col === c.col && k.row === c.row)) continue
      const distance = Math.min(...capitals.map((k) => hexDistance(k, c)))
      const score = distance + (taken.has(massAt(c)) ? 0 : span)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    if (!best) break
    capitals.push(best)
  }
  return capitals
}

// ---------------------------------------------------------------------------------------------
// Island worlds

interface IslandParams {
  /** Home island: share of a seat's land, bounds in tiles */
  homeShare: number
  homeMin: number
  homeMax: number
  /** Neutral islands: size range in tiles */
  neutralMin: number
  neutralMax: number
  /** Width of the sloping rim around an island core (layout units) */
  rim: number
  /** Width of the forced strait between home cells; small maps get the narrower one */
  strait: number
  straitSmall: number
  /** How far the noise bends the strait */
  warp: number
  /** Islands from this size (tiles) get a guaranteed city, per neutral-cities level */
  minIslandForCity: Record<Level, number>
  /** Islands from this size get a second city */
  secondCityAt: number
  /** Home islands get round(size / homeCityDiv) cities, at most homeCityMax */
  homeCityDiv: number
  homeCityMax: number
}

export const ISLAND_PARAMS: Record<Exclude<WorldShape, 'continent'>, IslandParams> = {
  islands: {
    homeShare: 0.55,
    homeMin: 60,
    homeMax: 150,
    neutralMin: 15,
    neutralMax: 50,
    rim: 1.5,
    strait: 3,
    straitSmall: 2.5,
    warp: 1,
    minIslandForCity: { low: 20, normal: 12, high: 8 },
    secondCityAt: 40,
    homeCityDiv: 35,
    homeCityMax: 4,
  },
  archipelago: {
    homeShare: 0.3,
    homeMin: 25,
    homeMax: 50,
    neutralMin: 8,
    neutralMax: 25,
    rim: 1.2,
    strait: 3,
    straitSmall: 2.5,
    warp: 1,
    minIslandForCity: { low: 14, normal: 10, high: 8 },
    secondCityAt: 30,
    homeCityDiv: 25,
    homeCityMax: 2,
  },
}

interface Island {
  col: number
  row: number
  x: number
  y: number
  /** Core radius in layout units */
  r: number
  home: boolean
}

interface IslandLayout {
  params: IslandParams
  homes: Island[]
  islands: Island[]
  homeTiles: number
  strait: number
  /** Smooth displacement of a layout point, so the straits meander instead of running straight */
  warp: (x: number, y: number, col: number, row: number) => [number, number]
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** Core radius (layout units) for an island of `tiles` tiles: a hex covers about 0.866 units² */
const radiusFor = (tiles: number) => Math.sqrt((tiles * 0.866) / Math.PI)

/** Target sizes of an island world: how big home islands are and what is left for neutral ones */
export function islandTargets(landCount: number, seats: number, shape: WorldShape) {
  if (shape === 'continent') return null
  const params = ISLAND_PARAMS[shape]
  const perSeat = landCount / Math.max(1, seats)
  const lower = clamp(Math.floor(0.7 * perSeat), 7, params.homeMin)
  const homeTiles = clamp(Math.round(params.homeShare * perSeat), lower, params.homeMax)
  return { params, homeTiles, neutralBudget: Math.max(0, landCount - seats * homeTiles) }
}

/** Distances to the nearest and second nearest home centre and the index of the nearest */
function nearestTwo(homes: Island[], x: number, y: number): [number, number, number] {
  let d1 = Infinity
  let d2 = Infinity
  let nearest = 0
  homes.forEach((h, k) => {
    const d = Math.hypot(h.x - x, h.y - y)
    if (d < d1) {
      d2 = d1
      d1 = d
      nearest = k
    } else if (d < d2) d2 = d
  })
  return [d1, d2, nearest]
}

/**
 * Where the islands lie: one home island per seat, placed by dart throwing with a target distance,
 * then neutral islands filling the remaining land budget. Only `rng` decides, in a fixed order.
 */
function islandLayout(
  settings: MapSettings,
  seats: number,
  landCount: number,
  rng: Rng,
): IslandLayout {
  const { width, height } = settings
  // Two low-frequency noise fields bend the straits; their slope stays well below 1, so two
  // land tiles across a strait keep a gap of at least one tile in the real board
  const amplitude = 0.12 * Math.min(width, height)
  const warpCell = Math.max(4, Math.round(Math.min(width, height) / 5))
  const warpX = valueNoise(width, height, warpCell, rng)
  const warpY = valueNoise(width, height, warpCell, rng)
  const warp = (x: number, y: number, col: number, row: number): [number, number] => [
    x + amplitude * (warpX(col, row) - 0.5),
    y + amplitude * (warpY(col, row) - 0.5),
  ]
  const shape = settings.worldShape ?? DEFAULT_WORLD_SHAPE
  const targets = islandTargets(landCount, seats, shape)!
  const { params } = targets
  const small = Math.min(width, height) <= 20
  const strait = small ? params.straitSmall : params.strait
  const px = (col: number, row: number) => col + 0.5 * (row & 1)
  const py = (row: number) => row * 0.866
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y)
  const randomTile = (margin: number) => {
    const col = margin + Math.floor(rng() * Math.max(1, width - 2 * margin))
    const row = margin + Math.floor(rng() * Math.max(1, height - 2 * margin))
    return { col: Math.min(width - 2, col), row: Math.min(height - 2, row) }
  }

  // Home centres
  let homeTiles = targets.homeTiles
  let homes: Island[] = []
  for (let shrink = 0; shrink < 12 && homes.length < seats; shrink++) {
    const r = radiusFor(0.75 * homeTiles)
    const margin = Math.ceil(r + params.rim + 1)
    const side = Math.min(width, height) - 2 * margin
    const floor = 2 * r + strait + 2
    let target = Math.max(2 * r + strait + 2 * params.rim + 2, (0.8 * side) / Math.sqrt(seats))
    homes = []
    while (homes.length < seats && target >= floor - 1e-9) {
      let placed = false
      for (let dart = 0; dart < 400 && !placed; dart++) {
        const t = randomTile(margin)
        const cand: Island = { ...t, x: px(t.col, t.row), y: py(t.row), r, home: true }
        if (homes.every((h) => dist(h, cand) >= target)) {
          homes.push(cand)
          placed = true
        }
      }
      if (!placed) target *= 0.9
    }
    if (homes.length < seats) homeTiles = Math.max(7, Math.floor(homeTiles * 0.8))
  }
  // Last resort (tiny maps with many seats): farthest points on the grid, no distance rule
  while (homes.length < seats) {
    const r = radiusFor(0.75 * homeTiles)
    let best: Island | null = null
    let bestD = -1
    for (let row = 1; row < height - 1; row++)
      for (let col = 1; col < width - 1; col++) {
        const cand: Island = { col, row, x: px(col, row), y: py(row), r, home: true }
        const d = homes.length ? Math.min(...homes.map((h) => dist(h, cand))) : 0
        if (d > bestD) {
          bestD = d
          best = cand
        }
      }
    homes.push(best!)
  }

  // Neutral island centres, hashed into buckets so that an Imperium with hundreds stays linear.
  // Their size follows the room a home cell leaves: on a crowded board the islands get smaller.
  const islands: Island[] = [...homes]
  const rHome = homes[0]!.r
  const cellTiles = ((width - 2) * (height - 2)) / Math.max(1, seats)
  const neutralMax = clamp(Math.round(cellTiles / 12), params.neutralMin, params.neutralMax)
  const bucket = 2 * (radiusFor(0.75 * params.neutralMax) + params.rim + 2)
  const buckets = new Map<string, Island[]>()
  const keyOf = (x: number, y: number) => `${Math.floor(x / bucket)},${Math.floor(y / bucket)}`
  const nearby = (x: number, y: number) => {
    const bx = Math.floor(x / bucket)
    const by = Math.floor(y / bucket)
    const out: Island[] = []
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) out.push(...(buckets.get(`${bx + dx},${by + dy}`) ?? []))
    return out
  }
  // The budget is only charged for islands that found a place; misses are capped overall
  let budget = targets.neutralBudget
  let misses = 0
  while (budget > 0 && misses < 3000) {
    const size = params.neutralMin + Math.floor(rng() * (neutralMax - params.neutralMin + 1))
    const r = radiusFor(0.75 * size)
    const margin = Math.ceil(r + params.rim + 1)
    if (width - 2 * margin < 2 || height - 2 * margin < 2) {
      budget -= size
      continue
    }
    let placed = false
    for (let dart = 0; dart < 60 && !placed; dart++) {
      misses++
      const t = randomTile(margin)
      const cand: Island = { ...t, x: px(t.col, t.row), y: py(t.row), r, home: false }
      if (homes.some((h) => dist(h, cand) < rHome + r + params.rim + 1)) continue
      // The centre must lie outside the strait; an island the strait grazes just becomes two
      const [d1, d2] = nearestTwo(homes, ...warp(cand.x, cand.y, cand.col, cand.row))
      if (seats > 1 && d2 - d1 < strait + params.warp) continue
      if (nearby(cand.x, cand.y).some((o) => !o.home && dist(o, cand) < o.r + r + params.rim + 1))
        continue
      islands.push(cand)
      const key = keyOf(cand.x, cand.y)
      const list = buckets.get(key)
      if (list) list.push(cand)
      else buckets.set(key, [cand])
      budget -= size
      misses--
      placed = true
    }
  }
  // Whatever budget found no room becomes islets, so it does not swell the home islands instead
  misses = 0
  while (budget > 0 && misses < 2000) {
    const size = 6 + Math.floor(rng() * Math.min(10, Math.max(1, neutralMax - 5)))
    const r = radiusFor(0.75 * size)
    const margin = Math.ceil(r + params.rim + 1)
    if (width - 2 * margin < 2 || height - 2 * margin < 2) break
    let placed = false
    for (let dart = 0; dart < 60 && !placed; dart++) {
      misses++
      const t = randomTile(margin)
      const cand: Island = { ...t, x: px(t.col, t.row), y: py(t.row), r, home: false }
      if (homes.some((h) => dist(h, cand) < rHome + r + params.rim)) continue
      const [d1, d2] = nearestTwo(homes, ...warp(cand.x, cand.y, cand.col, cand.row))
      if (seats > 1 && d2 - d1 < strait) continue
      if (nearby(cand.x, cand.y).some((o) => !o.home && dist(o, cand) < o.r + r + params.rim))
        continue
      islands.push(cand)
      const key = keyOf(cand.x, cand.y)
      const list = buckets.get(key)
      if (list) list.push(cand)
      else buckets.set(key, [cand])
      budget -= size
      placed = true
    }
  }
  return { params, homes, islands, homeTiles, strait, warp }
}

/** One capital per home cell: coastal, buildable, with room around it, on the island of the centre */
function islandCapitals(
  layout: IslandLayout,
  cellOf: Int8Array,
  massOf: Int32Array,
  massSizes: number[],
  width: number,
  height: number,
  buildable: (c: HexCoord) => boolean,
  landNeighbours: (c: HexCoord) => number,
  isCoast: (c: HexCoord) => boolean,
): HexCoord[] {
  const n = width * height
  const capitals: HexCoord[] = []
  const used = new Set<number>()
  layout.homes.forEach((home, k) => {
    const centreIdx = home.row * width + home.col
    // The island of the centre, otherwise the biggest landmass of the cell
    let mass = massOf[centreIdx]!
    if (mass < 0) {
      const count = new Map<number, number>()
      for (let i = 0; i < n; i++)
        if (cellOf[i] === k && massOf[i]! >= 0)
          count.set(massOf[i]!, (count.get(massOf[i]!) ?? 0) + 1)
      let best = -1
      let bestSize = -1
      for (const [id, size] of [...count.entries()].sort((a, b) => a[0] - b[0]))
        if (size > bestSize) {
          best = id
          bestSize = size
        }
      mass = best
    }
    void massSizes
    const tiers: ((c: HexCoord) => boolean)[] = [
      (c) => buildable(c) && landNeighbours(c) >= 2 && isCoast(c),
      (c) => buildable(c) && landNeighbours(c) >= 1 && isCoast(c),
      (c) => buildable(c) && isCoast(c),
      (c) => buildable(c) && landNeighbours(c) >= 2,
      (c) => buildable(c),
      () => true,
    ]
    for (const ok of tiers) {
      let best: HexCoord | null = null
      let bestD = Infinity
      for (let i = 0; i < n; i++) {
        if (
          used.has(i) ||
          massOf[i] !== mass ||
          (mass >= 0 && cellOf[i] !== k && massOf[i] !== mass)
        )
          continue
        if (mass < 0) continue
        const c = { col: i % width, row: (i / width) | 0 }
        if (!ok(c)) continue
        const d = hexDistance(c, home)
        if (d < bestD) {
          bestD = d
          best = c
        }
      }
      if (best) {
        capitals.push(best)
        used.add(best.row * width + best.col)
        return
      }
    }
  })
  return capitals
}

// Map codes live in ../seed.ts so the web app can create them without the engine
export { randomSeed } from '../seed'
