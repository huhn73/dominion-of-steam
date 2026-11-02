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
