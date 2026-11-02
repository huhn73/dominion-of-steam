import { defaultRules, type GameRules, type MapSettings } from '@dos/shared/engine'
import { MAP_SIZES } from '@dos/shared/game/catalog'
import type { ParticipantColor } from '@dos/shared/game/types'
import type { MapConfig, SimConfig, SimParticipantConfig } from './config'

export const COLORS: readonly ParticipantColor[] = [
  'amber',
  'rose',
  'sky',
  'lime',
  'violet',
  'orange',
]

export interface JobParticipant extends SimParticipantConfig {
  /** Participant id in the match, p1..pn by seat */
  id: string
  seat: number
  color: ParticipantColor
}

export interface GameJob {
  id: string
  matchupId: string
  mapId: string
  seed: string
  rotation: number
  map: MapSettings
  rules: GameRules
  /** Hard cap in rounds, also for 'elimination' and 'capitals' */
  maxRounds: number
  participants: JobParticipant[]
}

export function seedList(config: SimConfig): string[] {
  if (Array.isArray(config.seeds)) return config.seeds
  return Array.from(
    { length: config.seeds },
    (_, i) => `${config.name}-${String(i + 1).padStart(3, '0')}`,
  )
}

/**
 * Map id in job ids and results: the size, plus world shape and land share, so maps of the same
 * size in one config (islands next to continent) stay apart
 */
export const mapId = (m: MapConfig) => {
  const size = typeof m.size === 'string' ? m.size : `${m.size.width}x${m.size.height}`
  return `${size}-${m.worldShape}-${m.landShare}`
}

export function mapSettings(m: MapConfig, seed: string): MapSettings {
  const { width, height } = typeof m.size === 'string' ? MAP_SIZES[m.size] : m.size
  return {
    width,
    height,
    landShare: m.landShare,
    neutralCities: m.neutralCities,
    terrain: m.terrain,
    seed,
    worldShape: m.worldShape,
  }
}

export function rulesOf(config: SimConfig): GameRules {
  return {
    ...defaultRules('live'),
    victoryCondition: config.victoryCondition,
    roundLimit: config.roundLimit,
    allowDuplicateFactions: true,
  }
}

/** Seat order of rotation `r`: seat i takes the participant (i + r) mod n */
export function rotate<T>(items: readonly T[], r: number): T[] {
  return items.map((_, i) => items[(i + r) % items.length]!)
}

/** Matchups × maps × seeds × seat rotations */
export function expandJobs(config: SimConfig): GameJob[] {
  const rules = rulesOf(config)
  const seeds = seedList(config)
  const jobs: GameJob[] = []
  for (const matchup of config.matchups) {
    const rotations = config.rotateSeats ? matchup.participants.length : 1
    for (const map of config.maps) {
      const mid = mapId(map)
      for (const seed of seeds) {
        for (let r = 0; r < rotations; r++) {
          const participants = rotate(matchup.participants, r).map((p, seat) => ({
            ...p,
            id: `p${seat + 1}`,
            seat,
            color: COLORS[seat % COLORS.length]!,
          }))
          jobs.push({
            id: `${matchup.id}|${mid}|${seed}|r${r}`,
            matchupId: matchup.id,
            mapId: mid,
            seed,
            rotation: r,
            map: mapSettings(map, seed),
            rules,
            maxRounds: config.roundLimit,
            participants,
          })
        }
      }
    }
  }
  return jobs
}
