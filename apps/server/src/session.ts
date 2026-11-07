import type { FastifyReply, FastifyRequest } from 'fastify'
import { sendError } from './locale'
import { API_PREFIX } from '@dos/shared'
import type { SessionInfo } from './auth/accounts'
import { isAdminEmail } from './admin/access'

export const SESSION_COOKIE = 'dos_session'
const SESSION_MAX_AGE_S = 30 * 24 * 3600

export class NotAuthenticatedError extends Error {}

/**
 * `secure` only over https: direct, or behind a reverse proxy with `trustProxy` (the local
 * Docker setup runs on plain http)
 */
export function setSessionCookie(req: FastifyRequest, reply: FastifyReply, token: string) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
    secure: req.protocol === 'https',
  })
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

// Presence "inGame": view and commands of a running match (not the waiting room)
const matchPath = new RegExp(`^${API_PREFIX}/matches/([^/?]+)/(?:view|commands)`)

/** Session of the request (loaded once per request and cached); records activity */
export async function loadSession(req: FastifyRequest): Promise<SessionInfo | null> {
  if (req.session !== undefined) return req.session
  const token = req.cookies[SESSION_COOKIE]
  const info = token ? await req.server.accounts.findSession(token) : null
  req.session = info
  if (info) {
    const matchId = matchPath.exec(req.url)?.[1] ?? null
    const renewed = await req.server.accounts.touch(info, matchId && decodeURIComponent(matchId))
    // Sliding expiry: renew the cookie when the session was renewed
    if (renewed && token) req.renewSessionToken = token
  }
  return info
}

/** ID of the logged-in player; throws NotAuthenticatedError without a valid session */
export async function currentPlayer(req: FastifyRequest): Promise<string> {
  const info = await loadSession(req)
  if (!info) throw new NotAuthenticatedError()
  return info.player.id
}

export const notAuthenticated = (reply: FastifyReply) =>
  sendError(reply, 401, 'NOT_AUTHENTICATED', { key: 'errors.notAuthenticated' })

/** preHandler for routes that need a logged-in player */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!(await loadSession(req))) return notAuthenticated(reply)
}

/** preHandler for admin routes: 401 without session, 403 for players not in `ADMIN_EMAILS` */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const info = await loadSession(req)
  if (!info) return notAuthenticated(reply)
  if (!isAdminEmail(info.player.email))
    return sendError(reply, 403, 'FORBIDDEN', { key: 'errors.forbidden' })
}

declare module 'fastify' {
  interface FastifyRequest {
    /** undefined until loaded, null without a valid session */
    session?: SessionInfo | null
    renewSessionToken?: string
  }
}
