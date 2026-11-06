import { useEffect, useSyncExternalStore } from 'react'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import type { ServerSignal } from '@dos/shared/realtime'

/** Retry after the browser gave up on the stream (e.g. 401 or the server was gone too long) */
export const RECONNECT_MS = 30_000

// Connection state outside React: the polling hooks read it to choose their interval
let connected = false
const listeners = new Set<() => void>()
function setConnected(value: boolean) {
  if (connected === value) return
  connected = value
  for (const notify of listeners) notify()
}

/** true while the event stream is open; lobby, waiting room and match poll only as a fallback */
export function useServerEventsConnected() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => connected,
    () => false,
  )
}

/** Query keys per topic (literal keys, so this module does not import the query hooks) */
function invalidate(queryClient: QueryClient, topic: string) {
  if (topic === 'lobby') return queryClient.invalidateQueries({ queryKey: ['lobby'] })
  if (topic === 'resync') {
    for (const key of ['lobby', 'room', 'match']) void queryClient.invalidateQueries({ queryKey: [key] })
    return
  }
  const [kind, id] = topic.split(':')
  if ((kind === 'match' || kind === 'room') && id)
    return queryClient.invalidateQueries({ queryKey: [kind, id] })
}

/**
 * Server-sent events (`/api/events`): the server says what changed, the queries reload it.
 * Mounted below the router while signed in; it only touches the query client and subscribes to
 * no query itself (the cache is cleared on login).
 */
export function ServerEvents() {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (typeof EventSource === 'undefined') return
    let source: EventSource | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    let everReady = false

    const open = () => {
      retry = null
      source = new EventSource('/api/events')
      source.onmessage = (e: MessageEvent<string>) => {
        let signal: ServerSignal
        try {
          signal = JSON.parse(e.data) as ServerSignal
        } catch {
          return
        }
        for (const topic of signal.topics) {
          if (topic === 'ready') {
            setConnected(true)
            // After a reconnect signals may have been missed
            if (everReady) invalidate(queryClient, 'resync')
            everReady = true
          } else void invalidate(queryClient, topic)
        }
      }
      source.onerror = () => {
        setConnected(false)
        // CONNECTING: the browser retries by itself; CLOSED: it gave up, retry later
        if (source?.readyState === EventSource.CLOSED && !retry) {
          source.close()
          retry = setTimeout(open, RECONNECT_MS)
        }
      }
    }
    open()
    return () => {
      if (retry) clearTimeout(retry)
      source?.close()
      setConnected(false)
    }
  }, [queryClient])
  return null
}
