import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Me } from '@dos/shared/account'
import { unseenNews, versionOf } from '@dos/shared/news'
import { appVersion } from '../version'
import { api } from './api'
import { meKey, useMe } from './session'

/** The running version as x.y.z („0.10.1+abc1234“ and „0.10.1-dev“ count as 0.10.1) */
export const currentVersion = () => versionOf(appVersion().label)

/** Releases with news the logged-in player has not seen yet, newest first */
export function useUnseenNews() {
  const { data: me } = useMe()
  return me ? unseenNews(me.newsSeenVersion, currentVersion()) : []
}

/** Remember that the player has seen the news up to `version`; the server answers with `me` */
export function useMarkNewsSeen() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (version: string) => api<Me>('/news/seen', { method: 'POST', body: { version } }),
    onMutate: (version) => {
      // Close the hint right away, also when the request fails (it comes back next visit)
      queryClient.setQueryData<Me | null>(meKey, (me) =>
        me ? { ...me, newsSeenVersion: version } : me,
      )
    },
    onSuccess: (me) => queryClient.setQueryData(meKey, me),
  })
}
