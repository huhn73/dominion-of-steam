import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ApiError } from '@dos/shared/game'
import { isLocale, pickLocale, translateMessage, type Locale, type Message } from '@dos/shared/i18n'

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

/** A text for the player: a key with parameters, or (not yet translated) a German sentence */
export type Text = string | Message

export const localize = (locale: Locale, text: Text) =>
  typeof text === 'string' ? text : translateMessage(locale, text)

/**
 * Error with a text for the player; `message` is the German text for logs, the answer is
 * translated into the language of the request (`sendError`)
 */
export class LocalizedError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly text: Text,
  ) {
    super(localize('de', text))
  }
}

/** Error answer `{ error: { code, message } }` in the language of the request */
export function sendError(reply: FastifyReply, status: number, code: string, text: Text) {
  return reply.status(status).send({
    error: { code, message: localize(requestLocale(reply.request), text) },
  } satisfies ApiError)
}
