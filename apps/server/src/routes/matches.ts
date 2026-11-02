import type { FastifyInstance, FastifyReply } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import type { ApiError } from '@dos/shared/game'
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

function sendError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.status(status).send({ error: { code, message } } satisfies ApiError)
}

export function handleMatchError(err: unknown, reply: FastifyReply) {
  if (err instanceof NotAuthenticatedError) return notAuthenticated(reply)
  if (err instanceof MatchNotFoundError)
    return sendError(reply, 404, 'MATCH_NOT_FOUND', 'Partie nicht gefunden.')
  if (err instanceof MatchWaitingError)
    return sendError(reply, 409, 'MATCH_WAITING', 'Die Partie wartet noch auf Mitspieler.')
  if (err instanceof NotParticipantError)
    return sendError(reply, 403, 'NOT_PARTICIPANT', 'Du nimmst an dieser Partie nicht teil.')
  if (err instanceof SurrenderedError)
    return sendError(
      reply,
      409,
      'SURRENDERED',
      'Du hast diese Partie aufgegeben. Eine KI führt deine Fraktion weiter.',
    )
  if (err instanceof CommandError)
    return sendError(reply, CONFLICT_CODES.has(err.code) ? 409 : 422, err.code, err.message)
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
      if (!cmd) return sendError(reply, 400, 'BAD_COMMAND', 'Ungültiger Befehl.')
      try {
        return await service.execute(req.params.id, await currentPlayer(req), cmd)
      } catch (err) {
        return handleMatchError(err, reply)
      }
    },
  )
}
