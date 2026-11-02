import { Flag, Home, Map as MapIcon, Trophy } from 'lucide-react'
import { type MatchOutcome, matchOutcome, participantScore } from '@dos/shared/game'
import { COMPENDIUM_FACTIONS } from '@dos/shared/compendium'
import type { Match, MatchResult, Participant } from '../types'
import { FactionEmblem } from '../../fraktionen/components'

interface PartieabschlussProps {
  match: Match
  participants: Participant[]
  result: MatchResult
  onViewMap: () => void
  onLeave: () => void
}

/** Stamp like the lobby's „Beendet“ tab */
export const OUTCOME_STYLE: Record<MatchOutcome, { label: string; stamp: string; icon: typeof Trophy; iconClass: string }> = {
  victory: {
    label: 'Sieg',
    stamp: 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300',
    icon: Trophy,
    iconClass: 'text-teal-600 dark:text-teal-400',
  },
  defeat: {
    label: 'Niederlage',
    stamp: 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400',
    icon: Flag,
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  surrendered: {
    label: 'Aufgegeben',
    stamp: 'border-stone-400 text-stone-500',
    icon: Flag,
    iconClass: 'text-stone-500 dark:text-stone-400',
  },
}

const secondary =
  "flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 px-3 text-sm font-semibold hover:border-teal-500 dark:border-stone-600"
const primary =
  "flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md bg-amber-500 px-3 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-400"

/** How the match was decided („beendet in Runde 93 durch …“); null for older matches */
const REASON_LABEL: Record<NonNullable<MatchResult['reason']>, string> = {
  elimination: 'Ausschaltung aller Gegner',
  capitals: 'Eroberung aller Hauptstädte',
  roundLimit: 'das Rundenlimit',
  dominance: 'Vorherrschaft',
  noHumans: 'Aufgabe aller Spieler',
}

/** Result card at the end of a match: outcome stamp and the ranking with the final counts */
export function Partieabschluss({ match, participants, result, onViewMap, onLeave }: PartieabschlussProps) {
  const outcome = matchOutcome({ match, participants, result }) ?? 'defeat'
  const style = OUTCOME_STYLE[outcome]
  const Icon = style.icon
  // Emblems and colors come from the compendium (the game's Faction type carries neither)
  const factionById = new Map(COMPENDIUM_FACTIONS.map((f) => [f.id, f]))
  const winner = participants.find((p) => p.id === result.winnerId)
  const ranking = [...participants].sort(
    (a, b) => (result.placements[a.id] ?? 99) - (result.placements[b.id] ?? 99) || participants.indexOf(a) - participants.indexOf(b),
  )

  return (
    <section
      role="dialog"
      aria-labelledby="dos-result-title"
      className="flex max-h-[70vh] flex-col rounded-t-xl border border-stone-300 bg-white/95 shadow-2xl backdrop-blur md:max-h-[calc(100vh-10rem)] md:rounded-xl dark:border-stone-700 dark:bg-stone-900/95"
    >
      <header className="flex items-start gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <Icon className={`mt-0.5 size-6 shrink-0 ${style.iconClass}`} />
        <div className="min-w-0 flex-1">
          <h2 id="dos-result-title" className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase leading-tight tracking-wider">
            {style.label}
          </h2>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
            {match.name} · beendet in Runde {match.round}
            {result.reason && ` durch ${REASON_LABEL[result.reason]}`}
            {winner ? ` · Sieger: ${winner.name}` : ' · Kein Sieger'}
          </p>
        </div>
        <span
          aria-hidden
          className={`shrink-0 rotate-[-6deg] rounded border-[3px] border-double px-2 py-1 font-['Big_Shoulders_Display'] text-sm font-black uppercase tracking-[0.2em] ${style.stamp}`}
        >
          {style.label}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-12 sm:w-16" />
            <col className="w-12 sm:w-20" />
            <col className="w-14 sm:w-16" />
          </colgroup>
          <thead>
            <tr className="font-['Big_Shoulders_Display'] text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
              <th scope="col" className="px-2 py-1 text-left font-bold">Platz</th>
              <th scope="col" className="px-2 py-1 text-left font-bold">Teilnehmer</th>
              <th scope="col" className="px-2 py-1 text-right font-bold">
                <span className="hidden sm:inline">Städte</span>
                <abbr title="Städte" className="no-underline sm:hidden">St.</abbr>
              </th>
              <th scope="col" className="px-2 py-1 text-right font-bold">
                <span className="hidden sm:inline">Einheiten</span>
                <abbr title="Einheiten" className="no-underline sm:hidden">Einh.</abbr>
              </th>
              <th scope="col" className="px-2 py-1 text-right font-bold">
                <span className="hidden sm:inline">Punkte</span>
                <abbr title="Punkte" className="no-underline sm:hidden">Pkt.</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((p) => {
              const faction = factionById.get(p.factionId)
              const out = p.status === 'eliminated'
              const isYou = p.id === match.youId
              return (
                <tr
                  key={p.id}
                  aria-current={isYou ? 'true' : undefined}
                  className={`border-t border-stone-100 dark:border-stone-800 ${isYou ? 'bg-amber-50 dark:bg-amber-950/30' : ''} ${out ? 'text-stone-400 dark:text-stone-500' : ''}`}
                >
                  <td className="px-2 py-1.5 font-['IBM_Plex_Mono'] text-base font-semibold">{result.placements[p.id] ?? '–'}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      {faction && <FactionEmblem faction={faction} className="size-6 shrink-0" />}
                      <span className="min-w-0 truncate font-semibold">
                        {p.name}
                        {isYou && <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">(du)</span>}
                        {out && <span className="ml-1 font-normal italic sm:hidden">({p.capitulated ? 'kapituliert' : 'ausgeschieden'})</span>}
                      </span>
                      {p.isAI && (
                        <span className="rounded bg-stone-200 px-1 font-['IBM_Plex_Mono'] text-[10px] uppercase text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                          KI
                        </span>
                      )}
                      {out && <span className="hidden truncate text-xs italic sm:inline">{p.capitulated ? 'kapituliert' : 'ausgeschieden'}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right font-['IBM_Plex_Mono']">{out ? '–' : p.cityCount}</td>
                  <td className="px-2 py-1.5 text-right font-['IBM_Plex_Mono']">{out ? '–' : p.unitCount}</td>
                  <td className="px-2 py-1.5 text-right font-['IBM_Plex_Mono'] font-semibold">{out ? '–' : participantScore(p)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="px-2 pt-2 text-xs text-stone-500 dark:text-stone-400">Punkte: 3 je Stadt, 1 je Einheit.</p>
      </div>

      <footer className="flex gap-2 border-t border-stone-200 p-3 dark:border-stone-800">
        <button type="button" onClick={onViewMap} className={secondary}>
          <MapIcon className="size-4" /> Karte ansehen
        </button>
        <button type="button" onClick={onLeave} className={primary}>
          <Home className="size-4" /> Zur Lobby
        </button>
      </footer>
    </section>
  )
}
