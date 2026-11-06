import type { ServerSignal } from '@dos/shared/realtime'
import type { Db } from '../db/client'
import { SIGNAL_CHANNEL, type SignalMessage } from './signals'

type Listener = (signal: ServerSignal) => void

/**
 * Fan-out of the Postgres signals to the open event streams of this process. Listens only once
 * someone subscribes. After a reconnect of the LISTEN connection notifications may have been
 * missed, so every stream gets `resync` (reload everything).
 */
export function createHub(db: Db, log: (msg: string, err: unknown) => void) {
  const listeners = new Map<string, Set<Listener>>()
  let listening: Promise<{ unlisten: () => Promise<void> } | null> | null = null
  let connects = 0

  function dispatch(raw: string) {
    let message: SignalMessage
    try {
      message = JSON.parse(raw) as SignalMessage
    } catch (err) {
      log('Ungültiges Signal', err)
      return
    }
    const signal: ServerSignal = { topics: message.topics }
    for (const id of message.players) for (const fn of listeners.get(id) ?? []) fn(signal)
  }

  function broadcast(signal: ServerSignal) {
    for (const set of listeners.values()) for (const fn of set) fn(signal)
  }

  function ensureListening() {
    listening ??= db.$client
      .listen(SIGNAL_CHANNEL, dispatch, () => {
        if (connects++ > 0) broadcast({ topics: ['resync'] })
      })
      .then((req) => req as { unlisten: () => Promise<void> })
      .catch((err) => {
        log('LISTEN für Signale fehlgeschlagen', err)
        listening = null
        return null
      })
    return listening
  }

  /** Register a stream of `playerId`; resolves once LISTEN is active. Returns the unsubscribe. */
  async function subscribe(playerId: string, fn: Listener) {
    let set = listeners.get(playerId)
    if (!set) listeners.set(playerId, (set = new Set()))
    set.add(fn)
    await ensureListening()
    return () => {
      set.delete(fn)
      if (!set.size && listeners.get(playerId) === set) listeners.delete(playerId)
    }
  }

  async function close() {
    const req = await listening
    listening = null
    listeners.clear()
    await req?.unlisten().catch(() => {})
  }

  return {
    subscribe,
    close,
    streams: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
    /** The player has an open event stream (is in the app right now) */
    isConnected: (playerId: string) => (listeners.get(playerId)?.size ?? 0) > 0,
  }
}

export type Hub = ReturnType<typeof createHub>
