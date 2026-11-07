/**
 * Topics of the server-sent events (`GET /api/events`). The server only says what changed; the
 * client reloads it through the usual endpoints.
 * - `lobby`: own matches, invitations, open matches
 * - `match:<id>`: the board of a running match
 * - `room:<id>`: the waiting room of a match
 * - `friends`: friends and friend requests
 * - `ready`: the stream is connected (first message)
 * - `resync`: signals may have been missed, reload everything
 */
export type SignalTopic =
  'lobby' | 'friends' | 'ready' | 'resync' | `match:${string}` | `room:${string}`

/** Data of one event on the stream */
export interface ServerSignal {
  topics: SignalTopic[]
}
