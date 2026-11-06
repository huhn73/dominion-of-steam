import { type GameState, playAITurn } from '@dos/shared/engine'

/** Wall-clock limit per AI turn (the AI also has a deterministic work budget below it) */
export const AI_TURN_BUDGET_MS = 10_000

/** One AI turn to compute: the state, the AI on the move and the time of the step */
export interface AiJob {
  state: GameState
  aiId: string
  /** ISO time */
  now: string
}

export type AiResult = { ok: true; state: GameState } | { ok: false; error: string }

export const errorText = (e: unknown) => (e instanceof Error ? (e.stack ?? e.message) : String(e))

/** Play the AI's moves (without ending its turn); runs in the worker thread or inline */
export function playJob(job: AiJob): AiResult {
  try {
    const state = playAITurn(job.state, job.aiId, new Date(job.now), {
      deadline: Date.now() + AI_TURN_BUDGET_MS,
    })
    return { ok: true, state }
  } catch (e) {
    return { ok: false, error: errorText(e) }
  }
}
