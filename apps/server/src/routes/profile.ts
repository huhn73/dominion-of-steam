import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import type { ApiError } from '@dos/shared/game'
import { AVATAR_MAX_BYTES, validateSettings } from '@dos/shared/profile'
import { AccountError, toMe } from '../auth/accounts'
import { LobbyError } from '../lobby/service'
import { ProfileError, type ProfileService } from '../profile/service'
import { clearSessionCookie, loadSession, requireAuth } from '../session'
import { requestOrigin } from './setup'

/** Per-IP limits of the account routes (plugin registered in app.ts when enabled) */
const limit = (max: number, timeWindow = '1 hour') => ({ rateLimit: { max, timeWindow } })

const sendError = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.status(status).send({ error: { code, message } } satisfies ApiError)

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const body = (v: unknown) =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}

/**
 * Crop from the multipart fields `cropX`, `cropY`, `cropSize` (sent before the file): undefined
 * without any of them, null if they are incomplete or not numbers
 */
function cropFields(fields: Record<string, unknown>) {
  const value = (name: string) => {
    const f = fields[name] as { value?: unknown } | { value?: unknown }[] | undefined
    const v = Array.isArray(f) ? f[0]?.value : f?.value
    return typeof v === 'string' && v.trim() !== '' ? Number(v) : undefined
  }
  const [x, y, size] = [value('cropX'), value('cropY'), value('cropSize')]
  if (x === undefined && y === undefined && size === undefined) return undefined
  if (![x, y, size].every((n) => n !== undefined && Number.isFinite(n))) return null
  return { x: x!, y: y!, size: size! }
}

const AVATAR_TOO_LARGE = `Das Bild ist zu groß (höchstens ${AVATAR_MAX_BYTES / 1024 / 1024} MB).`

/** Profile, settings and account management of the logged-in player */
export function profileRoutes(app: FastifyInstance, profile: ProfileService) {
  const session = async (req: FastifyRequest) => (await loadSession(req))!
  const run =
    (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        return await fn(req, reply)
      } catch (err) {
        if (err instanceof ProfileError || err instanceof LobbyError)
          return sendError(reply, err.status, err.code, err.message)
        throw err
      }
    }
  const auth = { preHandler: requireAuth }

  // ---------------------------------------------------------------------------
  // Profil
  // ---------------------------------------------------------------------------

  app.get(
    `${API_PREFIX}/profile`,
    auth,
    run(async (req, reply) => {
      const q = req.query as { limit?: string; cursor?: string }
      reply.header('Cache-Control', 'no-store')
      return profile.getProfile((await session(req)).player.id, {
        limit: q.limit ? Number(q.limit) : undefined,
        cursor: q.cursor || null,
      })
    }),
  )

  /** Change the display name; answers like `GET /api/me` */
  app.patch(
    `${API_PREFIX}/profile`,
    auth,
    run(async (req) => {
      const { player } = await session(req)
      return toMe(await profile.updateDisplayName(player.id, str(body(req.body).displayName)))
    }),
  )

  /**
   * Upload an avatar (multipart, field name arbitrary, one file, optionally the crop fields
   * before it); answers like `GET /api/me`
   */
  app.post(
    `${API_PREFIX}/profile/avatar`,
    auth,
    run(async (req, reply) => {
      const { player } = await session(req)
      let data: Buffer
      let crop: ReturnType<typeof cropFields>
      try {
        const file = await req.file()
        if (!file) return sendError(reply, 422, 'INVALID_INPUT', 'Bitte wähle ein Bild aus.')
        crop = cropFields(file.fields)
        data = await file.toBuffer()
      } catch (err) {
        const code = (err as { code?: string }).code
        if (code === 'FST_REQ_FILE_TOO_LARGE')
          return sendError(reply, 413, 'IMAGE_TOO_LARGE', AVATAR_TOO_LARGE)
        if (code === 'FST_INVALID_MULTIPART_CONTENT_TYPE')
          return sendError(reply, 422, 'INVALID_INPUT', 'Bitte wähle ein Bild aus.')
        throw err
      }
      if (data.length === 0)
        return sendError(reply, 422, 'INVALID_INPUT', 'Bitte wähle ein Bild aus.')
      if (crop === null)
        return sendError(reply, 422, 'INVALID_CROP', 'Der Bildausschnitt passt nicht zum Bild.')
      return toMe(await profile.setAvatar(player.id, data, crop))
    }),
  )

  app.delete(
    `${API_PREFIX}/profile/avatar`,
    auth,
    run(async (req) => toMe(await profile.removeAvatar((await session(req)).player.id))),
  )

  // ---------------------------------------------------------------------------
  // Einstellungen
  // ---------------------------------------------------------------------------

  app.get(
    `${API_PREFIX}/settings`,
    auth,
    run(async (req, reply) => {
      reply.header('Cache-Control', 'no-store')
      return profile.getSettings((await session(req)).player.id)
    }),
  )

  app.put(
    `${API_PREFIX}/settings`,
    auth,
    run(async (req, reply) => {
      const result = validateSettings(req.body)
      if ('error' in result) return sendError(reply, 422, 'INVALID_SETTINGS', result.error)
      return profile.saveSettings((await session(req)).player.id, result.settings)
    }),
  )

  // ---------------------------------------------------------------------------
  // Konto
  // ---------------------------------------------------------------------------

  /** Link from the welcome e-mail; works without login and redirects to the settings */
  app.get(`${API_PREFIX}/account/verify`, async (req, reply) => {
    const token = str((req.query as { token?: unknown }).token)
    const ok = await app.accounts.verifyEmail(token)
    return reply.redirect(`/einstellungen?email=${ok ? 'verifiziert' : 'ungueltig'}`, 303)
  })

  /** „Erneut senden“ for the verification e-mail */
  app.post(
    `${API_PREFIX}/account/verify/resend`,
    { ...auth, config: limit(5) },
    run(async (req, reply) => {
      try {
        return await app.accounts.resendVerification(
          (await session(req)).player.id,
          requestOrigin(req),
        )
      } catch (err) {
        if (err instanceof AccountError) return sendError(reply, err.status, err.code, err.message)
        throw err
      }
    }),
  )

  app.post(
    `${API_PREFIX}/account/email`,
    { ...auth, config: limit(10) },
    run(async (req) => {
      const b = body(req.body)
      return profile.requestEmailChange(
        (await session(req)).player.id,
        { email: str(b.email), currentPassword: str(b.currentPassword) },
        requestOrigin(req),
      )
    }),
  )

  /** Link from the confirmation e-mail; works without login and redirects to the settings */
  app.get(`${API_PREFIX}/account/email/confirm`, async (req, reply) => {
    const token = str((req.query as { token?: unknown }).token)
    const result = await profile.confirmEmailChange(token, requestOrigin(req))
    const value = { confirmed: 'bestaetigt', invalid: 'ungueltig', taken: 'vergeben' }[result]
    return reply.redirect(`/einstellungen?email=${value}`, 303)
  })

  app.post(
    `${API_PREFIX}/account/password`,
    { ...auth, config: limit(10) },
    run(async (req) => {
      const b = body(req.body)
      const { player, sessionId } = await session(req)
      return profile.changePassword(
        player.id,
        sessionId,
        { currentPassword: str(b.currentPassword), newPassword: str(b.newPassword) },
        requestOrigin(req),
      )
    }),
  )

  /** Needs the current password in the body */
  app.delete(
    `${API_PREFIX}/account`,
    { ...auth, config: limit(5) },
    run(async (req, reply) => {
      const { player } = await session(req)
      const result = await profile.deleteAccount(player.id, str(body(req.body).currentPassword))
      clearSessionCookie(reply)
      return result
    }),
  )
}
