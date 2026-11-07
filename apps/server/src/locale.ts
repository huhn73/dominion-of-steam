import type { FastifyRequest } from 'fastify'
import { isLocale, pickLocale, type Locale } from '@dos/shared/i18n'

/**
 * Language of a request: the logged-in player's choice if the session is loaded, else the
 * client's current language (header `X-Locale`, sent by the web app), else `Accept-Language`
 */
export function requestLocale(req: FastifyRequest): Locale {
  const own = req.session?.player.locale
  if (isLocale(own)) return own
  const header = req.headers['x-locale']
  if (isLocale(header)) return header
  return pickLocale(req.headers['accept-language'])
}
