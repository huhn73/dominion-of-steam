import type { Message, MessageKey } from '../i18n'
// Datentypen unverändert aus product-plan/sections/partie-setup-and-ki-gegner/types.ts;
// die Props der Komponenten liegen in apps/web/src/sections/partie-setup/types.ts
// =============================================================================
// Data Types
// =============================================================================

export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

export type Difficulty = 'easy' | 'normal' | 'hard'

export type Level = 'low' | 'normal' | 'high'

export type { MapSizeId, MapSizeOption } from '../game/mapSizes'
import type { MapSizeId, MapSizeOption } from '../game/mapSizes'
import type { WorldShape } from '../game/worldShapes'

export type VictoryConditionId = 'elimination' | 'capitals' | 'roundLimit' | 'dominance'

export interface Player {
  id: string
  name: string
  avatarUrl: string | null
}

export interface Faction {
  id: string
  name: string
  /** Short label for badges, e.g. "Aurelia" */
  shortName: string
  color: FactionColor
  motto: string
  trait: string
  emblemUrl: string | null
  heroImageUrl: string | null
}

export interface AiPersonality {
  id: string
  name: string
  title: MessageKey
  /** Each personality always leads the same faction */
  factionId: string
  portraitUrl: string | null
  /** Short tags describing how it plays, may be empty; also steer the AI (`aiProfile`), shown via `setup.style.<tag>` */
  style: string[]
  description: MessageKey
}

export interface Friend {
  id: string
  name: string
  avatarUrl: string | null
  status: 'online' | 'inGame' | 'offline'
  /** ISO timestamp, only for offline friends */
  lastSeen: string | null
}

export interface SetupOptions {
  mapSizes: MapSizeOption[]
  landShare: { min: number; max: number; step: number; minLabel: MessageKey; maxLabel: MessageKey }
  /** Used for neutral cities and for mountains/forest */
  levels: { id: Level; label: MessageKey }[]
  /** Continent, islands or archipelago */
  worldShapes: { id: WorldShape; label: MessageKey; description: MessageKey }[]
  asyncTurnLimits: { hours: number; label: Message }[]
  /** minutes null means no time limit */
  liveTurnLimits: { minutes: number | null; label: Message }[]
  victoryConditions: { id: VictoryConditionId; label: MessageKey; description: MessageKey }[]
  /** null means no limit (only with another victory condition) */
  roundLimits: (number | null)[]
}

export type Seat =
  | { kind: 'you' }
  | { kind: 'friend'; friendId: string }
  /** Anyone with the invite link can take this seat */
  | { kind: 'invite' }
  /** Any player from the lobby can join */
  | { kind: 'open' }
  | { kind: 'ai'; personalityId: string; difficulty: Difficulty }
  /** Not decided yet */
  | { kind: 'empty' }

export interface MapSettings {
  size: MapSizeId
  /** Continent (default), islands or archipelago; missing in older drafts */
  worldShape?: WorldShape
  /** Percentage of land tiles */
  landShare: number
  neutralCities: Level
  /** Share of mountains and forest */
  terrain: Level
  /** Map code to replay the same world */
  seed: string
}

export interface MatchDraft {
  name: string
  mode: 'live' | 'async'
  asyncTurnLimitHours: number
  liveTurnLimitMinutes: number | null
  victoryCondition: VictoryConditionId
  /** Only used with victoryCondition 'roundLimit'; null means no limit */
  roundLimit: number | null
  allowDuplicateFactions: boolean
  /** 2–6 seats, seat 0 is always { kind: 'you' } */
  seats: Seat[]
  fillEmptyWithAI: boolean
  map: MapSettings
  /** The player's own faction, null until chosen */
  factionId: string | null
}
