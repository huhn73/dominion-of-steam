import type { FastifyInstance, FastifyReply } from 'fastify'
import { sendError } from '../locale'
import { API_PREFIX } from '@dos/shared'
import { CommandError } from '@dos/shared/engine'
import { parseCommand } from '../matches/command'
import {
  MatchNotFoundError,
  type MatchService,
  MatchWaitingError,
  NotParticipantError,
  SurrenderedError,
} from '../matches/service'
import { currentPlayer, NotAuthenticatedError, notAuthenticated, requireAuth } from '../session'

const CONFLICT_CODES = new Set(['NOT_YOUR_TURN', 'REPLAY_ACTIVE', 'MATCH_FINISHED'])

export function handleMatchError(err: unknown, reply: FastifyReply) {
  if (err instanceof NotAuthenticatedError) return notAuthenticated(reply)
  if (err instanceof MatchNotFoundError)
    return sendError(reply, 404, 'MATCH_NOT_FOUND', { key: 'errors.matchNotFound' })
  if (err instanceof MatchWaitingError)
    return sendError(reply, 409, 'MATCH_WAITING', { key: 'errors.matchWaiting' })
  if (err instanceof NotParticipantError)
    return sendError(reply, 403, 'NOT_PARTICIPANT', { key: 'errors.notParticipant' })
  if (err instanceof SurrenderedError)
    return sendError(
      reply,
      409,
      'SURRENDERED',
      { key: 'errors.surrendered' },
    )
  if (err instanceof CommandError)
    return sendError(reply, CONFLICT_CODES.has(err.code) ? 409 : 422, err.code, err.text)
  throw err
}

export function matchRoutes(app: FastifyInstance, service: MatchService) {
  app.get<{ Params: { id: string } }>(
    `${API_PREFIX}/matches/:id/view`,
    { preHandler: requireAuth },
    async (req, reply) => {
      try {
        return await service.getView(req.params.id, await currentPlayer(req))
      } catch (err) {
        return handleMatchError(err, reply)
      }
    },
  )

  app.post<{ Params: { id: string } }>(
    `${API_PREFIX}/matches/:id/commands`,
    { preHandler: requireAuth },
    async (req, reply) => {
      const cmd = parseCommand(req.body)
      if (!cmd) return sendError(reply, 400, 'BAD_COMMAND', { key: 'errors.badCommand' })
      try {
        return await service.execute(req.params.id, await currentPlayer(req), cmd)
      } catch (err) {
        return handleMatchError(err, reply)
      }
    },
  )
}
