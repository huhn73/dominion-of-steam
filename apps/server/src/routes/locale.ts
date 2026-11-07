import type { FastifyInstance } from 'fastify'
import { sendError } from '../locale'
import { eq } from 'drizzle-orm'
import { API_PREFIX } from '@dos/shared'
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
        return sendError(reply, 422, 'INVALID_INPUT', { key: 'errors.unknownLanguage' })
      const [updated] = await db
        .update(players)
        .set({ locale })
        .where(eq(players.id, player.id))
        .returning()
      return toMe(updated!)
    },
  )
}
