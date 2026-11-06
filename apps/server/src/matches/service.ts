import {
  applyCommand,
  CommandError,
  currentParticipant,
  endIfNoHumans,
  endTurn,
  type GameState,
  normalizeState,
  playAITurn,
  projectView,
  type ParticipantMapping,
  seedDemo,
} from '@dos/shared/engine'
import type { Command, CommandResponse } from '@dos/shared/game'
import type { Db } from '../db/client'
import { eq, sql } from 'drizzle-orm'
import { matches, matchSeats, players } from '../db/schema'
import { isTutorialMatchId } from '../tutorial/service'
import { turnNotifications } from '../notifications/events'
import type { Notifier } from '../notifications/service'
import { signalMatch } from '../realtime/signals'
import {
  findMatch,
  insertMatch,
  lockMatch,
  writeRunningSeats,
  MatchWaitingError,
  recordTurn,
  saveMatch,
  type Tx,
} from './repository'

export const DEMO_MATCH_ID = 'demo'

export class MatchNotFoundError extends Error {}
export class NotParticipantError extends Error {}
/** The player surrendered this match; an AI plays the faction now */
export class SurrenderedError extends Error {}

export { MatchWaitingError }

/** Store the turn the current participant of `before` has just ended */
async function recordEndedTurn(tx: Tx, before: GameState, after: GameState) {
  const p = currentParticipant(before)
  const actions = after.log.filter((l) => l.participantId === p.id && l.seq > p.lastTurnEndSeq)
  await recordTurn(tx, before.id, before.round, p.id, actions)
}

/** End the current participant's turn and store it in the turn history */
export async function finishTurn(tx: Tx, state: GameState, now: Date) {
  const next = endTurn(structuredClone(state), now)
  await recordEndedTurn(tx, state, next)
  return next
}

/** Wall-clock limit per AI turn (the AI also has a deterministic work budget below it) */
export const AI_TURN_BUDGET_MS = 10_000

/**
 * Play the turns of all AI participants that are on the move, one after another. Runs inside
 * the row-locked transaction of the human's command, so with several AIs the lock may be held
 * for a multiple of the budget; a background job would be the next step.
 */
export async function runAITurns(tx: Tx, state: GameState, now: Date) {
  let s = state
  // Without humans nobody would ever stop the AIs: the match ends by points
  while (s.status === 'running' && !endIfNoHumans(s, now) && currentParticipant(s).isAI) {
    const ai = currentParticipant(s)
    try {
      s = playAITurn(s, ai.id, now, { deadline: Date.now() + AI_TURN_BUDGET_MS })
    } catch (err) {
      // A bug in the AI must not block the match: the AI then just ends its turn
      console.error(`KI-Zug von ${ai.name} (${s.id}) fehlgeschlagen`, err)
    }
    s = await finishTurn(tx, s, now)
  }
  return s
}

export interface MatchServiceOptions {
  /** Player ids for the human participants of the demo match (`p1` Björn, `p3` Lena) */
  demoMapping?: () => Promise<ParticipantMapping>
  /** Notifications when the turn passes to a human or the match ends */
  notifier?: Notifier
}

export function createMatchService(db: Db, { demoMapping, notifier }: MatchServiceOptions = {}) {
  /** Store the notifications for a state change (inside the transaction) */
  async function notifyChange(tx: Tx, before: GameState, after: GameState, actorId: string) {
    await notifier?.enqueue(tx, turnNotifications(before, after, { actorId }))
  }

  async function getView(matchId: string, playerId: string) {
    const state = await findMatch(db, matchId)
    if (!state) throw new MatchNotFoundError()
    if (!state.participants.some((p) => p.id === playerId)) throw new NotParticipantError()
    return projectView(state, playerId)
  }

  async function execute(
    matchId: string,
    playerId: string,
    cmd: Command,
  ): Promise<CommandResponse> {
    const now = new Date()
    return db
      .transaction(async (tx) => {
        const state = await lockMatch(tx, matchId)
        if (!state) throw new MatchNotFoundError()
        const me = state.participants.find((p) => p.id === playerId)
        if (!me) throw new NotParticipantError()
        if (me.surrender) throw new SurrenderedError()

        const outcome = applyCommand(state, playerId, cmd, now)
        if (cmd.type === 'endTurn') await recordEndedTurn(tx, state, outcome.state)
        const next = await runAITurns(tx, outcome.state, now)
        const combat = outcome.combat
        await saveMatch(tx, next)
        if (isTutorialMatchId(matchId)) {
          // No notifications from the tutorial; winning it is remembered on the account
          if (state.status === 'running' && next.winnerId === playerId)
            await tx
              .update(players)
              .set({ tutorialCompletedAt: now })
              .where(eq(players.id, playerId))
        } else {
          await notifyChange(tx, state, next, playerId)
          await signalMatch(tx, next, { except: playerId })
        }
        return { view: projectView(next, playerId), ...(combat ? { combat } : {}) }
      })
      .finally(() => notifier?.kick())
  }

  /** Dev helper: other humans end their turns until `playerId` is on the move again */
  async function passForOthers(matchId: string, playerId: string) {
    const now = new Date()
    return db
      .transaction(async (tx) => {
        const state = await lockMatch(tx, matchId)
        if (!state) throw new MatchNotFoundError()
        if (!state.participants.some((p) => p.id === playerId)) throw new NotParticipantError()
        let next = state
        while (next.status === 'running' && currentParticipant(next).id !== playerId) {
          next = await finishTurn(tx, next, now)
          next = await runAITurns(tx, next, now)
        }
        await saveMatch(tx, next)
        await notifyChange(tx, state, next, playerId)
        await signalMatch(tx, next, { except: playerId })
        return projectView(next, playerId)
      })
      .finally(() => notifier?.kick())
  }

  async function resetDemo() {
    const mapping = (await demoMapping?.()) ?? {}
    await insertMatch(db, seedDemo(DEMO_MATCH_ID, new Date(), mapping))
  }

  /** Create the demo, or reset it when it does not belong to the current dev accounts */
  async function ensureDemo() {
    const state = await findMatch(db, DEMO_MATCH_ID)
    const bjoern = (await demoMapping?.())?.p1 ?? 'p1'
    if (!state || !state.participants.some((p) => p.id === bjoern)) await resetDemo()
  }

  /**
   * Matches stored before seats existed (e.g. an old demo) are not found by player: write the
   * seats from their game state. Runs at server start; returns the number of matches fixed.
   */
  async function backfillSeats() {
    const rows = await db
      .select({ id: matches.id, state: matches.state })
      .from(matches)
      .where(
        sql`${matches.state} is not null and not exists (select 1 from ${matchSeats} where ${matchSeats.matchId} = ${matches.id})`,
      )
    for (const row of rows) await writeRunningSeats(db, normalizeState(row.state!))
    return rows.length
  }

  /** Dev only: delete solo matches from before accounts existed (human participant `p1`) */
  async function deleteLegacyMatches() {
    const legacy = JSON.stringify([{ id: 'p1', isAI: false }])
    const deleted = await db
      .delete(matches)
      .where(
        sql`${matches.id} <> ${DEMO_MATCH_ID} and ${matches.state}->'participants' @> ${legacy}::jsonb`,
      )
      .returning({ id: matches.id })
    return deleted.length
  }

  return {
    getView,
    execute,
    passForOthers,
    resetDemo,
    ensureDemo,
    deleteLegacyMatches,
    backfillSeats,
  }
}

export type MatchService = ReturnType<typeof createMatchService>
export { CommandError }
