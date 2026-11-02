import type { PresenceStatus } from '@dos/shared/account'

/** A player counts as online for this long after their last request */
export const ONLINE_WINDOW_MS = 2 * 60_000

export interface PresenceInput {
  lastSeenAt: Date | null
  lastSeenMatchId: string | null
}

/**
 * online: last request less than 2 minutes ago; inGame: online and that request was for a
 * match (view or command); otherwise offline with the time of the last request.
 */
export function presenceOf(
  p: PresenceInput,
  now = new Date(),
): { status: PresenceStatus; lastSeen: string | null } {
  const online = p.lastSeenAt !== null && now.getTime() - p.lastSeenAt.getTime() < ONLINE_WINDOW_MS
  if (!online) return { status: 'offline', lastSeen: p.lastSeenAt?.toISOString() ?? null }
  return { status: p.lastSeenMatchId ? 'inGame' : 'online', lastSeen: null }
}
