// Datenformen der Setup- und Warteraum-API
import type { MatchDraft, Player, Faction, AiPersonality, Friend, SetupOptions } from './types'

/** `GET /api/setup`: alles, was der Assistent beim ersten Rendern braucht */
export interface SetupData {
  you: Player
  factions: Faction[]
  aiPersonalities: AiPersonality[]
  friends: Friend[]
  options: SetupOptions
  draft: MatchDraft
  /** Link der künftigen Partie, `<origin>/einladung/<token>` */
  inviteLink: string
  /** Reservierte Partie-ID samt Einladungs-Token; beim Erstellen mitschicken */
  reservationId: string
}

/** `POST /api/matches` */
export interface CreateMatchRequest {
  draft: MatchDraft
  reservationId: string
}

export interface CreateMatchResponse {
  matchId: string
  /** true: Partie läuft (zum Spielfeld), false: wartet auf Mitspieler (Warteraum) */
  started: boolean
}

/** Art eines Platzes einer wartenden Partie (Tabelle match_seats) */
export type SeatKind = 'player' | 'ai' | 'friend' | 'invite' | 'open' | 'empty'
