// Nutzungsübersicht für Admins: Antwort von `GET /api/admin/stats` (ohne E-Mail-Adressen)

export const ADMIN_RANGES = [7, 30, 90] as const
/** Zeitraum in Tagen */
export type AdminRange = (typeof ADMIN_RANGES)[number]
export const DEFAULT_ADMIN_RANGE: AdminRange = 30

export const isAdminRange = (v: number): v is AdminRange =>
  (ADMIN_RANGES as readonly number[]).includes(v)

export interface AdminAccountStats {
  total: number
  /** E-Mail-Adresse bestätigt */
  verified: number
  /** Registriert im Zeitraum */
  new: number
  /** Zuletzt gesehen in den letzten 24 Stunden */
  active24h: number
  /** Zuletzt gesehen im Zeitraum */
  activeRange: number
}

export interface AdminMatchStats {
  waiting: number
  running: number
  finished: number
  live: number
  async: number
  /** Ein menschlicher Spieler (gegen KI) */
  solo: number
  /** Mindestens zwei menschliche Spieler */
  multiplayer: number
  /** Durchschnittliche Rundenzahl beendeter Partien; null ohne beendete Partie */
  avgRoundsFinished: number | null
  /** Angelegt im Zeitraum */
  newInRange: number
}

export interface AdminDay {
  /** YYYY-MM-DD (Europe/Berlin) */
  date: string
  registrations: number
  matchesStarted: number
  turns: number
}

export interface AdminPlayerRow {
  id: string
  name: string
  avatarUrl: string | null
  /** ISO */
  createdAt: string
  lastSeenAt: string | null
  emailVerified: boolean
  /** Partien, in denen das Konto einen Sitz hat */
  matches: number
}

export interface AdminMatchRow {
  id: string
  name: string
  mode: 'live' | 'async'
  status: 'waiting' | 'running' | 'finished'
  round: number
  humans: number
  ais: number
  createdAt: string
  updatedAt: string
}

export interface AdminStats {
  range: AdminRange
  accounts: AdminAccountStats
  matches: AdminMatchStats
  /** Ein Eintrag je Tag, ältester zuerst, der letzte ist heute */
  daily: AdminDay[]
  recentPlayers: AdminPlayerRow[]
  recentMatches: AdminMatchRow[]
}
