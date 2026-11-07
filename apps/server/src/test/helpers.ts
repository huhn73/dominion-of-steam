import type { FastifyInstance } from 'fastify'
import { DEV_PASSWORD } from '../auth/devAccounts'
import { SESSION_COOKIE } from '../session'

export const BJOERN = 'bjoern@dominion.test'
export const LENA = 'lena@dominion.test'

/** Session token from the Set-Cookie header of a response */
export function sessionToken(res: { cookies: { name: string; value: string }[] }) {
  return res.cookies.find((c) => c.name === SESSION_COOKIE)?.value
}

/** Log in and return a function that sends requests with the session cookie */
export async function loginAs(app: FastifyInstance, email = BJOERN, password = DEV_PASSWORD) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  })
  if (res.statusCode !== 200) throw new Error(`Anmeldung fehlgeschlagen: ${res.body}`)
  const token = sessionToken(res)!
  const me = res.json<{ id: string; name: string }>()
  const request = (method: 'GET' | 'POST' | 'DELETE', url: string, payload?: object) =>
    app.inject({ method, url, payload, cookies: { [SESSION_COOKIE]: token } })
  return { token, me, request }
}
