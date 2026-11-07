import type { Locale } from '@dos/shared/i18n'
// Datentypen kommen aus packages/shared; die Props sind unverändert aus der Design-Übergabe
import type {
  Account,
  FactionStat,
  Faction,
  HistoryEntry,
  PlayerStats,
  Profile,
  PushPermission,
  Settings,
} from '@dos/shared/profile'
export type * from '@dos/shared/profile/types'

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
  /** The file with the chosen square in pixels of the upright image */
  onUploadAvatar?: (file: File, crop?: { x: number; y: number; size: number }) => void
  /** Called when the player removes the avatar */
  onRemoveAvatar?: () => void
}

export interface EinstellungenProps {
  settings: Settings
  /** Current language; the choice is shown only with `onChangeLocale` */
  locale?: Locale
  onChangeLocale?: (locale: Locale) => void
  account: Account
  /** Needed to confirm account deletion */
  displayName: string
  pushPermission: PushPermission
  /** Called on every change; settings save immediately */
  onChangeSettings?: (settings: Settings) => void
  /** Called when the player allows push notifications in the browser */
  onEnablePush?: () => void
  /** Called when the player asks for a new verification e-mail */
  onResendVerification?: () => void
  /** Called with the new address and the current password */
  onChangeEmail?: (email: string, currentPassword: string) => void
  /** Called with the current and the new password */
  onChangePassword?: (currentPassword: string, newPassword: string) => void
  /** Called when the player logs out on this device */
  onLogout?: () => void
  /** Called when the player logs out on all devices */
  onLogoutEverywhere?: () => void
  /** Called after the player confirmed account deletion twice, with the current password */
  onDeleteAccount?: (currentPassword: string) => void
}
