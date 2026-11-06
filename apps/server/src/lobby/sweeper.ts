import { and, eq, gt, isNotNull, lte } from 'drizzle-orm'
import { currentParticipant } from '@dos/shared/engine'
import { DEADLINE_SOON_HOURS } from '@dos/shared/notifications'
import type { Db } from '../db/client'
import { matches } from '../db/schema'
import { deadlineSoonNotification, turnNotifications } from '../notifications/events'
import type { Notifier } from '../notifications/service'
import { signalMatch } from '../realtime/signals'
import { lockMatch, saveMatch } from '../matches/repository'
import { finishTurn, runAITurns } from '../matches/service'

/** How often the server looks for expired turns and due e-mails */
export const SWEEP_INTERVAL_MS = 15_000
/** How often expired sessions and link tokens are removed */
export const HOUSEKEEPING_INTERVAL_MS = 3600_000

export interface SweeperOptions {
  /** Hourly cleanup (expired sessions and tokens) */
  housekeeping?: (now: Date) => Promise<void>
}

/**
 * Background work that does not belong to a request:
 * - turns whose deadline has passed end as if the player had pressed "Zug beenden" (then the
 *   AIs move and the next human hears about it),
 * - "Frist läuft bald ab" once per turn when less than 3 hours are left (async matches),
 * - pending push messages and due e-mails go out.
 */
export function createSweeper(db: Db, notifier?: Notifier, options: SweeperOptions = {}) {
  let lastHousekeeping = 0

  /** End all expired turns; returns the ids of the matches that moved on */
  async function expireTurns(now: Date) {
    const due = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.status, 'running'),
          isNotNull(matches.turnDeadline),
          lte(matches.turnDeadline, now),
        ),
      )
    const ended: string[] = []
    for (const { id } of due) {
      await db.transaction(async (tx) => {
        const state = await lockMatch(tx, id)
        // Re-check under the lock: the player may have ended the turn in the meantime
        if (!state || state.status !== 'running' || !state.turnDeadline) return
        if (Date.parse(state.turnDeadline) > now.getTime()) return
        let next = state
        if (!currentParticipant(next).isAI) next = await finishTurn(tx, next, now)
        next = await runAITurns(tx, next, now)
        await saveMatch(tx, next)
        await notifier?.enqueue(tx, turnNotifications(state, next), now)
        await signalMatch(tx, next)
        ended.push(id)
      })
    }
    return ended
  }

  /** "Frist läuft bald ab" for humans on the move in async matches (once per turn) */
  async function warnDeadlines(now: Date) {
    const soon = await db
      .select({ state: matches.state })
      .from(matches)
      .where(
        and(
          eq(matches.status, 'running'),
          eq(matches.mode, 'async'),
          gt(matches.turnDeadline, now),
          lte(matches.turnDeadline, new Date(now.getTime() + DEADLINE_SOON_HOURS * 3600_000)),
        ),
      )
    const items = soon.flatMap(({ state }) => {
      if (!state) return []
      const current = currentParticipant(state)
      return current.isAI ? [] : [deadlineSoonNotification(state, current.id)]
    })
    // The dedupe key (match, round, seat) makes this a no-op for turns already warned
    if (items.length) await notifier?.enqueue(db, items, now)
  }

  async function sweep(now = new Date()) {
    const ended = await expireTurns(now)
    await warnDeadlines(now)
    await notifier?.deliver(now)
    if (options.housekeeping && now.getTime() - lastHousekeeping >= HOUSEKEEPING_INTERVAL_MS) {
      lastHousekeeping = now.getTime()
      await options.housekeeping(now)
    }
    return { ended }
  }

  /** Run `sweep` periodically (not in tests); returns a stop function */
  function start(log: (msg: string, err: unknown) => void, intervalMs = SWEEP_INTERVAL_MS) {
    let busy = false
    const timer = setInterval(() => {
      if (busy) return
      busy = true
      sweep()
        .catch((err) => log('Hintergrundaufgaben fehlgeschlagen', err))
        .finally(() => (busy = false))
    }, intervalMs)
    timer.unref()
    return () => clearInterval(timer)
  }

  return { sweep, expireTurns, warnDeadlines, start }
}

export type Sweeper = ReturnType<typeof createSweeper>
