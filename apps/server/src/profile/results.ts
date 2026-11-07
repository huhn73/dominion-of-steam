import { and, inArray, notLike, sql } from 'drizzle-orm'
import { isTutorialMatchId, type GameState } from '@dos/shared/engine'
import type { Db } from '../db/client'
import { matches, playerResults, players } from '../db/schema'
import type { Tx } from '../matches/repository'
import { TUTORIAL_LIKE } from '../tutorial/service'

export type ResultRow = typeof playerResults.$inferInsert

/** The parts of a game state the results need (the backfill reads only these from jsonb) */
export type ResultState = Pick<
  GameState,
  'id' | 'name' | 'status' | 'round' | 'endedAt' | 'winnerId' | 'endReason' | 'participants'
> & { rules: Pick<GameState['rules'], 'victoryCondition'> }

/**
 * Rows for every human who finished or surrendered the match. A surrender counts from the moment
 * it happened (an AI plays on), a finished match for everyone who was still in.
 */
export function resultRows(state: ResultState): ResultRow[] {
  if (isTutorialMatchId(state.id)) return []
  const rows: ResultRow[] = []
  for (const p of state.participants) {
    const human = !p.isAI || !!p.surrender
    if (!human) continue
    const opponents = state.participants
      .filter((q) => q !== p)
      .map((q) =>
        q.surrender
          ? { id: q.id, name: q.surrender.name, isAI: false }
          : q.isAI
            ? { id: null, name: q.name, isAI: true }
            : { id: q.id, name: q.name, isAI: false },
      )
    const base = {
      playerId: p.id,
      matchId: state.id,
      matchName: state.name,
      playerCount: state.participants.length,
      factionId: p.factionId,
      victoryCondition: state.rules.victoryCondition,
      opponents,
    }
    if (p.surrender) {
      rows.push({
        ...base,
        endedAt: new Date(p.surrender.at),
        result: 'surrendered',
        placement: p.surrender.placement,
        rounds: p.surrender.round,
        citiesCaptured: p.surrender.citiesCaptured ?? p.citiesCaptured ?? 0,
        unitsBuilt: p.surrender.unitsBuilt ?? p.unitsBuilt ?? 0,
        endReason: null,
        beatHardAi: false,
      })
      continue
    }
    if (state.status !== 'finished') continue
    const won = state.winnerId === p.id
    rows.push({
      ...base,
      endedAt: new Date(state.endedAt ?? 0),
      result: won ? 'victory' : 'defeat',
      placement: p.placement ?? state.participants.length,
      rounds: state.round,
      citiesCaptured: p.citiesCaptured ?? 0,
      unitsBuilt: p.unitsBuilt ?? 0,
      endReason: state.endReason ?? null,
      beatHardAi:
        won && state.participants.some((q) => q.isAI && !q.surrender && q.aiDifficulty === 'hard'),
    })
  }
  return rows
}

/**
 * Store the results of a saved state; a result never changes once stored. Returns the players
 * with a new result (for the badges). Participants without an account are skipped.
 */
export async function recordResults(db: Tx | Db, state: ResultState): Promise<string[]> {
  const rows = resultRows(state)
  if (!rows.length) return []
  const known = new Set(
    (
      await db
        .select({ id: players.id })
        .from(players)
        .where(
          inArray(
            players.id,
            rows.map((r) => r.playerId),
          ),
        )
    ).map((r) => r.id),
  )
  const values = rows.filter((r) => known.has(r.playerId))
  if (!values.length) return []
  const inserted = await db
    .insert(playerResults)
    .values(values)
    .onConflictDoNothing()
    .returning({ playerId: playerResults.playerId })
  return inserted.map((r) => r.playerId)
}

/**
 * Results of matches stored before `player_results` existed: finished matches and running ones
 * with a surrender. Idempotent, runs at every server start. Returns the players with new rows.
 */
export async function backfillResults(db: Db): Promise<string[]> {
  const rows = await db
    .select({
      id: matches.id,
      name: matches.name,
      status: matches.status,
      round: matches.round,
      participants: sql<ResultState['participants']>`${matches.state}->'participants'`,
      winnerId: sql<string | null>`${matches.state}->>'winnerId'`,
      endedAt: sql<string | null>`${matches.state}->>'endedAt'`,
      endReason: sql<ResultState['endReason']>`${matches.state}->>'endReason'`,
      victoryCondition: sql<
        ResultState['rules']['victoryCondition']
      >`${matches.state}->'rules'->>'victoryCondition'`,
    })
    .from(matches)
    .where(
      and(
        notLike(matches.id, TUTORIAL_LIKE),
        sql`${matches.state} is not null`,
        sql`(${matches.status} = 'finished' or ${matches.state}->'participants' @> '[{"surrender": {}}]')`,
        sql`not exists (select 1 from ${playerResults} where ${playerResults.matchId} = ${matches.id})`,
      ),
    )
  const added = new Set<string>()
  for (const r of rows) {
    if (r.status === 'waiting' || !r.participants) continue
    const ids = await recordResults(db, {
      id: r.id,
      name: r.name,
      status: r.status,
      round: r.round,
      endedAt: r.endedAt,
      winnerId: r.winnerId,
      endReason: r.endReason,
      participants: r.participants,
      rules: { victoryCondition: r.victoryCondition },
    })
    for (const id of ids) added.add(id)
  }
  return [...added]
}
