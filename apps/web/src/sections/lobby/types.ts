// Datentypen kommen aus packages/shared; die Props sind unverändert aus der Design-Übergabe
import type {
  Faction,
  FinishedMatch,
  Invitation,
  Match,
  OpenMatch,
  Player,
  PushPermission,
  WaitingRoom,
} from '@dos/shared/lobby'
export type * from '@dos/shared/lobby/types'

// =============================================================================
// Component Props
// =============================================================================

export interface LobbyProps {
  /** Reference time for deadlines and countdowns */
  now: string
  you: Player
  pushPermission: PushPermission
  /** Highlight own turns whose deadline is closer than this */
  deadlineWarningHours: number
  factions: Faction[]
  matches: Match[]
  invitations: Invitation[]
  openMatches: OpenMatch[]
  finishedMatches: FinishedMatch[]
  /** Called when the player continues a match on the board */
  onPlay?: (matchId: string) => void
  /** Called when the player opens the waiting room of a match */
  onOpenWaitingRoom?: (matchId: string) => void
  /** Called when the player nudges the participant whose turn it is */
  onRemind?: (matchId: string, participantId: string) => void
  /** Called when the player confirms surrendering a match; an AI takes over their faction */
  onSurrender?: (matchId: string) => void
  /** Called when the player opens the details of a match */
  onShowDetails?: (matchId: string) => void
  /** Called when the player accepts an invitation */
  onAcceptInvitation?: (invitationId: string) => void
  /** Called when the player declines an invitation */
  onDeclineInvitation?: (invitationId: string) => void
  /** Called when the player joins an open match */
  onJoinOpenMatch?: (openMatchId: string) => void
  /** Called when the player wants to allow push notifications */
  onEnablePush?: () => void
  /** Called when the player hides the push banner for now */
  onDismissPushBanner?: () => void
  /** Called when the player wants to create a new match */
  onNewMatch?: () => void
}

export interface WarteraumProps {
  room: WaitingRoom
  factions: Faction[]
  /** Called when the player toggles their ready state */
  onToggleReady?: (ready: boolean) => void
  /** Called when the host starts the match */
  onStartMatch?: (fillEmptyWithAI: boolean) => void
  /** Called when the player leaves the waiting room (and the match) */
  onLeave?: () => void
  /** Called when the player copies the invite link */
  onCopyInviteLink?: (link: string) => void
  /** Called when the player shares the invite link via the device's share menu */
  onShareInviteLink?: (link: string) => void
  /** Called when the player goes back to the lobby without leaving */
  onBack?: () => void
}
