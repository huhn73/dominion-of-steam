import type { FastifyInstance } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import type { StartTutorialResponse } from '@dos/shared/lobby'
import type { TutorialService } from '../tutorial/service'
import { loadSession, requireAuth } from '../session'

export function tutorialRoutes(app: FastifyInstance, tutorial: TutorialService) {
  /** Continue the own tutorial or start it; `?neu=1` starts over */
  app.post<{ Querystring: { neu?: string } }>(
    `${API_PREFIX}/tutorial`,
    { preHandler: requireAuth },
    async (req): Promise<StartTutorialResponse> => {
      const { player } = (await loadSession(req))!
      return tutorial.start(player, req.query.neu === '1')
    },
  )

  /** „Später“: the lobby no longer offers the tutorial */
  app.post(`${API_PREFIX}/tutorial/dismiss`, { preHandler: requireAuth }, async (req) => {
    const { player } = (await loadSession(req))!
    await tutorial.dismiss(player.id)
    return { ok: true as const }
  })
}
