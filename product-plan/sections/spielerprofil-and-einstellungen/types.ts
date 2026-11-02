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
  /** Names of the other participants, AI marked with "(KI)" */
  opponents: string[]
}

export interface ChannelToggle {
  push: boolean
  email: boolean
}

export type NotificationEvent = 'yourTurn' | 'deadlineSoon' | 'invitation' | 'matchEnded'

export interface NotificationSettings extends Record<NotificationEvent, ChannelToggle> {
  /** Hours offline before an e-mail is sent: 0 = immediately */
  emailDelayHours: 0 | 1 | 6 | 24
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system'
  reduceMotion: boolean
  combatAnimations: boolean
  autoplayReplay: boolean
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
  activeSessions: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface ProfilProps {
  profile: Profile
  stats: PlayerStats
  factionStats: FactionStat[]
  history: HistoryEntry[]
  hasMoreHistory: boolean
  factions: Faction[]
  /** Called when the player loads older matches */
  onLoadMoreHistory?: () => void
  /** Called when the player saves a new display name */
  onUpdateDisplayName?: (name: string) => void
  /** Called when the player picks a new avatar image */
  onUploadAvatar?: (file: File) => void
  /** Called when the player removes the avatar */
  onRemoveAvatar?: () => void
}

export interface EinstellungenProps {
  settings: Settings
  account: Account
  /** Needed to confirm account deletion */
  displayName: string
  pushPermission: PushPermission
  /** Called on every change; settings save immediately */
  onChangeSettings?: (settings: Settings) => void
  /** Called when the player allows push notifications in the browser */
  onEnablePush?: () => void
  /** Called with the new address and the current password */
  onChangeEmail?: (email: string, currentPassword: string) => void
  /** Called with the current and the new password */
  onChangePassword?: (currentPassword: string, newPassword: string) => void
  /** Called when the player logs out on this device */
  onLogout?: () => void
  /** Called when the player logs out on all devices */
  onLogoutEverywhere?: () => void
  /** Called after the player confirmed account deletion twice */
  onDeleteAccount?: () => void
}
