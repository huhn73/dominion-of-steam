import { useEffect, useRef, useState } from 'react'
import { BellRing, Check, Clock, DoorOpen, Flag, Hourglass, Info, MoreVertical, Play, Radio } from 'lucide-react'
import type { Faction, Match } from '../types'
import { hoursSince, timeLeft } from './format'
import { MiniMap, ParticipantChip } from './shared'

interface MatchCardProps {
  match: Match
  factions: Faction[]
  now: string
  deadlineWarningHours: number
  /** 'feature' for "Du bist am Zug", 'compact' for the other matches */
  variant: 'feature' | 'compact'
  onPlay?: () => void
  onOpenWaitingRoom?: () => void
  onRemind?: (participantId: string) => void
  onShowDetails?: () => void
  onSurrender?: () => void
}

const REMIND_COOLDOWN_HOURS = 12

function MatchMenu({ onShowDetails, onSurrender, canSurrender }: { onShowDetails?: () => void; onSurrender?: () => void; canSurrender: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // focus the trigger first, so a dialog opened from the menu returns focus there
  const choose = (action?: () => void) => {
    setOpen(false)
    triggerRef.current?.focus()
    action?.()
  }
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        ref={triggerRef}
        aria-label="Weitere Aktionen"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        <MoreVertical className="size-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-xl dark:border-stone-700 dark:bg-stone-900">
          <button type="button" role="menuitem" className={item} onClick={() => choose(onShowDetails)}>
            <Info className="size-4 text-stone-400" /> Partie-Details
          </button>
          {canSurrender && (
            <button type="button" role="menuitem" className={`${item} text-rose-600 dark:text-rose-400`} onClick={() => choose(onSurrender)}>
              <Flag className="size-4" /> Aufgeben
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function MatchCard({
  match,
  factions,
  now,
  deadlineWarningHours,
  variant,
  onPlay,
  onOpenWaitingRoom,
  onRemind,
  onShowDetails,
  onSurrender,
}: MatchCardProps) {
  const factionOf = (id: string) => factions.find((f) => f.id === id)
  const current = match.participants.find((p) => p.id === match.currentParticipantId)
  const deadline = match.turnDeadline ? timeLeft(match.turnDeadline, now) : null
  const urgent = match.status === 'yourTurn' && !!deadline && deadline.hours < deadlineWarningHours
  const waiting = match.status === 'waitingForPlayers'
  const canRemind = match.status === 'othersTurn' && match.rules.mode === 'async' && !!current && !current.isAI
  const reminded = !!match.remindedAt && hoursSince(match.remindedAt, now) < REMIND_COOLDOWN_HOURS

  const modeLine = (
    <span className="flex items-center gap-1.5">
      {match.rules.mode === 'live' ? <Radio className="size-3.5" /> : <Clock className="size-3.5" />}
      {match.rules.mode === 'live' ? `Live · ${match.rules.turnLimitLabel} pro Zug` : `Asynchron · ${match.rules.turnLimitLabel}`}
    </span>
  )

  const participants = (
    <div className="flex flex-wrap items-center gap-2">
      {match.participants.map((p) => (
        <ParticipantChip key={p.id} participant={p} faction={factionOf(p.factionId)} isCurrent={p.id === match.currentParticipantId && !p.isYou} />
      ))}
      {waiting &&
        Array.from({ length: match.waitingFor ?? 0 }, (_, i) => (
          <span key={i} className="size-9 rounded-full border-2 border-dashed border-stone-300 dark:border-stone-600" />
        ))}
    </div>
  )

  if (variant === 'feature') {
    return (
      <article
        className={`group flex flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition hover:shadow-xl dark:bg-stone-900 ${
          urgent ? 'border-rose-500' : 'border-stone-200 dark:border-stone-800'
        }`}
      >
        <div className="relative h-36 overflow-hidden">
          <MiniMap rows={match.miniMap} participants={match.participants} factions={factions} className="size-full transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
          <span className="absolute left-3 top-3 rounded bg-stone-950/80 px-2 py-1 font-['IBM_Plex_Mono'] text-xs font-semibold uppercase tracking-widest text-amber-300">
            Runde {match.round}
          </span>
          <h3 className="absolute inset-x-4 bottom-3 truncate font-['Big_Shoulders_Display'] text-3xl font-black uppercase leading-none tracking-wide text-white drop-shadow">
            {match.name}
          </h3>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-500 dark:text-stone-400">
            {modeLine}
            {deadline && (
              <span
                className={`rotate-[-2deg] rounded border-2 px-2 py-0.5 font-['IBM_Plex_Mono'] text-xs font-bold uppercase ${
                  urgent ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-stone-300 text-stone-600 dark:border-stone-600 dark:text-stone-300'
                }`}
              >
                {deadline.label}
              </span>
            )}
          </div>
          {participants}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onPlay}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 font-['Big_Shoulders_Display'] text-lg font-black uppercase tracking-[0.15em] text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:from-amber-300 hover:to-amber-500"
            >
              <Play className="size-5" fill="currentColor" /> Weiterspielen
            </button>
            <MatchMenu onShowDetails={onShowDetails} onSurrender={onSurrender} canSurrender />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center dark:border-stone-800 dark:bg-stone-900">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {waiting ? (
          <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-stone-300 text-stone-400 dark:border-stone-700">
            <Hourglass className="size-6" />
          </span>
        ) : (
          <MiniMap rows={match.miniMap} participants={match.participants} factions={factions} className="h-16 w-24 shrink-0 rounded-md" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{match.name}</h3>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
            {waiting
              ? `Wartet auf ${match.waitingFor} Spieler`
              : `${current?.isAI ? `${current.name} (KI)` : current?.name} ist am Zug`}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-stone-500 dark:text-stone-400">
            {modeLine}
            {!waiting && <span className="font-['IBM_Plex_Mono']">Runde {match.round}</span>}
            {deadline && <span>{deadline.label}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {participants}
        <div className="flex items-center gap-1">
          {waiting ? (
            <button
              type="button"
              onClick={onOpenWaitingRoom}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-semibold text-amber-300 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700"
            >
              <DoorOpen className="size-4" /> Warteraum
            </button>
          ) : (
            canRemind && (
              <button
                type="button"
                disabled={reminded}
                onClick={() => current && onRemind?.(current.id)}
                className="flex min-h-11 items-center gap-1.5 rounded-lg border-2 border-teal-600 px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent dark:text-teal-300 dark:hover:bg-teal-950 dark:disabled:border-stone-700 dark:disabled:text-stone-500"
              >
                {reminded ? <Check className="size-4" /> : <BellRing className="size-4" />}
                {reminded ? 'Erinnert' : 'Erinnern'}
              </button>
            )
          )}
          <MatchMenu onShowDetails={onShowDetails} onSurrender={onSurrender} canSurrender={!waiting} />
        </div>
      </div>
    </article>
  )
}
