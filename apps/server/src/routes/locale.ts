import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { API_PREFIX } from '@dos/shared'
import type { ApiError } from '@dos/shared/game'
import { isLocale } from '@dos/shared/i18n'
import type { Db } from '../db/client'
import { players } from '../db/schema'
import { toMe } from '../auth/accounts'
import { loadSession, requireAuth } from '../session'

export function localeRoutes(app: FastifyInstance, db: Db) {
  /** The player chose a language (settings, login card): answers like `GET /api/me` */
  app.put<{ Body: { locale?: unknown } }>(
    `${API_PREFIX}/locale`,
    { preHandler: requireAuth },
    async (req, reply) => {
      const { player } = (await loadSession(req))!
      const locale = req.body?.locale
      if (!isLocale(locale))
        return reply.status(422).send({
          error: { code: 'INVALID_INPUT', message: 'Unknown language.' },
        } satisfies ApiError)
      const [updated] = await db
        .update(players)
        .set({ locale })
        .where(eq(players.id, player.id))
        .returning()
      return toMe(updated!)
    },
  )
}
