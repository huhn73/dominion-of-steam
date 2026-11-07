import { useState } from 'react'
import { ArrowLeft, Bot, Check, Clock, Copy, Crown, DoorOpen, Hourglass, LogOut, Mail, Share2, Swords } from 'lucide-react'
import type { WaitingSeat, WarteraumProps } from '../types'
import { FACTION_HEX } from './format'
import type { Translate } from '@dos/shared/i18n'
import { Avatar, FactionEmblem, Sheet } from './shared'
import { useT } from '../../../i18n'

function seatStatus(t: Translate, seat: WaitingSeat) {
  if (seat.kind === 'ai') return { label: t('lobby.room.seat.ai', { difficulty: t(`common.difficulty.${seat.aiDifficulty}`) }), className: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300', icon: Bot }
  if (seat.kind === 'invited') return { label: t('lobby.room.seat.invited'), className: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400', icon: Mail }
  if (seat.kind === 'open') return { label: t('lobby.room.seat.open'), className: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300', icon: DoorOpen }
  if (seat.status === 'ready') return { label: t('lobby.room.seat.ready'), className: 'bg-teal-600 text-white', icon: Check }
  return { label: t('lobby.room.seat.notReady'), className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', icon: Hourglass }
}

export function Warteraum({ room, factions, onToggleReady, onStartMatch, onLeave, onCopyInviteLink, onShareInviteLink, onBack }: WarteraumProps) {
  const t = useT()
  const ownSeat = room.seats.find((s) => s.isYou)
  const [ready, setReady] = useState(ownSeat?.kind === 'player' && ownSeat.status === 'ready')
  const [fill, setFill] = useState(room.fillEmptyWithAI)
  const [confirmLeave, setConfirmLeave] = useState(false)

  // own ready state is local until the server confirms it
  const seats = room.seats.map((s) => (s.isYou && s.kind === 'player' ? { ...s, status: ready ? ('ready' as const) : ('joined' as const) } : s))
  const joinedPlayers = seats.filter((s) => s.kind === 'player')
  const notReady = joinedPlayers.filter((s) => s.kind === 'player' && s.status !== 'ready')
  const freeSeats = seats.filter((s) => s.kind === 'invited' || s.kind === 'open').length
  const filled = seats.length - freeSeats
  const canStart = room.isHost && notReady.length === 0
  const startBlocker = notReady.length > 0 ? t('lobby.room.waitFor', { names: notReady.map((s) => s.name).join(', ') }) : null

  return (
    <div className="font-['Barlow'] text-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-teal-300"
        >
          <ArrowLeft className="size-4" /> {t('lobby.room.back')}
        </button>

        <header className="mb-8">
          <p className="mb-2 flex items-center gap-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
            <span className="h-px w-8 bg-current" /> {t('lobby.room.title')}
          </p>
          <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-6xl">{room.matchName}</h1>
          <p className="mt-3 font-['IBM_Plex_Mono'] text-sm text-stone-500">
            {t('lobby.room.seatsLine', { filled, total: seats.length, ready: seats.filter((s) => s.status === 'ready').length })}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          {/* Seats */}
          <section aria-label={t('lobby.room.seats')}>
            <ol className="space-y-3">
              {seats.map((seat, i) => {
                const faction = factions.find((f) => f.id === seat.factionId)
                const color = faction ? FACTION_HEX[faction.color].base : undefined
                const st = seatStatus(t, seat)
                const empty = seat.kind === 'open'
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-colors ${
                      empty
                        ? 'border-dashed border-teal-400/70 bg-transparent'
                        : seat.status === 'ready'
                          ? 'border-teal-600/50 bg-white dark:bg-stone-900'
                          : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <span className="w-6 text-center font-['IBM_Plex_Mono'] text-sm font-semibold text-stone-400">{i + 1}</span>
                    {empty ? (
                      <span className="flex size-12 items-center justify-center rounded-full border-2 border-dashed border-teal-500 text-teal-600">
                        <DoorOpen className="size-5" />
                      </span>
                    ) : (
                      <Avatar name={seat.name ?? '?'} url={seat.avatarUrl} color={color} className={`size-12 ${seat.kind === 'invited' ? 'opacity-50' : ''}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-['Big_Shoulders_Display'] text-xl font-extrabold uppercase tracking-wide">
                        {empty ? t('lobby.room.openSeat') : seat.name}
                        {seat.isYou && <span className="font-['Barlow'] text-sm font-normal normal-case tracking-normal text-stone-500">{t('lobby.room.you')}</span>}
                        {seat.isHost && <Crown className="size-4 text-amber-500" aria-label={t('lobby.room.host')} />}
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                        {faction ? (
                          <>
                            <FactionEmblem faction={faction} className="size-5" /> {faction.shortName}
                          </>
                        ) : empty ? (
                          t('lobby.room.anyoneCanJoin')
                        ) : (
                          t('lobby.room.notAccepted')
                        )}
                      </p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${st.className}`}>
                      <st.icon className="size-3.5" /> {st.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          {/* Side: invite, rules */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="mb-1 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">{t('lobby.room.inviteLink')}</h2>
              <p className="mb-3 text-sm text-stone-500">{t('lobby.room.inviteHint')}</p>
              <code className="mb-3 block truncate rounded-lg border-2 border-dashed border-stone-300 bg-stone-100 px-3 py-2 font-['IBM_Plex_Mono'] text-xs dark:border-stone-700 dark:bg-stone-950">
                {room.inviteLink}
              </code>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(room.inviteLink).catch(() => {})
                    onCopyInviteLink?.(room.inviteLink)
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-stone-300 font-semibold hover:border-teal-500 dark:border-stone-700"
                >
                  <Copy className="size-4" /> {t('lobby.room.copy')}
                </button>
                <button
                  type="button"
                  onClick={() => onShareInviteLink?.(room.inviteLink)}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 font-semibold text-white hover:bg-teal-500"
                >
                  <Share2 className="size-4" /> {t('lobby.room.share')}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="mb-2 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">{t('lobby.details.rules')}</h2>
              <dl className="space-y-1.5 text-sm">
                {[
                  [t('lobby.details.mode'), room.rules.mode === 'live' ? t('lobby.live') : t('lobby.async')],
                  [room.rules.mode === 'live' ? t('lobby.details.timeLimit') : t('lobby.details.deadline'), t(room.rules.turnLimitLabel)],
                  [t('lobby.details.victory'), t(room.rules.victoryCondition)],
                  [
                    t('lobby.details.map'),
                    t('lobby.room.mapLine', { size: room.map.sizeLabel, width: room.map.width, height: room.map.height, land: room.map.landShare }) +
                      (room.map.worldShape === 'islands'
                        ? ` · ${t('lobby.details.islands')}`
                        : room.map.worldShape === 'archipelago'
                          ? ` · ${t('lobby.details.archipelago')}`
                          : ''),
                  ],
                  [t('lobby.details.seed'), room.map.seed],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className={`text-right font-semibold ${k === t('lobby.details.seed') ? "font-['IBM_Plex_Mono'] tracking-widest" : ''}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              {room.rules.mode === 'async' && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
                  <Clock className="size-3.5" /> {t('lobby.room.asyncHint')}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Action bar, above the shell's mobile tab bar */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t-4 border-double border-stone-300 bg-stone-50/95 backdrop-blur md:bottom-0 dark:border-stone-700 dark:bg-stone-900/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setConfirmLeave(true)}
            aria-label={t('lobby.room.leave')}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-stone-500 hover:bg-stone-200 hover:text-rose-600 dark:hover:bg-stone-800"
          >
            <LogOut className="size-4" /> <span className="hidden sm:inline">{t('lobby.room.leave')}</span>
          </button>

          {room.isHost && freeSeats > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={fill} onChange={(e) => setFill(e.target.checked)} className="size-5 accent-amber-500" />
              {t('lobby.room.fill', { count: freeSeats })}
            </label>
          )}

          <div className="ml-auto flex items-center gap-2">
            {ownSeat?.kind === 'player' && (
              <button
                type="button"
                onClick={() => {
                  setReady(!ready)
                  onToggleReady?.(!ready)
                }}
                aria-pressed={ready}
                className={`flex min-h-12 items-center gap-2 rounded-lg border-2 px-4 font-semibold transition-colors ${
                  ready ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-500' : 'border-stone-300 hover:border-teal-500 dark:border-stone-700'
                }`}
              >
                <Check className="size-4" /> {ready ? t('lobby.room.ready') : t('lobby.room.reportReady')}
              </button>
            )}
            {room.isHost && (
              <button
                type="button"
                disabled={!canStart}
                onClick={() => onStartMatch?.(fill)}
                title={startBlocker ?? undefined}
                className="flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 px-5 font-['Big_Shoulders_Display'] text-lg font-black uppercase tracking-[0.15em] text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:from-amber-300 hover:to-amber-500 disabled:from-stone-300 disabled:to-stone-400 disabled:text-stone-600 dark:disabled:from-stone-700 dark:disabled:to-stone-800 dark:disabled:text-stone-500"
              >
                <Swords className="size-5" /> {t('lobby.room.start')}
              </button>
            )}
          </div>
          {room.isHost && (
            <p className="w-full text-right text-xs text-stone-500">
              {startBlocker ??
                (freeSeats > 0 && !fill
                  ? t('lobby.room.emptyStays', { count: filled })
                  : t('lobby.room.allReady'))}
            </p>
          )}
        </div>
      </div>

      {confirmLeave && (
        <Sheet
          title={t('lobby.room.leaveTitle')}
          onClose={() => setConfirmLeave(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmLeave(false)} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700">
                {t('lobby.room.stay')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmLeave(false)
                  onLeave?.()
                }}
                className="min-h-11 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500"
              >
                {t('lobby.room.leave')}
              </button>
            </div>
          }
        >
          <p className="text-stone-700 dark:text-stone-300">
            {room.isHost
              ? t('lobby.room.leaveHost', { name: room.matchName })
              : t('lobby.room.leaveSeat', { name: room.matchName })}
          </p>
        </Sheet>
      )}
    </div>
  )
}
