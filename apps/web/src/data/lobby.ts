import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JoinResponse, LobbyData, RemindResponse, WaitingRoomData } from '@dos/shared/lobby'
import { api, ApiRequestError } from './api'

/** Lobby: every 15 s and when the window gets focus again (no WebSocket yet) */
export const LOBBY_POLL_MS = 15_000
/** Waiting room: joins and ready states of the others */
export const ROOM_POLL_MS = 4_000

export const lobbyKey = ['lobby'] as const
export const roomKey = (matchId: string) => ['room', matchId] as const

export function useLobby() {
  return useQuery({
    queryKey: lobbyKey,
    queryFn: () => api<LobbyData>('/lobby'),
    refetchInterval: LOBBY_POLL_MS,
    refetchOnWindowFocus: true,
  })
}

/** Number of matches where the player is on the move (badge "Lobby" in the shell) */
export function useYourTurnCount(): number {
  const { data } = useLobby()
  return data?.matches.filter((m) => m.status === 'yourTurn').length ?? 0
}

export function useWaitingRoom(matchId: string) {
  return useQuery({
    queryKey: roomKey(matchId),
    queryFn: () => api<WaitingRoomData>(`/matches/${matchId}/room`),
    refetchInterval: (query) =>
      query.state.error instanceof ApiRequestError && [403, 404].includes(query.state.error.status)
        ? false
        : ROOM_POLL_MS,
    retry: (count, error) =>
      !(error instanceof ApiRequestError && [401, 403, 404].includes(error.status)) && count < 2,
  })
}

/**
 * Reference time for countdowns: the server's `now`, moved on every minute on the client
 * (with the offset between server and client clock), so deadlines switch without reloading.
 */
export function useTickingNow(serverNow: string | undefined, intervalMs = 60_000) {
  const [tick, setTick] = useState(() => Date.now())
  // Client time when the server time arrived; elapsed client time is added to it
  const base = useMemo(
    () => (serverNow ? { server: Date.parse(serverNow), client: Date.now() } : null),
    [serverNow],
  )
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  if (!base) return undefined
  return new Date(base.server + Math.max(0, tick - base.client)).toISOString()
}

/** All lobby and waiting room actions; afterwards lobby and room are loaded again */
export function useLobbyActions() {
  const queryClient = useQueryClient()
  const refresh = (matchId?: string) => {
    void queryClient.invalidateQueries({ queryKey: lobbyKey })
    if (matchId) void queryClient.invalidateQueries({ queryKey: roomKey(matchId) })
  }
  const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body })
  const after =
    <A extends unknown[], T>(fn: (...args: A) => Promise<T>, matchOf?: (...args: A) => string) =>
    async (...args: A) => {
      try {
        return await fn(...args)
      } finally {
        refresh(matchOf?.(...args))
      }
    }

  return {
    remind: after(
      (matchId: string, participantId: string) =>
        post<RemindResponse>(`/matches/${matchId}/remind`, { participantId }),
      (matchId) => matchId,
    ),
    surrender: after(
      (matchId: string) => post(`/matches/${matchId}/surrender`),
      (matchId) => matchId,
    ),
    acceptInvitation: after((invitationId: string) =>
      post<JoinResponse>(`/invitations/${invitationId}/accept`),
    ),
    declineInvitation: after((invitationId: string) =>
      post(`/invitations/${invitationId}/decline`),
    ),
    joinOpenMatch: after(
      (matchId: string) => post<JoinResponse>(`/matches/${matchId}/join`),
      (matchId) => matchId,
    ),
    claimInvite: after((token: string) =>
      post<JoinResponse>(`/invite/${encodeURIComponent(token)}`),
    ),
    setReady: after(
      (matchId: string, ready: boolean) => post(`/matches/${matchId}/ready`, { ready }),
      (matchId) => matchId,
    ),
    start: after(
      (matchId: string, fillEmptyWithAI: boolean) =>
        post<{ matchId: string }>(`/matches/${matchId}/start`, { fillEmptyWithAI }),
      (matchId) => matchId,
    ),
    leave: after(
      (matchId: string) => post<{ dissolved: boolean }>(`/matches/${matchId}/leave`),
      (matchId) => matchId,
    ),
  }
}

/** Surrender from the game menu: the match view changes too (an AI plays on) */
export function useSurrender(matchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/matches/${matchId}/surrender`, { method: 'POST' }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: lobbyKey })
      void queryClient.invalidateQueries({ queryKey: ['match', matchId] })
    },
  })
}
