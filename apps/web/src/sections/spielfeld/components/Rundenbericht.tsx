import { ClipboardList, Flag, Footprints, Play, SkipForward, Swords } from 'lucide-react'
import { EVENT_STYLE } from './EventLog'
import type { ReportEntry, ReportIcon, TurnReport } from './report'
import { useT } from '../../../i18n'

/** Which buttons the card offers: watch or skip the pending replay, continue the turn, or just close */
export type ReportFooter = 'watch' | 'continue' | 'close'

interface RundenberichtProps {
  report: TurnReport
  footer: ReportFooter
  onJump: (entry: ReportEntry) => void
  onWatchReplay: () => void
  onSkipReplay: () => void
  onClose: () => void
}

const REPLAY_STYLE: Record<'move' | 'attack' | 'capture', { icon: typeof Flag; className: string }> = {
  move: { icon: Footprints, className: 'text-stone-500 dark:text-stone-400' },
  attack: { icon: Swords, className: 'text-rose-600 dark:text-rose-400' },
  capture: { icon: Flag, className: 'text-rose-600 dark:text-rose-400' },
}

const styleOf = (icon: ReportIcon) =>
  icon === 'move' || icon === 'attack' || icon === 'capture' ? REPLAY_STYLE[icon] : EVENT_STYLE[icon]

const secondary =
  "flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 px-3 text-sm font-semibold hover:border-teal-500 dark:border-stone-600"
const primary =
  "flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md bg-amber-500 px-3 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-400"

export function Rundenbericht({ report, footer, onJump, onWatchReplay, onSkipReplay, onClose }: RundenberichtProps) {
  const t = useT()
  return (
    <section
      role="dialog"
      aria-labelledby="dos-report-title"
      className="flex max-h-[55vh] flex-col rounded-t-xl border border-stone-300 bg-white/95 shadow-2xl backdrop-blur md:max-h-[calc(100vh-14rem)] md:rounded-xl dark:border-stone-700 dark:bg-stone-900/95"
    >
      <header className="flex items-start gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <ClipboardList className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <h2 id="dos-report-title" className="font-['Big_Shoulders_Display'] text-xl font-black uppercase leading-tight tracking-wider">
            {t('board.reportTitle', { round: report.round })}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">{t('board.sinceLastTurn')}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {report.sections.map((section) => (
          <section key={section.id} aria-labelledby={`dos-report-${section.id}`} className="mb-2 last:mb-0">
            <h3
              id={`dos-report-${section.id}`}
              className="flex items-baseline gap-2 px-2 pb-1 pt-1 font-['Big_Shoulders_Display'] text-sm font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300"
            >
              {section.title}
              <span className="font-['IBM_Plex_Mono'] text-[11px] font-normal text-stone-500">{section.entries.length}</span>
            </h3>
            <ul>
              {section.entries.map((entry) => {
                const { icon: Icon, className } = styleOf(entry.icon)
                return (
                  <li key={entry.key}>
                    <button
                      type="button"
                      onClick={() => onJump(entry)}
                      className={`flex min-h-10 w-full items-start gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-teal-50 dark:hover:bg-teal-950/40 ${
                        entry.isNew ? '' : 'opacity-60'
                      }`}
                    >
                      <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
                      <span className="min-w-0 flex-1 leading-snug">
                        {entry.text}
                        {entry.detail && (
                          <span className="block text-xs text-stone-500 dark:text-stone-400">{entry.detail}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-['IBM_Plex_Mono'] text-[10px] text-stone-500">
                        {entry.coord.col},{entry.coord.row}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <footer className="flex gap-2 border-t border-stone-200 p-3 dark:border-stone-800">
        {footer === 'watch' && (
          <>
            <button type="button" onClick={onSkipReplay} className={secondary}>
              <SkipForward className="size-4" /> {t('board.replay.skip')}
            </button>
            <button type="button" onClick={onWatchReplay} className={primary}>
              <Play className="size-4" /> {t('board.watchReplay')}
            </button>
          </>
        )}
        {footer === 'continue' && (
          <button type="button" onClick={onClose} className={primary}>
            {t('board.continue')}
          </button>
        )}
        {footer === 'close' && (
          <button type="button" onClick={onClose} className={secondary}>
            {t('board.close')}
          </button>
        )}
      </footer>
    </section>
  )
}
