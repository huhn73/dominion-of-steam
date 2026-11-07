import { randomUUID } from 'node:crypto'
import { sendError } from '../locale'
import type { FastifyInstance } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { API_PREFIX } from '@dos/shared'
import type { PushKeyResponse, PushSubscriptionRequest } from '@dos/shared/notifications'
import type { Db } from '../db/client'
import { pushSubscriptions } from '../db/schema'
import { vapidKeys } from '../notifications/channels'
import { loadSession, requireAuth } from '../session'

const isString = (v: unknown, max = 2000): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max

/** Web push: public VAPID key and the browser subscriptions of the logged-in player */
export function pushRoutes(app: FastifyInstance, db: Db) {
  app.get(`${API_PREFIX}/push/key`, async (): Promise<PushKeyResponse> => {
    const { publicKey } = await vapidKeys(db)
    return { publicKey }
  })

  app.post<{ Body: Partial<PushSubscriptionRequest> | undefined }>(
    `${API_PREFIX}/push/subscribe`,
    { preHandler: requireAuth },
    async (req, reply) => {
      const { player } = (await loadSession(req))!
      const body = req.body ?? {}
      if (
        !isString(body.endpoint) ||
        !/^https:\/\//.test(body.endpoint) ||
        !isString(body.keys?.p256dh, 200) ||
        !isString(body.keys?.auth, 200)
      )
        return sendError(reply, 422, 'INVALID_INPUT', { key: 'errors.pushIncomplete' })
      const values = {
        playerId: player.id,
        p256dh: body.keys!.p256dh,
        auth: body.keys!.auth,
        userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      }
      // The same browser may switch accounts: the subscription follows the logged-in player
      await db
        .insert(pushSubscriptions)
        .values({ id: randomUUID(), endpoint: body.endpoint, ...values })
        .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: values })
      return reply.status(201).send({ ok: true })
    },
  )

  app.delete<{ Body: Partial<PushSubscriptionRequest> | undefined }>(
    `${API_PREFIX}/push/subscribe`,
    { preHandler: requireAuth },
    async (req) => {
      const { player } = (await loadSession(req))!
      const endpoint = req.body?.endpoint
      if (isString(endpoint))
        await db
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.endpoint, endpoint),
              eq(pushSubscriptions.playerId, player.id),
            ),
          )
      return { ok: true }
    },
  )
}
