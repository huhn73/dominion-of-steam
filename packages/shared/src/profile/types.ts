// Datentypen unverändert aus product-plan/sections/spielerprofil-and-einstellungen/types.ts;
// die Props der Komponenten liegen in apps/web/src/sections/profil/types.ts
// =============================================================================
// Data Types
// =============================================================================

export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

export type PushPermission = 'default' | 'granted' | 'denied'

export interface Faction {
  id: string
  name: string
  shortName: string
  color: FactionColor
  emblemUrl: string | null
}

export interface Profile {
  id: string
  displayName: string
  avatarUrl: string | null
  memberSince: string
  /** Most played faction, null before the first match */
  favoriteFactionId: string | null
}

export interface PlayerStats {
  gamesPlayed: number
  wins: number
  citiesCaptured: number
  unitsBuilt: number
  longestGameRounds: number
}

export interface FactionStat {
  factionId: string
  /** 0 means never played */
  gamesPlayed: number
  wins: number
}

export type MatchResult = 'victory' | 'defeat' | 'surrendered'

export interface HistoryEntry {
  id: string
  name: string
  endedAt: string
  result: MatchResult
  placement: number
  playerCount: number
  rounds: number
  factionId: string
  /** The other participants; humans with their player id (for the public profile) */
  opponents: Opponent[]
}

export interface Opponent {
  /** Player id of a human (also after a surrender); null for AI */
  id: string | null
  name: string
  isAI: boolean
}

// One definition for client and server: packages/shared/src/notifications
import type { NotificationSettings } from '../notifications'
export type { ChannelToggle, NotificationEvent, NotificationSettings } from '../notifications'

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system'
  reduceMotion: boolean
  combatAnimations: boolean
  autoplayReplay: boolean
  /** Turn report card at the start of the own turn */
  turnReport: boolean
}

export interface SoundSettings {
  muted: boolean
  /** 0–100 */
  master: number
  effects: number
  music: number
  /** Terrain and city ambience loops */
  ambience: number
}

export interface ControlSettings {
  rightClick: 'cancel' | 'contextMenu'
  confirmEndTurn: boolean
  dragUnits: boolean
  /** 0–100 */
  zoomSensitivity: number
}

export interface Settings {
  notifications: NotificationSettings
  display: DisplaySettings
  sound: SoundSettings
  controls: ControlSettings
}

export interface Account {
  email: string
  /** false until the verification link was opened; then no e-mails are sent */
  emailVerified: boolean
  activeSessions: number
}

