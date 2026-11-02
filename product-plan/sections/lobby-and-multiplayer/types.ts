// =============================================================================
// Data Types
// =============================================================================

export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

export type Difficulty = 'easy' | 'normal' | 'hard'

export type PushPermission = 'default' | 'granted' | 'denied'

export interface Player {
  id: string
  name: string
  avatarUrl: string | null
}

export interface Faction {
  id: string
  name: string
  shortName: string
  color: FactionColor
  emblemUrl: string | null
}

export interface Participant {
  id: string
  name: string
  avatarUrl: string | null
  isYou: boolean
  isAI: boolean
  aiDifficulty: Difficulty | null
  factionId: string
  status: 'active' | 'eliminated' | 'surrendered'
  cityCount: number
}

export interface MatchRules {
  mode: 'live' | 'async'
  /** e.g. "24 Stunden" (async deadline) or "5 Minuten" (live time limit) */
  turnLimitLabel: string
  victoryCondition: string
  allowDuplicateFactions: boolean
}

export interface MatchMapInfo {
  sizeLabel: string
  width: number
  height: number
  landShare: number
  seed: string
}

export type MatchStatus = 'yourTurn' | 'othersTurn' | 'waitingForPlayers'

export interface Match {
  id: string
  name: string
  status: MatchStatus
  /** 0 while waiting for players */
  round: number
  /** ISO timestamp for async matches, null for live matches and the waiting room */
  turnDeadline: string | null
  currentParticipantId: string | null
  /** When the player last reminded the current participant, null if never */
  remindedAt: string | null
  isHost: boolean
  participants: Participant[]
  rules: MatchRules
  map: MatchMapInfo
  /**
   * Coarse ownership map, one string per row: '~' water, '.' neutral land,
   * digits = index into participants. Empty while waiting for players.
   */
  miniMap: string[]
  /** Number of seats still to fill, only for 'waitingForPlayers' */
  waitingFor?: number
}

export interface Invitation {
  id: string
  matchName: string
  from: Player
  mode: 'live' | 'async'
  turnLimitLabel: string
  mapSizeLabel: string
  seatsTaken: number
  seatsTotal: number
  sentAt: string
  message: string | null
}

export interface OpenMatch {
  id: string
  name: string
  host: string
  mode: 'live' | 'async'
  turnLimitLabel: string
  mapSizeLabel: string
  victoryCondition: string
  seatsTaken: number
  seatsTotal: number
  /** Factions still free to pick; empty if all are taken (duplicates allowed) */
  availableFactionIds: string[]
}

export interface FinishedMatch {
  id: string
  name: string
  endedAt: string
  result: 'victory' | 'defeat' | 'surrendered'
  placement: number
  playerCount: number
  rounds: number
  winner: string
  factionId: string
}

export type WaitingSeat = {
  name: string | null
  avatarUrl: string | null
  isYou: boolean
  isHost: boolean
  factionId: string | null
} & (
  | { kind: 'player'; status: 'ready' | 'joined' }
  | { kind: 'ai'; status: 'ready'; aiDifficulty: Difficulty }
  | { kind: 'invited'; status: 'pending' }
  | { kind: 'open'; status: 'pending' }
)

export interface WaitingRoom {
  matchId: string
  matchName: string
  isHost: boolean
  inviteLink: string
  rules: MatchRules
  map: MatchMapInfo
  /** Default for filling free seats with AI when the host starts */
  fillEmptyWithAI: boolean
  seats: WaitingSeat[]
}

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
