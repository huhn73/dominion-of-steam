import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Command, type CommandResponse, matchOutcome, type PlayerView } from '@dos/shared/game'
import type { GameHeader } from '../shell'
import { api, ApiRequestError } from './api'

const POLL_WHILE_WAITING_MS = 5000

const OUTCOME_LABEL = { victory: 'Sieg', defeat: 'Niederlage', surrendered: 'Aufgegeben' } as const

export const matchKey = (matchId: string) => ['match', matchId] as const

export function useMatchView(matchId: string) {
  return useQuery({
    queryKey: matchKey(matchId),
    queryFn: () => api<PlayerView>(`/matches/${matchId}/view`),
    // Ohne WebSockets wird beim Warten auf andere regelmäßig nachgefragt
    refetchInterval: (query) =>
      query.state.data?.match.phase === 'waiting' && !query.state.data.result
        ? POLL_WHILE_WAITING_MS
        : false,
    retry: (count, error) =>
      !(error instanceof ApiRequestError && [401, 403, 404, 409].includes(error.status)) &&
      count < 2,
  })
}

export function useMatchCommand(
  matchId: string,
  {
    onCombat,
    onRejected,
    holdViewMs,
  }: {
    onCombat?: (c: NonNullable<CommandResponse['combat']>) => void
    onRejected?: (e: ApiRequestError) => void
    /** Delay before the state after a combat is applied, so the board can play the sequence */
    holdViewMs?: () => number
  } = {},
) {
  const queryClient = useQueryClient()
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (hold.current) clearTimeout(hold.current)
    },
    [],
  )
  return useMutation({
    mutationFn: (cmd: Command) =>
      api<CommandResponse>(`/matches/${matchId}/commands`, { method: 'POST', body: cmd }),
    onSuccess: ({ view, combat }) => {
      if (hold.current) {
        clearTimeout(hold.current)
        hold.current = null
      }
      const delay = combat ? (holdViewMs?.() ?? 0) : 0
      // Neues Objekt je Kampf, damit der Toast auch bei gleichem Inhalt erscheint
      if (combat) onCombat?.({ ...combat })
      if (delay > 0)
        hold.current = setTimeout(() => {
          hold.current = null
          queryClient.setQueryData(matchKey(matchId), view)
        }, delay)
      else queryClient.setQueryData(matchKey(matchId), view)
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) onRejected?.(error)
      void queryClient.invalidateQueries({ queryKey: matchKey(matchId) })
    },
  })
}

const deadlineFormat = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDeadline(iso: string) {
  // „So., 19:00“
  const parts = deadlineFormat.formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('weekday')}, ${get('hour')}:${get('minute')}`
}

export function gameHeaderFor(view: PlayerView | undefined): GameHeader {
  if (!view) return { title: 'Lade Partie …' }
  const { match } = view
  const title = `${match.name} · Runde ${match.round}`
  if (view.result) {
    const outcome = matchOutcome(view)
    return {
      title,
      status: outcome ? `Beendet · ${OUTCOME_LABEL[outcome]}` : 'Beendet',
      isYourTurn: false,
    }
  }
  if (match.phase === 'yourTurn')
    return {
      title,
      status: match.turnDeadline
        ? `Dein Zug · Frist ${formatDeadline(match.turnDeadline)}`
        : 'Dein Zug',
      isYourTurn: true,
    }
  return {
    title,
    status: match.phase === 'replay' ? 'Gegnerzüge' : 'Warte auf Gegner',
    isYourTurn: false,
  }
}

export function useDevActions() {
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['match'] }),
      queryClient.invalidateQueries({ queryKey: ['lobby'] }),
    ])
  return {
    resetDemo: () => api('/dev/demo/reset', { method: 'POST' }).then(refresh),
    createSolo: (opts: { size: string; opponents: number; difficulty: string; shape?: string }) =>
      api<{ matchId: string; seed: string }>('/dev/matches/solo', {
        method: 'POST',
        body: opts,
      }).then(async (r) => (await refresh(), r)),
    passOthers: (matchId: string) =>
      api(`/dev/matches/${matchId}/pass`, { method: 'POST' }).then(refresh),
  }
}
