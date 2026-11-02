import { createMatch, endTurn, playAITurn, type GameState } from '@dos/shared/engine'
import { MetricsCollector, type GameResult, type VictoryType } from './collector'
import type { GameJob } from './jobs'

/** Fixed clock: timestamps and deadlines never influence the simulation */
export const NOW = new Date('2026-01-01T00:00:00Z')

export interface GameHooks {
  /** Called whenever a new round starts and once more when the game ends */
  onRound?: (state: GameState) => void
}

function classify(state: GameState): VictoryType {
  const active = state.participants.filter((p) => p.status === 'active')
  if (active.length <= 1) return 'elimination'
  if (
    state.rules.victoryCondition === 'roundLimit' &&
    state.rules.roundLimit != null &&
    state.round >= state.rules.roundLimit
  )
    return 'roundLimit'
  return 'capitals'
}

/** Play one game headless, every seat by the AI, and collect its metrics */
export function runGame(job: GameJob, hooks: GameHooks = {}): GameResult {
  const t0 = performance.now()
  let s = createMatch(
    {
      id: job.id,
      name: job.matchupId,
      rules: job.rules,
      map: job.map,
      participants: job.participants.map((p) => ({
        id: p.id,
        name: p.label,
        factionId: p.factionId,
        color: p.color,
        isAI: true,
        aiDifficulty: p.difficulty,
        aiPersonalityId: p.personalityId ?? null,
      })),
    },
    NOW,
  )
  const overrides = new Map(job.participants.map((p) => [p.id, p.profile]))
  const c = new MetricsCollector(s, job)
  let round = s.round
  while (s.status === 'running' && s.round <= job.maxRounds) {
    const me = s.participants[s.seat]!
    c.beginTurn(me.id)
    const t = performance.now()
    s = playAITurn(s, me.id, NOW, { profile: overrides.get(me.id), onCommand: c.onCommand })
    c.endAiTurn(performance.now() - t)
    c.beforeEndTurn(s)
    s = endTurn(s, NOW)
    c.afterEndTurn(s)
    if (s.round !== round || s.status !== 'running') {
      round = s.round
      hooks.onRound?.(s)
    }
  }
  const victoryType = s.status === 'finished' ? classify(s) : 'aborted'
  return c.finish(s, victoryType, performance.now() - t0)
}
