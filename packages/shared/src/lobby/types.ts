import type { Message } from '../i18n'
// Datentypen unverändert aus product-plan/sections/lobby-and-multiplayer/types.ts;
// die Props der Komponenten liegen in apps/web/src/sections/lobby/types.ts
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
  turnLimitLabel: Message
  victoryCondition: Message
  allowDuplicateFactions: boolean
}

export interface MatchMapInfo {
  sizeLabel: Message
  width: number
  height: number
  landShare: number
  seed: string
  /** Continent, islands or archipelago; missing for the demo and older matches */
  worldShape?: 'continent' | 'islands' | 'archipelago'
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
  turnLimitLabel: Message
  mapSizeLabel: Message
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
  turnLimitLabel: Message
  mapSizeLabel: Message
  victoryCondition: Message
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

