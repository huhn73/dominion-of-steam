import type { AiProfile, Level, VictoryCondition } from '@dos/shared/engine'
import { isWorldShape, type WorldShape } from '@dos/shared/game/worldShapes'
import { FACTIONS, MAP_SIZES, type MapSizeId } from '@dos/shared/game/catalog'
import { aiPersonality } from '@dos/shared/setup/data'
import { checkCatalogEntry, type CatalogOverride } from './catalogOverride'

export type Difficulty = 'easy' | 'normal' | 'hard'
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard']
const LEVELS: readonly Level[] = ['low', 'normal', 'high']
const VICTORY: readonly VictoryCondition[] = ['elimination', 'capitals', 'roundLimit', 'dominance']

/** Fields of the AI profile a config may override or sweep */
export const PROFILE_KEYS = [
  'difficulty',
  'attackThreshold',
  'skipShare',
  'specialShare',
  'shipShare',
  'maxShips',
  'neutralBias',
  'garrison',
  'siege',
  'siegeRatio',
  'cityValue',
  'replan',
  'defend',
  'fortify',
  'armourShare',
  'repair',
  'garrisonTarget',
  'subShare',
  'transports',
  'maxTransports',
  'departAt',
  'scoutShips',
  'dominanceDrive',
  'scoutShare',
  'maxScouts',
  'bomberShare',
  'maxBombers',
  'memoryRounds',
  'strike',
  'musterDistance',
] as const satisfies readonly (keyof AiProfile)[]
export type ProfileKey = (typeof PROFILE_KEYS)[number]
export type ProfileOverride = Partial<Pick<AiProfile, ProfileKey>>

export interface SimParticipantConfig {
  /** Stable name across seat rotations, e.g. "hard-eisenbund" */
  label: string
  factionId: string
  difficulty: Difficulty
  personalityId?: string | null
  /** Simulation-only overrides of the AI profile */
  profile?: ProfileOverride
}

export interface MatchupConfig {
  id: string
  participants: SimParticipantConfig[]
  /** Set by the sweep: the grid point this matchup tests */
  sweepParams?: ProfileOverride
  /** Unit and faction values for this matchup (on top of the config's catalog) */
  catalog?: CatalogOverride
  /** Set by a catalog sweep: the grid point id ("sweep-0" is the baseline) and its values */
  sweepPoint?: string
  catalogParams?: CatalogOverride
}

export interface MapConfig {
  size: MapSizeId | { width: number; height: number }
  worldShape: WorldShape
  landShare: number
  neutralCities: Level
  terrain: Level
}

/** AI profile sweep: the subject with overrides against the reference */
export interface ProfileSweepConfig {
  kind: 'profile'
  reference: SimParticipantConfig
  subject: SimParticipantConfig
  grid: Partial<Record<ProfileKey, (number | boolean | string)[]>>
}

/** Catalog sweep: every grid point plays all matchups of the config with these values */
export interface CatalogSweepConfig {
  kind: 'catalog'
  catalogGrid: Record<string, number[]>
}

export type SweepConfig = ProfileSweepConfig | CatalogSweepConfig

export interface SimConfig {
  name: string
  matchups: MatchupConfig[]
  maps: MapConfig[]
  seeds: number | string[]
  /** Play every seed once per seat order so that no label keeps the first seat */
  rotateSeats: boolean
  /** Also the hard cap for 'elimination', 'capitals' and 'dominance' */
  roundLimit: number
  victoryCondition: VictoryCondition
  workers?: number
  sweep?: SweepConfig
  /** Unit and faction values for all matchups */
  catalog?: CatalogOverride
}

export class ConfigError extends Error {}

function fail(path: string, message: string): never {
  throw new ConfigError(`${path}: ${message}`)
}
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)
const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x)
const oneOf = <T extends string>(x: unknown, allowed: readonly T[]): x is T =>
  typeof x === 'string' && (allowed as readonly string[]).includes(x)

const FACTION_IDS = FACTIONS.map((f) => f.id)

function parseProfileValue(key: ProfileKey, value: unknown, path: string) {
  switch (key) {
    case 'difficulty':
      if (!oneOf(value, DIFFICULTIES)) fail(path, `Stufe muss ${DIFFICULTIES.join(', ')} sein`)
      return value
    case 'replan':
      if (!oneOf(value, ['none', 'goto', 'all'] as const))
        fail(path, 'muss none, goto oder all sein')
      return value
    case 'garrison':
    case 'siege':
    case 'cityValue':
    case 'defend':
    case 'fortify':
    case 'repair':
    case 'transports':
    case 'dominanceDrive':
    case 'strike':
      if (typeof value !== 'boolean') fail(path, 'muss true oder false sein')
      return value
    case 'maxShips':
    case 'garrisonTarget':
    case 'maxTransports':
    case 'departAt':
    case 'scoutShips':
    case 'maxScouts':
    case 'maxBombers':
    case 'memoryRounds':
    case 'musterDistance':
      if (!isInt(value) || value < 0) fail(path, 'muss eine ganze Zahl ≥ 0 sein')
      return value
    case 'neutralBias':
    case 'siegeRatio':
      if (typeof value !== 'number' || value < 0) fail(path, 'muss eine Zahl ≥ 0 sein')
      return value
    default:
      if (typeof value !== 'number' || value < 0 || value > 1)
        fail(path, 'muss zwischen 0 und 1 liegen')
      return value
  }
}

export function parseProfile(raw: unknown, path: string): ProfileOverride {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!oneOf(key, PROFILE_KEYS))
      fail(`${path}.${key}`, `unbekanntes Profilfeld (${PROFILE_KEYS.join(', ')})`)
    out[key] = parseProfileValue(key, value, `${path}.${key}`)
  }
  return out as ProfileOverride
}

export function parseParticipant(raw: unknown, path: string): SimParticipantConfig {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  const { label, factionId, difficulty, personalityId, profile } = raw
  if (typeof label !== 'string' || !label.trim()) fail(`${path}.label`, 'fehlt')
  if (!oneOf(factionId, FACTION_IDS))
    fail(`${path}.factionId`, `unbekannt (${FACTION_IDS.join(', ')})`)
  if (!oneOf(difficulty, DIFFICULTIES))
    fail(`${path}.difficulty`, `muss ${DIFFICULTIES.join(', ')} sein`)
  if (personalityId != null) {
    if (typeof personalityId !== 'string') fail(`${path}.personalityId`, 'muss ein String sein')
    if (!aiPersonality(personalityId))
      fail(`${path}.personalityId`, `unbekannte Persönlichkeit "${personalityId}"`)
  }
  return {
    label,
    factionId,
    difficulty,
    personalityId: typeof personalityId === 'string' ? personalityId : null,
    ...(profile !== undefined ? { profile: parseProfile(profile, `${path}.profile`) } : {}),
  }
}

export function parseCatalog(raw: unknown, path: string): CatalogOverride {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  const out: CatalogOverride = {}
  for (const [key, value] of Object.entries(raw)) {
    const error = checkCatalogEntry(key, value)
    if (error) fail(`${path}.${key}`, error)
    out[key] = value as number
  }
  return out
}

export function parseMatchup(raw: unknown, path: string): MatchupConfig {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  if (typeof raw.id !== 'string' || !raw.id.trim()) fail(`${path}.id`, 'fehlt')
  if (!Array.isArray(raw.participants) || raw.participants.length < 2)
    fail(`${path}.participants`, 'braucht mindestens zwei Teilnehmer')
  if (raw.participants.length > 6) fail(`${path}.participants`, 'höchstens sechs Teilnehmer')
  const participants = raw.participants.map((p, i) =>
    parseParticipant(p, `${path}.participants[${i}]`),
  )
  const labels = new Set(participants.map((p) => p.label))
  if (labels.size !== participants.length)
    fail(`${path}.participants`, 'Labels müssen eindeutig sein')
  return {
    id: raw.id,
    participants,
    ...(raw.catalog !== undefined ? { catalog: parseCatalog(raw.catalog, `${path}.catalog`) } : {}),
  }
}

export function parseMap(raw: unknown, path: string): MapConfig {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  let size: MapConfig['size']
  if (typeof raw.size === 'string') {
    if (!(raw.size in MAP_SIZES))
      fail(`${path}.size`, `unbekannt (${Object.keys(MAP_SIZES).join(', ')})`)
    size = raw.size as MapSizeId
  } else if (isRecord(raw.size) && isInt(raw.size.width) && isInt(raw.size.height)) {
    const { width, height } = raw.size
    if (width < 6 || height < 6 || width > 256 || height > 256)
      fail(`${path}.size`, 'Breite und Höhe müssen zwischen 6 und 256 liegen')
    size = { width, height }
  } else fail(`${path}.size`, 'Name einer Kartengröße oder { width, height }')
  const landShare = raw.landShare ?? 35
  if (typeof landShare !== 'number' || landShare < 20 || landShare > 70)
    fail(`${path}.landShare`, 'muss zwischen 20 und 70 liegen')
  const neutralCities = raw.neutralCities ?? 'normal'
  if (!oneOf(neutralCities, LEVELS)) fail(`${path}.neutralCities`, `muss ${LEVELS.join(', ')} sein`)
  const terrain = raw.terrain ?? 'normal'
  if (!oneOf(terrain, LEVELS)) fail(`${path}.terrain`, `muss ${LEVELS.join(', ')} sein`)
  const worldShape = raw.worldShape ?? 'continent'
  if (!isWorldShape(worldShape))
    fail(`${path}.worldShape`, 'muss continent, islands oder archipelago sein')
  return { size, worldShape, landShare, neutralCities, terrain }
}

export function parseSweep(raw: unknown, path: string): SweepConfig {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  if (raw.catalogGrid !== undefined) {
    if (raw.grid !== undefined || raw.subject !== undefined || raw.reference !== undefined)
      fail(path, 'catalogGrid nicht zusammen mit grid, subject oder reference')
    if (!isRecord(raw.catalogGrid) || Object.keys(raw.catalogGrid).length === 0)
      fail(`${path}.catalogGrid`, 'fehlt oder ist leer')
    const catalogGrid: Record<string, number[]> = {}
    for (const [key, values] of Object.entries(raw.catalogGrid)) {
      if (!Array.isArray(values) || values.length === 0)
        fail(`${path}.catalogGrid.${key}`, 'muss eine nicht leere Liste sein')
      values.forEach((v, i) => {
        const error = checkCatalogEntry(key, v)
        if (error) fail(`${path}.catalogGrid.${key}[${i}]`, error)
      })
      catalogGrid[key] = values as number[]
    }
    return { kind: 'catalog', catalogGrid }
  }
  const reference = parseParticipant(raw.reference, `${path}.reference`)
  const subject = parseParticipant(raw.subject, `${path}.subject`)
  if (reference.label === subject.label)
    fail(path, 'reference und subject brauchen verschiedene Labels')
  if (!isRecord(raw.grid) || Object.keys(raw.grid).length === 0)
    fail(`${path}.grid`, 'fehlt oder ist leer')
  const grid: ProfileSweepConfig['grid'] = {}
  for (const [key, values] of Object.entries(raw.grid)) {
    if (!oneOf(key, PROFILE_KEYS))
      fail(`${path}.grid.${key}`, `unbekanntes Profilfeld (${PROFILE_KEYS.join(', ')})`)
    if (!Array.isArray(values) || values.length === 0)
      fail(`${path}.grid.${key}`, 'muss eine nicht leere Liste sein')
    grid[key] = values.map((v, i) =>
      parseProfileValue(key, v, `${path}.grid.${key}[${i}]`),
    ) as never
  }
  return { kind: 'profile', reference, subject, grid }
}

/** Validate a raw JSON config and fill in the defaults */
export function parseConfig(raw: unknown, path = 'config'): SimConfig {
  if (!isRecord(raw)) fail(path, 'muss ein Objekt sein')
  if (typeof raw.name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(raw.name))
    fail(`${path}.name`, 'fehlt oder enthält andere Zeichen als a–z, 0–9 und -')
  const sweep = raw.sweep !== undefined ? parseSweep(raw.sweep, `${path}.sweep`) : undefined
  const rawMatchups = raw.matchups ?? []
  if (!Array.isArray(rawMatchups)) fail(`${path}.matchups`, 'muss eine Liste sein')
  const matchups = rawMatchups.map((m, i) => parseMatchup(m, `${path}.matchups[${i}]`))
  if (matchups.length === 0 && sweep?.kind !== 'profile')
    fail(`${path}.matchups`, 'braucht mindestens ein Matchup (oder einen Profil-Sweep)')
  if (new Set(matchups.map((m) => m.id)).size !== matchups.length)
    fail(`${path}.matchups`, 'Matchup-IDs müssen eindeutig sein')
  const rawMaps = raw.maps ?? [{ size: 'medium' }]
  if (!Array.isArray(rawMaps) || rawMaps.length === 0)
    fail(`${path}.maps`, 'muss eine nicht leere Liste sein')
  const maps = rawMaps.map((m, i) => parseMap(m, `${path}.maps[${i}]`))
  const seeds = raw.seeds ?? 10
  if (Array.isArray(seeds)) {
    if (seeds.length === 0 || !seeds.every((s) => typeof s === 'string' && s))
      fail(`${path}.seeds`, 'Liste von Seeds darf nicht leer sein')
  } else if (!isInt(seeds) || seeds < 1) fail(`${path}.seeds`, 'Anzahl ≥ 1 oder Liste von Seeds')
  const rotateSeats = raw.rotateSeats ?? true
  if (typeof rotateSeats !== 'boolean') fail(`${path}.rotateSeats`, 'muss true oder false sein')
  const roundLimit = raw.roundLimit ?? 100
  if (!isInt(roundLimit) || roundLimit < 1 || roundLimit > 1000)
    fail(`${path}.roundLimit`, 'muss zwischen 1 und 1000 liegen')
  const victoryCondition = raw.victoryCondition ?? 'roundLimit'
  if (!oneOf(victoryCondition, VICTORY))
    fail(`${path}.victoryCondition`, `muss ${VICTORY.join(', ')} sein`)
  if (raw.workers !== undefined && (!isInt(raw.workers) || raw.workers < 1))
    fail(`${path}.workers`, 'muss eine ganze Zahl ≥ 1 sein')
  return {
    name: raw.name,
    matchups,
    maps,
    seeds: seeds as number | string[],
    rotateSeats,
    roundLimit,
    victoryCondition,
    ...(raw.workers !== undefined ? { workers: raw.workers as number } : {}),
    ...(sweep ? { sweep } : {}),
    ...(raw.catalog !== undefined ? { catalog: parseCatalog(raw.catalog, `${path}.catalog`) } : {}),
  }
}
