import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { API_PREFIX } from '@dos/shared'
import { compareVersions, isKnownVersion } from '@dos/shared/news'
import type { Db } from '../db/client'
import { players } from '../db/schema'
import { toMe } from '../auth/accounts'
import { loadSession, requireAuth } from '../session'

export function newsRoutes(app: FastifyInstance, db: Db) {
  /**
   * The player closed the hint „Neuigkeiten“: remember the newest version shown. Only moves
   * forward, so an older tab cannot bring old news back. Answers like `GET /api/me`.
   */
  app.post<{ Body: { version?: unknown } }>(
    `${API_PREFIX}/news/seen`,
    { preHandler: requireAuth },
    async (req, reply) => {
      const { player } = (await loadSession(req))!
      const version = typeof req.body?.version === 'string' ? req.body.version : ''
      if (!isKnownVersion(version))
        return reply.status(422).send({
          error: { code: 'INVALID_INPUT', message: 'Unbekannte Version.' },
        })
      if (player.newsSeenVersion && compareVersions(version, player.newsSeenVersion) <= 0)
        return toMe(player)
      const [updated] = await db
        .update(players)
        .set({ newsSeenVersion: version })
        .where(eq(players.id, player.id))
        .returning()
      return toMe(updated!)
    },
  )
}
