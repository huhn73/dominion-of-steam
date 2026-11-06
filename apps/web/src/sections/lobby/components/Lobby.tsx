import { useState } from 'react'
import { Bell, BellOff, Check, Clock, Map as MapIcon, Plus, Radio, Swords, Trophy, X } from 'lucide-react'
import type { LobbyProps, Match } from '../types'
import { MatchCard } from './MatchCard'
import { MatchDetailsSheet, SurrenderSheet } from './MatchDialogs'
import { timeAgo } from './format'
import { Avatar, Chip, FactionEmblem, SectionHeading } from './shared'
import { TutorialCard, TutorialOffer } from './TutorialCard'

const RESULT_STAMP = {
  victory: { label: 'Sieg', className: 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300' },
  defeat: { label: 'Niederlage', className: 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400' },
  surrendered: { label: 'Aufgegeben', className: 'border-stone-400 text-stone-500' },
} as const

export function Lobby({
  now,
  you,
  pushPermission,
  deadlineWarningHours,
  factions,
  matches,
  invitations,
  openMatches,
  finishedMatches,
  onPlay,
  onOpenWaitingRoom,
  onRemind,
  onSurrender,
  onShowDetails,
  onAcceptInvitation,
  onDeclineInvitation,
  onJoinOpenMatch,
  onEnablePush,
  onDismissPushBanner,
  onNewMatch,
  tutorial,
  onStartTutorial,
  onDismissTutorial,
}: LobbyProps) {
  const [tab, setTab] = useState<'open' | 'finished'>('open')
  const [bannerHidden, setBannerHidden] = useState(false)
  const [details, setDetails] = useState<Match | null>(null)
  const [surrender, setSurrender] = useState<Match | null>(null)

  const deadlineOf = (m: Match) => (m.turnDeadline ? new Date(m.turnDeadline).getTime() : Infinity)
  const yourTurn = matches.filter((m) => m.status === 'yourTurn').sort((a, b) => deadlineOf(a) - deadlineOf(b))
  const others = matches.filter((m) => m.status !== 'yourTurn')
  const factionOf = (id: string) => factions.find((f) => f.id === id)

  const cardProps = (m: Match) => ({
    match: m,
    factions,
    now,
    deadlineWarningHours,
    onPlay: () => onPlay?.(m.id),
    onOpenWaitingRoom: () => onOpenWaitingRoom?.(m.id),
    onRemind: (pid: string) => onRemind?.(m.id, pid),
    onShowDetails: () => {
      setDetails(m)
      onShowDetails?.(m.id)
    },
    onSurrender: () => setSurrender(m),
  })

  const showBanner = pushPermission !== 'granted' && !bannerHidden
  // New accounts without any match are offered the tutorial once („Später“ is remembered)
  const [offerClosed, setOfferClosed] = useState(false)
  const offerTutorial =
    !!tutorial &&
    !offerClosed &&
    !tutorial.completed &&
    !tutorial.dismissed &&
    tutorial.matchId === null &&
    matches.length === 0 &&
    finishedMatches.length === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 font-['Barlow'] text-stone-900 sm:px-6 sm:py-12 dark:text-stone-100">
      {/* Push banner */}
      {showBanner && (
        <div
          className={`mb-8 flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center ${
            pushPermission === 'denied'
              ? 'border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-900'
              : 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
          }`}
        >
          {pushPermission === 'denied' ? <BellOff className="size-6 shrink-0 text-stone-500" /> : <Bell className="size-6 shrink-0 text-amber-600" />}
          <div className="flex-1">
            <p className="font-semibold">
              {pushPermission === 'denied' ? 'Benachrichtigungen sind im Browser blockiert' : 'Benachrichtige mich, wenn ich am Zug bin'}
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {pushPermission === 'denied'
                ? 'Erlaube sie über das Schloss-Symbol in der Adressleiste. E-Mail-Benachrichtigungen findest du unter Profil & Einstellungen.'
                : 'Verpasse keine Frist, auch wenn die App geschlossen ist. E-Mail-Benachrichtigungen findest du unter Profil & Einstellungen.'}
            </p>
          </div>
          <div className="flex gap-2">
            {pushPermission === 'default' && (
              <button type="button" onClick={onEnablePush} className="min-h-11 flex-1 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400 sm:flex-none">
                Aktivieren
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setBannerHidden(true)
                onDismissPushBanner?.()
              }}
              className="min-h-11 flex-1 rounded-lg px-4 font-semibold text-stone-600 hover:bg-stone-200 sm:flex-none dark:text-stone-300 dark:hover:bg-stone-800"
            >
              {pushPermission === 'denied' ? 'Ausblenden' : 'Später'}
            </button>
          </div>
        </div>
      )}

      {/* Heading */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
            <span className="h-px w-8 bg-current" /> Lagezentrum
          </p>
          <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-7xl">
            Lagebericht
          </h1>
          <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">
            {yourTurn.length > 0
              ? `${you.name}, ${yourTurn.length} ${yourTurn.length === 1 ? 'Front wartet' : 'Fronten warten'} auf deinen Befehl.`
              : `${you.name}, an allen Fronten ist es ruhig.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onNewMatch}
          className="flex min-h-12 items-center gap-2 rounded-lg bg-stone-900 px-5 font-['Big_Shoulders_Display'] text-lg font-black uppercase tracking-widest text-amber-300 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700"
        >
          <Plus className="size-5" /> Neue Partie
        </button>
      </header>

      {tutorial && onStartTutorial && <TutorialCard tutorial={tutorial} onStart={onStartTutorial} />}
      {offerTutorial && onStartTutorial && (
        <TutorialOffer
          onStart={() => {
            setOfferClosed(true)
            onStartTutorial(false)
          }}
          onLater={() => {
            setOfferClosed(true)
            onDismissTutorial?.()
          }}
        />
      )}

      {/* Your turn */}
      <section aria-label="Du bist am Zug" className="mb-12">
        <SectionHeading title="Du bist am Zug" count={yourTurn.length} />
        {yourTurn.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-12 text-center dark:border-stone-700">
            <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">Du bist nirgends am Zug</p>
            <p className="mt-1 text-sm text-stone-500">Zeit für eine neue Partie?</p>
            <button type="button" onClick={onNewMatch} className="mt-5 flex min-h-11 items-center gap-2 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400">
              <Plus className="size-4" /> Neue Partie
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {yourTurn.map((m, i) => (
              <div key={m.id} className="relative animate-in fade-in slide-in-from-bottom-3 fill-mode-both has-[[aria-expanded=true]]:z-10" style={{ animationDelay: `${i * 80}ms` }}>
                <MatchCard variant="feature" {...cardProps(m)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mb-12 grid gap-10 lg:grid-cols-[1fr_24rem]">
        {/* Other matches */}
        <section aria-label="Weitere Partien">
          <SectionHeading title="Weitere Partien" count={others.length} />
          {others.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700">
              Keine weiteren laufenden Partien.
            </p>
          ) : (
            <div className="space-y-3">
              {others.map((m) => (
                <MatchCard key={m.id} variant="compact" {...cardProps(m)} />
              ))}
            </div>
          )}
        </section>

        {/* Invitations */}
        <section aria-label="Einladungen">
          <SectionHeading title="Einladungen" count={invitations.length} />
          {invitations.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700">
              Keine offenen Einladungen.
            </p>
          ) : (
            <ul className="space-y-3">
              {invitations.map((inv) => (
                <li key={inv.id} className="relative overflow-hidden rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <span className="absolute inset-y-0 left-0 w-1 bg-[repeating-linear-gradient(180deg,#f59e0b_0_8px,#0d9488_8px_16px)]" />
                  <div className="flex items-start gap-3 pl-1">
                    <Avatar name={inv.from.name} url={inv.from.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-stone-500">
                        <strong className="text-stone-700 dark:text-stone-300">{inv.from.name}</strong> lädt dich ein · {timeAgo(inv.sentAt, now)}
                      </p>
                      <p className="line-clamp-2 font-['Big_Shoulders_Display'] text-xl font-black uppercase leading-tight tracking-wide">{inv.matchName}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
                    <Chip>
                      {inv.mode === 'live' ? <Radio className="size-3" /> : <Clock className="size-3" />}
                      {inv.mode === 'live' ? 'Live' : 'Asynchron'} · {inv.turnLimitLabel}
                    </Chip>
                    <Chip>
                      <MapIcon className="size-3" /> {inv.mapSizeLabel}
                    </Chip>
                    <Chip>
                      {inv.seatsTaken}/{inv.seatsTotal} Plätze
                    </Chip>
                  </div>
                  {inv.message && <p className="mt-2 pl-1 text-sm italic text-stone-600 dark:text-stone-400">„{inv.message}“</p>}
                  <div className="mt-3 flex gap-2 pl-1">
                    <button
                      type="button"
                      onClick={() => onAcceptInvitation?.(inv.id)}
                      className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
                    >
                      <Check className="size-4" /> Annehmen
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeclineInvitation?.(inv.id)}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-rose-400 hover:text-rose-600 dark:border-stone-700"
                    >
                      <X className="size-4" /> Ablehnen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Tabs: open / finished */}
      <section aria-label="Offene und beendete Partien">
        <div role="tablist" className="mb-4 flex gap-1 border-b-4 border-double border-stone-300 dark:border-stone-700">
          {(
            [
              ['open', 'Offene Partien', openMatches.length],
              ['finished', 'Beendet', finishedMatches.length],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-1 flex min-h-12 items-baseline gap-2 border-b-4 px-4 font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide transition-colors ${
                tab === id ? 'border-amber-500 text-stone-900 dark:text-stone-100' : 'border-transparent text-stone-400 hover:text-teal-700 dark:hover:text-teal-300'
              }`}
            >
              {label}
              <span className="font-['IBM_Plex_Mono'] text-sm">{count}</span>
            </button>
          ))}
        </div>

        {tab === 'open' &&
          (openMatches.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">Gerade sucht niemand Mitspieler. Erstelle selbst eine offene Partie.</p>
          ) : (
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
              {openMatches.map((o) => (
                <li key={o.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{o.name}</p>
                    <p className="text-sm text-stone-500">von {o.host}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip>
                        {o.mode === 'live' ? <Radio className="size-3" /> : <Clock className="size-3" />}
                        {o.mode === 'live' ? 'Live' : 'Asynchron'} · {o.turnLimitLabel}
                      </Chip>
                      <Chip>
                        <MapIcon className="size-3" /> {o.mapSizeLabel}
                      </Chip>
                      <Chip>
                        <Trophy className="size-3" /> {o.victoryCondition}
                      </Chip>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex gap-1" aria-label={`${o.seatsTaken} von ${o.seatsTotal} Plätzen belegt`}>
                        {Array.from({ length: o.seatsTotal }, (_, i) => (
                          <span key={i} className={`h-3 w-4 rounded-sm ${i < o.seatsTaken ? 'bg-stone-700 dark:bg-stone-400' : 'border-2 border-dashed border-teal-500'}`} />
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        {o.availableFactionIds.length > 0 ? (
                          o.availableFactionIds.map((id) => {
                            const f = factionOf(id)
                            return f ? <FactionEmblem key={id} faction={f} className="size-5" /> : null
                          })
                        ) : (
                          <span className="text-[11px] text-stone-500">Alle Fraktionen vergeben · doppelte erlaubt</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJoinOpenMatch?.(o.id)}
                      className="ml-auto flex min-h-11 items-center gap-1.5 rounded-lg bg-teal-600 px-4 font-semibold text-white hover:bg-teal-500"
                    >
                      <Swords className="size-4" /> Beitreten
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'finished' &&
          (finishedMatches.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">Noch keine beendeten Partien.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {finishedMatches.map((fm) => {
                const stamp = RESULT_STAMP[fm.result]
                const f = factionOf(fm.factionId)
                return (
                  <li key={fm.id} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    {f && <FactionEmblem faction={f} className="size-10 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{fm.name}</p>
                      <p className="text-sm text-stone-500">
                        Platz {fm.placement} von {fm.playerCount} · {fm.rounds} Runden · {timeAgo(fm.endedAt, now)}
                      </p>
                      <p className="text-xs text-stone-500">
                        Sieger: <span className="font-semibold text-stone-700 dark:text-stone-300">{fm.winner}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rotate-[-6deg] rounded border-[3px] border-double px-2 py-1 font-['Big_Shoulders_Display'] text-sm font-black uppercase tracking-[0.2em] ${stamp.className}`}>
                      {stamp.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          ))}
      </section>

      {details && <MatchDetailsSheet match={details} factions={factions} onClose={() => setDetails(null)} />}
      {surrender && (
        <SurrenderSheet
          match={surrender}
          onClose={() => setSurrender(null)}
          onConfirm={() => {
            onSurrender?.(surrender.id)
            setSurrender(null)
          }}
        />
      )}
    </div>
  )
}
