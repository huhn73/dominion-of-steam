import { vi } from 'vitest'
import { projectView, seedDemo, type GameState } from '@dos/shared/engine'
import type { Me } from '@dos/shared/account'
import { DEFAULT_SETTINGS, type Settings, type SettingsData } from '@dos/shared/profile'
import { emptyLobby } from './lobbyData'

/** Logged-in player of the tests; the id is the demo participant p1 */
export const testUser: Me = {
  id: 'p1',
  name: 'Björn',
  avatarUrl: null,
  email: 'bjoern@dominion.test',
  emailVerified: true,
  isAdmin: false,
  // Without a seen version the hint „Neuigkeiten“ stays closed in all other tests
  newsSeenVersion: null,
  locale: 'de',
}

type Handler = (body: unknown) => { status?: number; json: unknown }

/** Stub `fetch` for /api calls. `GET /me` answers with the test user and `GET /lobby` with an
 * empty lobby unless given; other unhandled paths answer 404. */
export function mockApi(handlers: Record<string, Handler>) {
  handlers = {
    'GET /me': () => ({ json: testUser }),
    'GET /lobby': () => ({ json: emptyLobby() }),
    'GET /settings': () => ({ json: testSettings() }),
    ...handlers,
  }
  const calls: { method: string; path: string; body: unknown }[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input).replace(/^\/api/, '')
    const method = init?.method ?? 'GET'
    const body =
      init?.body instanceof FormData
        ? init.body
        : init?.body
          ? JSON.parse(String(init.body))
          : undefined
    calls.push({ method, path, body })
    const handler = handlers[`${method} ${path}`]
    const { status = 200, json } = handler
      ? handler(body)
      : {
          status: 404,
          json: { error: { code: 'MATCH_NOT_FOUND', message: 'Partie nicht gefunden.' } },
        }
    return new Response(JSON.stringify(json), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

/** Demo match state from the engine, p1 on the move */
export function demoState(phase: GameState['phase'] = 'yourTurn') {
  const state = seedDemo('demo', new Date('2026-10-30T12:00:00Z'))
  state.phase = phase
  state.turnDeadline = '2026-11-01T18:00:00Z'
  return state
}

export const demoView = (phase: GameState['phase'] = 'yourTurn') =>
  projectView(demoState(phase), 'p1')

/** Settings of the test user (defaults unless patched) */
export function testSettings(patch: (s: Settings) => void = () => undefined): SettingsData {
  const settings = structuredClone(DEFAULT_SETTINGS)
  patch(settings)
  return {
    settings,
    account: { email: testUser.email, emailVerified: true, activeSessions: 2 },
    displayName: testUser.name,
  }
}
