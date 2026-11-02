// Datentypen kommen aus packages/shared; die Props sind unverändert aus der Design-Übergabe
import type {
  AiPersonality,
  Faction,
  Friend,
  MatchDraft,
  Player,
  SetupOptions,
} from '@dos/shared/setup'
export type * from '@dos/shared/setup/types'

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
