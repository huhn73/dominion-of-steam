import { score, unitType, type CommandOutcome, type GameState } from '@dos/shared/engine'
import type { Command } from '@dos/shared/game/view'
import type { GameJob } from './jobs'

/** Command budget of one AI turn, mirrors `MAX_COMMANDS` in the engine */
export const AI_COMMAND_BUDGET = 300

export interface CaptureStats {
  neutral: number
  enemy: number
  /** Own cities taken by others */
  lost: number
  firstCaptureRound: number | null
}

export interface CombatStats {
  attacks: number
  /** Defender destroyed or city captured */
  won: number
  /** Attacker destroyed without capturing */
  lost: number
  cityAttacks: number
  cityAttacksWon: number
  /** Own units destroyed in fights, including units spent on city attacks */
  unitsLost: number
  unitsKilled: number
  /** Losses outside fights: crashes and cargo lost with its transport */
  otherLosses: number
  damageDealt: number
  damageTaken: number
}

export interface NavalStats {
  /** Cargo stepping ashore from a transport */
  landings: number
  /** Own turns a transport ended with cargo aboard */
  loadedTurns: number
  /** …of those, turns it ended on the same tile with the same cargo as the turn before */
  loadedIdle: number
  /** Neutral cities captured by a unit that has crossed the water on a transport */
  overseasNeutral: number
}

export interface TurnStats {
  count: number
  totalMs: number
  maxMs: number
  /** Duration of every AI turn in order */
  turnMs: number[]
  commands: number
  commandsByType: Record<string, number>
  /** Turns that hit the command budget */
  budgetExhausted: number
}

export interface ParticipantResult {
  id: string
  label: string
  seat: number
  factionId: string
  difficulty: string
  personalityId: string | null
  placement: number | null
  eliminatedRound: number | null
  finalScore: number
  finalCities: number
  finalUnits: number
  captures: CaptureStats
  combat: CombatStats
  naval: NavalStats
  /** Units finished per unit type */
  production: Record<string, number>
  turns: TurnStats
}

export interface RoundSnapshot {
  round: number
  byLabel: Record<string, { cities: number; land: number; sea: number; air: number; score: number }>
}

export type VictoryType =
  'elimination' | 'capitulation' | 'capitals' | 'dominance' | 'roundLimit' | 'aborted'

export interface GameResult {
  jobId: string
  matchupId: string
  mapId: string
  seed: string
  rotation: number
  rounds: number
  winnerLabel: string | null
  victoryType: VictoryType
  durationMs: number
  participants: ParticipantResult[]
  timeline: RoundSnapshot[]
}

const emptyParticipant = (p: GameJob['participants'][number]): ParticipantResult => ({
  id: p.id,
  label: p.label,
  seat: p.seat,
  factionId: p.factionId,
  difficulty: p.difficulty,
  personalityId: p.personalityId ?? null,
  placement: null,
  eliminatedRound: null,
  finalScore: 0,
  finalCities: 0,
  finalUnits: 0,
  captures: { neutral: 0, enemy: 0, lost: 0, firstCaptureRound: null },
  combat: {
    attacks: 0,
    won: 0,
    lost: 0,
    cityAttacks: 0,
    cityAttacksWon: 0,
    unitsLost: 0,
    unitsKilled: 0,
    otherLosses: 0,
    damageDealt: 0,
    damageTaken: 0,
  },
  naval: { landings: 0, loadedTurns: 0, loadedIdle: 0, overseasNeutral: 0 },
  production: {},
  turns: {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    turnMs: [],
    commands: 0,
    commandsByType: {},
    budgetExhausted: 0,
  },
})

/**
 * Collects the metrics of one game. Fights and captures come from the command outcomes the AI
 * reports, production and other losses from the difference of the unit lists between turns.
 */
export class MetricsCollector {
  readonly timeline: RoundSnapshot[] = []
  private readonly byId = new Map<string, ParticipantResult>()
  /** unit id → owner, as last seen */
  private readonly known = new Map<string, string>()
  private current: GameState
  private turnPlayer = ''
  private turnCommands = 0
  private roundBefore = 1
  private lastSnapshotRound = 0
  /** Units that have been aboard a transport at some point */
  private readonly sailed = new Set<string>()
  /** Loaded transport id → tile and cargo at the end of its owner's last turn */
  private readonly lastLoaded = new Map<string, string>()

  constructor(
    state: GameState,
    private readonly job: GameJob,
  ) {
    this.current = state
    for (const p of job.participants) this.byId.set(p.id, emptyParticipant(p))
    this.syncUnits(state, () => true, false)
  }

  private of(id: string) {
    const r = this.byId.get(id)
    if (!r) throw new Error(`unbekannter Teilnehmer ${id}`)
    return r
  }

  beginTurn(playerId: string) {
    this.turnPlayer = playerId
    this.turnCommands = 0
  }

  /** Bound so it can be handed to `playAITurn` directly */
  readonly onCommand = (cmd: Command, outcome: CommandOutcome) => {
    const me = this.of(this.turnPlayer)
    const prev = this.current
    me.turns.commands++
    this.turnCommands++
    me.turns.commandsByType[cmd.type] = (me.turns.commandsByType[cmd.type] ?? 0) + 1

    if (cmd.type === 'move' || cmd.type === 'goto') {
      const before = prev.units.find((u) => u.id === cmd.unitId)
      const after = outcome.state.units.find((u) => u.id === cmd.unitId)
      if (before?.carriedBy) this.sailed.add(before.id)
      if (before?.carriedBy && after && !after.carriedBy) me.naval.landings++
    }
    for (const u of outcome.state.units) if (u.carriedBy) this.sailed.add(u.id)

    const c = outcome.combat
    if (c) {
      const defender = c.defenderUnitId
        ? prev.units.find((u) => u.id === c.defenderUnitId)
        : undefined
      const foe = defender ? this.byId.get(defender.ownerId) : undefined
      me.combat.attacks++
      if (c.targetCityId) {
        me.combat.cityAttacks++
        if (c.captured) me.combat.cityAttacksWon++
      }
      if (c.defenderDestroyed || c.captured) me.combat.won++
      if (c.attackerDestroyed && !c.captured) me.combat.lost++
      if (c.attackerDestroyed) me.combat.unitsLost++
      if (c.defenderDestroyed) {
        me.combat.unitsKilled++
        if (foe) foe.combat.unitsLost++
      }
      me.combat.damageTaken += c.attackerDamage
      me.combat.damageDealt += c.defenderDamage
      if (foe) {
        foe.combat.damageDealt += c.attackerDamage
        foe.combat.damageTaken += c.defenderDamage
      }
      if (c.captured && c.targetCityId) {
        const city = prev.cities.find((x) => x.id === c.targetCityId)
        const owner = city?.ownerId ?? null
        if (owner === null) {
          me.captures.neutral++
          if (this.sailed.has(c.attackerUnitId)) me.naval.overseasNeutral++
        } else {
          me.captures.enemy++
          this.byId.get(owner)!.captures.lost++
        }
        me.captures.firstCaptureRound ??= prev.round
      }
    }
    const explained = (id: string) =>
      !!c &&
      ((id === c.attackerUnitId && c.attackerDestroyed) ||
        (id === c.defenderUnitId && c.defenderDestroyed))
    this.syncUnits(outcome.state, explained, false)
    this.current = outcome.state
  }

  endAiTurn(ms: number) {
    const me = this.of(this.turnPlayer)
    me.turns.count++
    me.turns.totalMs += ms
    me.turns.maxMs = Math.max(me.turns.maxMs, ms)
    me.turns.turnMs.push(Math.round(ms * 10) / 10)
    if (this.turnCommands >= AI_COMMAND_BUDGET) me.turns.budgetExhausted++
    for (const u of this.current.units) {
      if (u.ownerId !== me.id) continue
      const t = unitType(u.unitTypeId)
      if (t.domain !== 'sea' || t.cargoDomain !== 'land') continue
      if (!u.cargoUnitIds.length) {
        this.lastLoaded.delete(u.id)
        continue
      }
      const key = `${u.col},${u.row}:${[...u.cargoUnitIds].sort().join(',')}`
      me.naval.loadedTurns++
      if (this.lastLoaded.get(u.id) === key) me.naval.loadedIdle++
      this.lastLoaded.set(u.id, key)
    }
  }

  /** Right before `endTurn`: the last active seat closes the round, take the snapshot */
  beforeEndTurn(state: GameState) {
    this.roundBefore = state.round
    let lastActive = -1
    state.participants.forEach((p, i) => {
      if (p.status === 'active') lastActive = i
    })
    if (state.seat === lastActive) this.snapshot(state, state.round)
  }

  /** After `endTurn`: crashes of the player who ended, production of the player who starts */
  afterEndTurn(state: GameState) {
    this.syncUnits(state, () => false, true)
    for (const p of state.participants) {
      if (p.status !== 'eliminated') continue
      const r = this.of(p.id)
      r.eliminatedRound ??= this.roundBefore
    }
    if (state.status === 'finished' && this.lastSnapshotRound !== state.round)
      this.snapshot(state, state.round)
    this.current = state
  }

  finish(state: GameState, victoryType: VictoryType, durationMs: number): GameResult {
    for (const p of state.participants) {
      const r = this.of(p.id)
      r.placement = p.placement
      r.finalScore = score(state, p.id)
      r.finalCities = state.cities.filter((c) => c.ownerId === p.id).length
      r.finalUnits = state.units.filter((u) => u.ownerId === p.id).length
    }
    const winner = state.winnerId ? this.of(state.winnerId).label : null
    return {
      jobId: this.job.id,
      matchupId: this.job.matchupId,
      mapId: this.job.mapId,
      seed: this.job.seed,
      rotation: this.job.rotation,
      rounds: state.round,
      winnerLabel: winner,
      victoryType,
      durationMs: Math.round(durationMs),
      participants: [...this.byId.values()],
      timeline: this.timeline,
    }
  }

  private snapshot(state: GameState, round: number) {
    const byLabel: RoundSnapshot['byLabel'] = {}
    for (const p of state.participants) {
      const r = this.of(p.id)
      const row = { cities: 0, land: 0, sea: 0, air: 0, score: score(state, p.id) }
      row.cities = state.cities.filter((c) => c.ownerId === p.id).length
      for (const u of state.units) if (u.ownerId === p.id) row[unitType(u.unitTypeId).domain]++
      byLabel[r.label] = row
    }
    this.timeline.push({ round, byLabel })
    this.lastSnapshotRound = round
  }

  /** Diff the unit list: new units are production when `production`, vanished ones losses unless explained */
  private syncUnits(state: GameState, explained: (id: string) => boolean, production: boolean) {
    const seen = new Set<string>()
    for (const u of state.units) {
      seen.add(u.id)
      const owner = this.known.get(u.id)
      if (owner === undefined) {
        this.known.set(u.id, u.ownerId)
        if (production) {
          const r = this.of(u.ownerId)
          r.production[u.unitTypeId] = (r.production[u.unitTypeId] ?? 0) + 1
        }
      } else if (owner !== u.ownerId) this.known.set(u.id, u.ownerId)
    }
    for (const [id, owner] of this.known) {
      if (seen.has(id)) continue
      this.known.delete(id)
      if (!explained(id)) this.of(owner).combat.otherLosses++
    }
  }
}
