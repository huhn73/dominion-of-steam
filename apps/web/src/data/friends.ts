import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FriendsData, SendFriendRequest } from '@dos/shared/account'
import { api } from './api'
import { LOBBY_POLL_CONNECTED_MS, LOBBY_POLL_MS } from './lobby'
import { useServerEventsConnected } from './events'
import { profileKey } from './profile'

export const friendsKey = ['friends'] as const

/** Friends and open requests; the event stream (`friends`) reloads it on changes */
export function useFriends() {
  const live = useServerEventsConnected()
  return useQuery({
    queryKey: friendsKey,
    queryFn: () => api<FriendsData>('/friends'),
    refetchInterval: live ? LOBBY_POLL_CONNECTED_MS : LOBBY_POLL_MS,
  })
}

/** Open requests to the player (count in the navigation) */
export function useIncomingFriendRequests(): number {
  return useFriends().data?.incoming.length ?? 0
}

/** Every action answers with the new lists; profiles show the friendship, so they reload */
export function useFriendActions() {
  const queryClient = useQueryClient()
  const done = (data: FriendsData) => {
    queryClient.setQueryData(friendsKey, data)
    void queryClient.invalidateQueries({ queryKey: profileKey })
    return data
  }
  const id = (playerId: string) => encodeURIComponent(playerId)
  return {
    request: (to: SendFriendRequest) =>
      api<FriendsData>('/friends/requests', { method: 'POST', body: to }).then(done),
    accept: (playerId: string) =>
      api<FriendsData>(`/friends/requests/${id(playerId)}/accept`, { method: 'POST' }).then(done),
    decline: (playerId: string) =>
      api<FriendsData>(`/friends/requests/${id(playerId)}/decline`, { method: 'POST' }).then(done),
    withdraw: (playerId: string) =>
      api<FriendsData>(`/friends/requests/${id(playerId)}`, { method: 'DELETE' }).then(done),
    remove: (playerId: string) =>
      api<FriendsData>(`/friends/${id(playerId)}`, { method: 'DELETE' }).then(done),
  }
}
