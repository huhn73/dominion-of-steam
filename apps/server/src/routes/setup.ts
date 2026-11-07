import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import type { CreateMatchRequest, CreateMatchResponse } from '@dos/shared/setup'
import { type SetupService, SetupError } from '../setup/service'
import { sendError } from '../locale'
import { loadSession, requireAuth } from '../session'

/**
 * Origin for links shown to players: PUBLIC_URL if set, else from the request (the Vite dev
 * proxy keeps the browser's Host header; a TLS proxy should send X-Forwarded-Proto/-Host).
 */
export function requestOrigin(req: FastifyRequest) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '')
  const first = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim()
  const proto = first(req.headers['x-forwarded-proto']) ?? req.protocol
  const host = first(req.headers['x-forwarded-host']) ?? req.headers.host ?? 'localhost'
  return `${proto}://${host}`
}

export function handleSetupError(err: unknown, reply: FastifyReply) {
  if (err instanceof SetupError) return sendError(reply, err.status, err.code, err.text)
  throw err
}

export function setupRoutes(app: FastifyInstance, setup: SetupService) {
  app.get(`${API_PREFIX}/setup`, { preHandler: requireAuth }, async (req) => {
    const { player } = (await loadSession(req))!
    return setup.getSetup(player, requestOrigin(req))
  })

  app.post<{ Body: Partial<CreateMatchRequest> | undefined }>(
    `${API_PREFIX}/matches`,
    { preHandler: requireAuth },
    async (req, reply): Promise<CreateMatchResponse | FastifyReply> => {
      const { player } = (await loadSession(req))!
      const body = req.body ?? {}
      if (typeof body.reservationId !== 'string')
        return handleSetupError(
          new SetupError('INVALID_SETUP', { key: 'errors.setupIncomplete' }),
          reply,
        )
      try {
        const created = await setup.createFromDraft(player, body.draft, {
          reservationId: body.reservationId,
        })
        return reply.status(201).send(created)
      } catch (err) {
        return handleSetupError(err, reply)
      }
    },
  )
}
