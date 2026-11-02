import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCompress from '@fastify/compress'
import { mkdirSync, readFileSync } from 'node:fs'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyRateLimit from '@fastify/rate-limit'
import { API_PREFIX } from '@dos/shared'
import {
  COMPENDIUM_FACTIONS,
  COMPENDIUM_UNIT_TYPES,
  type CompendiumData,
} from '@dos/shared/compendium'
import type { Db } from './db/client'
import { createAccountService } from './auth/accounts'
import { deleteExpiredTokens } from './auth/tokens'
import type { ApiError } from '@dos/shared/game'
import { ensureDevAccounts } from './auth/devAccounts'
import { createMatchService } from './matches/service'
import { createSetupService } from './setup/service'
import { createLobbyService } from './lobby/service'
import { createSweeper } from './lobby/sweeper'
import { type Mailer, type PushSender, smtpMailer, webPushSender } from './notifications/channels'
import { createNotifier } from './notifications/service'
import { lobbyRoutes } from './routes/lobby'
import { profileRoutes } from './routes/profile'
import { createProfileService, defaultUploadsDir } from './profile/service'
import { AVATAR_MAX_BYTES } from '@dos/shared/profile'
import { pushRoutes } from './routes/push'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { createAdminService } from './admin/service'
import { devRoutes } from './routes/dev'
import { matchRoutes } from './routes/matches'
import { requestOrigin, setupRoutes } from './routes/setup'
import { loadSession, SESSION_COOKIE, setSessionCookie } from './session'

/** Version from the root package.json, shown with „-dev“ when the image build set none */
const packageVersion = (
  JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {
    version: string
  }
).version

export interface AppOptions {
  db: Db
  dev?: boolean
  logger?: boolean
  /**
   * Trust `X-Forwarded-*` headers of a reverse proxy (Caddy in production), so `req.protocol`
   * is `https` and the session cookie gets `Secure`; default `TRUST_PROXY=true`
   */
  trustProxy?: boolean
  /**
   * Per-IP limits on login, registration and account routes (in-memory, one instance);
   * default: on outside tests
   */
  rateLimit?: boolean
  /** Folder with the built web app; served with SPA fallback when set */
  staticDir?: string
  /** Channels for notifications; default: web push and SMTP_URL (tests pass stubs) */
  notifications?: { push?: PushSender | null; mail?: Mailer | null; autoDeliver?: boolean }
  /** Folder for uploads (avatars); default `UPLOADS_DIR` or `apps/server/uploads` */
  uploadsDir?: string
}

/** Dev endpoints are on outside production, or when DEV_TOOLS=true (e.g. in the Docker setup) */
export const devToolsEnabled = () =>
  process.env.NODE_ENV !== 'production' || process.env.DEV_TOOLS === 'true'

export function buildApp({
  db,
  dev = devToolsEnabled(),
  logger = false,
  trustProxy = process.env.TRUST_PROXY === 'true',
  rateLimit = process.env.NODE_ENV !== 'test',
  staticDir,
  notifications = {},
  uploadsDir = defaultUploadsDir(),
}: AppOptions) {
  const app = Fastify({ logger, trustProxy })
  // Views of big maps are ~100 KB of tile strings; compression cuts that by about 90 %
  app.register(fastifyCompress, { threshold: 2048, encodings: ['br', 'gzip'] })
  app.register(fastifyCookie)
  app.register(fastifyMultipart, { limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 5 } })
  // Origin for links in e-mails sent outside a request: PUBLIC_URL, else the latest request
  let lastOrigin: string | null = null
  const mail = 'mail' in notifications ? (notifications.mail ?? null) : smtpMailer()
  const notifier = createNotifier(db, {
    push: 'push' in notifications ? notifications.push : webPushSender(db),
    mail,
    autoDeliver: notifications.autoDeliver ?? process.env.NODE_ENV !== 'test',
    publicUrl: () =>
      process.env.PUBLIC_URL?.replace(/\/$/, '') ?? lastOrigin ?? 'http://localhost:3000',
    log: (msg, err) => app.log.error({ err }, msg),
  })
  const log = (msg: string, err: unknown) => app.log.error({ err }, msg)
  const accounts = createAccountService(db, { mail, log })
  const matches = createMatchService(db, {
    notifier,
    // Demo match: Björn and Lena are the dev accounts
    demoMapping: dev
      ? async () => {
          const { bjoernId, lenaId } = await ensureDevAccounts(accounts)
          return { p1: bjoernId, p3: lenaId }
        }
      : undefined,
  })
  const setup = createSetupService(db, accounts, notifier)
  const lobby = createLobbyService(db, { notifier })
  const sweeper = createSweeper(db, notifier, {
    housekeeping: async (now) => {
      await accounts.deleteExpiredSessions(now)
      await deleteExpiredTokens(db, now)
    },
  })
  const profile = createProfileService(db, { lobby, mail, uploadsDir, log })
  const admin = createAdminService(db)
  app.decorate('accounts', accounts)
  app.decorate('matches', matches)
  app.decorate('setup', setup)
  app.decorate('lobby', lobby)
  app.decorate('notifier', notifier)
  app.decorate('sweeper', sweeper)
  app.decorate('profile', profile)
  // Load the session of API requests early (records activity) and renew the cookie when the
  // session was used again (sliding expiry); routes set or clear the cookie afterwards
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith(API_PREFIX)) return
    lastOrigin = requestOrigin(req)
    if (!req.cookies[SESSION_COOKIE]) return
    await loadSession(req)
    if (req.renewSessionToken) setSessionCookie(req, reply, req.renewSessionToken)
  })

  // Version and commit of the running image (Dockerfile, deploy workflow): check what is deployed
  app.get(`${API_PREFIX}/health`, async () => ({
    ok: true,
    version: process.env.APP_VERSION || `${packageVersion}-dev`,
    commit: process.env.APP_COMMIT || null,
  }))
  app.get(`${API_PREFIX}/compendium`, async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=300')
    return {
      factions: COMPENDIUM_FACTIONS,
      unitTypes: COMPENDIUM_UNIT_TYPES,
    } satisfies CompendiumData
  })
  // Routes in one scope behind the rate limiter, whose onRoute hook must see them being added
  app.register(async (scope) => {
    if (rateLimit) {
      await scope.register(fastifyRateLimit, {
        // Only routes with `config.rateLimit` are limited
        global: false,
        errorResponseBuilder: (_req, context) => {
          const minutes = Math.max(1, Math.ceil(context.ttl / 60_000))
          const err = new Error(
            `Zu viele Versuche. Bitte warte ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}.`,
          ) as Error & { statusCode: number; code: string }
          err.statusCode = context.statusCode
          err.code = 'RATE_LIMITED'
          return err
        },
      })
      // The plugin throws the error above; answer in the shape of `ApiError`
      scope.setErrorHandler((err: Error & { statusCode?: number; code?: string }, _req, reply) => {
        if (err.code === 'RATE_LIMITED')
          return reply
            .status(err.statusCode ?? 429)
            .send({ error: { code: err.code, message: err.message } } satisfies ApiError)
        throw err
      })
    }
    authRoutes(scope, accounts)
    matchRoutes(scope, matches)
    setupRoutes(scope, setup)
    lobbyRoutes(scope, lobby)
    pushRoutes(scope, db)
    profileRoutes(scope, profile)
    adminRoutes(scope, admin)
    if (dev) devRoutes(scope, matches, setup)
  })
  // Uploaded avatars; every upload gets a new file name, so they can be cached for good
  mkdirSync(profile.avatarDir, { recursive: true })
  app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    index: false,
    setHeaders: (res) => {
      res.header('Cache-Control', 'public, max-age=31536000, immutable')
      res.header('X-Content-Type-Options', 'nosniff')
    },
  })
  if (staticDir) {
    app.register(fastifyStatic, { root: staticDir, wildcard: false })
    app.setNotFoundHandler((req, reply) => {
      if (
        req.method === 'GET' &&
        !req.url.startsWith(API_PREFIX) &&
        !req.url.startsWith('/uploads/')
      )
        return reply.sendFile('index.html')
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Nicht gefunden.' } })
    })
  }
  return app
}

declare module 'fastify' {
  interface FastifyInstance {
    accounts: ReturnType<typeof createAccountService>
    matches: ReturnType<typeof createMatchService>
    setup: ReturnType<typeof createSetupService>
    lobby: ReturnType<typeof createLobbyService>
    notifier: ReturnType<typeof createNotifier>
    sweeper: ReturnType<typeof createSweeper>
    profile: ReturnType<typeof createProfileService>
  }
}
