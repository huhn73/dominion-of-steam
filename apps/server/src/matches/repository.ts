import { eq, inArray, sql } from 'drizzle-orm'
import {
  currentParticipant,
  type GameState,
  type LogEntry,
  normalizeState,
} from '@dos/shared/engine'
import type { Db } from '../db/client'
import { recordResults } from '../profile/results'
import { matches, matchSeats, players, turns } from '../db/schema'

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

/** The match exists but still waits for players (no game state yet) */
export class MatchWaitingError extends Error {}

export function columns(state: GameState) {
  return {
    name: state.name,
    mode: state.mode,
    status: state.status,
    round: state.round,
    seed: state.seed,
    turnDeadline: state.turnDeadline ? new Date(state.turnDeadline) : null,
    endedAt: state.endedAt ? new Date(state.endedAt) : null,
    aiPending: state.status === 'running' && currentParticipant(state).isAI,
    state,
  }
}

function stateOf(row: typeof matches.$inferSelect | undefined) {
  if (!row) return null
  if (!row.state) throw new MatchWaitingError()
  // States stored by older versions get the fields added since (rules, results, statistics)
  return normalizeState(row.state)
}

/** Game state of a match; null if there is none, MatchWaitingError while it waits for players */
export async function findMatch(db: Db | Tx, id: string) {
  const [row] = await db.select().from(matches).where(eq(matches.id, id))
  return stateOf(row)
}

/** Load a match and lock its row until the transaction ends */
export async function lockMatch(tx: Tx, id: string) {
  const [row] = await tx.select().from(matches).where(eq(matches.id, id)).for('update')
  return stateOf(row)
}

/** Seats of a running match as they are in the game state (participant = seat) */
export async function writeRunningSeats(db: Db | Tx, state: GameState) {
  await db.delete(matchSeats).where(eq(matchSeats.matchId, state.id))
  // Humans without an account (old dev states with `p1`) keep only their participant id
  // Surrendered players keep their seat (an AI plays it, the player still took part)
  const humanIds = state.participants.filter((p) => !p.isAI || p.surrender).map((p) => p.id)
  const known = new Set(
    humanIds.length
      ? (
          await db.select({ id: players.id }).from(players).where(inArray(players.id, humanIds))
        ).map((r) => r.id)
      : [],
  )
  await db.insert(matchSeats).values(
    state.participants.map((p, seat) => ({
      matchId: state.id,
      seat,
      kind: p.isAI ? ('ai' as const) : ('player' as const),
      playerId: known.has(p.id) ? p.id : null,
      participantId: p.id,
      factionId: p.factionId,
      aiPersonalityId: p.aiPersonalityId,
      aiDifficulty: p.aiDifficulty,
      ready: true,
    })),
  )
}

/** Players who got a new result with the last saves (badges are checked for them) */
export type ResultListener = (tx: Tx, playerIds: string[]) => Promise<void>
let onResults: ResultListener | null = null
export const setResultListener = (listener: ResultListener | null) => (onResults = listener)

/** Save a running or finished match; results of finished or surrendered players are stored too */
export async function saveMatch(tx: Tx, state: GameState) {
  await tx
    .update(matches)
    .set({ ...columns(state), version: sql`${matches.version} + 1`, updatedAt: new Date() })
    .where(eq(matches.id, state.id))
  if (state.status === 'finished' || state.participants.some((p) => p.surrender)) {
    const added = await recordResults(tx, state)
    if (added.length && onResults) await onResults(tx, added)
  }
}

/** Insert or replace a running match (demo); its seats follow the participants */
export async function insertMatch(db: Db, state: GameState) {
  await db
    .insert(matches)
    .values({ id: state.id, ...columns(state) })
    .onConflictDoUpdate({
      target: matches.id,
      set: { ...columns(state), version: 1, updatedAt: new Date() },
    })
  await db.delete(turns).where(eq(turns.matchId, state.id))
  await writeRunningSeats(db, state)
  await recordResults(db, state)
}

export async function recordTurn(
  tx: Tx,
  matchId: string,
  round: number,
  participantId: string,
  actions: LogEntry[],
) {
  await tx
    .insert(turns)
    .values({ matchId, round, participantId, actions })
    .onConflictDoUpdate({
      target: [turns.matchId, turns.round, turns.participantId],
      set: { actions },
    })
}
