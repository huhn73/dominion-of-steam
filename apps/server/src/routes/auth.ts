import type { FastifyInstance, FastifyReply } from 'fastify'
import { API_PREFIX } from '@dos/shared'
import { validateEmail, validatePassword, validateRegistration } from '@dos/shared/account'
import { isLocale } from '@dos/shared/i18n'
import { requestLocale, sendError } from '../locale'
import { AccountError, type AccountService, toMe } from '../auth/accounts'
import {
  clearSessionCookie,
  currentPlayer,
  loadSession,
  notAuthenticated,
  requireAuth,
  setSessionCookie,
} from '../session'
import { requestOrigin } from './setup'

/** Per-IP limits (plugin registered in app.ts when enabled) */
const limit = (max: number, timeWindow: string) => ({ config: { rateLimit: { max, timeWindow } } })

function handleAccountError(err: unknown, reply: FastifyReply) {
  if (err instanceof AccountError) return sendError(reply, err.status, err.code, err.text)
  throw err
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const body = (v: unknown) =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}

/** Registration, login and logout, the logged-in player and their friends */
export function authRoutes(app: FastifyInstance, accounts: AccountService) {
  app.post(`${API_PREFIX}/auth/register`, limit(5, '1 hour'), async (req, reply) => {
    const b = body(req.body)
    const input = {
      displayName: str(b.displayName),
      email: str(b.email),
      password: str(b.password),
      locale: isLocale(b.locale) ? b.locale : requestLocale(req),
    }
    const errors = validateRegistration(input)
    const first = Object.values(errors)[0]
    if (first) return sendError(reply, 422, 'INVALID_INPUT', first)
    try {
      const player = await accounts.register(input)
      setSessionCookie(
        req,
        reply,
        await accounts.createSession(player.id, req.headers['user-agent']),
      )
      // Verification link; without a mailer the account simply stays unverified
      await accounts.sendVerificationMail(player, requestOrigin(req))
      return reply.status(201).send(toMe(player))
    } catch (err) {
      return handleAccountError(err, reply)
    }
  })

  app.post(`${API_PREFIX}/auth/login`, limit(20, '15 minutes'), async (req, reply) => {
    const b = body(req.body)
    const email = str(b.email)
    const password = str(b.password)
    if (validateEmail(email) || !password)
      return sendError(reply, 422, 'INVALID_INPUT', { key: 'errors.credentialsMissing' })
    try {
      const player = await accounts.login(email, password)
      setSessionCookie(
        req,
        reply,
        await accounts.createSession(player.id, req.headers['user-agent']),
      )
      return toMe(player)
    } catch (err) {
      return handleAccountError(err, reply)
    }
  })

  /** „Passwort vergessen“: always 200, so nobody learns whether an address is registered */
  app.post(`${API_PREFIX}/auth/forgot`, limit(5, '1 hour'), async (req, reply) => {
    const email = str(body(req.body).email)
    const invalid = validateEmail(email)
    if (invalid) return sendError(reply, 422, 'INVALID_INPUT', invalid)
    try {
      await accounts.requestPasswordReset(email, requestOrigin(req))
      return { ok: true }
    } catch (err) {
      return handleAccountError(err, reply)
    }
  })

  /** New password from the reset link; logs the player in on this device */
  app.post(`${API_PREFIX}/auth/reset`, limit(10, '1 hour'), async (req, reply) => {
    const b = body(req.body)
    const password = str(b.password)
    const invalid = validatePassword(password)
    if (invalid) return sendError(reply, 422, 'INVALID_INPUT', invalid)
    try {
      const player = await accounts.resetPassword(str(b.token), password, requestOrigin(req))
      setSessionCookie(
        req,
        reply,
        await accounts.createSession(player.id, req.headers['user-agent']),
      )
      return toMe(player)
    } catch (err) {
      return handleAccountError(err, reply)
    }
  })

  /** Ends the current session; succeeds without a session, too */
  app.post(`${API_PREFIX}/auth/logout`, async (req, reply) => {
    const info = await loadSession(req)
    if (info) await accounts.deleteSession(info.sessionId)
    clearSessionCookie(reply)
    return { ok: true }
  })

  /** Ends all sessions of the player (all devices) */
  app.post(`${API_PREFIX}/auth/logout-all`, { preHandler: requireAuth }, async (req, reply) => {
    await accounts.deleteAllSessions(await currentPlayer(req))
    clearSessionCookie(reply)
    return { ok: true }
  })

  app.get(`${API_PREFIX}/me`, async (req, reply) => {
    const info = await loadSession(req)
    if (!info) return notAuthenticated(reply)
    return toMe(info.player)
  })

  app.get(`${API_PREFIX}/friends`, { preHandler: requireAuth }, async (req) =>
    accounts.listFriends(await currentPlayer(req)),
  )

  app.post(`${API_PREFIX}/friends`, { preHandler: requireAuth }, async (req, reply) => {
    const name = str(body(req.body).name).trim()
    if (!name) return sendError(reply, 422, 'INVALID_INPUT', { key: 'errors.nameMissing' })
    try {
      return reply.status(201).send(await accounts.addFriendByName(await currentPlayer(req), name))
    } catch (err) {
      return handleAccountError(err, reply)
    }
  })
}
