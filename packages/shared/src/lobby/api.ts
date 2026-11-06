// Datenformen der Lobby- und Warteraum-API
import type {
  Faction,
  FinishedMatch,
  Invitation,
  Match,
  OpenMatch,
  Player,
  WaitingRoom,
} from './types'

/**
 * `GET /api/lobby`: alle Daten-Props von `Lobby` außer `pushPermission` (kommt aus dem Browser)
 */
export interface LobbyData {
  /** Serverzeit, Bezug für Fristen und „vor …“-Angaben */
  now: string
  you: Player
  deadlineWarningHours: number
  factions: Faction[]
  matches: Match[]
  invitations: Invitation[]
  openMatches: OpenMatch[]
  finishedMatches: FinishedMatch[]
  /** Guided tutorial match of the player (not listed in `matches`/`finishedMatches`) */
  tutorial: LobbyTutorial
}

export interface LobbyTutorial {
  /** Tutorial match that exists (running or won), null when none was started yet */
  matchId: string | null
  status: 'running' | 'finished' | null
  /** Step reached and number of steps */
  step: number
  total: number
  completed: boolean
  /** The player declined the offer („Später“); the lobby no longer asks */
  dismissed: boolean
}

/** `POST /api/tutorial` */
export interface StartTutorialResponse {
  matchId: string
}

/** `GET /api/matches/:id/room` */
export interface WaitingRoomData {
  /** `running`/`finished`: die Partie hat begonnen, der Client wechselt zum Spielfeld */
  status: 'waiting' | 'running' | 'finished'
  room: WaitingRoom
  factions: Faction[]
}

/** `POST /api/matches/:id/remind` */
export interface RemindResponse {
  remindedAt: string
}

/** Antwort auf Annehmen, Beitreten und Einladungslink: Ziel ist der Warteraum */
export interface JoinResponse {
  matchId: string
}

/** `POST /api/matches/:id/start` */
export interface StartMatchRequest {
  fillEmptyWithAI: boolean
}

/** `POST /api/matches/:id/ready` */
export interface ReadyRequest {
  ready: boolean
}
