import { eq } from 'drizzle-orm'
import {
  isTutorialMatchId,
  normalizeState,
  seedTutorial,
  TUTORIAL_PREFIX,
  TUTORIAL_STEPS,
  tutorialMatchId,
} from '@dos/shared/engine'
import type { LobbyTutorial } from '@dos/shared/lobby'
import type { Db } from '../db/client'
import { matches, players } from '../db/schema'
import { findMatch, insertMatch } from '../matches/repository'

export { isTutorialMatchId, tutorialMatchId }

/** LIKE pattern of tutorial match ids; statistics and lists leave those matches out */
export const TUTORIAL_LIKE = `${TUTORIAL_PREFIX}%`

/** One guided tutorial match per player (id `tutorial-<playerId>`) */
export function createTutorialService(db: Db) {
  /** Continue the running tutorial, or start a new one (`restart`, or none running) */
  async function start(player: { id: string; displayName: string }, restart = false) {
    const id = tutorialMatchId(player.id)
    const existing = await findMatch(db, id)
    if (!existing || restart || existing.status !== 'running')
      await insertMatch(db, seedTutorial(player.id, player.displayName))
    return { matchId: id }
  }

  async function status(playerId: string): Promise<LobbyTutorial> {
    const [row] = await db
      .select({
        completedAt: players.tutorialCompletedAt,
        dismissedAt: players.tutorialDismissedAt,
      })
      .from(players)
      .where(eq(players.id, playerId))
    const [match] = await db
      .select({ status: matches.status, state: matches.state })
      .from(matches)
      .where(eq(matches.id, tutorialMatchId(playerId)))
    const state = match?.state ? normalizeState(match.state) : null
    return {
      matchId: state ? state.id : null,
      status: state ? (match!.status === 'finished' ? 'finished' : 'running') : null,
      step: state?.tutorial?.step ?? 0,
      total: TUTORIAL_STEPS.length,
      completed: !!row?.completedAt,
      dismissed: !!row?.dismissedAt,
    }
  }

  async function dismiss(playerId: string, now = new Date()) {
    await db.update(players).set({ tutorialDismissedAt: now }).where(eq(players.id, playerId))
  }

  async function remove(playerId: string) {
    await db.delete(matches).where(eq(matches.id, tutorialMatchId(playerId)))
  }

  return { start, status, dismiss, remove }
}

export type TutorialService = ReturnType<typeof createTutorialService>
