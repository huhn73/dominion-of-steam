import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Command, type CommandResponse, matchOutcome, type PlayerView } from '@dos/shared/game'
import type { GameHeader } from '../shell'
import { INTL_LOCALE, translator, type Locale, type Translate } from '@dos/shared/i18n'
import { isTutorialMatchId } from '@dos/shared/engine'
import { api, ApiRequestError } from './api'
import { useServerEventsConnected } from './events'
import { useLocalizedMasterData } from '../i18n/localize'

/** Without event stream: poll while others are on the move */
export const POLL_WHILE_WAITING_MS = 5000

export const matchKey = (matchId: string) => ['match', matchId] as const

export function useMatchView(matchId: string) {
  const live = useServerEventsConnected()
  const select = useLocalizedMasterData<PlayerView>()
  return useQuery({
    queryKey: matchKey(matchId),
    queryFn: () => api<PlayerView>(`/matches/${matchId}/view`),
    select,
    // With the event stream the server reports turns; without it poll while waiting
    refetchInterval: (query) =>
      !live && query.state.data?.match.phase === 'waiting' && !query.state.data.result
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

export function formatDeadline(locale: Locale, iso: string) {
  // „So., 19:00“ / „Sun, 19:00“
  const parts = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('weekday')}, ${get('hour')}:${get('minute')}`
}

/** Name of a match; the tutorial's stored German name is shown in the player's language */
export const matchName = (t: Translate, match: { id: string; name: string }) =>
  isTutorialMatchId(match.id) ? t('match.tutorialName') : match.name

export function gameHeaderFor(view: PlayerView | undefined, locale: Locale): GameHeader {
  const t = translator(locale)
  if (!view) return { title: t('match.header.loading') }
  const { match } = view
  const title = t('match.header.title', { name: matchName(t, match), round: match.round })
  if (view.result) {
    const outcome = matchOutcome(view)
    return {
      title,
      status: outcome
        ? t('match.header.endedWith', { outcome: t(`match.outcome.${outcome}`) })
        : t('match.header.ended'),
      isYourTurn: false,
    }
  }
  if (match.phase === 'yourTurn')
    return {
      title,
      status: match.turnDeadline
        ? t('match.header.yourTurnUntil', { deadline: formatDeadline(locale, match.turnDeadline) })
        : t('match.header.yourTurn'),
      isYourTurn: true,
    }
  // The AIs move in the background: name the one on the move (changes with every signal)
  const current = view.participants.find((p) => p.id === match.currentId)
  return {
    title,
    status:
      match.phase === 'replay'
        ? t('match.header.replay')
        : current?.isAI
          ? t('match.header.aiMoving', { name: current.name })
          : t('match.header.waiting'),
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
