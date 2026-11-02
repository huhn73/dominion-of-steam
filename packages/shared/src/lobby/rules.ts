// Regeln der Lobby, die die Komponenten anzeigen und der Server durchsetzt
import type { WaitingSeat } from './types'

/** Same as `REMIND_COOLDOWN_HOURS` in MatchCard.tsx of the design handoff */
export const REMIND_COOLDOWN_HOURS = 12

/** Own turns with less time left are highlighted (and get "Frist läuft bald ab") */
export const DEADLINE_WARNING_HOURS = 3

/** Columns × rows of `Match.miniMap`, independent of the map size */
export const MINI_MAP_COLS = 24
export const MINI_MAP_ROWS = 12

/** True while a reminder sent at `remindedAt` still blocks the next one */
export function remindLocked(remindedAt: string | Date | null, now: Date) {
  if (!remindedAt) return false
  const at = typeof remindedAt === 'string' ? new Date(remindedAt) : remindedAt
  return now.getTime() - at.getTime() < REMIND_COOLDOWN_HOURS * 3600_000
}

/**
 * Names of joined players who are not ready yet; the host may start once this is empty.
 * Invited and open seats do not block (they count as free seats), same as in Warteraum.tsx.
 */
export function startBlockers(seats: Pick<WaitingSeat, 'kind' | 'status' | 'name'>[]) {
  return seats.filter((s) => s.kind === 'player' && s.status !== 'ready').map((s) => s.name ?? '?')
}
