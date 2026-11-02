// =============================================================================
// UI-Datenformen: kombinierte Referenz
//
// Diese Typen beschreiben die Daten, die die UI-Komponenten als Props erwarten.
// Sie sind ein Frontend-Vertrag, kein Datenbankschema. Wie die Daten gespeichert
// und geladen werden, ist eine Entscheidung der Umsetzung.
//
// Jeder Bereich steht in einem eigenen Namensraum, weil gleichnamige Typen
// (z. B. Faction) je Bereich nur die Felder enthalten, die dort gebraucht werden.
// Die Props-Interfaces stehen in sections/<bereich>/types.ts.
// =============================================================================

// -----------------------------------------------------------------------------
// Aus: sections/spielfeld-and-zuge
// -----------------------------------------------------------------------------
export namespace Spielfeld {
  // =============================================================================
  // Basics
  // =============================================================================

  /** Hex position in offset coordinates (pointy-top, odd rows shifted right) */
  export interface HexCoord {
    col: number
    row: number
  }

  export type Terrain = 'deepSea' | 'shallows' | 'plains' | 'forest' | 'hills' | 'mountains'

  export type Visibility = 'unexplored' | 'explored' | 'visible'

  export type UnitDomain = 'land' | 'sea' | 'air'

  /** Tailwind color name used for a participant's units, cities and markers */
  export type ParticipantColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

  // =============================================================================
  // Data
  // =============================================================================

  export interface Match {
    id: string
    name: string
    round: number
    mode: 'live' | 'async'
    phase: 'replay' | 'yourTurn' | 'waiting'
    /** ISO timestamp, only set for async matches */
    turnDeadline: string | null
    youId: string
  }

  export interface Participant {
    id: string
    name: string
    isYou: boolean
    isAI: boolean
    aiDifficulty: 'easy' | 'normal' | 'hard' | null
    factionId: string
    color: ParticipantColor
    status: 'active' | 'eliminated'
    cityCount: number
    unitCount: number
  }

  export interface FactionBonus {
    label: string
    /** Einsatzgebiet the bonus applies to, null if it does not affect units */
    domain: UnitDomain | null
    /** Unit value that changes, null if the bonus affects something else (e.g. cities) */
    stat: 'movement' | 'range' | 'productionTurns' | 'strength' | 'defense' | null
    modifier: number
    /** 'add' adds the modifier, 'multiply' multiplies the base value by it */
    mode: 'add' | 'multiply'
  }

  export interface Faction {
    id: string
    name: string
    trait: string
    description: string
    bonus: FactionBonus
    specialUnitTypeId: string | null
  }

  export interface UnitType {
    id: string
    name: string
    domain: UnitDomain
    strength: number
    defense: number
    movement: number
    /** Max fuel for air units, null for land and sea units */
    range: number | null
    /** How many units it can carry, 0 if none */
    capacity: number
    /** What it carries: land units (transports) or air units (carriers), null if nothing */
    cargoDomain: UnitDomain | null
    productionTurns: number
    /** Set for faction-exclusive special units */
    factionId: string | null
    canCaptureCities: boolean
  }

  export interface Tile extends HexCoord {
    terrain: Terrain
    visibility: Visibility
  }

  export interface GameMap {
    width: number
    height: number
    seed: string
    tiles: Tile[]
  }

  export interface Production {
    unitTypeId: string
    progress: number
    turnsRemaining: number
  }

  export interface City extends HexCoord {
    id: string
    name: string
    /** null for neutral cities */
    ownerId: string | null
    isCapital: boolean
    /** Only known for your own cities; null if nothing is being built */
    production: Production | null
  }

  export type UnitOrder =
    | { type: 'none' }
    | { type: 'sentry' }
    | { type: 'goto'; target: HexCoord; turnsRemaining: number }
    | { type: 'patrol'; waypoints: HexCoord[] }

  export interface Unit extends HexCoord {
    id: string
    unitTypeId: string
    ownerId: string
    /** 0–100 */
    health: number
    movesLeft: number
    /** Remaining fuel for air units, null otherwise */
    fuel: number | null
    order: UnitOrder
    cargoUnitIds: string[]
    /** ID of the transport carrying this unit */
    carriedBy: string | null
    needsOrders: boolean
  }

  export type GameEventType =
    | 'enemySighted'
    | 'combat'
    | 'cityLost'
    | 'cityCaptured'
    | 'unitBuilt'
    | 'unitLost'
    | 'fuelLow'

  export interface GameEvent extends HexCoord {
    id: string
    round: number
    type: GameEventType
    message: string
    isNew: boolean
  }

  export interface ReplayAction {
    id: string
    participantId: string
    action: 'move' | 'attack' | 'capture'
    unitTypeId: string
    path: HexCoord[]
    result: string | null
  }

  export interface CombatPreview {
    attackerUnitId: string
    targetUnitId: string | null
    targetCityId: string | null
    /** 0–1 */
    winChance: number
  }

  export interface CombatResult {
    attackerUnitId: string
    /** null when a city without defenders was attacked */
    defenderUnitId: string | null
    /** Set when a city was attacked; on victory the city is captured */
    targetCityId: string | null
    outcome: 'victory' | 'defeat'
    /** Damage taken in health points */
    attackerDamage: number
    defenderDamage: number
    message: string
  }
}

// -----------------------------------------------------------------------------
// Aus: sections/fraktionen-and-einheiten
// -----------------------------------------------------------------------------
export namespace Fraktionen {
  // =============================================================================
  // Data Types
  // =============================================================================

  export type UnitDomain = 'land' | 'sea' | 'air'

  /** Tailwind color name used for a faction's emblem and header */
  export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

  /** Unit values a faction bonus can change */
  export type BonusStat = 'movement' | 'range' | 'productionTurns' | 'strength' | 'defense'

  export interface FactionBonus {
    label: string
    description: string
    /** Einsatzgebiet the bonus applies to, null if it does not affect units */
    domain: UnitDomain | null
    /** Unit value that changes, null if the bonus affects something else (e.g. cities) */
    stat: BonusStat | null
    modifier: number
    /** 'add' adds the modifier, 'multiply' multiplies the base value by it */
    mode: 'add' | 'multiply'
  }

  export interface Faction {
    id: string
    name: string
    /** Short label for badges and tabs, e.g. "Aurelia" */
    shortName: string
    motto: string
    color: FactionColor
    /** Shield emblem, transparent PNG (8:9) */
    emblemUrl: string | null
    /** Wide header image (21:9) with the subject on the right */
    heroImageUrl: string | null
    trait: string
    bonus: FactionBonus
    playstyle: string[]
    playstyleSummary: string
    /** Paragraphs separated by blank lines */
    history: string
    specialUnitTypeId: string | null
  }

  export interface UnitType {
    id: string
    name: string
    domain: UnitDomain
    strength: number
    defense: number
    movement: number
    /** Max fuel for air units, null for land and sea units */
    range: number | null
    /** How many units it can carry, 0 if none */
    capacity: number
    /** What it carries: land units (transports) or air units (carriers), null if nothing */
    cargoDomain: UnitDomain | null
    productionTurns: number
    /** Set for faction-exclusive special units */
    factionId: string | null
    canCaptureCities: boolean
    description: string
    tactics: string[]
    /** Painted illustration (4:3) */
    illustrationUrl: string | null
    /** Faction-specific looks of a general unit (faction id → image); same stats, different design. Empty for special units. */
    variantIllustrationUrls: Record<string, string>
  }
}

// -----------------------------------------------------------------------------
// Aus: sections/partie-setup-and-ki-gegner
// -----------------------------------------------------------------------------
export namespace PartieSetup {
  // =============================================================================
  // Data Types
  // =============================================================================

  export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

  export type Difficulty = 'easy' | 'normal' | 'hard'

  export type Level = 'low' | 'normal' | 'high'

  export type MapSizeId = 'small' | 'medium' | 'large' | 'huge'

  export type VictoryConditionId = 'elimination' | 'capitals' | 'roundLimit'

  export interface Player {
    id: string
    name: string
    avatarUrl: string | null
  }

  export interface Faction {
    id: string
    name: string
    /** Short label for badges, e.g. "Aurelia" */
    shortName: string
    color: FactionColor
    motto: string
    trait: string
    emblemUrl: string | null
    heroImageUrl: string | null
  }

  export interface AiPersonality {
    id: string
    name: string
    title: string
    /** Each personality always leads the same faction */
    factionId: string
    portraitUrl: string | null
    /** Short tags describing how it plays, may be empty */
    style: string[]
    description: string
  }

  export interface Friend {
    id: string
    name: string
    avatarUrl: string | null
    status: 'online' | 'inGame' | 'offline'
    /** ISO timestamp, only for offline friends */
    lastSeen: string | null
  }

  export interface MapSizeOption {
    id: MapSizeId
    label: string
    width: number
    height: number
    /** [min, max] players that fit this size well */
    recommendedPlayers: [number, number]
  }

  export interface SetupOptions {
    mapSizes: MapSizeOption[]
    landShare: { min: number; max: number; step: number; minLabel: string; maxLabel: string }
    /** Used for neutral cities and for mountains/forest */
    levels: { id: Level; label: string }[]
    asyncTurnLimits: { hours: number; label: string }[]
    /** minutes null means no time limit */
    liveTurnLimits: { minutes: number | null; label: string }[]
    victoryConditions: { id: VictoryConditionId; label: string; description: string }[]
    roundLimits: number[]
  }

  export type Seat =
    | { kind: 'you' }
    | { kind: 'friend'; friendId: string }
    /** Anyone with the invite link can take this seat */
    | { kind: 'invite' }
    /** Any player from the lobby can join */
    | { kind: 'open' }
    | { kind: 'ai'; personalityId: string; difficulty: Difficulty }
    /** Not decided yet */
    | { kind: 'empty' }

  export interface MapSettings {
    size: MapSizeId
    /** Percentage of land tiles */
    landShare: number
    neutralCities: Level
    /** Share of mountains and forest */
    terrain: Level
    /** Map code to replay the same world */
    seed: string
  }

  export interface MatchDraft {
    name: string
    mode: 'live' | 'async'
    asyncTurnLimitHours: number
    liveTurnLimitMinutes: number | null
    victoryCondition: VictoryConditionId
    /** Only used with victoryCondition 'roundLimit' */
    roundLimit: number
    allowDuplicateFactions: boolean
    /** 2–6 seats, seat 0 is always { kind: 'you' } */
    seats: Seat[]
    fillEmptyWithAI: boolean
    map: MapSettings
    /** The player's own faction, null until chosen */
    factionId: string | null
  }
}

// -----------------------------------------------------------------------------
// Aus: sections/lobby-and-multiplayer
// -----------------------------------------------------------------------------
export namespace Lobby {
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
}

// -----------------------------------------------------------------------------
// Aus: sections/spielerprofil-and-einstellungen
// -----------------------------------------------------------------------------
export namespace Profil {
  // =============================================================================
  // Data Types
  // =============================================================================

  export type FactionColor = 'amber' | 'rose' | 'sky' | 'lime' | 'violet' | 'orange'

  export type PushPermission = 'default' | 'granted' | 'denied'

  export interface Faction {
    id: string
    name: string
    shortName: string
    color: FactionColor
    emblemUrl: string | null
  }

  export interface Profile {
    id: string
    displayName: string
    avatarUrl: string | null
    memberSince: string
    /** Most played faction, null before the first match */
    favoriteFactionId: string | null
  }

  export interface PlayerStats {
    gamesPlayed: number
    wins: number
    citiesCaptured: number
    unitsBuilt: number
    longestGameRounds: number
  }

  export interface FactionStat {
    factionId: string
    /** 0 means never played */
    gamesPlayed: number
    wins: number
  }

  export type MatchResult = 'victory' | 'defeat' | 'surrendered'

  export interface HistoryEntry {
    id: string
    name: string
    endedAt: string
    result: MatchResult
    placement: number
    playerCount: number
    rounds: number
    factionId: string
    /** Names of the other participants, AI marked with "(KI)" */
    opponents: string[]
  }

  export interface ChannelToggle {
    push: boolean
    email: boolean
  }

  export type NotificationEvent = 'yourTurn' | 'deadlineSoon' | 'invitation' | 'matchEnded'

  export interface NotificationSettings extends Record<NotificationEvent, ChannelToggle> {
    /** Hours offline before an e-mail is sent: 0 = immediately */
    emailDelayHours: 0 | 1 | 6 | 24
  }

  export interface DisplaySettings {
    theme: 'light' | 'dark' | 'system'
    reduceMotion: boolean
    combatAnimations: boolean
    autoplayReplay: boolean
  }

  export interface SoundSettings {
    muted: boolean
    /** 0–100 */
    master: number
    effects: number
    music: number
    /** Terrain and city ambience loops */
    ambience: number
  }

  export interface ControlSettings {
    rightClick: 'cancel' | 'contextMenu'
    confirmEndTurn: boolean
    dragUnits: boolean
    /** 0–100 */
    zoomSensitivity: number
  }

  export interface Settings {
    notifications: NotificationSettings
    display: DisplaySettings
    sound: SoundSettings
    controls: ControlSettings
  }

  export interface Account {
    email: string
    activeSessions: number
  }
}
