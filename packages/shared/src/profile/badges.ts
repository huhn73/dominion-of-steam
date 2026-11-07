// Abzeichen: berechnet aus den gespeicherten Ergebnissen (player_results) und dem Tutorial

/** Everything the badge rules look at, aggregated per player */
export interface BadgeStats {
  wins: number
  citiesCaptured: number
  unitsBuilt: number
  longestGameRounds: number
  /** Factions the player has won with */
  winFactions: string[]
  dominanceWins: number
  capitalWins: number
  /** Victories against at least one AI on „schwer“ */
  hardAiWins: number
  /** Victories in matches with 4 or more participants */
  bigWins: number
  tutorialCompleted: boolean
}

export interface BadgeRule {
  id: BadgeId
  /** lucide icon name, mapped in the client */
  icon:
    | 'trophy'
    | 'medal'
    | 'crown'
    | 'flag'
    | 'graduation'
    | 'castle'
    | 'factory'
    | 'globe'
    | 'landmark'
    | 'hourglass'
    | 'skull'
    | 'users'
  /** Progress towards the badge: [value, target] */
  progress: (s: BadgeStats) => [number, number]
}

export type BadgeId =
  | 'firstWin'
  | 'wins10'
  | 'wins50'
  | 'allFactions'
  | 'tutorial'
  | 'cities100'
  | 'units500'
  | 'dominance'
  | 'capitals'
  | 'marathon'
  | 'hardAi'
  | 'bigWin'

const ALL_FACTIONS = 4

/** The badges in display order; each one is earned once its progress reaches the target */
export const BADGES: BadgeRule[] = [
  { id: 'firstWin', icon: 'trophy', progress: (s) => [Math.min(s.wins, 1), 1] },
  { id: 'wins10', icon: 'medal', progress: (s) => [Math.min(s.wins, 10), 10] },
  { id: 'wins50', icon: 'crown', progress: (s) => [Math.min(s.wins, 50), 50] },
  {
    id: 'allFactions',
    icon: 'flag',
    progress: (s) => [Math.min(s.winFactions.length, ALL_FACTIONS), ALL_FACTIONS],
  },
  { id: 'tutorial', icon: 'graduation', progress: (s) => [s.tutorialCompleted ? 1 : 0, 1] },
  { id: 'cities100', icon: 'castle', progress: (s) => [Math.min(s.citiesCaptured, 100), 100] },
  { id: 'units500', icon: 'factory', progress: (s) => [Math.min(s.unitsBuilt, 500), 500] },
  { id: 'dominance', icon: 'globe', progress: (s) => [Math.min(s.dominanceWins, 1), 1] },
  { id: 'capitals', icon: 'landmark', progress: (s) => [Math.min(s.capitalWins, 1), 1] },
  {
    id: 'marathon',
    icon: 'hourglass',
    progress: (s) => [s.longestGameRounds > 150 ? 1 : 0, 1],
  },
  { id: 'hardAi', icon: 'skull', progress: (s) => [Math.min(s.hardAiWins, 1), 1] },
  { id: 'bigWin', icon: 'users', progress: (s) => [Math.min(s.bigWins, 1), 1] },
]

/** Badges the stats fulfil */
export const earnedBadges = (s: BadgeStats): BadgeId[] =>
  BADGES.filter((b) => {
    const [value, target] = b.progress(s)
    return value >= target
  }).map((b) => b.id)

/** One badge as the profile shows it */
export interface ProfileBadge {
  id: BadgeId
  icon: BadgeRule['icon']
  /** ISO time; null while not earned */
  earnedAt: string | null
  progress: number
  target: number
}
