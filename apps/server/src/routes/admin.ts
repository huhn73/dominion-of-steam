import type { FastifyInstance } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import { DEFAULT_ADMIN_RANGE, isAdminRange, type AdminStats } from '@dos/shared/admin'
import type { ApiError } from '@dos/shared/game'
import type { AdminService } from '../admin/service'
import { requireAdmin } from '../session'

/** Usage overview, only for players listed in `ADMIN_EMAILS` */
export function adminRoutes(app: FastifyInstance, admin: AdminService) {
  app.get<{ Querystring: { range?: string } }>(
    `${API_PREFIX}/admin/stats`,
    { preHandler: requireAdmin },
    async (req, reply): Promise<AdminStats | void> => {
      const range = req.query.range === undefined ? DEFAULT_ADMIN_RANGE : Number(req.query.range)
      if (!isAdminRange(range))
        return reply.status(422).send({
          error: { code: 'INVALID_INPUT', message: 'Zeitraum: 7, 30 oder 90 Tage.' },
        } satisfies ApiError)
      reply.header('Cache-Control', 'no-store')
      return admin.stats(range)
    },
  )
}
