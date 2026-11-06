import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import type { CombatResult, Command } from '@dos/shared/game'
import { Spielfeld } from '../sections/spielfeld/components'
import { useMatchCommand, useMatchView } from '../data/match'
import { ApiRequestError } from '../data/api'
import { routes } from '../routes'
import { useSettings } from '../data/profile'
import { BoardSettingsLayer } from '../settings/BoardSettingsLayer'
import { DEFAULT_SETTINGS } from '@dos/shared/profile'
import { useMatchAudio } from './useMatchAudio'

const REJECTED_TOAST_MS = 5000
/** Combat sequence on the map; „Animationen reduzieren“ keeps it short */
const COMBAT_SEQUENCE_MS = 1200
const COMBAT_SEQUENCE_REDUCED_MS = 300

export const combatAnimationMs = (display: { combatAnimations: boolean; reduceMotion: boolean }) =>
  display.combatAnimations
    ? display.reduceMotion
      ? COMBAT_SEQUENCE_REDUCED_MS
      : COMBAT_SEQUENCE_MS
    : 0

export function MatchPage() {
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const { data: view, error, isPending, refetch } = useMatchView(matchId)
  const [lastCombat, setLastCombat] = useState<CombatResult | null>(null)
  const [rejected, setRejected] = useState<string | null>(null)
  const { data: settingsData } = useSettings()
  const settings = settingsData?.settings ?? DEFAULT_SETTINGS
  const sequenceMs = combatAnimationMs(settings.display)
  const sequenceRef = useRef(sequenceMs)
  sequenceRef.current = sequenceMs
  const audio = useMatchAudio(view, lastCombat)
  const command = useMatchCommand(matchId, {
    onCombat: setLastCombat,
    onRejected: (e) => {
      setRejected(e.message)
      audio.onRejected(e.code)
    },
    holdViewMs: () => sequenceRef.current,
  })

  // „Gegnerzüge automatisch abspielen“ aus: die Wiederholung wird gleich übersprungen
  const skipReplay = settingsData !== undefined && !settings.display.autoplayReplay
  const inReplay = view?.match.phase === 'replay'
  const { mutate, isPending: commandPending } = command
  // Once per replay, also when the server refuses (no endless retries)
  const skipped = useRef(false)
  useEffect(() => {
    if (!inReplay) skipped.current = false
    else if (skipReplay && !commandPending && !skipped.current) {
      skipped.current = true
      mutate({ type: 'skipReplay' })
    }
  }, [skipReplay, inReplay, commandPending, mutate])

  useEffect(() => {
    if (!rejected) return
    const timer = setTimeout(() => setRejected(null), REJECTED_TOAST_MS)
    return () => clearTimeout(timer)
  }, [rejected])

  if (isPending) return <BoardMessage title="Lade Partie …" pulse />
  // Die Partie wartet noch auf Mitspieler: in den Warteraum
  if (error instanceof ApiRequestError && error.code === 'MATCH_WAITING')
    return <Navigate to={routes.waitingRoom(matchId)} replace />
  if (error || !view) {
    const notFound = error instanceof ApiRequestError && error.status === 404
    // 403: angemeldet, aber nicht Teilnehmer der Partie; ein neuer Versuch hilft nicht
    const forbidden = error instanceof ApiRequestError && error.status === 403
    return (
      <BoardMessage
        title={notFound ? 'Partie nicht gefunden' : 'Partie konnte nicht geladen werden'}
        text={notFound ? 'Diese Partie gibt es nicht oder nicht mehr.' : error?.message}
        action={
          notFound || forbidden
            ? undefined
            : { label: 'Erneut versuchen', onClick: () => void refetch() }
        }
      />
    )
  }

  const send = (cmd: Command) => command.mutate(cmd)

  return (
    <div className="relative size-full">
      <BoardSettingsLayer display={settings.display} controls={settings.controls}>
        <Spielfeld
          {...view}
          lastCombat={lastCombat}
          combatAnimationMs={sequenceMs}
          showTurnReport={settings.display.turnReport}
          canWatchReplay={settings.display.autoplayReplay}
          onMoveUnit={(unitId, target) => send({ type: 'move', unitId, target })}
          onSetGoto={(unitId, target) => send({ type: 'goto', unitId, target })}
          onSetSentry={(unitId) => send({ type: 'sentry', unitId })}
          onSetPatrol={(unitId, waypoints) => send({ type: 'patrol', unitId, waypoints })}
          onSetExplore={(unitId) => send({ type: 'explore', unitId })}
          onCancelOrder={(unitId) => send({ type: 'cancelOrder', unitId })}
          onSkipUnit={(unitId) => send({ type: 'skip', unitId })}
          onAttack={(unitId, target) => send({ type: 'attack', unitId, target })}
          onUnloadUnit={(unitId, target) => send({ type: 'unload', unitId, target })}
          onSetProduction={(cityId, unitTypeId) =>
            send({ type: 'setProduction', cityId, unitTypeId })
          }
          onSelectEvent={(eventId) => {
            if (view.events.find((e) => e.id === eventId)?.isNew)
              send({ type: 'markEventRead', eventId })
          }}
          onSkipReplay={() => {
            if (!command.isPending) send({ type: 'skipReplay' })
          }}
          onEndTurn={() => send({ type: 'endTurn' })}
          onCue={audio.onCue}
          onLeave={() => navigate(routes.lobby)}
          onTutorialNext={() => {
            if (!command.isPending) send({ type: 'tutorialNext' })
          }}
          onTutorialSkip={() => {
            if (!command.isPending) send({ type: 'tutorialSkip' })
          }}
          onNewMatch={() => navigate(routes.newMatch)}
        />
      </BoardSettingsLayer>
      {rejected && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-3 sm:top-4">
          <div
            role="alert"
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border border-rose-700 bg-rose-950/95 px-4 py-3 text-sm text-rose-100 shadow-xl animate-in fade-in slide-in-from-top-2"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" />
            <p>
              <span className="font-semibold">Aktion abgelehnt:</span> {rejected}
            </p>
            <button
              type="button"
              onClick={() => setRejected(null)}
              aria-label="Hinweis schließen"
              className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded text-rose-300 hover:text-rose-100"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BoardMessage({
  title,
  text,
  pulse,
  action,
}: {
  title: string
  text?: string
  pulse?: boolean
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,var(--color-teal-800),var(--color-stone-950))] p-6 text-center text-stone-100">
      <h1
        className={`font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wider ${pulse ? 'animate-pulse' : ''}`}
      >
        {title}
      </h1>
      {text && <p className="max-w-sm text-sm text-stone-300">{text}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 flex min-h-11 items-center gap-2 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] font-bold uppercase tracking-widest text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          <RotateCcw className="size-4" /> {action.label}
        </button>
      )}
    </div>
  )
}
