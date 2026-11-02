import type { ProfileOverride, SimConfig } from './config'
import type { GameResult, ParticipantResult } from './collector'
import { mean, median, percentile, wilson } from './stats'

export interface CurvePoint {
  round: number
  cities: number
  units: number
  score: number
}

export interface LabelSummary {
  label: string
  factionId: string
  difficulty: string
  personalityId: string | null
  games: number
  wins: number
  winRate: number
  wilson: [number, number]
  avgPlacement: number | null
  eliminated: number
  medianEliminationRound: number | null
  /** Games with at least one capture */
  capturedAny: number
  avgFirstCaptureRound: number | null
  avgCaptures: { neutral: number; enemy: number; lost: number }
  avgFinalCities: number
  avgFinalUnits: number
  avgFinalScore: number
  /** Per game */
  combat: {
    attacks: number
    won: number
    lost: number
    cityAttacks: number
    cityAttacksWon: number
    unitsLost: number
    unitsKilled: number
    otherLosses: number
    damageDealt: number
    damageTaken: number
  }
  attackWinRate: number | null
  /** Per game */
  naval: { landings: number; loadedTurns: number; loadedIdle: number; overseasNeutral: number }
  /** Units built per game and type */
  production: Record<string, number>
  turns: {
    avgMs: number
    p95Ms: number
    maxMs: number
    avgCommands: number
    budgetExhausted: number
  }
  /** Mean over games per round; games that ended earlier keep their last values */
  curve: CurvePoint[]
}

export interface SeatSummary {
  seat: number
  games: number
  wins: number
  winRate: number
}

/** How the games of one matchup ended on one map */
export interface MapSummary {
  mapId: string
  games: number
  /** Share of games decided before the round limit or the simulation's cap */
  decided: number
  meanRounds: number
  victoryTypes: Record<string, number>
  wins: Record<string, number>
}

export interface MatchupSummary {
  matchupId: string
  sweepParams?: ProfileOverride
  games: number
  medianRounds: number
  meanRounds: number
  victoryTypes: Record<string, number>
  byMap: MapSummary[]
  bySeat: SeatSummary[]
  labels: LabelSummary[]
}

export interface SweepRank {
  rank: number
  matchupId: string
  params: ProfileOverride
  baseline: boolean
  games: number
  wins: number
  winRate: number
  wilson: [number, number]
  avgPlacement: number | null
}

export interface RunError {
  jobId: string
  error: string
}

export interface RunMeta {
  mode: 'run' | 'sweep' | 'bench'
  startedAt: string
  finishedAt: string
  workers: number
  jobs: number
}

export interface RunSummary extends RunMeta {
  name: string
  wallMs: number
  config: SimConfig
  played: number
  failed: number
  errors: RunError[]
  avgGameMs: number
  avgRounds: number
  msPerRound: number
  msPerAiTurn: number
  avgCommandsPerTurn: number
  matchups: MatchupSummary[]
  sweep?: SweepRank[]
}

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)
const nullableMean = (xs: readonly number[]) => (xs.length ? mean(xs) : null)

/** Value of a label at `round`, carrying the last snapshot forward */
function curveOf(games: readonly GameResult[], label: string, maxRound: number): CurvePoint[] {
  const points: CurvePoint[] = []
  for (let round = 1; round <= maxRound; round++) {
    const cities: number[] = []
    const units: number[] = []
    const scores: number[] = []
    for (const g of games) {
      let snap = g.timeline[0]
      for (const t of g.timeline) {
        if (t.round > round) break
        snap = t
      }
      const row = snap?.byLabel[label]
      if (!row) continue
      cities.push(row.cities)
      units.push(row.land + row.sea + row.air)
      scores.push(row.score)
    }
    points.push({ round, cities: mean(cities), units: mean(units), score: mean(scores) })
  }
  return points
}

function summarizeLabel(
  label: string,
  games: readonly GameResult[],
  maxRound: number,
): LabelSummary {
  const rows = games
    .map((g) => g.participants.find((p) => p.label === label))
    .filter((p): p is ParticipantResult => !!p)
  const first = rows[0]!
  const wins = games.filter((g) => g.winnerLabel === label).length
  const n = rows.length
  const per = (f: (p: ParticipantResult) => number) => mean(rows.map(f))
  const attacks = sum(rows.map((p) => p.combat.attacks))
  const production: Record<string, number> = {}
  for (const p of rows)
    for (const [type, count] of Object.entries(p.production))
      production[type] = (production[type] ?? 0) + count / n
  const turnMs = rows.flatMap((p) => p.turns.turnMs)
  const turnCount = sum(rows.map((p) => p.turns.count))
  const eliminationRounds = rows.map((p) => p.eliminatedRound).filter((r): r is number => r != null)
  const firstCaptures = rows
    .map((p) => p.captures.firstCaptureRound)
    .filter((r): r is number => r != null)
  return {
    label,
    factionId: first.factionId,
    difficulty: first.difficulty,
    personalityId: first.personalityId,
    games: n,
    wins,
    winRate: n ? wins / n : 0,
    wilson: wilson(wins, n),
    avgPlacement: nullableMean(rows.map((p) => p.placement).filter((x): x is number => x != null)),
    eliminated: eliminationRounds.length,
    medianEliminationRound: eliminationRounds.length ? median(eliminationRounds) : null,
    capturedAny: rows.filter((p) => p.captures.neutral + p.captures.enemy > 0).length,
    avgFirstCaptureRound: nullableMean(firstCaptures),
    avgCaptures: {
      neutral: per((p) => p.captures.neutral),
      enemy: per((p) => p.captures.enemy),
      lost: per((p) => p.captures.lost),
    },
    avgFinalCities: per((p) => p.finalCities),
    avgFinalUnits: per((p) => p.finalUnits),
    avgFinalScore: per((p) => p.finalScore),
    combat: {
      attacks: per((p) => p.combat.attacks),
      won: per((p) => p.combat.won),
      lost: per((p) => p.combat.lost),
      cityAttacks: per((p) => p.combat.cityAttacks),
      cityAttacksWon: per((p) => p.combat.cityAttacksWon),
      unitsLost: per((p) => p.combat.unitsLost),
      unitsKilled: per((p) => p.combat.unitsKilled),
      otherLosses: per((p) => p.combat.otherLosses),
      damageDealt: per((p) => p.combat.damageDealt),
      damageTaken: per((p) => p.combat.damageTaken),
    },
    attackWinRate: attacks ? sum(rows.map((p) => p.combat.won)) / attacks : null,
    naval: {
      landings: per((p) => p.naval?.landings ?? 0),
      loadedTurns: per((p) => p.naval?.loadedTurns ?? 0),
      loadedIdle: per((p) => p.naval?.loadedIdle ?? 0),
      overseasNeutral: per((p) => p.naval?.overseasNeutral ?? 0),
    },
    production,
    turns: {
      avgMs: mean(turnMs),
      p95Ms: percentile(turnMs, 0.95),
      maxMs: turnMs.length ? Math.max(...turnMs) : 0,
      avgCommands: turnCount ? sum(rows.map((p) => p.turns.commands)) / turnCount : 0,
      budgetExhausted: sum(rows.map((p) => p.turns.budgetExhausted)),
    },
    curve: curveOf(games, label, maxRound),
  }
}

export function summarizeMatchup(
  matchupId: string,
  games: readonly GameResult[],
  sweepParams?: ProfileOverride,
): MatchupSummary {
  const labels = [...new Set(games.flatMap((g) => g.participants.map((p) => p.label)))]
  const maxRound = Math.max(0, ...games.map((g) => g.rounds))
  const victoryTypes: Record<string, number> = {}
  for (const g of games) victoryTypes[g.victoryType] = (victoryTypes[g.victoryType] ?? 0) + 1
  const byMap = [...new Set(games.map((g) => g.mapId))].map((mapId): MapSummary => {
    const own = games.filter((g) => g.mapId === mapId)
    const types: Record<string, number> = {}
    const wins: Record<string, number> = {}
    for (const g of own) {
      types[g.victoryType] = (types[g.victoryType] ?? 0) + 1
      if (g.winnerLabel) wins[g.winnerLabel] = (wins[g.winnerLabel] ?? 0) + 1
    }
    const open = own.filter((g) => g.victoryType === 'roundLimit' || g.victoryType === 'aborted')
    return {
      mapId,
      games: own.length,
      decided: own.length ? 1 - open.length / own.length : 0,
      meanRounds: mean(own.map((g) => g.rounds)),
      victoryTypes: types,
      wins,
    }
  })
  const seats = Math.max(0, ...games.map((g) => g.participants.length))
  const bySeat: SeatSummary[] = Array.from({ length: seats }, (_, seat) => {
    const wins = games.filter(
      (g) => g.participants.find((p) => p.label === g.winnerLabel)?.seat === seat,
    ).length
    return { seat, games: games.length, wins, winRate: games.length ? wins / games.length : 0 }
  })
  return {
    matchupId,
    ...(sweepParams ? { sweepParams } : {}),
    games: games.length,
    medianRounds: median(games.map((g) => g.rounds)),
    meanRounds: mean(games.map((g) => g.rounds)),
    victoryTypes,
    byMap,
    bySeat,
    labels: labels.map((l) => summarizeLabel(l, games, maxRound)),
  }
}

export function rankSweep(config: SimConfig, matchups: readonly MatchupSummary[]): SweepRank[] {
  const subject = config.sweep?.subject.label
  if (!subject) return []
  const rows = matchups
    .filter((m) => m.sweepParams)
    .map((m) => {
      const l = m.labels.find((x) => x.label === subject)
      return {
        rank: 0,
        matchupId: m.matchupId,
        params: m.sweepParams!,
        baseline: Object.keys(m.sweepParams!).length === 0,
        games: l?.games ?? 0,
        wins: l?.wins ?? 0,
        winRate: l?.winRate ?? 0,
        wilson: l?.wilson ?? ([0, 1] as [number, number]),
        avgPlacement: l?.avgPlacement ?? null,
      }
    })
    .sort(
      (a, b) =>
        b.winRate - a.winRate ||
        b.wilson[0] - a.wilson[0] ||
        (a.avgPlacement ?? 9) - (b.avgPlacement ?? 9),
    )
  rows.forEach((r, i) => (r.rank = i + 1))
  return rows
}

export function aggregate(
  config: SimConfig,
  results: readonly GameResult[],
  errors: readonly RunError[],
  meta: RunMeta,
): RunSummary {
  const byMatchup = new Map<string, GameResult[]>()
  for (const m of config.matchups) byMatchup.set(m.id, [])
  for (const r of results) {
    if (!byMatchup.has(r.matchupId)) byMatchup.set(r.matchupId, [])
    byMatchup.get(r.matchupId)!.push(r)
  }
  const matchups = [...byMatchup.entries()]
    .filter(([, games]) => games.length > 0)
    .map(([id, games]) =>
      summarizeMatchup(id, games, config.matchups.find((m) => m.id === id)?.sweepParams),
    )
  const rounds = sum(results.map((r) => r.rounds))
  const turnMs = sum(results.flatMap((r) => r.participants.map((p) => p.turns.totalMs)))
  const turns = sum(results.flatMap((r) => r.participants.map((p) => p.turns.count)))
  const commands = sum(results.flatMap((r) => r.participants.map((p) => p.turns.commands)))
  const sweep = config.sweep ? rankSweep(config, matchups) : undefined
  return {
    ...meta,
    name: config.name,
    wallMs: new Date(meta.finishedAt).getTime() - new Date(meta.startedAt).getTime(),
    config,
    played: results.length,
    failed: errors.length,
    errors: [...errors],
    avgGameMs: mean(results.map((r) => r.durationMs)),
    avgRounds: mean(results.map((r) => r.rounds)),
    msPerRound: rounds ? sum(results.map((r) => r.durationMs)) / rounds : 0,
    msPerAiTurn: turns ? turnMs / turns : 0,
    avgCommandsPerTurn: turns ? commands / turns : 0,
    matchups,
    ...(sweep ? { sweep } : {}),
  }
}
