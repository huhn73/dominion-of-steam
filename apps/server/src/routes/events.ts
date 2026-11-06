import type { FastifyInstance } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import type { ServerSignal } from '@dos/shared/realtime'
import type { Hub } from '../realtime/hub'
import { loadSession, requireAuth, SESSION_COOKIE } from '../session'

/** Comment line against proxy timeouts; also when an ended session closes the stream */
export const HEARTBEAT_MS = 25_000

/**
 * Server-sent events: signals that lobby, waiting room or match changed. The data itself comes
 * from the usual endpoints (the client invalidates its queries), so the fog of war stays in
 * `projectView`.
 */
export function eventRoutes(app: FastifyInstance, hub: Hub, { heartbeatMs = HEARTBEAT_MS } = {}) {
  app.get(`${API_PREFIX}/events`, { preHandler: requireAuth }, async (req, reply) => {
    const session = (await loadSession(req))!
    const token = req.cookies[SESSION_COOKIE]!
    // The stream bypasses Fastify's reply (and thereby compression, which would buffer it)
    reply.hijack()
    const res = reply.raw
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    let open = true
    const send = (signal: ServerSignal) => {
      if (open) res.write(`data: ${JSON.stringify(signal)}\n\n`)
    }
    const unsubscribe = await hub.subscribe(session.player.id, send)
    // The client waits for this before it relies on the stream (LISTEN is active now)
    res.write('retry: 5000\n')
    send({ topics: ['ready'] })

    const heartbeat = setInterval(() => {
      void req.server.accounts
        .findSession(token)
        .then((still) => {
          if (!still) res.end()
          else if (open) res.write(': ping\n\n')
        })
        .catch(() => res.end())
    }, heartbeatMs)
    const cleanup = () => {
      open = false
      clearInterval(heartbeat)
      unsubscribe()
    }
    res.on('close', cleanup)
  })
}
