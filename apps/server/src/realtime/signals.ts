import { eq, sql } from 'drizzle-orm'
import type { GameState } from '@dos/shared/engine'
import type { ServerSignal, SignalTopic } from '@dos/shared/realtime'
import type { Db } from '../db/client'
import { matches, matchSeats } from '../db/schema'
import type { Tx } from '../matches/repository'

/** Postgres channel of the signals (LISTEN/NOTIFY) */
export const SIGNAL_CHANNEL = 'dos_signal'

/** Message on the channel: who is affected and what changed */
export interface SignalMessage extends ServerSignal {
  players: string[]
}

/**
 * Tell the players' open event streams that something changed. Called inside the transaction:
 * Postgres delivers the notification only on commit, a rollback sends nothing.
 */
export async function signal(tx: Tx | Db, playerIds: Iterable<string>, topics: SignalTopic[]) {
  const players = [...new Set(playerIds)]
  if (!players.length || !topics.length) return
  const message: SignalMessage = { players, topics }
  await tx.execute(sql`select pg_notify(${SIGNAL_CHANNEL}, ${JSON.stringify(message)})`)
}

/**
 * A running match changed: its board and the lobby of every participant (AIs have no stream,
 * surrendered players still look at the board). `except` skips the player whose own request
 * already returned the new view.
 */
export async function signalMatch(
  tx: Tx | Db,
  state: GameState,
  { except }: { except?: string } = {},
) {
  const ids = state.participants.map((p) => p.id)
  await signal(
    tx,
    ids.filter((id) => id !== except),
    [`match:${state.id}`, 'lobby'],
  )
  if (except && ids.includes(except)) await signal(tx, [except], ['lobby'])
}

/** The waiting room of a match changed: host and everyone on a seat (also invited friends) */
export async function signalRoom(tx: Tx | Db, matchId: string, extra: string[] = []) {
  const seats = await tx
    .select({ playerId: matchSeats.playerId })
    .from(matchSeats)
    .where(eq(matchSeats.matchId, matchId))
  const [row] = await tx
    .select({ hostId: matches.hostId })
    .from(matches)
    .where(eq(matches.id, matchId))
  const ids = seats.flatMap((s) => (s.playerId ? [s.playerId] : []))
  if (row?.hostId) ids.push(row.hostId)
  await signal(tx, [...ids, ...extra], [`room:${matchId}`, 'lobby'])
}
