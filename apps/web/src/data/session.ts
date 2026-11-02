import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { LoginRequest, Me, RegisterRequest } from '@dos/shared/account'
import type { ShellUser } from '../shell'
import { api, ApiRequestError } from './api'
import { unsubscribePush } from './push'
import { routes } from '../routes'

export const meKey = ['me'] as const

/** Logged-in player; `null` when not logged in, `undefined` while loading */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await api<Me>('/me')
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useCurrentUser(): ShellUser | undefined {
  const { data } = useMe()
  return data
    ? { name: data.name, avatarUrl: data.avatarUrl ?? undefined, isAdmin: data.isAdmin }
    : undefined
}

/** Anzahl der Partien, in denen der Spieler am Zug ist (aus den Lobby-Daten) */
export { useYourTurnCount } from './lobby'

/** Log in or register; afterwards only the new player's data is in the cache */
export function useAuthActions() {
  const queryClient = useQueryClient()
  const signedIn = (me: Me) => {
    queryClient.clear()
    queryClient.setQueryData(meKey, me)
    return me
  }
  return {
    login: (body: LoginRequest) => api<Me>('/auth/login', { method: 'POST', body }).then(signedIn),
    register: (body: RegisterRequest) =>
      api<Me>('/auth/register', { method: 'POST', body }).then(signedIn),
    /** Sends a reset link when the address belongs to a player (the answer does not tell) */
    forgotPassword: (email: string) =>
      api<{ ok: true }>('/auth/forgot', { method: 'POST', body: { email } }),
    /** New password from the reset link; logs in on this device */
    resetPassword: (token: string, password: string) =>
      api<Me>('/auth/reset', { method: 'POST', body: { token, password } }).then(signedIn),
  }
}

/**
 * End the session(s) with `end` and go to the login page; afterwards nothing of the player is
 * left in the cache. With `ignoreErrors` the player counts as logged out here even when the
 * server does not answer (logout); otherwise an error is thrown and the player stays.
 */
export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return async (
    end: () => Promise<unknown>,
    { ignoreErrors = false, notice }: { ignoreErrors?: boolean; notice?: string } = {},
  ) => {
    if (ignoreErrors) await end().catch(() => undefined)
    else await end()
    await navigate(routes.login, { replace: true, state: notice ? { notice } : null })
    queryClient.clear()
    queryClient.setQueryData(meKey, null)
  }
}

export function useLogout() {
  const signOut = useSignOut()
  return () =>
    signOut(
      async () => {
        // Push-Abo dieses Browsers gehört nicht mehr zu diesem Konto
        await unsubscribePush().catch(() => undefined)
        await api('/auth/logout', { method: 'POST' })
      },
      // Auch wenn der Server nicht antwortet, gilt der Spieler hier als abgemeldet
      { ignoreErrors: true },
    )
}

/** Target after login: only paths within the app, never back to login/register */
export function safeNext(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return routes.lobby
  if (next.startsWith(routes.login) || next.startsWith(routes.register)) return routes.lobby
  return next
}
