import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Me } from '@dos/shared/account'
import {
  AVATAR_MAX_BYTES,
  type ProfileData,
  type Settings,
  type SettingsData,
} from '@dos/shared/profile'
import { api, ApiRequestError } from './api'
import { lobbyKey } from './lobby'
import { meKey } from './session'
import { translate } from '@dos/shared/i18n'
import { activeLocale } from '../i18n/locale'

export const profileKey = ['profile'] as const
export const settingsKey = ['settings'] as const

/** Profile with the match history page by page („Mehr anzeigen“ loads the next page) */
export function useProfile() {
  return useInfiniteQuery({
    queryKey: profileKey,
    queryFn: ({ pageParam }) =>
      api<ProfileData>(pageParam ? `/profile?cursor=${encodeURIComponent(pageParam)}` : '/profile'),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  })
}

/** Settings of the logged-in player (also read by the app to apply theme, motion, controls) */
export function useSettings(enabled = true) {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => api<SettingsData>('/settings'),
    staleTime: 5 * 60_000,
    enabled,
  })
}

/** Name and avatar: afterwards profile, shell (`/me`), settings and lobby show the new values */
export function useProfileActions() {
  const queryClient = useQueryClient()
  const updated = (me: Me) => {
    queryClient.setQueryData(meKey, me)
    void queryClient.invalidateQueries({ queryKey: profileKey })
    void queryClient.invalidateQueries({ queryKey: settingsKey })
    void queryClient.invalidateQueries({ queryKey: lobbyKey })
    return me
  }
  return {
    updateDisplayName: (displayName: string) =>
      api<Me>('/profile', { method: 'PATCH', body: { displayName } }).then(updated),
    /** The crop fields go before the file: the server reads them with the file */
    uploadAvatar: async (file: File, crop?: { x: number; y: number; size: number }) => {
      // Checked on the server, too; this only saves uploading a huge file
      if (file.size > AVATAR_MAX_BYTES)
        throw new ApiRequestError(
          413,
          'IMAGE_TOO_LARGE',
          translate(activeLocale(), 'common.imageTooLarge', { mb: AVATAR_MAX_BYTES / 1024 / 1024 }),
        )
      const body = new FormData()
      if (crop) {
        body.append('cropX', String(crop.x))
        body.append('cropY', String(crop.y))
        body.append('cropSize', String(crop.size))
      }
      body.append('avatar', file)
      return api<Me>('/profile/avatar', { method: 'POST', body }).then(updated)
    },
    removeAvatar: () => api<Me>('/profile/avatar', { method: 'DELETE' }).then(updated),
  }
}

/**
 * Optimistic settings: the cache gets the new settings at once (so the app applies them right
 * away), the request follows debounced by the page.
 */
export function useSettingsActions() {
  const queryClient = useQueryClient()
  return {
    setLocal: (settings: Settings) => {
      void queryClient.cancelQueries({ queryKey: settingsKey })
      queryClient.setQueryData<SettingsData>(settingsKey, (old) =>
        old ? { ...old, settings } : old,
      )
    },
    save: (settings: Settings) => api<SettingsData>('/settings', { method: 'PUT', body: settings }),
    /** Server state after a failed save */
    reload: () =>
      queryClient.fetchQuery({
        queryKey: settingsKey,
        staleTime: 0,
        queryFn: () => api<SettingsData>('/settings'),
      }),
  }
}

/** Account actions of the rubric „Konto“ */
export function useAccountActions() {
  const queryClient = useQueryClient()
  return {
    changeEmail: (email: string, currentPassword: string) =>
      api<{ ok: true; pendingEmail: string }>('/account/email', {
        method: 'POST',
        body: { email, currentPassword },
      }),
    changePassword: async (currentPassword: string, newPassword: string) => {
      const result = await api<{ ok: true; activeSessions: number }>('/account/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      void queryClient.invalidateQueries({ queryKey: settingsKey })
      return result
    },
    logoutEverywhere: () => api('/auth/logout-all', { method: 'POST' }),
    deleteAccount: (currentPassword: string) =>
      api<{ ok: true; matchesTakenOver: number }>('/account', {
        method: 'DELETE',
        body: { currentPassword },
      }),
    /** „Erneut senden“ for the verification e-mail */
    resendVerification: async () => {
      const result = await api<{ ok: true; alreadyVerified: boolean }>('/account/verify/resend', {
        method: 'POST',
      })
      if (result.alreadyVerified) void queryClient.invalidateQueries({ queryKey: meKey })
      return result
    },
  }
}
