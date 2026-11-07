import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import { FriendsError, type FriendsService } from '../friends/service'
import { sendError } from '../locale'
import { loadSession, requireAuth } from '../session'

/** Friends and friend requests of the logged-in player; every answer is the new `FriendsData` */
export function friendsRoutes(app: FastifyInstance, friends: FriendsService) {
  const auth = { preHandler: requireAuth }
  const me = async (req: FastifyRequest) => (await loadSession(req))!.player.id
  const id = (req: FastifyRequest) => (req.params as { id: string }).id
  const run =
    (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        return await fn(req, reply)
      } catch (err) {
        if (err instanceof FriendsError) return sendError(reply, err.status, err.code, err.text)
        throw err
      }
    }

  app.get(
    `${API_PREFIX}/friends`,
    auth,
    run(async (req, reply) => {
      reply.header('Cache-Control', 'no-store')
      return friends.list(await me(req))
    }),
  )

  app.post(
    `${API_PREFIX}/friends/requests`,
    auth,
    run(async (req, reply) => {
      const b = (req.body ?? {}) as { playerId?: unknown; name?: unknown }
      const playerId = typeof b.playerId === 'string' ? b.playerId : ''
      const name = typeof b.name === 'string' ? b.name.trim() : ''
      if (!playerId && !name)
        return sendError(reply, 422, 'INVALID_INPUT', { key: 'errors.nameMissing' })
      const data = await friends.request(await me(req), playerId ? { playerId } : { name })
      return reply.status(201).send(data)
    }),
  )

  app.post(
    `${API_PREFIX}/friends/requests/:id/accept`,
    auth,
    run(async (req) => friends.accept(await me(req), id(req))),
  )

  app.post(
    `${API_PREFIX}/friends/requests/:id/decline`,
    auth,
    run(async (req) => friends.dropRequest(await me(req), id(req), 'incoming')),
  )

  /** Withdraw an own request to player `:id` */
  app.delete(
    `${API_PREFIX}/friends/requests/:id`,
    auth,
    run(async (req) => friends.dropRequest(await me(req), id(req), 'outgoing')),
  )

  app.delete(
    `${API_PREFIX}/friends/:id`,
    auth,
    run(async (req) => friends.remove(await me(req), id(req))),
  )
}
