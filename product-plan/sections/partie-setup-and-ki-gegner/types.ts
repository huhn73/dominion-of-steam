// =============================================================================
// Data Types
// =============================================================================

export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

export type Difficulty = 'easy' | 'normal' | 'hard'

export type Level = 'low' | 'normal' | 'high'

export type MapSizeId = 'small' | 'medium' | 'large' | 'huge'

export type VictoryConditionId = 'elimination' | 'capitals' | 'roundLimit'

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
  title: string
  /** Each personality always leads the same faction */
  factionId: string
  portraitUrl: string | null
  /** Short tags describing how it plays, may be empty */
  style: string[]
  description: string
}

export interface Friend {
  id: string
  name: string
  avatarUrl: string | null
  status: 'online' | 'inGame' | 'offline'
  /** ISO timestamp, only for offline friends */
  lastSeen: string | null
}

export interface MapSizeOption {
  id: MapSizeId
  label: string
  width: number
  height: number
  /** [min, max] players that fit this size well */
  recommendedPlayers: [number, number]
}

export interface SetupOptions {
  mapSizes: MapSizeOption[]
  landShare: { min: number; max: number; step: number; minLabel: string; maxLabel: string }
  /** Used for neutral cities and for mountains/forest */
  levels: { id: Level; label: string }[]
  asyncTurnLimits: { hours: number; label: string }[]
  /** minutes null means no time limit */
  liveTurnLimits: { minutes: number | null; label: string }[]
  victoryConditions: { id: VictoryConditionId; label: string; description: string }[]
  roundLimits: number[]
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
  /** Only used with victoryCondition 'roundLimit' */
  roundLimit: number
  allowDuplicateFactions: boolean
  /** 2–6 seats, seat 0 is always { kind: 'you' } */
  seats: Seat[]
  fillEmptyWithAI: boolean
  map: MapSettings
  /** The player's own faction, null until chosen */
  factionId: string | null
}

// =============================================================================
// Component Props
// =============================================================================

export interface PartieSetupProps {
  you: Player
  factions: Faction[]
  aiPersonalities: AiPersonality[]
  friends: Friend[]
  options: SetupOptions
  /** Starting values for the wizard; the wizard edits its own copy */
  draft: MatchDraft
  inviteLink: string
  /** Called when the player wants a new random map code */
  onRandomizeSeed?: () => string
  /** Called when the player copies the invite link */
  onCopyInviteLink?: (link: string) => void
  /** Called when the player shares the invite link via the device's share menu */
  onShareInviteLink?: (link: string) => void
  /** Called with the final settings when the player creates the match */
  onCreateMatch?: (draft: MatchDraft) => void
  /** Called when the player leaves the wizard */
  onCancel?: () => void
}
