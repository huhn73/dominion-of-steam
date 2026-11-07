import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import type { ReadyRequest, StartMatchRequest } from '@dos/shared/lobby'
import { LobbyError, type LobbyService } from '../lobby/service'
import { SetupError } from '../setup/service'
import { loadSession, requireAuth } from '../session'
import { handleSetupError, requestOrigin } from './setup'
import { sendError, type Text } from '../locale'

function handleLobbyError(err: unknown, reply: FastifyReply) {
  if (err instanceof LobbyError) return sendError(reply, err.status, err.code, err.text)
  if (err instanceof SetupError) return handleSetupError(err, reply)
  throw err
}

const badRequest = (reply: FastifyReply, message: Text) =>
  sendError(reply, 422, 'INVALID_INPUT', message)

const id = (req: FastifyRequest) => (req.params as { id: string }).id

/** Lobby, waiting room and multiplayer actions; all need a logged-in player */
export function lobbyRoutes(app: FastifyInstance, lobby: LobbyService) {
  const player = async (req: FastifyRequest) => (await loadSession(req))!.player
  /** Route handler with error mapping */
  const run =
    (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        return await fn(req, reply)
      } catch (err) {
        return handleLobbyError(err, reply)
      }
    }
  const auth = { preHandler: requireAuth }

  app.get(
    `${API_PREFIX}/lobby`,
    auth,
    run(async (req, reply) => {
      reply.header('Cache-Control', 'no-store')
      return lobby.getLobby(await player(req))
    }),
  )

  app.get(
    `${API_PREFIX}/matches/:id/room`,
    auth,
    run(async (req) => lobby.room(id(req), (await player(req)).id, requestOrigin(req))),
  )

  app.post(
    `${API_PREFIX}/matches/:id/remind`,
    auth,
    run(async (req) =>
      lobby.remind(
        id(req),
        await player(req),
        (req.body as { participantId?: unknown } | undefined)?.participantId,
      ),
    ),
  )

  app.post(
    `${API_PREFIX}/matches/:id/surrender`,
    auth,
    run(async (req) => lobby.surrender(id(req), (await player(req)).id)),
  )

  app.post(
    `${API_PREFIX}/invitations/:id/accept`,
    auth,
    run(async (req) => lobby.acceptInvitation(id(req), (await player(req)).id)),
  )

  app.post(
    `${API_PREFIX}/invitations/:id/decline`,
    auth,
    run(async (req) => lobby.declineInvitation(id(req), (await player(req)).id)),
  )

  app.post(
    `${API_PREFIX}/matches/:id/join`,
    auth,
    run(async (req) => lobby.joinOpen(id(req), (await player(req)).id)),
  )

  app.post(
    `${API_PREFIX}/invite/:token`,
    auth,
    run(async (req) =>
      lobby.claimInvite((req.params as { token: string }).token, (await player(req)).id),
    ),
  )

  app.post(
    `${API_PREFIX}/matches/:id/ready`,
    auth,
    run(async (req, reply) => {
      const body = req.body as Partial<ReadyRequest> | undefined
      if (typeof body?.ready !== 'boolean') return badRequest(reply, { key: 'errors.readyMissing' })
      return lobby.setReady(id(req), (await player(req)).id, body.ready)
    }),
  )

  app.post(
    `${API_PREFIX}/matches/:id/start`,
    auth,
    run(async (req, reply) => {
      const body = req.body as Partial<StartMatchRequest> | undefined
      if (typeof body?.fillEmptyWithAI !== 'boolean')
        return badRequest(reply, { key: 'errors.fillMissing' })
      return lobby.start(id(req), (await player(req)).id, body.fillEmptyWithAI)
    }),
  )

  app.post(
    `${API_PREFIX}/matches/:id/leave`,
    auth,
    run(async (req) => lobby.leave(id(req), await player(req))),
  )
}
