import type { FastifyInstance } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import { DEMO_MATCH_ID, type MatchService } from '../matches/service'
import type { SetupService } from '../setup/service'
import { currentPlayer, loadSession, requireAuth } from '../session'
import { handleMatchError } from './matches'
import { handleSetupError } from './setup'

type SoloOptions = Parameters<SetupService['createSolo']>[1]

/** Helpers for development only (logged-in players): reset the demo, solo matches, pass turns */
export function devRoutes(app: FastifyInstance, service: MatchService, setup: SetupService) {
  app.post(`${API_PREFIX}/dev/demo/reset`, { preHandler: requireAuth }, async () => {
    await service.resetDemo()
    return { ok: true, matchId: DEMO_MATCH_ID }
  })

  app.post<{ Body: SoloOptions | undefined }>(
    `${API_PREFIX}/dev/matches/solo`,
    { preHandler: requireAuth },
    async (req, reply) => {
      const { player } = (await loadSession(req))!
      try {
        return await setup.createSolo(player, req.body ?? {})
      } catch (err) {
        return handleSetupError(err, reply)
      }
    },
  )

  app.post<{ Params: { id: string } }>(
    `${API_PREFIX}/dev/matches/:id/pass`,
    { preHandler: requireAuth },
    async (req, reply) => {
      try {
        return await service.passForOthers(req.params.id, await currentPlayer(req))
      } catch (err) {
        return handleMatchError(err, reply)
      }
    },
  )
}
